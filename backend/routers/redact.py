from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import os
import fitz  # PyMuPDF
from datetime import datetime
import json

router = APIRouter()

UPLOAD_DIR = "uploads"
REDACTED_DIR = "redacted"

# Ensure directories exist
os.makedirs(REDACTED_DIR, exist_ok=True)

class RedactionRequest(BaseModel):
    items_to_redact: dict

@router.post("/{file_id}")
async def redact_data(file_id: str, request: RedactionRequest):
    """
    Redact selected sensitive data from PDF
    """
    file_path = os.path.join(UPLOAD_DIR, f"{file_id}.pdf")
    output_path = os.path.join(REDACTED_DIR, f"{file_id}_redacted.pdf")
    
    print(f"Redacting file: {file_path}")
    print(f"Output path: {output_path}")
    print(f"Items to redact: {request.items_to_redact}")
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    
    try:
        # Perform actual redaction
        redaction_result = perform_redaction(file_path, output_path, request.items_to_redact)
        
        # Generate verification report
        verification_data = generate_verification_report(request.items_to_redact, file_id)
        
        # Save verification report
        save_verification_report(verification_data)
        
        return {
            "success": True,
            "file_id": file_id,
            "download_url": f"/download/{file_id}",
            "verification_url": f"/download/{file_id}/report",
            "redacted_count": redaction_result["redacted_count"],
            "verification_report": verification_data
        }
    except Exception as e:
        print(f"Redaction error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Redaction failed: {str(e)}")

def perform_redaction(input_path: str, output_path: str, items_to_redact: dict):
    """
    Perform actual PDF redaction using PyMuPDF
    """
    try:
        doc = fitz.open(input_path)
        redacted_count = 0
        
        for page_num in range(len(doc)):
            page = doc[page_num]
            
            for data_type, items in items_to_redact.items():
                for item in items:
                    # Search for the text and redact it
                    text_instances = page.search_for(item)
                    
                    for inst in text_instances:
                        # Add redaction annotation
                        redact_annot = page.add_redact_annot(inst, fill=(0, 0, 0))
                        redact_annot.update()
                        redacted_count += 1
            
            # Apply redactions
            page.apply_redactions()
        
        doc.save(output_path)
        doc.close()
        
        print(f"Redaction completed: {redacted_count} items redacted")
        return {
            "redacted_count": redacted_count,
            "output_path": output_path
        }
        
    except Exception as e:
        raise Exception(f"PDF redaction error: {str(e)}")

def generate_verification_report(items_to_redact: dict, file_id: str):
    """
    Generate verification report for redacted items
    """
    return {
        "file_id": file_id,
        "redaction_timestamp": datetime.utcnow().isoformat(),
        "redacted_items": items_to_redact,
        "summary": {
            "total_redacted": sum(len(items) for items in items_to_redact.values()),
            "by_type": {k: len(v) for k, v in items_to_redact.items()}
        }
    }

def save_verification_report(verification_data: dict):
    """Save verification report to JSON file"""
    file_id = verification_data["file_id"]
    report_path = os.path.join(REDACTED_DIR, f"{file_id}_report.json")
    
    with open(report_path, 'w') as f:
        json.dump(verification_data, f, indent=2)
    
    print(f"Verification report saved: {report_path}")
    return report_path