const FADE_MS = 420;
let current = 'home';
let noteOpen = false;
let busy = false;

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

function trapFocus(container) {
  const focusable = $$(
    'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])',
    container
  ).filter(el => !el.disabled && el.offsetParent !== null);

  if (!focusable.length) return;

  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  function handler(e) {
    if (e.key !== 'Tab') return;
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  container.addEventListener('keydown', handler);
  first.focus();

  return () => container.removeEventListener('keydown', handler);
}

let releaseTrap = null;

function openNote(id) {
  const overlay = $(`#${id}`);
  if (!overlay || noteOpen) return;
  noteOpen = true;
  overlay.hidden = false;
  overlay.classList.add('open');
  overlay.scrollTop = 0;
  document.body.style.overflow = 'hidden';

  requestAnimationFrame(() => {
    releaseTrap = trapFocus(overlay);
  });
}

function closeNote(immediate = false) {
  const open = $('.note-overlay.open');
  if (!open) return;

  if (releaseTrap) {
    releaseTrap();
    releaseTrap = null;
  }

  const finishClose = () => {
    open.classList.remove('open');
    open.style.opacity = '';
    open.querySelector('.note-detail').style.transform = '';
    open.hidden = true;
    noteOpen = false;
    document.body.style.overflow = '';

    const noteId = open.id;
    const trigger = $(`.note-card[data-note="${noteId}"]`);
    if (trigger && !immediate) trigger.focus();
  };

  if (immediate) {
    finishClose();
    return;
  }

  open.style.opacity = '0';
  open.querySelector('.note-detail').style.transform = 'translateY(18px)';
  setTimeout(finishClose, FADE_MS);
}

const navPill = $('.nav-pill');

function updatePill(animate = true) {
  const activeLink = $('nav a.active');
  if (!activeLink || !navPill) return;

  const navRect = nav.getBoundingClientRect();
  const linkRect = activeLink.getBoundingClientRect();
  const left = linkRect.left - navRect.left;
  const width = linkRect.width;

  if (!animate) {
    navPill.style.transition = 'none';
  }

  navPill.style.left = `${left}px`;
  navPill.style.width = `${width}px`;

  if (!animate) {
    void navPill.offsetHeight;
    navPill.style.transition = '';
  }
}

window.addEventListener('resize', () => {
  updatePill(false);
}, { passive: true });

function goTo(id) {
  if (id === current || busy) return;
  if (noteOpen) closeNote(true);
  busy = true;

  const outEl = $(`#page-${current}`);
  const inEl = $(`#page-${id}`);

  outEl.style.opacity = '0';
  outEl.style.transform = 'translateY(12px)';

  setTimeout(() => {
    outEl.classList.remove('active');
    outEl.style.opacity = '';
    outEl.style.transform = '';
    outEl.hidden = true;

    inEl.hidden = false;
    inEl.scrollTop = 0;
    inEl.style.opacity = '0';
    inEl.style.transform = 'translateY(-18px)';
    inEl.classList.add('active');

    void inEl.offsetHeight;

    inEl.style.opacity = '1';
    inEl.style.transform = 'translateY(0)';

    const prev = current;
    current = id;
    busy = false;

    $$('nav a').forEach(a => {
      const isActive = a.dataset.page === id;
      a.classList.toggle('active', isActive);
      a.setAttribute('aria-current', isActive ? 'page' : 'false');
    });

    updatePill();

    if (TypedText) {
      if (id === 'home') TypedText.resume();
      else TypedText.pause();
    }

    if (MusicTitle) {
      if (id === 'about') MusicTitle.resume();
      else MusicTitle.pause();
    }

    if (MusicPreview && id !== 'about') MusicPreview.stop();

    if (AboutSlideshow) {
      if (id === 'about') AboutSlideshow.start();
      else AboutSlideshow.stop();
    }

    if (isMobile) {
      setTimeout(() => {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
      }, 50);
    }
  }, FADE_MS);
}

const nav = $('nav');
nav.addEventListener('click', e => {
  const link = e.target.closest('a[data-page]');
  if (link) goTo(link.dataset.page);
});

if (isTouch) {
  $$('nav a').forEach(link => {
    link.addEventListener('touchstart', () => {
      link.style.transform = 'scale(0.95)';
    }, { passive: true });

    link.addEventListener('touchend', () => {
      link.style.transform = '';
    }, { passive: true });

    link.addEventListener('touchcancel', () => {
      link.style.transform = '';
    }, { passive: true });
  });
}

nav.addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    const link = e.target.closest('a[data-page]');
    if (link) goTo(link.dataset.page);
  }

  const links = $$('a[data-page]', nav);
  const idx = links.indexOf(e.target);
  if (idx === -1) return;

  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
    e.preventDefault();
    links[(idx + 1) % links.length].focus();
  } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
    e.preventDefault();
    links[(idx - 1 + links.length) % links.length].focus();
  }
});

if (isTouch) {
  const addTouchFeedback = (selector) => {
    $$(selector).forEach(card => {
      card.addEventListener('touchstart', () => {
        card.style.transform = 'scale(0.98)';
      }, { passive: true });

      card.addEventListener('touchend', () => {
        card.style.transform = '';
      }, { passive: true });

      card.addEventListener('touchcancel', () => {
        card.style.transform = '';
      }, { passive: true });
    });
  };

  window.addEventListener('load', () => {
    addTouchFeedback('.project-card');
    addTouchFeedback('.note-card');
    addTouchFeedback('.portal-btn');
  });
}

const writingGrid = $('.writing-grid');
if (writingGrid) {
  writingGrid.addEventListener('click', e => {
    const card = e.target.closest('.note-card');
    if (card?.dataset.note) openNote(card.dataset.note);
  });

  writingGrid.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const card = e.target.closest('.note-card');
      if (card?.dataset.note) openNote(card.dataset.note);
    }
  });

  if (isTouch) {
    $$('.note-card').forEach(card => {
      card.addEventListener('touchstart', () => {
        card.style.transform = 'scale(0.98)';
      }, { passive: true });

      card.addEventListener('touchend', () => {
        card.style.transform = '';
      }, { passive: true });

      card.addEventListener('touchcancel', () => {
        card.style.transform = '';
      }, { passive: true });
    });
  }
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && noteOpen) closeNote();
});

const overlays = $$('.note-overlay');
overlays.forEach(overlay => {
  overlay.addEventListener('click', e => {
    if (e.target === overlay) closeNote();
  });

  if (isTouch) {
    let startY = 0;
    let startX = 0;
    let startTime = 0;

    overlay.addEventListener('touchstart', e => {
      startY = e.touches[0].clientY;
      startX = e.touches[0].clientX;
      startTime = Date.now();
    }, { passive: true });

    overlay.addEventListener('touchend', e => {
      const endY = e.changedTouches[0].clientY;
      const endX = e.changedTouches[0].clientX;
      const diffY = endY - startY;
      const diffX = endX - startX;
      const elapsed = Date.now() - startTime;

      if (diffY > 100 && Math.abs(diffY) > Math.abs(diffX) * 1.5 && elapsed < 300) {
        closeNote();
      }
    }, { passive: true });
  }
});

const home = $('#page-home');
window.addEventListener('load', () => {
  home.style.opacity = '0';
  home.style.transform = 'translateY(-18px)';
  void home.offsetHeight;
  home.style.opacity = '1';
  home.style.transform = 'translateY(0)';

  updatePill(false);
});

const TopoAnimation = (() => {
  const canvas = $('#topo-canvas');
  if (!canvas) return null;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return null;

  const ctx = canvas.getContext('2d');
  let W, H, frame = 0;
  const RES = isMobile ? 80 : 120;
  const LEVELS = isMobile ? 7 : 10;
  const zMin = -2.3, zMax = 2.3;
  let animId = null;
  let lastTime = 0;
  const FPS_CAP = isMobile ? 24 : 30;
  const frameInterval = 1000 / FPS_CAP;

  const CASES = {
    1: [3, 0], 2: [0, 1], 3: [3, 1], 4: [1, 2],
    5: [3, 0, 1, 2], 6: [0, 2], 7: [3, 2],
    8: [2, 3], 9: [0, 2], 10: [0, 1, 2, 3],
    11: [1, 2], 12: [3, 1], 13: [0, 1], 14: [3, 0]
  };

  const Z = new Array(RES);
  for (let j = 0; j < RES; j++) {
    Z[j] = new Float32Array(RES);
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    ctx.scale(dpr, dpr);
  }

  function lerp(a, b, va, vb, th) {
    if (Math.abs(vb - va) < 1e-9) return a;
    return a + (b - a) * (th - va) / (vb - va);
  }

  function generate(t) {
    const f1 = 0.8 + 0.3 * Math.sin(t * 0.1);
    const f2 = 0.9 + 0.3 * Math.cos(t * 0.15);
    const driftX = Math.sin(t * 0.13) * 3.2;
    const driftY = Math.cos(t * 0.17) * 2.6;

    for (let j = 0; j < RES; j++) {
      const gy = (j / (RES - 1)) * 12 - 6;
      for (let i = 0; i < RES; i++) {
        const gx = (i / (RES - 1)) * 12 - 6;
        const wx = Math.sin(gy * f1 + t * 0.4) * 1.6 + driftX;
        const wy = Math.cos(gx * f2 - t * 0.3) * 1.6 + driftY;
        const nx = gx * 0.7 + wx;
        const ny = gy * 0.7 + wy;
        let z = Math.sin(nx * 1.2 + Math.cos(ny * 0.9 + t * 0.2)) * Math.cos(ny * 1.3 + Math.sin(nx * 0.8 - t * 0.2));
        z += 0.8 * Math.sin(nx * 0.6 + t * 0.3) * Math.cos(ny * 0.4 - t * 0.1);
        z += 0.5 * Math.cos(nx * 1.5 - ny * 1.1 + t * 0.4);
        Z[j][i] = z;
      }
    }
    return Z;
  }

  function draw(timestamp) {
    animId = requestAnimationFrame(draw);

    const elapsed = timestamp - lastTime;
    if (elapsed < frameInterval) return;
    lastTime = timestamp - (elapsed % frameInterval);

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const t = frame * 0.016;
    const sx = W / (RES - 1);
    const sy = H / (RES - 1);
    const Zdata = generate(t);

    ctx.strokeStyle = 'rgba(232,201,122,0.55)';
    ctx.lineWidth = 1.0;
    ctx.beginPath();

    for (let lv = 0; lv < LEVELS; lv++) {
      const th = zMin + (lv / (LEVELS - 1)) * (zMax - zMin);
      for (let j = 0; j < RES - 1; j++) {
        for (let i = 0; i < RES - 1; i++) {
          const z00 = Zdata[j][i], z10 = Zdata[j][i + 1];
          const z01 = Zdata[j + 1][i], z11 = Zdata[j + 1][i + 1];
          const sq = (z00 >= th ? 1 : 0) | (z10 >= th ? 2 : 0) | (z11 >= th ? 4 : 0) | (z01 >= th ? 8 : 0);
          if (sq === 0 || sq === 15) continue;

          const x0 = i * sx, x1 = (i + 1) * sx;
          const y0 = j * sy, y1 = (j + 1) * sy;
          const pts = [
            [lerp(x0, x1, z00, z10, th), y0],
            [x1, lerp(y0, y1, z10, z11, th)],
            [lerp(x0, x1, z01, z11, th), y1],
            [x0, lerp(y0, y1, z00, z01, th)]
          ];
          const idx = CASES[sq];
          if (!idx) continue;
          ctx.moveTo(pts[idx[0]][0], pts[idx[0]][1]);
          ctx.lineTo(pts[idx[1]][0], pts[idx[1]][1]);
          if (idx.length === 4) {
            ctx.moveTo(pts[idx[2]][0], pts[idx[2]][1]);
            ctx.lineTo(pts[idx[3]][0], pts[idx[3]][1]);
          }
        }
      }
    }
    ctx.stroke();
    frame++;
  }

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      resize();
      updatePill(false);
    }, isMobile ? 150 : 100);
  }, { passive: true });

  window.addEventListener('orientationchange', () => {
    setTimeout(() => {
      resize();
      updatePill(false);
    }, 200);
  }, { passive: true });

  resize();
  animId = requestAnimationFrame(draw);

  return {
    pause() { if (animId) cancelAnimationFrame(animId); animId = null; },
    resume() { if (!animId) animId = requestAnimationFrame(draw); }
  };
})();

const TypedText = (() => {
  const el = $('#typed-text');
  if (!el) return null;

  const texts = [
    "I'm interested in programs.",
    "i love cats <3",
    "I'm a hopeless romantic too :D"
  ];

  let idx = 0, ci = 0, del = false;
  let timer = null;
  let paused = false;

  const tick = () => {
    if (paused) return;

    const cur = texts[idx];
    if (!del) {
      el.textContent = cur.slice(0, ci + 1);
      ci++;
      if (ci === cur.length) {
        del = true;
        timer = setTimeout(tick, 2400);
        return;
      }
      timer = setTimeout(tick, 110 + Math.random() * 65);
    } else {
      el.textContent = cur.slice(0, ci - 1);
      ci--;
      if (ci === 0) {
        del = false;
        idx = (idx + 1) % texts.length;
        timer = setTimeout(tick, 520);
        return;
      }
      timer = setTimeout(tick, 52);
    }
  };

  tick();

  return {
    pause() {
      paused = true;
      if (timer) { clearTimeout(timer); timer = null; }
    },
    resume() {
      if (!paused) return;
      paused = false;
      tick();
    }
  };
})();

const MusicTitle = (() => {
  const el = $('#music-heading');
  if (!el) return null;

  const phrases = [
    'Songs I keep coming back to',
    'Songs for hopeless romantics',
    'Songs for late-night studying',
    'Songs for getting lost in thought',
    'Songs for a little workout energy',
    'Songs for quiet Sunday mornings'
  ];

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    el.textContent = phrases[0];
    return { pause() {}, resume() {} };
  }

  let idx = 0;
  let charIndex = 0;
  let deleting = false;
  let timer = null;
  let paused = true;

  const tick = () => {
    if (paused) return;

    const phrase = phrases[idx];
    if (!deleting) {
      charIndex++;
      el.textContent = phrase.slice(0, charIndex);
      if (charIndex === phrase.length) {
        deleting = true;
        timer = setTimeout(tick, 1900);
        return;
      }
      timer = setTimeout(tick, 88 + Math.random() * 48);
      return;
    }

    charIndex--;
    el.textContent = phrase.slice(0, charIndex);
    if (charIndex === 0) {
      deleting = false;
      idx = (idx + 1) % phrases.length;
      timer = setTimeout(tick, 360);
      return;
    }
    timer = setTimeout(tick, 48);
  };

  return {
    pause() {
      paused = true;
      if (timer) { clearTimeout(timer); timer = null; }
    },
    resume() {
      if (!paused) return;
      paused = false;
      tick();
    }
  };
})();

const MusicPreview = (() => {
  const grid = $('.music-grid');
  const player = $('.music-player');
  const embedTarget = $('#spotify-embed', player);
  if (!grid || !player || !embedTarget) return null;

  let activeItem = null;
  let embedController = null;
  let pendingTrackId = null;

  window.onSpotifyIframeApiReady = (IFrameAPI) => {
    const initialTrackId = '5Enpui55il1ZW0HgwRTSds';
    const options = {
      width: '100%',
      height: 226,
      uri: `spotify:track:${initialTrackId}`
    };
    IFrameAPI.createController(embedTarget, options, (controller) => {
      embedController = controller;
      embedController.addListener('playback_update', e => {
        if (!activeItem) return;
        const isPaused = e.data.isPaused;
        const button = $('.music-preview', activeItem);
        if (button) {
          button.textContent = isPaused ? 'Play' : 'Pause';
          button.setAttribute('aria-pressed', isPaused ? 'false' : 'true');
        }
      });
      if (pendingTrackId) {
        embedController.loadUri(`spotify:track:${pendingTrackId}`);
        embedController.play();
        pendingTrackId = null;
      }
    });
  };

  function stop() {
    player.hidden = true;
    grid.append(player);
    if (embedController) {
      try { embedController.pause(); } catch (_) {}
    }
    if (activeItem) {
      activeItem.classList.remove('is-playing');
      activeItem.hidden = false;
      const button = $('.music-preview', activeItem);
      if (button) {
        button.textContent = 'Play';
        button.setAttribute('aria-pressed', 'false');
      }
      activeItem = null;
    }
  }

  function play(item) {
    if (activeItem === item) {
      if (embedController) {
        embedController.togglePlay();
      } else {
        return;
      }
      return;
    }

    if (activeItem) stop();
    const trackId = item.dataset.trackId;
    if (!trackId) return;

    activeItem = item;
    const rowTop = item.getBoundingClientRect().top;
    const rowItems = $$('.music-item', grid).filter(song =>
      Math.abs(song.getBoundingClientRect().top - rowTop) < 2
    );
    const rowEnd = rowItems[rowItems.length - 1] || item;
    grid.insertBefore(player, rowEnd.nextSibling);
    player.hidden = false;
    item.classList.add('is-playing');
    item.hidden = true;
    const button = $('.music-preview', item);
    if (button) {
      button.textContent = 'Play';
      button.setAttribute('aria-pressed', 'false');
    }

    if (embedController) {
      embedController.loadUri(`spotify:track:${trackId}`);
      embedController.play();
    } else {
      pendingTrackId = trackId;
    }
    player.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  grid.addEventListener('click', event => {
    const item = event.target.closest('.music-item');
    if (!item) return;
    event.preventDefault();
    play(item);
  });

  return { stop };
})();

const AboutSlideshow = (() => {
  const container = $('.about-slideshow');
  if (!container) return null;

  const dots = $('.about-slide-dots', container);
  const previousButton = $('.about-slide-prev', container);
  const nextButton = $('.about-slide-next', container);
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const slideElements = $$('.about-slide', container);
  let slides = [...slideElements];
  let currentSlide = slides.findIndex(slide => slide.classList.contains('is-active'));
  let timer = null;
  let paused = true;
  let resumeOnLeave = false;

  if (currentSlide < 0) currentSlide = 0;

  function renderDots() {
    if (!dots) return;
    dots.replaceChildren();
    slides.forEach((slide, index) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = `about-slide-dot${index === currentSlide ? ' is-active' : ''}`;
      dot.setAttribute('role', 'tab');
      dot.setAttribute('aria-label', `Show photo ${index + 1}`);
      dot.setAttribute('aria-selected', index === currentSlide ? 'true' : 'false');
      dot.addEventListener('click', () => showSlide(index));
      dots.append(dot);
    });
  }

  slideElements.forEach(slide => {
    slide.addEventListener('error', () => {
      slide.remove();
      slides = slides.filter(item => item !== slide);
      currentSlide = Math.min(currentSlide, Math.max(slides.length - 1, 0));
      renderDots();
    });
  });

  renderDots();

  function showSlide(index) {
    if (!slides.length) return;
    const nextIndex = (index + slides.length) % slides.length;
    if (nextIndex === currentSlide || slides.length < 2) return;

    const previous = slides[currentSlide];
    currentSlide = nextIndex;
    const next = slides[currentSlide];
    previous.classList.remove('is-active');
    next.classList.add('is-active');
    renderDots();
  }

  function showNext() {
    if (paused || reduceMotion) return;
    showSlide(currentSlide + 1);
  }

  function start() {
    paused = false;
    if (!timer && !reduceMotion) timer = setInterval(showNext, 4200);
  }

  function stop() {
    paused = true;
    if (timer) { clearInterval(timer); timer = null; }
  }

  previousButton?.addEventListener('click', () => showSlide(currentSlide - 1));
  nextButton?.addEventListener('click', () => showSlide(currentSlide + 1));

  container.addEventListener('mouseenter', () => {
    if (!paused) {
      resumeOnLeave = true;
      stop();
    }
  });

  container.addEventListener('mouseleave', () => {
    if (resumeOnLeave) {
      resumeOnLeave = false;
      start();
    }
  });

  container.addEventListener('focusin', stop);
  container.addEventListener('focusout', event => {
    if (!container.contains(event.relatedTarget)) start();
  });

  return { start, stop };
})();

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    if (TopoAnimation) TopoAnimation.pause();
    if (TypedText) TypedText.pause();
    if (MusicTitle) MusicTitle.pause();
    if (MusicPreview) MusicPreview.stop();
    if (AboutSlideshow) AboutSlideshow.stop();
  } else {
    if (TopoAnimation) TopoAnimation.resume();
    if (TypedText && current === 'home') TypedText.resume();
    if (MusicTitle && current === 'about') MusicTitle.resume();
    if (AboutSlideshow && current === 'about') AboutSlideshow.start();
  }
});

if (isMobile) {
  document.documentElement.style.setProperty('--fade', '300ms');
}

let scrollTimeout;
const handleScroll = () => {
  document.body.classList.add('is-scrolling');
  if (TopoAnimation) TopoAnimation.pause();
  clearTimeout(scrollTimeout);
  scrollTimeout = setTimeout(() => {
    document.body.classList.remove('is-scrolling');
    if (!document.hidden && TopoAnimation) TopoAnimation.resume();
  }, 140);
};

window.addEventListener('scroll', handleScroll, { passive: true });
$$('.page').forEach(page => {
  page.addEventListener('scroll', handleScroll, { passive: true });
});

if (isMobile) {
  const setVH = () => {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  };

  setVH();

  window.addEventListener('resize', setVH, { passive: true });

  window.addEventListener('orientationchange', () => {
    setTimeout(setVH, 100);
  }, { passive: true });

  let scrollTimer;
  window.addEventListener('scroll', () => {
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(setVH, 100);
  }, { passive: true });

  let lastTouchEnd = 0;
  document.addEventListener('touchend', e => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
      e.preventDefault();
    }
    lastTouchEnd = now;
  }, false);
}
