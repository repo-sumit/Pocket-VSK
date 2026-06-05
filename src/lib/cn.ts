export type ClassValue = string | number | false | null | undefined;

/** minimal classnames join (no extra dep). */
export function cn(...parts: ClassValue[]): string {
  return parts.filter(Boolean).join(" ");
}
