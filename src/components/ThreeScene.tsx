import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import type { LessonMediaVariant } from "@/types/lessonMedia";
import { useSound } from "@/hooks/useSound";

type ThreeSceneProps = {
  variant?: LessonMediaVariant;
};

type RenderSettings = {
  lights: boolean;
  shadows: boolean;
  glow: boolean;
  particles: boolean;
  orbit: boolean;
  fieldLines: boolean;
  speed: number;
};

type RenderToggleKey = Exclude<keyof RenderSettings, "speed">;
type CameraPresetId = "overview" | "top" | "coil" | "compass";

const DEFAULT_RENDER_SETTINGS: RenderSettings = {
  lights: true,
  shadows: true,
  glow: true,
  particles: true,
  orbit: true,
  fieldLines: true,
  speed: 1,
};

const CAMERA_PRESETS: Record<CameraPresetId, { label: string; position: [number, number, number]; target: [number, number, number] }> = {
  overview: { label: "Tổng thể", position: [2.2, 1.55, 3.4], target: [0, 0.25, 0] },
  top: { label: "Từ trên", position: [0.05, 5.2, 0.05], target: [0, -0.35, 0] },
  coil: { label: "Gần cuộn dây", position: [-1.15, 0.65, 1.45], target: [-0.55, -0.28, 0] },
  compass: { label: "Gần la bàn", position: [1.85, 0.85, 1.25], target: [1.15, -0.58, 0] },
};

const COMMON_RENDER_TOGGLES: Array<[RenderToggleKey, string]> = [
  ["lights", "Ánh sáng"],
  ["shadows", "Bóng đổ"],
  ["glow", "Phát sáng"],
  ["particles", "Hạt chuyển động"],
  ["orbit", "Xoay camera"],
];

const SCENE_RENDER_TOGGLES: Record<LessonMediaVariant, Array<[RenderToggleKey, string]>> = {
  electrostatic: COMMON_RENDER_TOGGLES,
  circuit: COMMON_RENDER_TOGGLES,
  motorThermal: [...COMMON_RENDER_TOGGLES, ["fieldLines", "Đường sức"]],
  meters: COMMON_RENDER_TOGGLES,
};

const SCENE_CAMERA_PRESETS: Record<LessonMediaVariant, CameraPresetId[]> = {
  electrostatic: ["overview", "top"],
  circuit: ["overview", "top"],
  motorThermal: ["overview", "top", "coil", "compass"],
  meters: ["overview", "top"],
};

/**
 * Interactive 3D lesson visuals: OrbitControls + curve-based wiring (Catmull–Rom),
 * tube geometry (sweeping a circle along the curve), emissive materials,
 * and animated spheres sampling arc-length on the curve (particle visualization).
 */
export function ThreeScene({ variant = "circuit" }: ThreeSceneProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const [interactionEnabled, setInteractionEnabled] = useState(true);
  const [infoPanelState, setInfoPanelState] = useState<"expanded" | "collapsed" | "hidden">("expanded");
  const [motorExperiment, setMotorExperiment] = useState<"magnetic" | "thermal">("magnetic");
  const [motorVoltage, setMotorVoltage] = useState(6);
  const [meterVoltage, setMeterVoltage] = useState(3);
  const [meterCircuit, setMeterCircuit] = useState<"single" | "series">("single");
  const [circuitPartsPlaced, setCircuitPartsPlaced] = useState(false);
  const [circuitWiresConnected, setCircuitWiresConnected] = useState(false);
  const [circuitSwitchClosed, setCircuitSwitchClosed] = useState(false);
  const [renderSettings, setRenderSettings] = useState<RenderSettings>(DEFAULT_RENDER_SETTINGS);
  const interactionEnabledRef = useRef(true);
  const motorExperimentRef = useRef<"magnetic" | "thermal">("magnetic");
  const motorVoltageRef = useRef(6);
  const meterVoltageRef = useRef(3);
  const meterCircuitRef = useRef<"single" | "series">("single");
  const circuitPartsPlacedRef = useRef(false);
  const circuitWiresConnectedRef = useRef(false);
  const circuitSwitchClosedRef = useRef(false);
  const renderSettingsRef = useRef(DEFAULT_RENDER_SETTINGS);
  const sceneSoundAtRef = useRef(0);
  const [overlayInfo, setOverlayInfo] = useState({ title: "", values: [] as string[], hint: "" });
  const lastOverlayRef = useRef("");
  const { play } = useSound();

  const updateOverlayInfo = (info: { title: string; values: string[]; hint: string }) => {
    const key = `${info.title}|${info.values.join("|")}|${info.hint}`;
    if (lastOverlayRef.current !== key) {
      lastOverlayRef.current = key;
      setOverlayInfo(info);
    }
  };

  useEffect(() => {
    interactionEnabledRef.current = interactionEnabled;
    if (controlsRef.current) {
      controlsRef.current.enabled = interactionEnabled && renderSettingsRef.current.orbit;
    }
  }, [interactionEnabled]);

  useEffect(() => {
    renderSettingsRef.current = renderSettings;
    if (controlsRef.current) {
      controlsRef.current.enabled = interactionEnabledRef.current && renderSettings.orbit;
      controlsRef.current.autoRotate = false;
    }
    if (rendererRef.current) {
      rendererRef.current.shadowMap.enabled = renderSettings.shadows;
    }
  }, [renderSettings]);

  useEffect(() => {
    motorVoltageRef.current = motorVoltage;
  }, [motorVoltage]);

  useEffect(() => {
    motorExperimentRef.current = motorExperiment;
  }, [motorExperiment]);

  useEffect(() => {
    meterVoltageRef.current = meterVoltage;
  }, [meterVoltage]);

  useEffect(() => {
    meterCircuitRef.current = meterCircuit;
  }, [meterCircuit]);

  useEffect(() => {
    circuitPartsPlacedRef.current = circuitPartsPlaced;
  }, [circuitPartsPlaced]);

  useEffect(() => {
    circuitWiresConnectedRef.current = circuitWiresConnected;
  }, [circuitWiresConnected]);

  useEffect(() => {
    circuitSwitchClosedRef.current = circuitSwitchClosed;
  }, [circuitSwitchClosed]);

  const setRenderSetting = <K extends keyof RenderSettings>(key: K, value: RenderSettings[K]) => {
    setRenderSettings((current) => ({ ...current, [key]: value }));
  };

  const applyCameraPreset = (presetId: CameraPresetId) => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;

    const preset = CAMERA_PRESETS[presetId];
    camera.position.set(...preset.position);
    controls.target.set(...preset.target);
    controls.update();
    play("click");
  };

  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#172033");
    scene.fog = new THREE.Fog("#172033", 5.5, 12);

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.08, 120);
    camera.position.set(2.2, 1.55, 3.4);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.22;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.minDistance = 1.6;
    controls.maxDistance = 9;
    controls.target.set(0, 0.25, 0);
    controls.enabled = interactionEnabledRef.current && renderSettingsRef.current.orbit;
    controlsRef.current = controls;

    const ambient = new THREE.HemisphereLight(0xffffff, 0x334155, 0.85);
    scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.55);
    keyLight.position.set(4.5, 8.5, 5.5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(2048, 2048);
    keyLight.shadow.bias = -0.0002;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x93c5fd, 0.45);
    fillLight.position.set(-3, 4, 4);
    scene.add(fillLight);

    const rim = new THREE.DirectionalLight(0x38bdf8, 0.7);
    rim.position.set(-4, 3, -3);
    scene.add(rim);

    const disposeList: Array<{ dispose?: () => void }> = [];

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(8.6, 6.8),
      new THREE.MeshStandardMaterial({ color: "#273449", roughness: 0.78, metalness: 0.05 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.82;
    floor.receiveShadow = true;
    scene.add(floor);
    disposeList.push(floor.geometry, floor.material as THREE.Material);

    const wallMaterial = new THREE.MeshStandardMaterial({
      color: "#dbeafe",
      roughness: 0.82,
      metalness: 0.02,
      side: THREE.DoubleSide,
    });
    const sideWallMaterial = new THREE.MeshStandardMaterial({
      color: "#bfdbfe",
      roughness: 0.86,
      metalness: 0.02,
      side: THREE.DoubleSide,
    });
    const panelMaterial = new THREE.MeshStandardMaterial({
      color: "#e0f2fe",
      roughness: 0.68,
      metalness: 0.06,
      side: THREE.DoubleSide,
    });
    const benchMaterial = new THREE.MeshStandardMaterial({
      color: "#64748b",
      roughness: 0.42,
      metalness: 0.2,
    });
    disposeList.push(wallMaterial, sideWallMaterial, panelMaterial, benchMaterial);

    const labRoom = new THREE.Group();
    scene.add(labRoom);

    const backWall = new THREE.Mesh(new THREE.PlaneGeometry(8.6, 3.4), wallMaterial);
    backWall.position.set(0, 0.75, -3.05);
    backWall.receiveShadow = true;
    labRoom.add(backWall);
    disposeList.push(backWall.geometry);

    const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(6.8, 3.4), sideWallMaterial);
    leftWall.position.set(-4.25, 0.75, 0.35);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.receiveShadow = true;
    labRoom.add(leftWall);
    disposeList.push(leftWall.geometry);

    const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(6.8, 3.4), sideWallMaterial);
    rightWall.position.set(4.25, 0.75, 0.35);
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.receiveShadow = true;
    labRoom.add(rightWall);
    disposeList.push(rightWall.geometry);

    const bench = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.16, 0.55), benchMaterial);
    bench.position.set(0, -0.55, -2.66);
    bench.castShadow = true;
    bench.receiveShadow = true;
    labRoom.add(bench);
    disposeList.push(bench.geometry);

    for (let i = 0; i < 4; i++) {
      const panel = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 0.72), panelMaterial);
      panel.position.set(-3.15 + i * 2.1, 1.05, -3.035);
      panel.receiveShadow = true;
      labRoom.add(panel);
      disposeList.push(panel.geometry);
    }

    const lightPanelMaterial = new THREE.MeshBasicMaterial({ color: "#f8fafc" });
    disposeList.push(lightPanelMaterial);
    for (let i = 0; i < 3; i++) {
      const lightPanel = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.035, 0.18), lightPanelMaterial);
      lightPanel.position.set(-2.2 + i * 2.2, 2.25, -1.1);
      labRoom.add(lightPanel);
      disposeList.push(lightPanel.geometry);

      const labLight = new THREE.PointLight(0xffffff, 0.45, 4.5);
      labLight.position.set(-2.2 + i * 2.2, 2.08, -1.1);
      scene.add(labLight);
    }

    const root = new THREE.Group();
    scene.add(root);

    const grid = new THREE.GridHelper(8, 32, 0x7dd3fc, 0x475569);
    grid.position.y = -0.805;
    const gridMaterial = grid.material as THREE.Material;
    gridMaterial.opacity = 0.18;
    gridMaterial.transparent = true;
    scene.add(grid);
    disposeList.push(grid.geometry, gridMaterial);

    const electronMat = new THREE.MeshStandardMaterial({
      color: "#fbbf24",
      emissive: "#f59e0b",
      emissiveIntensity: 1.1,
      roughness: 0.35,
      metalness: 0.2,
    });

    function wireTube(
      curve: THREE.CatmullRomCurve3,
      color: number,
      radius = 0.055,
      tubular = 96,
      parent: THREE.Object3D = root,
    ) {
      const geo = new THREE.TubeGeometry(curve, tubular, radius, 16, false);
      const mat = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.22,
        roughness: 0.35,
        metalness: 0.35,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.castShadow = true;
      mesh.userData.isWire = true;
      parent.add(mesh);
      disposeList.push(geo, mat);
      return mesh;
    }

    let sharedElectronGeom: THREE.SphereGeometry | null = null;
    function addElectrons(
      curve: THREE.CatmullRomCurve3,
      count: number,
      flowSpeed: number,
      parent: THREE.Object3D = root,
    ) {
      if (!sharedElectronGeom) {
        sharedElectronGeom = new THREE.SphereGeometry(0.065, 18, 18);
        disposeList.push(sharedElectronGeom, electronMat);
      }
      const meshes: THREE.Mesh[] = [];
      for (let i = 0; i < count; i++) {
        const m = new THREE.Mesh(sharedElectronGeom, electronMat);
        m.castShadow = true;
        parent.add(m);
        meshes.push(m);
        (m.userData as { phase: number }).phase = i / Math.max(count, 1);
      }
      return { meshes, curve, speed: flowSpeed, parent };
    }

    function addLabel(text: string, position: THREE.Vector3, size = 0.42, parent: THREE.Object3D = root) {
      const canvas = document.createElement("canvas");
      canvas.width = 256;
      canvas.height = 96;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.fillStyle = "rgba(15, 23, 42, 0.82)";
      ctx.roundRect(12, 18, 232, 54, 14);
      ctx.fill();
      ctx.fillStyle = "#e2e8f0";
      ctx.font = "bold 28px Space Grotesk, Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(text, 128, 46);

      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
      const sprite = new THREE.Sprite(material);
      sprite.position.copy(position);
      sprite.scale.set(size * 2.6, size, 1);
      parent.add(sprite);
      disposeList.push(texture, material);
    }

    function addReadout(initialText: string, position: THREE.Vector3, parent: THREE.Object3D = root) {
      const canvas = document.createElement("canvas");
      canvas.width = 256;
      canvas.height = 96;
      const ctx = canvas.getContext("2d");
      if (!ctx) return () => undefined;

      const draw = (text: string) => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "rgba(15, 23, 42, 0.92)";
        ctx.roundRect(16, 18, 224, 60, 16);
        ctx.fill();
        ctx.strokeStyle = "rgba(148, 163, 184, 0.55)";
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.fillStyle = "#f8fafc";
        ctx.font = "bold 30px JetBrains Mono, monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(text, 128, 48);
      };

      draw(initialText);
      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
      const sprite = new THREE.Sprite(material);
      sprite.position.copy(position);
      sprite.scale.set(0.78, 0.3, 1);
      parent.add(sprite);
      disposeList.push(texture, material);

      return (text: string) => {
        draw(text);
        texture.needsUpdate = true;
      };
    }

    const animElectrons: Array<{ meshes: THREE.Mesh[]; curve: THREE.CatmullRomCurve3; speed: number; parent: THREE.Object3D }> = [];
    const motorToruses: THREE.Mesh[] = [];
    const circuitWireMeshes: THREE.Mesh[] = [];
    const electrostaticChips: THREE.Mesh[] = [];

    /** Mặt bàn y ≈ -0.58 → Plane(n=(0,1,0), constant=0.58) */
    const dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0.58);

    let circuitOn = true;
    let rubCharge = 0;
    let motorBoost = 1;

    type DragKind = "ruler" | "bulb" | "needle" | "bulbMeter" | "battery";
    type DragMode = "translate" | "rotate";
    let dragState:
      | {
          object: THREE.Object3D;
          kind: DragKind;
          mode: DragMode;
          startX: number;
          startZ: number;
          startY: number;
          startClientY: number;
          dragged: boolean;
          lastClientX: number;
          lastClientY: number;
        }
      | null = null;

    const raycaster = new THREE.Raycaster();
    const pointerNdc = new THREE.Vector2();
    const planeHit = new THREE.Vector3();

    let rulerMesh: THREE.Mesh | null = null;
    let batCircuit: THREE.Mesh | null = null;
    let bulbGlassCircuit: THREE.Mesh | null = null;
    let bulbBaseCircuit: THREE.Mesh | null = null;
    let circuitComponentGroup: THREE.Group | null = null;
    let circuitWireGroup: THREE.Group | null = null;
    let circuitSwitchBlade: THREE.Mesh | null = null;
    let compassNeedle: THREE.Mesh | null = null;
    let motorMagneticGroup: THREE.Group | null = null;
    let motorThermalGroup: THREE.Group | null = null;
    let motorFieldGroup: THREE.Group | null = null;
    let heatWireMesh: THREE.Mesh | null = null;
    const heatParticles: THREE.Mesh[] = [];
    let bulbMeter: THREE.Mesh | null = null;
    let bulbMeter2: THREE.Mesh | null = null;
    let meterCircuitGroupSingle: THREE.Group | null = null;
    let meterCircuitGroupSeries: THREE.Group | null = null;
    let needleGaugeA: THREE.Object3D | null = null;
    let needleGaugeV: THREE.Object3D | null = null;
    let updateGaugeReadoutA: ((text: string) => void) | null = null;
    let updateGaugeReadoutV: ((text: string) => void) | null = null;
    const baseNeedleZ = { A: -0.65 };

    // --- Variant scenes -------------------------------------------------
    if (variant === "circuit") {
      const componentGroup = new THREE.Group();
      const wireGroup = new THREE.Group();
      circuitComponentGroup = componentGroup;
      circuitWireGroup = wireGroup;
      root.add(componentGroup, wireGroup);

      const bat = new THREE.Mesh(
        new THREE.BoxGeometry(0.95, 0.48, 0.42),
        new THREE.MeshStandardMaterial({ color: "#ea580c", metalness: 0.45, roughness: 0.35 }),
      );
      bat.position.set(-1.35, -0.35, 0);
      bat.castShadow = true;
      bat.userData.pickRole = "battery";
      batCircuit = bat;
      componentGroup.add(bat);
      addLabel("Pin 3V", new THREE.Vector3(-1.35, 0.1, -0.42), 0.28, componentGroup);

      const plus = new THREE.Mesh(
        new THREE.BoxGeometry(0.14, 0.26, 0.15),
        new THREE.MeshStandardMaterial({ color: "#fbbf24", emissive: "#fde047", emissiveIntensity: 0.35 }),
      );
      plus.position.set(-1.78, -0.28, 0);
      componentGroup.add(plus);

      const bulbGlass = new THREE.Mesh(
        new THREE.SphereGeometry(0.38, 40, 40),
        new THREE.MeshPhysicalMaterial({
          color: "#fde047",
          emissive: "#facc15",
          emissiveIntensity: 0.85,
          roughness: 0.18,
          metalness: 0.05,
          transmission: 0.15,
          thickness: 0.2,
        }),
      );
      bulbGlass.position.set(1.35, -0.18, 0);
      bulbGlass.castShadow = true;
      bulbGlass.userData.pickRole = "bulb";
      bulbGlassCircuit = bulbGlass;
      componentGroup.add(bulbGlass);
      addLabel("Bóng đèn", new THREE.Vector3(1.35, 0.35, -0.38), 0.28, componentGroup);

      const bulbBase = new THREE.Mesh(
        new THREE.CylinderGeometry(0.17, 0.18, 0.22, 24),
        new THREE.MeshStandardMaterial({ color: "#64748b", metalness: 0.55, roughness: 0.38 }),
      );
      bulbBase.position.set(1.35, -0.58, 0);
      bulbBase.castShadow = true;
      bulbBaseCircuit = bulbBase;
      componentGroup.add(bulbBase);

      const switchBase = new THREE.Mesh(
        new THREE.BoxGeometry(0.62, 0.08, 0.32),
        new THREE.MeshStandardMaterial({ color: "#334155", metalness: 0.35, roughness: 0.4 }),
      );
      switchBase.position.set(0.05, -0.58, 0.72);
      switchBase.castShadow = true;
      switchBase.userData.pickRole = "switch";
      componentGroup.add(switchBase);
      const switchLeft = new THREE.Mesh(
        new THREE.SphereGeometry(0.055, 16, 16),
        new THREE.MeshStandardMaterial({ color: "#fbbf24", emissive: "#facc15", emissiveIntensity: 0.25 }),
      );
      switchLeft.position.set(-0.18, -0.51, 0.72);
      componentGroup.add(switchLeft);
      const switchRight = switchLeft.clone();
      switchRight.position.set(0.18, -0.51, 0.72);
      componentGroup.add(switchRight);
      const switchBlade = new THREE.Mesh(
        new THREE.BoxGeometry(0.38, 0.035, 0.04),
        new THREE.MeshStandardMaterial({ color: "#e2e8f0", metalness: 0.55, roughness: 0.22 }),
      );
      switchBlade.position.set(0, -0.46, 0.72);
      switchBlade.rotation.z = -0.45;
      switchBlade.userData.pickRole = "switch";
      circuitSwitchBlade = switchBlade;
      componentGroup.add(switchBlade);
      addLabel("Công tắc", new THREE.Vector3(0.05, -0.16, 0.9), 0.24, componentGroup);

      const curveMain = new THREE.CatmullRomCurve3(
        [
          new THREE.Vector3(-0.85, -0.15, 0.05),
          new THREE.Vector3(-0.25, 0.35, 0.12),
          new THREE.Vector3(0.45, 0.42, -0.08),
          new THREE.Vector3(1.05, 0.05, 0.02),
        ],
        false,
        "catmullrom",
        0.45,
      );
      circuitWireMeshes.push(wireTube(curveMain, 0x38bdf8, 0.052, 96, wireGroup));
      animElectrons.push(addElectrons(curveMain, 5, 1, wireGroup));

      const curveReturn = new THREE.CatmullRomCurve3(
        [
          new THREE.Vector3(-0.85, -0.52, -0.05),
          new THREE.Vector3(-0.2, -0.62, 0.18),
          new THREE.Vector3(0.55, -0.68, -0.12),
          new THREE.Vector3(1.05, -0.45, 0),
        ],
        false,
        "catmullrom",
        0.5,
      );
      circuitWireMeshes.push(wireTube(curveReturn, 0xfbbf24, 0.045, 96, wireGroup));
      animElectrons.push(addElectrons(curveReturn, 4, -0.85, wireGroup));
      componentGroup.visible = false;
      wireGroup.visible = false;
    } else if (variant === "electrostatic") {
      const cloth = new THREE.Mesh(
        new THREE.BoxGeometry(1.1, 0.08, 0.75),
        new THREE.MeshStandardMaterial({ color: "#78350f", roughness: 0.95, metalness: 0 }),
      );
      cloth.position.set(-0.6, -0.72, 0);
      cloth.receiveShadow = true;
      cloth.rotation.y = 0.25;
      root.add(cloth);

      const ruler = new THREE.Mesh(
        new THREE.BoxGeometry(1.25, 0.06, 0.18),
        new THREE.MeshStandardMaterial({ color: "#1d4ed8", metalness: 0.35, roughness: 0.4 }),
      );
      ruler.position.set(-0.6, -0.65, 0.0);
      ruler.rotation.set(0, 0.25, 0);
      ruler.castShadow = true;
      ruler.userData.pickRole = "ruler";
      rulerMesh = ruler;
      root.add(ruler);

      for (let i = 0; i < 10; i++) {
        const chip = new THREE.Mesh(
          new THREE.BoxGeometry(0.07, 0.02, 0.07),
          new THREE.MeshStandardMaterial({ color: "#e2e8f0", roughness: 0.8 }),
        );
        chip.position.set(-0.3 + (i % 5) * 0.15, -0.78, -0.35 + Math.floor(i / 5) * 0.12);
        chip.rotation.y = Math.random() * Math.PI;
        root.add(chip);
        electrostaticChips.push(chip);
      }

      const arc = new THREE.CatmullRomCurve3(
        [
          new THREE.Vector3(-0.55, -0.35, 0.35),
          new THREE.Vector3(0, 0.25, 0.15),
          new THREE.Vector3(0.45, -0.25, 0.35),
        ],
        false,
        "centripetal",
        0.8,
      );
      wireTube(arc, 0x60a5fa, 0.035, 64);
      animElectrons.push(addElectrons(arc, 6, 1));
    } else if (variant === "motorThermal") {
      const magneticGroup = new THREE.Group();
      const thermalGroup = new THREE.Group();
      const fieldGroup = new THREE.Group();
      motorMagneticGroup = magneticGroup;
      motorThermalGroup = thermalGroup;
      motorFieldGroup = fieldGroup;
      magneticGroup.add(fieldGroup);
      root.add(magneticGroup, thermalGroup);

      const battery = new THREE.Mesh(
        new THREE.BoxGeometry(0.56, 0.28, 0.34),
        new THREE.MeshStandardMaterial({ color: "#475569", metalness: 0.35, roughness: 0.45 }),
      );
      battery.position.set(-1.55, -0.62, 0.92);
      battery.castShadow = true;
      magneticGroup.add(battery);

      const batteryCap = new THREE.Mesh(
        new THREE.BoxGeometry(0.16, 0.18, 0.38),
        new THREE.MeshStandardMaterial({ color: "#ef4444", emissive: "#991b1b", emissiveIntensity: 0.18 }),
      );
      batteryCap.position.set(-1.25, -0.58, 0.92);
      batteryCap.castShadow = true;
      magneticGroup.add(batteryCap);
      addLabel("Nguồn", new THREE.Vector3(-1.55, -0.18, 0.94), 0.28, magneticGroup);

      const coilCenter = new THREE.Vector3(-0.55, -0.32, 0);
      for (let i = 0; i < 6; i++) {
        const torus = new THREE.Mesh(
          new THREE.TorusGeometry(0.28, 0.025, 12, 42),
          new THREE.MeshStandardMaterial({
            color: "#3b82f6",
            emissive: "#1d4ed8",
            emissiveIntensity: 0.28 + i * 0.03,
            metalness: 0.4,
            roughness: 0.35,
          }),
        );
        torus.rotation.y = Math.PI / 2;
        torus.position.set(coilCenter.x - 0.36 + i * 0.14, coilCenter.y, coilCenter.z);
        torus.castShadow = true;
        motorToruses.push(torus);
        magneticGroup.add(torus);
      }
      addLabel("Cuộn dây", new THREE.Vector3(coilCenter.x, 0.12, -0.42), 0.3, magneticGroup);

      const helixPoints: THREE.Vector3[] = [];
      for (let i = 0; i <= 96; i++) {
        const f = i / 96;
        const theta = f * Math.PI * 2 * 6;
        helixPoints.push(
          new THREE.Vector3(
            coilCenter.x - 0.42 + f * 0.84,
            coilCenter.y + Math.cos(theta) * 0.28,
            coilCenter.z + Math.sin(theta) * 0.28,
          ),
        );
      }
      const coilPath = new THREE.CatmullRomCurve3(helixPoints, false, "catmullrom", 0.25);
      wireTube(coilPath, 0x38bdf8, 0.018, 160, magneticGroup);
      animElectrons.push(addElectrons(coilPath, 10, 1.05, magneticGroup));

      const wireIn = new THREE.CatmullRomCurve3(
        [
          new THREE.Vector3(-1.25, -0.55, 0.92),
          new THREE.Vector3(-1.1, -0.42, 0.45),
          new THREE.Vector3(coilCenter.x - 0.42, coilCenter.y, 0.28),
        ],
        false,
        "catmullrom",
        0.35,
      );
      const wireOut = new THREE.CatmullRomCurve3(
        [
          new THREE.Vector3(coilCenter.x + 0.42, coilCenter.y, -0.28),
          new THREE.Vector3(-0.1, -0.52, 0.72),
          new THREE.Vector3(-1.82, -0.62, 0.92),
        ],
        false,
        "catmullrom",
        0.35,
      );
      wireTube(wireIn, 0x3b82f6, 0.024, 80, magneticGroup);
      wireTube(wireOut, 0x3b82f6, 0.024, 80, magneticGroup);
      animElectrons.push(addElectrons(wireIn, 4, 1, magneticGroup));
      animElectrons.push(addElectrons(wireOut, 5, 1, magneticGroup));

      for (let i = 0; i < 4; i++) {
        const radiusX = 0.78 + i * 0.18;
        const radiusZ = 0.38 + i * 0.09;
        const points: THREE.Vector3[] = [];
        for (let p = 0; p <= 72; p++) {
          const a = (p / 72) * Math.PI * 2;
          points.push(new THREE.Vector3(
            coilCenter.x + Math.cos(a) * radiusX,
            coilCenter.y + 0.12,
            coilCenter.z + Math.sin(a) * radiusZ,
          ));
        }
        wireTube(new THREE.CatmullRomCurve3(points, true, "catmullrom", 0.4), 0x1d4ed8, 0.01, 96, fieldGroup);
      }

      const arrowMat = new THREE.MeshStandardMaterial({
        color: "#38bdf8",
        emissive: "#0ea5e9",
        emissiveIntensity: 0.45,
        metalness: 0.15,
        roughness: 0.4,
      });
      disposeList.push(arrowMat);
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const arrow = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.16, 16), arrowMat);
        arrow.position.set(
          coilCenter.x + Math.cos(angle) * 0.72,
          coilCenter.y + 0.12,
          coilCenter.z + Math.sin(angle) * 0.34,
        );
        arrow.rotation.z = -Math.PI / 2;
        arrow.rotation.y = -angle;
        fieldGroup.add(arrow);
        disposeList.push(arrow.geometry);
      }

      const compass = new THREE.Mesh(
        new THREE.CylinderGeometry(0.55, 0.55, 0.08, 40),
        new THREE.MeshStandardMaterial({ color: "#1e293b", metalness: 0.5, roughness: 0.45 }),
      );
      compass.position.set(1.15, -0.78, 0);
      compass.receiveShadow = true;
      magneticGroup.add(compass);
      addLabel("La bàn", new THREE.Vector3(1.15, -0.15, -0.48), 0.3, magneticGroup);
      addLabel("N", new THREE.Vector3(1.15, -0.38, -0.3), 0.18, magneticGroup);
      addLabel("S", new THREE.Vector3(1.15, -0.38, 0.3), 0.18, magneticGroup);
      addLabel("E", new THREE.Vector3(1.46, -0.38, 0), 0.18, magneticGroup);
      addLabel("W", new THREE.Vector3(0.84, -0.38, 0), 0.18, magneticGroup);

      const needle = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, 0.02, 0.55),
        new THREE.MeshStandardMaterial({ color: "#ef4444", emissive: "#b91c1c", emissiveIntensity: 0.25 }),
      );
      needle.position.set(1.15, -0.72, 0);
      needle.rotation.y = Math.PI / 2;
      needle.userData.pickRole = "needle";
      compassNeedle = needle;
      magneticGroup.add(needle);

      const heatBattery = new THREE.Mesh(
        new THREE.BoxGeometry(0.62, 0.28, 0.36),
        new THREE.MeshStandardMaterial({ color: "#475569", metalness: 0.35, roughness: 0.45 }),
      );
      heatBattery.position.set(0, -0.62, 0.98);
      heatBattery.castShadow = true;
      thermalGroup.add(heatBattery);
      addLabel("Nguồn", new THREE.Vector3(0, -0.18, 0.98), 0.28, thermalGroup);

      const heatPoints: THREE.Vector3[] = [];
      const startX = -0.72;
      const step = 0.18;
      for (let i = 0; i <= 8; i++) {
        heatPoints.push(new THREE.Vector3(startX + i * step, -0.18 + (i % 2 === 0 ? 0.18 : -0.18), 0));
      }
      const heatCurve = new THREE.CatmullRomCurve3(heatPoints, false, "catmullrom", 0.02);
      heatWireMesh = wireTube(heatCurve, 0xef4444, 0.035, 96, thermalGroup);
      addLabel("Dây đốt nóng", new THREE.Vector3(0, 0.28, -0.45), 0.32, thermalGroup);

      const heatWireLeft = new THREE.CatmullRomCurve3(
        [
          new THREE.Vector3(-0.72, -0.18, 0),
          new THREE.Vector3(-0.92, -0.34, 0.45),
          new THREE.Vector3(-0.72, -0.62, 0.98),
        ],
        false,
        "catmullrom",
        0.35,
      );
      const heatWireRight = new THREE.CatmullRomCurve3(
        [
          new THREE.Vector3(0.72, -0.18, 0),
          new THREE.Vector3(0.92, -0.34, 0.45),
          new THREE.Vector3(0.72, -0.62, 0.98),
        ],
        false,
        "catmullrom",
        0.35,
      );
      wireTube(heatWireLeft, 0x3b82f6, 0.024, 80, thermalGroup);
      wireTube(heatWireRight, 0x3b82f6, 0.024, 80, thermalGroup);
      animElectrons.push(addElectrons(heatWireLeft, 4, 1, thermalGroup));
      animElectrons.push(addElectrons(heatCurve, 8, 1.2, thermalGroup));
      animElectrons.push(addElectrons(heatWireRight, 4, 1, thermalGroup));

      const heatParticleGeom = new THREE.SphereGeometry(0.035, 12, 12);
      const heatParticleMat = new THREE.MeshStandardMaterial({
        color: "#f97316",
        emissive: "#ef4444",
        emissiveIntensity: 0.8,
        transparent: true,
        opacity: 0.65,
      });
      disposeList.push(heatParticleGeom, heatParticleMat);
      for (let i = 0; i < 10; i++) {
        const particleMat = heatParticleMat.clone();
        disposeList.push(particleMat);
        const particle = new THREE.Mesh(heatParticleGeom, particleMat);
        particle.position.set(-0.5 + Math.random(), 0.02 + Math.random() * 0.45, -0.08 + Math.random() * 0.16);
        (particle.userData as { phase: number; baseX: number }).phase = i / 10;
        (particle.userData as { phase: number; baseX: number }).baseX = -0.55 + i * 0.12;
        heatParticles.push(particle);
        thermalGroup.add(particle);
      }

      thermalGroup.visible = false;
    } else {
      // meters
      const singleGroup = new THREE.Group();
      const seriesGroup = new THREE.Group();
      meterCircuitGroupSingle = singleGroup;
      meterCircuitGroupSeries = seriesGroup;
      root.add(singleGroup, seriesGroup);

      const bat = new THREE.Mesh(
        new THREE.BoxGeometry(0.72, 0.42, 0.38),
        new THREE.MeshStandardMaterial({ color: "#475569", metalness: 0.5, roughness: 0.35 }),
      );
      bat.position.set(-1.65, -0.35, 0);
      bat.castShadow = true;
      root.add(bat);
      addLabel("Nguồn", new THREE.Vector3(-1.65, 0.08, -0.32), 0.28);

      const makeBulb = (x: number, label: string, parent: THREE.Object3D) => {
        const bulb = new THREE.Mesh(
          new THREE.SphereGeometry(0.26, 28, 28),
          new THREE.MeshStandardMaterial({ color: "#fbbf24", emissive: "#f59e0b", emissiveIntensity: 0.9 }),
        );
        bulb.position.set(x, -0.15, 0);
        bulb.castShadow = true;
        bulb.userData.pickRole = "bulbMeter";
        parent.add(bulb);
        addLabel(label, new THREE.Vector3(x, 0.25, -0.34), 0.24, parent);
        return bulb;
      };

      bulbMeter = makeBulb(0.05, "Đèn", singleGroup);
      makeBulb(-0.35, "Đèn 1", seriesGroup);
      bulbMeter2 = makeBulb(0.55, "Đèn 2", seriesGroup);

      const makeGauge = (x: number, needleAngle: number, gaugeId: "A" | "V") => {
        const body = new THREE.Mesh(
          new THREE.CylinderGeometry(0.42, 0.42, 0.1, 36),
          new THREE.MeshStandardMaterial({
            color: gaugeId === "A" ? "#1e3a8a" : "#166534",
            emissive: gaugeId === "A" ? "#1d4ed8" : "#16a34a",
            emissiveIntensity: 0.18,
            metalness: 0.2,
            roughness: 0.32,
          }),
        );
        body.position.set(x, -0.78, 0.85);
        body.rotation.x = Math.PI / 2;
        body.userData.pickRole = "gaugeFace";
        body.userData.gaugeId = gaugeId;
        root.add(body);
        const face = new THREE.Mesh(
          new THREE.CircleGeometry(0.34, 36),
          new THREE.MeshBasicMaterial({ color: "#e2e8f0" }),
        );
        face.position.set(x, -0.715, 0.85);
        face.rotation.x = -Math.PI / 2;
        root.add(face);
        const arc = new THREE.Mesh(
          new THREE.TorusGeometry(0.24, 0.008, 8, 36, Math.PI * 1.25),
          new THREE.MeshBasicMaterial({ color: gaugeId === "A" ? "#3b82f6" : "#22c55e" }),
        );
        arc.position.set(x, -0.705, 0.85);
        arc.rotation.x = -Math.PI / 2;
        arc.rotation.z = -Math.PI * 0.12;
        root.add(arc);
        const needlePivot = new THREE.Group();
        needlePivot.position.set(x, -0.67, 0.85);
        needlePivot.rotation.y = needleAngle;
        root.add(needlePivot);
        const needle = new THREE.Mesh(
          new THREE.BoxGeometry(0.035, 0.025, 0.3),
          new THREE.MeshBasicMaterial({ color: "#ef4444" }),
        );
        needle.position.z = -0.13;
        needlePivot.add(needle);
        const hub = new THREE.Mesh(
          new THREE.SphereGeometry(0.045, 16, 16),
          new THREE.MeshBasicMaterial({ color: "#334155" }),
        );
        hub.position.set(x, -0.655, 0.85);
        root.add(hub);
        addLabel(gaugeId, new THREE.Vector3(x, -0.48, 0.85), 0.22);
        const updateReadout = addReadout(gaugeId === "A" ? "0.00 A" : "0.0 V", new THREE.Vector3(x, -0.42, 0.52));
        if (gaugeId === "A") {
          needleGaugeA = needlePivot;
          updateGaugeReadoutA = updateReadout;
        } else {
          needleGaugeV = needlePivot;
          updateGaugeReadoutV = updateReadout;
        }
      };

      makeGauge(-0.8, baseNeedleZ.A, "A");
      makeGauge(1.55, baseNeedleZ.A, "V");
      addLabel("Ampe kế nối tiếp", new THREE.Vector3(-0.8, -0.18, 1.28), 0.24);
      addLabel("Vôn kế song song", new THREE.Vector3(1.55, -0.18, 1.28), 0.24);

      const singleMainPath = new THREE.CatmullRomCurve3(
        [
          new THREE.Vector3(-1.3, -0.35, 0),
          new THREE.Vector3(-0.7, -0.35, 0),
          new THREE.Vector3(-0.25, -0.35, 0),
          new THREE.Vector3(0.05, -0.35, 0),
          new THREE.Vector3(0.45, -0.35, 0),
          new THREE.Vector3(0.75, -0.58, 0.55),
          new THREE.Vector3(-1.65, -0.58, 0.55),
          new THREE.Vector3(-1.65, -0.35, 0),
        ],
        true,
        "catmullrom",
        0.25,
      );
      wireTube(singleMainPath, 0x38bdf8, 0.035, 128, singleGroup);
      animElectrons.push(addElectrons(singleMainPath, 7, 1, singleGroup));

      const singleVoltmeterPath = new THREE.CatmullRomCurve3(
        [
          new THREE.Vector3(-0.25, -0.35, 0),
          new THREE.Vector3(0.65, -0.05, 0.6),
          new THREE.Vector3(1.25, -0.35, 0.85),
          new THREE.Vector3(0.45, -0.35, 0),
        ],
        false,
        "catmullrom",
        0.35,
      );
      wireTube(singleVoltmeterPath, 0x22c55e, 0.022, 96, singleGroup);

      const seriesMainPath = new THREE.CatmullRomCurve3(
        [
          new THREE.Vector3(-1.3, -0.35, 0),
          new THREE.Vector3(-0.7, -0.35, 0),
          new THREE.Vector3(-0.35, -0.35, 0),
          new THREE.Vector3(0.1, -0.35, 0),
          new THREE.Vector3(0.55, -0.35, 0),
          new THREE.Vector3(0.95, -0.58, 0.55),
          new THREE.Vector3(-1.65, -0.58, 0.55),
          new THREE.Vector3(-1.65, -0.35, 0),
        ],
        true,
        "catmullrom",
        0.25,
      );
      wireTube(seriesMainPath, 0x38bdf8, 0.035, 128, seriesGroup);
      animElectrons.push(addElectrons(seriesMainPath, 8, 0.85, seriesGroup));

      const seriesVoltmeterPath = new THREE.CatmullRomCurve3(
        [
          new THREE.Vector3(0.1, -0.35, 0),
          new THREE.Vector3(0.8, -0.05, 0.6),
          new THREE.Vector3(1.25, -0.35, 0.85),
          new THREE.Vector3(0.95, -0.35, 0),
        ],
        false,
        "catmullrom",
        0.35,
      );
      wireTube(seriesVoltmeterPath, 0x22c55e, 0.022, 96, seriesGroup);
      seriesGroup.visible = false;
    }

    const setNdc = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointerNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointerNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    };

    const findPickRole = (mesh: THREE.Object3D | null): string | undefined => {
      let o: THREE.Object3D | null = mesh;
      while (o) {
        const r = o.userData?.pickRole as string | undefined;
        if (r) return r;
        o = o.parent;
      }
      return undefined;
    };

    const onPointerDown = (e: PointerEvent) => {
      if (!interactionEnabledRef.current) return;
      if (e.button !== 0 && e.button !== 2) return;
      setNdc(e);
      raycaster.setFromCamera(pointerNdc, camera);
      const hits = raycaster.intersectObjects(root.children, true);
      const hit = hits[0];
      if (!hit) return;

      const role = findPickRole(hit.object);
      const mode: DragMode = e.button === 2 || e.shiftKey ? "rotate" : "translate";

      if (variant === "circuit" && role === "switch") {
        circuitPartsPlacedRef.current = true;
        circuitWiresConnectedRef.current = true;
        circuitSwitchClosedRef.current = !circuitSwitchClosedRef.current;
        setCircuitPartsPlaced(true);
        setCircuitWiresConnected(true);
        setCircuitSwitchClosed(circuitSwitchClosedRef.current);
        play("switch");
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      if (variant === "circuit" && role === "battery" && batCircuit) {
        controls.enabled = false;
        dragState = {
          object: batCircuit,
          kind: "battery",
          mode,
          startX: batCircuit.position.x,
          startZ: batCircuit.position.z,
          startY: batCircuit.position.y,
          startClientY: e.clientY,
          dragged: false,
          lastClientX: e.clientX,
          lastClientY: e.clientY,
        };
        renderer.domElement.setPointerCapture(e.pointerId);
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      if (variant === "electrostatic" && role === "ruler" && rulerMesh) {
        controls.enabled = false;
        dragState = {
          object: rulerMesh,
          kind: "ruler",
          mode,
          startX: rulerMesh.position.x,
          startZ: rulerMesh.position.z,
          startY: rulerMesh.position.y,
          startClientY: e.clientY,
          dragged: false,
          lastClientX: e.clientX,
          lastClientY: e.clientY,
        };
        renderer.domElement.setPointerCapture(e.pointerId);
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      if (variant === "circuit" && role === "bulb" && bulbGlassCircuit) {
        controls.enabled = false;
        dragState = {
          object: bulbGlassCircuit,
          kind: "bulb",
          mode,
          startX: bulbGlassCircuit.position.x,
          startZ: bulbGlassCircuit.position.z,
          startY: bulbGlassCircuit.position.y,
          startClientY: e.clientY,
          dragged: false,
          lastClientX: e.clientX,
          lastClientY: e.clientY,
        };
        renderer.domElement.setPointerCapture(e.pointerId);
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      if (variant === "motorThermal" && role === "needle" && compassNeedle) {
        controls.enabled = false;
        dragState = {
          object: compassNeedle,
          kind: "needle",
          mode,
          startX: compassNeedle.position.x,
          startZ: compassNeedle.position.z,
          startY: compassNeedle.position.y,
          startClientY: e.clientY,
          dragged: false,
          lastClientX: e.clientX,
          lastClientY: e.clientY,
        };
        renderer.domElement.setPointerCapture(e.pointerId);
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      if (variant === "meters" && role === "bulbMeter" && bulbMeter) {
        controls.enabled = false;
        dragState = {
          object: bulbMeter,
          kind: "bulbMeter",
          mode,
          startX: bulbMeter.position.x,
          startZ: bulbMeter.position.z,
          startY: bulbMeter.position.y,
          startClientY: e.clientY,
          dragged: false,
          lastClientX: e.clientX,
          lastClientY: e.clientY,
        };
        renderer.domElement.setPointerCapture(e.pointerId);
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!interactionEnabledRef.current) return;
      if (!dragState) return;
      setNdc(e);
      raycaster.setFromCamera(pointerNdc, camera);

      if (dragState.mode === "rotate") {
        const dx = e.clientX - dragState.lastClientX;
        const dy = e.clientY - dragState.lastClientY;
        dragState.lastClientX = e.clientX;
        dragState.lastClientY = e.clientY;
        const rotationSpeed = 0.008;

        if (dragState.kind === "needle" && compassNeedle) {
          compassNeedle.rotation.y += dx * 0.01;
          compassNeedle.rotation.x += dy * 0.005;
        } else {
          dragState.object.rotation.y += dx * rotationSpeed;
          dragState.object.rotation.x += dy * rotationSpeed;
        }
        dragState.dragged = true;
        return;
      }

      const activePlane =
        dragState.kind === "ruler"
          ? new THREE.Plane(new THREE.Vector3(0, 1, 0), -dragState.startY)
          : dragPlane;
      if (!raycaster.ray.intersectPlane(activePlane, planeHit)) return;

      if (dragState.kind === "ruler") {
        dragState.object.position.x = THREE.MathUtils.clamp(planeHit.x, -1.35, 1.55);
        dragState.object.position.z = THREE.MathUtils.clamp(planeHit.z, -1.15, 1.35);
        dragState.dragged = dragState.dragged || Math.hypot(planeHit.x - dragState.startX, planeHit.z - dragState.startZ) > 0.02;
      } else if (dragState.kind === "battery") {
        const x = THREE.MathUtils.clamp(planeHit.x, -1.35, 1.55);
        const z = THREE.MathUtils.clamp(planeHit.z, -1.25, 1.25);
        dragState.object.position.x = x;
        dragState.object.position.z = z;
        dragState.dragged = dragState.dragged || Math.hypot(planeHit.x - dragState.startX, planeHit.z - dragState.startZ) > 0.02;
      } else if (dragState.kind === "bulb" && bulbGlassCircuit) {
        const x = THREE.MathUtils.clamp(planeHit.x, -1.6, 1.85);
        const z = THREE.MathUtils.clamp(planeHit.z, -1.25, 1.25);
        bulbGlassCircuit.position.x = x;
        bulbGlassCircuit.position.z = z;
        if (bulbBaseCircuit) {
          bulbBaseCircuit.position.x = x;
          bulbBaseCircuit.position.z = z;
        }
      } else if (dragState.kind === "needle" && compassNeedle) {
        const cx = 1.15;
        const cz = 0;
        compassNeedle.rotation.y = Math.atan2(planeHit.x - cx, planeHit.z - cz);
      } else if (dragState.kind === "bulbMeter" && bulbMeter) {
        bulbMeter.position.x = THREE.MathUtils.clamp(planeHit.x, -1.4, 1.6);
        bulbMeter.position.z = THREE.MathUtils.clamp(planeHit.z, -1.2, 1.2);
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!dragState) return;
      if (dragState.kind === "battery" && !dragState.dragged) {
        circuitPartsPlacedRef.current = true;
        circuitWiresConnectedRef.current = true;
        circuitSwitchClosedRef.current = !circuitSwitchClosedRef.current;
        setCircuitPartsPlaced(true);
        setCircuitWiresConnected(true);
        setCircuitSwitchClosed(circuitSwitchClosedRef.current);
        play("switch");
      }
      dragState = null;
      controls.enabled = interactionEnabledRef.current && renderSettingsRef.current.orbit;
      try {
        renderer.domElement.releasePointerCapture(e.pointerId);
      } catch {
        /* already released */
      }
    };

    renderer.domElement.style.touchAction = "none";
    renderer.domElement.addEventListener("contextmenu", (event) => event.preventDefault());
    renderer.domElement.addEventListener("pointerdown", onPointerDown, true);
    renderer.domElement.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("pointerup", onPointerUp);
    renderer.domElement.addEventListener("pointercancel", onPointerUp);

    const clock = new THREE.Clock();
    let raf = 0;

    const animate = () => {
      raf = requestAnimationFrame(animate);
      const settings = renderSettingsRef.current;
      const dt = Math.min(clock.getDelta(), 0.1) * settings.speed;
      const t = clock.getElapsedTime();

      let flowMul = 1;
      ambient.intensity = settings.lights ? 0.85 : 0.14;
      keyLight.intensity = settings.lights ? 1.55 : 0.2;
      fillLight.intensity = settings.lights ? 0.45 : 0;
      rim.intensity = settings.lights ? 0.7 : 0;
      keyLight.castShadow = settings.shadows;
      renderer.shadowMap.enabled = settings.shadows;
      floor.receiveShadow = settings.shadows;
      electronMat.visible = settings.particles;
      if (motorFieldGroup) motorFieldGroup.visible = settings.fieldLines;

      if (variant === "electrostatic" && rulerMesh) {
        const clothCenterX = -0.6;
        const clothHalfWidth = 1.1 / 2;
        const clothHalfDepth = 0.75 / 2;
        const clothTopY = -0.68;
        const rulerBottomY = rulerMesh.position.y - 0.03;
        const onClothHorizontally =
          Math.abs(rulerMesh.position.x - clothCenterX) <= clothHalfWidth &&
          Math.abs(rulerMesh.position.z) <= clothHalfDepth;
        const onClothVertically = rulerBottomY <= clothTopY + 0.01;
        const isRubbing = dragState?.kind === "ruler" && dragState.dragged && onClothHorizontally && onClothVertically;

        if (isRubbing) {
          rubCharge = Math.min(1, rubCharge + dt * 0.5);
          if (t - sceneSoundAtRef.current > 0.9) {
            play("spark");
            sceneSoundAtRef.current = t;
          }
        } else {
          rubCharge = Math.max(0, rubCharge - dt * 0.12);
        }

        const mat = rulerMesh.material as THREE.MeshStandardMaterial;
        mat.emissive = new THREE.Color("#1e40af");
        mat.emissiveIntensity = settings.glow ? 0.08 + rubCharge * 0.85 : 0;
        flowMul = rubCharge > 0 ? 0.28 + rubCharge * 1.2 : 0;

        electrostaticChips.forEach((chip) => {
          const maxAttractRange = 0.8;
          const restY = -0.78;
          const dist = chip.position.distanceTo(rulerMesh.position);
          if (rubCharge > 0.05 && dist < maxAttractRange) {
            const direction = new THREE.Vector3().subVectors(rulerMesh.position, chip.position);
            direction.y = 0;
            direction.normalize();
            const attraction = Math.max(0, (0.7 - dist) / 0.7) * rubCharge * dt * 0.8;
            chip.position.addScaledVector(direction, attraction);
            chip.position.y = THREE.MathUtils.lerp(chip.position.y, restY + Math.min(rubCharge, 0.4) * 0.05, dt * 3);
          } else {
            if (chip.position.y > restY) {
              chip.position.y = Math.max(restY, chip.position.y - dt * 0.25);
            }
            if (rubCharge < 0.05 && dist < 0.6) {
              const push = new THREE.Vector3().subVectors(chip.position, rulerMesh.position);
              push.y = 0;
              if (push.lengthSq() < 0.001) {
                push.set(1, 0, 0);
              }
              push.normalize();
              chip.position.addScaledVector(push, dt * 0.15);
            }
          }
        });
      } else if (variant === "circuit") {
        const partsPlaced = circuitPartsPlacedRef.current;
        const wiresConnected = circuitWiresConnectedRef.current;
        const switchClosed = circuitSwitchClosedRef.current;
        const circuitClosed = partsPlaced && wiresConnected && switchClosed;
        circuitOn = circuitClosed;
        flowMul = circuitClosed ? 1 : 0.04;
        if (circuitComponentGroup) circuitComponentGroup.visible = partsPlaced;
        if (circuitWireGroup) circuitWireGroup.visible = wiresConnected;
        if (circuitSwitchBlade) {
          circuitSwitchBlade.rotation.z = switchClosed ? 0 : -0.45;
          const mat = circuitSwitchBlade.material as THREE.MeshStandardMaterial;
          mat.emissive = new THREE.Color(switchClosed ? "#22c55e" : "#000000");
          mat.emissiveIntensity = settings.glow && switchClosed ? 0.25 : 0;
        }
        circuitWireMeshes.forEach((mesh) => {
          const mat = mesh.material as THREE.MeshStandardMaterial;
          mat.emissiveIntensity = settings.glow ? circuitClosed ? 0.35 : 0.04 : 0;
        });
        if (bulbGlassCircuit) {
          const m = bulbGlassCircuit.material as THREE.MeshPhysicalMaterial;
          m.emissiveIntensity = settings.glow ? circuitClosed ? 0.95 : 0.03 : 0;
        }
        if (batCircuit) {
          const m = batCircuit.material as THREE.MeshStandardMaterial;
          m.color.setHex(circuitClosed ? 0xea580c : 0x7c2d12);
        }
      } else if (variant === "motorThermal") {
        const experiment = motorExperimentRef.current;
        const voltage = motorVoltageRef.current;
        const voltageRatio = THREE.MathUtils.clamp(voltage / 9, 0, 1);
        const targetBoost = 0.35 + voltageRatio * 1.45;
        const baseNeedleAngle = THREE.MathUtils.degToRad(12 + voltageRatio * 95);
        if (motorMagneticGroup) motorMagneticGroup.visible = experiment === "magnetic";
        if (motorThermalGroup) motorThermalGroup.visible = experiment === "thermal";
        if (motorFieldGroup) {
          motorFieldGroup.visible = settings.fieldLines && experiment === "magnetic";
          motorFieldGroup.scale.setScalar(0.82 + voltageRatio * 0.28);
          motorFieldGroup.traverse((object) => {
            if (!(object instanceof THREE.Mesh)) return;
            const mat = object.material as THREE.MeshStandardMaterial;
            mat.opacity = 0.25 + voltageRatio * 0.65;
            mat.transparent = true;
            mat.emissiveIntensity = settings.glow ? 0.18 + voltageRatio * 0.75 : 0;
          });
        }
        motorBoost += (targetBoost - motorBoost) * dt * 3;
        flowMul = 0.15 + motorBoost * 0.55;
        motorToruses.forEach((torus, i) => {
          const mat = torus.material as THREE.MeshStandardMaterial;
          mat.emissiveIntensity = settings.glow
            ? (0.28 + i * 0.03) * Math.min(motorBoost, 2.2) + Math.sin(t * 2 + i) * 0.04
            : 0;
        });
        if (compassNeedle && experiment === "magnetic") {
          compassNeedle.rotation.y = baseNeedleAngle + 0.035 * Math.sin(t * 1.2);
        }
        if (heatWireMesh) {
          const mat = heatWireMesh.material as THREE.MeshStandardMaterial;
          mat.color.setHSL(0.02, 0.9, 0.28 + voltageRatio * 0.28);
          mat.emissive.setHSL(0.02, 1, 0.25 + voltageRatio * 0.25);
          mat.emissiveIntensity = settings.glow ? 0.35 + voltageRatio * 1.25 + Math.sin(t * 7) * 0.08 : 0;
        }
        heatParticles.forEach((particle, i) => {
          particle.visible = settings.particles && experiment === "thermal";
          const data = particle.userData as { phase: number; baseX: number };
          const rise = (t * (0.18 + voltageRatio * 0.5) + data.phase) % 1;
          particle.position.x = data.baseX + Math.sin(t * 1.8 + i) * 0.04;
          particle.position.y = -0.02 + rise * (0.45 + voltageRatio * 0.55);
          particle.position.z = Math.sin(t * 2.1 + i) * 0.08;
          particle.scale.setScalar(0.5 + voltageRatio * 0.9 + rise * 0.5);
          const mat = particle.material as THREE.MeshStandardMaterial;
          mat.opacity = Math.max(0, (1 - rise) * (0.25 + voltageRatio * 0.55));
        });
        if (experiment === "thermal" && voltageRatio > 0.72 && t - sceneSoundAtRef.current > 2.5) {
          play("buzz");
          sceneSoundAtRef.current = t;
        }
      } else if (variant === "meters") {
        const circuit = meterCircuitRef.current;
        const voltage = meterVoltageRef.current;
        const resistance = circuit === "series" ? 12 : 6;
        const current = voltage / resistance;
        const measuredVoltage = circuit === "series" ? voltage / 2 : voltage;
        const currentRatio = THREE.MathUtils.clamp(current / 1, 0, 1);
        const voltageRatio = THREE.MathUtils.clamp(measuredVoltage / 10, 0, 1);
        flowMul = 0.25 + currentRatio * 0.9;
        if (meterCircuitGroupSingle) meterCircuitGroupSingle.visible = circuit === "single";
        if (meterCircuitGroupSeries) meterCircuitGroupSeries.visible = circuit === "series";
        if (needleGaugeA) {
          needleGaugeA.rotation.y = baseNeedleZ.A + currentRatio * 1.25;
        }
        if (needleGaugeV) {
          needleGaugeV.rotation.y = baseNeedleZ.A + voltageRatio * 1.25;
        }
        updateGaugeReadoutA?.(`${current.toFixed(2)} A`);
        updateGaugeReadoutV?.(`${measuredVoltage.toFixed(1)} V`);
        [bulbMeter, bulbMeter2].forEach((bulb) => {
          if (!bulb) return;
          const mat = bulb.material as THREE.MeshStandardMaterial;
          mat.emissiveIntensity = settings.glow ? 0.12 + currentRatio * 1.1 : 0;
          mat.color.setHex(currentRatio > 0.05 ? 0xfbbf24 : 0x475569);
        });
      }

      if (variant === "electrostatic" && rulerMesh) {
        const clothTopY = -0.68;
        const rulerBottomY = rulerMesh.position.y - 0.03;
        const verticalDistanceCm = Math.max(0, rulerBottomY - clothTopY) * 100;
        const chargePercent = Math.round(rubCharge * 100);
        updateOverlayInfo({
          title: "Điện tĩnh",
          values: [
            `Khoảng cách tới vải: ${verticalDistanceCm.toFixed(1)} cm`,
            `Điện tích mô phỏng: ${chargePercent}%`,
          ],
          hint: "Kéo thước quanh mặt phẳng để dịch chuyển. Giữ Shift hoặc dùng chuột phải + kéo để xoay thước 360°.",
        });
      } else if (variant === "circuit") {
        const voltage = batCircuit ? 1.5 + THREE.MathUtils.clamp((batCircuit.position.x + 1.35) / 2.7, 0, 1) * 3 : 3;
        const partsPlaced = circuitPartsPlacedRef.current;
        const wiresConnected = circuitWiresConnectedRef.current;
        const switchClosed = circuitSwitchClosedRef.current;
        const circuitClosed = partsPlaced && wiresConnected && switchClosed;
        updateOverlayInfo({
          title: "Mạch điện",
          values: [
            `B1 đặt linh kiện: ${partsPlaced ? "xong" : "chưa"}`,
            `B2 nối dây: ${wiresConnected ? "xong" : "chưa"}`,
            `B3 công tắc: ${switchClosed ? "đóng" : "mở"}`,
            `Mạch: ${circuitClosed ? "kín - đèn sáng" : "hở - chưa có dòng"}`,
            `Điện áp mô phỏng: ${voltage.toFixed(1)} V`,
          ],
          hint: "Thực hiện theo thứ tự: đặt linh kiện, nối dây, rồi đóng công tắc để quan sát dòng điện.",
        });
      } else if (variant === "motorThermal") {
        const experiment = motorExperimentRef.current;
        const voltage = motorVoltageRef.current;
        const voltageRatio = THREE.MathUtils.clamp(voltage / 9, 0, 1);
        const needleAngle = Math.round(12 + voltageRatio * 95);
        const temperature = Math.round(25 + voltageRatio * voltageRatio * 1250);
        updateOverlayInfo({
          title: experiment === "magnetic" ? "Tác dụng từ" : "Tác dụng nhiệt",
          values: experiment === "magnetic"
            ? [
                `Điện áp nguồn: ${voltage.toFixed(1)}V`,
                `Góc lệch kim: ${needleAngle}°`,
              ]
            : [
                `Điện áp nguồn: ${voltage.toFixed(1)}V`,
                `Nhiệt độ dây: ${temperature}°C`,
              ],
          hint: experiment === "magnetic"
            ? "Kéo thanh điện áp để thay đổi cường độ dòng điện và quan sát kim la bàn lệch nhiều hay ít."
            : "Kéo thanh điện áp để quan sát dây dẫn nóng đỏ hơn khi dòng điện mạnh hơn.",
        });
      } else if (variant === "meters") {
        const circuit = meterCircuitRef.current;
        const voltage = meterVoltageRef.current;
        const resistance = circuit === "series" ? 12 : 6;
        const ammeterValue = voltage / resistance;
        const voltmeterValue = circuit === "series" ? voltage / 2 : voltage;
        updateOverlayInfo({
          title: "Đo I và U",
          values: [
            `Mạch: ${circuit === "series" ? "2 bóng nối tiếp" : "1 bóng đèn"}`,
            `Ampe kế nối tiếp: ${ammeterValue.toFixed(2)} A`,
            `Vôn kế song song: ${voltmeterValue.toFixed(1)} V`,
          ],
          hint: "Ampe kế mắc nối tiếp trong mạch, vôn kế mắc song song với bóng đèn cần đo.",
        });
      }

      animElectrons.forEach((bundle) => {
        const { meshes, curve, speed } = bundle;
        meshes.forEach((m) => {
          m.visible = settings.particles && bundle.parent.visible;
          const phase = (m.userData as { phase: number }).phase;
          let u = (t * speed * 0.15 * flowMul + phase) % 1;
          if (u < 0) u += 1;
          const p = curve.getPointAt(u);
          m.position.copy(p);
          const dim = variant === "circuit" && !circuitOn;
          m.scale.setScalar(dim ? 0.4 : 1);
        });
      });

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    const mountElement = mountRef.current;

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", handleResize);
      renderer.domElement.removeEventListener("pointerdown", onPointerDown, true);
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      renderer.domElement.removeEventListener("pointercancel", onPointerUp);
      controls.dispose();
      controlsRef.current = null;
      cameraRef.current = null;
      rendererRef.current = null;
      disposeList.forEach((d) => ("dispose" in d && typeof d.dispose === "function" ? d.dispose() : undefined));
      renderer.dispose();
      if (mountElement?.contains(renderer.domElement)) {
        mountElement.removeChild(renderer.domElement);
      }
      scene.clear();
    };
  }, [variant, play]);

  return (
    <div className="space-y-3">
      <div
        ref={mountRef}
        className={`w-full h-[min(420px,55vh)] min-h-[320px] rounded-3xl overflow-hidden bg-slate-800 ${
          interactionEnabled ? "cursor-grab active:cursor-grabbing" : "cursor-default"
        }`}
        role="img"
        aria-label="Mô hình 3D — xoay camera, kéo / nhấp các vật trong lab"
      />
      {infoPanelState === "hidden" ? (
        <button
          type="button"
          onClick={() => setInfoPanelState("expanded")}
          className="rounded-full border border-white/10 bg-slate-950/80 px-3 py-1.5 text-[11px] text-slate-200 shadow-lg shadow-slate-950/40 backdrop-blur-md transition-colors hover:bg-slate-800/90"
        >
          Hiện thông số 3D
        </button>
      ) : (
          <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-3 text-xs text-slate-100 shadow-lg shadow-slate-950/30">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[11px] uppercase tracking-[0.2em] text-slate-400">{overlayInfo.title || "Mô phỏng 3D"}</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setInteractionEnabled((enabled) => !enabled)}
                  className={`rounded-full px-2 py-0.5 text-[10px] transition-colors ${
                    interactionEnabled
                      ? "bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/30"
                      : "bg-slate-800/90 text-slate-400 hover:bg-slate-700/90"
                  }`}
                  aria-pressed={interactionEnabled}
                >
                  Tương tác: {interactionEnabled ? "Bật" : "Tắt"}
                </button>
                <button
                  type="button"
                  onClick={() => setInfoPanelState((state) => (state === "expanded" ? "collapsed" : "expanded"))}
                  className="rounded-full bg-slate-800/90 px-2 py-0.5 text-[10px] text-slate-300 transition-colors hover:bg-slate-700/90"
                  aria-expanded={infoPanelState === "expanded"}
                >
                  {infoPanelState === "expanded" ? "Thu nhỏ" : "Mở rộng"}
                </button>
                <button
                  type="button"
                  onClick={() => setInfoPanelState("hidden")}
                  className="rounded-full bg-slate-800/90 px-2 py-0.5 text-[10px] text-slate-300 transition-colors hover:bg-slate-700/90"
                >
                  Ẩn
                </button>
              </div>
            </div>
            {infoPanelState === "expanded" ? (
              <>
                <div className="mb-3 grid gap-3 lg:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-2">
                    <p className="mb-2 text-[10px] uppercase tracking-[0.16em] text-slate-500">Điều khiển hiển thị</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {SCENE_RENDER_TOGGLES[variant].map(([key, label]) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => {
                            setRenderSetting(key, !renderSettings[key]);
                            play("click");
                          }}
                          className={`rounded-xl border px-2 py-1.5 text-[10px] transition-colors ${
                            renderSettings[key]
                              ? "border-sky-400/40 bg-sky-500/20 text-sky-200"
                              : "border-white/10 bg-slate-800/70 text-slate-400 hover:bg-slate-700/80"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    <div className="mt-3">
                      <div className="mb-1 flex items-center justify-between text-[10px] text-slate-400">
                        <span>Tốc độ mô phỏng</span>
                        <span className="font-mono text-sky-300">{renderSettings.speed.toFixed(1)}x</span>
                      </div>
                      <input
                        type="range"
                        min="0.2"
                        max="2"
                        step="0.1"
                        value={renderSettings.speed}
                        onChange={(event) => setRenderSetting("speed", Number(event.target.value))}
                        onMouseUp={() => play("click")}
                        onTouchEnd={() => play("click")}
                        className="w-full accent-sky-400"
                        aria-label="Chỉnh tốc độ mô phỏng 3D"
                      />
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-2">
                    <p className="mb-2 text-[10px] uppercase tracking-[0.16em] text-slate-500">Góc nhìn camera</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {SCENE_CAMERA_PRESETS[variant].map((presetId) => (
                        <button
                          key={presetId}
                          type="button"
                          onClick={() => applyCameraPreset(presetId)}
                          className="rounded-xl border border-white/10 bg-slate-800/70 px-2 py-1.5 text-[10px] text-slate-300 transition-colors hover:border-sky-400/40 hover:bg-sky-500/15 hover:text-sky-200"
                        >
                          {CAMERA_PRESETS[presetId].label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                {variant === "motorThermal" && (
                  <div className="mb-3 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setMotorExperiment("magnetic");
                        play("switch");
                      }}
                      className={`rounded-xl border px-2 py-1.5 text-[10px] font-medium transition-colors ${
                        motorExperiment === "magnetic"
                          ? "border-sky-400/40 bg-sky-500/20 text-sky-200"
                          : "border-white/10 bg-slate-800/70 text-slate-400 hover:bg-slate-700/80"
                      }`}
                    >
                      Tác dụng từ
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMotorExperiment("thermal");
                        play("switch");
                      }}
                      className={`rounded-xl border px-2 py-1.5 text-[10px] font-medium transition-colors ${
                        motorExperiment === "thermal"
                          ? "border-red-400/40 bg-red-500/20 text-red-200"
                          : "border-white/10 bg-slate-800/70 text-slate-400 hover:bg-slate-700/80"
                      }`}
                    >
                      Tác dụng nhiệt
                    </button>
                  </div>
                )}
                {variant === "circuit" && (
                  <div className="mb-3 rounded-2xl border border-white/10 bg-slate-900/70 p-2">
                    <p className="mb-2 text-[10px] uppercase tracking-[0.16em] text-slate-500">Quy trình thí nghiệm</p>
                    <div className="grid gap-2 sm:grid-cols-4">
                      <button
                        type="button"
                        onClick={() => {
                          setCircuitPartsPlaced(true);
                          play("click");
                        }}
                        className={`rounded-xl border px-2 py-1.5 text-[10px] font-medium transition-colors ${
                          circuitPartsPlaced
                            ? "border-sky-400/40 bg-sky-500/20 text-sky-200"
                            : "border-white/10 bg-slate-800/70 text-slate-400 hover:bg-slate-700/80"
                        }`}
                      >
                        B1 Đặt linh kiện
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCircuitPartsPlaced(true);
                          setCircuitWiresConnected(true);
                          play("switch");
                        }}
                        className={`rounded-xl border px-2 py-1.5 text-[10px] font-medium transition-colors ${
                          circuitWiresConnected
                            ? "border-sky-400/40 bg-sky-500/20 text-sky-200"
                            : "border-white/10 bg-slate-800/70 text-slate-400 hover:bg-slate-700/80"
                        }`}
                      >
                        B2 Nối dây
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCircuitPartsPlaced(true);
                          setCircuitWiresConnected(true);
                          setCircuitSwitchClosed((closed) => !closed);
                          play("switch");
                        }}
                        className={`rounded-xl border px-2 py-1.5 text-[10px] font-medium transition-colors ${
                          circuitSwitchClosed
                            ? "border-emerald-400/40 bg-emerald-500/20 text-emerald-200"
                            : "border-white/10 bg-slate-800/70 text-slate-400 hover:bg-slate-700/80"
                        }`}
                      >
                        B3 {circuitSwitchClosed ? "Mở công tắc" : "Đóng công tắc"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCircuitPartsPlaced(false);
                          setCircuitWiresConnected(false);
                          setCircuitSwitchClosed(false);
                          play("click");
                        }}
                        className="rounded-xl border border-white/10 bg-slate-800/70 px-2 py-1.5 text-[10px] font-medium text-slate-400 transition-colors hover:bg-slate-700/80"
                      >
                        Đặt lại 3D
                      </button>
                    </div>
                  </div>
                )}
                <div className="space-y-1">
                  {overlayInfo.values.length > 0 ? (
                    overlayInfo.values.map((value) => (
                      <p key={value} className="text-sm font-medium text-slate-100">{value}</p>
                    ))
                  ) : (
                    <p className="text-sm text-slate-300">Kéo chuột để xoay cảnh, giữ trái chuột để kéo phần tử.</p>
                  )}
                </div>
                {variant === "motorThermal" && (
                  <div className="mt-3 rounded-2xl border border-white/10 bg-slate-900/70 p-2">
                    <div className="mb-1 flex items-center justify-between text-[10px] text-slate-400">
                      <span>Điện áp nguồn</span>
                      <span className="font-mono text-sky-300">{motorVoltage.toFixed(1)}V</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="9"
                      step="0.5"
                      value={motorVoltage}
                      onChange={(event) => setMotorVoltage(Number(event.target.value))}
                      onMouseUp={() => play(motorExperiment === "thermal" ? "buzz" : "switch")}
                      onTouchEnd={() => play(motorExperiment === "thermal" ? "buzz" : "switch")}
                      className="w-full accent-sky-400"
                      aria-label="Chỉnh điện áp nguồn mô hình 3D"
                    />
                    <div className="mt-1 flex justify-between text-[9px] text-slate-500">
                      <span>1V</span>
                      <span>9V</span>
                    </div>
                  </div>
                )}
                {variant === "meters" && (
                  <div className="mt-3 space-y-3 rounded-2xl border border-white/10 bg-slate-900/70 p-2">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setMeterCircuit("single");
                          play("switch");
                        }}
                        className={`rounded-xl border px-2 py-1.5 text-[10px] font-medium transition-colors ${
                          meterCircuit === "single"
                            ? "border-sky-400/40 bg-sky-500/20 text-sky-200"
                            : "border-white/10 bg-slate-800/70 text-slate-400 hover:bg-slate-700/80"
                        }`}
                      >
                        Mạch 1 bóng
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setMeterCircuit("series");
                          play("switch");
                        }}
                        className={`rounded-xl border px-2 py-1.5 text-[10px] font-medium transition-colors ${
                          meterCircuit === "series"
                            ? "border-sky-400/40 bg-sky-500/20 text-sky-200"
                            : "border-white/10 bg-slate-800/70 text-slate-400 hover:bg-slate-700/80"
                        }`}
                      >
                        2 bóng nối tiếp
                      </button>
                    </div>
                    <div>
                      <div className="mb-1 flex items-center justify-between text-[10px] text-slate-400">
                        <span>Điện áp nguồn</span>
                        <span className="font-mono text-sky-300">{meterVoltage.toFixed(1)}V</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="9"
                        step="0.1"
                        value={meterVoltage}
                        onChange={(event) => setMeterVoltage(Number(event.target.value))}
                        onMouseUp={() => play("switch")}
                        onTouchEnd={() => play("switch")}
                        className="w-full accent-sky-400"
                        aria-label="Chỉnh điện áp nguồn mô hình đo lường 3D"
                      />
                      <div className="mt-1 flex justify-between text-[9px] text-slate-500">
                        <span>1V</span>
                        <span>9V</span>
                      </div>
                    </div>
                  </div>
                )}
                {overlayInfo.hint && (
                  <p className="mt-3 text-[10px] leading-4 text-slate-400">{overlayInfo.hint}</p>
                )}
              </>
            ) : (
              <p className="text-[10px] text-slate-400">Thông số đang thu nhỏ.</p>
            )}
          </div>
      )}
    </div>
  );
}