export function getProblemSlug(): string | null {
  const match = window.location.pathname.match(
    /^\/problems\/([^/]+)/
  );

  return match ? match[1] : null;
}