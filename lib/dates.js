// Build-time date formatting for the recap cards (CONT-04). Only runs in Eleventy, never in the
// browser. Pitfall 11: "2026-09-20" is UTC midnight, so a formatter in a timezone west of UTC
// would print the 19th; formatting in UTC keeps the day the data says.
const plLongDate = new Intl.DateTimeFormat("pl-PL", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

// Strict ISO date ("YYYY-MM-DD") -> Polish long date ("20 września 2026"). Anything else, and
// impossible days such as 2026-02-30, throw so a typo fails the build instead of shipping a wrong date.
export function formatPlDate(isoDate) {
  if (typeof isoDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
    throw new Error(`expected an ISO date (YYYY-MM-DD), got ${JSON.stringify(isoDate)}`);
  }
  const date = new Date(isoDate + "T00:00:00Z");
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== isoDate) {
    throw new Error(`not a real calendar date: ${isoDate}`);
  }
  return plLongDate.format(date);
}
