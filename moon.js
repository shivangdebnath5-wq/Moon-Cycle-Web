/**
 * moon.js
 * A draggable, lit 3D Moon rendered with Three.js. The terminator (the
 * line between the lit and dark portions) is driven by the current
 * phase fraction from astronomy.js, so the sphere visually matches the
 * real phase for the selected date.
 */

const MoonScene = (() => {
  let scene, camera, renderer, moon, light, ambient, rim;
  let container, canvas;
  let dragging = false;
  let prevX = 0,
    prevY = 0;
  let rotationY = 0.4,
    rotationX = 0.05;
  let autoRotate = true;
  let currentPhaseFraction = 0.5;
  let animationId = null;

  function init(containerEl, textureUrl) {
    container = containerEl;

    scene = new THREE.Scene();

    const width = container.clientWidth;
    const height = container.clientHeight;

    camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 100);
    camera.position.set(0, 0, 5.2);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    // Correct color pipeline (r128 API — newer builds use .colorSpace instead)
    if ("outputEncoding" in renderer) renderer.outputEncoding = THREE.sRGBEncoding;
    if ("toneMapping" in renderer) {
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.15;
    }
    container.appendChild(renderer.domElement);
    canvas = renderer.domElement;

    // Low ambient so the dark side reads as genuinely dark (real
    // earthshine is faint), but not pure crushed black.
    ambient = new THREE.AmbientLight(0x30354a, 0.22);
    scene.add(ambient);

    // Key "sunlight" — position set each frame from the phase fraction
    light = new THREE.DirectionalLight(0xfff6e6, 2.4);
    light.position.set(1, 0.2, 1);
    scene.add(light);

    // Faint cool rim light for depth on the terminator edge
    rim = new THREE.DirectionalLight(0x7f9fff, 0.15);
    rim.position.set(-2, 1, -1);
    scene.add(rim);

    const geometry = new THREE.SphereGeometry(1.6, 96, 96);
    const loader = new THREE.TextureLoader();
    const material = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 1,
      metalness: 0.0,
    });

    moon = new THREE.Mesh(geometry, material);
    moon.rotation.y = rotationY;
    moon.rotation.x = rotationX;
    scene.add(moon);

    loader.load(
      textureUrl,
      (tex) => {
        if ("encoding" in tex) tex.encoding = THREE.sRGBEncoding;
        if ("colorSpace" in tex) tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = renderer.capabilities.getMaxAnisotropy
          ? renderer.capabilities.getMaxAnisotropy()
          : 1;
        material.map = tex;
        material.needsUpdate = true;
      },
      undefined,
      (err) => {
        // texture failed to load — keep a plain grey sphere, still functional
        material.color.set(0xb9b4ab);
        console.warn("Moon texture failed to load:", err);
      }
    );

    attachPointerHandlers();
    window.addEventListener("resize", onResize);
    onResize();

    animate();
  }

  function attachPointerHandlers() {
    canvas.addEventListener("pointerdown", (e) => {
      dragging = true;
      autoRotate = false;
      prevX = e.clientX;
      prevY = e.clientY;
      canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      const dx = e.clientX - prevX;
      const dy = e.clientY - prevY;
      prevX = e.clientX;
      prevY = e.clientY;
      rotationY += dx * 0.006;
      rotationX += dy * 0.006;
      rotationX = Math.max(-1.1, Math.min(1.1, rotationX));
    });
    canvas.addEventListener("pointerup", () => (dragging = false));
    canvas.addEventListener("pointerleave", () => (dragging = false));
  }

  function onResize() {
    if (!container) return;
    const width = container.clientWidth;
    const height = container.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }

  /**
   * Position the key light so the sphere's terminator matches the given
   * phase fraction (0 = new moon, 0.5 = full moon), as seen from the
   * fixed camera looking down -Z.
   */
  function setPhase(phaseFraction) {
    currentPhaseFraction = phaseFraction;
    const angle = phaseFraction * Math.PI * 2 + Math.PI; // offset so 0.5 = full (light behind camera)
    const lx = Math.sin(angle);
    const lz = Math.cos(angle);
    light.position.set(lx, 0.15, lz);
  }

  function setAutoRotate(value) {
    autoRotate = value;
  }

  function resetView() {
    rotationY = 0.4;
    rotationX = 0.05;
  }

  function animate() {
    animationId = requestAnimationFrame(animate);
    if (autoRotate && !dragging) {
      rotationY += 0.0016;
    }
    if (moon) {
      moon.rotation.y = rotationY;
      moon.rotation.x = rotationX;
    }
    renderer.render(scene, camera);
  }

  function dispose() {
    if (animationId) cancelAnimationFrame(animationId);
    window.removeEventListener("resize", onResize);
  }

  return {
    init,
    setPhase,
    setAutoRotate,
    resetView,
    dispose,
    get autoRotate() {
      return autoRotate;
    },
  };
})();