function Loader({ text = "Loading..." }) {
  return (
    <div className="mt-4 flex flex-col items-center text-gray-600">
      <div className="w-6 h-6 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-2">{text}</p>
    </div>
  );
}

export default Loader;
