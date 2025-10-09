import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import Loader from "../components/Loader";

function UploadPage() {
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setDetectedData, setFileId } = useContext(AppContext);

  const handleUpload = async () => {
  if (!file) return alert("Please select a PDF file!");
  setLoading(true);

  const formData = new FormData();
  formData.append("file", file);

  try {
    // Use import.meta.env for Vite instead of process.env
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
    
    console.log("API Base URL:", API_BASE_URL); // Debug log

    // Step 1: Upload file to backend
    const uploadResponse = await fetch(`${API_BASE_URL}/upload/`, {
      method: "POST",
      body: formData,
    });

    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.json();
      throw new Error(errorData.detail || "Upload failed");
    }

    const uploadData = await uploadResponse.json();
    
    if (uploadData.success) {
      // Step 2: Detect data in the uploaded file
      const detectResponse = await fetch(`${API_BASE_URL}/data/${uploadData.file_id}`, {
        method: "POST",
      });

      if (!detectResponse.ok) {
        const errorData = await detectResponse.json();
        throw new Error(errorData.detail || "Detection failed");
      }

      const detectData = await detectResponse.json();
      
      if (detectData.success) {
        setFileId(detectData.file_id);
        setDetectedData(detectData.detected_data);
        navigate("/preview");
      } else {
        throw new Error("Data detection failed");
      }
    } else {
      throw new Error("Upload failed");
    }
  } catch (error) {
    console.error("Upload error:", error);
    alert(`Upload failed: ${error.message}`);
  } finally {
    setLoading(false);
  }
};

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === "application/pdf") {
      setFile(droppedFile);
    } else {
      alert("Please upload a valid PDF file");
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const removeFile = () => {
    setFile(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-6">
      <div className="max-w-lg w-full">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-lg">
            <svg 
              className="w-8 h-8 text-white" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Document Intelligence</h1>
          <p className="text-gray-600 text-lg">Upload PDF documents to extract sensitive information automatically</p>
        </div>

        {/* Upload Area */}
        <div 
          className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 backdrop-blur-sm ${
            isDragging 
              ? "border-blue-500 bg-blue-50/80 scale-[1.02] shadow-lg" 
              : "border-gray-300 bg-white/80 hover:border-blue-400 hover:bg-blue-50/60"
          } ${file ? "border-emerald-500 bg-emerald-50/80" : ""}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {/* Upload Icon */}
          <div className="mb-6">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
              <svg 
                className="w-10 h-10 text-white" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" 
                />
              </svg>
            </div>
          </div>

          {/* Upload Text */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              {file ? "Document Ready for Analysis" : "Upload Document"}
            </h3>
            <p className="text-gray-600 mb-2">
              {file ? file.name : "Drag & drop your PDF file or click to browse"}
            </p>
            <p className="text-gray-500 text-sm">
              Maximum file size: 10MB • PDF format only
            </p>
          </div>

          {/* File Input */}
          <input
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />

          {/* File Info */}
          {file && (
            <div className="mt-6 p-4 bg-white rounded-lg border border-emerald-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900 text-sm">{file.name}</p>
                    <p className="text-gray-500 text-xs">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  onClick={removeFile}
                  className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Action Button */}
        <button
          onClick={handleUpload}
          disabled={!file || loading}
          className={`w-full mt-8 py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-300 ${
            !file || loading
              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
              : "bg-gradient-to-r from-blue-600 to-indigo-700 text-white hover:from-blue-700 hover:to-indigo-800 transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
          }`}
        >
          {loading ? (
            <div className="flex items-center justify-center space-x-3">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Analyzing Document...</span>
            </div>
          ) : (
            "Analyze Document"
          )}
        </button>

        {/* Features Grid */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-white rounded-lg shadow-sm border border-gray-100">
            <div className="w-12 h-12 mx-auto mb-3 bg-blue-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
              </svg>
            </div>
            <h4 className="font-semibold text-gray-900 text-sm mb-2">Aadhaar Detection</h4>
            <p className="text-gray-600 text-xs">Extract 12-digit numbers with precision</p>
          </div>

          <div className="text-center p-4 bg-white rounded-lg shadow-sm border border-gray-100">
            <div className="w-12 h-12 mx-auto mb-3 bg-green-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h4 className="font-semibold text-gray-900 text-sm mb-2">PAN Extraction</h4>
            <p className="text-gray-600 text-xs">Identify permanent account numbers</p>
          </div>

          <div className="text-center p-4 bg-white rounded-lg shadow-sm border border-gray-100">
            <div className="w-12 h-12 mx-auto mb-3 bg-purple-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <h4 className="font-semibold text-gray-900 text-sm mb-2">Phone Numbers</h4>
            <p className="text-gray-600 text-xs">Detect contact information</p>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-8 text-center">
          <p className="text-gray-500 text-sm flex items-center justify-center">
            <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Your documents are processed securely and never stored
          </p>
        </div>
      </div>
    </div>
  );
}

export default UploadPage;