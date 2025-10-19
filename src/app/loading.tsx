export default function Loading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        {/* Animated Shoe Icon */}
        <div className="relative w-24 h-24 mx-auto mb-6">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 bg-black rounded-full animate-ping opacity-20"></div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <svg
              className="w-12 h-12 text-black animate-bounce"
              fill="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M20.5 7h-17C2.7 7 2 7.7 2 8.5S2.7 10 3.5 10h17c.8 0 1.5-.7 1.5-1.5S21.3 7 20.5 7zM3.5 13C2.7 13 2 13.7 2 14.5S2.7 16 3.5 16h17c.8 0 1.5-.7 1.5-1.5S21.3 13 20.5 13h-17zm17 4h-17c-.8 0-1.5.7-1.5 1.5S2.7 20 3.5 20h17c.8 0 1.5-.7 1.5-1.5S21.3 17 20.5 17z" />
            </svg>
          </div>
        </div>

        {/* Loading Text */}
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Memuat...
        </h2>
        <p className="text-gray-500 text-sm">
          Mohon tunggu sebentar
        </p>

        {/* Animated Dots */}
        <div className="flex justify-center gap-1 mt-4">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
        </div>
      </div>
    </div>
  );
}
