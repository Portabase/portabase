export function isSafeApiPath(path: string): boolean {
  const [pathname] = path.split("?");
  return new URL(pathname, "http://localhost").pathname === pathname;
}
