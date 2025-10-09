import { useContext, useState, useEffect } from "react";
import { AppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";

function ResultPage() {
  const { 
    downloadUrl, 
    verificationUrl, 
    redactionResult,
    fileId,
    setDownloadUrl,
    setVerificationUrl
  } = useContext(AppContext);
  const navigate = useNavigate();
  const [downloadInfo, setDownloadInfo] = useState(null);
  const [isDownloading, setIsDownloading] = useState({ pdf: false, report: false });

  const API_BASE_URL = "http://localhost:8000"; // Add this line

  // Ensure URLs are properly set from redaction result
  useEffect(() => {
    if (redactionResult && !downloadUrl) {
      setDownloadUrl(redactionResult.download_url);
      setVerificationUrl(redactionResult.verification_url);
    }
  }, [redactionResult, downloadUrl, setDownloadUrl, setVerificationUrl]);

  // Fetch download info
  useEffect(() => {
    if (fileId) {
      fetchDownloadInfo();
    }
  }, [fileId]);

  const fetchDownloadInfo = async () => {
    try {
      console.log("Fetching download info for file:", fileId);
      
      // Use the full backend URL
      const response = await fetch(`${API_BASE_URL}/download/${fileId}/info`);
      
      console.log("Response status:", response.status);
      console.log("Response content type:", response.headers.get('content-type'));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response text:", errorText);
        throw new Error(`Failed to fetch download info: ${response.status} ${response.statusText}`);
      }

      const info = await response.json();
      console.log("Download info received:", info);
      setDownloadInfo(info);
      
    } catch (error) {
      console.error("Failed to fetch download info:", error);
      
      // Set default info when fetch fails
      setDownloadInfo({
        pdf_available: false,
        report_available: false,
        error: error.message
      });
    }
  };

  const handleDownload = async (type) => {
    try {
      setIsDownloading(prev => ({ ...prev, [type]: true }));
      
      let url, filename;
      
      if (type === 'pdf') {
        url = `${API_BASE_URL}/download/${fileId}`; // Use full backend URL
        filename = `redacted_document_${fileId}.pdf`;
      } else {
        url = `${API_BASE_URL}/download/${fileId}/report`; // Use full backend URL
        filename = `verification_report_${fileId}.json`;
      }

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`);
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      // Refresh download info after download
      await fetchDownloadInfo();
      
    } catch (error) {
      console.error('Download error:', error);
      alert(`Download failed: ${error.message}`);
    } finally {
      setIsDownloading(prev => ({ ...prev, [type]: false }));
    }
  };

  const getFileSizeText = (sizeMB) => {
    if (!sizeMB) return "Size unknown";
    return `${sizeMB} MB`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 mx-auto bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-lg">
            <span className="text-3xl text-white">🎉</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-3">Redaction Complete!</h1>
          <p className="text-gray-600 text-lg max-w-md mx-auto">
            Your document has been successfully processed and secured. Download your files below.
          </p>
          {redactionResult && (
            <div className="mt-4 p-3 bg-green-100 rounded-lg inline-block">
              <p className="text-green-800 font-semibold">
                ✅ Successfully redacted {redactionResult.redacted_count || 0} items
              </p>
            </div>
          )}
        </div>

        {/* Error Display */}
        {downloadInfo?.error && (
          <div className="mb-6 p-4 bg-yellow-100 border border-yellow-400 rounded-lg">
            <p className="text-yellow-800 font-semibold">
              ⚠️ Connection Issue: {downloadInfo.error}
            </p>
            <p className="text-yellow-700 text-sm mt-2">
              Make sure your backend server is running on http://localhost:8000
            </p>
          </div>
        )}

        {/* Loading State */}
        {!downloadInfo && (
          <div className="mb-6 p-4 bg-blue-100 border border-blue-400 rounded-lg">
            <p className="text-blue-800 font-semibold">
              🔄 Checking file availability...
            </p>
          </div>
        )}

        {/* Main Content Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden mb-8">
          {/* Success Banner */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4 text-white text-center">
            <div className="flex items-center justify-center space-x-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-semibold">Document Successfully Secured</span>
            </div>
          </div>

          <div className="p-8">
            {/* Download Cards */}
            <div className="space-y-6">
              {/* Redacted PDF Card */}
              <div className="border-2 border-green-200 rounded-2xl p-6 bg-green-50 hover:bg-green-100 transition-all duration-300 hover:scale-105">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">Redacted Document</h3>
                    <p className="text-gray-600 mb-2">
                      Your secure PDF with all selected sensitive information permanently removed.
                    </p>
                    {downloadInfo?.pdf_available && (
                      <p className="text-sm text-green-600 mb-4">
                        ✅ Ready to download • {getFileSizeText(downloadInfo.pdf_size_mb)}
                      </p>
                    )}
                    {!downloadInfo?.pdf_available && downloadInfo && (
                      <p className="text-sm text-red-600 mb-4">
                        ❌ File not available
                      </p>
                    )}
                    <button
                      onClick={() => handleDownload('pdf')}
                      disabled={isDownloading.pdf || !downloadInfo?.pdf_available}
                      className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-colors shadow-lg hover:shadow-xl w-full sm:w-auto ${
                        isDownloading.pdf || !downloadInfo?.pdf_available
                          ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                          : "bg-green-600 text-white hover:bg-green-700"
                      }`}
                    >
                      {isDownloading.pdf ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Downloading...</span>
                        </>
                      ) : (
                        <span>Download Redacted PDF</span>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Verification Report Card */}
              <div className="border-2 border-blue-200 rounded-2xl p-6 bg-blue-50 hover:bg-blue-100 transition-all duration-300 hover:scale-105">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">Verification Report</h3>
                    <p className="text-gray-600 mb-2">
                      Detailed audit trail showing what was redacted and verification checks performed.
                    </p>
                    {downloadInfo?.report_available && (
                      <p className="text-sm text-blue-600 mb-4">
                        ✅ Ready to download • JSON format
                      </p>
                    )}
                    {!downloadInfo?.report_available && downloadInfo && (
                      <p className="text-sm text-red-600 mb-4">
                        ❌ Report not available
                      </p>
                    )}
                    <button
                      onClick={() => handleDownload('report')}
                      disabled={isDownloading.report || !downloadInfo?.report_available}
                      className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-colors shadow-lg hover:shadow-xl w-full sm:w-auto ${
                        isDownloading.report || !downloadInfo?.report_available
                          ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                          : "bg-blue-600 text-white hover:bg-blue-700"
                      }`}
                    >
                      {isDownloading.report ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Downloading...</span>
                        </>
                      ) : (
                        <span>Download Verification Report</span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Security Features */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h4 className="font-semibold text-gray-800 mb-4 text-center">Security Features Applied</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 mx-auto bg-purple-100 rounded-full flex items-center justify-center mb-2">
                    <span className="text-purple-600 text-sm">🔒</span>
                  </div>
                  <p className="text-sm font-medium text-gray-700">Permanent Redaction</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-2">
                    <span className="text-green-600 text-sm">📋</span>
                  </div>
                  <p className="text-sm font-medium text-gray-700">Audit Trail</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-2">
                    <span className="text-blue-600 text-sm">✓</span>
                  </div>
                  <p className="text-sm font-medium text-gray-700">Quality Check</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate("/")}
            className="px-8 py-3 border-2 border-indigo-300 text-indigo-700 rounded-xl font-semibold hover:bg-indigo-50 transition-all duration-300"
          >
            Process Another Document
          </button>
          <button
            onClick={() => navigate("/")}
            className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transform hover:scale-105 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            Start New Session
          </button>
        </div>

        {/* Help Text */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            💡 <strong>Remember:</strong> Keep your verification report safe for future reference and compliance purposes.
          </p>
        </div>
      </div>
    </div>
  );
}

export default ResultPage;