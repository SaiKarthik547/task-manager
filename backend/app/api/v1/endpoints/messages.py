from fastapi.encoders import jsonable_encoder
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.api import deps
from app.models import Message, Conversation, User, conversation_participants
from app.schemas import message as message_schemas

router = APIRouter()

@router.get("/conversations")
def read_conversations(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    # Get conversations where user is a participant
    # SQLAlchemy relationship: current_user.conversations (if defined) or query association
    # We defined 'participants' in Conversation model.
    # Inverse relationship in User? "conversations = relationship(...)"
    # Let's query Conversation directly joined with participants
    
    conversations = db.query(Conversation).join(Conversation.participants).filter(User.id == current_user.id).offset(skip).limit(limit).all()
    
    # Enrich with last message
    # TODO: Optimize with subquery
    result = []
    for conv in conversations:
        last_msg = db.query(Message).filter(Message.conversation_id == conv.id).order_by(Message.created_at.desc()).first()
        
        # Get simplified object
        conv_dict = {
            "id": conv.id,
            "type": conv.type,
            "name": conv.name,
            "participants": [{"id": p.id, "full_name": p.full_name, "username": p.username} for p in conv.participants],
            "updated_at": last_msg.created_at if last_msg else conv.created_at,
            "last_message": last_msg.content_encrypted if last_msg else None,
            "last_message_at": last_msg.created_at if last_msg else None
        }
        result.append(conv_dict)
        
    return jsonable_encoder({"conversations": result})

@router.get("/{conversation_id}")
def read_messages(
    conversation_id: int,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    # Check participation
    conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
        
    is_participant = any(u.id == current_user.id for u in conversation.participants)
    if not is_participant:
         raise HTTPException(status_code=403, detail="Not a participant")

    messages = db.query(Message).filter(Message.conversation_id == conversation_id).order_by(Message.created_at.asc()).offset(skip).limit(limit).all()
    return jsonable_encoder({"messages": messages})

@router.post("/")
def create_conversation(
    msg_in: message_schemas.MessageCreate, # leveraging shared schema fields
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    recipient_id = msg_in.recipient_id
    if not recipient_id:
        raise HTTPException(status_code=400, detail="Recipient required")
    
    recipient = db.query(User).filter(User.id == recipient_id).first()
    if not recipient:
        raise HTTPException(status_code=404, detail="Recipient not found")
    # RBAC: Check if current_user is allowed to message recipient
    is_admin_or_manager = any(r.name in ["Admin", "Manager"] for r in current_user.roles)
    
    if not is_admin_or_manager:
        from app.models.project import project_members
        from app.models.auth import Role, user_roles
        
        # 1. Admins and Managers are always messageable
        admin_and_mgr_roles = db.query(Role.id).filter(Role.name.in_(["Admin", "Manager"])).all()
        role_ids = [r[0] for r in admin_and_mgr_roles]
        
        admin_mgr_user_ids = []
        if role_ids:
            admin_mgr_users = db.query(user_roles.c.user_id).filter(user_roles.c.role_id.in_(role_ids)).all()
            admin_mgr_user_ids = [u[0] for u in admin_mgr_users]
            
        # 2. Teammates (same manager)
        teammate_ids = []
        if current_user.manager_id:
            teammates = db.query(User.id).filter(User.manager_id == current_user.manager_id).all()
            teammate_ids = [t[0] for t in teammates]
            
        # 3. Project Co-Members
        project_ids_subq = db.query(project_members.c.project_id).filter(project_members.c.user_id == current_user.id).subquery()
        co_members = db.query(project_members.c.user_id).filter(project_members.c.project_id.in_(project_ids_subq)).all()
        co_member_ids = [m[0] for m in co_members]
        
        allowed_ids = set([current_user.id, current_user.manager_id] + admin_mgr_user_ids + teammate_ids + co_member_ids)
        allowed_ids.discard(None)
        
        if recipient_id not in allowed_ids:
            raise HTTPException(status_code=403, detail="You are not authorized to start a conversation with this user")

    # Check if direct conversation already exists
    
    # Create new
    conversation = Conversation(
        type='direct',
        created_by=current_user.id
    )
    db.add(conversation)
    db.commit()
    db.refresh(conversation)
    
    # Add participants
    conversation.participants.append(current_user)
    conversation.participants.append(recipient)
    db.commit()
    
    return {"conversationId": conversation.id, "message": "Conversation created"}
