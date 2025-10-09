import { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../context/AppContext";

function SelectionPage() {
  const { 
    detectedData, 
    setSelectedItems, 
    setDownloadUrl, 
    setVerificationUrl,
    fileId,
    setLoading,
    setRedactionResult
  } = useContext(AppContext);
  const [checked, setChecked] = useState({});
  const [isRedacting, setIsRedacting] = useState(false);
  const navigate = useNavigate();

  // Auto-select all sensitive data by default for safety
  useEffect(() => {
    if (detectedData && Object.keys(detectedData).length > 0) {
      const autoChecked = {};
      Object.keys(detectedData).forEach(type => {
        autoChecked[type] = [...(detectedData[type] || [])];
      });
      setChecked(autoChecked);
    }
  }, [detectedData]);

  const handleToggle = (type, value) => {
    setChecked((prev) => {
      const prevType = prev[type] || [];
      if (prevType.includes(value)) {
        return { ...prev, [type]: prevType.filter((v) => v !== value) };
      } else {
        return { ...prev, [type]: [...prevType, value] };
      }
    });
  };

  const handleSelectAll = (type) => {
    setChecked((prev) => ({
      ...prev,
      [type]: detectedData[type] || []
    }));
  };

  const handleDeselectAll = (type) => {
    setChecked((prev) => ({
      ...prev,
      [type]: []
    }));
  };

  const handleRedact = async () => {
  if (getSelectedCount() === 0) return;

  setIsRedacting(true);
  setLoading(true);

  try {
    // Call backend to redact selected items - REMOVE /api prefix
    const response = await fetch(`http://localhost:8000/redact/${fileId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items_to_redact: checked
      }),
    });

    console.log("Response status:", response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error response:", errorText);
      throw new Error(`Redaction failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log("Redaction result:", result);
    
    // Set results in context
    setSelectedItems(checked);
    setDownloadUrl(result.download_url);
    setVerificationUrl(result.verification_url);
    setRedactionResult(result);
    
    navigate("/result");
  } catch (error) {
    console.error("Redaction error:", error);
    alert(`Redaction failed: ${error.message}`);
  } finally {
    setIsRedacting(false);
    setLoading(false);
  }
};

  const getSelectedCount = () => {
    return Object.values(checked).flat().length;
  };

  const getTotalCount = () => {
    return Object.values(detectedData || {}).flat().length;
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
      Aadhaar: "from-red-50 to-red-100",
      PAN: "from-blue-50 to-blue-100",
      Phone: "from-green-50 to-green-100",
      Email: "from-purple-50 to-purple-100",
      Bank_Account: "from-emerald-50 to-emerald-100",
      Credit_Debit_Card: "from-orange-50 to-orange-100"
    };
    return colors[type] || "from-gray-50 to-gray-100";
  };

  // Format sensitive data for display (mask parts of it)
  const formatSensitiveValue = (type, value) => {
    switch (type) {
      case "Aadhaar":
        return value.replace(/(\d{4})\s?(\d{4})\s?(\d{4})/, "$1 **** ****");
      case "PAN":
        return value.replace(/([A-Z]{4})([A-Z]{1})(\d{4})([A-Z]{1})/, "$1$2****$4");
      case "Phone":
        return value.replace(/(\+\d{1,3}[\-\s]?)?(\d{3,4})(\d{3})(\d{4})/, "$1$2 *** $4");
      case "Credit_Debit_Card":
        return value.replace(/(\d{4})[\s\-]?(\d{4})[\s\-]?(\d{4})[\s\-]?(\d{4})/, "$1 **** **** $4");
      case "Bank_Account":
        return value.length > 4 ? `${value.slice(0, 4)}${'*'.repeat(value.length - 4)}` : value;
      default:
        return value;
    }
  };

  if (!detectedData || Object.keys(detectedData).length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🔍</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">No Data Detected</h2>
          <p className="text-gray-600">No sensitive data was found in your document.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4 pb-24">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-3">Review Sensitive Data</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            We've detected sensitive information in your document. Select the data you want to redact.
            <strong className="text-red-600 block mt-1"> All items are selected by default for your safety.</strong>
          </p>
        </div>

        {/* Selection Summary Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <div className="flex items-center space-x-4 mb-4 sm:mb-0">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                getSelectedCount() === getTotalCount() ? "bg-green-100" : "bg-yellow-100"
              }`}>
                <span className="text-lg">
                  {getSelectedCount() === getTotalCount() ? "✅" : "⚠️"}
                </span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Security Check</h3>
                <p className="text-sm text-gray-600">
                  {getSelectedCount()} of {getTotalCount()} sensitive items selected for redaction
                </p>
                {getSelectedCount() < getTotalCount() && (
                  <p className="text-sm text-yellow-600 font-medium mt-1">
                    Warning: Some sensitive data may remain visible
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={handleRedact}
              disabled={getSelectedCount() === 0 || isRedacting}
              className={`px-8 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center space-x-2 ${
                getSelectedCount() === 0 || isRedacting
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-red-600 to-orange-600 text-white hover:from-red-700 hover:to-orange-700 transform hover:scale-105 shadow-lg hover:shadow-xl"
              }`}
            >
              {isRedacting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Redacting...</span>
                </>
              ) : (
                <span>Redact Selected Data</span>
              )}
            </button>
          </div>
        </div>

        {/* Data Selection Cards */}
        <div className="grid gap-6">
          {Object.entries(detectedData).map(([type, values]) => (
            <div key={type} className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              {/* Card Header */}
              <div className={`bg-gradient-to-r ${getTypeColor(type)} px-6 py-4 border-b border-gray-200`}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center space-x-3 mb-3 sm:mb-0">
                    <span className="text-2xl">{getTypeIcon(type)}</span>
                    <div>
                      <h3 className="font-semibold text-gray-800 text-lg">{type.replace('_', ' ')}</h3>
                      <p className="text-sm text-gray-600">
                        {values.length} sensitive item{values.length !== 1 ? 's' : ''} detected
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleSelectAll(type)}
                      className="px-4 py-2 text-sm bg-white text-indigo-700 rounded-lg hover:bg-indigo-50 transition-colors border border-indigo-200"
                    >
                      Select All
                    </button>
                    <button
                      onClick={() => handleDeselectAll(type)}
                      className="px-4 py-2 text-sm bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>
              </div>

              {/* Data Items */}
              <div className="p-6">
                <div className="grid gap-3">
                  {values.map((value, index) => (
                    <div
                      key={`${type}-${value}-${index}`}
                      className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-200 ${
                        checked[type]?.includes(value)
                          ? "bg-red-50 border-red-200 shadow-sm"
                          : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                      }`}
                    >
                      <div className="flex items-center space-x-4 flex-1">
                        <div className={`w-3 h-3 rounded-full ${
                          checked[type]?.includes(value) ? "bg-red-500" : "bg-gray-300"
                        }`}></div>
                        <div className="flex-1">
                          <span className="font-mono text-gray-800">
                            {formatSensitiveValue(type, value)}
                          </span>
                          <p className="text-sm text-gray-500 mt-1">
                            {type.replace('_', ' ')} • Instance {index + 1}
                          </p>
                        </div>
                      </div>
                      <label className="inline-flex items-center cursor-pointer">
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={checked[type]?.includes(value) || false}
                            onChange={() => handleToggle(type, value)}
                            className="sr-only"
                          />
                          <div className={`w-12 h-6 rounded-full transition-colors ${
                            checked[type]?.includes(value) ? "bg-red-500" : "bg-gray-300"
                          }`}></div>
                          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                            checked[type]?.includes(value) ? "transform translate-x-7" : "translate-x-1"
                          }`}></div>
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Action Bar */}
        {getTotalCount() > 0 && (
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white rounded-2xl shadow-2xl border border-gray-200 px-6 py-4 min-w-[300px] z-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Selected for redaction</p>
                <p className="font-semibold text-gray-800">
                  {getSelectedCount()} / {getTotalCount()}
                </p>
              </div>
              <button
                onClick={handleRedact}
                disabled={getSelectedCount() === 0 || isRedacting}
                className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center space-x-2 ${
                  getSelectedCount() === 0 || isRedacting
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-red-600 to-orange-600 text-white hover:from-red-700 hover:to-orange-700 shadow-lg"
                }`}
              >
                {isRedacting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>Redact Now</span>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SelectionPage;