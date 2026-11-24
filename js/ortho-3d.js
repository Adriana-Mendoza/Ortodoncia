/**
 * Dra. Adriana Mendoza Orozco · Ortodoncia en Madrid
 * 3D Interactive Dental Arch, Brackets & Aligner Simulation (Three.js)
 * Fixed High-Detail Geometry, Custom Bracket/Aligner Colors, Dramatic Before/After & 5s Auto-Resume.
 */

(function () {
  'use strict';

  const container = document.getElementById('dental3dContainer');
  const slider = document.getElementById('orthoMonthSlider');
  const monthDisplay = document.getElementById('orthoMonthValue');
  const alignerCheckbox = document.getElementById('toggleAlignerCheck');
  const btnResetView = document.getElementById('btnReset3dView');

  if (!container) return;

  // =========================================================================
  // 1. HIGH-RESOLUTION GEOMETRY CONFIGURATION (Opción "Alta" fija)
  // =========================================================================
  const DETAIL = {
    toothU: 28,
    toothV: 22,
    gumArch: 120,
    gumProfile: 18,
    wireSegs: 76,
    shadowMap: 2048
  };

  // Color Palettes for User Customization
  const BRACKET_PALETTE = [
    { id: 'mix',      label: 'Multicolor Oscuro', hex: 'mix' },
    { id: 'black',    label: 'Negro Grafito',     hex: '#16181D' },
    { id: 'navy',     label: 'Azul Marino',       hex: '#153275' },
    { id: 'burgundy', label: 'Borgoña',           hex: '#871636' },
    { id: 'emerald',  label: 'Verde Esmeralda',   hex: '#105946' },
    { id: 'purple',   label: 'Púrpura Oscuro',    hex: '#461E73' },
    { id: 'bronze',   label: 'Bronce Oscuro',     hex: '#7A5310' }
  ];

  const ALIGNER_PALETTE = [
    { id: 'crystal',   label: 'Cristal',    hex: '#E2F5FC', opacity: 0.34 },
    { id: 'ice',       label: 'Azul Hielo', hex: '#6EC8F5', opacity: 0.44 },
    { id: 'champagne', label: 'Dorado',     hex: '#E6C275', opacity: 0.42 },
    { id: 'mint',      label: 'Menta',      hex: '#6ED6B8', opacity: 0.42 },
    { id: 'blush',     label: 'Rosa Suave', hex: '#F09BB4', opacity: 0.42 }
  ];

  const MIX_LIGATURE_COLORS = [
    0x2395AB, 0xD65272, 0xC49A45, 0x3164C9, 0x3BA896, 0x825EB0, 0x5B6878
  ];

  // =========================================================================
  // 2. STATE & SCENE VARIABLES
  // =========================================================================
  let scene, camera, renderer, keyLight;
  let modelRoot, lowerJawGroup, hingePivot, upperJawGroup;
  let lowerWireMesh, upperWireMesh;
  let lowerAlignerMesh, upperAlignerMesh;
  let lowerGumMesh, upperGumMesh;
  let teethRecords = [];
  let toothGeometryCache = {};

  // Active Colors
  let activeBracketColor = 'mix';
  let activeAlignerColor = '#E2F5FC';
  let activeAlignerOpacity = 0.34;

  // Timeline & 5-Second Auto-Resume State
  const TOTAL_MONTHS = 14;
  const RESUME_DELAY_MS = 5000;
  let exactMonth = 0.0;
  let isAutoPlaying = true;
  let isSliderActive = false;
  let resumeTimeout = null;
  let holdTimer = 0.0;
  let holdPhase = 'none'; // 'end' | 'start' | 'none'

  // Orbit / Drag Interaction
  let isDragging = false;
  let previousMousePosition = { x: 0, y: 0 };
  let isUserRotating = false;
  let rotationTimeout;
  const DEFAULT_MODEL_ROT = { x: 0.22, y: 0.34 };

  // Materials
  let enamelMat, gumMat, acrylicMat, bracketMat, wireMat, alignerMat;

  // Timing
  let lastFrameTime = performance.now();

  // Anatomical tooth proportions
  const TOOTH_SPECS = {
    upper: [
      { type: 'central',  width: 1.38, height: 1.18, depth: 0.72 },
      { type: 'lateral',  width: 1.08, height: 1.05, depth: 0.66 },
      { type: 'canine',   width: 1.20, height: 1.26, depth: 0.78 },
      { type: 'premolar', width: 1.10, height: 1.04, depth: 0.92 },
      { type: 'premolar', width: 1.06, height: 1.00, depth: 0.90 },
      { type: 'molar',    width: 1.50, height: 0.98, depth: 1.18 },
      { type: 'molar',    width: 1.40, height: 0.94, depth: 1.14 }
    ],
    lower: [
      { type: 'lateral',  width: 0.92, height: 1.05, depth: 0.62 },
      { type: 'lateral',  width: 0.98, height: 1.08, depth: 0.64 },
      { type: 'canine',   width: 1.10, height: 1.22, depth: 0.74 },
      { type: 'premolar', width: 1.06, height: 1.02, depth: 0.86 },
      { type: 'premolar', width: 1.08, height: 1.00, depth: 0.88 },
      { type: 'molar',    width: 1.52, height: 0.96, depth: 1.14 },
      { type: 'molar',    width: 1.42, height: 0.92, depth: 1.10 }
    ]
  };

  // =========================================================================
  // 3. INITIALIZATION, LIGHTING & HIGH-CONTRAST MATERIALS
  // =========================================================================
  function init3D() {
    if (getComputedStyle(container).position === 'static') {
      container.style.position = 'relative';
    }

    scene = new THREE.Scene();

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 520;
    camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 200);
    camera.position.set(0, 4.4, 26.8);
    camera.lookAt(0, 0.1, 0);

    renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.94; // Controlled exposure so teeth never blow out to flat white

    if ('outputColorSpace' in renderer && THREE.SRGBColorSpace) {
      renderer.outputColorSpace = THREE.SRGBColorSpace;
    } else if ('outputEncoding' in renderer && THREE.sRGBEncoding) {
      renderer.outputEncoding = THREE.sRGBEncoding;
    }

    container.appendChild(renderer.domElement);

    setupStudioEnvironment();
    setupLighting();
    initMaterials();
    buildTypodontModel();
    createColorCustomizerUI();
    setupEvents();

    updateOrthoProgress(0.0, true);

    lastFrameTime = performance.now();
    requestAnimationFrame(animate);
  }

  function setupStudioEnvironment() {
    try {
      if (typeof THREE.PMREMGenerator !== 'function') return;
      const pmrem = new THREE.PMREMGenerator(renderer);
      const envScene = new THREE.Scene();
      envScene.background = new THREE.Color(0xB8AFA2);

      const panelMat1 = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
      const panelMat2 = new THREE.MeshBasicMaterial({ color: 0xF7EBD5 });
      const panelMat3 = new THREE.MeshBasicMaterial({ color: 0xC9DFEE });

      const topPanel = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), panelMat1);
      topPanel.position.set(0, 14, 0);
      topPanel.rotation.x = Math.PI / 2;
      envScene.add(topPanel);

      const frontRight = new THREE.Mesh(new THREE.PlaneGeometry(14, 10), panelMat2);
      frontRight.position.set(14, 6, 12);
      frontRight.lookAt(0, 0, 0);
      envScene.add(frontRight);

      const leftCool = new THREE.Mesh(new THREE.PlaneGeometry(14, 10), panelMat3);
      leftCool.position.set(-14, 4, 10);
      leftCool.lookAt(0, 0, 0);
      envScene.add(leftCool);

      const envRT = pmrem.fromScene(envScene, 0.04);
      scene.environment = envRT.texture;

      topPanel.geometry.dispose();
      frontRight.geometry.dispose();
      leftCool.geometry.dispose();
      panelMat1.dispose();
      panelMat2.dispose();
      panelMat3.dispose();
      pmrem.dispose();
    } catch (e) {
      // Safe fallback
    }
  }

  function setupLighting() {
    // Low ambient/hemi ratio preserves rich depth and dark interdental shadows
    const hemiLight = new THREE.HemisphereLight(0xFFFDF8, 0x8A7A6B, 0.26);
    scene.add(hemiLight);

    // Key Light (Warm Clinical Lamp casting defined shadows)
    keyLight = new THREE.DirectionalLight(0xFFF8EC, 1.25);
    keyLight.position.set(10, 15, 13);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(DETAIL.shadowMap, DETAIL.shadowMap);
    keyLight.shadow.camera.near = 2;
    keyLight.shadow.camera.far = 46;
    keyLight.shadow.camera.left = -12;
    keyLight.shadow.camera.right = 12;
    keyLight.shadow.camera.top = 12;
    keyLight.shadow.camera.bottom = -12;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    // Subtle cool side fill for 3D sculpting
    const fillLight = new THREE.DirectionalLight(0xCBE2F5, 0.36);
    fillLight.position.set(-14, 5, 7);
    scene.add(fillLight);

    // Warm rim light to separate model silhouette cleanly from cream background
    const rimLight = new THREE.DirectionalLight(0xD4AF37, 0.55);
    rimLight.position.set(-3, 9, -16);
    scene.add(rimLight);
  }

  function initMaterials() {
    // Warm Ivory Porcelain Enamel (distinct from pure white & cream background)
    enamelMat = new THREE.MeshPhysicalMaterial({
      color: 0xF1E8D5,
      roughness: 0.20,
      metalness: 0.0,
      clearcoat: 0.88,
      clearcoatRoughness: 0.12,
      reflectivity: 0.72,
      envMapIntensity: 0.48
    });

    // Rich Anatomical Coral-Pink Gingiva
    gumMat = new THREE.MeshPhysicalMaterial({
      color: 0xC84D56,
      roughness: 0.32,
      metalness: 0.0,
      clearcoat: 0.48,
      clearcoatRoughness: 0.20,
      envMapIntensity: 0.42
    });

    // Subtle Pearl-Stone Acrylic Base (separates cleanly from cream canvas & ivory teeth)
    acrylicMat = new THREE.MeshPhysicalMaterial({
      color: 0xDDD4C6,
      roughness: 0.30,
      metalness: 0.02,
      clearcoat: 0.45,
      clearcoatRoughness: 0.22,
      envMapIntensity: 0.40
    });

    // Crisp Gunmetal / Stainless Steel Brackets (stands out clearly against ivory enamel)
    bracketMat = new THREE.MeshStandardMaterial({
      color: 0x9CA6B2,
      roughness: 0.20,
      metalness: 0.90,
      envMapIntensity: 1.05
    });

    // Polished NiTi Archwire
    wireMat = new THREE.MeshStandardMaterial({
      color: 0x8F99A6,
      roughness: 0.16,
      metalness: 0.94,
      envMapIntensity: 1.15
    });

    // Customizable Translucent Clear Aligner Polymer
    alignerMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(activeAlignerColor),
      transparent: true,
      opacity: activeAlignerOpacity,
      roughness: 0.06,
      metalness: 0.04,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
      envMapIntensity: 0.85,
      depthWrite: false,
      side: THREE.DoubleSide
    });
  }

  // =========================================================================
  // 4. PARAMETRIC DENTAL ARCH CURVE
  // =========================================================================
  function evalArchPoint(s, scale) {
    const sc = scale || 1.0;
    const x = (5.05 * Math.sin(s * 1.12) + 0.45 * s) * sc;
    const z = (4.35 - 6.75 * (s * s) - 1.15 * (1.0 - Math.cos(s * 1.12))) * sc;
    return new THREE.Vector3(x, 0, z);
  }

  function buildArchSampler(scale, samples) {
    const N = samples || 200;
    const pts = [];
    const cumLen = [0];
    for (let i = 0; i <= N; i++) {
      const s = -1 + (2 * i) / N;
      const p = evalArchPoint(s, scale);
      pts.push({ s, p });
      if (i > 0) {
        cumLen.push(cumLen[i - 1] + p.distanceTo(pts[i - 1].p));
      }
    }
    const totalLen = cumLen[N];
    const midLen = totalLen * 0.5;

    function getAtArcOffset(offsetFromMidline) {
      const targetLen = THREE.MathUtils.clamp(midLen + offsetFromMidline, 0, totalLen);
      let idx = 0;
      while (idx < N && cumLen[idx + 1] < targetLen) idx++;
      const l0 = cumLen[idx];
      const l1 = cumLen[Math.min(idx + 1, N)];
      const alpha = l1 > l0 ? (targetLen - l0) / (l1 - l0) : 0;
      const sVal = THREE.MathUtils.lerp(pts[idx].s, pts[Math.min(idx + 1, N)].s, alpha);

      const p = evalArchPoint(sVal, scale);
      const eps = 0.005;
      const pPrev = evalArchPoint(sVal - eps, scale);
      const pNext = evalArchPoint(sVal + eps, scale);
      const tangent = new THREE.Vector3().subVectors(pNext, pPrev).normalize();
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
      if (normal.dot(new THREE.Vector3(p.x, 0, p.z + 2.0)) < 0) {
        normal.negate();
      }
      return { s: sVal, pos: p, tangent, normal };
    }

    return { totalLen, getAtArcOffset };
  }

  // =========================================================================
  // 5. ANATOMICAL TOOTH SCULPTING (HIGH RESOLUTION)
  // =========================================================================
  function createAnatomicalToothGeometry(type) {
    const geom = new THREE.SphereGeometry(1, DETAIL.toothU, DETAIL.toothV);
    const pos = geom.attributes.position;

    for (let i = 0; i < pos.count; i++) {
      let nx = pos.getX(i);
      let ny = pos.getY(i);
      let nz = pos.getZ(i);

      const exp = type === 'molar' ? 0.58 : (type === 'premolar' ? 0.66 : 0.72);
      let x = Math.sign(nx) * Math.pow(Math.abs(nx), exp);
      let z = Math.sign(nz) * Math.pow(Math.abs(nz), exp);
      let y = ny;

      const neckT = THREE.MathUtils.smoothstep(y, -1.0, 0.15);
      x *= 0.72 + 0.28 * neckT;
      z *= 0.75 + 0.25 * neckT;

      if (nz > 0) {
        z += 0.06 * (1.0 - y * y) * (1.0 - nx * nx);
      }

      if (type === 'central' || type === 'lateral') {
        const incisalT = THREE.MathUtils.smoothstep(y, -0.1, 1.0);
        z *= (1.0 - 0.58 * incisalT);
        if (nz < 0 && y > -0.1) {
          z += 0.16 * THREE.MathUtils.smoothstep(y, -0.1, 0.7) * (1.0 - nx * nx);
        }
        if (y > 0.78) {
          y = 0.78 + (y - 0.78) * 0.45;
        }
      } else if (type === 'canine') {
        const cuspT = THREE.MathUtils.smoothstep(y, 0.15, 1.0);
        x *= (1.0 - 0.42 * cuspT);
        z *= (1.0 - 0.48 * cuspT);
        y += 0.18 * cuspT * Math.max(0, 1.0 - nx * nx * 1.4);
        if (nz > 0) {
          z += 0.10 * (1.0 - Math.min(1, nx * nx * 2.0)) * (1.0 - y * y * 0.5);
        }
      } else if (type === 'premolar') {
        if (y > 0.30) {
          const topT = THREE.MathUtils.smoothstep(y, 0.30, 0.95);
          const cuspProfile = Math.exp(-Math.pow(Math.abs(nz) - 0.50, 2) / 0.11);
          const centralGroove = Math.exp(-Math.pow(nz, 2) / 0.04);
          y = 0.85 * Math.min(y, 0.88) + 0.15 * y;
          y += 0.16 * cuspProfile * topT - 0.11 * centralGroove * topT;
        }
      } else if (type === 'molar') {
        if (y > 0.30) {
          const topT = THREE.MathUtils.smoothstep(y, 0.30, 0.95);
          const cuspWave = Math.sin(Math.min(1, Math.abs(nx)) * Math.PI) *
                           Math.sin(Math.min(1, Math.abs(nz)) * Math.PI);
          y = 0.82 * Math.min(y, 0.86) + 0.18 * y;
          y += 0.16 * cuspWave * topT - 0.10 * (1.0 - cuspWave) * topT;
        }
      }

      pos.setXYZ(i, x, y, z);
    }

    geom.computeVertexNormals();
    return geom;
  }

  function buildToothGeometryCache() {
    ['central', 'lateral', 'canine', 'premolar', 'molar'].forEach((t) => {
      toothGeometryCache[t] = createAnatomicalToothGeometry(t);
    });
  }

  // =========================================================================
  // 6. SCULPTED GUMS, CLEAN ACRYLIC BASE & ALIGNER SHELL
  // =========================================================================
  function createSculptedGumGeometry(scale, toothArcOffsets) {
    const archSegs = DETAIL.gumArch;
    const profSegs = DETAIL.gumProfile;

    const positions = [];
    const indices = [];
    const startS = -1.04;
    const endS = 1.04;

    function getProfilePoint(v, festoonOffset) {
      const theta = v * Math.PI;
      const baseWidth = 1.24; // Wide enough to keep dramatically crooked roots anchored inside gingiva
      const offsetN = -Math.cos(theta) * baseWidth;
      let h = Math.sin(theta) * 1.42 + festoonOffset * Math.pow(Math.sin(theta), 1.5);
      const centerDip = Math.exp(-Math.pow(offsetN, 2) / 0.24) * 0.22;
      h = Math.max(0.0, h - centerDip);
      return { offsetN, h };
    }

    for (let i = 0; i <= archSegs; i++) {
      const s = THREE.MathUtils.lerp(startS, endS, i / archSegs);
      const p = evalArchPoint(s, scale);
      const eps = 0.008;
      const pPrev = evalArchPoint(s - eps, scale);
      const pNext = evalArchPoint(s + eps, scale);
      const tangent = new THREE.Vector3().subVectors(pNext, pPrev).normalize();
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
      if (normal.dot(new THREE.Vector3(p.x, 0, p.z + 2.0)) < 0) normal.negate();

      let festoon = 0.0;
      if (toothArcOffsets && toothArcOffsets.length > 0) {
        let minDist = 99;
        for (let k = 0; k < toothArcOffsets.length; k++) {
          const d = Math.abs(s - toothArcOffsets[k]);
          if (d < minDist) minDist = d;
        }
        festoon = THREE.MathUtils.clamp((minDist - 0.03) * 2.4, -0.14, 0.18);
      }

      const endTaper = 1.0 - Math.pow(Math.max(0, (Math.abs(s) - 0.94) / 0.10), 2) * 0.50;

      for (let j = 0; j <= profSegs; j++) {
        const v = j / profSegs;
        const prof = getProfilePoint(v, festoon);
        positions.push(
          p.x + normal.x * prof.offsetN * endTaper,
          prof.h * endTaper,
          p.z + normal.z * prof.offsetN * endTaper
        );
      }
    }

    const row = profSegs + 1;
    for (let i = 0; i < archSegs; i++) {
      for (let j = 0; j < profSegs; j++) {
        const a = i * row + j;
        const b = (i + 1) * row + j;
        const c = (i + 1) * row + (j + 1);
        const d = i * row + (j + 1);
        indices.push(a, b, d);
        indices.push(b, c, d);
      }
    }

    [0, archSegs].forEach((endIdx, capSide) => {
      const centerIndex = positions.length / 3;
      let cx = 0, cy = 0, cz = 0;
      for (let j = 0; j <= profSegs; j++) {
        const idx = (endIdx * row + j) * 3;
        cx += positions[idx];
        cy += positions[idx + 1];
        cz += positions[idx + 2];
      }
      const n = profSegs + 1;
      positions.push(cx / n, cy / n, cz / n);
      for (let j = 0; j < profSegs; j++) {
        const p1 = endIdx * row + j;
        const p2 = endIdx * row + j + 1;
        if (capSide === 0) indices.push(centerIndex, p2, p1);
        else indices.push(centerIndex, p1, p2);
      }
    });

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geom.setIndex(indices);
    geom.computeVertexNormals();
    return geom;
  }

  function createAcrylicBaseGeometry(scale) {
    const archSegs = Math.floor(DETAIL.gumArch * 0.75);
    const positions = [];
    const indices = [];
    const startS = -1.06;
    const endS = 1.06;

    const profile = [
      { n: -1.26, y: 0.04 },
      { n: -1.32, y: -0.14 },
      { n: -1.30, y: -0.62 },
      { n: -1.16, y: -0.74 },
      { n: 1.16,  y: -0.74 },
      { n: 1.30,  y: -0.62 },
      { n: 1.34,  y: -0.14 },
      { n: 1.28,  y: 0.04 },
      { n: -1.26, y: 0.04 }
    ];
    const profLen = profile.length - 1;

    for (let i = 0; i <= archSegs; i++) {
      const s = THREE.MathUtils.lerp(startS, endS, i / archSegs);
      const p = evalArchPoint(s, scale);
      const eps = 0.008;
      const pPrev = evalArchPoint(s - eps, scale);
      const pNext = evalArchPoint(s + eps, scale);
      const tangent = new THREE.Vector3().subVectors(pNext, pPrev).normalize();
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
      if (normal.dot(new THREE.Vector3(p.x, 0, p.z + 2.0)) < 0) normal.negate();

      for (let j = 0; j <= profLen; j++) {
        const pr = profile[j];
        positions.push(
          p.x + normal.x * pr.n,
          pr.y,
          p.z + normal.z * pr.n
        );
      }
    }

    const row = profLen + 1;
    for (let i = 0; i < archSegs; i++) {
      for (let j = 0; j < profLen; j++) {
        const a = i * row + j;
        const b = (i + 1) * row + j;
        const c = (i + 1) * row + (j + 1);
        const d = i * row + (j + 1);
        indices.push(a, b, d);
        indices.push(b, c, d);
      }
    }

    [0, archSegs].forEach((endIdx, capSide) => {
      const centerIndex = positions.length / 3;
      let cx = 0, cy = 0, cz = 0;
      for (let j = 0; j < profLen; j++) {
        const idx = (endIdx * row + j) * 3;
        cx += positions[idx];
        cy += positions[idx + 1];
        cz += positions[idx + 2];
      }
      positions.push(cx / profLen, cy / profLen, cz / profLen);
      for (let j = 0; j < profLen; j++) {
        const p1 = endIdx * row + j;
        const p2 = endIdx * row + j + 1;
        if (capSide === 0) indices.push(centerIndex, p2, p1);
        else indices.push(centerIndex, p1, p2);
      }
    });

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geom.setIndex(indices);
    geom.computeVertexNormals();
    return geom;
  }

  function createAlignerGeometry(scale) {
    const archSegs = DETAIL.gumArch;
    const profSegs = 14;
    const positions = [];
    const indices = [];

    for (let i = 0; i <= archSegs; i++) {
      const s = THREE.MathUtils.lerp(-0.98, 0.98, i / archSegs);
      const p = evalArchPoint(s, scale);
      const eps = 0.008;
      const pPrev = evalArchPoint(s - eps, scale);
      const pNext = evalArchPoint(s + eps, scale);
      const tangent = new THREE.Vector3().subVectors(pNext, pPrev).normalize();
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
      if (normal.dot(new THREE.Vector3(p.x, 0, p.z + 2.0)) < 0) normal.negate();

      for (let j = 0; j <= profSegs; j++) {
        const theta = (j / profSegs) * Math.PI;
        const offsetN = -Math.cos(theta) * 0.78;
        const y = 1.24 + Math.sin(theta) * 1.56;
        positions.push(p.x + normal.x * offsetN, y, p.z + normal.z * offsetN);
      }
    }

    const row = profSegs + 1;
    for (let i = 0; i < archSegs; i++) {
      for (let j = 0; j < profSegs; j++) {
        const a = i * row + j;
        const b = (i + 1) * row + j;
        const c = (i + 1) * row + (j + 1);
        const d = i * row + (j + 1);
        indices.push(a, b, d);
        indices.push(b, c, d);
      }
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geom.setIndex(indices);
    geom.computeVertexNormals();
    return geom;
  }

  // =========================================================================
  // 7. ORTHODONTIC BRACKET BUILDER (Customizable Ligature Color)
  // =========================================================================
  function createBracketAssembly(defaultLigColorHex, isMolar) {
    const group = new THREE.Group();

    const pad = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.34, 0.08), bracketMat);
    pad.castShadow = true;
    group.add(pad);

    let ligRing = null;

    if (isMolar) {
      const tube = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.24, 0.16), bracketMat);
      tube.position.z = 0.08;
      tube.castShadow = true;
      group.add(tube);

      // Subtle molar band ring accent so color customization reflects cleanly on molars too
      const ligMat = new THREE.MeshStandardMaterial({
        color: defaultLigColorHex,
        roughness: 0.32,
        metalness: 0.08
      });
      ligRing = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.032, 8, 16), ligMat);
      ligRing.position.z = 0.12;
      ligRing.scale.set(1.25, 0.72, 1.0);
      group.add(ligRing);
    } else {
      const wingGeom = new THREE.BoxGeometry(0.12, 0.11, 0.14);
      [
        [-0.10,  0.09], [0.10,  0.09],
        [-0.10, -0.09], [0.10, -0.09]
      ].forEach(([wx, wy]) => {
        const w = new THREE.Mesh(wingGeom, bracketMat);
        w.position.set(wx, wy, 0.07);
        w.castShadow = true;
        group.add(w);
      });

      const ligMat = new THREE.MeshStandardMaterial({
        color: defaultLigColorHex,
        roughness: 0.32,
        metalness: 0.06
      });
      ligRing = new THREE.Mesh(new THREE.TorusGeometry(0.155, 0.04, 8, 18), ligMat);
      ligRing.position.z = 0.09;
      ligRing.scale.set(1.06, 0.94, 1.0);
      group.add(ligRing);
    }

    return { group, ligRing };
  }

  // =========================================================================
  // 8. BUILD COMPLETE MODEL (NO BLOCKS, NO FLOATING HINGE BAR)
  // =========================================================================
  function buildTypodontModel() {
    modelRoot = new THREE.Group();
    scene.add(modelRoot);

    // Fixed horizontal ground shadow plane in scene space (won't tilt when dragging)
    const shadowPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(40, 40),
      new THREE.ShadowMaterial({ opacity: 0.13 })
    );
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -4.25;
    shadowPlane.receiveShadow = true;
    scene.add(shadowPlane);

    buildToothGeometryCache();

    // Lower Jaw
    lowerJawGroup = new THREE.Group();
    lowerJawGroup.position.set(0, -2.25, 0);
    modelRoot.add(lowerJawGroup);

    // Upper Jaw articulated cleanly open (~18°)
    hingePivot = new THREE.Group();
    hingePivot.position.set(0, 0.25, -5.4);
    hingePivot.rotation.x = -0.32;
    modelRoot.add(hingePivot);

    upperJawGroup = new THREE.Group();
    upperJawGroup.position.set(0, 2.55, 5.4);
    upperJawGroup.rotation.z = Math.PI;
    hingePivot.add(upperJawGroup);

    const lowerToothS = buildArchSide(lowerJawGroup, false, 0.96);
    const upperToothS = buildArchSide(upperJawGroup, true, 1.04);

    // Sculpted Coral Gums
    lowerGumMesh = new THREE.Mesh(createSculptedGumGeometry(0.96, lowerToothS), gumMat);
    lowerGumMesh.castShadow = true;
    lowerGumMesh.receiveShadow = true;
    lowerJawGroup.add(lowerGumMesh);

    upperGumMesh = new THREE.Mesh(createSculptedGumGeometry(1.04, upperToothS), gumMat);
    upperGumMesh.castShadow = true;
    upperGumMesh.receiveShadow = true;
    upperJawGroup.add(upperGumMesh);

    // Clean Pearl-Stone Acrylic Bases (sin cuadros ni piezas sobresalientes)
    const lowerBase = new THREE.Mesh(createAcrylicBaseGeometry(0.96), acrylicMat);
    lowerBase.castShadow = true;
    lowerBase.receiveShadow = true;
    lowerJawGroup.add(lowerBase);

    const upperBase = new THREE.Mesh(createAcrylicBaseGeometry(1.04), acrylicMat);
    upperBase.castShadow = true;
    upperBase.receiveShadow = true;
    upperJawGroup.add(upperBase);

    // Dynamic Orthodontic Archwires
    lowerWireMesh = new THREE.Mesh(new THREE.BufferGeometry(), wireMat);
    lowerWireMesh.castShadow = true;
    lowerJawGroup.add(lowerWireMesh);

    upperWireMesh = new THREE.Mesh(new THREE.BufferGeometry(), wireMat);
    upperWireMesh.castShadow = true;
    upperJawGroup.add(upperWireMesh);

    // Clear Aligners
    lowerAlignerMesh = new THREE.Mesh(createAlignerGeometry(0.96), alignerMat);
    lowerAlignerMesh.visible = false;
    lowerJawGroup.add(lowerAlignerMesh);

    upperAlignerMesh = new THREE.Mesh(createAlignerGeometry(1.04), alignerMat);
    upperAlignerMesh.visible = false;
    upperJawGroup.add(upperAlignerMesh);

    modelRoot.rotation.set(DEFAULT_MODEL_ROT.x, DEFAULT_MODEL_ROT.y, 0);
  }

  function buildArchSide(jawGroup, isUpper, archScale) {
    const specs = isUpper ? TOOTH_SPECS.upper : TOOTH_SPECS.lower;
    const sampler = buildArchSampler(archScale, 200);
    const toothSValues = [];

    const sequence = [];
    for (let i = specs.length - 1; i >= 0; i--) sequence.push({ side: -1, idx: i });
    for (let i = 0; i < specs.length; i++) sequence.push({ side: 1, idx: i });

    const sideOffsets = [];
    let acc = 0.04;
    for (let i = 0; i < specs.length; i++) {
      const w = specs[i].width * archScale;
      sideOffsets.push(acc + w * 0.5);
      acc += w + 0.03;
    }

    sequence.forEach(({ side, idx }) => {
      const spec = specs[idx];
      const arcOffset = side * sideOffsets[idx];
      const sample = sampler.getAtArcOffset(arcOffset);
      toothSValues.push(sample.s);

      const mesh = new THREE.Mesh(toothGeometryCache[spec.type], enamelMat);
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      const sx = spec.width * 0.52 * archScale;
      const sy = spec.height * 1.18;
      const sz = spec.depth * 0.56 * archScale;
      mesh.scale.set(sx, sy, sz);

      // Final Ideal Position (Month 14): seated firmly inside sculpted gingiva
      const finalY = 1.48;
      const finalPos = new THREE.Vector3(sample.pos.x, finalY, sample.pos.z);

      const yaw = Math.atan2(sample.normal.x, sample.normal.z);
      const torque = idx <= 1 ? (isUpper ? 0.14 : 0.08) : 0.02;
      const finalRot = new THREE.Euler(torque, yaw, 0, 'YXZ');

      // =====================================================================
      // DRAMATIC INITIAL MALOCCLUSION (Month 0) para un "Antes/Después" notable
      // =====================================================================
      let offX = 0, offY = 0, offZ = 0;
      let rPitch = 0, rYaw = 0, rRoll = 0;
      const nx = sample.normal.x;
      const nz = sample.normal.z;

      if (isUpper) {
        if (idx === 0) {
          // Upper centrals: notable V-winging & asymmetric overlap
          rYaw = side * 0.46;
          rRoll = -side * 0.20;
          rPitch = side > 0 ? 0.16 : -0.10;
          const push = side > 0 ? 0.50 : -0.26;
          offX += nx * push;
          offZ += nz * push;
          offY += side > 0 ? 0.12 : -0.14;
        } else if (idx === 1) {
          // Upper laterals: strongly palatally retruded & rotated behind centrals
          offX -= nx * 0.68;
          offZ -= nz * 0.68;
          offY -= 0.18;
          rYaw = -side * 0.60;
          rPitch = -0.26;
          rRoll = side * 0.22;
        } else if (idx === 2) {
          // Upper canines: prominent high ectopic canines ("colmillos montados")
          offX += nx * 0.64;
          offZ += nz * 0.64;
          offY -= 0.56; // High toward upper gumline
          rRoll = side * 0.34;
          rYaw = side * 0.30;
          rPitch = 0.20;
        } else if (idx === 3) {
          // 1st premolars: inward tipping & rotation
          offX -= nx * 0.40;
          offZ -= nz * 0.40;
          rYaw = -side * 0.46;
          rRoll = -side * 0.18;
        } else if (idx === 4) {
          // 2nd premolars: mild rotation
          offX += nx * 0.18;
          offZ += nz * 0.18;
          rYaw = side * 0.26;
        }
      } else {
        // Severe lower anterior crowding & arch irregularity
        if (idx === 0) {
          const push = side > 0 ? -0.44 : 0.48;
          offX += nx * push;
          offZ += nz * push;
          offY += side > 0 ? -0.14 : 0.18;
          rYaw = -side * 0.56;
          rRoll = side * 0.24;
          rPitch = side > 0 ? -0.18 : 0.18;
        } else if (idx === 1) {
          offX -= nx * 0.62;
          offZ -= nz * 0.62;
          offY -= 0.16;
          rYaw = side * 0.64;
          rPitch = -0.24;
          rRoll = -side * 0.22;
        } else if (idx === 2) {
          offX += nx * 0.52;
          offZ += nz * 0.52;
          offY += 0.24;
          rRoll = side * 0.32;
          rYaw = side * 0.28;
        } else if (idx === 3) {
          offX -= nx * 0.36;
          offZ -= nz * 0.36;
          rYaw = -side * 0.42;
          rRoll = -side * 0.16;
        } else if (idx === 4) {
          offX += nx * 0.16;
          offZ += nz * 0.16;
          rYaw = side * 0.24;
        }
      }

      const initialPos = new THREE.Vector3(finalPos.x + offX, finalPos.y + offY, finalPos.z + offZ);
      const initialRot = new THREE.Euler(
        finalRot.x + rPitch,
        finalRot.y + rYaw,
        finalRot.z + rRoll,
        'YXZ'
      );

      mesh.position.copy(initialPos);
      mesh.rotation.copy(initialRot);
      jawGroup.add(mesh);

      const mixColor = MIX_LIGATURE_COLORS[(idx + (side > 0 ? 0 : 2)) % MIX_LIGATURE_COLORS.length];
      const { group: bracketGroup, ligRing } = createBracketAssembly(mixColor, idx >= 5);
      bracketGroup.scale.set(1 / sx, 1 / sy, 1 / sz);
      const surfaceZ = idx >= 5 ? 0.96 : (idx <= 1 ? 0.88 : 0.92);
      bracketGroup.position.set(0, 0.22, surfaceZ);
      mesh.add(bracketGroup);

      teethRecords.push({
        mesh,
        jawGroup,
        type: spec.type,
        isUpper,
        bracketGroup,
        ligRing,
        mixColor,
        slotLocalPos: new THREE.Vector3(0, 0, 0.11),
        initialPos,
        finalPos,
        initialRot,
        finalRot
      });
    });

    return toothSValues;
  }

  // =========================================================================
  // 9. REAL-TIME ARCHWIRE & PROGRESSION
  // =========================================================================
  function updateDynamicArchwire(jawGroup, wireMesh, isUpper) {
    if (!wireMesh || !wireMesh.visible) return;

    jawGroup.updateMatrixWorld(true);
    const invJawMatrix = new THREE.Matrix4().copy(jawGroup.matrixWorld).invert();

    const wirePoints = [];
    teethRecords.forEach((rec) => {
      if (rec.isUpper !== isUpper) return;
      const worldPt = rec.slotLocalPos.clone().applyMatrix4(rec.bracketGroup.matrixWorld);
      wirePoints.push(worldPt.applyMatrix4(invJawMatrix));
    });

    if (wirePoints.length < 4) return;

    const curve = new THREE.CatmullRomCurve3(wirePoints, false, 'centripetal', 0.45);
    const newGeom = new THREE.TubeGeometry(curve, DETAIL.wireSegs, 0.048, 6, false);

    if (wireMesh.geometry) wireMesh.geometry.dispose();
    wireMesh.geometry = newGeom;
  }

  function updateOrthoProgress(t, syncSliderUI) {
    const clampedT = THREE.MathUtils.clamp(t, 0, 1);

    teethRecords.forEach((rec) => {
      rec.mesh.position.lerpVectors(rec.initialPos, rec.finalPos, clampedT);
      rec.mesh.rotation.x = THREE.MathUtils.lerp(rec.initialRot.x, rec.finalRot.x, clampedT);
      rec.mesh.rotation.y = THREE.MathUtils.lerp(rec.initialRot.y, rec.finalRot.y, clampedT);
      rec.mesh.rotation.z = THREE.MathUtils.lerp(rec.initialRot.z, rec.finalRot.z, clampedT);
    });

    const showAligner = Boolean(alignerCheckbox && alignerCheckbox.checked);

    teethRecords.forEach((rec) => {
      rec.bracketGroup.visible = !showAligner;
    });
    if (lowerWireMesh) lowerWireMesh.visible = !showAligner;
    if (upperWireMesh) upperWireMesh.visible = !showAligner;
    if (lowerAlignerMesh) lowerAlignerMesh.visible = showAligner;
    if (upperAlignerMesh) upperAlignerMesh.visible = showAligner;

    if (!showAligner) {
      updateDynamicArchwire(lowerJawGroup, lowerWireMesh, false);
      updateDynamicArchwire(upperJawGroup, upperWireMesh, true);
    }

    const displayMonth = Math.round(clampedT * TOTAL_MONTHS);
    if (monthDisplay) {
      monthDisplay.textContent = `Mes ${displayMonth} de ${TOTAL_MONTHS}`;
    }
    if (syncSliderUI && slider) {
      slider.value = (clampedT * TOTAL_MONTHS).toFixed(2);
    }
  }

  // =========================================================================
  // 10. BRACKET & ALIGNER COLOR CUSTOMIZATION + FLOATING SELECTOR UI
  // =========================================================================
  function setBracketColor(colorValue, switchToBracketsMode) {
    activeBracketColor = colorValue;
    teethRecords.forEach((rec) => {
      if (!rec.ligRing || !rec.ligRing.material) return;
      if (colorValue === 'mix') {
        rec.ligRing.material.color.setHex(rec.mixColor);
      } else {
        rec.ligRing.material.color.set(colorValue);
      }
    });

    if (switchToBracketsMode && alignerCheckbox && alignerCheckbox.checked) {
      alignerCheckbox.checked = false;
      updateOrthoProgress(exactMonth / TOTAL_MONTHS, false);
    }
  }

  function setAlignerColor(colorHex, customOpacity, switchToAlignerMode) {
    activeAlignerColor = colorHex;
    if (typeof customOpacity === 'number') {
      activeAlignerOpacity = customOpacity;
    } else {
      // Subtle translucent tint for custom colors
      activeAlignerOpacity = colorHex.toUpperCase() === '#E2F5FC' ? 0.34 : 0.44;
    }

    if (alignerMat) {
      alignerMat.color.set(activeAlignerColor);
      alignerMat.opacity = activeAlignerOpacity;
    }

    if (switchToAlignerMode && alignerCheckbox && !alignerCheckbox.checked) {
      alignerCheckbox.checked = true;
      updateOrthoProgress(exactMonth / TOTAL_MONTHS, false);
    }
  }

  function createColorCustomizerUI() {
    const bar = document.createElement('div');
    bar.style.cssText = [
      'position:absolute',
      'bottom:12px',
      'right:12px',
      'z-index:20',
      'display:flex',
      'flex-wrap:wrap',
      'align-items:center',
      'gap:10px',
      'max-width:calc(100% - 24px)',
      'padding:7px 12px',
      'background:rgba(255,255,255,0.92)',
      'backdrop-filter:blur(6px)',
      'border:1px solid #E2D9C8',
      'border-radius:12px',
      'font-family:system-ui,-apple-system,sans-serif',
      'font-size:11px',
      'color:#221F1C',
      'box-shadow:0 4px 16px rgba(34,31,28,0.08)'
    ].join(';');

    ['mousedown', 'touchstart', 'pointerdown'].forEach((evt) => {
      bar.addEventListener(evt, (e) => e.stopPropagation());
    });

    function createGroup(titleText, swatches, initialActive, onSelect) {
      const grp = document.createElement('div');
      grp.style.cssText = 'display:flex;align-items:center;gap:5px;';

      const lbl = document.createElement('span');
      lbl.textContent = titleText;
      lbl.style.cssText = 'font-weight:600;color:#4E4942;margin-right:2px;';
      grp.appendChild(lbl);

      const dotButtons = [];
      const refreshDots = (selectedVal) => {
        dotButtons.forEach(({ btn, val }) => {
          const isSel = val === selectedVal;
          btn.style.boxShadow = isSel ? '0 0 0 2px #FFFFFF, 0 0 0 3.5px #A88342' : 'inset 0 0 0 1px rgba(0,0,0,0.16)';
          btn.style.transform = isSel ? 'scale(1.12)' : 'scale(1)';
        });
      };

      swatches.forEach((sw) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.title = sw.label;
        btn.setAttribute('aria-label', `${titleText} ${sw.label}`);
        const bg = sw.hex === 'mix'
          ? 'conic-gradient(#2395AB, #D65272, #C49A45, #3164C9, #3BA896, #2395AB)'
          : sw.hex;
        btn.style.cssText = `width:17px;height:17px;border-radius:50%;border:none;padding:0;cursor:pointer;background:${bg};transition:transform 0.15s, box-shadow 0.15s;`;

        btn.addEventListener('click', () => {
          refreshDots(sw.hex);
          onSelect(sw.hex, sw.opacity);
        });

        dotButtons.push({ btn, val: sw.hex });
        grp.appendChild(btn);
      });

      // Custom Color Picker (+)
      const customWrap = document.createElement('label');
      customWrap.title = 'Color personalizado';
      customWrap.style.cssText = 'position:relative;width:17px;height:17px;border-radius:50%;border:1px dashed #A88342;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;font-size:11px;font-weight:700;color:#A88342;background:#FAF8F5;overflow:hidden;';
      customWrap.textContent = '+';

      const colorInput = document.createElement('input');
      colorInput.type = 'color';
      colorInput.value = '#A88342';
      colorInput.setAttribute('aria-label', `${titleText} personalizado`);
      colorInput.style.cssText = 'position:absolute;inset:0;opacity:0;width:100%;height:100%;cursor:pointer;border:none;padding:0;';
      colorInput.addEventListener('input', (e) => {
        const picked = e.target.value;
        customWrap.style.background = picked;
        customWrap.style.color = '#FFFFFF';
        customWrap.style.borderStyle = 'solid';
        refreshDots('__custom__');
        onSelect(picked);
      });

      customWrap.appendChild(colorInput);
      grp.appendChild(customWrap);

      refreshDots(initialActive);
      return grp;
    }

    // 1. Brackets Color Group
    const bracketGrp = createGroup('Brackets:', BRACKET_PALETTE, activeBracketColor, (hex) => {
      setBracketColor(hex, true);
    });
    bar.appendChild(bracketGrp);

    // Divider
    const divider = document.createElement('span');
    divider.style.cssText = 'width:1px;height:16px;background:#E2D9C8;';
    bar.appendChild(divider);

    // 2. Clear Aligner Color Group
    const alignerGrp = createGroup('Alineador:', ALIGNER_PALETTE, activeAlignerColor, (hex, opacity) => {
      setAlignerColor(hex, opacity, true);
    });
    bar.appendChild(alignerGrp);

    container.appendChild(bar);
  }

  // =========================================================================
  // 11. TIMELINE (5s AUTO-RESUME), DRAG & RESIZE EVENTS
  // =========================================================================
  function scheduleTimelineResume() {
    clearTimeout(resumeTimeout);
    resumeTimeout = setTimeout(() => {
      if (!isSliderActive) {
        if (exactMonth >= TOTAL_MONTHS - 0.05) {
          exactMonth = 0.0;
          updateOrthoProgress(0.0, true);
        }
        holdTimer = 0.0;
        holdPhase = 'none';
        isAutoPlaying = true;
      }
    }, RESUME_DELAY_MS);
  }

  function setupEvents() {
    if (slider) {
      slider.min = '0';
      slider.max = String(TOTAL_MONTHS);
      slider.step = '0.1';

      const onSliderStart = () => {
        isSliderActive = true;
        isAutoPlaying = false;
        clearTimeout(resumeTimeout);
      };

      const onSliderEnd = () => {
        isSliderActive = false;
        scheduleTimelineResume();
      };

      const onSliderInput = (e) => {
        isAutoPlaying = false;
        holdTimer = 0.0;
        holdPhase = 'none';
        exactMonth = THREE.MathUtils.clamp(parseFloat(e.target.value) || 0, 0, TOTAL_MONTHS);
        updateOrthoProgress(exactMonth / TOTAL_MONTHS, false);
        if (!isSliderActive) {
          scheduleTimelineResume();
        }
      };

      slider.addEventListener('pointerdown', onSliderStart);
      slider.addEventListener('mousedown', onSliderStart);
      slider.addEventListener('touchstart', onSliderStart, { passive: true });

      window.addEventListener('pointerup', () => { if (isSliderActive) onSliderEnd(); });
      window.addEventListener('mouseup', () => { if (isSliderActive) onSliderEnd(); });
      window.addEventListener('touchend', () => { if (isSliderActive) onSliderEnd(); });

      slider.addEventListener('input', onSliderInput);
      slider.addEventListener('change', () => {
        isSliderActive = false;
        scheduleTimelineResume();
      });
    }

    if (alignerCheckbox) {
      alignerCheckbox.addEventListener('change', () => {
        updateOrthoProgress(exactMonth / TOTAL_MONTHS, false);
      });
    }

    if (btnResetView) {
      btnResetView.addEventListener('click', () => {
        modelRoot.rotation.set(DEFAULT_MODEL_ROT.x, DEFAULT_MODEL_ROT.y, 0);
        camera.position.set(0, 4.4, 26.8);
        camera.lookAt(0, 0.1, 0);
      });
    }

    const dom = renderer.domElement;
    dom.style.cursor = 'grab';

    dom.addEventListener('mousedown', (e) => {
      isDragging = true;
      isUserRotating = true;
      dom.style.cursor = 'grabbing';
      previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('mouseup', () => {
      if (!isDragging) return;
      isDragging = false;
      dom.style.cursor = 'grab';
      clearTimeout(rotationTimeout);
      rotationTimeout = setTimeout(() => {
        isUserRotating = false;
      }, 3000);
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const dx = e.clientX - previousMousePosition.x;
      const dy = e.clientY - previousMousePosition.y;

      modelRoot.rotation.y += dx * 0.008;
      modelRoot.rotation.x += dy * 0.008;
      modelRoot.rotation.x = THREE.MathUtils.clamp(modelRoot.rotation.x, -0.45, 0.95);

      previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    dom.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        isDragging = true;
        isUserRotating = true;
        previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    }, { passive: true });

    window.addEventListener('touchend', () => {
      isDragging = false;
      clearTimeout(rotationTimeout);
      rotationTimeout = setTimeout(() => {
        isUserRotating = false;
      }, 3000);
    });

    dom.addEventListener('touchmove', (e) => {
      if (!isDragging || e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - previousMousePosition.x;
      const dy = e.touches[0].clientY - previousMousePosition.y;

      modelRoot.rotation.y += dx * 0.008;
      modelRoot.rotation.x += dy * 0.008;
      modelRoot.rotation.x = THREE.MathUtils.clamp(modelRoot.rotation.x, -0.45, 0.95);

      previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }, { passive: true });

    window.addEventListener('resize', onWindowResize);
  }

  function onWindowResize() {
    if (!container || !renderer || !camera) return;
    const w = container.clientWidth;
    const h = container.clientHeight;
    if (w <= 0 || h <= 0) return;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }

  // =========================================================================
  // 12. MAIN RENDER & AUTO-TIMELINE LOOP (1 MONTH / SECOND)
  // =========================================================================
  function animate(now) {
    requestAnimationFrame(animate);

    const dt = Math.min((now - lastFrameTime) / 1000, 0.1);
    lastFrameTime = now;

    // Continuous 1 month / second progression unless paused by timeline interaction
    if (isAutoPlaying) {
      if (holdTimer > 0) {
        holdTimer -= dt;
        if (holdTimer <= 0) {
          if (holdPhase === 'end') {
            exactMonth = 0.0;
            updateOrthoProgress(0.0, true);
            holdPhase = 'start';
            holdTimer = 0.6;
          } else {
            holdPhase = 'none';
          }
        }
      } else {
        exactMonth += dt * 1.0;
        if (exactMonth >= TOTAL_MONTHS) {
          exactMonth = TOTAL_MONTHS;
          holdPhase = 'end';
          holdTimer = 1.8;
        }
        updateOrthoProgress(exactMonth / TOTAL_MONTHS, true);
      }
    }

    if (!isUserRotating && modelRoot) {
      modelRoot.rotation.y += dt * 0.15;
    }

    renderer.render(scene, camera);
  }

  // Optional external API
  window.Ortho3D = {
    setBracketColor: (color) => setBracketColor(color, true),
    setAlignerColor: (color, opacity) => setAlignerColor(color, opacity, true),
    setMonth: (m) => {
      isAutoPlaying = false;
      exactMonth = THREE.MathUtils.clamp(m, 0, TOTAL_MONTHS);
      updateOrthoProgress(exactMonth / TOTAL_MONTHS, true);
      scheduleTimelineResume();
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init3D);
  } else {
    init3D();
  }
})();
