export const RESERVED = ["www", "api", "admin", "auth"] as const;
export const MAIN_DOMAIN = process.env.MAIN_DOMAIN ?? "alnashra.co";

export function parseTenant(hostname: string | undefined): "main" | string {
  if (!hostname) return "main";

  const host = hostname.split(":")[0].toLowerCase().trim();
  const parts = host.split(".");

  if (
    host === "localhost" ||
    RESERVED.includes(parts[0] as (typeof RESERVED)[number]) ||
    parts.length < 3
  ) {
    return "main";
  }

  if (host.endsWith(`.${MAIN_DOMAIN}`)) return parts[0];

  return "main";
}
