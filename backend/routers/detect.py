from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
import os
import re
import fitz  # PyMuPDF
import logging
import pytesseract
from PIL import Image
import io

router = APIRouter()

UPLOAD_DIR = "uploads"

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def extract_text_with_ocr(page):
    """
    Extract text from a PDF page using OCR if no text is found
    """
    try:
        # First try to extract text directly
        text = page.get_text()
        
        # If little or no text found, try OCR
        if not text or len(text.strip()) < 50:
            logger.info(f"Little text found ({len(text)} chars), attempting OCR...")
            
            # Get the page as an image
            mat = fitz.Matrix(2, 2)  # Zoom factor for better quality
            pix = page.get_pixmap(matrix=mat)
            
            # Convert to PIL Image
            img_data = pix.tobytes("ppm")
            img = Image.open(io.BytesIO(img_data))
            
            # Perform OCR
            ocr_text = pytesseract.image_to_string(img, lang='eng')
            
            if ocr_text and len(ocr_text.strip()) > 10:
                logger.info(f"OCR extracted {len(ocr_text)} characters")
                text += "\n" + ocr_text if text else ocr_text
        
        return text.strip()
        
    except Exception as e:
        logger.error(f"OCR extraction failed: {e}")
        return page.get_text()  # Fallback to regular text extraction

def extract_text_with_debug(file_path: str) -> dict:
    """
    Extract text with detailed debugging information including OCR
    """
    debug_info = {
        "file_path": file_path,
        "file_exists": os.path.exists(file_path),
        "text_content": "",
        "page_count": 0,
        "characters_per_page": [],
        "total_characters": 0,
        "ocr_used": False,
        "ocr_pages": [],
        "error": None
    }
    
    try:
        if not debug_info["file_exists"]:
            debug_info["error"] = "File does not exist"
            return debug_info
        
        doc = fitz.open(file_path)
        debug_info["page_count"] = len(doc)
        
        full_text = ""
        for page_num in range(len(doc)):
            try:
                page = doc[page_num]
                
                # Extract text with OCR fallback
                page_text = extract_text_with_ocr(page)
                char_count = len(page_text)
                
                # Check if OCR was used (heuristic: if original text was short but OCR found more)
                original_text = page.get_text()
                ocr_used = len(original_text.strip()) < 50 and char_count > len(original_text) + 20
                
                if ocr_used:
                    debug_info["ocr_used"] = True
                    debug_info["ocr_pages"].append(page_num + 1)
                
                debug_info["characters_per_page"].append({
                    "page": page_num + 1,
                    "characters": char_count,
                    "original_characters": len(original_text),
                    "ocr_used": ocr_used,
                    "preview": page_text[:100] + "..." if char_count > 100 else page_text
                })
                
                full_text += page_text + "\n"
                logger.info(f"Page {page_num + 1}: {char_count} characters (OCR: {ocr_used})")
                
            except Exception as page_error:
                logger.error(f"Error on page {page_num}: {page_error}")
                debug_info["characters_per_page"].append({
                    "page": page_num + 1,
                    "characters": 0,
                    "error": str(page_error)
                })
        
        doc.close()
        
        debug_info["text_content"] = full_text
        debug_info["total_characters"] = len(full_text)
        
        logger.info(f"Extraction complete: {debug_info['total_characters']} total characters, OCR used: {debug_info['ocr_used']}")
        
    except Exception as e:
        debug_info["error"] = str(e)
        logger.error(f"Extraction failed: {e}")
    
    return debug_info

def is_likely_bank_account(text: str, context: str = "") -> bool:
    """
    Determine if a numeric string is likely a bank account number
    """
    # Remove spaces and common separators
    clean_text = re.sub(r'[\s\-]', '', text)
    
    # Must be all digits and within typical bank account length
    if not clean_text.isdigit() or not (9 <= len(clean_text) <= 18):
        return False
    
    # Check for common bank account patterns
    bank_patterns = [
        r'.*account.*', r'.*a/c.*', r'.*acc.*', r'.*bank.*', 
        r'.*savings.*', r'.*current.*', r'.*account\s*no.*',
        r'.*account\s*number.*', r'.*a\/c\s*no.*', r'.*acc\s*no.*'
    ]
    
    # Check context for bank-related keywords
    context_lower = context.lower()
    for pattern in bank_patterns:
        if re.search(pattern, context_lower, re.IGNORECASE):
            return True
    
    # Check for common bank prefixes (Indian banks)
    bank_prefixes = ['0', '1', '2', '3', '4', '5', '6']  # Common starting digits
    if clean_text[0] in bank_prefixes:
        return True
    
    # Check if it's near other banking terms in the text
    banking_terms = ['ifsc', 'branch', 'bank', 'account', 'savings', 'current', 'overdraft']
    if any(term in context_lower for term in banking_terms):
        return True
    
    return False

def is_likely_phone_number(text: str) -> bool:
    """
    Determine if a numeric string is likely a phone number
    """
    clean_text = re.sub(r'[\-\s+]', '', text)
    
    # Indian phone numbers start with 6,7,8,9 and are 10 digits
    if len(clean_text) == 10 and clean_text.isdigit() and clean_text[0] in '6789':
        return True
    
    # With country code
    if len(clean_text) == 12 and clean_text.startswith('91') and clean_text[2] in '6789':
        return True
    
    return False

def is_likely_aadhaar(text: str) -> bool:
    """
    Determine if a numeric string is likely an Aadhaar number
    """
    clean_text = re.sub(r'\s', '', text)
    
    # Aadhaar is exactly 12 digits and doesn't start with 0 or 1
    if len(clean_text) == 12 and clean_text.isdigit() and not clean_text.startswith(('0', '1')):
        return True
    
    return False

def is_likely_pan(text: str) -> bool:
    """
    Determine if a string is likely a PAN number
    """
    # PAN format: 5 letters, 4 digits, 1 letter
    if len(text) == 10 and re.match(r'^[A-Z]{5}\d{4}[A-Z]$', text):
        return True
    
    return False

def is_likely_credit_card(text: str) -> bool:
    """
    Determine if a numeric string is likely a credit card
    """
    clean_text = re.sub(r'[\s\-]', '', text)
    
    # Credit cards are exactly 16 digits
    if len(clean_text) == 16 and clean_text.isdigit():
        # Check common credit card prefixes
        prefixes = ['4', '5', '6']  # Visa, Mastercard, Discover
        if clean_text[0] in prefixes:
            return True
    
    return False

def validate_and_categorize_matches(text: str, pattern_matches: list, pattern_type: str) -> list:
    """
    Validate matches and categorize them properly
    """
    valid_matches = []
    
    for match in pattern_matches:
        if isinstance(match, tuple):
            match = ''.join(match)
        
        clean_match = re.sub(r'[\s\-]', '', str(match))
        
        # Get context around the match (50 characters before and after)
        match_start = text.find(str(match))
        if match_start != -1:
            context_start = max(0, match_start - 50)
            context_end = min(len(text), match_start + len(str(match)) + 50)
            context = text[context_start:context_end]
        else:
            context = ""
        
        if pattern_type == "Aadhaar":
            if is_likely_aadhaar(match):
                valid_matches.append(match)
                
        elif pattern_type == "PAN":
            if is_likely_pan(match):
                valid_matches.append(match.upper())
                
        elif pattern_type == "Phone":
            if is_likely_phone_number(match):
                # Format phone numbers consistently
                clean_phone = re.sub(r'[\-\s+]', '', match)
                if clean_phone.startswith('91') and len(clean_phone) == 12:
                    clean_phone = clean_phone[2:]  # Remove country code
                valid_matches.append(clean_phone)
                
        elif pattern_type == "Bank_Account":
            if is_likely_bank_account(match, context):
                valid_matches.append(clean_match)
                
        elif pattern_type == "Credit_Debit_Card":
            if is_likely_credit_card(match):
                valid_matches.append(match)
                
        elif pattern_type == "Email":
            # Basic email validation
            if re.match(r'^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$', match):
                valid_matches.append(match.lower())
    
    return list(set(valid_matches))  # Remove duplicates

def detect_sensitive_data_debug(file_path: str) -> dict:
    """
    Detect sensitive data with comprehensive debugging and better categorization
    """
    result = {
        "debug_info": extract_text_with_debug(file_path),
        "detected_data": {},
        "patterns_checked": [],
        "status": "unknown"
    }
    
    try:
        # If extraction failed, return early
        if result["debug_info"]["error"]:
            result["status"] = "extraction_failed"
            return result
        
        text = result["debug_info"]["text_content"]
        
        if not text or len(text.strip()) < 10:
            result["status"] = "no_text_found"
            logger.warning("No substantial text found in PDF")
            return result
        
        detected_data = {}
        patterns = {
            "Aadhaar": r'\b\d{4}\s?\d{4}\s?\d{4}\b',
            "PAN": r'\b[A-Z]{5}\d{4}[A-Z]{1}\b',
            "Phone": r'(\+91[\-\s]?)?[6-9]\d{9}\b',
            "Email": r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
            "Bank_Account": r'\b\d{9,18}\b',
            "Credit_Debit_Card": r'\b\d{4}[\s\-]?\d{4}[\s\-]?\d{4}[\s\-]?\d{4}\b'
        }
        
        for data_type, pattern in patterns.items():
            try:
                matches = re.findall(pattern, text)
                
                # Use advanced validation and categorization
                valid_matches = validate_and_categorize_matches(text, matches, data_type)
                
                detected_data[data_type] = valid_matches
                
                result["patterns_checked"].append({
                    "type": data_type,
                    "pattern": pattern,
                    "raw_matches": len(matches),
                    "valid_matches": len(valid_matches),
                    "sample": valid_matches[:2] if valid_matches else None,
                    "validation_method": "context_aware"
                })
                
                logger.info(f"{data_type}: {len(valid_matches)} valid matches (from {len(matches)} raw)")
                
            except Exception as pattern_error:
                result["patterns_checked"].append({
                    "type": data_type,
                    "error": str(pattern_error)
                })
                logger.error(f"Pattern error for {data_type}: {pattern_error}")
        
        # Remove empty categories
        result["detected_data"] = {k: v for k, v in detected_data.items() if v}
        result["status"] = "success"
        
        total_items = sum(len(v) for v in result["detected_data"].values())
        logger.info(f"Detection completed: {total_items} total items found")
        
    except Exception as e:
        result["status"] = "detection_failed"
        result["error"] = str(e)
        logger.error(f"Detection failed: {e}")
    
    return result

@router.post("/{file_id}")
async def detect_data(file_id: str):
    """
    Detect sensitive data with detailed response
    """
    file_path = os.path.join(UPLOAD_DIR, f"{file_id}.pdf")
    
    logger.info(f"Detection request for file_id: {file_id}")
    logger.info(f"File path: {file_path}")
    
    if not os.path.exists(file_path):
        logger.error(f"File not found: {file_path}")
        raise HTTPException(status_code=404, detail="File not found")
    
    try:
        detection_result = detect_sensitive_data_debug(file_path)
        
        response_data = {
            "success": True,
            "file_id": file_id,
            "detected_data": detection_result["detected_data"],
            "debug_info": {
                "status": detection_result["status"],
                "page_count": detection_result["debug_info"]["page_count"],
                "total_characters": detection_result["debug_info"]["total_characters"],
                "ocr_used": detection_result["debug_info"]["ocr_used"],
                "ocr_pages": detection_result["debug_info"]["ocr_pages"],
                "patterns_checked": detection_result["patterns_checked"]
            },
            "message": f"Detection completed: {detection_result['status']}"
        }
        
        # Include full debug info if there was an error
        if detection_result["status"] != "success":
            response_data["debug_info"]["extraction_details"] = detection_result["debug_info"]
        
        logger.info(f"Detection response: {detection_result['status']}")
        return JSONResponse(response_data)
        
    except Exception as e:
        logger.error(f"Detection error for {file_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error detecting data: {str(e)}")

@router.get("/{file_id}")
async def detect_data_get(file_id: str):
    """
    GET endpoint for data detection (same as POST)
    """
    return await detect_data(file_id)

@router.post("/{file_id}/debug")
async def debug_detection(file_id: str):
    """
    Detailed debug endpoint with full information
    """
    file_path = os.path.join(UPLOAD_DIR, f"{file_id}.pdf")
    
    if not os.path.exists(file_path):
        return {
            "success": False,
            "error": "File not found",
            "file_path": file_path,
            "file_exists": False
        }
    
    detection_result = detect_sensitive_data_debug(file_path)
    
    return {
        "success": True,
        "file_id": file_id,
        "file_path": file_path,
        "file_size": os.path.getsize(file_path),
        "detection_result": detection_result
    }

# Health check endpoint
@router.get("/health/ocr")
async def check_ocr_health():
    """
    Check if OCR is working properly
    """
    try:
        # Test OCR with a simple check
        version = pytesseract.get_tesseract_version()
        return {
            "ocr_available": True,
            "tesseract_version": str(version),
            "status": "healthy"
        }
    except Exception as e:
        return {
            "ocr_available": False,
            "error": str(e),
            "status": "unavailable"
        }