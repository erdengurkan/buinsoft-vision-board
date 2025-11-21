import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  value: number; // 1-5
  onChange?: (value: number) => void;
  readOnly?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const StarRating = ({ 
  value, 
  onChange, 
  readOnly = false, 
  size = "sm",
  className 
}: StarRatingProps) => {
  const sizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  const handleClick = (rating: number) => {
    if (!readOnly && onChange) {
      onChange(rating);
    }
  };

  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      {[1, 2, 3, 4, 5].map((rating) => (
        <button
          key={rating}
          type="button"
          onClick={() => handleClick(rating)}
          disabled={readOnly}
          className={cn(
            "transition-colors",
            !readOnly && "cursor-pointer hover:scale-110",
            readOnly && "cursor-default"
          )}
        >
          <Star
            className={cn(
              sizeClasses[size],
              rating <= value
                ? "fill-yellow-400 text-yellow-400"
                : "fill-gray-300 text-gray-300 dark:fill-gray-600 dark:text-gray-600"
            )}
          />
        </button>
      ))}
    </div>
  );
};

