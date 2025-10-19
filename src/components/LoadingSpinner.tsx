interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  color?: "black" | "white" | "gray";
  text?: string;
}

export default function LoadingSpinner({
  size = "md",
  color = "black",
  text,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  const colorClasses = {
    black: "border-black border-t-transparent",
    white: "border-white border-t-transparent",
    gray: "border-gray-400 border-t-transparent",
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div
        className={`${sizeClasses[size]} ${colorClasses[color]} border-4 rounded-full animate-spin`}
      />
      {text && (
        <p className="text-sm text-gray-600 animate-pulse">{text}</p>
      )}
    </div>
  );
}
