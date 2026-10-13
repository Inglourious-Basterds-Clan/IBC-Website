// Nav entries for the header and the footer, rendered in this order.
// D-07: Start stays a hash link so scroll-spy can manage it on home; the page links are
// marked current at build time in header.njk (class active-nav + aria-current="page").
export default [
  { label: "Start", href: "/#hero" },
  { label: "O nas", href: "/#about" },
  { label: "Operacje", href: "/operacje/" },
  { label: "Dołącz", href: "/jak-dolaczyc/" },
];
