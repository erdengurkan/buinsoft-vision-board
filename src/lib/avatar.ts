/**
 * Generates avatar initials from a name
 * Examples:
 * - "Emre Kılınç" -> "EK"
 * - "John" -> "JO"
 * - "Mary Jane Watson" -> "MJ"
 */
export const generateAvatarInitials = (name: string | null | undefined): string => {
  if (!name) return "";

  const words = name.trim().split(/\s+/);
  
  if (words.length === 0) return "";
  
  // If there's only one word, take first 2 letters
  if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase();
  }
  
  // If there are multiple words, take first letter of first and second word
  const firstInitial = words[0].charAt(0);
  const secondInitial = words[words.length - 1].charAt(0);
  
  return (firstInitial + secondInitial).toUpperCase();
};

