export const RESERVED = ["www", "api", "admin", "auth"] as const;
export const MAIN_DOMAIN = process.env.MAIN_DOMAIN ?? "alnashra.co";

export function parseTenant(hostname: string | undefined): "main" | string {
  if (!hostname) return "main";

  const host = hostname.split(":")[0].toLowerCase().trim();
  const parts = host.split(".");

  if (
    host === "localhost" ||
    RESERVED.includes(parts[0] as (typeof RESERVED)[number]) ||
    parts.length < 2
  ) {
    return "main";
  }

  // Production domain check: www.alnashra.co should be main (3 parts, www is reserved)
  if (
    parts.length === 3 &&
    RESERVED.includes(parts[0] as (typeof RESERVED)[number])
  ) {
    return "main";
  }

  // Special-case localhost dev: support {sub}.localhost and {sub}.localhost.localdomain
  if (host === "localhost" || host.endsWith(".localhost")) {
    return parts.length >= 2 ? parts[0] : "main";
  }

  if (host.endsWith(`.${MAIN_DOMAIN}`)) return parts[0];

  return "main";
}
