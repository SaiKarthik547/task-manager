import socketio
from jose import jwt, JWTError
from app.core import config
from app.core.database import SessionLocal
from app.models import User, Message, Conversation, conversation_participants
from datetime import datetime

# Create Socket.IO server
# cors_allowed_origins='*' or specific? strict mode is better but for now '*'
sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')

@sio.event
async def connect(sid, environ, auth):
    print(f"Socket connecting: {sid}")
    token = auth.get("token") if auth else None

    if not token:
        print(f"Socket connection rejected: No token for {sid}")
        return False  # Reject connection

    try:
        # Strict JWT validation
        payload = jwt.decode(
            token,
            config.settings.SECRET_KEY,
            algorithms=["HS256"]
        )
        user_id = payload.get("userId")

        if not user_id:
            print(f"Socket connection rejected: No userId in token for {sid}")
            return False

        # Verify user exists in DB
        db = SessionLocal()
        user = db.query(User).filter(User.id == user_id).first()
        db.close()

        if not user:
            print(f"Socket connection rejected: User {user_id} not found")
            return False

        # Save session
        await sio.save_session(sid, {"user_id": user_id})

        # Join personal room
        await sio.enter_room(sid, f"user_{user_id}")
        print(f"Socket connected: {sid} (User {user_id})")

        # Broadcast presence
        await sio.emit("user_online", {"userId": user_id})

    except JWTError:
        print(f"Socket connection rejected: Invalid token for {sid}")
        return False

@sio.event
async def disconnect(sid):
    print(f"Socket disconnected: {sid}")
    session = await sio.get_session(sid)
    if session:
        user_id = session.get("user_id")
        if user_id:
            await sio.emit("user_offline", {"userId": user_id})

@sio.event
async def join_conversation(sid, data):
    conversation_id = data.get('conversationId')
    if conversation_id:
        # Verify access?
        # session = await sio.get_session(sid)
        # user_id = session.get('user_id')
        # Check DB if user is participant... 
        
        await sio.enter_room(sid, str(conversation_id))
        # print(f"Joined conversation {conversation_id}")

@sio.event
async def send_message(sid, data):
    session = await sio.get_session(sid)
    user_id = session.get('user_id')
    
    if not user_id:
        return # Not authenticated
        
    conversation_id = data.get('conversationId')
    content = data.get('content')
    is_private = data.get('isPrivate', False)
    
    if not conversation_id or not content:
        return
        
    # Save to DB
    db = SessionLocal()
    try:
        # Check participation (optional but good)
        
        message = Message(
            conversation_id=conversation_id,
            sender_id=user_id,
            content_encrypted=content, # Mock encryption
            is_private=1 if is_private else 0,
            created_at=datetime.utcnow()
        )
        db.add(message)
        db.commit()
        db.refresh(message)
        
        # Get sender info for frontend display
        sender = db.query(User).filter(User.id == user_id).first()
        
        msg_data = {
            "id": message.id,
            "conversationId": message.conversation_id, # Match frontend expectation
            "conversation_id": message.conversation_id,
            "sender_id": message.sender_id,
            "content_encrypted": message.content_encrypted,
            "created_at": message.created_at.isoformat(),
            "is_private": message.is_private,
            "sender": {
                "id": sender.id,
                "username": sender.username,
                "full_name": sender.full_name
            }
        }
        
        # Emit to room
        await sio.emit('new_message', msg_data, room=str(conversation_id))
        
    except Exception as e:
        print(f"Error saving message: {e}")
    finally:
        db.close()
