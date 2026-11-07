# Salt Water — Sundarbans Photography Archive

> A slow photographic journey from Dhaka across southwestern Bangladesh, through the Sundarbans mangrove delta, and out to the Bay of Bengal. Photographs & field notes by **Munasib Apurbo**.
>
> **Live Site**: [https://saltwaterr.vercel.app](https://saltwaterr.vercel.app)

---

## Architecture & Technology

- **HTML5 & Vanilla JavaScript**: Fast, zero-dependency client runtime with progressive image loading and rangefinder lightbox modal.
- **Modern CSS3**: Cyan-tinted retro editorial aesthetic, responsive multi-column photo grid, tactile paper grain overlays, and custom scroll scrubbing.
- **Architectural Hydrographic Survey Chart**: Hand-crafted interactive SVG map with magnetic waypoint tracking for both desktop and mobile viewports.
- **Cinematic Hero**: Dual-stream adaptive background video (`showreel_web.mp4` / `showreel_mobile.mp4`) with smooth optical scrim and 35mm film grain.
- **WebGL Coda Shader**: Real-time analog halftone dithering and value noise shader embedded in the footer canvas.
- **Optimized Caching & Security**: Production `vercel.json` headers configured for immutable asset caching and strict security policies.

---

## Directory Structure

```
├── assets/
│   ├── data/
│   │   ├── photos.js              # Expedition dataset (window.EXPEDITION_DATA)
│   │   └── photos.json            # Standard JSON photo catalog
│   ├── images/
│   │   ├── film_grain_tile.png    # 35mm photographic film grain texture
│   │   ├── logo.png               # Brand mark & favicon
│   │   ├── paper_grain_texture.png# Tactile paper grain overlay
│   │   ├── thumbs/                # Fast-loading thumbnail photos (31)
│   │   └── web/                   # High-resolution web photos (31 + hero/footer)
│   └── videos/
│       ├── showreel_mobile.mp4    # Mobile-optimized 720p H.264 video
│       └── showreel_web.mp4       # Desktop 1080p H.264 video
├── css/
│   └── styles.css                 # Main stylesheet & design system
├── js/
│   └── main.js                    # Interactive gallery, map, shader & lightbox engine
├── scripts/
│   ├── optimize_and_build_data.py # Automation script for metadata and dataset generation
│   └── test-site.js               # Comprehensive automated verification test suite
├── index.html                     # Main website entry point
├── package.json                   # Local development & verification scripts
├── robots.txt                     # Search engine crawler directives
├── vercel.json                    # Vercel deployment headers & cache rules
├── .gitignore                     # Git ignore configuration (excludes _raw_media/)
└── .vercelignore                  # Vercel deployment ignore configuration
```

---

## Local Development & Testing

1. **Install dev dependencies** (optional, for local static server and automated testing):
   ```bash
   npm install
   ```

2. **Start the local development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

3. **Run Automated Health Checks**:
   Verifies all 31 images, videos, scripts, desktop and mobile viewports, and lightbox interactions:
   ```bash
   npm test
   ```

4. **Rebuild Photo Data**:
   To regenerate `assets/data/photos.json` and `assets/data/photos.js` from image metadata:
   ```bash
   npm run build:data
   ```

---

## Production Deployment

### Option 1: Deploy to Vercel (Recommended)

1. Push this repository to GitHub or run the Vercel CLI:
   ```bash
   npx vercel
   ```
2. The project automatically applies:
   - Immutable edge caching (`Cache-Control: public, max-age=31536000, immutable`) for all images, videos, scripts, and stylesheets.
   - Byte-range streaming for `showreel_web.mp4` and `showreel_mobile.mp4`.
   - Security headers (`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`).
   - Clean URLs and strict exclusion of `_raw_media/` via `.vercelignore`.

### Option 2: Upload to Any Static Host

All assets and markup are fully self-contained standard static files. You can deploy the root directory to GitHub Pages, Cloudflare Pages, Netlify, or any CDN.
