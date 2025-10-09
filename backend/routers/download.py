from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
import os
import json

router = APIRouter()

UPLOAD_DIR = "uploads"
REDACTED_DIR = "redacted"

# Ensure directories exist
os.makedirs(REDACTED_DIR, exist_ok=True)

@router.get("/{file_id}")
async def download_redacted_file(file_id: str):
    """
    Download redacted PDF file
    """
    file_path = os.path.join(REDACTED_DIR, f"{file_id}_redacted.pdf")
    print(f"Looking for redacted file: {file_path}")
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Redacted file not found")
    
    return FileResponse(
        file_path,
        media_type='application/pdf',
        filename=f"redacted_document_{file_id}.pdf"
    )

@router.get("/{file_id}/report")
async def download_verification_report(file_id: str):
    """
    Download verification report
    """
    report_path = os.path.join(REDACTED_DIR, f"{file_id}_report.json")
    print(f"Looking for report file: {report_path}")
    
    if not os.path.exists(report_path):
        raise HTTPException(status_code=404, detail="Verification report not found")
    
    return FileResponse(
        report_path,
        media_type='application/json',
        filename=f"verification_report_{file_id}.json"
    )

@router.get("/{file_id}/info")
async def get_download_info(file_id: str):
    """
    Get download information including file sizes
    """
    pdf_path = os.path.join(REDACTED_DIR, f"{file_id}_redacted.pdf")
    report_path = os.path.join(REDACTED_DIR, f"{file_id}_report.json")
    
    print(f"Checking files: {pdf_path}, {report_path}")
    
    info = {
        "file_id": file_id,
        "pdf_available": os.path.exists(pdf_path),
        "report_available": os.path.exists(report_path),
    }
    
    if os.path.exists(pdf_path):
        info["pdf_size"] = os.path.getsize(pdf_path)
        info["pdf_size_mb"] = round(info["pdf_size"] / (1024 * 1024), 2)
    
    if os.path.exists(report_path):
        info["report_size"] = os.path.getsize(report_path)
        info["report_size_kb"] = round(info["report_size"] / 1024, 2)
    
    print(f"Download info: {info}")
    return info