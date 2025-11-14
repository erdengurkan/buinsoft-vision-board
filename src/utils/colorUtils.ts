// Convert Tailwind color classes to actual hex colors
export const getColorFromTailwind = (tailwindClass: string): string => {
  const colorMap: Record<string, string> = {
    "bg-blue-500": "#3b82f6",
    "bg-green-500": "#10b981",
    "bg-yellow-500": "#eab308",
    "bg-orange-500": "#f97316",
    "bg-red-500": "#ef4444",
    "bg-purple-500": "#a855f7",
    "bg-pink-500": "#ec4899",
    "bg-indigo-500": "#6366f1",
    "bg-teal-500": "#14b8a6",
    "bg-cyan-500": "#06b6d4",
  };

  return colorMap[tailwindClass] || "#3b82f6"; // Default to blue
};

