import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

interface Scrap {
    mesh: THREE.Mesh;
    velocity: THREE.Vector3;
    attached: boolean;
    attachPoint: THREE.Vector3;
}

export function ThreeSceneLesson20() {
    const mountRef = useRef<HTMLDivElement | null>(null);
    const [chargeLevel, setChargeLevel] = useState(0);

    useEffect(() => {
        const tableSurfaceY = 0.35;
        const loader = new GLTFLoader();

        if (!mountRef.current) return;

        const width = mountRef.current.clientWidth;
        const height = mountRef.current.clientHeight;

        // Scene
        const scene = new THREE.Scene();
        scene.background = new THREE.Color("#0a0f1a");

        // Camera
        const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
        camera.position.set(0, 4, 7);
        camera.lookAt(0, 0, 0);

        // Renderer
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(width, height);
        renderer.shadowMap.enabled = true;
        mountRef.current.appendChild(renderer.domElement);

        // Lights
        const light = new THREE.DirectionalLight(0xffffff, 1);
        light.position.set(5, 10, 5);
        light.castShadow = true;
        scene.add(light);

        scene.add(new THREE.AmbientLight(0xffffff, 0.4));



        // Folded towel model
        let cloth: THREE.Object3D | null = null;

        let hitboxMesh: THREE.Mesh | null = null;

        loader.load(
            "/models/folded_towel.glb", // path inside public folder
            (gltf) => {

                console.log("GLB LOADED", gltf);

                cloth = gltf.scene;

                cloth.position.set(-1, -0, 4);

                // Scale depending on your model size
                cloth.scale.set(0.005, 0.005, 0.005);

                // Enable shadows
                cloth.traverse((child) => {
                    if ((child as THREE.Mesh).isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });

                scene.add(cloth);
            },
            undefined,
            (error) => {
                console.error("Error loading towel model:", error);
            }
        );
        // Ruler model
        let ruler: THREE.Object3D | null = null;

        const rulerMat = new THREE.MeshStandardMaterial({
            emissiveIntensity: 0
        });
        const rulerLength = 0.16;
        const rulerWidth = 0.03;
        const rulerHeight = 0.001;

        loader.load(
            "/models/ruler.glb",
            (gltf) => {

                console.log("RULER LOADED", gltf);

                ruler = gltf.scene;


                ruler.position.set(2, 0.3, 0);

                // Adjust scale for your model
                ruler.scale.set(20, 20, 20);

                ruler.rotation.y = Math.PI;

                ruler.traverse((child) => {

                    if ((child as THREE.Mesh).isMesh) {

                        const mesh = child as THREE.Mesh;

                        mesh.castShadow = true;
                        mesh.receiveShadow = true;

                        const material = mesh.material as THREE.MeshStandardMaterial;

                        material.emissive = new THREE.Color("#1d4ed8");
                        material.emissiveIntensity = charge / 100;
                    }
                });

                scene.add(ruler);
                // DEBUG HITBOX VISUALIZER
                const hitboxGeometry = new THREE.BoxGeometry(
                    rulerLength,
                    rulerHeight,
                    rulerWidth
                );

                const hitboxMaterial = new THREE.MeshBasicMaterial({
                    color: 0xff0000,
                    wireframe: true
                });

                hitboxMesh = new THREE.Mesh(
                    hitboxGeometry,
                    hitboxMaterial
                );
                hitboxMesh.visible = false;

                // Match ruler transform
                hitboxMesh.position.copy(ruler.position);
                hitboxMesh.rotation.copy(ruler.rotation);

                scene.add(hitboxMesh);
            },
            undefined,
            (error) => {
                console.error("Error loading ruler model:", error);
            }
        );

        // Paper scraps
        const scraps: Scrap[] = [];
        for (let i = 0; i < 15; i++) {
            const mesh = new THREE.Mesh(
                new THREE.BoxGeometry(0.1, 0.02, 0.1),
                new THREE.MeshStandardMaterial({ color: "#f8fafc" })
            );

            mesh.position.set(
                Math.random() * 4 - 2,
                0.1,
                Math.random() * 2 - 1
            );

            scene.add(mesh);

            scraps.push({
                mesh,
                velocity: new THREE.Vector3(),
                attached: false,
                attachPoint: new THREE.Vector3()
            });
        }

        // Interaction
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();

        let dragging = false;
        let charge = 0;
        let lastX = 0;

        const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

        const getMouseWorld = (event: MouseEvent) => {
            const rect = renderer.domElement.getBoundingClientRect();
            mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

            raycaster.setFromCamera(mouse, camera);
            const point = new THREE.Vector3();
            raycaster.ray.intersectPlane(plane, point);
            return point;
        };

        renderer.domElement.addEventListener("mousedown", (e) => {
            const p = getMouseWorld(e);
            if (ruler && p.distanceTo(ruler.position) < 1.5) {
                dragging = true;
                lastX = p.x;
            }
        });

        renderer.domElement.addEventListener("mouseup", () => {
            dragging = false;
        });

        renderer.domElement.addEventListener("mousemove", (e) => {
            if (!dragging) return;

            const p = getMouseWorld(e);
            if (ruler) {
                ruler.position.x = p.x;
                ruler.position.z = p.z;
            }

            // rubbing detection (cloth zone)
            if (p.x < -1 && p.x > -3 && Math.abs(p.z) < 1) {
                const dx = Math.abs(p.x - lastX);
                if (dx > 0.02) {
                    charge = Math.min(charge + dx * 8, 100);
                }
            }

            lastX = p.x;
        });

        // Animation loop
        const clock = new THREE.Clock();

        const getClosestPointOnRuler = (point: THREE.Vector3) => {

            if (!ruler) return new THREE.Vector3();

            // Convert world point to ruler local space
            const localPoint = ruler.worldToLocal(point.clone());

            // Correct GLB pivot offset
            localPoint.x += 0.009;

            // Long axis of ruler
            localPoint.x = THREE.MathUtils.clamp(
                localPoint.x,
                -rulerLength / 2,
                rulerLength / 2
            );

            // Width axis
            localPoint.z = THREE.MathUtils.clamp(
                localPoint.z,
                -rulerWidth / 2,
                rulerWidth / 2
            );

            // Put scraps slightly ABOVE ruler surface
            localPoint.y = rulerHeight;

            // Convert back to world space
            return ruler.localToWorld(localPoint);
        };

        const animate = () => {
            const dt = clock.getDelta();

            charge = Math.max(charge - 5 * dt, 0);
            setChargeLevel(charge);
            // glow intensity
            rulerMat.emissiveIntensity = charge / 100;

            // Animate hitbox with ruler
            if (ruler && hitboxMesh) {

                hitboxMesh.position.copy(ruler.position);

                hitboxMesh.rotation.copy(ruler.rotation);

                hitboxMesh.scale.copy(ruler.scale);
            }
            scraps.forEach((s) => {
                const pos = s.mesh.position;

                if (charge > 70 && !s.attached) {
                    if (!ruler) return;

                    const targetPoint = getClosestPointOnRuler(pos);

                    const dir = new THREE.Vector3()
                        .subVectors(targetPoint, pos);

                    const dist = dir.length();
                    if (dist < 3) {
                        dir.normalize();

                        const normalizedCharge = Math.max(charge - 60, 0) / 40;
                        const attractionStrength = normalizedCharge * 2.5;

                        s.velocity.add(
                            dir.multiplyScalar(attractionStrength * dt)
                        );

                        if (dist < 0.2 && charge > 75) {
                            s.mesh.rotation.set(
                                Math.random() * 0.5,
                                Math.random() * Math.PI,
                                Math.random() * 0.5
                            );

                            s.attached = true;

                            s.attachPoint.copy(
                                ruler.worldToLocal(targetPoint.clone())
                            );
                        }
                    }
                }

                if (s.attached && ruler) {

                    // Convert saved local attachment point
                    // back into world space
                    const worldAttachPoint = ruler.localToWorld(
                        s.attachPoint.clone()
                    );

                    pos.lerp(worldAttachPoint, 0.2);


                } else {
                    // gravity
                    s.velocity.y -= 0.8 * dt;
                    pos.add(s.velocity);

                    if (pos.y < tableSurfaceY) {
                        pos.y = tableSurfaceY;
                        s.velocity.y = 0;
                    }

                    s.velocity.multiplyScalar(0.95);
                }
            });

            renderer.render(scene, camera);
            requestAnimationFrame(animate);
        };

        animate();

        // Resize
        const handleResize = () => {
            const w = mountRef.current!.clientWidth;
            const h = mountRef.current!.clientHeight;
            renderer.setSize(w, h);
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
        };

        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
            mountRef.current?.removeChild(renderer.domElement);
            renderer.dispose();
            scene.clear();
        };
    }, []);

    return (
        <div className="relative w-full h-[400px]">

            {/* Charge UI */}
            <div className="absolute top-4 left-4 z-10 bg-black/60 px-4 py-3 rounded-xl border border-blue-500 text-white w-56">

                <div className="flex justify-between text-sm mb-2">
                    <span>Static Charge</span>
                    <span>{Math.round(chargeLevel)}%</span>
                </div>

                <div className="w-full h-3 bg-slate-700 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-blue-500"
                        style={{
                            width: `${chargeLevel}%`
                        }}
                    />
                </div>

                <div className="text-xs text-slate-300 mt-2">
                    Rub the ruler on the cloth
                </div>
            </div>

            {/* Three.js Canvas */}
            <div
                ref={mountRef}
                className="w-full h-full rounded-xl overflow-hidden"
            />
        </div>
    );
}