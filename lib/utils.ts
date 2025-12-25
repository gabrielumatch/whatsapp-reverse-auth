import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { formatDistanceToNow } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatRelativeTime(date: string | Date): string {
    const formatted = formatDistanceToNow(new Date(date), { addSuffix: true });
    // Optional: make it even shorter like '2m ago' instead of '2 minutes ago'
    return formatted
        .replace('about ', '')
        .replace('less than a minute ago', 'Just now')
        .replace(' minute', 'm')
        .replace(' minutes', 'm')
        .replace(' hour', 'h')
        .replace(' hours', 'h')
        .replace(' day', 'd')
        .replace(' days', 'd')
        .replace(' week', 'w')
        .replace(' weeks', 'w')
        .replace(' month', 'mo')
        .replace(' months', 'mo');
}

// This check can be removed, it is just for tutorial purposes
export const hasEnvVars =
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
