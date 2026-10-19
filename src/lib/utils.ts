export { cn } from "cn";

/**
 * Normalizes all entity IDs to production hyphenated format:
 * EVT-0001, DEV-011, AST-070, CBL-002, CBL-SPN-041
 */
export function formatId(id: string | null | undefined): string {
  if (!id) return '';
  return id.replace(/_/g, '-');
}
