import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
// lib/utils.ts
export const getImageUrl = (path?: string) => {
  if (!path) return null;
  const base = import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, '') || 'http://localhost:5000';
  return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
};