import { defineMiddleware } from 'astro:middleware';

// The admin is server-rendered and must never be indexed. Static pages are not
// affected: middleware only runs for on-demand routes at request time.
export const onRequest = defineMiddleware(async (context, next) => {
  const response = await next();
  if (context.url.pathname.startsWith('/keystatic')) {
    response.headers.set('X-Robots-Tag', 'noindex');
  }
  return response;
});
