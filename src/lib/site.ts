const DEV_ORIGIN = 'http://localhost:4877';

export function pageTitle(settings: { name: string; tagline: string }, title?: string): string {
  return title ? `${title} · ${settings.name}` : `${settings.name}, ${settings.tagline}`;
}

/** Canonical URLs always end with a slash so the sitemap, canonical tags, and Open Graph agree. */
export function canonicalUrl(pathname: string, site: URL | undefined): string {
  const path = pathname.endsWith('/') ? pathname : `${pathname}/`;
  return new URL(path, site ?? DEV_ORIGIN).href;
}
