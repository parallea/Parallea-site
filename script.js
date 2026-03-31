import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { CustomEase } from "gsap/all";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

gsap.registerPlugin(SplitText, CustomEase, ScrollTrigger);
CustomEase.create("hop", "0.9, 0, 0.1, 1");
CustomEase.create("logoSettle", "0.16, 1, 0.3, 1");
const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;

// ─── LENIS ────────────────────────────────────────────────────────────────────
const lenis = new Lenis();
let marqueeTargetVelocity = 0;
lenis.on("scroll", (e) => {
  ScrollTrigger.update();
  marqueeTargetVelocity = Math.abs(e.velocity) * 0.02;
});
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);

const effectInitPromises = {
  cylinder: null,
  shader: null,
  glass: null,
};
let lazyEffectsRegistered = false;

const loadCylinderCarousel = () => {
  if (!effectInitPromises.cylinder) {
    effectInitPromises.cylinder = import("./cylinder-carousel.js")
      .then(({ initCylinderCarousel }) => initCylinderCarousel())
      .catch((error) => {
        effectInitPromises.cylinder = null;
        throw error;
      });
  }

  return effectInitPromises.cylinder;
};

const loadShaderCardSequence = () => {
  if (!effectInitPromises.shader) {
    effectInitPromises.shader = import("./shader-card-sequence.js")
      .then(({ initShaderCardSequence }) => initShaderCardSequence())
      .catch((error) => {
        effectInitPromises.shader = null;
        throw error;
      });
  }

  return effectInitPromises.shader;
};

const loadGlassFinale = () => {
  if (!effectInitPromises.glass) {
    effectInitPromises.glass = import("./glass-finale.js")
      .then(({ initGlassFinale }) => initGlassFinale())
      .catch((error) => {
        effectInitPromises.glass = null;
        throw error;
      });
  }

  return effectInitPromises.glass;
};

const setupLazySectionInit = ({
  selector,
  load,
  rootMargin = "150% 0px 150% 0px",
  label,
}) => {
  const element = document.querySelector(selector);
  if (!element) return;

  let started = false;

  const start = () => {
    if (started) return;
    started = true;

    Promise.resolve(load())
      .then(() => {
        ScrollTrigger.refresh();
      })
      .catch((error) => {
        console.error(`Failed to initialize ${label}:`, error);
      });
  };

  if (!("IntersectionObserver" in window)) {
    start();
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      start();
    },
    { rootMargin }
  );

  observer.observe(element);
};

const registerLazyEffects = () => {
  if (lazyEffectsRegistered) return;
  lazyEffectsRegistered = true;

  setupLazySectionInit({
    selector: ".cylinder-section",
    load: loadCylinderCarousel,
    rootMargin: "220% 0px 220% 0px",
    label: "cylinder carousel",
  });

  setupLazySectionInit({
    selector: ".shader-card-sequence",
    load: loadShaderCardSequence,
    rootMargin: "140% 0px 140% 0px",
    label: "shader card sequence",
  });

  setupLazySectionInit({
    selector: ".glass-finale",
    load: loadGlassFinale,
    rootMargin: "120% 0px 120% 0px",
    label: "glass finale",
  });
};

// ─── CANVAS / FRAME SEQUENCE ──────────────────────────────────────────────────
const section = document.querySelector(".frame-sequence");
const canvas = document.querySelector(".frame-canvas");
const context =
  canvas.getContext("2d", { alpha: false, desynchronized: true }) ||
  canvas.getContext("2d");
const gradientOverlay = document.querySelector(".gradient-overlay");
const heroLogo = document.querySelector(".hero-logo");
const magneticElements = gsap.utils.toArray(".js-magnetic");
const heroMagneticButtons = gsap.utils.toArray(".hero-btn--magnetic");
const heroTextSplitElements = gsap.utils.toArray(".hero-tagline.hero-split");
const earlyAccessTriggers = gsap.utils.toArray("[data-early-access-trigger]");
const earlyAccessSheet = document.querySelector(".early-access-sheet");
const earlyAccessBackdrop = document.querySelector(
  ".early-access-sheet__backdrop"
);
const earlyAccessPanel = document.querySelector(".early-access-sheet__panel");
const earlyAccessForm = document.querySelector(".early-access-sheet__form");
const earlyAccessInput = document.querySelector(".early-access-sheet__input");

const heroSplitInstances = heroTextSplitElements.map(
  (element) => new SplitText(element, { type: "words,chars" })
);
const heroChars = heroSplitInstances.flatMap((split) => split.chars);
const heroRevealTargets = [...heroMagneticButtons, ...heroChars];
let heroRevealStarted = false;

gsap.set(heroRevealTargets, { yPercent: 120, opacity: 0 });
if (heroLogo) {
  gsap.set(heroLogo, { yPercent: 120, opacity: 0 });
}

const revealHeroOverlay = () => {
  if (heroRevealStarted) return;
  heroRevealStarted = true;
  if (heroLogo) {
    gsap.to(heroLogo, {
      yPercent: 0,
      opacity: 1,
      duration: 0.85,
      ease: "hop",
    });
  }
  gsap.to(heroRevealTargets, {
    yPercent: 0,
    opacity: 1,
    duration: 0.85,
    ease: "hop",
    stagger: 0.012,
  });
};

const initMagneticInteractions = () => {
  const supportsMagneticHover =
    window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
    !prefersReducedMotion;

  magneticElements.forEach((element) => {
    element.addEventListener("click", (event) => {
      const href = element.getAttribute("href");
      if (!href || href === "#") {
        event.preventDefault();
      }
    });

    if (!supportsMagneticHover) return;

    const xTo = gsap.quickTo(element, "x", {
      duration: 0.28,
      ease: "power3.out",
    });
    const yTo = gsap.quickTo(element, "y", {
      duration: 0.28,
      ease: "power3.out",
    });

    const resetButtonPosition = () => {
      xTo(0);
      yTo(0);
    };

    element.addEventListener("pointermove", (event) => {
      const rect = element.getBoundingClientRect();
      const offsetX = event.clientX - (rect.left + rect.width / 2);
      const offsetY = event.clientY - (rect.top + rect.height / 2);

      xTo(gsap.utils.clamp(-12, 12, offsetX * 0.18));
      yTo(gsap.utils.clamp(-8, 8, offsetY * 0.24));
    });

    element.addEventListener("pointerleave", resetButtonPosition);
    element.addEventListener("blur", resetButtonPosition);
  });
};

const initEarlyAccessSheet = () => {
  if (
    !earlyAccessSheet ||
    !earlyAccessBackdrop ||
    !earlyAccessPanel ||
    !earlyAccessForm ||
    !earlyAccessInput ||
    !earlyAccessTriggers.length
  ) {
    return;
  }

  const motion = prefersReducedMotion
    ? {
        backdropIn: 0.01,
        backdropOut: 0.01,
        panelIn: 0.01,
        panelOut: 0.01,
      }
    : {
        backdropIn: 0.28,
        backdropOut: 0.2,
        panelIn: 0.58,
        panelOut: 0.34,
      };

  let isOpen = false;
  let lastTrigger = null;

  const setSheetVisibility = (isVisible) => {
    earlyAccessSheet.classList.toggle("is-visible", isVisible);
    earlyAccessSheet.setAttribute("aria-hidden", String(!isVisible));
  };

  const focusInput = () => {
    requestAnimationFrame(() => {
      earlyAccessInput.focus({ preventScroll: true });
    });
  };

  const freezeScroll = () => {
    document.body.classList.add("early-access-open");
    if (!document.body.classList.contains("is-loading")) {
      lenis.stop();
    }
  };

  const unfreezeScroll = () => {
    document.body.classList.remove("early-access-open");
    if (!document.body.classList.contains("is-loading")) {
      lenis.start();
    }
  };

  const closeSheet = ({ reset = true } = {}) => {
    if (!isOpen) return;
    isOpen = false;

    gsap.killTweensOf([earlyAccessBackdrop, earlyAccessPanel]);
    gsap.to(earlyAccessBackdrop, {
      opacity: 0,
      duration: motion.backdropOut,
      ease: "power2.out",
    });
    gsap.to(earlyAccessPanel, {
      y: prefersReducedMotion ? 0 : 48,
      opacity: 0,
      scale: 0.98,
      duration: motion.panelOut,
      ease: prefersReducedMotion ? "none" : "power3.in",
      onComplete: () => {
        setSheetVisibility(false);
        unfreezeScroll();
        if (reset) {
          earlyAccessForm.reset();
        }
        lastTrigger?.focus?.({ preventScroll: true });
      },
    });
  };

  const openSheet = (trigger) => {
    lastTrigger = trigger ?? lastTrigger;

    if (isOpen) {
      focusInput();
      return;
    }

    isOpen = true;
    setSheetVisibility(true);
    freezeScroll();

    gsap.killTweensOf([earlyAccessBackdrop, earlyAccessPanel]);
    gsap.set(earlyAccessBackdrop, { opacity: 0 });
    gsap.set(earlyAccessPanel, {
      y: prefersReducedMotion ? 0 : 80,
      opacity: 0,
      scale: 0.96,
    });

    gsap.to(earlyAccessBackdrop, {
      opacity: 1,
      duration: motion.backdropIn,
      ease: "power2.out",
    });
    gsap.to(earlyAccessPanel, {
      y: 0,
      opacity: 1,
      scale: 1,
      duration: motion.panelIn,
      ease: prefersReducedMotion ? "none" : "hop",
      onComplete: focusInput,
    });
  };

  earlyAccessTriggers.forEach((trigger) => {
    trigger.addEventListener("click", (event) => {
      event.preventDefault();
      openSheet(trigger);
    });
  });

  earlyAccessBackdrop.addEventListener("click", () => {
    closeSheet();
  });

  earlyAccessForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = earlyAccessInput.value.trim();
    earlyAccessInput.value = email;

    if (!earlyAccessInput.checkValidity()) {
      earlyAccessInput.reportValidity();
      return;
    }

    closeSheet({ reset: true });

    try {
      await fetch("/api/early-access", {
        method: "POST",
        keepalive: true,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ email }),
      });
    } catch (error) {
      console.error("Waitlist signup request failed:", error);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || !isOpen) return;
    event.preventDefault();
    closeSheet();
  });
};

initMagneticInteractions();
initEarlyAccessSheet();

const setCanvasSize = () => {
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 1);
  canvas.width = window.innerWidth * pixelRatio;
  canvas.height = window.innerHeight * pixelRatio;
  canvas.style.width = window.innerWidth + "px";
  canvas.style.height = window.innerHeight + "px";
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
};

setCanvasSize();

const frameCount = 145;
const getFramePath = (index) =>
  `/frames/frame${(index + 1).toString().padStart(4, "0")}.jpg`;
const FRAME_LOAD_CONCURRENCY = 4;
const FRAME_PREFETCH_RADIUS = 5;
const CRITICAL_FRAME_INDICES = [0, 1, 2, 3, 4, 5];
const WARM_FRAME_INDICES = Array.from(
  new Set(
    Array.from({ length: 8 }, (_, index) =>
      Math.round(((index + 1) * (frameCount - 1)) / 8)
    ).filter((index) => !CRITICAL_FRAME_INDICES.includes(index))
  )
);
const CRITICAL_FRAME_SET = new Set(CRITICAL_FRAME_INDICES);

const images = new Array(frameCount);
const frameAvailable = new Array(frameCount).fill(false);
const frameSettled = new Array(frameCount).fill(false);
const frameLoading = new Set();
const frameQueuePriority = new Array(frameCount).fill(0);
const priorityFrameQueue = [];
const normalFrameQueue = [];
const frameState = { current: 0 };
let scrollTriggerReady = false;
let activeFrameLoads = 0;
let criticalFramesSettled = 0;
let frameLoadingStarted = false;
let frameSequenceReady = false;
let frameDrawScheduled = false;

const isValidFrameIndex = (index) => index >= 0 && index < frameCount;

const getBestLoadedFrameIndex = (targetIndex) => {
  if (frameAvailable[targetIndex]) return targetIndex;

  for (let distance = 1; distance < frameCount; distance++) {
    const prev = targetIndex - distance;
    const next = targetIndex + distance;

    if (prev >= 0 && frameAvailable[prev]) return prev;
    if (next < frameCount && frameAvailable[next]) return next;
  }

  return -1;
};

const drawFrame = () => {
  frameDrawScheduled = false;
  const canvasWidth = window.innerWidth;
  const canvasHeight = window.innerHeight;
  context.clearRect(0, 0, canvasWidth, canvasHeight);
  const frameIndex = getBestLoadedFrameIndex(frameState.current);
  if (frameIndex === -1) return;

  const img = images[frameIndex];
  if (!img || !img.complete || img.naturalWidth === 0) return;
  const imageAspect = img.naturalWidth / img.naturalHeight;
  const canvasAspect = canvasWidth / canvasHeight;
  let drawWidth, drawHeight, drawX, drawY;
  if (imageAspect > canvasAspect) {
    drawHeight = canvasHeight;
    drawWidth = drawHeight * imageAspect;
    drawX = (canvasWidth - drawWidth) / 2;
    drawY = 0;
  } else {
    drawWidth = canvasWidth;
    drawHeight = drawWidth / imageAspect;
    drawX = 0;
    drawY = (canvasHeight - drawHeight) / 2;
  }
  context.drawImage(img, drawX, drawY, drawWidth, drawHeight);
};

const scheduleFrameDraw = () => {
  if (frameDrawScheduled) return;
  frameDrawScheduled = true;
  requestAnimationFrame(drawFrame);
};

const requestFrameWindow = (center, radius = FRAME_PREFETCH_RADIUS) => {
  if (!isValidFrameIndex(center)) return;

  queueFrameLoad(center, true);

  for (let offset = 1; offset <= radius; offset++) {
    queueFrameLoad(center + offset, true);
    queueFrameLoad(center - offset, true);
  }
};

const onCriticalFramesReady = () => {
  if (frameSequenceReady) return;
  frameSequenceReady = true;

  scheduleFrameDraw();
  initScrollTrigger().catch((error) => {
    frameSequenceReady = false;
    console.error("Failed to initialize scroll sequences:", error);
  });
};

const finalizeFrameLoad = (index, wasSuccessful) => {
  frameLoading.delete(index);
  frameSettled[index] = true;
  frameAvailable[index] = wasSuccessful;
  activeFrameLoads--;

  if (wasSuccessful && !frameSequenceReady) {
    onCriticalFramesReady();
  }

  if (CRITICAL_FRAME_SET.has(index)) {
    criticalFramesSettled++;
    if (criticalFramesSettled === CRITICAL_FRAME_SET.size && !frameSequenceReady) {
      onCriticalFramesReady();
    }
  }

  if (
    index === frameState.current ||
    Math.abs(index - frameState.current) <= FRAME_PREFETCH_RADIUS
  ) {
    scheduleFrameDraw();
  }

  pumpFrameQueue();
};

const getNextQueuedFrame = () => {
  while (priorityFrameQueue.length) {
    const index = priorityFrameQueue.shift();

    if (frameQueuePriority[index] === 2) {
      frameQueuePriority[index] = 0;
      return index;
    }
  }

  while (normalFrameQueue.length) {
    const index = normalFrameQueue.shift();

    if (frameQueuePriority[index] === 1) {
      frameQueuePriority[index] = 0;
      return index;
    }
  }

  return -1;
};

const pumpFrameQueue = () => {
  while (activeFrameLoads < FRAME_LOAD_CONCURRENCY) {
    const index = getNextQueuedFrame();

    if (index === -1) {
      break;
    }

    if (!isValidFrameIndex(index) || frameSettled[index] || frameLoading.has(index)) {
      continue;
    }

    frameLoading.add(index);
    activeFrameLoads++;

    const img = new Image();
    img.decoding = "async";
    images[index] = img;

    img.onload = () => finalizeFrameLoad(index, true);
    img.onerror = () => finalizeFrameLoad(index, false);
    img.src = getFramePath(index);
  }
};

function queueFrameLoad(index, priority = false) {
  if (
    !isValidFrameIndex(index) ||
    frameSettled[index] ||
    frameLoading.has(index)
  ) {
    return;
  }

  const nextPriority = priority ? 2 : 1;
  const currentPriority = frameQueuePriority[index];

  if (currentPriority >= nextPriority) {
    return;
  }

  frameQueuePriority[index] = nextPriority;

  if (priority) {
    priorityFrameQueue.push(index);
  } else {
    normalFrameQueue.push(index);
  }

  pumpFrameQueue();
}

const startFrameLoading = () => {
  if (frameLoadingStarted) return;
  frameLoadingStarted = true;

  CRITICAL_FRAME_INDICES.forEach((index) => queueFrameLoad(index, true));
  WARM_FRAME_INDICES.forEach((index) => queueFrameLoad(index, true));

  requestFrameWindow(0);
};

const updateGradient = (progress) => {
  const gradientStart = 0.7;
  if (progress < gradientStart) {
    gsap.set(gradientOverlay, { opacity: 0 });
    return;
  }
  const rawProgress = (progress - gradientStart) / (1.0 - gradientStart);
  gsap.set(gradientOverlay, { opacity: rawProgress * rawProgress });
};

// ─── TEXT REVEAL SETUP ────────────────────────────────────────────────────────
// Runs once at page load to split paragraphs into individual word elements.
// The ScrollTrigger that animates them is created later inside initScrollTrigger,
// after the frame sequence trigger exists and pinSpacing is accounted for.

const wordHighlightBgColor = "60, 60, 60";
const keywords = []; // add Parallea-specific keywords here if needed

const animeTextParagraphs = document.querySelectorAll(".anime-text p");

animeTextParagraphs.forEach((paragraph) => {
  const words = paragraph.textContent.split(/\s+/);
  paragraph.innerHTML = "";
  words.forEach((word) => {
    if (!word.trim()) return;
    const wordContainer = document.createElement("div");
    wordContainer.className = "word";
    const wordText = document.createElement("span");
    wordText.textContent = word;
    const normalizedWord = word.toLowerCase().replace(/[.,!?;:"]/g, "");
    if (keywords.includes(normalizedWord)) {
      wordContainer.classList.add("keyword-wrapper");
      wordText.classList.add("keyword", normalizedWord);
    }
    wordContainer.appendChild(wordText);
    paragraph.appendChild(wordContainer);
  });
});

// ─── SCROLL TEXT SEQUENCE (phased word-mask transitions + marquee) ────────────
let scrollTextMarqueeTickerAdded = false;
let scrollTextMarqueeActive = false;
const introScrambleCharset = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const INTRO_LOGO_VIEWBOX_WIDTH = 282.004;
const INTRO_LOGO_VIEWBOX_HEIGHT = 376.886;
const INTRO_LABEL_HIDE_SCALE_DELTA = 0.018;
const INTRO_PORTAL_TARGET_VIEWBOX_WIDTH = 12;
const INTRO_PORTAL_MAX_SCALE = 18;
const INTRO_PORTAL_EAGER_IMAGE_COUNT = 4;
const INTRO_PORTAL_WARM_CONCURRENCY = 3;
const introPortalScatterDirections = [
  { x: 1.3, y: 0.7 },
  { x: -1.5, y: 1.0 },
  { x: 1.1, y: -1.3 },
  { x: -1.7, y: -0.8 },
  { x: 0.8, y: 1.5 },
  { x: -1.0, y: -1.4 },
  { x: 1.6, y: 0.3 },
  { x: -0.7, y: 1.7 },
  { x: 1.2, y: -1.6 },
  { x: -1.4, y: 0.9 },
  { x: 1.8, y: -0.5 },
  { x: -1.1, y: -1.8 },
  { x: 0.9, y: 1.8 },
  { x: -1.9, y: 0.4 },
  { x: 1.0, y: -1.9 },
  { x: -0.8, y: 1.9 },
  { x: 1.7, y: -1.0 },
  { x: -1.3, y: -1.2 },
  { x: 0.7, y: 2.0 },
  { x: 1.25, y: -0.2 },
];
const introPortalWarmState = {
  observer: null,
  promise: null,
};

const getDeterministicScrambleChar = (index, tick) => {
  const seed = Math.abs(
    Math.sin((index + 1) * 12.9898 + (tick + 1) * 78.233) * 43758.5453
  );
  const charIndex = Math.floor(
    (seed % 1) * introScrambleCharset.length
  );
  return introScrambleCharset[charIndex];
};

const updateIntroScrambleText = (element, progress) => {
  const targetText = element.dataset.text || element.textContent || "";
  const revealProgress = gsap.utils.clamp(0, 1, progress / 0.45);
  const tick = Math.floor(progress * 90);

  const scrambledText = targetText
    .split("")
    .map((char, index) => {
      if (!/[a-z0-9]/i.test(char)) return char;

      const revealStart = (index + 1) / Math.max(1, targetText.length);
      const revealThreshold = revealStart * 0.92;

      if (revealProgress >= revealThreshold) {
        return char;
      }

      return getDeterministicScrambleChar(index, tick);
    })
    .join("");

  element.textContent = scrambledText;
};

const buildIntroPortalImages = (container) => {
  if (!container) return [];
  if (!container.children.length) {
    const fragment = document.createDocumentFragment();

    introPortalScatterDirections.forEach((_, index) => {
      const frame = document.createElement("div");
      frame.className = "intro-portal-image";

      const image = document.createElement("img");
      image.src = `/scatter_${index + 1}.jpg`;
      image.alt = "";
      image.decoding = "async";
      image.loading =
        index < INTRO_PORTAL_EAGER_IMAGE_COUNT ? "eager" : "lazy";

      frame.appendChild(image);
      fragment.appendChild(frame);
    });

    container.appendChild(fragment);
  }

  return gsap.utils.toArray(container.children);
};

const waitForImageSettled = (image) =>
  new Promise((resolve) => {
    if (!image || image.complete) {
      resolve();
      return;
    }

    const finish = () => {
      image.removeEventListener("load", finish);
      image.removeEventListener("error", finish);
      resolve();
    };

    image.addEventListener("load", finish, { once: true });
    image.addEventListener("error", finish, { once: true });
  });

const warmIntroPortalImage = async (image, index) => {
  if (!image) return;

  image.loading = "eager";

  if ("fetchPriority" in image) {
    image.fetchPriority =
      index < INTRO_PORTAL_EAGER_IMAGE_COUNT ? "high" : "low";
  }

  await waitForImageSettled(image);

  if (!image.naturalWidth || typeof image.decode !== "function") {
    return;
  }

  try {
    await image.decode();
  } catch (error) {
    // decode() can reject when the browser has already painted the asset.
  }
};

const prewarmIntroPortalImages = (items) => {
  if (!items.length) return Promise.resolve();
  if (introPortalWarmState.promise) return introPortalWarmState.promise;

  const images = items
    .map((item) => item.querySelector("img"))
    .filter(Boolean);

  if (!images.length) return Promise.resolve();

  introPortalWarmState.promise = (async () => {
    let cursor = 0;
    const workerCount = Math.min(
      INTRO_PORTAL_WARM_CONCURRENCY,
      images.length
    );

    await Promise.all(
      Array.from({ length: workerCount }, async () => {
        while (cursor < images.length) {
          const imageIndex = cursor++;
          await warmIntroPortalImage(images[imageIndex], imageIndex);
        }
      })
    );
  })().catch((error) => {
    introPortalWarmState.promise = null;
    console.error("Failed to prewarm intro portal images:", error);
  });

  return introPortalWarmState.promise;
};

const setupIntroPortalPrewarm = (section, items) => {
  if (!section || !items.length) return;

  const startPrewarm = () => {
    if (introPortalWarmState.observer) {
      introPortalWarmState.observer.disconnect();
      introPortalWarmState.observer = null;
    }

    prewarmIntroPortalImages(items);
  };

  if (!("IntersectionObserver" in window)) {
    startPrewarm();
    return;
  }

  introPortalWarmState.observer = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      startPrewarm();
    },
    { rootMargin: "240% 0px 240% 0px" }
  );

  introPortalWarmState.observer.observe(section);
};

const getIntroPortalTargetScale = (logoMark) => {
  if (!logoMark) return 1;

  const computedWidth = parseFloat(getComputedStyle(logoMark).width);
  const baseWidth = logoMark.clientWidth || computedWidth || 1;
  const targetScreenSpan = Math.max(window.innerWidth, window.innerHeight) * 1.05;

  return gsap.utils.clamp(8, INTRO_PORTAL_MAX_SCALE, targetScreenSpan / baseWidth);
};

const getIntroPortalViewBox = (progress) => {
  const targetWidth = INTRO_PORTAL_TARGET_VIEWBOX_WIDTH;
  const targetHeight =
    targetWidth * (INTRO_LOGO_VIEWBOX_HEIGHT / INTRO_LOGO_VIEWBOX_WIDTH);
  const targetCenterX = INTRO_LOGO_VIEWBOX_WIDTH / 2;
  const targetCenterY = INTRO_LOGO_VIEWBOX_HEIGHT / 2;

  const targetBox = {
    x: targetCenterX - targetWidth / 2,
    y: targetCenterY - targetHeight / 2,
    width: targetWidth,
    height: targetHeight,
  };

  return {
    x: gsap.utils.interpolate(0, targetBox.x, progress),
    y: gsap.utils.interpolate(0, targetBox.y, progress),
    width: gsap.utils.interpolate(INTRO_LOGO_VIEWBOX_WIDTH, targetBox.width, progress),
    height: gsap.utils.interpolate(
      INTRO_LOGO_VIEWBOX_HEIGHT,
      targetBox.height,
      progress
    ),
  };
};

const setIntroLogoViewBox = (logoMark, viewBox) => {
  if (!logoMark) return;

  logoMark.setAttribute(
    "viewBox",
    `${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`
  );
};

const updateIntroPortalScatter = (items, progress, opacityMultiplier = 1) => {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const isMobile = viewportWidth < 1000;
  const scatterMultiplier = isMobile ? 2.5 : 0.5;
  const scaleMultiplier = isMobile ? 2.25 : 1.5;
  const staggerStep = isMobile ? 0.02 : 0.024;
  const totalDelay = staggerStep * Math.max(0, items.length - 1);
  const normalizedSpan = Math.max(0.001, 1 - totalDelay);
  const startDepth = isMobile ? -220 : -180;
  const endDepth = isMobile ? 980 : 1120;
  const startScale = isMobile ? 0.2 : 0.16;
  const startOffsetFactor = isMobile ? 0.018 : 0.028;

  items.forEach((item, index) => {
    const direction = introPortalScatterDirections[index];
    const itemProgress = gsap.utils.clamp(
      0,
      1,
      (progress - index * staggerStep) / normalizedSpan
    );
    const isVisible = itemProgress > 0.01;

    gsap.set(item, {
      autoAlpha: isVisible ? opacityMultiplier : 0,
      xPercent: -50,
      yPercent: -50,
      x: gsap.utils.interpolate(
        direction.x * viewportWidth * startOffsetFactor,
        direction.x * viewportWidth * scatterMultiplier,
        itemProgress
      ),
      y: gsap.utils.interpolate(
        direction.y * viewportHeight * startOffsetFactor,
        direction.y * viewportHeight * scatterMultiplier,
        itemProgress
      ),
      z: gsap.utils.interpolate(startDepth, endDepth, itemProgress),
      scale: gsap.utils.interpolate(
        startScale,
        1,
        Math.min(itemProgress * scaleMultiplier, 1)
      ),
    });
  });
};

const initScrollTextSequence = () => {
  const scrollTextSection = document.querySelector(".scroll-text-sequence");
  if (!scrollTextSection) return;

  const textBlocks = gsap.utils.toArray(
    scrollTextSection.querySelectorAll(".copy-block p")
  );
  if (!textBlocks.length) return;

  const splitInstances = textBlocks.map((block) =>
    SplitText.create(block, { type: "words", mask: "words" })
  );

  splitInstances.slice(1).forEach((instance) => {
    gsap.set(instance.words, { yPercent: 100 });
  });

  const overlapCount = 3;
  const phaseCount = splitInstances.length - 1;

  const getWordProgress = (phaseProgress, wordIndex, totalWords) => {
    const totalLength = 1 + overlapCount / totalWords;
    const scale =
      1 /
      Math.min(
        totalLength,
        1 + (totalWords - 1) / totalWords + overlapCount / totalWords
      );

    const startTime = (wordIndex / totalWords) * scale;
    const endTime = startTime + (overlapCount / totalWords) * scale;
    const duration = endTime - startTime;

    if (phaseProgress <= startTime) return 0;
    if (phaseProgress >= endTime) return 1;
    return (phaseProgress - startTime) / duration;
  };

  const animateBlock = (outBlock, inBlock, phaseProgress) => {
    outBlock.words.forEach((word, i) => {
      const progress = getWordProgress(phaseProgress, i, outBlock.words.length);
      gsap.set(word, { yPercent: progress * 100 });
    });

    inBlock.words.forEach((word, i) => {
      const progress = getWordProgress(phaseProgress, i, inBlock.words.length);
      gsap.set(word, { yPercent: 100 - progress * 100 });
    });
  };

  const indicator = scrollTextSection.querySelector(".scroll-indicator");
  const marqueeTrack = scrollTextSection.querySelector(".marquee-track");

  if (marqueeTrack) {
    const items = gsap.utils.toArray(
      marqueeTrack.querySelectorAll(".marquee-item")
    );
    items.forEach((item) => marqueeTrack.appendChild(item.cloneNode(true)));
  }

  let marqueePosition = 0;
  let smoothVelocity = 0;

  if (marqueeTrack && !scrollTextMarqueeTickerAdded) {
    scrollTextMarqueeTickerAdded = true;
    gsap.ticker.add(() => {
      if (!scrollTextMarqueeActive) return;

      smoothVelocity += (marqueeTargetVelocity - smoothVelocity) * 0.5;

      const baseSpeed = 0.45;
      const speed = baseSpeed + smoothVelocity * 9;

      marqueePosition -= speed;

      const trackWidth = marqueeTrack.scrollWidth / 2;
      if (marqueePosition <= -trackWidth) {
        marqueePosition = 0;
      }

      gsap.set(marqueeTrack, { x: marqueePosition });

      marqueeTargetVelocity *= 0.9;
    });
  }

  ScrollTrigger.create({
    trigger: scrollTextSection,
    start: "top bottom",
    end: "bottom top",
    onEnter: () => {
      scrollTextMarqueeActive = true;
    },
    onEnterBack: () => {
      scrollTextMarqueeActive = true;
    },
    onLeave: () => {
      scrollTextMarqueeActive = false;
    },
    onLeaveBack: () => {
      scrollTextMarqueeActive = false;
    },
  });

  const marqueeBounds = scrollTextSection.getBoundingClientRect();
  scrollTextMarqueeActive =
    marqueeBounds.bottom > 0 && marqueeBounds.top < window.innerHeight;

  ScrollTrigger.create({
    trigger: scrollTextSection,
    start: "top top",
    end: "bottom bottom",
    onUpdate: (self) => {
      const scrollProgress = self.progress;

      if (indicator) {
        gsap.set(indicator, { "--progress": scrollProgress });
      }

      const totalPhaseProgress = gsap.utils.clamp(
        0,
        phaseCount,
        scrollProgress * phaseCount
      );
      const phaseIndex = Math.min(
        phaseCount - 1,
        Math.floor(totalPhaseProgress)
      );
      const phaseProgress = totalPhaseProgress - phaseIndex;

      splitInstances.forEach((instance, index) => {
        gsap.set(instance.words, {
          yPercent:
            index < phaseIndex ? 100 : index === phaseIndex ? 0 : 100,
        });
      });

      animateBlock(
        splitInstances[phaseIndex],
        splitInstances[phaseIndex + 1],
        phaseProgress
      );
    },
  });
};

const initIntroScrambleSequence = () => {
  const introScrambleSection = document.querySelector(
    ".intro-scramble-sequence"
  );
  const introPortalImagesContainer = introScrambleSection?.querySelector(
    ".intro-portal-images"
  );
  const introScrambleText = introScrambleSection?.querySelector(
    ".intro-scramble-text"
  );
  const introLogoLockup = introScrambleSection?.querySelector(
    ".intro-logo-lockup"
  );
  const introLogoMark = introScrambleSection?.querySelector(".intro-logo-mark");
  const introLogoLabel = introScrambleSection?.querySelector(
    ".intro-logo-label"
  );
  const introPortalImages = buildIntroPortalImages(introPortalImagesContainer);

  if (
    !introScrambleSection ||
    !introPortalImagesContainer ||
    !introScrambleText ||
    !introLogoLockup ||
    !introLogoMark ||
    !introLogoLabel ||
    !introPortalImages.length
  ) {
    return;
  }

  const logoEase = gsap.parseEase("logoSettle");
  updateIntroScrambleText(introScrambleText, 0);
  updateIntroPortalScatter(introPortalImages, 0, 0);
  gsap.set(introPortalImagesContainer, { autoAlpha: 0 });
  setupIntroPortalPrewarm(introScrambleSection, introPortalImages);

  let introPortalTargetScale = getIntroPortalTargetScale(introLogoMark);
  setIntroLogoViewBox(introLogoMark, {
    x: 0,
    y: 0,
    width: INTRO_LOGO_VIEWBOX_WIDTH,
    height: INTRO_LOGO_VIEWBOX_HEIGHT,
  });

  gsap.set(introScrambleText, { autoAlpha: 1, y: 0, scale: 1 });
  gsap.set(introLogoLockup, {
    autoAlpha: 0,
    xPercent: 0,
    x: 0,
    y: 24,
  });
  gsap.set(introLogoMark, { x: 0, y: 0, rotation: 0, scale: 1 });
  gsap.set(introLogoLabel, { autoAlpha: 0, y: 16 });
  const scramblePhaseEnd = 0.1;
  const textFadeStart = 0.11;
  const textFadeEnd = 0.18;
  const logoEntranceStart = 0.18;
  const logoEntranceEnd = 0.28;
  const portalStart = 0.36;
  const portalEnd = 0.72;
  const logoFadeStart = 0.7;
  const logoFadeEnd = 0.74;
  const scatterStart = 0.72;
  const scatterEnd = 0.985;
  const endFadeStart = 0.992;

  ScrollTrigger.create({
    trigger: introScrambleSection,
    start: "top top",
    end: "bottom bottom",
    scrub: true,
    invalidateOnRefresh: true,
    onRefresh: () => {
      introPortalTargetScale = getIntroPortalTargetScale(introLogoMark);
      setIntroLogoViewBox(introLogoMark, getIntroPortalViewBox(0));
    },
    onUpdate: (self) => {
      const progress = self.progress;
      const scrambleProgress = gsap.utils.clamp(
        0,
        1,
        progress / scramblePhaseEnd
      );
      const textFadeProgress = gsap.utils.clamp(
        0,
        1,
        (progress - textFadeStart) / (textFadeEnd - textFadeStart)
      );
      const logoEntranceProgressRaw = gsap.utils.clamp(
        0,
        1,
        (progress - logoEntranceStart) / (logoEntranceEnd - logoEntranceStart)
      );
      const logoEntranceProgress = logoEase(logoEntranceProgressRaw);
      const portalProgressRaw = gsap.utils.clamp(
        0,
        1,
        (progress - portalStart) / (portalEnd - portalStart)
      );
      const portalProgress = portalProgressRaw;
      const logoFadeProgress = gsap.utils.clamp(
        0,
        1,
        (progress - logoFadeStart) / (logoFadeEnd - logoFadeStart)
      );
      const scatterProgress = gsap.utils.clamp(
        0,
        1,
        (progress - scatterStart) / (scatterEnd - scatterStart)
      );
      const endFadeProgress = gsap.utils.clamp(
        0,
        1,
        (progress - endFadeStart) / (1 - endFadeStart)
      );
      const logoScale = gsap.utils.interpolate(
        1,
        introPortalTargetScale,
        portalProgress
      );
      const portalViewBox = getIntroPortalViewBox(portalProgress);
      const viewBoxZoom = INTRO_LOGO_VIEWBOX_WIDTH / portalViewBox.width;
      const labelScaleFade = gsap.utils.clamp(
        0,
        1,
        (logoScale * viewBoxZoom - 1) / INTRO_LABEL_HIDE_SCALE_DELTA
      );
      const lockupVisible =
        logoEntranceProgressRaw > 0.001 ||
        portalProgressRaw > 0.001 ||
        scatterProgress > 0.001;

      updateIntroScrambleText(
        introScrambleText,
        scrambleProgress
      );

      gsap.set(introScrambleText, {
        autoAlpha: 1 - textFadeProgress,
        y: -36 * textFadeProgress,
        scale: 1 - 0.04 * textFadeProgress,
      });

      gsap.set(introLogoLockup, {
        autoAlpha: lockupVisible
          ? (1 - logoFadeProgress) * (1 - endFadeProgress)
          : 0,
        x: 0,
        y: 24 * (1 - logoEntranceProgress),
      });

      gsap.set(introLogoMark, {
        x: 0,
        y: 0,
        rotation: 0,
        scale: logoScale,
        transformOrigin: "center center",
      });
      setIntroLogoViewBox(introLogoMark, portalViewBox);

      gsap.set(introLogoLabel, {
        autoAlpha:
          logoEntranceProgressRaw *
          (1 - labelScaleFade) *
          (1 - endFadeProgress),
        y: 16 * (1 - logoEntranceProgress) - 10 * labelScaleFade,
      });

      gsap.set(introPortalImagesContainer, {
        autoAlpha: scatterProgress > 0 ? 1 - endFadeProgress : 0,
      });

      updateIntroPortalScatter(
        introPortalImages,
        scatterProgress,
        1 - endFadeProgress
      );
    },
  });
};

const initSvgTrailSequence = () => {
  const svgTrailSection = document.querySelector(".svg-trail-sequence");

  if (!svgTrailSection) return;

  const svgTrailRibbon = svgTrailSection.querySelector(".svg-trail-ribbon");
  const svgTrailPaths = svgTrailSection.querySelectorAll(".svg-trail-path");

  if (svgTrailPaths.length) {
    const pathLength = svgTrailPaths[0].getTotalLength();

    svgTrailPaths.forEach((layer) => {
      layer.style.strokeDasharray = pathLength;
      layer.style.strokeDashoffset = pathLength;
    });

    gsap.to(svgTrailPaths, {
      strokeDashoffset: 0,
      ease: "none",
      scrollTrigger: {
        trigger: svgTrailSection,
        start: "top 78%",
        end: "bottom 42%",
        scrub: 0.65,
        invalidateOnRefresh: true,
      },
    });
  }

  if (svgTrailRibbon) {
    gsap.fromTo(
      svgTrailRibbon,
      { opacity: 0.1 },
      {
        opacity: 0.38,
        duration: 0.9,
        ease: "power2.out",
        scrollTrigger: {
          trigger: svgTrailSection,
          start: "top 85%",
          once: true,
        },
      }
    );
  }

  const slideConfig = {
    ease: "back.out(1.6)",
    scrub: 1.2,
    start: "top 80%",
    end: "top 25%",
  };

  const scrubSlide = (element, fromX) => {
    if (!element) return;

    gsap.from(element, {
      x: fromX,
      ease: slideConfig.ease,
      scrollTrigger: {
        trigger: element,
        start: slideConfig.start,
        end: slideConfig.end,
        scrub: slideConfig.scrub,
        invalidateOnRefresh: true,
      },
    });
  };

  svgTrailSection
    .querySelectorAll(".trail-feature--text-left")
    .forEach((feature) => {
      scrubSlide(feature.querySelector(".trail-card"), -180);
      scrubSlide(feature.querySelector(".trail-feature-media"), 180);
    });

  svgTrailSection
    .querySelectorAll(".trail-feature--text-right")
    .forEach((feature) => {
      scrubSlide(feature.querySelector(".trail-feature-media"), -180);
      scrubSlide(feature.querySelector(".trail-card"), 180);
    });

  svgTrailSection.querySelectorAll(".trail-feature-media").forEach((wrap) => {
    const image = wrap.querySelector("img");

    if (!image) return;

    gsap.from(image, {
      scale: 1.08,
      duration: 1.4,
      ease: "expo.out",
      scrollTrigger: {
        trigger: wrap,
        start: "top 85%",
        once: true,
      },
    });
  });

  svgTrailSection.querySelectorAll(".trail-card").forEach((card) => {
    const elements = card.querySelectorAll("h2, p");

    gsap.from(elements, {
      y: 24,
      opacity: 0,
      duration: 0.9,
      ease: "expo.out",
      stagger: 0.12,
      scrollTrigger: {
        trigger: card,
        start: "top 75%",
        once: true,
      },
    });
  });
};

// ─── SCROLL TRIGGERS ──────────────────────────────────────────────────────────
// Both triggers are created together inside this function so ScrollTrigger
// knows the full page layout (including frame sequence pin spacing) before
// it calculates where the text section starts. refresh() at the end
// locks in the correct positions for both.

const initScrollTrigger = async () => {
  if (scrollTriggerReady) return;
  scrollTriggerReady = true;

  try {
    // Frame sequence
    ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: `+=${window.innerHeight * 7}px`,
      pin: true,
      pinSpacing: true,
      scrub: 3,
      onUpdate: (self) => {
        const progress = self.progress;
        const targetFrame = Math.round(progress * (frameCount - 1));
        if (targetFrame !== frameState.current) {
          frameState.current = targetFrame;
          requestFrameWindow(targetFrame);
          scheduleFrameDraw();
        }
        updateGradient(progress);
      },
    });

    // Hero split-text disappears while scrolling down through the pinned scene
    const heroHideTween = gsap.to(heroRevealTargets, {
      yPercent: -120,
      opacity: 0,
      duration: 1,
      ease: "hop",
      stagger: { each: 0.009, from: "end" },
      paused: true,
    });
    const heroLogoHideTween = heroLogo
      ? gsap.to(heroLogo, {
          yPercent: -120,
          opacity: 0,
          duration: 1,
          ease: "hop",
          paused: true,
        })
      : null;

    ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: `+=${window.innerHeight * 1.2}`,
      scrub: true,
      onUpdate: (self) => {
        heroHideTween.progress(self.progress);
        heroLogoHideTween?.progress(self.progress);
      },
    });

    // Text reveal — registered after frame sequence so layout is correct
    const animeTextContainers = document.querySelectorAll(".anime-text-container");

    animeTextContainers.forEach((container) => {
      ScrollTrigger.create({
        trigger: container,
        pin: container,
        start: "top top",
        end: `+=${window.innerHeight * 4}`,
        pinSpacing: true,
        onUpdate: (self) => {
          const progress = self.progress;
          const words = Array.from(
            container.querySelectorAll(".anime-text .word")
          );
          const totalWords = words.length;

          words.forEach((word, index) => {
            const wordText = word.querySelector("span");

            if (progress <= 0.7) {
              const revealProgress = Math.min(1, progress / 0.7);
              const overlapWords = 15;
              const totalAnimationLength = 1 + overlapWords / totalWords;
              const wordStart = index / totalWords;
              const wordEnd = wordStart + overlapWords / totalWords;
              const timelineScale =
                1 /
                Math.min(
                  totalAnimationLength,
                  1 + (totalWords - 1) / totalWords + overlapWords / totalWords
                );
              const adjustedStart = wordStart * timelineScale;
              const adjustedEnd = wordEnd * timelineScale;
              const duration = adjustedEnd - adjustedStart;
              const wordProgress =
                revealProgress <= adjustedStart
                  ? 0
                  : revealProgress >= adjustedEnd
                  ? 1
                  : (revealProgress - adjustedStart) / duration;

              word.style.opacity = wordProgress;
              const backgroundFadeStart =
                wordProgress >= 0.9 ? (wordProgress - 0.9) / 0.1 : 0;
              word.style.backgroundColor = `rgba(${wordHighlightBgColor}, ${Math.max(0, 1 - backgroundFadeStart)})`;
              const textRevealProgress =
                wordProgress >= 0.9 ? (wordProgress - 0.9) / 0.1 : 0;
              wordText.style.opacity = Math.pow(textRevealProgress, 0.5);
            } else {
              const reverseProgress = (progress - 0.7) / 0.3;
              word.style.opacity = 1;
              const reverseOverlapWords = 5;
              const reverseWordStart = index / totalWords;
              const reverseWordEnd =
                reverseWordStart + reverseOverlapWords / totalWords;
              const reverseTimelineScale =
                1 /
                Math.max(
                  1,
                  (totalWords - 1) / totalWords +
                    reverseOverlapWords / totalWords
                );
              const reverseAdjustedStart =
                reverseWordStart * reverseTimelineScale;
              const reverseAdjustedEnd = reverseWordEnd * reverseTimelineScale;
              const reverseDuration =
                reverseAdjustedEnd - reverseAdjustedStart;
              const reverseWordProgress =
                reverseProgress <= reverseAdjustedStart
                  ? 0
                  : reverseProgress >= reverseAdjustedEnd
                  ? 1
                  : (reverseProgress - reverseAdjustedStart) / reverseDuration;

              if (reverseWordProgress > 0) {
                wordText.style.opacity = 1 - reverseWordProgress;
                word.style.backgroundColor = `rgba(${wordHighlightBgColor}, ${reverseWordProgress})`;
              } else {
                wordText.style.opacity = 1;
                word.style.backgroundColor = `rgba(${wordHighlightBgColor}, 0)`;
              }
            }
          });
        },
      });
    });

    initScrollTextSequence();
    initIntroScrambleSequence();
    initSvgTrailSequence();

    // Recalculate all scroll positions now that both pinned sections are registered
    ScrollTrigger.refresh();
  } catch (error) {
    scrollTriggerReady = false;
    throw error;
  }
};
startFrameLoading();

// ─── LOADER ───────────────────────────────────────────────────────────────────
const loaderSvg = document.querySelector(".loader svg");
const textPaths = document.querySelectorAll(".loader svg textPath");
const startTextLengths = Array.from(textPaths).map((tp) =>
  parseFloat(tp.getAttribute("textLength"))
);
const startTextOffsets = Array.from(textPaths).map((tp) =>
  parseFloat(tp.getAttribute("startOffset"))
);
const targetTextLengths = [4000, 3500, 3250, 3000, 2500, 2000, 1500, 1250];
const orbitRadii = [775, 700, 625, 550, 475, 400, 325, 250];
const maxOrbitRadius = orbitRadii[0];

textPaths.forEach((textPath, index) => {
  const animationDelay = (textPaths.length - 1 - index) * 0.1;
  const currentOrbitRadius = orbitRadii[index];
  const currentDuration =
    1 + (currentOrbitRadius / maxOrbitRadius) * (1.25 - 1);
  const pathLength = 2 * Math.PI * currentOrbitRadius * 3;
  const textLengthIncrease =
    targetTextLengths[index] - startTextLengths[index];
  const offsetAdjustment = (textLengthIncrease / 2 / pathLength) * 100;
  const targetOffset = startTextOffsets[index] - offsetAdjustment;

  gsap.to(textPath, {
    attr: {
      textLength: targetTextLengths[index],
      startOffset: targetOffset + "%",
    },
    duration: currentDuration,
    delay: animationDelay,
    ease: "power2.inOut",
    yoyo: true,
    repeat: -1,
    repeatDelay: 0,
  });
});

let loaderRotation = 0;
function animateRotation() {
  if (!loaderSvg || !loaderSvg.isConnected) return;
  const spinDirection = Math.random() < 0.5 ? 1 : -1;
  loaderRotation += 25 * spinDirection;
  gsap.to(loaderSvg, {
    rotation: loaderRotation,
    duration: 2,
    ease: "power2.inOut",
    onComplete: animateRotation,
  });
}
animateRotation();

const counterText = document.querySelector(".counter p");
const count = { value: 0 };

gsap.to(count, {
  value: 100,
  duration: 4,
  delay: 1,
  ease: "power1.out",
  onUpdate() {
    counterText.textContent = Math.floor(count.value);
  },
  onComplete() {
    gsap.to(".counter", { opacity: 0, duration: 0.5, delay: 1 });
  },
});

const orbitTextElements = document.querySelectorAll(".orbit-text");
gsap.set(orbitTextElements, { opacity: 0 });
const orbitTextsReversed = Array.from(orbitTextElements).reverse();

gsap.to(orbitTextsReversed, {
  opacity: 1,
  duration: 0.75,
  stagger: 0.125,
  ease: "power1.out",
});

gsap.to(orbitTextsReversed, {
  opacity: 0,
  duration: 0.75,
  stagger: 0.1,
  delay: 6,
  ease: "power1.out",
  onComplete() {
    gsap.to(".loader", {
      opacity: 0,
      duration: 1,
      onComplete: () => {
        gsap.killTweensOf(loaderSvg);
        document.querySelector(".loader").remove();
        document.body.classList.remove("is-loading");
        gsap.set(".intro-logo-mark", { clearProps: "transform" });
        gsap.set(".intro-logo-lockup", { clearProps: "rotation" });
        registerLazyEffects();
      },
    });
    gsap.to(canvas, {
      opacity: 1,
      duration: 1,
      ease: "power2.inOut",
    });
    revealHeroOverlay();
  },
});

// ─── RESIZE ───────────────────────────────────────────────────────────────────
let resizeTimeout;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    setCanvasSize();
    scheduleFrameDraw();
  }, 200);
});
