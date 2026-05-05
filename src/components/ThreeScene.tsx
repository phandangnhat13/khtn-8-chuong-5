import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import type { LessonMediaVariant } from "@/types/lessonMedia";

type ThreeSceneProps = {
  variant?: LessonMediaVariant;
};

/**
 * Interactive 3D lesson visuals: OrbitControls + curve-based wiring (Catmull–Rom),
 * tube geometry (sweeping a circle along the curve), emissive materials,
 * and animated spheres sampling arc-length on the curve (particle visualization).
 */
export function ThreeScene({ variant = "circuit" }: ThreeSceneProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [overlayInfo, setOverlayInfo] = useState({ title: "", values: [] as string[], hint: "" });
  const lastOverlayRef = useRef("");

  const updateOverlayInfo = (info: { title: string; values: string[]; hint: string }) => {
    const key = `${info.title}|${info.values.join("|")}|${info.hint}`;
    if (lastOverlayRef.current !== key) {
      lastOverlayRef.current = key;
      setOverlayInfo(info);
    }
  };

  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#020617");

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.08, 120);
    camera.position.set(2.2, 1.55, 3.4);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    mountRef.current.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.minDistance = 1.6;
    controls.maxDistance = 9;
    controls.target.set(0, 0.25, 0);

    const ambient = new THREE.HemisphereLight(0xffffff, 0x0f172a, 0.55);
    scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.15);
    keyLight.position.set(4.5, 8.5, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.bias = -0.0002;
    scene.add(keyLight);

    const rim = new THREE.DirectionalLight(0x38bdf8, 0.35);
    rim.position.set(-4, 3, -3);
    scene.add(rim);

    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(5.5, 56),
      new THREE.MeshStandardMaterial({ color: "#0f172a", roughness: 0.92, metalness: 0.08 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.82;
    floor.receiveShadow = true;
    scene.add(floor);

    const disposeList: Array<{ dispose?: () => void }> = [];

    const root = new THREE.Group();
    scene.add(root);

    const electronMat = new THREE.MeshStandardMaterial({
      color: "#fbbf24",
      emissive: "#f59e0b",
      emissiveIntensity: 1.1,
      roughness: 0.35,
      metalness: 0.2,
    });

    function wireTube(curve: THREE.CatmullRomCurve3, color: number, radius = 0.055, tubular = 96) {
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
      root.add(mesh);
      disposeList.push(geo, mat);
      return mesh;
    }

    let sharedElectronGeom: THREE.SphereGeometry | null = null;
    function addElectrons(curve: THREE.CatmullRomCurve3, count: number, flowSpeed: number) {
      if (!sharedElectronGeom) {
        sharedElectronGeom = new THREE.SphereGeometry(0.065, 18, 18);
        disposeList.push(sharedElectronGeom, electronMat);
      }
      const meshes: THREE.Mesh[] = [];
      for (let i = 0; i < count; i++) {
        const m = new THREE.Mesh(sharedElectronGeom, electronMat);
        m.castShadow = true;
        root.add(m);
        meshes.push(m);
        (m.userData as { phase: number }).phase = i / Math.max(count, 1);
      }
      return { meshes, curve, speed: flowSpeed };
    }

    const animElectrons: Array<{ meshes: THREE.Mesh[]; curve: THREE.CatmullRomCurve3; speed: number }> = [];
    const motorToruses: THREE.Mesh[] = [];
    const circuitWireMeshes: THREE.Mesh[] = [];
    const electrostaticChips: THREE.Mesh[] = [];

    /** Mặt bàn y ≈ -0.58 → Plane(n=(0,1,0), constant=0.58) */
    const dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0.58);

    let circuitOn = true;
    let rubCharge = 0;
    let motorBoost = 1;
    let gaugeFlipA = false;
    let gaugeFlipV = false;

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
    let compassNeedle: THREE.Mesh | null = null;
    let bulbMeter: THREE.Mesh | null = null;
    let needleGaugeA: THREE.Mesh | null = null;
    let needleGaugeV: THREE.Mesh | null = null;
    const baseNeedleZ = { A: -0.65, V: 0.45 };

    // --- Variant scenes -------------------------------------------------
    if (variant === "circuit") {
      const bat = new THREE.Mesh(
        new THREE.BoxGeometry(0.95, 0.48, 0.42),
        new THREE.MeshStandardMaterial({ color: "#ea580c", metalness: 0.45, roughness: 0.35 }),
      );
      bat.position.set(-1.35, -0.35, 0);
      bat.castShadow = true;
      bat.userData.pickRole = "battery";
      batCircuit = bat;
      root.add(bat);

      const plus = new THREE.Mesh(
        new THREE.BoxGeometry(0.14, 0.26, 0.15),
        new THREE.MeshStandardMaterial({ color: "#fbbf24", emissive: "#fde047", emissiveIntensity: 0.35 }),
      );
      plus.position.set(-1.78, -0.28, 0);
      root.add(plus);

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
      root.add(bulbGlass);

      const bulbBase = new THREE.Mesh(
        new THREE.CylinderGeometry(0.17, 0.18, 0.22, 24),
        new THREE.MeshStandardMaterial({ color: "#64748b", metalness: 0.55, roughness: 0.38 }),
      );
      bulbBase.position.set(1.35, -0.58, 0);
      bulbBase.castShadow = true;
      bulbBaseCircuit = bulbBase;
      root.add(bulbBase);

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
      circuitWireMeshes.push(wireTube(curveMain, 0x38bdf8, 0.052));
      animElectrons.push(addElectrons(curveMain, 5, 1));

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
      circuitWireMeshes.push(wireTube(curveReturn, 0xfbbf24, 0.045));
      animElectrons.push(addElectrons(curveReturn, 4, -0.85));
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
      for (let i = 0; i < 5; i++) {
        const torus = new THREE.Mesh(
          new THREE.TorusGeometry(0.46 - i * 0.07, 0.045, 12, 36),
          new THREE.MeshStandardMaterial({
            color: "#3b82f6",
            emissive: "#1d4ed8",
            emissiveIntensity: 0.25 + i * 0.05,
            metalness: 0.4,
            roughness: 0.35,
          }),
        );
        torus.rotation.x = Math.PI / 2;
        torus.position.set(-0.5, -0.15, 0);
        torus.castShadow = true;
        if (i === 0) torus.userData.pickRole = "coilBoost";
        motorToruses.push(torus);
        root.add(torus);
      }

      const compass = new THREE.Mesh(
        new THREE.CylinderGeometry(0.55, 0.55, 0.08, 40),
        new THREE.MeshStandardMaterial({ color: "#1e293b", metalness: 0.5, roughness: 0.45 }),
      );
      compass.position.set(1.15, -0.78, 0);
      compass.receiveShadow = true;
      root.add(compass);

      const needle = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, 0.02, 0.55),
        new THREE.MeshStandardMaterial({ color: "#ef4444", emissive: "#b91c1c", emissiveIntensity: 0.25 }),
      );
      needle.position.set(1.15, -0.72, 0);
      needle.userData.pickRole = "needle";
      compassNeedle = needle;
      root.add(needle);

      const fieldLoop = new THREE.CatmullRomCurve3(
        [
          new THREE.Vector3(-0.5, 0.55, 0),
          new THREE.Vector3(0.25, 0.95, 0.45),
          new THREE.Vector3(1.0, 0.55, 0),
          new THREE.Vector3(0.25, 0.15, -0.45),
          new THREE.Vector3(-0.5, 0.55, 0),
        ],
        true,
        "catmullrom",
        0.6,
      );
      wireTube(fieldLoop, 0x38bdf8, 0.028, 128);
      animElectrons.push(addElectrons(fieldLoop, 8, 0.55));
    } else {
      // meters
      const bat = new THREE.Mesh(
        new THREE.BoxGeometry(0.75, 0.42, 0.38),
        new THREE.MeshStandardMaterial({ color: "#475569", metalness: 0.5, roughness: 0.35 }),
      );
      bat.position.set(-1.5, -0.35, 0);
      bat.castShadow = true;
      root.add(bat);

      const bulb = new THREE.Mesh(
        new THREE.SphereGeometry(0.28, 28, 28),
        new THREE.MeshStandardMaterial({ color: "#fbbf24", emissive: "#f59e0b", emissiveIntensity: 0.9 }),
      );
      bulb.position.set(0.15, -0.15, 0);
      bulb.castShadow = true;
      bulb.userData.pickRole = "bulbMeter";
      bulbMeter = bulb;
      root.add(bulb);

      const makeGauge = (x: number, needleAngle: number, gaugeId: "A" | "V") => {
        const body = new THREE.Mesh(
          new THREE.CylinderGeometry(0.42, 0.42, 0.12, 36),
          new THREE.MeshStandardMaterial({ color: "#0f172a", metalness: 0.55, roughness: 0.35 }),
        );
        body.position.set(x, -0.78, 0.85);
        body.rotation.x = Math.PI / 2;
        body.userData.pickRole = "gaugeFace";
        body.userData.gaugeId = gaugeId;
        root.add(body);
        const needle = new THREE.Mesh(
          new THREE.BoxGeometry(0.04, 0.02, 0.32),
          new THREE.MeshStandardMaterial({ color: "#ef4444", emissive: "#b91c1c", emissiveIntensity: 0.35 }),
        );
        needle.position.set(x, -0.72, 0.85);
        needle.rotation.x = Math.PI / 2;
        needle.rotation.z = needleAngle;
        root.add(needle);
        if (gaugeId === "A") needleGaugeA = needle;
        else needleGaugeV = needle;
      };

      makeGauge(-0.85, baseNeedleZ.A, "A");
      makeGauge(1.45, baseNeedleZ.V, "V");

      const seriesPath = new THREE.CatmullRomCurve3(
        [
          new THREE.Vector3(-1.15, -0.35, 0),
          new THREE.Vector3(-0.55, -0.35, 0),
          new THREE.Vector3(-0.2, -0.35, 0),
          new THREE.Vector3(0.15, -0.35, 0),
        ],
        false,
      );
      wireTube(seriesPath, 0x38bdf8, 0.04);
      animElectrons.push(addElectrons(seriesPath, 4, 1));

      const parallelPath = new THREE.CatmullRomCurve3(
        [
          new THREE.Vector3(0.15, -0.15, 0),
          new THREE.Vector3(0.45, 0.15, 0.55),
          new THREE.Vector3(1.25, 0.15, 0.55),
        ],
        false,
      );
      wireTube(parallelPath, 0x22c55e, 0.032);
      animElectrons.push(addElectrons(parallelPath, 3, 0.9));
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
      if (e.button !== 0 && e.button !== 2) return;
      setNdc(e);
      raycaster.setFromCamera(pointerNdc, camera);
      const hits = raycaster.intersectObjects(root.children, true);
      const hit = hits[0];
      if (!hit) return;

      const role = findPickRole(hit.object);
      const mode: DragMode = e.button === 2 || e.shiftKey ? "rotate" : "translate";

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

      if (variant === "meters" && role === "gaugeFace") {
        const id = hit.object.userData.gaugeId as "A" | "V" | undefined;
        if (id === "A") gaugeFlipA = !gaugeFlipA;
        if (id === "V") gaugeFlipV = !gaugeFlipV;
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      if (variant === "motorThermal" && role === "coilBoost") {
        motorBoost = Math.min(3.2, motorBoost + 0.35);
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
        circuitOn = !circuitOn;
      }
      dragState = null;
      controls.enabled = true;
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
      const dt = Math.min(clock.getDelta(), 0.1);
      const t = clock.getElapsedTime();

      let flowMul = 1;

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
        } else {
          rubCharge = Math.max(0, rubCharge - dt * 0.12);
        }

        const mat = rulerMesh.material as THREE.MeshStandardMaterial;
        mat.emissive = new THREE.Color("#1e40af");
        mat.emissiveIntensity = 0.08 + rubCharge * 0.85;
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
        flowMul = circuitOn ? 1 : 0.04;
        circuitWireMeshes.forEach((mesh) => {
          const mat = mesh.material as THREE.MeshStandardMaterial;
          mat.emissiveIntensity = circuitOn ? 0.22 : 0.05;
        });
        if (bulbGlassCircuit) {
          const m = bulbGlassCircuit.material as THREE.MeshPhysicalMaterial;
          m.emissiveIntensity = circuitOn ? 0.85 : 0.06;
        }
        if (batCircuit) {
          const m = batCircuit.material as THREE.MeshStandardMaterial;
          m.color.setHex(circuitOn ? 0xea580c : 0x7c2d12);
        }
      } else if (variant === "motorThermal") {
        motorBoost += (1 - motorBoost) * dt * 0.2;
        flowMul = 0.4 + motorBoost * 0.5;
        motorToruses.forEach((torus, i) => {
          torus.rotation.z = t * 0.35 * motorBoost;
          const mat = torus.material as THREE.MeshStandardMaterial;
          mat.emissiveIntensity = (0.25 + i * 0.05) * Math.min(motorBoost, 2.2);
        });
      } else if (variant === "meters") {
        if (needleGaugeA) {
          needleGaugeA.rotation.z = baseNeedleZ.A + (gaugeFlipA ? 0.6 : 0);
        }
        if (needleGaugeV) {
          needleGaugeV.rotation.z = baseNeedleZ.V + (gaugeFlipV ? -0.55 : 0);
        }
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
        updateOverlayInfo({
          title: "Mạch điện",
          values: [
            `Nguồn: ${circuitOn ? "Bật" : "Tắt"}`,
            `Điện áp mô phỏng: ${voltage.toFixed(1)} V`,
          ],
          hint: "Kéo pin hoặc bóng đèn để thay đổi bố cục, nhấp pin để bật/tắt nguồn.",
        });
      } else if (variant === "motorThermal") {
        const power = Math.round(motorBoost * 100);
        updateOverlayInfo({
          title: "Tác dụng dòng điện",
          values: [
            `Cường độ tương đối: ${power}%`,
            `Tốc độ quay: ${Math.round(motorBoost * 50)}%`,
          ],
          hint: "Nhấp cuộn dây để tăng công suất, kéo kim la bàn để đổi hướng từ trường.",
        });
      } else if (variant === "meters") {
        const ammeterValue = gaugeFlipA ? 0.24 : 0.85;
        const voltmeterValue = gaugeFlipV ? 0.90 : 3.00;
        updateOverlayInfo({
          title: "Đo lường",
          values: [
            `Ampe kế: ${ammeterValue.toFixed(2)} A`,
            `Vôn kế: ${voltmeterValue.toFixed(1)} V`,
          ],
          hint: "Nhấp mặt đồng hồ để đổi chiều kim, kéo bóng đèn để thay đổi bố cục mạch.",
        });
      }

      animElectrons.forEach((bundle) => {
        const { meshes, curve, speed } = bundle;
        meshes.forEach((m) => {
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
      disposeList.forEach((d) => ("dispose" in d && typeof d.dispose === "function" ? d.dispose() : undefined));
      renderer.dispose();
      if (mountElement?.contains(renderer.domElement)) {
        mountElement.removeChild(renderer.domElement);
      }
      scene.clear();
    };
  }, [variant]);

  return (
    <div className="relative">
      <div
        ref={mountRef}
        className="w-full h-[min(420px,55vh)] min-h-[320px] rounded-3xl overflow-hidden bg-slate-950 cursor-grab active:cursor-grabbing"
        role="img"
        aria-label="Mô hình 3D — xoay camera, kéo / nhấp các vật trong lab"
      />
      <div className="pointer-events-none absolute inset-0 p-4">
        <div className="max-w-sm rounded-3xl border border-white/10 bg-slate-950/80 backdrop-blur-md p-3 text-xs text-slate-100 shadow-lg shadow-slate-950/40">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[11px] uppercase tracking-[0.2em] text-slate-400">{overlayInfo.title || "Mô phỏng 3D"}</span>
            <span className="rounded-full bg-slate-800/90 px-2 py-0.5 text-[10px] text-slate-300">Tương tác</span>
          </div>
          <div className="space-y-1">
            {overlayInfo.values.length > 0 ? (
              overlayInfo.values.map((value) => (
                <p key={value} className="text-sm font-medium text-slate-100">{value}</p>
              ))
            ) : (
              <p className="text-sm text-slate-300">Kéo chuột để xoay cảnh, giữ trái chuột để kéo phần tử.</p>
            )}
          </div>
          {overlayInfo.hint && (
            <p className="mt-3 text-[10px] leading-4 text-slate-400">{overlayInfo.hint}</p>
          )}
        </div>
      </div>
    </div>
  );
}