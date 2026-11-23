/**
 * ESCUDO VIAL — MAIN JAVASCRIPT
 * Apple-style Scrollytelling, Canvas Scrubbing & Interactive Medical Profile
 */

document.addEventListener('DOMContentLoaded', () => {
  // Register GSAP plugins
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
  }

  /* ==========================================================================
     1. ASSET CONFIGURATION & FRAME PATHS
     ========================================================================== */
  const TOTAL_HERO_FRAMES = 131;
  const TOTAL_V2_FRAMES = 131;
  const TOTAL_V3_FRAMES = 131;

  const heroFrameUrl = (index) => `assets/frames/hero/frame_${String(index).padStart(4, '0')}.jpg`;
  const v2FrameUrl = (index) => `assets/frames/v2/frame_${String(index).padStart(4, '0')}.jpg`;
  const v3FrameUrl = (index) => `assets/frames/v3/frame_${String(index).padStart(4, '0')}.jpg`;

  /* ==========================================================================
     2. PRELOADER & INITIAL LOAD
     ========================================================================== */
  const preloader = document.getElementById('preloader');
  const loaderBar = document.getElementById('loader-bar');
  const progressText = document.getElementById('progress-percentage');

  const heroImages = [];
  const v2Images = [];
  const v3Images = [];

  let loadedHeroCount = 0;

  function preloadHeroFrames() {
    return new Promise((resolve) => {
      for (let i = 0; i < TOTAL_HERO_FRAMES; i++) {
        const img = new Image();
        img.src = heroFrameUrl(i);
        img.onload = () => {
          loadedHeroCount++;
          const percent = Math.round((loadedHeroCount / TOTAL_HERO_FRAMES) * 100);
          if (loaderBar) {
            const offset = 125.6 - (125.6 * (loadedHeroCount / TOTAL_HERO_FRAMES));
            loaderBar.style.strokeDashoffset = offset;
          }
          if (progressText) progressText.textContent = `${percent}%`;

          if (loadedHeroCount === TOTAL_HERO_FRAMES) {
            setTimeout(resolve, 300);
          }
        };
        img.onerror = () => {
          loadedHeroCount++;
          if (loadedHeroCount === TOTAL_HERO_FRAMES) resolve();
        };
        heroImages.push(img);
      }
    });
  }

  // Preload secondary chapters progressively in the background
  function preloadBackgroundFrames(imagesArray, urlHelper, total) {
    for (let i = 0; i < total; i++) {
      const img = new Image();
      img.src = urlHelper(i);
      imagesArray.push(img);
    }
  }

  preloadHeroFrames().then(() => {
    // Hide preloader smoothly
    if (preloader) {
      preloader.classList.add('fade-out');
    }

    // Initialize Canvas Scrubbing Engines
    initScrollytelling();

    // Start background preload for Chapter 2 and 3
    preloadBackgroundFrames(v2Images, v2FrameUrl, TOTAL_V2_FRAMES);
    preloadBackgroundFrames(v3Images, v3FrameUrl, TOTAL_V3_FRAMES);
  });

  /* ==========================================================================
     3. HIGH-PERFORMANCE CANVAS SCRUBBING ENGINE
     ========================================================================== */
  class CanvasScrubber {
    constructor(canvasId, imagesArray, totalFrames) {
      this.canvas = document.getElementById(canvasId);
      if (!this.canvas) return;
      this.ctx = this.canvas.getContext('2d');
      this.images = imagesArray;
      this.totalFrames = totalFrames;
      this.currentFrame = 0;
      this.targetFrame = 0;
      this.isRendering = false;

      this.resizeCanvas();
      window.addEventListener('resize', () => this.resizeCanvas());

      // Start animation loop
      this.render();
    }

    resizeCanvas() {
      if (!this.canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.canvas.width = window.innerWidth * dpr;
      this.canvas.height = window.innerHeight * dpr;
      this.ctx.scale(dpr, dpr);
      this.drawFrame(Math.round(this.currentFrame));
    }

    drawFrame(frameIndex) {
      const img = this.images[frameIndex];
      if (!img || !img.complete || img.naturalWidth === 0) return;

      const w = window.innerWidth;
      const h = window.innerHeight;
      this.ctx.clearRect(0, 0, w, h);

      // Aspect Ratio "Cover" calculation
      const imgRatio = img.naturalWidth / img.naturalHeight;
      const screenRatio = w / h;
      let drawW, drawH, offsetX, offsetY;

      if (screenRatio > imgRatio) {
        drawW = w;
        drawH = w / imgRatio;
        offsetX = 0;
        offsetY = (h - drawH) / 2;
      } else {
        drawW = h * imgRatio;
        drawH = h;
        offsetX = (w - drawW) / 2;
        offsetY = 0;
      }

      this.ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
    }

    setTargetProgress(progress) {
      this.targetFrame = Math.max(0, Math.min(this.totalFrames - 1, progress * (this.totalFrames - 1)));
    }

    render() {
      // Lerp for cinematic deceleration (Apple fluidity)
      const diff = this.targetFrame - this.currentFrame;
      if (Math.abs(diff) > 0.01) {
        this.currentFrame += diff * 0.12;
        this.drawFrame(Math.round(this.currentFrame));
      }
      requestAnimationFrame(() => this.render());
    }
  }

  /* ==========================================================================
     4. GSAP SCROLLTRIGGER SCENE ORCHESTRATION
     ========================================================================== */
  function initScrollytelling() {
    // ---------------- Chapter 1: Hero Scene ----------------
    const heroScrubber = new CanvasScrubber('hero-canvas', heroImages, TOTAL_HERO_FRAMES);

    // Initial draw when first image is ready
    if (heroImages[0] && heroImages[0].complete) {
      heroScrubber.drawFrame(0);
    }

    ScrollTrigger.create({
      trigger: '#hero-scene',
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.5,
      onUpdate: (self) => {
        heroScrubber.setTargetProgress(self.progress);

        // Hide mouse prompt after initial scroll
        const scrollPrompt = document.getElementById('scroll-prompt');
        if (scrollPrompt) {
          scrollPrompt.style.opacity = self.progress > 0.05 ? '0' : '1';
        }
      }
    });

    // Animate Hero Narrative Phases
    const heroTimeline = gsap.timeline({
      scrollTrigger: {
        trigger: '#hero-scene',
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1
      }
    });

    // Phase 1 (0.0 -> 0.20)
    heroTimeline
      .to('#phase-1', { opacity: 0, y: -25, scale: 0.98, duration: 0.1, ease: 'power2.in' }, 0.14)

      // Phase 2 (0.24 -> 0.46)
      .fromTo('#phase-2', { opacity: 0, y: 30, scale: 0.97 }, { opacity: 1, y: 0, scale: 1, duration: 0.1, ease: 'power2.out' }, 0.24)
      .to('#phase-2', { opacity: 0, y: -25, scale: 0.98, duration: 0.08, ease: 'power2.in' }, 0.44)

      // Phase 3 (0.50 -> 0.70)
      .fromTo('#phase-3', { opacity: 0, y: 30, scale: 0.97 }, { opacity: 1, y: 0, scale: 1, duration: 0.1, ease: 'power2.out' }, 0.50)
      .to('#phase-3', { opacity: 0, y: -25, scale: 0.98, duration: 0.08, ease: 'power2.in' }, 0.68)

      // Phase 4 (0.74 -> 1.0)
      .fromTo('#phase-4', { opacity: 0, y: 30, scale: 0.97 }, { opacity: 1, y: 0, scale: 1, duration: 0.1, ease: 'power2.out' }, 0.74)
      .to('#phase-4', { opacity: 1, duration: 0.15 }, 0.88);

    // ---------------- Chapter 2: Preparation Scene ----------------
    const prepScrubber = new CanvasScrubber('prep-canvas', v2Images, TOTAL_V2_FRAMES);

    ScrollTrigger.create({
      trigger: '#prep-scene',
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.5,
      onUpdate: (self) => {
        prepScrubber.setTargetProgress(self.progress);
      }
    });

    const prepTimeline = gsap.timeline({
      scrollTrigger: {
        trigger: '#prep-scene',
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1
      }
    });

    prepTimeline
      .fromTo('#prep-phase-1', { opacity: 0, y: 35, scale: 0.97 }, { opacity: 1, y: 0, scale: 1, duration: 0.15 }, 0.05)
      .to('#prep-phase-1', { opacity: 0, y: -25, duration: 0.1 }, 0.42)
      .fromTo('#prep-phase-2', { opacity: 0, y: 35, scale: 0.97 }, { opacity: 1, y: 0, scale: 1, duration: 0.15 }, 0.55)
      .to('#prep-phase-2', { opacity: 1, duration: 0.2 }, 0.75);

    // ---------------- Chapter 3: Highway Scene ----------------
    const roadScrubber = new CanvasScrubber('road-canvas', v3Images, TOTAL_V3_FRAMES);

    ScrollTrigger.create({
      trigger: '#en-ruta',
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.5,
      onUpdate: (self) => {
        roadScrubber.setTargetProgress(self.progress);
      }
    });

    const roadTimeline = gsap.timeline({
      scrollTrigger: {
        trigger: '#en-ruta',
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1
      }
    });

    roadTimeline
      .fromTo('#road-phase-1', { opacity: 0, y: 35, scale: 0.97 }, { opacity: 1, y: 0, scale: 1, duration: 0.15 }, 0.05)
      .to('#road-phase-1', { opacity: 0, y: -25, duration: 0.1 }, 0.42)
      .fromTo('#road-phase-2', { opacity: 0, y: 35, scale: 0.97 }, { opacity: 1, y: 0, scale: 1, duration: 0.15 }, 0.55)
      .to('#road-phase-2', { opacity: 1, duration: 0.2 }, 0.75);

    // ---------------- Staggered Entry Animations for Cards ----------------
    gsap.utils.toArray('.metric-card, .pillar-box, .flow-card, .spec-item, .pricing-card').forEach((el) => {
      gsap.from(el, {
        scrollTrigger: {
          trigger: el,
          start: 'top 88%',
          toggleActions: 'play none none reverse'
        },
        opacity: 0,
        y: 25,
        duration: 0.7,
        ease: 'power3.out'
      });
    });

    // ---------------- Animated Number Counters ----------------
    const counterElements = document.querySelectorAll('.counter');
    counterElements.forEach((counter) => {
      const target = +counter.getAttribute('data-target');
      ScrollTrigger.create({
        trigger: counter,
        start: 'top 90%',
        onEnter: () => {
          gsap.to(counter, {
            innerText: target,
            duration: 1.8,
            snap: { innerText: 1 },
            ease: 'power2.out'
          });
        }
      });
    });
  }

  /* ==========================================================================
     5. INTERACTIVE CALL CENTER & CENTRAL MONITORING SIMULATOR
     ========================================================================== */
  // Live Monitor Digital Clock
  const clockEl = document.getElementById('monitor-live-clock');
  function updateLiveClock() {
    if (!clockEl) return;
    const now = new Date();
    const hrs = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');
    const secs = String(now.getSeconds()).padStart(2, '0');
    clockEl.textContent = `${hrs}:${mins}:${secs}`;
  }
  updateLiveClock();
  setInterval(updateLiveClock, 1000);

  // Elapsed Alert Timer
  let elapsedSeconds = 4;
  const elapsedTimerEl = document.getElementById('alert-elapsed-timer');
  let alertTimerInterval = setInterval(() => {
    if (!elapsedTimerEl) return;
    elapsedSeconds++;
    const s = String(elapsedSeconds % 60).padStart(2, '0');
    const m = String(Math.floor(elapsedSeconds / 60)).padStart(2, '0');
    elapsedTimerEl.textContent = `${m}:${s}s`;
  }, 1000);

  // Dispatch Ambulance Simulation
  window.despacharSimulacion = function () {
    playEmergencyChime();
    const btnText = document.getElementById('dispatch-btn-text');
    const banner = document.getElementById('dispatch-confirmation-banner');
    if (btnText) btnText.textContent = '✅ Despacho en Curso';
    if (banner) {
      banner.classList.remove('hidden');
    }
  };

  // Notify Family Contacts Simulation
  window.notificarFamiliares = function () {
    playEmergencyChime();
    alert('📞 [CENTRAL ESCUDO VIAL]\n\nEnlazando llamada automática prioritaria y enviando SMS con coordenadas GPS en vivo a los contactos SOS registrados:\n• Mariana Silva (Esposa - +58 414 839-2011)\n• Carlos Mendoza (Hermano - +58 412 550-9182)');
  };

  // Replay Simulator Event
  window.reiniciarSimulacionCentral = function () {
    playEmergencyChime();
    elapsedSeconds = 1;
    if (elapsedTimerEl) elapsedTimerEl.textContent = '00:01s';
    const btnText = document.getElementById('dispatch-btn-text');
    const banner = document.getElementById('dispatch-confirmation-banner');
    if (btnText) btnText.textContent = 'Despachar Ambulancia';
    if (banner) banner.classList.add('hidden');

    const card = document.getElementById('monitor-alert-card');
    if (card) {
      card.style.animation = 'none';
      card.offsetHeight;
      card.style.animation = 'tabFadeIn 0.4s ease';
    }
  };

  // Web Audio API emergency alert sound synthesizer (no external audio files needed)
  function playEmergencyChime() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // Note A5
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.35); // Glide down to A4

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } catch (e) {
      // Audio autoplay policy fallback
    }
  }

  /* ==========================================================================
     6. FAQ ACCORDION
     ========================================================================== */
  const faqQuestions = document.querySelectorAll('.faq-question');
  faqQuestions.forEach((q) => {
    q.addEventListener('click', () => {
      const item = q.parentElement;
      const isActive = item.classList.contains('active');

      // Close all others
      document.querySelectorAll('.faq-item').forEach((i) => i.classList.remove('active'));

      if (!isActive) {
        item.classList.add('active');
      }
    });
  });

  /* ==========================================================================
     7. STICKY NAVBAR SCROLL BEHAVIOR
     ========================================================================== */
  const headerNav = document.getElementById('header-nav');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      headerNav.classList.add('scrolled');
    } else {
      headerNav.classList.remove('scrolled');
    }
  }, { passive: true });

});
