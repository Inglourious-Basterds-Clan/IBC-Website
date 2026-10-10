// Fills the shared image cache .cache/img/ before the test suite (Pitfall 5). npm runs it as
// `pretest`. `node --test` runs the test files in parallel processes, and on a cold cache two
// builds would encode the same .cache/img file at once, which gives half-written files or
// EBUSY on Windows. After this step every test build only reads the cache (eleventy-img skips
// files that already exist). Uses the same processImages() as the build (lib/images.js).
// Usage: node scripts/warm-images.js. An encoding error exits non-zero, never swallowed.
import { processImages } from "../lib/images.js";

const { files } = await processImages();
process.stdout.write(`warm-images: ${files.size} file(s) ready in .cache/img\n`);
