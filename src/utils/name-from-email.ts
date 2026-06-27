export function extractNameFromEmail(email: string): string {
  const localPart = email.split("@")[0];
  const nameParts = localPart
    .replace(/[_\.\-]/g, " ")
    .split(" ")
    .filter(Boolean);

  return nameParts
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
