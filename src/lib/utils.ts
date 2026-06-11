import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const IS_PROMOTION_FREE = true;

export function hasPhoneNumber(text: string): boolean {
  if (!text) return false;
  // Remove all spaces, hyphens, parentheses, dots, and common separators
  const normalized = text.replace(/[\s\-\.\(\)\/\+\,]/g, "");
  // Look for any sequence of 9 consecutive digits starting with 82, 83, 84, 85, 86, 87
  // Or 258 followed by 82/83/84/85/86/87 followed by 7 digits
  const pattern1 = /(?:82|83|84|85|86|87)\d{7}/;
  const pattern2 = /258(?:82|83|84|85|86|87)\d{7}/;
  return pattern1.test(normalized) || pattern2.test(normalized);
}
