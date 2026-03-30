import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";

gsap.registerPlugin(ScrollTrigger);

const MOBILE_BREAKPOINT = 900;
const MODEL_PATH = "/glass-finale/model.glb";
const HDR_PATH = "/glass-finale/env/warehouse.hdr";
const FINALE_TUNING = {
  pointerParallax: 1.5,
  bloomStrength: 0.16,
  bloomRadius: 0.58,
  bloomThreshold: 0.46,
  scaleDesktop: 2,
  scaleMobile: 2.08,
  repulseRadius: 0.72,
  maxOffset: 0.31,
  splitForce: 0.11,
  returnForce: 0.02,
  damping: 0.89,
};

const tempBounds = new THREE.Box3();
const tempSize = new THREE.Vector3();
const tempCenter = new THREE.Vector3();
const tempProjected = new THREE.Vector3();
const tempDirection = new THREE.Vector3();
const tempLocalPointer = new THREE.Vector3();
const tempForce = new THREE.Vector3();
const tempPieceCenter = new THREE.Vector3();
const tempBoundsCorners = Array.from({ length: 8 }, () => new THREE.Vector3());

let hasInitialized = false;

const getGlassFinaleDpr = () =>
  window.innerWidth < MOBILE_BREAKPOINT ? 0.7 : 0.85;

const damp = (current, target, smoothing, delta) =>
  THREE.MathUtils.lerp(current, target, 1 - Math.exp(-smoothing * delta));

const toSectionNdc = (event, element) => {
  const rect = element.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  const y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);

  return {
    x: THREE.MathUtils.clamp(x, -1, 1),
    y: THREE.MathUtils.clamp(y, -1, 1),
  };
};

const screenToRigSpace = (camera, rig, ndc, target) => {
  tempProjected.set(ndc.x, ndc.y, 0.3).unproject(camera);
  tempDirection.copy(tempProjected).sub(camera.position).normalize();

  const distance = -camera.position.z / tempDirection.z;
  target.copy(camera.position).addScaledVector(tempDirection, distance);
  rig.worldToLocal(target);

  return target;
};

const getProjectedBoundsY = (box, camera, viewportHeight) => {
  const { min, max } = box;
  const corners = tempBoundsCorners;

  corners[0].set(min.x, min.y, min.z);
  corners[1].set(min.x, min.y, max.z);
  corners[2].set(min.x, max.y, min.z);
  corners[3].set(min.x, max.y, max.z);
  corners[4].set(max.x, min.y, min.z);
  corners[5].set(max.x, min.y, max.z);
  corners[6].set(max.x, max.y, min.z);
  corners[7].set(max.x, max.y, max.z);

  let minY = Number.POSITIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  corners.forEach((corner) => {
    tempProjected.copy(corner).project(camera);
    const screenY = ((1 - tempProjected.y) * 0.5) * viewportHeight;
    minY = Math.min(minY, screenY);
    maxY = Math.max(maxY, screenY);
  });

  return { minY, maxY };
};

export async function initGlassFinale() {
  const section = document.querySelector(".glass-finale");
  const mount = section?.querySelector(".glass-finale-gl");
  const overlay = section?.querySelector(".glass-finale-overlay");
  const cta = section?.querySelector(".glass-finale-cta");

  if (!section || !mount || hasInitialized) return;
  hasInitialized = true;

  try {
    gsap.set(mount, { opacity: 0 });
    gsap.to(mount, {
      opacity: 1,
      duration: 0.9,
      ease: "power2.out",
      scrollTrigger: {
        trigger: section,
        start: "top 88%",
        once: true,
      },
    });

    const renderer = new THREE.WebGLRenderer({
      antialias: false,
      alpha: false,
      powerPreference: "high-performance",
      stencil: false,
      depth: true,
    });

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    renderer.setClearColor(0x000000, 1);
    renderer.domElement.setAttribute("aria-hidden", "true");
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
    camera.position.set(0, 0, 5.15);

    const rig = new THREE.Group();
    scene.add(rig);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.08);
    scene.add(ambientLight);

    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(1, 1),
      FINALE_TUNING.bloomStrength,
      FINALE_TUNING.bloomRadius,
      FINALE_TUNING.bloomThreshold
    );

    composer.addPass(renderPass);
    composer.addPass(bloomPass);

    const glassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xeeefff,
      emissive: 0x000012,
      reflectivity: 0.2,
      roughness: 0.1,
      metalness: 0.1,
      transparent: true,
      opacity: 0.7,
      transmission: 1,
      thickness: 0.6,
      ior: 1.4,
      dispersion: 2.5,
      side: THREE.DoubleSide,
      envMapIntensity: 1,
    });

    const loader = new GLTFLoader();
    const rgbeLoader = new RGBELoader();
    const pmremGenerator = new THREE.PMREMGenerator(renderer);

    const [gltfResult, hdrResult] = await Promise.allSettled([
      loader.loadAsync(MODEL_PATH),
      rgbeLoader.loadAsync(HDR_PATH),
    ]);

    if (gltfResult.status !== "fulfilled") {
      pmremGenerator.dispose();
      composer.dispose();
      renderer.dispose();
      mount.innerHTML = "";
      throw gltfResult.reason;
    }

    let environmentMap = null;

    if (hdrResult.status === "fulfilled") {
      environmentMap = pmremGenerator.fromEquirectangular(
        hdrResult.value
      ).texture;
      scene.environment = environmentMap;
      hdrResult.value.dispose();
    }

    pmremGenerator.dispose();

    const gltfScene = gltfResult.value.scene;
    tempBounds.setFromObject(gltfScene);
    tempBounds.getCenter(tempCenter);
    gltfScene.position.sub(tempCenter);
    gltfScene.updateMatrixWorld(true);
    tempBounds.setFromObject(gltfScene);
    tempBounds.getSize(tempSize);

    const maxAxis = Math.max(tempSize.x, tempSize.y, tempSize.z) || 1;
    const repulseRadius = maxAxis * FINALE_TUNING.repulseRadius;
    const maxOffset = maxAxis * FINALE_TUNING.maxOffset;
    const pieces = [];

    gltfScene.traverse((child) => {
      if (!child.isMesh || !child.geometry) return;

      child.geometry.computeBoundingSphere();

      const piece = new THREE.Mesh(child.geometry, glassMaterial);
      child.matrixWorld.decompose(piece.position, piece.quaternion, piece.scale);

      const baseCenter = child.geometry.boundingSphere
        ? child.geometry.boundingSphere.center.clone().applyMatrix4(child.matrixWorld)
        : piece.position.clone();

      rig.add(piece);

      pieces.push({
        mesh: piece,
        basePosition: piece.position.clone(),
        baseQuaternion: piece.quaternion.clone(),
        baseCenter,
        offset: new THREE.Vector3(),
        velocity: new THREE.Vector3(),
      });
    });

    const pointer = {
      x: 0,
      y: 0,
      active: false,
    };
    const pointerTarget = new THREE.Vector3();
    const pointerPosition = new THREE.Vector3();
    const groupTargetRotation = new THREE.Vector2();
    const groupRotation = new THREE.Vector2();

    let disposed = false;
    let sectionVisible = false;
    let frameRequested = false;
    let rafId = 0;
    let previousTime = performance.now();

    const resetCompositionShift = () => {
      rig.position.y = 0;
      section.style.setProperty("--glass-finale-composition-shift", "0px");
    };

    const updateCompositionAlignment = () => {
      if (!overlay || !cta || !pieces.length) return;

      const width = mount.clientWidth || window.innerWidth;
      const height = mount.clientHeight || window.innerHeight;
      if (!width || !height) return;

      resetCompositionShift();
      rig.updateMatrixWorld(true);

      tempBounds.setFromObject(rig);
      if (tempBounds.isEmpty()) return;

      const projectedBounds = getProjectedBoundsY(tempBounds, camera, height);
      const sectionRect = section.getBoundingClientRect();
      const ctaRect = cta.getBoundingClientRect();
      const compositionTop = projectedBounds.minY;
      const compositionBottom = ctaRect.bottom - sectionRect.top;
      const compositionCenter = (compositionTop + compositionBottom) * 0.5;
      const shiftPx = height * 0.5 - compositionCenter;

      const distanceToRig = camera.position.z - rig.position.z;
      const visibleHeight =
        2 *
        Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5)) *
        distanceToRig;
      const worldUnitsPerPixel = visibleHeight / height;

      rig.position.y = -shiftPx * worldUnitsPerPixel;
      section.style.setProperty(
        "--glass-finale-composition-shift",
        `${shiftPx}px`
      );
      rig.updateMatrixWorld(true);
    };

    const renderScene = () => {
      if (disposed) return;
      composer.render();
    };

    const resize = () => {
      const width = mount.clientWidth || window.innerWidth;
      const height = mount.clientHeight || window.innerHeight;
      const isMobile = window.innerWidth < MOBILE_BREAKPOINT;

      renderer.setSize(width, height, false);
      renderer.setPixelRatio(getGlassFinaleDpr());
      composer.setSize(width, height);
      composer.setPixelRatio(getGlassFinaleDpr());
      bloomPass.setSize(width, height);

      camera.aspect = width / height;
      camera.fov = 60;
      camera.position.z = isMobile ? 5.6 : 5.15;
      camera.updateProjectionMatrix();

      rig.scale.setScalar(
        (isMobile ? FINALE_TUNING.scaleMobile : FINALE_TUNING.scaleDesktop) /
          maxAxis
      );
      updateCompositionAlignment();
      renderScene();
    };

    const requestRenderIfNeeded = () => {
      if (disposed || frameRequested || !sectionVisible) return;
      frameRequested = true;
      rafId = requestAnimationFrame(renderFrame);
    };

    const renderFrame = (time) => {
      frameRequested = false;

      if (disposed || !sectionVisible) return;

      const delta = Math.min((time - previousTime) / 1000, 0.033);
      previousTime = time;
      const frame = delta * 60;

      screenToRigSpace(camera, rig, pointer, tempLocalPointer);
      tempLocalPointer.multiplyScalar(FINALE_TUNING.pointerParallax);
      pointerTarget.copy(tempLocalPointer);
      pointerTarget.z = 0;

      if (!pointer.active) {
        pointerTarget.set(0, 0, 0);
      }

      pointerPosition.x = damp(pointerPosition.x, pointerTarget.x, 9, delta);
      pointerPosition.y = damp(pointerPosition.y, pointerTarget.y, 9, delta);
      pointerPosition.z = damp(pointerPosition.z, pointerTarget.z, 9, delta);

      groupTargetRotation.x = -pointer.y * 0.18;
      groupTargetRotation.y = pointer.x * 0.32;
      groupRotation.x = damp(groupRotation.x, groupTargetRotation.x, 5, delta);
      groupRotation.y = damp(groupRotation.y, groupTargetRotation.y, 5, delta);
      rig.rotation.x = groupRotation.x;
      rig.rotation.y = groupRotation.y;

      let stillMoving = pointer.active;

      pieces.forEach((piece) => {
        tempPieceCenter.copy(piece.baseCenter).add(piece.offset);
        tempForce.copy(tempPieceCenter).sub(pointerPosition);

        const distance = tempForce.length();
        if (pointer.active && distance < repulseRadius && distance > 0.0001) {
          const force = 1 - distance / repulseRadius;
          piece.velocity.addScaledVector(
            tempForce.normalize(),
            force * force * FINALE_TUNING.splitForce * frame
          );
        }

        piece.velocity.addScaledVector(
          piece.offset,
          -FINALE_TUNING.returnForce * frame
        );
        piece.velocity.multiplyScalar(Math.pow(FINALE_TUNING.damping, frame));
        piece.offset.addScaledVector(piece.velocity, frame);

        if (piece.offset.length() > maxOffset) {
          piece.offset.setLength(maxOffset);
          piece.velocity.multiplyScalar(0.92);
        }

        piece.mesh.position.copy(piece.basePosition).add(piece.offset);
        piece.mesh.quaternion.copy(piece.baseQuaternion);

        if (
          piece.velocity.lengthSq() > 0.000001 ||
          piece.offset.lengthSq() > 0.000001
        ) {
          stillMoving = true;
        }
      });

      renderScene();

      if (stillMoving) {
        requestRenderIfNeeded();
      }
    };

    const setPointerFromEvent = (event) => {
      const next = toSectionNdc(event, section);
      pointer.x = next.x;
      pointer.y = next.y;
      pointer.active = true;
      requestRenderIfNeeded();
    };

    const handlePointerLeave = () => {
      pointer.active = false;
      pointer.x = 0;
      pointer.y = 0;
      requestRenderIfNeeded();
    };

    const handleTouchMove = (event) => {
      if (!event.touches?.length) return;
      setPointerFromEvent(event.touches[0]);
    };

    resize();

    section.addEventListener("pointermove", setPointerFromEvent);
    section.addEventListener("pointerenter", setPointerFromEvent);
    section.addEventListener("pointerleave", handlePointerLeave);
    section.addEventListener("touchmove", handleTouchMove, { passive: true });
    section.addEventListener("touchend", handlePointerLeave);
    window.addEventListener("resize", resize);

    const visibilityTrigger = ScrollTrigger.create({
      trigger: section,
      start: "top bottom",
      end: "bottom top",
      onEnter: () => {
        sectionVisible = true;
        previousTime = performance.now();
        requestRenderIfNeeded();
      },
      onEnterBack: () => {
        sectionVisible = true;
        previousTime = performance.now();
        requestRenderIfNeeded();
      },
      onLeave: () => {
        sectionVisible = false;
        if (rafId) {
          cancelAnimationFrame(rafId);
          rafId = 0;
          frameRequested = false;
        }
      },
      onLeaveBack: () => {
        sectionVisible = false;
        if (rafId) {
          cancelAnimationFrame(rafId);
          rafId = 0;
          frameRequested = false;
        }
      },
    });

    sectionVisible = visibilityTrigger.isActive;
    if (sectionVisible) {
      requestRenderIfNeeded();
    } else {
      renderScene();
    }

    requestAnimationFrame(() => {
      if (disposed) return;
      updateCompositionAlignment();
      renderScene();
    });

    section.dataset.glassFinaleReady = "true";

    const cleanup = () => {
      disposed = true;
      sectionVisible = false;
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      visibilityTrigger.kill();
      window.removeEventListener("resize", resize);
      section.removeEventListener("pointermove", setPointerFromEvent);
      section.removeEventListener("pointerenter", setPointerFromEvent);
      section.removeEventListener("pointerleave", handlePointerLeave);
      section.removeEventListener("touchmove", handleTouchMove);
      section.removeEventListener("touchend", handlePointerLeave);
      composer.dispose();
      renderer.dispose();
      glassMaterial.dispose();
      environmentMap?.dispose();
    };

    window.addEventListener("pagehide", cleanup, { once: true });
  } catch (error) {
    hasInitialized = false;
    throw error;
  }
}
