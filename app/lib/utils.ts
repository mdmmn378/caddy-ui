import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export type ObjectValues<T> = T[keyof T]

/** Build the props for a reka-ui delegated-props pattern, omitting `class`. */
export function omitClass<T extends { class?: unknown }>(props: T): Omit<T, 'class'> {
  const { class: _, ...rest } = props
  return rest
}
