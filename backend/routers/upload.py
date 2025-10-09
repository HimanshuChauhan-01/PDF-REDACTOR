from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
import os
import uuid

router = APIRouter()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/")
async def upload_pdf(file: UploadFile = File(...)):
    """
    Upload a PDF file and return a unique file_id
    """
    print(f"Received file: {file.filename}, content-type: {file.content_type}")  # Debug log
    
    # Validate file type
    if file.content_type != "application/pdf":
        raise HTTPException(
            status_code=400, 
            detail="Only PDF files are allowed. Received: {file.content_type}"
        )
    
    # Validate file size (10MB limit)
    file.file.seek(0, 2)  # Seek to end
    file_size = file.file.tell()
    file.file.seek(0)  # Reset to beginning
    
    if file_size > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size exceeds 10MB limit")
    
    # Generate unique file ID
    file_id = str(uuid.uuid4())
    file_path = os.path.join(UPLOAD_DIR, f"{file_id}.pdf")

    try:
        # Save the uploaded PDF
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)
        
        print(f"File saved successfully: {file_path}")  # Debug log
        
        # Return success response with file_id
        return JSONResponse({
            "success": True,
            "file_id": file_id,
            "filename": file.filename,
            "message": "File uploaded successfully"
        })
    except Exception as e:
        # Clean up file if there's an error
        if os.path.exists(file_path):
            os.remove(file_path)
        print(f"Error processing file: {str(e)}")  # Debug log
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")

@router.get("/test")
async def test_upload():
    """Test endpoint for upload router"""
    return {"message": "Upload router is working!"}