import {
  Renderer,
  Camera,
  Transform,
  Texture,
  Program,
  Mesh,
  Geometry,
} from "ogl";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CustomEase } from "gsap/CustomEase";

CustomEase.create("cinematicSilk", "0.45, 0.05, 0.55, 0.95");
CustomEase.create("cinematicSmooth", "0.25, 0.1, 0.25, 1");
CustomEase.create("cinematicFlow", "0.33, 0, 0.2, 1");
CustomEase.create("cinematicLinear", "0.4, 0, 0.6, 1");

const cylinderVertex = `
  attribute vec2 uv;
  attribute vec3 position;
  uniform mat4 modelViewMatrix;
  uniform mat4 projectionMatrix;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const cylinderFragment = `
  precision highp float;
  uniform sampler2D tMap;
  uniform float uDarkness;
  varying vec2 vUv;
  void main() {
    vec4 tex = texture2D(tMap, vUv);
    tex.rgb *= (1.0 - uDarkness);
    gl_FragColor = tex;
  }
`;

const particleVertex = `
  attribute vec3 position;
  uniform mat4 modelViewMatrix;
  uniform mat4 projectionMatrix;
  void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const particleFragment = `
  precision highp float;
  uniform vec3 uColor;
  uniform float uOpacity;
  void main() {
    gl_FragColor = vec4(uColor, uOpacity);
  }
`;

/** Served from `public/img/` (Vite exposes as `/img/...`). */
const IMAGE_URLS = Array.from(
  { length: 12 },
  (_, i) => `/img/img${i + 1}.webp`
);

const BASE_CYLINDER = {
  radius: 2.5,
  radialSegments: 64,
  heightSegments: 1,
};

const particleConfig = {
  numParticles: 12,
  particleRadius: 3.3,
  segments: 20,
  angleSpan: 0.3,
};

const imageConfig = { width: 1024, height: 1024 };

function getCylinderConfig() {
  const w = window.innerWidth;
  return {
    ...BASE_CYLINDER,
    radius: w > 768 ? 2.5 : 2.2,
    height: w > 768 ? 2 : 1.2,
  };
}

function drawImageCover(ctx, img, x, y, w, h) {
  const imgRatio = img.naturalWidth / img.naturalHeight;
  const canvasRatio = w / h;
  let sourceX = 0;
  let sourceY = 0;
  let sourceWidth = img.naturalWidth;
  let sourceHeight = img.naturalHeight;
  if (imgRatio > canvasRatio) {
    sourceWidth = img.naturalHeight * canvasRatio;
    sourceX = (img.naturalWidth - sourceWidth) / 2;
  } else {
    sourceHeight = img.naturalWidth / canvasRatio;
    sourceY = (img.naturalHeight - sourceHeight) / 2;
  }
  ctx.save();
  ctx.translate(x, y + h);
  ctx.scale(1, -1);
  ctx.drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, w, h);
  ctx.restore();
}

function createCylinderGeometry(gl, config) {
  const { radius, height, radialSegments, heightSegments } = config;
  const positions = [];
  const uvs = [];
  const indices = [];
  for (let y = 0; y <= heightSegments; y++) {
    const v = y / heightSegments;
    const yPos = (v - 0.5) * height;
    for (let x = 0; x <= radialSegments; x++) {
      const u = x / radialSegments;
      const theta = u * Math.PI * 2;
      const xPos = Math.cos(theta) * radius;
      const zPos = Math.sin(theta) * radius;
      positions.push(xPos, yPos, zPos);
      uvs.push(u, 1 - v);
    }
  }
  for (let y = 0; y < heightSegments; y++) {
    for (let x = 0; x < radialSegments; x++) {
      const a = y * (radialSegments + 1) + x;
      const b = a + radialSegments + 1;
      const c = a + 1;
      const d = b + 1;
      indices.push(a, b, c);
      indices.push(b, d, c);
    }
  }
  return new Geometry(gl, {
    position: { size: 3, data: new Float32Array(positions) },
    uv: { size: 2, data: new Float32Array(uvs) },
    index: { data: new Uint16Array(indices) },
  });
}

function createParticleGeometry(gl, config, index, cylHeight) {
  const { numParticles, particleRadius, segments, angleSpan } = config;
  const linePositions = [];
  const startAngle = (index / numParticles) * Math.PI * 2;
  const isTopHalf = index < numParticles / 2;
  const yPosition = isTopHalf
    ? cylHeight * 0.7 + Math.random() * cylHeight * 0.3
    : -cylHeight * 1.0 + Math.random() * cylHeight * 0.3;
  for (let j = 0; j <= segments; j++) {
    const t = j / segments;
    const angle = startAngle + angleSpan * t;
    const x = Math.cos(angle) * particleRadius;
    const z = Math.sin(angle) * particleRadius;
    linePositions.push(x, yPosition, z);
  }
  return {
    geometry: new Geometry(gl, {
      position: { size: 3, data: new Float32Array(linePositions) },
    }),
    userData: {
      baseAngle: startAngle,
      angleSpan,
      baseY: yPosition,
      speed: 0.5 + Math.random() * 1.0,
      radius: particleRadius,
    },
  };
}

function getResponsiveDimensions(cylinderCfg) {
  const width = window.innerWidth;
  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;
  const maxRadius = isMobile ? 1.8 : isTablet ? 2.2 : 2.5;
  const cylinderHeight = isMobile ? 0.8 : isTablet ? 1.0 : 1.2;
  const cameraZ = isMobile ? 6 : isTablet ? 7 : 8;
  const fov = isMobile ? 50 : 45;
  return {
    cylinderScale: maxRadius / cylinderCfg.radius,
    cylinderHeight,
    cameraZ,
    fov,
    isMobile,
  };
}

function getCylinderDpr() {
  return window.innerWidth < 768
    ? 1
    : Math.min(window.devicePixelRatio || 1, 1.25);
}

let cylinderStarted = false;

/**
 * Cinematic cylinder carousel (Codrops variant 1) — OGL + GSAP ScrollTrigger. Uses Lenis from main entry; no ScrollSmoother.
 */
export function initCylinderCarousel() {
  const sectionEl = document.querySelector(".cylinder-section");
  const canvas = document.querySelector(".cylinder-canvas");
  const container = document.querySelector(".cylinder-scroll-spacer");
  if (!sectionEl || !canvas || !container || cylinderStarted) {
    return Promise.resolve();
  }
  cylinderStarted = true;

  const cylinderCfg = getCylinderConfig();
  let dimensions = getResponsiveDimensions(cylinderCfg);
  const circumference = 2 * Math.PI * cylinderCfg.radius;
  const textureAspectRatio =
    imageConfig.height / (imageConfig.width * IMAGE_URLS.length);
  const idealHeight = circumference * textureAspectRatio;
  const heightCorrection = idealHeight / cylinderCfg.height;

  const renderer = new Renderer({
    canvas,
    width: window.innerWidth,
    height: window.innerHeight,
    dpr: getCylinderDpr(),
    alpha: true,
    antialias: false,
  });
  const gl = renderer.gl;
  gl.clearColor(0, 0, 0, 1);
  gl.disable(gl.CULL_FACE);

  const camera = new Camera(gl, {
    fov: dimensions.fov,
    aspect: window.innerWidth / window.innerHeight,
  });
  camera.position.set(0, 0, dimensions.cameraZ);

  const scene = new Transform();

  const geometry = createCylinderGeometry(gl, cylinderCfg);

  const hardwareLimit = gl.getParameter(gl.MAX_TEXTURE_SIZE);
  const isMobileDevice = window.innerWidth < 768;
  const safeLimit = isMobileDevice
    ? 2048
    : Math.min(hardwareLimit, 8192);

  const texCanvas = document.createElement("canvas");
  const ctx = texCanvas.getContext("2d", {
    willReadFrequently: false,
    alpha: false,
  });
  const numImages = IMAGE_URLS.length;
  const totalWidthOriginal = imageConfig.width * numImages;
  const heightOriginal = imageConfig.height;
  const scale = Math.min(1, safeLimit / totalWidthOriginal);
  texCanvas.width = Math.floor(totalWidthOriginal * scale);
  texCanvas.height = Math.floor(heightOriginal * scale);

  const imageElements = [];

  let cylinder = null;
  const cameraAnim = { x: 0, y: 0, z: dimensions.cameraZ };
  let lastRotation = 0;
  let velocity = 0;
  let lastWidth = window.innerWidth;
  const particles = [];
  let rafId = 0;
  let renderActive = false;

  const handleResize = () => {
    if (!camera || !cylinder) return;
    const currentWidth = window.innerWidth;
    const newDimensions = getResponsiveDimensions(getCylinderConfig());
    if (newDimensions.isMobile && currentWidth === lastWidth) return;
    lastWidth = currentWidth;
    renderer.dpr = getCylinderDpr();
    renderer.setSize(currentWidth, window.innerHeight);
    camera.perspective({
      fov: newDimensions.fov,
      aspect: currentWidth / window.innerHeight,
    });
    if (newDimensions.isMobile) {
      cylinder.scale.set(
        newDimensions.cylinderScale,
        newDimensions.cylinderScale * heightCorrection,
        newDimensions.cylinderScale
      );
    } else {
      cylinder.scale.set(
        newDimensions.cylinderScale,
        newDimensions.cylinderScale,
        newDimensions.cylinderScale
      );
    }
    if (
      cameraAnim.z === 8 ||
      cameraAnim.z === 7 ||
      cameraAnim.z === 6
    ) {
      cameraAnim.z = newDimensions.cameraZ;
    }
    dimensions = newDimensions;
  };

  const renderScene = () => {
    camera.position.set(cameraAnim.x, cameraAnim.y, cameraAnim.z);
    camera.lookAt([0, 0, 0]);

    const cyl = cylinder;
    if (cyl) {
      const currentRotation = cyl.rotation.y;
      velocity = currentRotation - lastRotation;
      lastRotation = currentRotation;
      const speed = Math.abs(velocity) * 100;
      const isRotating = Math.abs(velocity) > 0.0001;
      particles.forEach((particle) => {
        const userData = particle.userData;
        const targetOpacity = isRotating ? Math.min(speed * 3, 0.95) : 0;
        const currentOpacity = particle.program.uniforms.uOpacity.value;
        particle.program.uniforms.uOpacity.value =
          currentOpacity + (targetOpacity - currentOpacity) * 0.15;
        if (isRotating) {
          const rotationOffset = velocity * userData.speed * 1.5;
          userData.baseAngle += rotationOffset;
          const segments = particleConfig.segments;
          const positions = particle.geometry.attributes.position.data;
          for (let j = 0; j <= segments; j++) {
            const t = j / segments;
            const angle = userData.baseAngle + userData.angleSpan * t;
            const radiusWithSpeed = userData.radius;
            positions[j * 3] = Math.cos(angle) * radiusWithSpeed;
            positions[j * 3 + 1] = userData.baseY;
            positions[j * 3 + 2] = Math.sin(angle) * radiusWithSpeed;
          }
          particle.geometry.attributes.position.needsUpdate = true;
        }
      });
    }

    renderer.render({ scene, camera });
  };

  const animate = () => {
    if (!renderActive) return;
    rafId = requestAnimationFrame(animate);
    renderScene();
  };

  const startRendering = () => {
    if (renderActive) return;
    renderActive = true;
    lastRotation = cylinder?.rotation.y || lastRotation;
    renderScene();
    animate();
  };

  const stopRendering = () => {
    renderActive = false;
    if (!rafId) return;
    cancelAnimationFrame(rafId);
    rafId = 0;
  };

  const textBlocks = gsap.utils.toArray(".cylinder-perspective");

  return new Promise((resolve) => {
    const finishLoad = () => {
      const totalCanvasWidth = texCanvas.width;
      const cHeight = texCanvas.height;
      imageElements.forEach((im, i) => {
        const xStartExact = (i / numImages) * totalCanvasWidth;
        const xEndExact = ((i + 1) / numImages) * totalCanvasWidth;
        const xPos = Math.floor(xStartExact);
        const xEnd = Math.floor(xEndExact);
        const drawWidthActual = xEnd - xPos;
        if (!im) {
          ctx.fillStyle = "#1a1a1a";
          ctx.fillRect(xPos, 0, drawWidthActual, cHeight);
          return;
        }
        drawImageCover(ctx, im, xPos, 0, drawWidthActual, cHeight);
      });

      const texture = new Texture(gl, {
        wrapS: gl.CLAMP_TO_EDGE,
        wrapT: gl.CLAMP_TO_EDGE,
        minFilter: gl.LINEAR,
        magFilter: gl.LINEAR,
        generateMipmaps: false,
      });
      texture.image = texCanvas;
      texture.needsUpdate = true;

      const program = new Program(gl, {
        vertex: cylinderVertex,
        fragment: cylinderFragment,
        uniforms: {
          tMap: { value: texture },
          uDarkness: { value: 0.3 },
        },
        cullFace: null,
      });

      cylinder = new Mesh(gl, { geometry, program });
      cylinder.setParent(scene);
      cylinder.rotation.y = 0.5;
      cylinder.scale.set(
        dimensions.cylinderScale,
        dimensions.cylinderScale,
        dimensions.cylinderScale
      );

      handleResize();

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: container,
          start: "top top",
          end: "bottom bottom",
          scrub: 1,
        },
      });

      tl.to(cameraAnim, {
        x: 0,
        y: 0,
        z: dimensions.cameraZ,
        duration: 1,
        ease: "cinematicSilk",
      })
        .to(cameraAnim, {
          x: 0,
          y: 5,
          z: 5,
          duration: 1,
          ease: "cinematicFlow",
        })
        .to(cameraAnim, {
          x: 1.5,
          y: 2,
          z: 2,
          duration: 2,
          ease: "cinematicLinear",
        })
        .to(cameraAnim, {
          x: 0.5,
          y: 0,
          z: 0.8,
          duration: 3.5,
          ease: "power1.inOut",
        })
        .to(cameraAnim, {
          x: -6,
          y: -1,
          z: dimensions.cameraZ,
          duration: 1,
          ease: "cinematicSmooth",
        });

      tl.to(
        cylinder.rotation,
        {
          y: "+=28.27",
          duration: 8.5,
          ease: "none",
        },
        0
      );

      const sectionCount = Math.max(textBlocks.length, 1);
      textBlocks.forEach((textEl, i) => {
        if (!textEl) return;
        const sectionDuration = 100 / sectionCount;
        const start = i * sectionDuration;
        const end = (i + 1) * sectionDuration;
        gsap
          .timeline({
            scrollTrigger: {
              trigger: container,
              start: `${start}% top`,
              end: `${end}% top`,
              scrub: 0.8,
            },
          })
          .fromTo(
            textEl,
            { opacity: 0 },
            { opacity: 1, duration: 0.2, ease: "cinematicSmooth" }
          )
          .to(textEl, { opacity: 1, duration: 0.6, ease: "none" })
          .to(textEl, {
            opacity: 0,
            duration: 0.2,
            ease: "cinematicSmooth",
          });
      });

      for (let i = 0; i < particleConfig.numParticles; i++) {
        const { geometry: lineGeometry, userData } = createParticleGeometry(
          gl,
          particleConfig,
          i,
          cylinderCfg.height
        );
        const lineProgram = new Program(gl, {
          vertex: particleVertex,
          fragment: particleFragment,
          uniforms: {
            uColor: { value: [1.0, 1.0, 1.0] },
            uOpacity: { value: 0.0 },
          },
          transparent: true,
          depthTest: true,
        });
        const particle = new Mesh(gl, {
          geometry: lineGeometry,
          program: lineProgram,
          mode: gl.LINE_STRIP,
        });
        particle.userData = userData;
        particle.setParent(scene);
        particles.push(particle);
      }

      window.addEventListener("resize", handleResize);

      const renderTrigger = ScrollTrigger.create({
        trigger: container,
        start: "top bottom",
        end: "bottom top",
        onEnter: startRendering,
        onEnterBack: startRendering,
        onLeave: stopRendering,
        onLeaveBack: stopRendering,
      });

      const handleVisibilityChange = () => {
        if (document.hidden) {
          stopRendering();
          return;
        }

        if (renderTrigger.isActive) {
          startRendering();
        }
      };

      document.addEventListener("visibilitychange", handleVisibilityChange);

      if (renderTrigger.isActive) {
        startRendering();
      }

      ScrollTrigger.refresh();
      resolve();
    };

    let settled = 0;
    IMAGE_URLS.forEach((src, index) => {
      const img = new Image();
      img.onload = () => {
        imageElements[index] = img;
        settled += 1;
        if (settled === numImages) finishLoad();
      };
      img.onerror = () => {
        console.error("Cylinder image failed:", src);
        imageElements[index] = null;
        settled += 1;
        if (settled === numImages) finishLoad();
      };
      img.src = src;
    });
  });
}
