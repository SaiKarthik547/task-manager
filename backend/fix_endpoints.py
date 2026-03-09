import glob

replacements = [
    ('return {"users": users}', 'return jsonable_encoder({"users": users})'),
    ('return {"user": user}', 'return jsonable_encoder({"user": user})'),
    ('return {"roles": roles}', 'return jsonable_encoder({"roles": roles})'),
    ('return {"permissions": permissions}', 'return jsonable_encoder({"permissions": permissions})'),
    ('return {"permissions": role.permissions}', 'return jsonable_encoder({"permissions": role.permissions})'),
    ('return {"projects": projects}', 'return jsonable_encoder({"projects": projects})'),
    ('return {"project": project, "message": "Project updated"}', 'return jsonable_encoder({"project": project, "message": "Project updated"})'),
    ('return {"project": project, "message": "Project created"}', 'return jsonable_encoder({"project": project, "message": "Project created"})'),
    ('return {"project": project}', 'return jsonable_encoder({"project": project})'),
    ('return {"tasks": tasks}', 'return jsonable_encoder({"tasks": tasks})'),
    ('return {"task": task}', 'return jsonable_encoder({"task": task})'),
    ('return {"task": task, "message": "Task created"}', 'return jsonable_encoder({"task": task, "message": "Task created"})'),
    ('return {"task": task, "message": "Task updated"}', 'return jsonable_encoder({"task": task, "message": "Task updated"})'),
    ('return {"tasks": project.tasks}', 'return jsonable_encoder({"tasks": project.tasks})'),
    ('return {"conversations": result}', 'return jsonable_encoder({"conversations": result})'),
    ('return {"messages": messages}', 'return jsonable_encoder({"messages": messages})'),
    ('return {"notifications": notifications}', 'return jsonable_encoder({"notifications": notifications})')
]

for f in glob.glob('app/api/v1/endpoints/*.py'):
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    if 'from fastapi.encoders import jsonable_encoder' not in content:
        content = content.replace('from fastapi import APIRouter', 'from fastapi import APIRouter\nfrom fastapi.encoders import jsonable_encoder')
    
    for old, new in replacements:
        content = content.replace(old, new)
        
    with open(f, 'w', encoding='utf-8') as file:
        file.write(content)
