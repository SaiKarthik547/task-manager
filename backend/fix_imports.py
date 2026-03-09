import glob
import re

for f in glob.glob('app/api/v1/endpoints/*.py'):
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # Fix the broken import line
    # The broken line looks like:
    # from fastapi import APIRouter
    # from fastapi.encoders import jsonable_encoder, Depends, HTTPException, status
    # We want:
    # from fastapi import APIRouter, Depends, HTTPException, status
    # from fastapi.encoders import jsonable_encoder
    
    if "from fastapi.encoders import jsonable_encoder," in content:
        content = content.replace(
            "from fastapi import APIRouter\nfrom fastapi.encoders import jsonable_encoder, ",
            "from fastapi import APIRouter, "
        )
        content = "from fastapi.encoders import jsonable_encoder\n" + content
        
    with open(f, 'w', encoding='utf-8') as file:
        file.write(content)
