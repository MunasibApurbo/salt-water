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
    initGlowingScrollIndicator();
    initHeroVideo();
    initHeaderScroll();
    initLightbox();
    initTextFillAnimation();
    initViewfinderHUD();
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
    const photoMap = new Map(state.data.photos.map((p) => [p.id, p]));
    state.curatedPhotos = curatedOrderIds.map((id) => photoMap.get(id)).filter(Boolean);
    state.filteredPhotos = [...state.curatedPhotos];

    initWaypoints();
    initMapScrollInteraction();
    renderGallery();
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

    const chartSvg = document.getElementById('hydro-chart-svg');
    const telemetryEl = document.getElementById('svg-telemetry-loc');
    if (!chartSvg) return;

    const stations = chartSvg.querySelectorAll('.chart-station');

    // Default telemetry display (Waypoint 01)
    const wp1 = state.data.waypoints.find((w) => w.id === 'wp-1') || state.data.waypoints[0];
    function setTelemetry(wp) {
      if (!telemetryEl || !wp) return;
      telemetryEl.textContent = `WAYPOINT ${wp.num}: ${wp.title.toUpperCase()} (${wp.region.toUpperCase()})`;
    }
    setTelemetry(wp1);

    stations.forEach((stationEl) => {
      const wpId = stationEl.getAttribute('data-wp-id');
      const wp = state.data.waypoints.find((w) => w.id === wpId);
      if (!wp) return;

      const core = stationEl.querySelector('.station-core') || stationEl.querySelector('circle');

      function activateMagnetic() {
        stationEl.classList.add('magnetic-active');
        setTelemetry(wp);
      }

      function deactivateMagnetic() {
        stationEl.classList.remove('magnetic-active');
        if (state.activeWaypointFilter) {
          const activeWp = state.data.waypoints.find((w) => w.id === state.activeWaypointFilter);
          setTelemetry(activeWp || wp1);
        } else {
          setTelemetry(wp1);
        }
      }

      // Hover feedback for station nodes
      stationEl.addEventListener('mouseenter', activateMagnetic);
      stationEl.addEventListener('mouseleave', deactivateMagnetic);

      // Click to filter photo gallery and smoothly scroll
      stationEl.addEventListener('click', () => {
        state.activeWaypointFilter = wp.id;
        state.activeCategory = 'all';
        state.filteredPhotos = state.data.photos.filter((p) => p.waypoint_id === wp.id);
        renderGallery();
        playMechanicalTick();

        // Highlight active station
        stations.forEach((s) => {
          s.classList.toggle('active', s.getAttribute('data-wp-id') === wp.id);
        });

        setTelemetry(wp);

        const gallerySec = document.getElementById('gallery');
        if (gallerySec) {
          gallerySec.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });

    // Mobile swipe hint fade out on first scroll
    const mapWrap = document.getElementById('hydro-chart-wrap');
    const mapHint = document.getElementById('map-mobile-hint');
    if (mapWrap && mapHint) {
      let hintDismissed = false;
      mapWrap.addEventListener('scroll', () => {
        if (!hintDismissed && mapWrap.scrollLeft > 20) {
          hintDismissed = true;
          mapHint.style.opacity = '0';
          setTimeout(() => { mapHint.style.display = 'none'; }, 400);
        }
      }, { passive: true });
    }
  }

  /* --------------------------------------------------------------------------
     4b. Map Scroll Progress & Dynamic Station Enlargement
     -------------------------------------------------------------------------- */
  function initMapScrollInteraction() {
    const routeSec = document.getElementById('route');
    const chartSvg = document.getElementById('hydro-chart-svg');
    const telemetryEl = document.getElementById('svg-telemetry-loc');
    if (!routeSec || !chartSvg || !state.data || !state.data.waypoints) return;

    const stations = Array.from(chartSvg.querySelectorAll('.chart-station'));
    if (!stations.length) return;

    // Ordered station sequence along the route from North (Dhaka) to South (Bay of Bengal)
    const waypointOrder = ['wp-1', 'wp-2', 'wp-3', 'wp-4', 'wp-5', 'wp-7', 'wp-6', 'wp-8', 'wp-9'];
    const orderedStations = waypointOrder
      .map((id) => stations.find((s) => s.getAttribute('data-wp-id') === id))
      .filter(Boolean);

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
          orderedStations.forEach((s) => s.classList.remove('scroll-active'));
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
        orderedStations.length - 1,
        Math.floor(progress * orderedStations.length)
      );

      if (targetIdx !== currentActiveIdx) {
        currentActiveIdx = targetIdx;
        orderedStations.forEach((s, idx) => {
          s.classList.toggle('scroll-active', idx === targetIdx);
        });

        const activeStation = orderedStations[targetIdx];
        if (activeStation && telemetryEl && !state.activeWaypointFilter) {
          const wpId = activeStation.getAttribute('data-wp-id');
          const wp = state.data.waypoints.find((w) => w.id === wpId);
          if (wp) {
            telemetryEl.textContent = `WAYPOINT ${wp.num}: ${wp.title.toUpperCase()} (${wp.region.toUpperCase()})`;
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
      text: 'Left Dhaka late afternoon to beat the highway traffic. By sunset we were crossing Paksey, looking at the century-old steel girders next to the new bridge. Down on the muddy bank, a boatman was sitting alone in his dinghy, just watching the water drift by.'
    },
    {
      type: '3p',
      photoIds: ['adomya-bangla-khulna-university', 'navy-frigates-mongla', 'rupsha-bridge-span']
    },
    {
      type: '1p-2l',
      photoIds: ['submerged-brick-ghat', 'pashur-silos-barges', 'rupsha-bridge-truss'],
      text: 'Khulna smells like diesel, wet mud, and river silt. High tide came in fast around midday, drowning the old brick steps where people usually wash. Big cement barges were drifting past the silos while a cargo train rattled across the steel bridge above.'
    },
    {
      type: '2l-1p',
      photoIds: ['captain-at-the-helm', 'cruiser-the-sail-convoy', 'transmission-towers-wetlands'],
      text: 'The captain didn\'t use a GPS or check any charts—just stood there with one hand on the wooden wheel, navigating the shallow bends from memory. Behind us, two other boats followed in our wake, with tall power lines cutting straight across the marsh.'
    },
    {
      type: '1p-2l',
      photoIds: ['promenade-deck-night', 'cabin-window-view', 'searchlights-observation-deck'],
      text: 'After midnight it gets completely pitch black out on the river. No phone signal, no village lights, nothing. The crew turned on the rooftop searchlight every few minutes, cutting a sharp beam through the fog to make sure we weren\'t drifting into sunken logs.'
    },
    {
      type: '1p-1l-1p',
      photoIds: ['observation-watchtower', 'canopy-panorama-tower', 'sundari-tree-canopy'],
      text: 'Climbed up the watchtower at Karamjal just after the rain stopped. It\'s the only spot where you can see over the trees. In every direction it\'s just an endless carpet of green leaves, with the heat and humidity rising straight off the canopy.'
    },
    {
      type: '2l-1p',
      photoIds: ['karamjal-mangrove-boundary', 'lianas-over-creek', 'wild-water-lily-shapla'],
      text: 'We took a silent wooden dinghy down one of the narrower canals. The engine was cut off, so you could hear crabs clicking in the mud. Giant woody vines hung right into the water, and wild white shapla were blooming tucked away in the shade.'
    },
    {
      type: '1p-2l',
      photoIds: ['boatman-at-the-bow', 'blue-hour-anchorage', 'fishing-boat-sunset'],
      text: 'We dropped anchor right before twilight as the water turned into glass. A local boatman passed by heading home, rowing slowly without making a sound. The sky went from burnt orange to deep blue, and for an hour nobody on board said a word.'
    },
    {
      type: '2l-1p',
      photoIds: ['kashful-reeds-closeup', 'mangrove-coastal-edge', 'eroded-mangrove-stumps'],
      text: 'Walking along the coast near Kotka, the wind is relentless. White kashful grass bends flat against the sand dunes, and further down, dead mangrove stumps poke out of the wet mud like old bones where the sea has chewed away the forest.'
    },
    {
      type: '1p-2l',
      photoIds: ['river-crossing-at-dusk', 'jamtola-sea-beach', 'wet-sand-reflections'],
      text: 'Reaching Jamtola beach felt like coming to the edge of the world. At low tide the wet sand is completely smooth, reflecting the gray clouds like a mirror. You stand there with salt on your face, looking out into nothing but open sea.'
    },
    {
      type: 'single-p',
      photoIds: ['sand-bubbler-crab-patterns']
    }
  ];

  function splitTextIntoChars(text) {
    return text.split(' ').map((word) => {
      const chars = Array.from(word).map((char) => `<span class="split-chars">${char}</span>`).join('');
      return `<span class="split-word">${chars}</span>`;
    }).join('<span class="split-chars split-space">&nbsp;</span>');
  }

  /* --------------------------------------------------------------------------
     6. Render Gallery Photos Grid (Zero Resizing, Whole-In-One Unified Architecture)
     -------------------------------------------------------------------------- */
  function renderGallery() {
    if (!gridEl) return;
    if (!state.data || !state.data.photos || state.data.photos.length === 0) return;

    const photoMap = new Map(state.data.photos.map((p) => [p.id, p]));

    // Check if waypoint filter is active
    if (state.activeWaypointFilter) {
      const filtered = state.data.photos.filter((p) => p.waypoint_id === state.activeWaypointFilter);
      if (filtered.length === 0) {
        gridEl.innerHTML = `
          <div style="text-align: center; padding: 4rem 1rem;">
            <p style="font-family: var(--font-serif); font-size: 1.25rem; margin-bottom: 0.5rem;">No photographs found for this waypoint.</p>
            <button class="btn-retro-primary" id="btn-reset-filters" style="margin-top: 1rem;">Show All Photographs</button>
          </div>
        `;
        document.getElementById('btn-reset-filters')?.addEventListener('click', () => {
          state.activeWaypointFilter = null;
          state.filteredPhotos = [...state.curatedPhotos];
          renderGallery();
        });
        return;
      }

      let filteredHtml = `
        <div style="margin-bottom: 1.5rem; display: flex; align-items: center; justify-content: space-between;">
          <span style="font-family: var(--font-mono); font-size: 0.8rem; color: var(--ink-secondary); text-transform: uppercase; letter-spacing: 0.05em;">Filtered Waypoint Selection</span>
          <button class="btn-retro-primary" id="btn-reset-filters" style="font-size: 0.75rem; padding: 0.35rem 0.75rem;">Show Full Exhibition</button>
        </div>
        <div class="gallery-row" style="grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));">
      `;
      filtered.forEach((photo) => {
        const isPortrait = photo.orientation === 'portrait';
        filteredHtml += `
          <article class="photo-card ${isPortrait ? 'is-portrait' : ''}" data-id="${photo.id}">
            <div class="photo-frame">
              <img src="${photo.thumb_src}" alt="${photo.title}" class="photo-img" loading="lazy" width="${photo.width}" height="${photo.height}" />
            </div>
          </article>
        `;
      });
      filteredHtml += `</div>`;
      gridEl.innerHTML = filteredHtml;

      document.getElementById('btn-reset-filters')?.addEventListener('click', () => {
        state.activeWaypointFilter = null;
        state.filteredPhotos = [...state.curatedPhotos];
        renderGallery();
      });

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
        html += `
          <div class="gallery-row row-2l-1p">
            <div class="pair-landscapes-block">
              <div class="pair-photos">
                <article class="photo-card" data-id="${p1.id}" data-index="${globalIndex++}">
                  <div class="photo-frame">
                    <img src="${p1.thumb_src}" alt="${p1.title}" class="photo-img" loading="lazy" width="${p1.width}" height="${p1.height}" />
                  </div>
                </article>
                <article class="photo-card" data-id="${p2.id}" data-index="${globalIndex++}">
                  <div class="photo-frame">
                    <img src="${p2.thumb_src}" alt="${p2.title}" class="photo-img" loading="lazy" width="${p2.width}" height="${p2.height}" />
                  </div>
                </article>
              </div>
              <div class="pair-unified-text obsidian-text-fill" aria-label="${group.text}">
                <p class="unified-quote">
                  ${splitTextIntoChars(group.text)}
                </p>
              </div>
            </div>
            <article class="photo-card is-portrait" data-id="${p3.id}" data-index="${globalIndex++}">
              <div class="photo-frame">
                <img src="${p3.thumb_src}" alt="${p3.title}" class="photo-img" loading="lazy" width="${p3.width}" height="${p3.height}" />
              </div>
            </article>
          </div>
        `;
      } else if (group.type === '1p-2l') {
        const [p1, p2, p3] = photos;
        if (!p1 || !p2 || !p3) return;
        html += `
          <div class="gallery-row row-1p-2l">
            <article class="photo-card is-portrait" data-id="${p1.id}" data-index="${globalIndex++}">
              <div class="photo-frame">
                <img src="${p1.thumb_src}" alt="${p1.title}" class="photo-img" loading="lazy" width="${p1.width}" height="${p1.height}" />
              </div>
            </article>
            <div class="pair-landscapes-block">
              <div class="pair-photos">
                <article class="photo-card" data-id="${p2.id}" data-index="${globalIndex++}">
                  <div class="photo-frame">
                    <img src="${p2.thumb_src}" alt="${p2.title}" class="photo-img" loading="lazy" width="${p2.width}" height="${p2.height}" />
                  </div>
                </article>
                <article class="photo-card" data-id="${p3.id}" data-index="${globalIndex++}">
                  <div class="photo-frame">
                    <img src="${p3.thumb_src}" alt="${p3.title}" class="photo-img" loading="lazy" width="${p3.width}" height="${p3.height}" />
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
        html += `
          <div class="gallery-row">
            <article class="photo-card is-portrait" data-id="${p1.id}" data-index="${globalIndex++}">
              <div class="photo-frame">
                <img src="${p1.thumb_src}" alt="${p1.title}" class="photo-img" loading="lazy" width="${p1.width}" height="${p1.height}" />
              </div>
            </article>
            <div class="single-landscape-block">
              <article class="photo-card" data-id="${p2.id}" data-index="${globalIndex++}">
                <div class="photo-frame">
                  <img src="${p2.thumb_src}" alt="${p2.title}" class="photo-img" loading="lazy" width="${p2.width}" height="${p2.height}" />
                </div>
              </article>
              <div class="single-slot-text obsidian-text-fill" aria-label="${group.text}">
                <p class="unified-quote">
                  ${splitTextIntoChars(group.text)}
                </p>
              </div>
            </div>
            <article class="photo-card is-portrait" data-id="${p3.id}" data-index="${globalIndex++}">
              <div class="photo-frame">
                <img src="${p3.thumb_src}" alt="${p3.title}" class="photo-img" loading="lazy" width="${p3.width}" height="${p3.height}" />
              </div>
            </article>
          </div>
        `;
      } else if (group.type === '3p') {
        html += `<div class="gallery-row">`;
        photos.forEach((p) => {
          html += `
            <article class="photo-card is-portrait" data-id="${p.id}" data-index="${globalIndex++}">
              <div class="photo-frame">
                <img src="${p.thumb_src}" alt="${p.title}" class="photo-img" loading="lazy" width="${p.width}" height="${p.height}" />
              </div>
            </article>
          `;
        });
        html += `</div>`;
      } else if (group.type === 'single-p') {
        const [p1] = photos;
        if (!p1) return;
        html += `
          <div class="gallery-row" style="grid-template-columns: 1fr; max-width: 380px; margin: 0 auto;">
            <article class="photo-card is-portrait" data-id="${p1.id}" data-index="${globalIndex++}">
              <div class="photo-frame">
                <img src="${p1.thumb_src}" alt="${p1.title}" class="photo-img" loading="lazy" width="${p1.width}" height="${p1.height}" />
              </div>
            </article>
          </div>
        `;
      }
    });

    gridEl.innerHTML = html;
    attachPhotoClickHandlers();
    initTextFillAnimation();
  }

  function attachPhotoClickHandlers() {
    gridEl.querySelectorAll('.photo-card').forEach((card) => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.pair-unified-text') || e.target.closest('.single-slot-text')) return;
        const photoId = card.getAttribute('data-id');
        openLightboxById(photoId);
      });
    });
  }

  /* --------------------------------------------------------------------------
     6b. Obsidian UI Text Fill Animation Controller
     https://www.obsidianui.dev/docs/text-fill-animation
     -------------------------------------------------------------------------- */
  function initTextFillAnimation() {
    const textContainers = document.querySelectorAll('.obsidian-text-fill');
    if (textContainers.length === 0) return;

    function updateTextFills() {
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
            if (!charEl.classList.contains('show')) {
              charEl.classList.add('show');
            }
          } else {
            if (charEl.classList.contains('show')) {
              charEl.classList.remove('show');
            }
          }
        });
      });
    }

    let ticking = false;
    function onScroll() {
      if (!ticking) {
        requestAnimationFrame(() => {
          updateTextFills();
          ticking = false;
        });
        ticking = true;
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    updateTextFills();
  }




  /* --------------------------------------------------------------------------
     8. Hero Video Playback Controller & 11-Clip Reel Timeline (5s per clip)
     -------------------------------------------------------------------------- */
  function initHeroVideo() {
    const video = document.getElementById('hero-bg-video');
    const label = document.getElementById('film-current-clip');
    const segs = document.querySelectorAll('.film-seg');
    if (!video) return;

    video.muted = true;
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Autoplay policy fallback: start playback on first user gesture
        document.addEventListener('click', () => video.play(), { once: true });
        document.addEventListener('scroll', () => video.play(), { once: true });
      });
    }

    // 11 clips x 5s = 55s continuous loop
    video.addEventListener('timeupdate', () => {
      const t = video.currentTime;
      const clipIdx = Math.min(11, Math.floor(t / 5.05) + 1);
      
      if (label) {
        const padIdx = String(clipIdx).padStart(2, '0');
        label.textContent = `CLIP ${padIdx} / 11`;
      }

      if (segs.length > 0) {
        segs.forEach((seg, idx) => {
          const segNum = idx + 1;
          if (segNum === clipIdx) {
            seg.className = 'film-seg active';
          } else if (segNum < clipIdx) {
            seg.className = 'film-seg passed';
          } else {
            seg.className = 'film-seg';
          }
        });
      }
    });
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
     7. Rectangular Glowing Scroll Indicator (Obsidian UI Inspired)
     -------------------------------------------------------------------------- */
  function initGlowingScrollIndicator() {
    const indicator = document.getElementById('glowing-scroll-indicator');
    const track = document.getElementById('gsi-track');
    const barsContainer = document.getElementById('gsi-bars');
    const needle = document.getElementById('gsi-needle');

    if (!indicator || !track || !barsContainer || !needle) return;

    const BARS = 40;
    barsContainer.innerHTML = '';
    const bars = [];

    // Instantiate 40 bars
    for (let i = 0; i < BARS; i++) {
      const bar = document.createElement('span');
      bar.className = 'gsi-bar';
      barsContainer.appendChild(bar);
      bars.push(bar);
    }

    let ticking = false;
    let currentT = 0;
    let targetT = 0;
    let morphRaf = null;

    let isDragging = false;
    let isHovered = false;
    let idleTimer = null;
    const IDLE_DELAY = 2000;

    const container = indicator.querySelector('.gsi-container');
    const endCard = document.getElementById('the-end-card');

    function showIndicator() {
      indicator.classList.remove('gsi-idle');
    }

    function resetIdleTimer() {
      showIndicator();
      if (idleTimer) {
        clearTimeout(idleTimer);
        idleTimer = null;
      }
      if (isDragging || isHovered || currentT > 0.05) {
        return;
      }
      idleTimer = setTimeout(() => {
        if (!isDragging && !isHovered && currentT <= 0.05) {
          indicator.classList.add('gsi-idle');
        }
      }, IDLE_DELAY);
    }

    // Piecewise interpolation matching Obsidian UI useTransform
    function interpolate(x, inRange, outRange) {
      if (x <= inRange[0]) return outRange[0];
      if (x >= inRange[inRange.length - 1]) return outRange[outRange.length - 1];
      for (let i = 0; i < inRange.length - 1; i++) {
        if (x >= inRange[i] && x <= inRange[i + 1]) {
          const span = inRange[i + 1] - inRange[i];
          if (span === 0) return outRange[i + 1];
          const t = (x - inRange[i]) / span;
          return outRange[i] + t * (outRange[i + 1] - outRange[i]);
        }
      }
      return outRange[0];
    }

    // Measure loose scroll travel distance at the document bottom (Lower Acceleration)
    function getRunwayMetrics() {
      const maxScroll = Math.max(
        document.documentElement.scrollHeight - window.innerHeight,
        1
      );
      // Generous, low-acceleration scroll travel distance: 110vh or 850px
      const runwayDist = Math.max(650, Math.min(window.innerHeight * 1.1, 950));
      const runwayStart = Math.max(0, maxScroll - runwayDist);
      return { maxScroll, runwayDist, runwayStart };
    }

    function calcTargetT() {
      const currentScrollY = window.scrollY || window.pageYOffset || 0;
      const { runwayDist, runwayStart } = getRunwayMetrics();

      if (currentScrollY <= runwayStart) {
        return 0;
      }
      const raw = (currentScrollY - runwayStart) / runwayDist;
      return Math.min(Math.max(raw, 0), 1);
    }

    // Apply continuous scroll-driven morph with loose, airy ergonomics
    function applyMorph(t) {
      if (t > 0.05) {
        showIndicator();
        if (idleTimer) {
          clearTimeout(idleTimer);
          idleTimer = null;
        }
      }

      if (t <= 0.0005) {
        // Pristine resting state: reset inline overrides to default CSS
        indicator.style.width = '';
        indicator.style.height = '';
        indicator.style.bottom = '';
        indicator.style.zIndex = '';
        indicator.setAttribute('aria-label', 'Page Scroll Progress');

        if (container) {
          container.style.backgroundColor = '';
          container.style.borderColor = '';
          container.style.boxShadow = '';
        }

        track.style.opacity = '';
        track.style.pointerEvents = '';
        track.style.visibility = '';

        if (endCard) {
          endCard.style.opacity = '0';
          endCard.style.visibility = 'hidden';
          endCard.style.pointerEvents = 'none';
          endCard.style.transform = '';
          endCard.setAttribute('aria-hidden', 'true');
        }
        return;
      }

      // Perlin smootherstep: f'(0)=0 and f''(0)=0 for ultra-smooth zero-acceleration start
      const ease = t * t * t * (t * (t * 6 - 15) + 10);

      // Width calculation with loose breathing room
      const winW = window.innerWidth;
      const winH = window.innerHeight;

      const baseW = Math.min(winW - 32, 360);
      const maxW = winW <= 640 
        ? Math.max(winW - 24, 320)
        : Math.min(winW - 48, 1100);
      const w = baseW + (maxW - baseW) * ease;

      // Height calculation with loose breathing room
      const baseH = 72;
      const maxH = winH <= 640
        ? Math.min(winH - 32, 540)
        : Math.min(winH - 64, 720);
      const h = baseH + (maxH - baseH) * ease;

      // Vertical position: smoothly floats up towards center of viewport
      const baseBottom = Math.max(16, 20);
      const targetBottom = Math.max(baseBottom, (winH - maxH) / 2);
      const bottom = baseBottom + (targetBottom - baseBottom) * ease;

      indicator.style.width = `${w.toFixed(1)}px`;
      indicator.style.height = `${h.toFixed(1)}px`;
      indicator.style.bottom = `${bottom.toFixed(1)}px`;
      indicator.style.zIndex = t > 0.05 ? '9999' : '999';

      if (t >= 0.75) {
        indicator.setAttribute('aria-label', 'The End - Archive Concluded');
      } else {
        indicator.setAttribute('aria-label', 'Page Scroll Progress');
      }

      // Scrubber track fade out: fades out smoothly and is gone by t = 0.28
      if (t < 0.28) {
        const trackOpacity = 1 - (t / 0.28);
        track.style.opacity = trackOpacity.toFixed(3);
        track.style.pointerEvents = trackOpacity > 0.4 ? 'auto' : 'none';
        track.style.visibility = 'visible';
      } else {
        track.style.opacity = '0';
        track.style.pointerEvents = 'none';
        track.style.visibility = 'hidden';
      }

      // Container appearance: transitions to warm archival paper background
      if (container) {
        if (t > 0.35) {
          const borderAlpha = Math.max(0.2, 0.9 - 0.7 * ease);
          container.style.backgroundColor = 'var(--bg-paper)';
          container.style.borderColor = `rgba(18, 37, 40, ${borderAlpha.toFixed(2)})`;
          container.style.boxShadow = '0 24px 64px rgba(10, 22, 24, 0.16), var(--shadow-retro)';
        } else {
          container.style.backgroundColor = '';
          container.style.borderColor = '';
          container.style.boxShadow = '';
        }
      }

      // The End content: emerges smoothly and loosely between 0.45 and 1.0
      // Text NEVER leaks into the small box!
      if (endCard) {
        if (t < 0.45) {
          endCard.style.opacity = '0';
          endCard.style.visibility = 'hidden';
          endCard.style.pointerEvents = 'none';
          endCard.setAttribute('aria-hidden', 'true');
        } else {
          const cardProgress = (t - 0.45) / 0.55;
          const cardEase = cardProgress * cardProgress * (3 - 2 * cardProgress);
          endCard.style.opacity = cardEase.toFixed(3);
          endCard.style.visibility = 'visible';
          endCard.style.pointerEvents = t > 0.85 ? 'auto' : 'none';
          endCard.style.transform = `scale(${(0.96 + 0.04 * cardEase).toFixed(3)})`;
          endCard.setAttribute('aria-hidden', 'false');
        }
      }
    }

    // Damped animation step (gentler, lower acceleration lag)
    function stepMorph() {
      const diff = targetT - currentT;

      if (Math.abs(diff) > 0.0005) {
        // Lowered acceleration: 0.065 provides a calm, gradual, cinematic glide
        currentT += diff * 0.065;
        applyMorph(currentT);
        morphRaf = requestAnimationFrame(stepMorph);
      } else {
        currentT = targetT;
        applyMorph(currentT);
        morphRaf = null;
      }
    }

    function scheduleMorph() {
      targetT = calcTargetT();
      if (!morphRaf && (Math.abs(targetT - currentT) > 0.0008 || (currentT > 0 && currentT < 1))) {
        morphRaf = requestAnimationFrame(stepMorph);
      }
    }

    function update() {
      const currentScrollY = window.scrollY || window.pageYOffset || 0;
      const maxScroll = Math.max(
        document.documentElement.scrollHeight - window.innerHeight,
        1
      );
      const scrollProgress = Math.min(Math.max(currentScrollY / maxScroll, 0), 1);

      // Update ARIA attributes
      const pct = Math.round(scrollProgress * 100);
      indicator.setAttribute('aria-valuenow', pct);

      // Move needle along horizontal track (0% to 100%)
      needle.style.left = `${scrollProgress * 100}%`;

      // Update bars with exact Obsidian UI scale, opacity, and width curve
      for (let i = 0; i < BARS; i++) {
        const thisBarPosition = i / BARS;
        const preStep = Math.max(0, (i - 3) / BARS);
        const postStep = Math.min(1, (i + 3) / BARS);

        // Height: [5, 15, 35, 15, 5]
        const height = interpolate(
          scrollProgress,
          [0, preStep, thisBarPosition, postStep, 1],
          [5, 15, 35, 15, 5]
        );

        // Opacity: [0.25, 0.5, 1.0, 0.5, 0.25]
        const opacity = interpolate(
          scrollProgress,
          [0, preStep, thisBarPosition, postStep, 1],
          [0.25, 0.5, 1.0, 0.5, 0.25]
        );

        // Width: [1.5, 5, 1.5]
        const width = interpolate(
          scrollProgress,
          [0, thisBarPosition, 1],
          [1.5, 5, 1.5]
        );

        const bar = bars[i];
        bar.style.height = `${height}px`;
        bar.style.opacity = `${opacity}`;
        bar.style.width = `${width}px`;

        if (opacity > 0.6) {
          bar.style.backgroundColor = 'var(--accent-cyan)';
          bar.style.boxShadow = '0 0 8px rgba(23, 128, 125, 0.85), 0 0 16px rgba(20, 184, 166, 0.45)';
        } else {
          bar.style.backgroundColor = 'var(--ink-faint)';
          bar.style.boxShadow = 'none';
        }
      }

      // Schedule the loose scroll-driven morph
      scheduleMorph();

      ticking = false;
    }

    function onScroll() {
      resetIdleTimer();
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    }

    // Hover listener: keeps indicator visible while mouse is positioned over it
    indicator.addEventListener('mouseenter', () => {
      isHovered = true;
      showIndicator();
      if (idleTimer) {
        clearTimeout(idleTimer);
        idleTimer = null;
      }
    });

    indicator.addEventListener('mouseleave', () => {
      isHovered = false;
      resetIdleTimer();
    });

    // Interactive Click-to-Seek & Drag-to-Seek
    function seekFromEvent(e) {
      const rect = track.getBoundingClientRect();
      const clientX = e.touches && e.touches.length > 0 ? e.touches[0].clientX : e.clientX;
      if (clientX === undefined) return;
      const x = clientX - rect.left;
      const pct = Math.max(0, Math.min(1, x / rect.width));
      const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);

      window.scrollTo({
        top: pct * maxScroll,
        behavior: isDragging ? 'auto' : 'smooth'
      });
    }

    track.addEventListener('click', (e) => {
      seekFromEvent(e);
      resetIdleTimer();
    });

    track.addEventListener('mousedown', (e) => {
      isDragging = true;
      showIndicator();
      if (idleTimer) {
        clearTimeout(idleTimer);
        idleTimer = null;
      }
      seekFromEvent(e);
      document.body.style.userSelect = 'none';
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      seekFromEvent(e);
    });

    window.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        document.body.style.userSelect = '';
        resetIdleTimer();
      }
    });

    track.addEventListener('touchstart', (e) => {
      isDragging = true;
      showIndicator();
      if (idleTimer) {
        clearTimeout(idleTimer);
        idleTimer = null;
      }
      seekFromEvent(e);
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (!isDragging) return;
      seekFromEvent(e);
    }, { passive: true });

    window.addEventListener('touchend', () => {
      if (isDragging) {
        isDragging = false;
        resetIdleTimer();
      }
    });

    // Clicking the open card smoothly scrolls back to the gallery
    if (endCard) {
      endCard.addEventListener('click', () => {
        const { runwayStart } = getRunwayMetrics();
        window.scrollTo({
          top: Math.max(0, runwayStart - 40),
          behavior: 'smooth'
        });
      });
    }

    // Keyboard support: Escape returns to gallery
    window.addEventListener('keydown', (e) => {
      if (currentT > 0.5 && e.key === 'Escape') {
        const { runwayStart } = getRunwayMetrics();
        window.scrollTo({
          top: Math.max(0, runwayStart - 40),
          behavior: 'smooth'
        });
      }
    });

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', () => {
      scheduleMorph();
      onScroll();
    }, { passive: true });
    update();
    resetIdleTimer();
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
      if (e.target === modalEl) {
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
    const idx = state.filteredPhotos.findIndex((p) => p.id === photoId);
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

    if (lbImg) {
      lbImg.src = photo.web_src || photo.thumb_src;
      lbImg.alt = photo.title;

      // Retrigger 8-blade aperture diaphragm twist animation
      lbImg.classList.remove('aperture-reveal');
      void lbImg.offsetWidth;
      lbImg.classList.add('aperture-reveal');
    }
    if (lbTitle) lbTitle.textContent = photo.title;
    if (lbLocation) {
      const parts = [photo.destination, photo.coordinates].filter(Boolean);
      lbLocation.textContent = parts.join(' • ');
    }
    if (lbDesc) lbDesc.textContent = photo.description || '';
    if (lbCoords) lbCoords.textContent = '';
    if (lbCounter) {
      lbCounter.textContent = '';
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

  /* --------------------------------------------------------------------------
     9. 90s Camcorder Viewfinder HUD Live Clock
     -------------------------------------------------------------------------- */
  function initViewfinderHUD() {
    const timeEl = document.getElementById('hud-time-display');
    const dateEl = document.getElementById('hud-date-display');
    const tapeEl = document.getElementById('hud-tape-display');
    const video = document.getElementById('hero-bg-video');

    if (!timeEl && !dateEl && !tapeEl) return;

    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

    function updateClock() {
      const now = new Date();
      const d = String(now.getDate()).padStart(2, '0');
      const m = months[now.getMonth()];
      const y = now.getFullYear();

      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      const ss = String(now.getSeconds()).padStart(2, '0');

      if (dateEl) dateEl.textContent = `${d}.${m}.${y}`;
      if (timeEl) timeEl.textContent = `${hh}:${mm}:${ss}`;

      if (tapeEl && video && !isNaN(video.currentTime)) {
        const totalSec = Math.floor(video.currentTime);
        const frames = Math.floor((video.currentTime % 1) * 30);
        const tH = String(Math.floor(totalSec / 3600)).padStart(2, '0');
        const tM = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0');
        const tS = String(totalSec % 60).padStart(2, '0');
        const tF = String(frames).padStart(2, '0');
        tapeEl.textContent = `${tH}:${tM}:${tS}:${tF}`;
      }
    }

    updateClock();
    setInterval(updateClock, 200);
  }

})();


