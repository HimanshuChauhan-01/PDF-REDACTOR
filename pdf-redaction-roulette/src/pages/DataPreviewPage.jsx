import { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../context/AppContext";

function DataPreviewPage() {
  const { detectedData, fileId, setDetectedData } = useContext(AppContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dataFetched, setDataFetched] = useState(false);

  // If no detected data but we have a fileId, try to fetch data
  useEffect(() => {
    if ((!detectedData || Object.keys(detectedData).length === 0) && fileId && !dataFetched) {
      fetchDetectedData();
    }
  }, [fileId, detectedData, dataFetched]);

  const fetchDetectedData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log("Fetching data for fileId:", fileId);
      
      // Try POST first, then GET if that fails
      let response = await fetch(`http://localhost:8000/data/${fileId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      // If POST fails with 405 (Method Not Allowed), try GET
      if (response.status === 405) {
        console.log("POST not allowed, trying GET...");
        response = await fetch(`http://localhost:8000/data/${fileId}`, {
          method: "GET",
        });
      }

      console.log("Response status:", response.status);
      
      if (!response.ok) {
        // Try to get error message from response
        let errorMessage = `Server error: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorData.message || errorMessage;
        } catch (e) {
          // If response is not JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log("Detection response:", data);
      
      if (data.success && data.detected_data) {
        // Check if detected_data is not empty
        if (Object.keys(data.detected_data).length > 0) {
          setDetectedData(data.detected_data);
        } else {
          throw new Error("No sensitive data found in the document");
        }
      } else {
        throw new Error(data.message || "No data detected in document");
      }
    } catch (err) {
      console.error("Error fetching detected data:", err);
      setError(err.message);
    } finally {
      setLoading(false);
      setDataFetched(true);
    }
  };

  const getTypeIcon = (type) => {
    const icons = {
      Aadhaar: "🆔",
      PAN: "📋",
      Phone: "📱",
      Email: "✉️",
      Bank_Account: "🏦",
      Credit_Debit_Card: "💳"
    };
    return icons[type] || "📄";
  };

  const getTypeColor = (type) => {
    const colors = {
      Aadhaar: "from-orange-500 to-amber-500",
      PAN: "from-blue-500 to-cyan-500",
      Phone: "from-green-500 to-emerald-500",
      Email: "from-purple-500 to-pink-500",
      Bank_Account: "from-red-500 to-rose-500",
      Credit_Debit_Card: "from-indigo-500 to-blue-500"
    };
    return colors[type] || "from-gray-500 to-gray-600";
  };

  const getTotalItems = () => {
    if (!detectedData) return 0;
    return Object.values(detectedData).reduce((total, values) => total + values.length, 0);
  };

  const handleRetry = () => {
    setDataFetched(false);
    setError(null);
    fetchDetectedData();
  };

  const handleNewUpload = () => {
    setDetectedData({});
    setDataFetched(false);
    navigate("/");
  };

  const handleContinue = () => {
    navigate("/select");
  };

  // Debug info in console
  useEffect(() => {
    console.log("Current detectedData:", detectedData);
    console.log("Current fileId:", fileId);
    console.log("Data fetched status:", dataFetched);
  }, [detectedData, fileId, dataFetched]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h3 className="text-xl font-semibold text-gray-800">Analyzing Document</h3>
          <p className="text-gray-600 mt-2">Scanning for sensitive information...</p>
          <p className="text-sm text-gray-500 mt-4">File ID: {fileId}</p>
        </div>
      </div>
    );
  }

  // Error state - includes "no data found" errors
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-100 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center border border-gray-200">
          <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl text-red-600">⚠️</span>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            {error.includes("No sensitive data found") ? "No Data Found" : "Detection Failed"}
          </h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-yellow-800">
              <strong>File ID:</strong> {fileId}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {error.includes("No sensitive data found") ? (
              <button
                onClick={handleNewUpload}
                className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Upload Different Document
              </button>
            ) : (
              <>
                <button
                  onClick={handleRetry}
                  className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Try Again
                </button>
                <button
                  onClick={handleNewUpload}
                  className="border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Upload New Document
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // No file uploaded state
  if (!fileId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-100 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center border border-gray-200">
          <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl">📄</span>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No Document Processed</h3>
          <p className="text-gray-600 mb-4">
            Please upload a document first to detect sensitive information.
          </p>
          <button
            onClick={handleNewUpload}
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Upload Document
          </button>
        </div>
      </div>
    );
  }

  // Data fetched but no data found state
  if (dataFetched && (!detectedData || Object.keys(detectedData).length === 0)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-100 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center border border-gray-200">
          <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl text-blue-600">🔍</span>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No Sensitive Data Found</h3>
          <p className="text-gray-600 mb-4">
            We scanned your document but didn't find any sensitive information matching our patterns.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-blue-800">
              <strong>File ID:</strong> {fileId}
            </p>
          </div>
          <button
            onClick={handleNewUpload}
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Upload Different Document
          </button>
        </div>
      </div>
    );
  }

  // Main content - data is available
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <span className="text-2xl text-white">🔍</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-3">Data Detection Results</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            We've scanned your document and identified the following sensitive information.
          </p>
          <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3 inline-block">
            <p className="text-sm text-green-800">
              <strong>File ID:</strong> {fileId}
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 text-center">
            <div className="text-2xl font-bold text-indigo-600 mb-2">{Object.keys(detectedData).length}</div>
            <div className="text-sm text-gray-600">Data Types Found</div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 text-center">
            <div className="text-2xl font-bold text-green-600 mb-2">{getTotalItems()}</div>
            <div className="text-sm text-gray-600">Total Items Detected</div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 text-center">
            <button
              onClick={handleContinue}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-colors"
            >
              Continue
            </button>
          </div>
        </div>

        {/* Data Preview Cards */}
        <div className="space-y-6">
          {Object.entries(detectedData).map(([type, values]) => (
            <div key={type} className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              {/* Card Header */}
              <div className={`bg-gradient-to-r ${getTypeColor(type)} px-6 py-4`}>
                <div className="flex items-center space-x-3">
                  <span className="text-2xl text-white">{getTypeIcon(type)}</span>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{type.replace('_', ' ')}</h3>
                    <p className="text-white text-opacity-90 text-sm">
                      {values.length} item{values.length !== 1 ? 's' : ''} detected
                    </p>
                  </div>
                </div>
              </div>

              {/* Data Items */}
              <div className="p-6">
                <div className="grid gap-3">
                  {values.map((value, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors"
                    >
                      <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-sm font-semibold text-gray-600 border">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-800 text-sm font-mono">{value}</p>
                        <p className="text-xs text-gray-500 mt-1">{type.replace('_', ' ')} • High confidence</p>
                      </div>
                      <div className="w-3 h-3 bg-green-500 rounded-full" title="High confidence"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
          <button
            onClick={handleNewUpload}
            className="px-8 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all duration-300"
          >
            Upload New Document
          </button>
          <button
            onClick={handleContinue}
            className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transform hover:scale-105 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            Continue to Selection
            <span className="ml-2">→</span>
          </button>
        </div>

        {/* Help Text */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500 max-w-2xl mx-auto">
            💡 <strong>Tip:</strong> Review all detected data carefully. In the next step, 
            you'll be able to select exactly which information you want to redact from your document.
          </p>
        </div>
      </div>
    </div>
  );
}

export default DataPreviewPage;