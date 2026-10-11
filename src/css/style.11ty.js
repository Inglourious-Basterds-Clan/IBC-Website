// D-12: the one stylesheet every page loads, the Lightning CSS bundle from lib/css.js.
import { getCssBundle } from "../../lib/css.js";

export const data = { permalink: "/css/style.css", eleventyExcludeFromCollections: true };

export function render() {
  return getCssBundle().code;
}
