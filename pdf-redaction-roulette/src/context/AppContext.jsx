import { createContext, useState } from "react";

// Create context
export const AppContext = createContext();  // <-- export it here

export function AppProvider({ children }) {
  const [fileId, setFileId] = useState(null);
  const [detectedData, setDetectedData] = useState({});
  const [selectedItems, setSelectedItems] = useState({});
  const [downloadUrl, setDownloadUrl] = useState("");
  const [verificationUrl, setVerificationUrl] = useState("");
  const [redactionResult, setRedactionResult] = useState(null);
  const [loading, setLoading] = useState(false);

  return (
    <AppContext.Provider value={{
      fileId,
      setFileId,
      detectedData,
      setDetectedData,
      selectedItems,
      setSelectedItems,
      downloadUrl,
      setDownloadUrl,
      verificationUrl,
      setVerificationUrl,
      redactionResult,
      setRedactionResult,
      loading,
      setLoading
    }}>
      {children}
    </AppContext.Provider>
  );
}
