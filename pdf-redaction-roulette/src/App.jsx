import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import UploadPage from "./pages/UploadPage";
import DataPreviewPage from "./pages/DataPreviewPage";
import SelectionPage from "./pages/SelectionPage";
import ResultPage from "./pages/ResultPage";
import Stepper from "./components/Stepper";


function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 flex flex-col items-center">
        <h1 className="text-3xl font-bold my-6 text-indigo-600">
          PDF-Redaction Roulette
        </h1>
        <Stepper />
        <div className="w-full max-w-3xl p-4">
          <Routes>
            <Route path="/" element={<UploadPage />} />
            <Route path="/preview" element={<DataPreviewPage />} />
            <Route path="/select" element={<SelectionPage />} />
            <Route path="/result" element={<ResultPage />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
