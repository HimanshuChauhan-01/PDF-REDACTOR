import { useLocation } from "react-router-dom";

const steps = [
  { path: "/", label: "Upload" },
  { path: "/preview", label: "Detected Data" },
  { path: "/select", label: "Select" },
  { path: "/result", label: "Result" },
];

function Stepper() {
  const location = useLocation();

  return (
    <div className="flex justify-center gap-4 mb-6">
      {steps.map((step, index) => (
        <div
          key={index}
          className={`px-4 py-1 rounded-full text-sm ${
            location.pathname === step.path
              ? "bg-indigo-600 text-white"
              : "bg-gray-200 text-gray-600"
          }`}
        >
          {step.label}
        </div>
      ))}
    </div>
  );
}

export default Stepper;
