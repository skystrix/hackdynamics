// The bookData-*.js files are browser scripts that assign to `window.PARTS`
// and `window.CHAPTERS`. Point `window` at the global object so the same files
// run unchanged here (in Deno) — `window.CHAPTERS = []` then becomes a real
// global that their bare `CHAPTERS.push(...)` calls resolve against.
// Imported first in index.ts so it runs before any bookData file.
globalThis.window = globalThis;
