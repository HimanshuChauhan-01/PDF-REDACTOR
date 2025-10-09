from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import routers
from routers import upload, detect, redact, download, verify

# Create FastAPI app
app = FastAPI(
    title="PDF Redaction API",
    description="Backend for PDF-Redaction Roulette",
    version="1.0.0"
)

# Add CORS middleware - THIS IS CRITICAL
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite default port
        "http://localhost:3000",  # Create React App default port
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Include routers
app.include_router(upload.router, prefix="/upload", tags=["Upload"])
app.include_router(detect.router, prefix="/data", tags=["Detect"])
app.include_router(redact.router, prefix="/redact", tags=["Redact"])
app.include_router(download.router, prefix="/download", tags=["Download"])
app.include_router(verify.router, prefix="/verify", tags=["Verify"])

# Health check endpoint
@app.get("/health")
def health_check():
    return {"status": "ok"}

# Test endpoint to verify CORS
@app.get("/test-cors")
def test_cors():
    return {"message": "CORS is working!"}