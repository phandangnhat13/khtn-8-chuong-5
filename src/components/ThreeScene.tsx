import { useEffect, useRef } from "react";
import * as THREE from "three";

export function ThreeScene() {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#0f172a");

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 1.8, 3.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mountRef.current.appendChild(renderer.domElement);

    const ambientLight = new THREE.HemisphereLight(0xffffff, 0x111827, 0.75);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 8, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 20;
    scene.add(directionalLight);

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(10, 10),
      new THREE.MeshStandardMaterial({ color: "#111827", roughness: 0.8, metalness: 0.1 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.75;
    floor.receiveShadow = true;
    scene.add(floor);

    const group = new THREE.Group();
    scene.add(group);

    const battery = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 0.45, 0.4),
      new THREE.MeshStandardMaterial({ color: "#fb923c", metalness: 0.4, roughness: 0.3 })
    );
    battery.position.set(-1.2, 0, 0);
    battery.castShadow = true;
    group.add(battery);

    const positive = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.25, 0.15),
      new THREE.MeshStandardMaterial({ color: "#fbbf24", emissive: "#fde68a", emissiveIntensity: 0.3 })
    );
    positive.position.set(-1.65, 0.1, 0);
    positive.castShadow = true;
    group.add(positive);

    const bulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.35, 32, 32),
      new THREE.MeshStandardMaterial({ color: "#facc15", emissive: "#f59e0b", emissiveIntensity: 0.7, roughness: 0.2 })
    );
    bulb.position.set(1.2, 0, 0);
    bulb.castShadow = true;
    group.add(bulb);

    const bulbBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16, 0.16, 0.2, 24),
      new THREE.MeshStandardMaterial({ color: "#4b5563", metalness: 0.6, roughness: 0.4 })
    );
    bulbBase.position.set(1.2, -0.35, 0);
    bulbBase.castShadow = true;
    group.add(bulbBase);

    const wireGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-0.75, 0, 0),
      new THREE.Vector3(-0.15, 0.2, 0),
      new THREE.Vector3(0.15, 0.2, 0),
      new THREE.Vector3(0.75, 0, 0),
    ]);
    const wire = new THREE.Line(
      wireGeom,
      new THREE.LineBasicMaterial({ color: "#60a5fa", linewidth: 2 })
    );
    wire.position.y = 0.05;
    group.add(wire);

    const arcGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-0.9, -0.15, 0),
      new THREE.Vector3(-0.95, -0.1, 0),
      new THREE.Vector3(-0.9, -0.05, 0),
      new THREE.Vector3(-1.0, 0.05, 0),
      new THREE.Vector3(-0.85, 0.15, 0),
    ]);
    const arc = new THREE.Line(
      arcGeom,
      new THREE.LineBasicMaterial({ color: "#fbbf24" })
    );
    group.add(arc);

    const handleResize = () => {
      if (!mountRef.current) return;
      const newWidth = mountRef.current.clientWidth;
      const newHeight = mountRef.current.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    const mountElement = mountRef.current;
    if (mountElement) {
      window.addEventListener("resize", handleResize);
    }

    const clock = new THREE.Clock();
    const animate = () => {
      const delta = clock.getDelta();
      group.rotation.y += delta * 0.4;
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener("resize", handleResize);
      if (mountElement) {
        mountElement.removeChild(renderer.domElement);
      }
      renderer.dispose();
      scene.clear();
    };
  }, []);

  return <div ref={mountRef} className="w-full h-[320px] rounded-3xl overflow-hidden bg-slate-950" />;
}
