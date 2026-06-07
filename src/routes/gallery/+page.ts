// Prerender the gallery to static HTML so every picture's <img>/<source> tags ship
// in the initial response and the browser starts fetching the (optimised) images
// immediately — before hydration and the client-side masonry layout run.
export const prerender = true;
