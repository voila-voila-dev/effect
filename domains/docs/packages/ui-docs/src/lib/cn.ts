import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** Joins class names, the later Tailwind utility winning a conflict. */
export function cn(...inputs: Array<ClassValue>) {
	return twMerge(clsx(inputs));
}
