export function publicPaths(base = "/") {
  const home = `/${base.split("/").filter(Boolean).join("/")}${base.split("/").filter(Boolean).length ? "/" : ""}`;
  return { home, how: `${home}how-it-works/` };
}
export function isHowPath(pathname: string, base: string) {
  return `${pathname.replace(/\/$/, "")}/` === publicPaths(base).how;
}
