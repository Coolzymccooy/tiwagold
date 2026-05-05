export function humanizeSnake(value: string | undefined | null): string {
  if (typeof value !== "string" || value.length === 0) return "";
  return value
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((part, index) =>
      index === 0
        ? part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
        : part.toLowerCase(),
    )
    .join(" ");
}
