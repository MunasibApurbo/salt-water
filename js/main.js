/**
 * PLACES VISITED — VINTAGE CARTOGRAPHIC & EDITORIAL PORTFOLIO CONTROLLER
 * Vanilla JavaScript: Cyan-Shade Retro Aesthetics, Architectural Survey Chart,
 * Curated Exhibition Wall with Obsidian UI Text-Fill, Glowing Scroll Indicator,
 * 90s Camcorder Viewfinder HUD, and Rangefinder Lightbox Modal.
 */

(function () {
  'use strict';

  const state = {
    data: null,
    activeWaypointIndex: 0,
    activeCategory: 'all',
    activeWaypointFilter: null,
    curatedPhotos: [],
    filteredPhotos: [],
    activePhotoIndex: 0,
    lightboxOpen: false,
    soundEnabled: true
  };

  // DOM References
  let gridEl;
  let modalEl;
  let lbImg;
  let lbTitle;
  let lbLocation;
  let lbDesc;
  let lbCoords;
  let lbCounter;

  // Web Audio Context
  let audioCtx = null;

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    cacheDOMElements();
    loadData();
    initFooterShader();
    initHeroVideo();
    initHeaderScroll();
    initLightbox();
    initTextFillAnimation();
  }



  /* --------------------------------------------------------------------------
     2. Cache DOM Elements
     -------------------------------------------------------------------------- */
  function cacheDOMElements() {
    gridEl = document.getElementById('photos-grid');
    modalEl = document.getElementById('lightbox-modal');
    lbImg = document.getElementById('lb-img');
    lbTitle = document.getElementById('lb-title');
    lbLocation = document.getElementById('lb-location');
    lbDesc = document.getElementById('lb-desc');
    lbCoords = document.getElementById('lb-coords');
    lbCounter = document.getElementById('lb-counter');
  }

  /* --------------------------------------------------------------------------
     3. Load Data
     -------------------------------------------------------------------------- */
  async function loadData() {
    if (window.EXPEDITION_DATA) {
      state.data = window.EXPEDITION_DATA;
    } else {
      try {
        const res = await fetch('assets/data/photos.json');
        state.data = await res.json();
      } catch (err) {
        console.error('Failed to load expedition photos:', err);
        return;
      }
    }

    // Build curated exhibition order
    const curatedOrderIds = [];
    CURATED_EXHIBITION_GROUPS.forEach((g) => curatedOrderIds.push(...g.photoIds));
    if (!curatedOrderIds.includes('sand-bubbler-crab-patterns')) {
      curatedOrderIds.push('sand-bubbler-crab-patterns');
    }
    const photoMap = new Map(state.data.photos.map((p) => [p.id, p]));
    state.curatedPhotos = curatedOrderIds.map((id) => photoMap.get(id)).filter(Boolean);
    state.filteredPhotos = [...state.curatedPhotos];

    initWaypoints();
    initMapScrollInteraction();
    renderGallery();
    prefetchThumbnailsIdle();
  }

  /* --------------------------------------------------------------------------
     4. Interactive Full-Bleed Real-Data Route Map & Google Maps Style Controls
     -------------------------------------------------------------------------- */
  /* --------------------------------------------------------------------------
     4. Static Real-Data Expedition Route Map (Pure National Geographic Cartography)
     -------------------------------------------------------------------------- */
  function parseCoordinates(coordStr) {
    if (!coordStr) return null;
    const parts = coordStr.split(',');
    if (parts.length < 2) return null;
    const latMatch = parts[0].match(/([\d.]+)/);
    const lngMatch = parts[1].match(/([\d.]+)/);
    if (!latMatch || !lngMatch) return null;
    return [parseFloat(latMatch[1]), parseFloat(lngMatch[1])];
  }

  /* --------------------------------------------------------------------------
     4. Architectural Hydrographic Survey Chart Controller
     -------------------------------------------------------------------------- */
  function initWaypoints() {
    if (!state.data || !state.data.waypoints) return;

    const stations = document.querySelectorAll('.chart-station');
    if (!stations.length) return;

    // Default telemetry display (Waypoint 01)
    const wp1 = state.data.waypoints.find((w) => w.id === 'wp-1') || state.data.waypoints[0];
    function setTelemetry(wp) {
      if (!wp) return;
      const desktopEl = document.getElementById('svg-telemetry-loc');
      if (desktopEl) {
        desktopEl.textContent = `WAYPOINT ${wp.num}: ${wp.title.toUpperCase()} (${wp.region.toUpperCase()}) // ${wp.photos_count || 1} PHOTO`;
      }
      const mobileEl = document.getElementById('svg-telemetry-loc-mobile');
      if (mobileEl) {
        mobileEl.textContent = `WP ${wp.num}: ${wp.title.toUpperCase()}`;
      }
    }
    setTelemetry(wp1);

    stations.forEach((stationEl) => {
      const wpId = stationEl.getAttribute('data-wp-id');
      const wp = state.data.waypoints.find((w) => w.id === wpId);
      if (!wp) return;

      function activateMagnetic() {
        document.querySelectorAll(`.chart-station[data-wp-id="${wpId}"]`).forEach((s) => {
          s.classList.add('magnetic-active');
        });
        setTelemetry(wp);
      }

      function deactivateMagnetic() {
        document.querySelectorAll(`.chart-station[data-wp-id="${wpId}"]`).forEach((s) => {
          s.classList.remove('magnetic-active');
        });
        if (state.activeWaypointFilter) {
          const activeWp = state.data.waypoints.find((w) => w.id === state.activeWaypointFilter);
          setTelemetry(activeWp || wp1);
        } else {
          setTelemetry(wp1);
        }
      }

      // Accessibility for keyboard navigation
      stationEl.setAttribute('tabindex', '0');
      stationEl.setAttribute('role', 'button');
      stationEl.setAttribute('aria-label', `Waypoint ${wp.num}: ${wp.title} (${wp.region})`);
      stationEl.addEventListener('focus', activateMagnetic);
      stationEl.addEventListener('blur', deactivateMagnetic);
      stationEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          stationEl.click();
        }
      });

      // Hover feedback for station nodes
      stationEl.addEventListener('mouseenter', activateMagnetic);
      stationEl.addEventListener('mouseleave', deactivateMagnetic);

      // Click to filter photo gallery and smoothly scroll (supports toggle off)
      stationEl.addEventListener('click', () => {
        const isCurrentlyActive = state.activeWaypointFilter === wp.id;
        if (isCurrentlyActive) {
          state.activeWaypointFilter = null;
          state.filteredPhotos = [...state.curatedPhotos];
          stations.forEach((s) => s.classList.remove('active', 'magnetic-active'));
          setTelemetry(wp1);
        } else {
          state.activeWaypointFilter = wp.id;
          state.activeCategory = 'all';
          state.filteredPhotos = state.data.photos.filter((p) => p.waypoint_id === wp.id);
          stations.forEach((s) => {
            s.classList.toggle('active', s.getAttribute('data-wp-id') === wp.id);
          });
          setTelemetry(wp);
        }

        renderGallery();
        playMechanicalTick();

        const gallerySec = document.getElementById('gallery');
        if (gallerySec) {
          gallerySec.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });
  }

  /* --------------------------------------------------------------------------
     4b. Map Scroll Progress & Dynamic Station Enlargement
     -------------------------------------------------------------------------- */
  function initMapScrollInteraction() {
    const routeSec = document.getElementById('route');
    if (!routeSec || !state.data || !state.data.waypoints) return;

    const stations = Array.from(document.querySelectorAll('.chart-station'));
    if (!stations.length) return;

    // Ordered station sequence along the route from North (Dhaka) to South (Bay of Bengal)
    const waypointOrder = ['wp-1', 'wp-2', 'wp-3', 'wp-4', 'wp-5', 'wp-7', 'wp-6', 'wp-8', 'wp-9'];

    let isHoveringStation = false;
    stations.forEach((s) => {
      s.addEventListener('mouseenter', () => { isHoveringStation = true; });
      s.addEventListener('mouseleave', () => { isHoveringStation = false; });
    });

    let currentActiveIdx = -1;

    function updateMapScroll() {
      if (isHoveringStation) return;

      const rect = routeSec.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      // When map section is not on screen, clear scroll-active
      if (rect.bottom < 80 || rect.top > windowHeight - 80) {
        if (currentActiveIdx !== -1) {
          stations.forEach((s) => s.classList.remove('scroll-active'));
          currentActiveIdx = -1;
        }
        return;
      }

      // Compute normalized progress through the route section as user scrolls
      const totalDist = rect.height + windowHeight * 0.4;
      const scrolled = (windowHeight * 0.7) - rect.top;
      let progress = scrolled / totalDist;
      progress = Math.max(0, Math.min(1, progress));

      const targetIdx = Math.min(
        waypointOrder.length - 1,
        Math.floor(progress * waypointOrder.length)
      );

      if (targetIdx !== currentActiveIdx) {
        currentActiveIdx = targetIdx;
        const targetWpId = waypointOrder[targetIdx];
        stations.forEach((s) => {
          s.classList.toggle('scroll-active', s.getAttribute('data-wp-id') === targetWpId);
        });

        const wp = state.data.waypoints.find((w) => w.id === targetWpId);
        if (wp && !state.activeWaypointFilter) {
          const desktopEl = document.getElementById('svg-telemetry-loc');
          if (desktopEl) {
            desktopEl.textContent = `WAYPOINT ${wp.num}: ${wp.title.toUpperCase()} (${wp.region.toUpperCase()}) // ${wp.photos_count || 1} PHOTO`;
          }
          const mobileEl = document.getElementById('svg-telemetry-loc-mobile');
          if (mobileEl) {
            mobileEl.textContent = `WP ${wp.num}: ${wp.title.toUpperCase()}`;
          }
        }
      }
    }

    let ticking = false;
    function onScroll() {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(() => {
          updateMapScroll();
          ticking = false;
        });
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    updateMapScroll();
  }

  /* --------------------------------------------------------------------------
     5b. Curated Exhibition Groups & Whole-In-One Unified Architecture
     -------------------------------------------------------------------------- */
  const CURATED_EXHIBITION_GROUPS = [
    {
      type: '2l-1p',
      photoIds: ['hardinge-lalon-shah-bridges', 'wooden-boat-rooppur', 'highway-twilight'],
      text: 'Pabna was quiet, and by the time I reached Paksey the sun was already slipping below the water. Standing beneath the old railway bridge, the iron girders felt almost timeless against the dusk. Out on the mud flats, a single wooden dinghy rested in the silt while the cooling towers of Rooppur hovered like ghosts on the horizon.'
    },
    {
      type: '2l-1p',
      photoIds: ['captain-at-the-helm', 'cruiser-the-sail-convoy', 'transmission-towers-wetlands'],
      text: 'Morning on the river moves to its own tempo. In the wheelhouse, the captain steered with quiet precision, his hands resting on the polished spokes as he read the subtle ripples of the tide. Behind, the wake of the convoy cut across the brown channel until the last power pylons dissolved into the marsh.'
    },
    {
      type: '1p-2l',
      photoIds: ['promenade-deck-night', 'cabin-window-view', 'searchlights-observation-deck'],
      text: 'Night on the water brings an absolute stillness. With the signal gone, the boat became its own solitary world, drifting beneath an ink black sky. I sat on the upper deck under the warm glow of filament bulbs, watching the searchlight pierce the river mist in long, slow arcs.'
    },
    {
      type: '1p-2l',
      photoIds: ['boatman-at-the-bow', 'blue-hour-anchorage', 'fishing-boat-sunset'],
      text: 'By late afternoon the channel broadened and Kotka appeared in the distance. The boatman paused at the bow, offering a warm and weary smile as the anchor dropped into the silt. When twilight fell, the river turned deep indigo, holding the reflection of small golden lanterns swaying across the water.'
    },
    {
      type: '2l-1p',
      photoIds: ['kashful-reeds-closeup', 'mangrove-coastal-edge', 'eroded-mangrove-stumps'],
      text: 'Emerging from the dense trees, the coastal air hit with sudden force. Wild kashful reeds bent against the offshore wind, their white silks catching the low sun. Further along the tide line, bleached mangrove stumps stood anchored in the wet sand, sculptural monuments to a shoreline slowly taken by the sea.'
    },
    {
      type: '1p-2l-1p',
      photoIds: ['river-crossing-at-dusk', 'jamtola-sea-beach', 'wet-sand-reflections', 'sand-bubbler-crab-patterns'],
      text: 'Jamtola felt like the quiet edge of the world. At low tide the wet sand stretched into the horizon, mirroring the silver sky and marked by intricate radial constellations left by tiny crabs. I walked until the salt dried on my skin, watching the dusk dissolve into violet over the open bay.'
    },
    {
      type: '1p-1l-1p',
      photoIds: ['observation-watchtower', 'canopy-panorama-tower', 'sundari-tree-canopy'],
      text: 'Turning back north, I stopped at Karamjal just after a brief rain. Climbing the slick timber stairs of the watchtower, the heavy humidity gave way to a cool breeze above the canopy. Below me, the Sundari forest extended in every direction, an ocean of leaves breathing mist into the afternoon light.'
    },
    {
      type: '2l-1p',
      photoIds: ['karamjal-mangrove-boundary', 'lianas-over-creek', 'wild-water-lily-shapla'],
      text: 'In the narrow tributaries, the motor was cut and the boat drifted in complete silence. Ancient lianas hung like heavy ropes into the dark water, while breathing roots broke through the mudflats. Tucked in a secluded freshwater pool, a solitary white shapla rested in the shade, untouched by the current.'
    },
    {
      type: '1p-2l',
      photoIds: ['submerged-brick-ghat', 'pashur-silos-barges', 'rupsha-bridge-truss'],
      text: 'Khulna was the final destination, where the rhythm of the wild gave way to industrial weight. At midday the brackish tide surged in, submerging the weathered brick ghats step by step. Overhead, the massive blue geometry of the Rupsha rail bridge framed passing cargo barges as the journey drew to a close.'
    },
    {
      type: '3p',
      photoIds: ['adomya-bangla-khulna-university', 'navy-frigates-mongla', 'rupsha-bridge-span']
    }
  ];

  function splitTextIntoChars(text) {
    return text.split(' ').map((word) => {
      const chars = Array.from(word).map((char) => `<span class="split-chars">${char}</span>`).join('');
      return `<span class="split-word">${chars}</span>`;
    }).join('<span class="split-chars split-space">&nbsp;</span>');
  }

  /* --------------------------------------------------------------------------
     Image Preloading & Progressive Resolution Cache
     -------------------------------------------------------------------------- */
  const preloadedImages = new Set();

  function preloadImage(url) {
    if (!url || preloadedImages.has(url)) return;
    preloadedImages.add(url);
    const img = new Image();
    img.src = url;
  }

  function prefetchThumbnailsIdle() {
    if (!state.data || !state.data.photos) return;
    const scheduleIdle = window.requestIdleCallback || ((cb) => setTimeout(cb, 1200));
    scheduleIdle(() => {
      state.data.photos.forEach((photo) => {
        if (photo.thumb_src) {
          preloadImage(photo.thumb_src);
        }
      });
    });
  }

  function buildImgTag(photo, index) {
    const isEager = typeof index === 'number' && index < 6;
    const priorityAttr = isEager ? 'loading="eager" fetchpriority="high"' : 'loading="lazy" decoding="async"';
    return `<img src="${photo.thumb_src}" alt="${photo.title}" class="photo-img" ${priorityAttr} width="${photo.width}" height="${photo.height}" onload="this.classList.add('loaded')" />`;
  }

  function markLoadedImages(container) {
    if (!container) return;
    container.querySelectorAll('.photo-img').forEach((img) => {
      if (img.complete) {
        img.classList.add('loaded');
      } else {
        img.addEventListener('load', () => img.classList.add('loaded'), { once: true });
      }
    });
  }

  /* --------------------------------------------------------------------------
     6. Render Gallery Photos Grid (Zero Resizing, Whole-In-One Unified Architecture)
     -------------------------------------------------------------------------- */
  function renderGallery() {
    if (!gridEl) return;
    if (!state.data || !state.data.photos || state.data.photos.length === 0) return;

    const photoMap = new Map(state.data.photos.map((p) => [p.id, p]));

    // Reset helper to clear filters and sync UI across map and gallery
    function resetAllFilters() {
      state.activeWaypointFilter = null;
      state.filteredPhotos = [...state.curatedPhotos];
      document.querySelectorAll('.chart-station').forEach((s) => {
        s.classList.remove('active', 'magnetic-active');
      });
      const wp1 = state.data.waypoints.find((w) => w.id === 'wp-1') || state.data.waypoints[0];
      const desktopEl = document.getElementById('svg-telemetry-loc');
      if (desktopEl && wp1) {
        desktopEl.textContent = `WAYPOINT ${wp1.num}: ${wp1.title.toUpperCase()} (${wp1.region.toUpperCase()}) // ${wp1.photos_count || 1} PHOTO`;
      }
      const mobileEl = document.getElementById('svg-telemetry-loc-mobile');
      if (mobileEl && wp1) {
        mobileEl.textContent = `WP ${wp1.num}: ${wp1.title.toUpperCase()}`;
      }
      renderGallery();
    }

    // Check if waypoint filter is active
    if (state.activeWaypointFilter) {
      const filtered = state.data.photos.filter((p) => p.waypoint_id === state.activeWaypointFilter);
      state.filteredPhotos = filtered;

      if (filtered.length === 0) {
        gridEl.innerHTML = `
          <div style="text-align: center; padding: 4rem 1rem;">
            <p style="font-family: var(--font-main); font-size: 1.25rem; margin-bottom: 0.5rem;">No photographs found for this waypoint.</p>
            <button class="btn-retro-primary" id="btn-reset-filters" style="margin-top: 1rem;">Show All Photographs</button>
          </div>
        `;
        document.getElementById('btn-reset-filters')?.addEventListener('click', resetAllFilters);
        return;
      }

      let filteredHtml = `
        <div style="margin-bottom: 1.5rem; display: flex; align-items: center; justify-content: space-between;">
          <span style="font-family: var(--font-main); font-size: 0.8rem; color: var(--ink-secondary); text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">Filtered Waypoint Selection</span>
          <button class="btn-retro-primary" id="btn-reset-filters" style="font-size: 0.75rem; padding: 0.35rem 0.75rem;">Show Full Exhibition</button>
        </div>
        <div class="gallery-row" style="grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));">
      `;
      filtered.forEach((photo, idx) => {
        const isPortrait = photo.orientation === 'portrait';
        filteredHtml += `
          <article class="photo-card ${isPortrait ? 'is-portrait' : ''}" data-id="${photo.id}">
            <div class="photo-frame">
              ${buildImgTag(photo, idx)}
            </div>
          </article>
        `;
      });
      filteredHtml += `</div>`;
      gridEl.innerHTML = filteredHtml;
      markLoadedImages(gridEl);

      document.getElementById('btn-reset-filters')?.addEventListener('click', resetAllFilters);

      attachPhotoClickHandlers();
      return;
    }

    // Default: Render Master Curated Exhibition Groups
    let html = '';
    let globalIndex = 0;

    CURATED_EXHIBITION_GROUPS.forEach((group) => {
      const photos = group.photoIds.map((id) => photoMap.get(id)).filter(Boolean);

      if (group.type === '2l-1p') {
        const [p1, p2, p3] = photos;
        if (!p1 || !p2 || !p3) return;
        const i1 = globalIndex++;
        const i2 = globalIndex++;
        const i3 = globalIndex++;
        html += `
          <div class="gallery-row row-2l-1p">
            <div class="pair-landscapes-block">
              <div class="pair-photos">
                <article class="photo-card" data-id="${p1.id}" data-index="${i1}">
                  <div class="photo-frame">
                    ${buildImgTag(p1, i1)}
                  </div>
                </article>
                <article class="photo-card" data-id="${p2.id}" data-index="${i2}">
                  <div class="photo-frame">
                    ${buildImgTag(p2, i2)}
                  </div>
                </article>
              </div>
              <div class="pair-unified-text obsidian-text-fill" aria-label="${group.text}">
                <p class="unified-quote">
                  ${splitTextIntoChars(group.text)}
                </p>
              </div>
            </div>
            <article class="photo-card is-portrait" data-id="${p3.id}" data-index="${i3}">
              <div class="photo-frame">
                ${buildImgTag(p3, i3)}
              </div>
            </article>
          </div>
        `;
      } else if (group.type === '1p-2l') {
        const [p1, p2, p3] = photos;
        if (!p1 || !p2 || !p3) return;
        const i1 = globalIndex++;
        const i2 = globalIndex++;
        const i3 = globalIndex++;
        html += `
          <div class="gallery-row row-1p-2l">
            <article class="photo-card is-portrait" data-id="${p1.id}" data-index="${i1}">
              <div class="photo-frame">
                ${buildImgTag(p1, i1)}
              </div>
            </article>
            <div class="pair-landscapes-block">
              <div class="pair-photos">
                <article class="photo-card" data-id="${p2.id}" data-index="${i2}">
                  <div class="photo-frame">
                    ${buildImgTag(p2, i2)}
                  </div>
                </article>
                <article class="photo-card" data-id="${p3.id}" data-index="${i3}">
                  <div class="photo-frame">
                    ${buildImgTag(p3, i3)}
                  </div>
                </article>
              </div>
              <div class="pair-unified-text obsidian-text-fill" aria-label="${group.text}">
                <p class="unified-quote">
                  ${splitTextIntoChars(group.text)}
                </p>
              </div>
            </div>
          </div>
        `;
      } else if (group.type === '1p-1l-1p') {
        const [p1, p2, p3] = photos;
        if (!p1 || !p2 || !p3) return;
        const i1 = globalIndex++;
        const i2 = globalIndex++;
        const i3 = globalIndex++;
        html += `
          <div class="gallery-row">
            <article class="photo-card is-portrait" data-id="${p1.id}" data-index="${i1}">
              <div class="photo-frame">
                ${buildImgTag(p1, i1)}
              </div>
            </article>
            <div class="single-landscape-block">
              <article class="photo-card" data-id="${p2.id}" data-index="${i2}">
                <div class="photo-frame">
                  ${buildImgTag(p2, i2)}
                </div>
              </article>
              <div class="single-slot-text obsidian-text-fill" aria-label="${group.text}">
                <p class="unified-quote">
                  ${splitTextIntoChars(group.text)}
                </p>
              </div>
            </div>
            <article class="photo-card is-portrait" data-id="${p3.id}" data-index="${i3}">
              <div class="photo-frame">
                ${buildImgTag(p3, i3)}
              </div>
            </article>
          </div>
        `;
      } else if (group.type === '3p') {
        html += `<div class="gallery-row">`;
        photos.forEach((p) => {
          const idx = globalIndex++;
          html += `
            <article class="photo-card is-portrait" data-id="${p.id}" data-index="${idx}">
              <div class="photo-frame">
                ${buildImgTag(p, idx)}
              </div>
            </article>
          `;
        });
        html += `</div>`;
      } else if (group.type === '1p-2l-1p') {
        const [p1, p2, p3, p4] = photos;
        if (!p1 || !p2 || !p3 || !p4) return;
        const i1 = globalIndex++;
        const i2 = globalIndex++;
        const i3 = globalIndex++;
        const i4 = globalIndex++;
        html += `
          <div class="gallery-row row-1p-2l-1p">
            <article class="photo-card is-portrait" data-id="${p1.id}" data-index="${i1}">
              <div class="photo-frame">
                ${buildImgTag(p1, i1)}
              </div>
            </article>
            <div class="pair-landscapes-block">
              <div class="pair-photos">
                <article class="photo-card" data-id="${p2.id}" data-index="${i2}">
                  <div class="photo-frame">
                    ${buildImgTag(p2, i2)}
                  </div>
                </article>
                <article class="photo-card" data-id="${p3.id}" data-index="${i3}">
                  <div class="photo-frame">
                    ${buildImgTag(p3, i3)}
                  </div>
                </article>
              </div>
              <div class="pair-unified-text obsidian-text-fill" aria-label="${group.text}">
                <p class="unified-quote">
                  ${splitTextIntoChars(group.text)}
                </p>
              </div>
            </div>
            <article class="photo-card is-portrait" data-id="${p4.id}" data-index="${i4}">
              <div class="photo-frame">
                ${buildImgTag(p4, i4)}
              </div>
            </article>
          </div>
        `;
      }
    });

    gridEl.innerHTML = html;
    markLoadedImages(gridEl);
    attachPhotoClickHandlers();
    initTextFillAnimation();
  }

  function attachPhotoClickHandlers() {
    document.querySelectorAll('.photo-card').forEach((card) => {
      card.setAttribute('tabindex', '0');
      card.setAttribute('role', 'button');
      const photoId = card.getAttribute('data-id');
      const photo = state.data?.photos?.find((p) => p.id === photoId);
      if (photo) {
        card.setAttribute('aria-label', `View photograph: ${photo.title}`);

        // Hover & touch prefetch intent: start preloading full-res photo in background before click
        const prefetchHiRes = () => {
          if (photo.web_src) preloadImage(photo.web_src);
        };
        card.addEventListener('pointerenter', prefetchHiRes, { passive: true, once: true });
        card.addEventListener('touchstart', prefetchHiRes, { passive: true, once: true });
      }
      card.addEventListener('click', (e) => {
        if (e.target.closest('.pair-unified-text') || e.target.closest('.single-slot-text')) return;
        openLightboxById(photoId);
      });
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          if (e.target.closest('.pair-unified-text') || e.target.closest('.single-slot-text')) return;
          e.preventDefault();
          openLightboxById(photoId);
        }
      });
    });
  }

  /* --------------------------------------------------------------------------
     6b. Obsidian UI Text Fill Animation Controller
     https://www.obsidianui.dev/docs/text-fill-animation
     -------------------------------------------------------------------------- */
  let textFillListenersAttached = false;
  let updateTextFillsFn = null;

  function initTextFillAnimation() {
    const textContainers = document.querySelectorAll('.obsidian-text-fill');
    if (textContainers.length === 0) return;

    updateTextFillsFn = function () {
      const vh = window.innerHeight;

      textContainers.forEach((container) => {
        const rect = container.getBoundingClientRect();
        const chars = container.querySelectorAll('.split-chars');
        if (chars.length === 0) return;

        // Start filling when top enters viewport at 90% of vh, finish when reaching 38% of vh
        const startY = vh * 0.90;
        const endY = vh * 0.38;
        const totalDist = (startY - endY) + rect.height;
        const currentDist = startY - rect.top;
        const rawProgress = currentDist / totalDist;
        const progress = Math.max(0, Math.min(1, rawProgress));

        const totalChars = chars.length;
        chars.forEach((charEl, idx) => {
          const threshold = idx / totalChars;
          if (progress > threshold) {
            charEl.classList.add('show');
          } else {
            charEl.classList.remove('show');
          }
        });
      });
    };

    if (!textFillListenersAttached) {
      let ticking = false;
      function onScroll() {
        if (!ticking) {
          requestAnimationFrame(() => {
            if (updateTextFillsFn) updateTextFillsFn();
            ticking = false;
          });
          ticking = true;
        }
      }

      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onScroll, { passive: true });
      textFillListenersAttached = true;
    }

    updateTextFillsFn();
  }

  /* --------------------------------------------------------------------------
     8. Hero Video Playback Controller (Hardware-Accelerated Cinematic Autoplay)
     -------------------------------------------------------------------------- */
  function initHeroVideo() {
    const video = document.getElementById('hero-bg-video');
    if (!video) return;

    video.muted = true;
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Autoplay policy fallback: start playback on first touch/click/scroll gesture
        const resumePlayback = () => {
          video.play().catch(() => {});
        };
        document.addEventListener('touchstart', resumePlayback, { once: true, passive: true });
        document.addEventListener('click', resumePlayback, { once: true, passive: true });
        document.addEventListener('scroll', resumePlayback, { once: true, passive: true });
      });
    }
  }

  /* --------------------------------------------------------------------------
     8b. Header Scrolled State Controller
     -------------------------------------------------------------------------- */
  function initHeaderScroll() {
    const header = document.getElementById('site-header');
    if (!header) return;

    function checkHeader() {
      const hero = document.getElementById('hero-cinematic');
      const heroThreshold = hero ? hero.offsetHeight - 90 : window.innerHeight * 0.85;
      if (window.scrollY > heroThreshold) {
        header.classList.add('header-scrolled');
      } else {
        header.classList.remove('header-scrolled');
      }
    }

    window.addEventListener('scroll', checkHeader, { passive: true });
    checkHeader();
  }

  /* --------------------------------------------------------------------------
     9. Web Audio Shutter Sound & Mechanical Animations
     -------------------------------------------------------------------------- */
  function getAudioContext() {
    if (!audioCtx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        audioCtx = new AudioCtx();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function playMechanicalTick() {
    if (!state.soundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1400, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(350, ctx.currentTime + 0.02);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.025);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.025);
    } catch (e) {}
  }

  function playShutterSound() {
    if (!state.soundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      // 1. Initial mechanical curtain transient
      const bufferSize = Math.floor(ctx.sampleRate * 0.035);
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1900, now);
      filter.Q.setValueAtTime(3.5, now);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.2, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

      whiteNoise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      whiteNoise.start(now);

      // 2. Body resonance
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.05);
      oscGain.gain.setValueAtTime(0.2, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.connect(oscGain);
      oscGain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.05);

      // 3. Second curtain latch snap
      const latchTime = now + 0.045;
      const latchOsc = ctx.createOscillator();
      const latchGain = ctx.createGain();
      latchOsc.type = 'triangle';
      latchOsc.frequency.setValueAtTime(2400, latchTime);
      latchOsc.frequency.exponentialRampToValueAtTime(500, latchTime + 0.03);
      latchGain.gain.setValueAtTime(0.14, latchTime);
      latchGain.gain.exponentialRampToValueAtTime(0.001, latchTime + 0.03);
      latchOsc.connect(latchGain);
      latchGain.connect(ctx.destination);
      latchOsc.start(latchTime);
      latchOsc.stop(latchTime + 0.03);
    } catch (e) {}
  }

  /* --------------------------------------------------------------------------
     7. Interactive Paper Design Halftone Image Footer Shader
        (Authentic Tactile Paper Halftone Dots applied to Sundarbans Mangrove Photo)
     -------------------------------------------------------------------------- */
  function initFooterShader() {
    const footer = document.getElementById('site-footer');
    const canvas = document.getElementById('footer-shader-canvas');
    if (!footer || !canvas) return;

    let gl;
    try {
      gl = canvas.getContext('webgl', {
        alpha: true,
        antialias: false,
        premultipliedAlpha: false,
        powerPreference: 'high-performance'
      }) || canvas.getContext('experimental-webgl', { alpha: true });
    } catch (e) {
      console.warn('WebGL not supported for footer shader:', e);
      return;
    }
    if (!gl) return;

    const VERT_SRC = `
      attribute vec2 a_pos;
      varying vec2 v_uv;
      void main() {
        v_uv = a_pos * 0.5 + 0.5;
        gl_Position = vec4(a_pos, 0.0, 1.0);
      }
    `;

    const FRAG_SRC = `
      precision highp float;
      varying vec2 v_uv;

      uniform vec2 u_res;
      uniform sampler2D u_image;
      uniform float u_imgAspect;

      // Website Theme Colors:
      // Seafoam cyan paper background (#dff2f0) & coastal sea-teal (#45b8b2)
      const vec4 u_colorBack = vec4(0.8745, 0.9490, 0.9412, 1.0); // #dff2f0 seafoam paper
      const vec4 u_colorFront = vec4(0.2706, 0.7216, 0.6980, 1.0); // #45b8b2 coastal sea-teal

      // Procedural Hash & Value Noise (Paper Design Algorithm)
      float hash21(vec2 p) {
        p = fract(p * vec2(0.3183099, 0.3678794)) + 0.1;
        p += dot(p, p + 19.19);
        return fract(p.x * p.y);
      }

      vec2 rotate(vec2 uv, float th) {
        return mat2(cos(th), sin(th), -sin(th), cos(th)) * uv;
      }

      float valueNoise(vec2 st) {
        vec2 i = floor(st);
        vec2 f = fract(st);
        float a = hash21(i);
        float b = hash21(i + vec2(1.0, 0.0));
        float c = hash21(i + vec2(0.0, 1.0));
        float d = hash21(i + vec2(1.0, 1.0));
        vec2 u = f * f * (3.0 - 2.0 * f);
        float x1 = mix(a, b, u.x);
        float x2 = mix(c, d, u.x);
        return mix(x1, x2, u.y);
      }

      // Anchored cover mapping:
      // Canopy sits gracefully along the bottom edge, leaving the upper sky pure and serene for reading.
      vec2 getCoverUV(vec2 uv, float canvasAspect, float imgAspect) {
        float yAnchor = mix(0.12, 0.20, clamp((canvasAspect - 0.4) / 0.9, 0.0, 1.0));
        vec2 st = uv - vec2(0.5, yAnchor);
        if (canvasAspect > imgAspect) {
          st.y *= imgAspect / canvasAspect;
        } else {
          st.x *= canvasAspect / imgAspect;
        }
        return clamp(st + vec2(0.5, 0.5), 0.001, 0.999);
      }

      // Sample image luminance with lithograph tone curve
      float getLumAtPx(vec2 uv, float canvasAspect, float imgAspect) {
        vec2 coverUV = getCoverUV(uv, canvasAspect, imgAspect);
        vec4 tex = texture2D(u_image, vec2(coverUV.x, 1.0 - coverUV.y));

        // In trees, blue is very low (< 0.2). In sky, blue is high (> 0.6) and blue > red.
        // Sky factor lifts blue sky to match the cloud highlights for an exquisite, clean paper sky.
        float skyFactor = max(0.0, tex.b - max(tex.r, tex.g * 0.7));
        float rawLum = dot(vec3(0.2126, 0.7152, 0.0722), tex.rgb) + skyFactor * 0.5;

        // High-contrast lithograph curve:
        // Sky highlights gently clip to 1.0 so the sky is pure, clean paper for reading,
        // while the trees retain dense, beautiful halftone clusters and stipples.
        float lum = smoothstep(0.12, 0.65, rawLum);
        return lum;
      }

      // Paper Design Gooey Ball formula for hex grid
      float getGooeyBall(vec2 uv, float r, float baseR) {
        float d = length(uv - 0.5);
        float sizeRadius = 0.44; // hex grid radius
        sizeRadius = mix(sizeRadius * baseR, 0.0, r);
        d = 1.0 - smoothstep(0.0, sizeRadius, d);
        d = pow(d, 2.0 + baseR);
        return d;
      }

      void main() {
        float aspect = u_res.x / u_res.y;
        vec2 uv = v_uv;

        // Paper Design Hex Halftone Grid Sizing
        float stepMultiplier = 6.0;
        float u_size = 0.36; // fine, sharp print dots
        float cellsPerSide = mix(280.0, 16.0, pow(u_size, 0.7)) / stepMultiplier;
        float cellSizeY = 1.0 / cellsPerSide;
        vec2 pad = cellSizeY * vec2(1.0 / aspect, 1.0) * 0.7;

        vec2 gridUV = (uv - vec2(0.5)) / pad;
        float baseRadius = 1.30;

        float totalShape = 0.0;
        float stepSize = 1.0 / stepMultiplier;

        // Hexagonal staggered sampling loop (compatible across all WebGL 1 & 2 drivers)
        for (int ix = 0; ix < 6; ix++) {
          for (int iy = 0; iy < 6; iy++) {
            float x = (float(ix) - 2.5) * stepSize;
            float y = (float(iy) - 2.5) * stepSize;
            vec2 offset = vec2(x, y);

            if (mod(float(ix + iy), 2.0) == 1.0) {
              continue;
            }

            vec2 p = gridUV + offset;
            vec2 uv_i = floor(p);
            vec2 uv_f = fract(p);
            vec2 samplingUV = (uv_i + 0.5 - offset) * pad + vec2(0.5);

            if (samplingUV.x < 0.0 || samplingUV.x > 1.0 || samplingUV.y < 0.0 || samplingUV.y > 1.0) {
              continue;
            }

            float lum = getLumAtPx(samplingUV, aspect, u_imgAspect);
            float shape = getGooeyBall(uv_f, lum, baseRadius);
            totalShape += shape;
          }
        }

        // Gooey threshold with anti-aliasing
        float aa = 0.12;
        float th = 0.5;
        float finalShape = smoothstep(th - aa, th + aa, totalShape);

        // Analog ink edge grain mixer
        vec2 grainSize = mix(2000.0, 200.0, 0.45) * vec2(1.0, 1.0 / aspect);
        vec2 grainUV = (uv - 0.5) * grainSize + 0.5;
        float u_grainMixer = 0.14;
        if (u_grainMixer > 0.0) {
          float grain = valueNoise(grainUV);
          grain = smoothstep(0.55, 0.7 + 0.2 * u_grainMixer, grain);
          grain *= u_grainMixer;
          finalShape = mix(finalShape, 0.0, grain);
        }

        // Seamless upper boundary melt: gently taper ink & grain at the very top edge (uv.y > 0.88)
        // so transition from gallery paper is 100% invisible and seamless
        float topEdgeFade = smoothstep(1.0, 0.88, uv.y);
        finalShape *= topEdgeFade;

        // Coastal sea-teal ink color on transparent canvas for 100% seamless paper blend
        vec3 fgColor = u_colorFront.rgb;
        float inkAlpha = finalShape * 0.95;

        gl_FragColor = vec4(fgColor, inkAlpha);
      }
    `;

    function compileShader(type, src) {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.error('Shader compile error:', gl.getShaderInfoLog(s));
        gl.deleteShader(s);
        return null;
      }
      return s;
    }

    const vert = compileShader(gl.VERTEX_SHADER, VERT_SRC);
    const frag = compileShader(gl.FRAGMENT_SHADER, FRAG_SRC);
    if (!vert || !frag) return;

    const prog = gl.createProgram();
    gl.attachShader(prog, vert);
    gl.attachShader(prog, frag);
    gl.bindAttribLocation(prog, 0, 'a_pos');
    gl.linkProgram(prog);

    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(prog));
      return;
    }
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    const loc = {
      res: gl.getUniformLocation(prog, 'u_res'),
      img: gl.getUniformLocation(prog, 'u_image'),
      imgAspect: gl.getUniformLocation(prog, 'u_imgAspect')
    };

    let textureReady = false;
    let isVisible = false;

    function draw() {
      if (!textureReady || !isVisible) return;
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    // Load photo texture
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = 'assets/images/web/footer_halftone.jpg';
    img.onload = () => {
      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);

      const aspect = img.width / img.height;
      gl.uniform1f(loc.imgAspect, aspect);
      gl.uniform1i(loc.img, 0);

      textureReady = true;
      resize();
      draw();
    };

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, Math.floor(canvas.clientWidth * dpr));
      const h = Math.max(1, Math.floor(canvas.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      gl.viewport(0, 0, w, h);
      gl.uniform2f(loc.res, w, h);
      draw();
    }

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    resize();

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        isVisible = entry.isIntersecting;
        if (isVisible) {
          draw();
        }
        if (entry.intersectionRatio > 0.35) {
          document.body.classList.add('footer-active');
        } else {
          document.body.classList.remove('footer-active');
        }
      });
    }, { threshold: [0, 0.2, 0.35, 0.6, 0.9] });

    io.observe(footer);
  }

  /* --------------------------------------------------------------------------
     8. Clean Edgy Fine Art Lightbox Modal
     -------------------------------------------------------------------------- */
  function initLightbox() {
    if (!modalEl) return;

    const btnClose = document.getElementById('lb-close');
    const btnPrev = document.getElementById('lb-prev');
    const btnNext = document.getElementById('lb-next');

    btnClose?.addEventListener('click', closeLightbox);
    btnPrev?.addEventListener('click', prevPhoto);
    btnNext?.addEventListener('click', nextPhoto);

    modalEl.addEventListener('click', (e) => {
      const stage = document.getElementById('lb-stage');
      const container = document.getElementById('lb-img-container');
      if (e.target === modalEl || e.target === stage || e.target === container) {
        closeLightbox();
      }
    });

    window.addEventListener('keydown', (e) => {
      if (!state.lightboxOpen) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') prevPhoto();
      if (e.key === 'ArrowRight') nextPhoto();
    });

    // Touch swipe with vertical threshold check
    let touchStartX = 0;
    let touchStartY = 0;
    modalEl?.addEventListener('touchstart', (e) => {
      if (e.target.closest('#lb-close, #lb-prev, #lb-next')) return;
      touchStartX = e.changedTouches[0].clientX;
      touchStartY = e.changedTouches[0].clientY;
    }, { passive: true });

    modalEl?.addEventListener('touchend', (e) => {
      if (e.target.closest('#lb-close, #lb-prev, #lb-next')) return;
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const diffX = touchEndX - touchStartX;
      const diffY = touchEndY - touchStartY;
      // Only trigger horizontal swipe if movement is dominant and > 40px
      if (Math.abs(diffX) > 40 && Math.abs(diffX) > Math.abs(diffY) * 1.3) {
        if (diffX > 0) prevPhoto();
        else nextPhoto();
      }
    }, { passive: true });
  }

  function openLightboxById(photoId) {
    let idx = state.filteredPhotos.findIndex((p) => p.id === photoId);
    if (idx === -1 && state.data?.photos) {
      const found = state.data.photos.find((p) => p.id === photoId);
      if (found) {
        state.filteredPhotos = [...state.filteredPhotos, found];
        idx = state.filteredPhotos.length - 1;
      }
    }
    if (idx !== -1) {
      state.activePhotoIndex = idx;
      updateLightboxContent();
      playShutterSound();

      if (typeof modalEl.showModal === 'function') {
        modalEl.showModal();
      } else {
        modalEl.setAttribute('open', '');
      }
      state.lightboxOpen = true;
      document.body.style.overflow = 'hidden';
    }
  }

  function updateLightboxContent() {
    const photo = state.filteredPhotos[state.activePhotoIndex];
    if (!photo) return;
    const currentIdx = state.activePhotoIndex;

    if (lbImg) {
      // 1. Instantly display thumbnail (already resident in memory from gallery)
      // Eliminates the blank 1-3s loading gap completely (0ms perceived latency)
      const cachedThumb = photo.thumb_src || photo.web_src;
      const targetHiRes = photo.web_src || photo.thumb_src;

      if (preloadedImages.has(targetHiRes)) {
        lbImg.src = targetHiRes;
      } else {
        lbImg.src = cachedThumb;
        // Asynchronously stream full-resolution photograph in background
        const hiResLoader = new Image();
        hiResLoader.src = targetHiRes;
        hiResLoader.onload = () => {
          preloadedImages.add(targetHiRes);
          // Only swap if user is still on this photograph
          if (state.activePhotoIndex === currentIdx && lbImg) {
            lbImg.src = targetHiRes;
          }
        };
      }
      lbImg.alt = photo.title;

      // Retrigger 8-blade aperture diaphragm twist animation
      lbImg.classList.remove('aperture-reveal');
      void lbImg.offsetWidth;
      lbImg.classList.add('aperture-reveal');
    }
    if (lbTitle) lbTitle.textContent = photo.title;
    if (lbLocation) {
      lbLocation.textContent = photo.destination || '';
    }
    if (lbDesc) lbDesc.textContent = photo.description || '';
    if (lbCoords) lbCoords.textContent = '';
    if (lbCounter) lbCounter.textContent = '';

    // Prefetch adjacent full photos in background for zero-latency lightbox browsing
    if (state.filteredPhotos.length > 1) {
      const nextIdx = (state.activePhotoIndex + 1) % state.filteredPhotos.length;
      const prevIdx = (state.activePhotoIndex - 1 + state.filteredPhotos.length) % state.filteredPhotos.length;
      const nextPhoto = state.filteredPhotos[nextIdx];
      const prevPhoto = state.filteredPhotos[prevIdx];
      if (nextPhoto && nextPhoto.web_src) preloadImage(nextPhoto.web_src);
      if (prevPhoto && prevPhoto.web_src) preloadImage(prevPhoto.web_src);
    }
  }

  function prevPhoto() {
    if (state.filteredPhotos.length <= 1) return;
    state.activePhotoIndex = (state.activePhotoIndex - 1 + state.filteredPhotos.length) % state.filteredPhotos.length;
    playShutterSound();
    updateLightboxContent();
  }

  function nextPhoto() {
    if (state.filteredPhotos.length <= 1) return;
    state.activePhotoIndex = (state.activePhotoIndex + 1) % state.filteredPhotos.length;
    playShutterSound();
    updateLightboxContent();
  }

  function closeLightbox() {
    if (typeof modalEl.close === 'function') {
      modalEl.close();
    } else {
      modalEl.removeAttribute('open');
    }
    state.lightboxOpen = false;
    document.body.style.overflow = '';
  }

})();


