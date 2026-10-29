/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  Jersey3DConfig,
  DEFAULT_JERSEY_CONFIG,
  createProceduralJerseyTexture,
  createEyeletBumpMap,
} from '../utils/threeDLogic';
import { Order } from '../types/erp';
import {
  RotateCcw,
  Eye,
  Layers,
  Palette,
  Sparkles,
  Maximize2,
  ChevronDown,
  ChevronUp,
  Sliders,
  Check,
  Shield,
  Camera,
} from 'lucide-react';

interface ThreeDStudioProps {
  orders: Order[];
  activeOrder?: Order | null;
  onApply3DToOrder?: (orderId: string, mockupUrl: string) => void;
}

export const ThreeDStudio: React.FC<ThreeDStudioProps> = ({
  orders,
  activeOrder,
  onApply3DToOrder,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [config, setConfig] = useState<Jersey3DConfig>(() => {
    if (activeOrder) {
      return {
        ...DEFAULT_JERSEY_CONFIG,
        teamCrestText: activeOrder.teamOrClub?.split(' ')[0] || 'TITANS',
        playerName: activeOrder.roster?.[0]?.name || 'L. MESSI',
        playerNumber: activeOrder.roster?.[0]?.number || '10',
        fabricType: activeOrder.fabricType || 'Micro-Eyelet 160 GSM',
      };
    }
    return DEFAULT_JERSEY_CONFIG;
  });

  const [isControlsOpen, setIsControlsOpen] = useState(true);
  const [viewAngle, setViewAngle] = useState<'front' | 'back' | 'side' | 'isometric'>('front');
  const [isWireframe, setIsWireframe] = useState(false);
  const [isAutoRotate, setIsAutoRotate] = useState(true);
  const [explodedView, setExplodedView] = useState(0); // 0 = assembled, 1 = exploded panels

  // Three.js internal references
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const jerseyPartsRef = useRef<{
    torso: THREE.Mesh;
    collar: THREE.Mesh;
    leftSleeve: THREE.Mesh;
    rightSleeve: THREE.Mesh;
    leftCuff: THREE.Mesh;
    rightCuff: THREE.Mesh;
    leftMeshPanel: THREE.Mesh;
    rightMeshPanel: THREE.Mesh;
    shortsPelvis: THREE.Mesh;
    leftShortsLeg: THREE.Mesh;
    rightShortsLeg: THREE.Mesh;
    leftShortsStripe: THREE.Mesh;
    rightShortsStripe: THREE.Mesh;
    contactShadow: THREE.Mesh;
  } | null>(null);

  const materialsRef = useRef<{
    torsoMat: THREE.MeshStandardMaterial;
    accentMat: THREE.MeshStandardMaterial;
    trimMat: THREE.MeshStandardMaterial;
    meshMat: THREE.MeshStandardMaterial;
    shortsMat: THREE.MeshStandardMaterial;
  } | null>(null);

  // Sync with activeOrder if changed
  useEffect(() => {
    if (activeOrder) {
      setConfig((prev) => ({
        ...prev,
        teamCrestText: activeOrder.teamOrClub?.split(' ')[0] || prev.teamCrestText,
        playerName: activeOrder.roster?.[0]?.name || prev.playerName,
        playerNumber: activeOrder.roster?.[0]?.number || prev.playerNumber,
        fabricType: activeOrder.fabricType || prev.fabricType,
      }));
    }
  }, [activeOrder]);

  // Initialize Three.js Scene once
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Detect software WebGL as instructed by threejs skill
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // 1. Scene & Atmosphere
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a); // Slate-900 studio backdrop
    scene.fog = new THREE.Fog(0x0f172a, 10, 24);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 50);
    camera.position.set(0, 1.4, 4.2);
    cameraRef.current = camera;

    // 3. Renderer with PBR settings
    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    container.appendChild(renderer.domElement);

    // 4. Studio Environment Reflection (RoomEnvironment)
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 5. Lighting: Warm Key Light + Cool Hemisphere Fill
    const hemiLight = new THREE.HemisphereLight(0xd8e8ff, 0x1e293b, 1.2);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff5ea, 2.2);
    keyLight.position.set(3, 4, 3.5);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x60a5fa, 1.5);
    rimLight.position.set(-3, 2, -3);
    scene.add(rimLight);

    // 6. OrbitControls with Damping
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 + 0.05;
    controls.minDistance = 1.8;
    controls.maxDistance = 6.5;
    controls.target.set(0, 1.1, 0);
    controlsRef.current = controls;

    // 7. Ground Contact Shadow
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 256;
    shadowCanvas.height = 256;
    const sCtx = shadowCanvas.getContext('2d')!;
    const grad = sCtx.createRadialGradient(128, 128, 0, 128, 128, 128);
    grad.addColorStop(0, 'rgba(0,0,0,0.55)');
    grad.addColorStop(0.5, 'rgba(0,0,0,0.25)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    sCtx.fillStyle = grad;
    sCtx.fillRect(0, 0, 256, 256);
    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    shadowTex.colorSpace = THREE.SRGBColorSpace;

    const shadowGeo = new THREE.PlaneGeometry(2.4, 2.4);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.6,
    });
    const contactShadow = new THREE.Mesh(shadowGeo, shadowMat);
    contactShadow.rotation.x = -Math.PI / 2;
    contactShadow.position.y = 0.01;
    scene.add(contactShadow);

    // 8. ASSEMBLE COMPOSITE 3-12 PART SPORTWEAR MODEL (THREE.Group)
    const kitGroup = new THREE.Group();
    kitGroup.name = 'sportswear_kit';
    scene.add(kitGroup);

    // Bump texture
    const bumpMap = new THREE.CanvasTexture(createEyeletBumpMap());
    bumpMap.wrapS = THREE.RepeatWrapping;
    bumpMap.wrapT = THREE.RepeatWrapping;
    bumpMap.repeat.set(8, 8);

    // Initial textures
    const frontTex = new THREE.CanvasTexture(createProceduralJerseyTexture(config, true));
    frontTex.colorSpace = THREE.SRGBColorSpace;
    frontTex.anisotropy = renderer.capabilities.getMaxAnisotropy();

    // Materials
    const torsoMat = new THREE.MeshStandardMaterial({
      map: frontTex,
      bumpMap: bumpMap,
      bumpScale: 0.015,
      roughness: 0.65,
      metalness: 0.05,
    });

    const accentMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(config.accentColor),
      roughness: 0.55,
      metalness: 0.1,
    });

    const trimMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(config.collarColor),
      roughness: 0.45,
      metalness: 0.05,
    });

    const meshMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(config.primaryColor).offsetHSL(0, 0, -0.1),
      roughness: 0.8,
      metalness: 0.05,
      wireframe: false,
    });

    const shortsMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(config.primaryColor).offsetHSL(0, 0, -0.05),
      roughness: 0.6,
      metalness: 0.05,
    });

    materialsRef.current = { torsoMat, accentMat, trimMat, meshMat, shortsMat };

    // Part 1: Torso Body (Ergonomic cylinder with athletic taper)
    const torsoGeo = new THREE.CylinderGeometry(0.38, 0.34, 0.76, 32, 1, true);
    torsoGeo.scale(1.15, 1, 0.65); // Oval athletic chest
    const torso = new THREE.Mesh(torsoGeo, torsoMat);
    torso.position.set(0, 1.48, 0);
    torso.castShadow = !isSoftwareGl;
    kitGroup.add(torso);

    // Part 2: Collar Ribbing (V-Neck / Crew neck rim)
    const collarGeo = new THREE.TorusGeometry(0.18, 0.022, 16, 32);
    collarGeo.scale(1.1, 0.8, 1);
    const collar = new THREE.Mesh(collarGeo, trimMat);
    collar.rotation.x = Math.PI / 2.15;
    collar.position.set(0, 1.84, 0.04);
    kitGroup.add(collar);

    // Part 3: Left Raglan Sleeve
    const sleeveGeo = new THREE.CylinderGeometry(0.13, 0.12, 0.38, 24);
    sleeveGeo.scale(1, 1, 0.8);
    const leftSleeve = new THREE.Mesh(sleeveGeo, torsoMat);
    leftSleeve.position.set(0.48, 1.62, 0);
    leftSleeve.rotation.z = -Math.PI / 3.4;
    kitGroup.add(leftSleeve);

    // Part 4: Right Raglan Sleeve
    const rightSleeve = new THREE.Mesh(sleeveGeo, torsoMat);
    rightSleeve.position.set(-0.48, 1.62, 0);
    rightSleeve.rotation.z = Math.PI / 3.4;
    kitGroup.add(rightSleeve);

    // Part 5: Left Sleeve Cuff Trim
    const cuffGeo = new THREE.CylinderGeometry(0.122, 0.122, 0.04, 24);
    cuffGeo.scale(1, 1, 0.8);
    const leftCuff = new THREE.Mesh(cuffGeo, trimMat);
    leftCuff.position.set(0.62, 1.5, 0);
    leftCuff.rotation.z = -Math.PI / 3.4;
    kitGroup.add(leftCuff);

    // Part 6: Right Sleeve Cuff Trim
    const rightCuff = new THREE.Mesh(cuffGeo, trimMat);
    rightCuff.position.set(-0.62, 1.5, 0);
    rightCuff.rotation.z = Math.PI / 3.4;
    kitGroup.add(rightCuff);

    // Part 7: Left Breathable Side Panel
    const sidePanelGeo = new THREE.BoxGeometry(0.02, 0.68, 0.14);
    const leftMeshPanel = new THREE.Mesh(sidePanelGeo, meshMat);
    leftMeshPanel.position.set(0.39, 1.46, 0);
    kitGroup.add(leftMeshPanel);

    // Part 8: Right Breathable Mesh Side Panel
    const rightMeshPanel = new THREE.Mesh(sidePanelGeo, meshMat);
    rightMeshPanel.position.set(-0.39, 1.46, 0);
    kitGroup.add(rightMeshPanel);

    // Part 9: Shorts Pelvis & Waistband
    const pelvisGeo = new THREE.CylinderGeometry(0.35, 0.36, 0.22, 28);
    pelvisGeo.scale(1.1, 1, 0.7);
    const shortsPelvis = new THREE.Mesh(pelvisGeo, shortsMat);
    shortsPelvis.position.set(0, 0.98, 0);
    shortsPelvis.castShadow = !isSoftwareGl;
    kitGroup.add(shortsPelvis);

    // Part 10: Left Shorts Leg
    const legGeo = new THREE.CylinderGeometry(0.19, 0.21, 0.36, 24);
    legGeo.scale(1, 1, 0.85);
    const leftShortsLeg = new THREE.Mesh(legGeo, shortsMat);
    leftShortsLeg.position.set(0.18, 0.74, 0);
    kitGroup.add(leftShortsLeg);

    // Part 11: Right Shorts Leg
    const rightShortsLeg = new THREE.Mesh(legGeo, shortsMat);
    rightShortsLeg.position.set(-0.18, 0.74, 0);
    kitGroup.add(rightShortsLeg);

    // Part 12: Shorts Side Contrast Stripes
    const stripeGeo = new THREE.BoxGeometry(0.015, 0.34, 0.05);
    const leftShortsStripe = new THREE.Mesh(stripeGeo, accentMat);
    leftShortsStripe.position.set(0.36, 0.74, 0);
    kitGroup.add(leftShortsStripe);

    const rightShortsStripe = new THREE.Mesh(stripeGeo, accentMat);
    rightShortsStripe.position.set(-0.36, 0.74, 0);
    kitGroup.add(rightShortsStripe);

    jerseyPartsRef.current = {
      torso,
      collar,
      leftSleeve,
      rightSleeve,
      leftCuff,
      rightCuff,
      leftMeshPanel,
      rightMeshPanel,
      shortsPelvis,
      leftShortsLeg,
      rightShortsLeg,
      leftShortsStripe,
      rightShortsStripe,
      contactShadow,
    };

    // 9. Animation Loop with Pacing for Software WebGL
    let frameId = 0;
    const clock = new THREE.Clock();

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function tick() {
      const delta = clock.getDelta();
      controls.update();

      // Slow smooth auto-rotation if enabled
      if (controls.autoRotate) {
        kitGroup.rotation.y += 0.4 * delta;
      }

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    tick();

    // 10. Resize Observer
    const handleResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Update textures & colors whenever config changes
  useEffect(() => {
    if (!materialsRef.current || !rendererRef.current) return;

    // Create fresh procedural front and back textures
    const frontTex = new THREE.CanvasTexture(createProceduralJerseyTexture(config, true));
    frontTex.colorSpace = THREE.SRGBColorSpace;
    frontTex.anisotropy = rendererRef.current.capabilities.getMaxAnisotropy();

    materialsRef.current.torsoMat.map = frontTex;
    materialsRef.current.torsoMat.needsUpdate = true;

    materialsRef.current.accentMat.color.set(config.accentColor);
    materialsRef.current.trimMat.color.set(config.collarColor);
    materialsRef.current.shortsMat.color.set(config.primaryColor).offsetHSL(0, 0, -0.05);
    materialsRef.current.meshMat.color.set(config.primaryColor).offsetHSL(0, 0, -0.1);

    materialsRef.current.torsoMat.wireframe = isWireframe;
    materialsRef.current.accentMat.wireframe = isWireframe;
    materialsRef.current.trimMat.wireframe = isWireframe;
    materialsRef.current.shortsMat.wireframe = isWireframe;
  }, [config, isWireframe]);

  // Handle Exploded Pattern View transition
  useEffect(() => {
    const parts = jerseyPartsRef.current;
    if (!parts) return;

    const offset = explodedView * 0.45;
    // Separate sleeves and panels outward
    parts.leftSleeve.position.x = 0.48 + offset * 0.8;
    parts.rightSleeve.position.x = -0.48 - offset * 0.8;
    parts.leftCuff.position.x = 0.62 + offset * 0.9;
    parts.rightCuff.position.x = -0.62 - offset * 0.9;
    parts.leftMeshPanel.position.x = 0.39 + offset * 0.5;
    parts.rightMeshPanel.position.x = -0.39 - offset * 0.5;
    parts.collar.position.y = 1.84 + offset * 0.3;
    parts.shortsPelvis.position.y = 0.98 - offset * 0.4;
    parts.leftShortsLeg.position.y = 0.74 - offset * 0.5;
    parts.rightShortsLeg.position.y = 0.74 - offset * 0.5;
    parts.leftShortsStripe.position.y = 0.74 - offset * 0.5;
    parts.rightShortsStripe.position.y = 0.74 - offset * 0.5;
  }, [explodedView]);

  // Handle Camera Presets
  const setCameraView = (angle: 'front' | 'back' | 'side' | 'isometric') => {
    if (!cameraRef.current || !controlsRef.current) return;
    setViewAngle(angle);
    controlsRef.current.autoRotate = false;
    setIsAutoRotate(false);

    if (angle === 'front') {
      cameraRef.current.position.set(0, 1.4, 3.8);
      controlsRef.current.target.set(0, 1.2, 0);
    } else if (angle === 'back') {
      cameraRef.current.position.set(0, 1.4, -3.8);
      controlsRef.current.target.set(0, 1.2, 0);
    } else if (angle === 'side') {
      cameraRef.current.position.set(3.8, 1.4, 0);
      controlsRef.current.target.set(0, 1.2, 0);
    } else {
      cameraRef.current.position.set(2.4, 2.2, 2.8);
      controlsRef.current.target.set(0, 1.1, 0);
    }
    controlsRef.current.update();
  };

  const handleCaptureSnapshot = () => {
    if (!rendererRef.current) return;
    const dataUrl = rendererRef.current.domElement.toDataURL('image/png');
    if (activeOrder && onApply3DToOrder) {
      onApply3DToOrder(activeOrder.id, dataUrl);
    } else {
      // Trigger download
      const link = document.createElement('a');
      link.download = `3d-jersey-${config.teamCrestText || 'kit'}.png`;
      link.href = dataUrl;
      link.click();
    }
  };

  return (
    <div className="relative w-full h-[78vh] min-h-[580px] bg-slate-950 rounded-2xl overflow-hidden border border-gray-800 shadow-2xl flex flex-col">
      {/* 3D Canvas Mounting Container */}
      <div ref={mountRef} className="w-full h-full relative cursor-grab active:cursor-grabbing" />

      {/* Top Header Overlay: Minimal Spec Badge */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-3 bg-slate-900/90 border border-slate-700/80 px-3.5 py-2 rounded-xl text-white shadow-lg pointer-events-auto">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-sm">
          3D
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-extrabold text-xs text-white tracking-wide">
              Sportswear 3D Studio
            </h3>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/30 text-indigo-300 font-mono">
              Three.js PBR
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            {config.fabricType} &bull; {config.pattern.toUpperCase()} Pattern
          </p>
        </div>
      </div>

      {/* Top Right Quick Camera Controls */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5 bg-slate-900/90 border border-slate-700/80 p-1 rounded-xl pointer-events-auto text-xs font-semibold">
        <button
          onClick={() => setCameraView('front')}
          className={`px-2.5 py-1 rounded-lg transition ${
            viewAngle === 'front' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:text-white'
          }`}
        >
          Front
        </button>
        <button
          onClick={() => setCameraView('back')}
          className={`px-2.5 py-1 rounded-lg transition ${
            viewAngle === 'back' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:text-white'
          }`}
        >
          Back (#Name)
        </button>
        <button
          onClick={() => setCameraView('side')}
          className={`px-2.5 py-1 rounded-lg transition ${
            viewAngle === 'side' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:text-white'
          }`}
        >
          Side
        </button>
        <button
          onClick={() => setCameraView('isometric')}
          className={`px-2.5 py-1 rounded-lg transition ${
            viewAngle === 'isometric' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:text-white'
          }`}
        >
          3D Orbit
        </button>
        <button
          onClick={handleCaptureSnapshot}
          className="ml-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1 transition"
          title="Export 3D Render to Mockup"
        >
          <Camera className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Export Mockup</span>
        </button>
      </div>

      {/* Ergonomic Collapsible Bottom Control Dock (Strict Three.js Skill Directives) */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 w-[94%] max-w-4xl pointer-events-auto">
        <div className="bg-slate-900/95 border border-slate-700/90 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300">
          {/* Collapse/Expand Toggle Header */}
          <div
            onClick={() => setIsControlsOpen(!isControlsOpen)}
            className="flex items-center justify-between px-4 py-2 bg-slate-850/80 cursor-pointer hover:bg-slate-800 transition text-xs font-bold text-slate-300 border-b border-slate-800"
          >
            <div className="flex items-center gap-2">
              <Sliders className="w-3.5 h-3.5 text-indigo-400" />
              <span>3D Customization & Pattern Staging Dock</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-slate-400">
              <span>{isControlsOpen ? '▾ Hide Controls' : '▴ Show Controls (Cinema Mode)'}</span>
            </div>
          </div>

          {/* Expandable Controls Bar */}
          {isControlsOpen && (
            <div className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
              {/* Col 1: Colors */}
              <div className="space-y-2">
                <span className="font-bold text-slate-400 text-[10px] uppercase block tracking-wider">
                  1. Colorways
                </span>
                <div className="flex items-center gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Primary</label>
                    <input
                      type="color"
                      value={config.primaryColor}
                      onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
                      className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Accent</label>
                    <input
                      type="color"
                      value={config.accentColor}
                      onChange={(e) => setConfig({ ...config, accentColor: e.target.value })}
                      className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Collar/Rib</label>
                    <input
                      type="color"
                      value={config.collarColor}
                      onChange={(e) => setConfig({ ...config, collarColor: e.target.value })}
                      className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                    />
                  </div>
                </div>
              </div>

              {/* Col 2: Sublimation Pattern */}
              <div className="space-y-2">
                <span className="font-bold text-slate-400 text-[10px] uppercase block tracking-wider">
                  2. Sublimation Pattern
                </span>
                <select
                  value={config.pattern}
                  onChange={(e) => setConfig({ ...config, pattern: e.target.value as any })}
                  className="w-full p-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-semibold text-xs"
                >
                  <option value="sash">Royal Sash (Diagonal)</option>
                  <option value="stripes">Classic Stripes / Hoops</option>
                  <option value="geometric">Geometric Aerodynamic Mesh</option>
                  <option value="gradient">Modern Ombre Gradient</option>
                  <option value="solid">Minimalist Solid Kit</option>
                </select>
              </div>

              {/* Col 3: Player Customization */}
              <div className="space-y-2">
                <span className="font-bold text-slate-400 text-[10px] uppercase block tracking-wider">
                  3. Player Name & Number
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  <input
                    type="text"
                    value={config.playerName}
                    onChange={(e) => setConfig({ ...config, playerName: e.target.value.toUpperCase() })}
                    placeholder="PLAYER NAME"
                    className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white font-bold text-xs"
                  />
                  <input
                    type="text"
                    value={config.playerNumber}
                    onChange={(e) => setConfig({ ...config, playerNumber: e.target.value })}
                    placeholder="10"
                    className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white font-black text-xs text-center"
                  />
                </div>
              </div>

              {/* Col 4: Technical 3D Modes */}
              <div className="space-y-2">
                <span className="font-bold text-slate-400 text-[10px] uppercase block tracking-wider">
                  4. Staging & Nesting
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setExplodedView(explodedView === 0 ? 1 : 0)}
                    className={`flex-1 py-1.5 px-2 rounded-lg font-bold text-xs transition border ${
                      explodedView > 0
                        ? 'bg-amber-500 text-slate-950 border-amber-400'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                    }`}
                  >
                    {explodedView > 0 ? 'Assemble 3D' : 'Explode Panels'}
                  </button>

                  <button
                    onClick={() => setIsWireframe(!isWireframe)}
                    className={`flex-1 py-1.5 px-2 rounded-lg font-bold text-xs transition border ${
                      isWireframe
                        ? 'bg-indigo-600 text-white border-indigo-500'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                    }`}
                  >
                    Wireframe
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
