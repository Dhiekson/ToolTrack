
import { type ClassValue, clsx } from "clsx";
import { format } from "date-fns";
import { twMerge } from "tailwind-merge";
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date, includeTime = false) {
  if (!date) return "";
  
  return includeTime 
    ? format(date, "dd/MM/yyyy HH:mm")
    : format(date, "dd/MM/yyyy");
}
