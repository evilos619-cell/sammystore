// This file used to provide a redirect route from /products/:categorySlug
// to /products?cat=<slug>. That route is no longer needed because the
// app now links directly to /products?cat=<slug>. Keeping this stub
// prevents accidental imports; remove the file entirely if you prefer.

export default function CategoryRedirect() {
  return null;
}
