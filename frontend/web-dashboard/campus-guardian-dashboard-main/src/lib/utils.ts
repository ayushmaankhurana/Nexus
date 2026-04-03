import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { User } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Get a safe display name from user object.
 * Falls back gracefully if name is missing.
 */
export function getDisplayName(user: User | null | undefined): string {
  if (!user) return "User";
  if (user.name) return user.name;
  // Fallbacks in order of preference
  if (user.studentId) return user.studentId;
  if (user.email) return user.email;
  return "User";
}

/**
 * Get safe initials from user object.
 * Handles missing or malformed names gracefully.
 */
export function getUserInitials(user: User | null | undefined): string {
  if (!user) return "U";
  
  const displayName = getDisplayName(user);
  if (!displayName || displayName === "User") return "U";
  
  const initials = displayName
    .split(" ")
    .map((n: string) => n[0]?.toUpperCase())
    .filter(Boolean)
    .join("")
    .slice(0, 2);
  
  return initials || "U";
}
