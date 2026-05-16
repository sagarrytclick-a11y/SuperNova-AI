export default function ThreeDots() {
  return (
    <div className="flex space-x-1 items-center h-4">
      <div className="h-1.5 w-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
      <div className="h-1.5 w-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
      <div className="h-1.5 w-1.5 bg-blue-400 rounded-full animate-bounce"></div>
    </div>
  );
}
