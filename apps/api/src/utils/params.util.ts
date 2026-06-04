export function paramString(
  value: string | string[] | undefined,
  name: string
): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && value[0]) return value[0];
  throw new Error(`Missing route parameter: ${name}`);
}
