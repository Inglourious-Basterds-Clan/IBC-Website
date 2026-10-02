---
last_mapped_commit: 63f2ad5fb842c140afe59fe486169f7da112193b
last_mapped_at: 2026-10-02
---
# Technology Stack

**Analysis Date:** 2026-10-02

## Languages

**Primary:**
- HTML5 - Markup for all pages (`index.html`)
- CSS3 - Styling with custom properties/CSS variables (`css/style.css`)
- JavaScript (ES6+) - Client-side interactivity, no framework (`js/main.js`)

**Secondary:**
- JSON - Structured data for SEO (embedded in HTML via JSON-LD schema)

## Runtime

**Environment:**
- Browser (client-side only)
- No server-side runtime required

**Deployment:**
- Static site deployment (serves as-is via HTTP/HTTPS)
- No build step required

## Frameworks

**Frontend:**
- Vanilla JavaScript (no framework like React, Vue, or Angular)
- Custom DOM manipulation for interactivity

**Styling:**
- CSS3 with CSS Custom Properties (variables)
- No preprocessing (SASS/LESS)
- No CSS framework (no Bootstrap, Tailwind)

**Build/Dev:**
- No build tools detected (no webpack, Vite, or similar)
- No task runner detected (no Gulp, Grunt)

## Key Dependencies

**External Resources:**

- **Google Fonts API** - Font delivery
  - Import: `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Montserrat:wght@300;400;500;600;700;800;900&family=Share+Tech+Mono&display=swap')`
  - Used in `css/style.css:1`
  - Fonts: Inter, Montserrat, Share Tech Mono

- **Font Awesome CDN** 6.0.0 - Icon library
  - URL: `https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css`
  - Used in `index.html:16`
  - Icons used: Discord, YouTube, Facebook social icons

- **Browser APIs** - No external packages, native APIs only
  - Intersection Observer API (`js/main.js:128`)
  - DOM APIs for event handling
  - Date and time functions

## Configuration

**Environment:**
- No `.env` file or environment configuration
- All configuration is hardcoded in HTML/CSS/JS
- Language: Polish (HTML lang="pl", content in Polish)

**Build:**
- No build configuration files detected
- No `package.json`, `webpack.config.js`, or similar
- Project is deploy-as-is

**Assets:**
- Images stored in `assets/` directory
- Supported formats: PNG, JPG
- Types: Logo, hero backgrounds, gallery images

## Platform Requirements

**Development:**
- Text editor (VS Code, Sublime Text, etc.)
- Local web server for testing (e.g., `python -m http.server`, Live Server extension)
- No Node.js, Python, or other runtime required for development

**Production:**
- Static hosting (GitHub Pages, Netlify, Vercel, traditional web server)
- HTTP/2 support preferred
- HTTPS recommended for Discord OAuth in future (if added)
- CDN for Font Awesome and Google Fonts (already configured)

---

*Stack analysis: 2026-10-02*
