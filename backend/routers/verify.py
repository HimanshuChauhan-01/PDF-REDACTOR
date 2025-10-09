from fastapi import APIRouter, HTTPException
import os
import json

router = APIRouter()

REDACTED_DIR = "redacted"

@router.get("/{file_id}")
async def get_verification_status(file_id: str):
    """
    Get verification status for a redacted file
    """
    report_path = os.path.join(REDACTED_DIR, f"{file_id}_report.json")
    pdf_path = os.path.join(REDACTED_DIR, f"{file_id}_redacted.pdf")
    
    if not os.path.exists(report_path):
        raise HTTPException(status_code=404, detail="Verification report not found")
    
    try:
        with open(report_path, 'r') as f:
            report = json.load(f)
        
        # Add file status information
        report["file_status"] = {
            "redacted_pdf_exists": os.path.exists(pdf_path),
            "report_exists": True,
            "redacted_pdf_size": os.path.getsize(pdf_path) if os.path.exists(pdf_path) else 0
        }
        
        return report
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading verification report: {str(e)}")