import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Utility function for merging Tailwind CSS classes with clsx
 * Used by shadcn/ui components for conditional class names
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
