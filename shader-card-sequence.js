import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const SHADER_PANELS = [
  { text: "WE", image: "/shader_1.jpg" },
  { text: "ARE", image: "/shader_2.jpg" },
  { text: "PARALLEA", image: "/shader_3.png" },
];

const TOTAL_SCROLL_SCREENS = 5.4;
const SHADER_END = 0.6;
const DISSOLVE_END = 0.67;
const SHRINK_END = 0.75;
const GAP_START = 0.83;
const GAP_END = 0.87;
const FLIP_START = 0.83;
const FLIP_END = 0.94;
const RADIUS_START = 0.83;
const RADIUS_END = 0.89;
const MOBILE_BREAKPOINT = 768;
const ENTER_FRAC = 0.4;
const DWELL_FRAC = 0.2;
const LERP_LABEL_MIN = 0.12;
const LERP_LABEL_MAX = 0.28;
const SLOT = SHADER_END / SHADER_PANELS.length;
let shaderCardStarted = false;

const easeInOut = (t) => t * t * (3 - 2 * t);
const expoOut = (t) => {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  return 1 - Math.pow(2, -10 * t);
};
const expoIn = (t) => {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  return Math.pow(2, 10 * t - 10);
};
const resistanceCurve = (t) => 1 - Math.pow(1 - t, 4);

const vertexShader = `
  varying vec2 vUv;
  
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform sampler2D u_texture0;
  uniform sampler2D u_texture1;
  uniform sampler2D u_displacement;
  uniform float u_progress;
  uniform float u_strength;
  uniform float u_rgbShift;
  uniform float u_scale;
  uniform vec2 u_resolution;
  uniform vec2 u_textureResolution0;
  uniform vec2 u_textureResolution1;
  
  varying vec2 vUv;
  
  vec2 coverUV(vec2 uv, vec2 planeRes, vec2 texRes) {
    float scale = max(planeRes.x / texRes.x, planeRes.y / texRes.y);
    vec2 newSize = texRes * scale;
    return uv * (planeRes / newSize) + (newSize - planeRes) / 2.0 / newSize;
  }
  
  void main() {
    float disp = texture2D(u_displacement, vUv).r;
    disp = mix(disp, disp * (sin(vUv.y * 10.0 + u_progress * 6.28) * 0.5 + 0.5), 0.3);
    
    vec2 uv0 = coverUV(vUv, u_resolution, u_textureResolution0);
    vec2 uv1 = coverUV(vUv, u_resolution, u_textureResolution1);
    
    float scaleEffect = 1.0 + u_progress * (1.0 - u_progress) * u_scale;
    vec2 center = vec2(0.5);
    
    vec2 distortedUV0 = (uv0 - center) / scaleEffect + center + u_progress * disp * u_strength * vec2(1.0, 0.5);
    vec2 distortedUV1 = (uv1 - center) * scaleEffect + center - (1.0 - u_progress) * disp * u_strength * vec2(1.0, 0.5);
    
    float rgbOffset = u_progress * (1.0 - u_progress) * u_rgbShift;
    
    vec4 tex0 = vec4(
      texture2D(u_texture0, distortedUV0 + vec2(rgbOffset, 0.0)).r,
      texture2D(u_texture0, distortedUV0).g,
      texture2D(u_texture0, distortedUV0 - vec2(rgbOffset, 0.0)).b,
      texture2D(u_texture0, distortedUV0).a
    );
    
    vec4 tex1 = vec4(
      texture2D(u_texture1, distortedUV1 + vec2(rgbOffset, 0.0)).r,
      texture2D(u_texture1, distortedUV1).g,
      texture2D(u_texture1, distortedUV1 - vec2(rgbOffset, 0.0)).b,
      texture2D(u_texture1, distortedUV1).a
    );
    
    gl_FragColor = mix(tex0, tex1, smoothstep(0.0, 1.0, u_progress));
  }
`;

const isMobileViewport = () => window.innerWidth < MOBILE_BREAKPOINT;
const getShaderDpr = () =>
  isMobileViewport() ? 1 : Math.min(window.devicePixelRatio || 1, 1.25);

const mapProgress = (value, start, end) => {
  if (start === end) return value >= end ? 1 : 0;
  return gsap.utils.clamp(0, 1, gsap.utils.mapRange(start, end, 0, 1, value));
};

const loadTexture = (loader, url, { repeat = false } = {}) =>
  new Promise((resolve, reject) => {
    loader.load(
      url,
      (texture) => {
        if (repeat) {
          texture.wrapS = THREE.RepeatWrapping;
          texture.wrapT = THREE.RepeatWrapping;
        }

        resolve(texture);
      },
      undefined,
      reject
    );
  });

const setTextureResolution = (material, index, texture) => {
  if (!texture.image?.width) return;

  material.uniforms[`u_textureResolution${index}`].value.set(
    texture.image.width,
    texture.image.height
  );
};

const getHeroScale = (card) =>
  Math.max(
    window.innerHeight / card.offsetHeight,
    (window.innerWidth / 2) / card.offsetWidth
  );

const createRevealGroups = (cards) =>
  cards.map((card, cardIndex) => ({
    cardIndex,
    items: Array.from(card.querySelectorAll("[data-reveal]")).map((element, index) => ({
      element,
      index,
      isDivider: element.classList.contains("shader-contact-card__divider"),
    })),
  }));

const setRevealProgress = (groups, flipProgress) => {
  groups.forEach((group, groupIndex) => {
    const delayedProgress = mapProgress(flipProgress, groupIndex * 0.12, 1);

    group.items.forEach(({ element, index, isDivider }) => {
      const start = 0.18 + index * 0.1;
      const progress = expoOut(
        mapProgress(delayedProgress, start, start + 0.3)
      );

      if (isDivider) {
        gsap.set(element, { opacity: progress, scaleX: progress });
      } else {
        gsap.set(element, {
          opacity: progress,
          y: gsap.utils.interpolate(16, 0, progress),
        });
      }
    });
  });
};

const applyCardProgress = ({
  progress,
  heroScale,
  cards,
  cardInners,
  cardContainer,
  heading,
  revealGroups,
  proxyImage,
}) => {
  const shrinkProgress = easeInOut(
    mapProgress(progress, DISSOLVE_END, SHRINK_END)
  );
  const gapProgress = easeInOut(mapProgress(progress, GAP_START, GAP_END));
  const flipProgress = easeInOut(mapProgress(progress, FLIP_START, FLIP_END));
  const radiusProgress = easeInOut(
    mapProgress(progress, RADIUS_START, RADIUS_END)
  );
  const headingProgress = easeInOut(
    mapProgress(progress, FLIP_START + (FLIP_END - FLIP_START) * 0.58, FLIP_END)
  );
  const isMobile = isMobileViewport();
  const scale = gsap.utils.interpolate(heroScale, 1, shrinkProgress);
  const radius = gsap.utils.interpolate(0, 16, radiusProgress);
  const gap = gsap.utils.interpolate(0, isMobile ? 12 : 20, gapProgress);

  gsap.set(proxyImage, {
    scale,
    opacity: 0,
    borderRadius: 0,
  });
  gsap.set(cards, { scale, borderRadius: radius, x: 0, opacity: 1 });
  gsap.set(cardContainer, { gap: `${gap}px`, opacity: 1 });
  gsap.set(cardInners, { rotationY: 180 * flipProgress });
  gsap.set(cardInners[0], { rotationZ: -12 * flipProgress, y: 28 * flipProgress });
  gsap.set(cardInners[1], { rotationZ: 12 * flipProgress, y: 28 * flipProgress });
  if (heading) {
    gsap.set(heading, {
      y: gsap.utils.interpolate(40, 0, headingProgress),
      opacity: headingProgress,
    });
  }

  setRevealProgress(revealGroups, flipProgress);

  cards.forEach((card) => {
    card.classList.toggle("is-flipped", flipProgress > 0.995);
  });
};

export async function initShaderCardSequence() {
  const section = document.querySelector(".shader-card-sequence");
  const glMount = section?.querySelector(".shader-card-gl");
  const labelsMount = section?.querySelector(".shader-card-labels");
  const heading = section?.querySelector(".shader-card-heading h1");
  const cardContainer = section?.querySelector(".shader-card-container");
  const proxyImage = section?.querySelector(".shader-card-proxy__image");
  const card1 = section?.querySelector("#shader-contact-card-1");
  const card2 = section?.querySelector("#shader-contact-card-2");

  if (
    !section ||
    !glMount ||
    !labelsMount ||
    !cardContainer ||
    !proxyImage ||
    !card1 ||
    !card2 ||
    shaderCardStarted
  ) {
    return;
  }
  shaderCardStarted = true;

  if (!labelsMount.children.length) {
    const fragment = document.createDocumentFragment();

    SHADER_PANELS.forEach(({ text }) => {
      const item = document.createElement("div");
      item.className = "shader-card-label";
      item.innerHTML = `<p>${text}</p>`;
      fragment.appendChild(item);
    });

    labelsMount.appendChild(fragment);
  }

  const labelData = gsap.utils.toArray(labelsMount.children).map((element) => ({
    element,
    targetY: 100,
    currentY: 100,
  }));

  const cards = [card1, card2];
  const cardInners = cards.map((card) =>
    card.querySelector(".shader-contact-card__inner")
  );
  const revealGroups = createRevealGroups(cards);

  const loader = new THREE.TextureLoader();
  const renderer = new THREE.WebGLRenderer({
    antialias: false,
    alpha: true,
    powerPreference: "high-performance",
  });
  renderer.setClearColor(0x000000, 0);
  Object.assign(renderer.domElement.style, {
    position: "absolute",
    inset: "0",
    zIndex: "2",
  });
  glMount.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -1, 1);
  const material = new THREE.ShaderMaterial({
    uniforms: {
      u_texture0: { value: null },
      u_texture1: { value: null },
      u_displacement: { value: null },
      u_progress: { value: 0 },
      u_resolution: { value: new THREE.Vector2(1, 1) },
      u_textureResolution0: { value: new THREE.Vector2(1, 1) },
      u_textureResolution1: { value: new THREE.Vector2(1, 1) },
      u_strength: { value: 0.8 },
      u_rgbShift: { value: 0.05 },
      u_scale: { value: 0.15 },
    },
    vertexShader,
    fragmentShader,
    transparent: true,
  });

  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);
  scene.add(mesh);

  let textures = [];
  let currentIndex = 0;
  let targetIndex = 0;
  let isTransitioning = false;
  let transitionTween = null;
  let heroScale = getHeroScale(card1);
  let currentProgress = 0;
  let prevProgress = 0;
  const shaderTriggers = new Array(SHADER_PANELS.length).fill(false);

  const syncRendererSize = () => {
    const width = glMount.clientWidth || window.innerWidth;
    const height = glMount.clientHeight || window.innerHeight;

    renderer.setSize(width, height);
    renderer.setPixelRatio(getShaderDpr());

    camera.left = -width / 2;
    camera.right = width / 2;
    camera.top = height / 2;
    camera.bottom = -height / 2;
    camera.updateProjectionMatrix();

    mesh.geometry.dispose();
    mesh.geometry = new THREE.PlaneGeometry(width, height);
    material.uniforms.u_resolution.value.set(width, height);
    material.uniforms.u_strength.value = isMobileViewport() ? 0.5 : 0.8;
    material.uniforms.u_rgbShift.value = isMobileViewport() ? 0.03 : 0.05;
    heroScale = getHeroScale(card1);
  };

  const transitionTo = (index) => {
    if (index < 0 || index >= textures.length) {
      return;
    }

    const finishTransition = (finalIndex) => {
      material.uniforms.u_texture0.value = textures[finalIndex];
      material.uniforms.u_texture1.value = textures[finalIndex];
      setTextureResolution(material, 0, textures[finalIndex]);
      setTextureResolution(material, 1, textures[finalIndex]);
      material.uniforms.u_progress.value = 0;
      currentIndex = finalIndex;
      targetIndex = finalIndex;
      isTransitioning = false;
      transitionTween = null;
    };

    const tweenTo = (value, duration, onComplete) => {
      transitionTween?.kill();
      transitionTween = gsap.to(material.uniforms.u_progress, {
        value,
        duration,
        ease: "power3.inOut",
        onUpdate: renderScene,
        onComplete: () => {
          transitionTween = null;
          onComplete();
        },
      });
    };

    if (isTransitioning) {
      if (index === currentIndex) {
        tweenTo(
          0,
          gsap.utils.interpolate(0.2, 0.8, material.uniforms.u_progress.value),
          () => finishTransition(currentIndex)
        );
        return;
      }

      if (index === targetIndex) {
        tweenTo(
          1,
          gsap.utils.interpolate(
            0.2,
            0.8,
            1 - material.uniforms.u_progress.value
          ),
          () => finishTransition(targetIndex)
        );
        return;
      }

      const resolvedIndex =
        material.uniforms.u_progress.value >= 0.5 ? targetIndex : currentIndex;
      snapToTexture(resolvedIndex);
    }

    if (index === currentIndex) {
      targetIndex = index;
      return;
    }

    targetIndex = index;
    isTransitioning = true;
    material.uniforms.u_texture0.value = textures[currentIndex];
    material.uniforms.u_texture1.value = textures[index];
    setTextureResolution(material, 0, textures[currentIndex]);
    setTextureResolution(material, 1, textures[index]);
    tweenTo(1, 0.8, () => finishTransition(index));
  };

  const snapToTexture = (index) => {
    if (index < 0 || index >= textures.length) return;

    transitionTween?.kill();
    transitionTween = null;
    gsap.killTweensOf(material.uniforms.u_progress);
    material.uniforms.u_texture0.value = textures[index];
    material.uniforms.u_texture1.value = textures[index];
    setTextureResolution(material, 0, textures[index]);
    setTextureResolution(material, 1, textures[index]);
    material.uniforms.u_progress.value = 0;
    currentIndex = index;
    targetIndex = index;
    isTransitioning = false;
    renderScene();
  };

  const setLabelTargets = (progress) => {
    labelData.forEach((label, index) => {
      const slotStart = index * SLOT;
      const slotEnd = (index + 1) * SLOT;
      const enterEnd = slotStart + SLOT * ENTER_FRAC;
      const dwellEnd = slotStart + SLOT * (ENTER_FRAC + DWELL_FRAC);

      let y = 100;

      if (progress < slotStart) {
        y = 100;
      } else if (progress < enterEnd) {
        const eased = expoOut(mapProgress(progress, slotStart, enterEnd));
        y = gsap.utils.interpolate(100, 0, eased);
      } else if (progress < dwellEnd) {
        y = 0;
      } else if (progress < slotEnd) {
        const eased = expoIn(mapProgress(progress, dwellEnd, slotEnd));
        y = gsap.utils.interpolate(0, -100, eased);
      } else {
        y = -100;
      }

      label.targetY = y;
    });
  };

  const lerpLabels = () => {
    labelData.forEach((label) => {
      const delta = label.targetY - label.currentY;
      const catchUp = gsap.utils.interpolate(
        LERP_LABEL_MIN,
        LERP_LABEL_MAX,
        resistanceCurve(gsap.utils.clamp(0, 1, Math.abs(delta) / 100))
      );
      label.currentY += delta * catchUp;
      label.element.style.transform = `translate3d(0, ${label.currentY.toFixed(
        4
      )}vh, 0)`;
    });
  };

  try {
    const [loadedTextures, displacement] = await Promise.all([
      Promise.all(
        SHADER_PANELS.map(({ image }) => loadTexture(loader, image, { repeat: true }))
      ),
      loadTexture(loader, "/shader_asset_1.jpg", { repeat: true }),
    ]);

    textures = loadedTextures;
    material.uniforms.u_texture0.value = textures[0];
    material.uniforms.u_texture1.value = textures[0];
    material.uniforms.u_displacement.value = displacement;
    setTextureResolution(material, 0, textures[0]);
    setTextureResolution(material, 1, textures[0]);
  } catch (error) {
    console.error("Unable to initialize shader card sequence:", error);
    shaderCardStarted = false;
    renderer.dispose();
    glMount.innerHTML = "";
    return;
  }

  syncRendererSize();
  setLabelTargets(0);
  lerpLabels();
  gsap.set(labelsMount, { opacity: 1 });
  if (heading) {
    gsap.set(heading, { y: 40, opacity: 0 });
  }
  gsap.set(cards, { scale: heroScale, borderRadius: 0, x: 0, opacity: 1 });
  gsap.set(proxyImage, { scale: heroScale, borderRadius: 0, opacity: 0 });
  gsap.set(cardInners, { rotationY: 0, rotationZ: 0, y: 0 });
  gsap.set(cardContainer, { gap: "0px", opacity: 1 });
  setRevealProgress(revealGroups, 0);

  const renderScene = () => {
    lerpLabels();

    const opacity = 1 - easeInOut(mapProgress(currentProgress, SHADER_END, DISSOLVE_END));

    glMount.style.opacity = `${opacity}`;
    renderer.render(scene, camera);
  };
  renderScene();

  ScrollTrigger.create({
    trigger: section,
    start: "top top",
    end: () => `+=${window.innerHeight * TOTAL_SCROLL_SCREENS}`,
    scrub: 0.8,
    pin: true,
    pinSpacing: true,
    invalidateOnRefresh: true,
    onRefresh: () => {
      syncRendererSize();
      if (currentProgress <= SHADER_END) {
        const correctIndex = SHADER_PANELS.findIndex(
          (_, index) => currentProgress < (index + 1) * SLOT
        );
        snapToTexture(
          correctIndex === -1 ? SHADER_PANELS.length - 1 : correctIndex
        );
        shaderTriggers.fill(false);
        SHADER_PANELS.forEach((_, index) => {
          if (currentProgress >= index * SLOT) {
            shaderTriggers[index] = true;
          }
        });
        setLabelTargets(currentProgress);
      } else {
        if (isTransitioning || currentIndex !== SHADER_PANELS.length - 1) {
          snapToTexture(SHADER_PANELS.length - 1);
        }
        labelData.forEach((label) => {
          label.targetY = -100;
        });
      }

      applyCardProgress({
        progress: currentProgress,
        heroScale,
        cards,
        cardInners,
        cardContainer,
        heading,
        revealGroups,
        proxyImage,
      });
      renderScene();
    },
    onUpdate: (self) => {
      currentProgress = self.progress;

      if (prevProgress > SHADER_END && currentProgress <= SHADER_END) {
        const correctIndex = SHADER_PANELS.findIndex(
          (_, index) => currentProgress < (index + 1) * SLOT
        );
        snapToTexture(
          correctIndex === -1 ? SHADER_PANELS.length - 1 : correctIndex
        );
        shaderTriggers.fill(false);
        SHADER_PANELS.forEach((_, index) => {
          if (currentProgress >= index * SLOT) {
            shaderTriggers[index] = true;
          }
        });
      }

      if (currentProgress <= SHADER_END) {
        SHADER_PANELS.forEach((_, index) => {
          const slotStart = index * SLOT;

          if (currentProgress >= slotStart && !shaderTriggers[index]) {
            transitionTo(index);
            shaderTriggers[index] = true;
          }

          if (currentProgress < slotStart && shaderTriggers[index]) {
            transitionTo(Math.max(0, index - 1));
            shaderTriggers[index] = false;
          }
        });

        setLabelTargets(currentProgress);
      } else {
        if (isTransitioning || currentIndex !== SHADER_PANELS.length - 1) {
          snapToTexture(SHADER_PANELS.length - 1);
        }
        labelData.forEach((label) => {
          label.targetY = -100;
        });
      }

      prevProgress = currentProgress;

      applyCardProgress({
        progress: currentProgress,
        heroScale,
        cards,
        cardInners,
        cardContainer,
        heading,
        revealGroups,
        proxyImage,
      });
      renderScene();
    },
  });

  section.dataset.shaderCardReady = "true";

  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      syncRendererSize();
      ScrollTrigger.refresh();
    }, 200);
  });
}
