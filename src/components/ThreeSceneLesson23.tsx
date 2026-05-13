import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

import {
    ChevronRight,
    Box,
    Cylinder,
    Circle,
} from "lucide-react";
import { createObject } from "./ObjectFactory";
import { SpawnType } from "./Types";


const getInternalConnections = (
    obj: THREE.Object3D
) => {
    // Voltmeters should NOT internally short
    if (
        obj.userData.componentType ===
        "voltmeter"
    ) {
        return [];
    }

    const terminals =
        obj.userData.terminals;

    if (
        !terminals ||
        terminals.length < 2
    ) {
        return [];
    }
    // =====================================
    // BATTERIES DO NOT INTERNALLY CONNECT
    // =====================================

    if (
        obj.userData.componentType ===
        "battery"
    ) {
        return [];
    }
    // Switch special case
    if (
        obj.userData.arm &&
        !obj.userData.isClosed
    ) {
        return [];
    }

    return [
        [terminals[0], terminals[1]],
        [terminals[1], terminals[0]],
    ];
};

export function ThreeSceneLesson23() {
    const orbitTargetRef = useRef(
        new THREE.Vector3(0, 0, 0)
    );

    const cameraDistanceRef = useRef(26);

    const sphericalRef = useRef({
        theta: 0,
        phi: 1.1,
    });

    const cameraControlRef = useRef({
        rotating: false,
        panning: false,
        lastX: 0,
        lastY: 0,
    });
    const mountRef =
        useRef<HTMLDivElement>(null);

    const sceneRef =
        useRef<THREE.Scene | null>(null);

    const cameraRef =
        useRef<THREE.PerspectiveCamera | null>(
            null
        );

    const rendererRef =
        useRef<THREE.WebGLRenderer | null>(
            null
        );

    const groundRef =
        useRef<THREE.Mesh | null>(null);

    const raycasterRef = useRef(
        new THREE.Raycaster()
    );

    const mouseRef = useRef(
        new THREE.Vector2()
    );

    const draggableObjectsRef = useRef<
        THREE.Object3D[]
    >([]);

    const draggedObjectRef =
        useRef<THREE.Object3D | null>(null);

    const dragOffsetRef = useRef(
        new THREE.Vector3()
    );

    const pointerDownPosRef =
        useRef({
            x: 0,
            y: 0,
        });

    // ============================================
    // TERMINAL INTERACTION
    // ============================================

    // All terminals in scene
    const terminalObjectsRef =
        useRef<THREE.Object3D[]>([]);

    // Currently selected terminal
    const selectedTerminalRef =
        useRef<THREE.Object3D | null>(
            null
        );

    // All wires
    const activeTerminalsRef =
        useRef<
            Set<THREE.Object3D>
        >(new Set());
    const wiresRef =
        useRef<any[]>([]);

    const [menuOpen, setMenuOpen] =
        useState(true);

    const spawnObject = (
        type: SpawnType
    ) => {

        const scene =
            sceneRef.current;

        if (!scene) return;

        const object =
            createObject(type);

        object.position.set(
            (Math.random() - 0.5) * 10,
            0,
            (Math.random() - 0.5) * 10
        );

        scene.add(object);

        draggableObjectsRef.current.push(
            object
        );

        // ============================================
        // REGISTER TERMINALS
        // ============================================
        object.traverse((child) => {

            if (
                child.userData.isTerminal
            ) {

                terminalObjectsRef.current.push(
                    child
                );
            }
        });
    };

    const createWire = (
        startTerminal: THREE.Object3D,
        endTerminal: THREE.Object3D
    ) => {

        const scene =
            sceneRef.current;

        if (!scene) return;

        const start =
            new THREE.Vector3();

        const end =
            new THREE.Vector3();

        startTerminal.getWorldPosition(
            start
        );

        endTerminal.getWorldPosition(
            end
        );

        const points = [
            start,
            end,
        ];

        const geometry =
            new THREE.BufferGeometry()
                .setFromPoints(points);

        const material =
            new THREE.LineBasicMaterial({
                color: "#111111",
            });

        const line =
            new THREE.Line(
                geometry,
                material
            );

        scene.add(line);

        // =====================================
        // CURRENT PARTICLE
        // =====================================

        const particle =
            new THREE.Mesh(
                new THREE.SphereGeometry(
                    0.08,
                    12,
                    12
                ),
                new THREE.MeshStandardMaterial({
                    color: "#facc15",
                    emissive: "#facc15",
                    emissiveIntensity: 2,
                })
            );

        particle.visible = false;

        scene.add(particle);

        wiresRef.current.push({
            from: startTerminal,
            to: endTerminal,
            line,
            geometry,
            particle,
            progress: Math.random(),
        });
    };

    const handleTerminalClick = (
        terminal: THREE.Object3D
    ) => {

        // First click
        if (
            !selectedTerminalRef.current
        ) {

            selectedTerminalRef.current =
                terminal;

            // Highlight selected
            const material =
                terminal.material as THREE.MeshStandardMaterial;

            material.emissive.set(
                "#ffff00"
            );

            return;
        }

        // Same terminal clicked
        if (
            selectedTerminalRef.current ===
            terminal
        ) {
            return;
        }

        // Create wire
        createWire(
            selectedTerminalRef.current,
            terminal
        );

        // Remove highlight
        const previousMaterial =
            selectedTerminalRef.current
                .material as THREE.MeshStandardMaterial;

        previousMaterial.emissive.set(
            "#000000"
        );

        selectedTerminalRef.current =
            null;
    };

    const updateWires = () => {

        wiresRef.current.forEach(
            (wire) => {

                const start =
                    new THREE.Vector3();

                const end =
                    new THREE.Vector3();

                wire.from.getWorldPosition(
                    start
                );

                wire.to.getWorldPosition(
                    end
                );

                // =====================================
                // UPDATE WIRE LINE
                // =====================================

                wire.geometry.setFromPoints([
                    start,
                    end,
                ]);

                // =====================================
                // CURRENT FLOW ANIMATION
                // =====================================

                const powered =
                    isWirePowered(wire);

                wire.particle.visible =
                    powered;

                if (!powered) return;

                // Animate progress
                wire.progress += 0.01;

                if (wire.progress > 1) {
                    wire.progress = 0;
                }

                // Interpolate position
                const position =
                    new THREE.Vector3().lerpVectors(
                        start,
                        end,
                        wire.progress
                    );

                wire.particle.position.copy(
                    position
                );
            }
        );
    };

    const getConnectedTerminalsDeep = (
        terminal: THREE.Object3D
    ) => {

        const connected: THREE.Object3D[] =
            [];

        // =====================================
        // WIRE CONNECTIONS
        // =====================================

        wiresRef.current.forEach(
            (wire) => {

                if (
                    wire.from === terminal
                ) {
                    connected.push(
                        wire.to
                    );
                }

                if (
                    wire.to === terminal
                ) {
                    connected.push(
                        wire.from
                    );
                }
            }
        );

        // =====================================
        // INTERNAL COMPONENT FLOW
        // =====================================

        const owner =
            terminal.userData.owner;

        if (owner) {

            const internals =
                getInternalConnections(
                    owner
                );

            internals.forEach(
                ([a, b]: any) => {

                    if (a === terminal) {
                        connected.push(b);
                    }
                }
            );
        }

        return connected;
    };

    const canReachNegativeTerminal = (
        currentTerminal: THREE.Object3D,
        targetTerminal: THREE.Object3D,
        visited = new Set<THREE.Object3D>(),
        usedExternalWire = false
    ): boolean => {

        // Already visited
        if (
            visited.has(currentTerminal)
        ) {
            return false;
        }

        visited.add(currentTerminal);

        // =====================================
        // SUCCESS
        // =====================================

        if (
            currentTerminal === targetTerminal
        ) {

            // Must include at least one wire
            if (!usedExternalWire) {
                return false;
            }

            return true;
        }
        // =====================================
        // NEIGHBORS
        // =====================================

        const neighbors =
            getConnectedTerminalsDeep(
                currentTerminal
            );

        for (const next of neighbors) {

            const owner =
                next.userData.owner;

            // Open switch blocks current
            if (
                owner?.userData.arm &&
                !owner.userData.isClosed
            ) {
                continue;
            }

            // =====================================
            // DETECT WIRE TRAVERSAL
            // =====================================

            let nextUsedExternalWire =
                usedExternalWire;

            const isWireConnection =
                wiresRef.current.some(
                    (wire) =>
                        (
                            wire.from === currentTerminal &&
                            wire.to === next
                        ) ||
                        (
                            wire.to === currentTerminal &&
                            wire.from === next
                        )
                );

            if (isWireConnection) {
                nextUsedExternalWire =
                    true;
            }

            // =====================================
            // DFS
            // =====================================

            if (
                canReachNegativeTerminal(
                    next,
                    targetTerminal,
                    visited,
                    nextUsedExternalWire
                )
            ) {
                return true;
            }
        }

        return false;
    };

    const checkCircuit = () => {
        activeTerminalsRef.current.clear();
        draggableObjectsRef.current.forEach(
            (obj) => {

                obj.userData.isPowered =
                    false;
            }
        );

        const objects =
            draggableObjectsRef.current;

        objects.forEach((obj) => {

            // =====================================
            // Find batteries
            // =====================================

            // ONLY batteries can power circuits
            if (
                obj.userData.componentType !==
                "battery"
            ) {
                return;
            }
            const terminals =
                obj.userData.terminals;

            if (!terminals) return;

            const positive =
                terminals.find(
                    (t: any) =>
                        t.userData
                            .terminalId ===
                        "positive"
                );

            const negative =
                terminals.find(
                    (t: any) =>
                        t.userData
                            .terminalId ===
                        "negative"
                );

            if (
                positive &&
                negative
            ) {

                const visited =
                    new Set<THREE.Object3D>();

                const closed =
                    canReachNegativeTerminal(
                        positive,
                        negative,
                        visited
                    );

                if (closed) {

                    visited.forEach((terminal) => {

                        activeTerminalsRef.current.add(
                            terminal
                        );

                        const owner =
                            terminal.userData.owner;

                        if (owner) {
                            owner.userData.isPowered =
                                true;
                        }
                    });
                }

                obj.userData.isPowered =
                    closed;

                console.log(
                    "Circuit closed:",
                    closed
                );

            }
        });
    };
    const getActiveComponents = () => {

        const active =
            new Set<THREE.Object3D>();

        activeTerminalsRef.current.forEach(
            (terminal) => {

                const owner =
                    terminal.userData.owner;

                if (owner) {
                    active.add(owner);
                }
            }
        );

        return Array.from(active);
    };
    const solveCircuit = () => {


        const active =
            getActiveComponents();

        // Reset
        active.forEach((obj) => {

            obj.userData.current = 0;
            obj.userData.power = 0;
        });


        // =====================================
        // Find battery
        // =====================================

        const battery =
            active.find(
                (o) =>
                    o.userData.voltage
            );

        if (
            !battery ||
            !battery.userData.isPowered
        ) {
            return;
        }

        // =====================================
        // Total Resistance
        // =====================================

        let totalResistance = 0;

        active.forEach((obj) => {

            totalResistance +=
                obj.userData.resistance || 0;
        });

        if (
            totalResistance <= 0
        ) {
            return;
        }

        // =====================================
        // Ohm's Law
        // =====================================

        const voltage =
            battery.userData.voltage;

        const current =
            voltage /
            totalResistance;


        // =====================================
        // Apply To Components
        // =====================================


        active.forEach((obj) => {
            // Not powered
            if (
                !obj.userData.isPowered &&
                obj.userData.componentType !== "battery"
            ) {

                obj.userData.current = 0;
                obj.userData.power = 0;
                obj.userData.voltageDrop = 0;

                return;
            }

            const resistance =
                obj.userData.resistance || 0;

            const power =
                current *
                current *
                resistance;

            obj.userData.current =
                current;
            obj.userData.power =
                power;

            // =====================================
            // ELECTROMAGNET STATE
            // =====================================

            if (
                obj.userData.componentType ===
                "coil"
            ) {

                const powered =
                    obj.userData.isPowered &&
                    current > 0;

                const strength =
                    powered
                        ? current * 18
                        : 0;

                obj.userData.magneticStrength =
                    strength;

                // =====================================
                // CURRENT DIRECTION
                // =====================================

                const terminals =
                    obj.userData.terminals;

                const input =
                    terminals?.[0];

                const output =
                    terminals?.[1];

                if (
                    input &&
                    output
                ) {

                    const inputPos =
                        new THREE.Vector3();

                    const outputPos =
                        new THREE.Vector3();

                    input.getWorldPosition(
                        inputPos
                    );

                    output.getWorldPosition(
                        outputPos
                    );

                    // Direction current flows
                    const magneticDirection =
                        new THREE.Vector3()
                            .subVectors(
                                outputPos,
                                inputPos
                            )
                            .normalize();
                }
            }
            // =====================================
            // VOLTAGE DROP
            // =====================================

            obj.userData.voltageDrop =
                current *
                resistance;
        });
    };

    const updateVisualEffects = () => {


        for (const obj of draggableObjectsRef.current) {

            // =====================================
            // RESISTOR HEATING
            // =====================================

            if (
                obj.userData.componentType ===
                "thermometer"
            ) {

                const mercury =
                    obj.userData.mercury;

                if (!mercury) {
                    continue;
                }

                const thermometerPos =
                    new THREE.Vector3();

                obj.getWorldPosition(
                    thermometerPos
                );

                let hottestTemp = 20;

                // =====================================
                // CHECK ALL RESISTORS
                // =====================================

                for (const other of draggableObjectsRef.current) {

                    if (
                        other.userData.componentType !==
                        "resistor"
                    ) {
                        continue;
                    }

                    // Only powered resistors heat up
                    if (
                        !other.userData.isPowered
                    ) {
                        continue;
                    }

                    const resistorPos =
                        new THREE.Vector3();

                    other.getWorldPosition(
                        resistorPos
                    );

                    const distance =
                        thermometerPos.distanceTo(
                            resistorPos
                        );

                    // =====================================
                    // HEAT RANGE
                    // =====================================

                    const maxRange = 8;

                    if (
                        distance > maxRange
                    ) {
                        continue;
                    }

                    // =====================================
                    // HEAT INTENSITY
                    // =====================================

                    const power =
                        other.userData.power || 0;

                    const heat =
                        power *
                        (
                            1 -
                            distance / maxRange
                        ) * 120;

                    hottestTemp =
                        Math.max(
                            hottestTemp,
                            20 + heat
                        );
                }

                // =====================================
                // SMOOTH TEMPERATURE
                // =====================================

                obj.userData.temperature +=
                    (
                        hottestTemp -
                        obj.userData.temperature
                    ) * 0.02;

                const temp =
                    obj.userData.temperature;

                // =====================================
                // MERCURY HEIGHT
                // =====================================

                const normalized =
                    Math.min(
                        Math.max(
                            (temp - 20) / 100,
                            0
                        ),
                        1
                    );

                // =====================================
                // MERCURY LENGTH
                // =====================================

                const length =
                    1 + normalized * 3.5;

                // Scale horizontally only
                mercury.scale.x = length;

                // =====================================
                // KEEP LEFT SIDE ANCHORED
                // =====================================

                // Original position = -0.55
                // Move half of added length

                mercury.position.x =
                    -0.55 +
                    ((length - 1) * 1.4) / 2;

                // =====================================
                // COLOR SHIFT
                // =====================================

                const material =
                    mercury.material as THREE.MeshStandardMaterial;

                material.emissive.set(
                    normalized > 0.6
                        ? "#ff2200"
                        : "#550000"
                );

                material.emissiveIntensity =
                    normalized * 2;
            }

            // =====================================
            // LIGHTBULB
            // =====================================

            if (
                obj.userData.componentType ===
                "lightbulb"
            ) {

                const glow =
                    obj.userData.glowMesh;
                const hotCore =
                    obj.userData.hotCore;

                if (!glow) continue;

                const power =
                    obj.userData.power || 0;

                // Scale brightness
                const intensity =
                    Math.min(
                        power * 40,
                        10
                    );

                const material =
                    glow.material as THREE.MeshStandardMaterial;

                // Emissive glow
                material.emissive.set(
                    "#ffd966"
                );

                material.emissiveIntensity =
                    intensity;

                // Transparency
                material.transparent =
                    true;

                material.opacity =
                    0.08 +
                    intensity * 0.08;
                // =====================================
                // HOT CORE
                // =====================================

                if (hotCore) {

                    const hotMaterial =
                        hotCore.material as THREE.MeshBasicMaterial;

                    hotMaterial.opacity =
                        Math.min(
                            power * 1.4,
                            1
                        );

                    hotCore.scale.setScalar(
                        1 +
                        power * 0.25
                    );
                }
                const filament =
                    obj.userData.filament;

                if (filament) {

                    const filamentMat =
                        filament.material as THREE.MeshStandardMaterial;

                    filamentMat.emissive.set(
                        "#ffcc66"
                    );

                    filamentMat.emissiveIntensity =
                        intensity * 2;
                }
            }
            // =====================================
            // ELECTROMAGNETIC COIL
            // =====================================

            if (
                obj.userData.componentType ===
                "coil"
            ) {

                const powered =
                    obj.userData.isPowered;

                const current =
                    obj.userData.current || 0;

                // =====================================
                // MAGNETIC STRENGTH
                // =====================================

                const magneticStrength =
                    powered
                        ? current * 25
                        : 0;

                obj.userData.magneticStrength =
                    magneticStrength;

                console.log(
                    "COIL DEBUG",
                    {
                        powered,
                        current,
                        magneticStrength,
                    }
                );

                // =====================================
                // COIL WRAP GLOW
                // =====================================

                const wraps =
                    obj.userData.wraps || [];

                wraps.forEach((wrap: THREE.Mesh) => {

                    const material =
                        wrap.material as THREE.MeshStandardMaterial;

                    if (!powered) {

                        material.emissive.set(
                            "#000000"
                        );

                        material.emissiveIntensity = 0;

                        return;
                    }

                    material.emissive.set(
                        "#ff8800"
                    );

                    material.emissiveIntensity =
                        1.5 +
                        Math.sin(
                            performance.now() * 0.01
                        ) * 0.4;
                });

                // =====================================
                // FIELD GLOW
                // =====================================

                const glow =
                    obj.userData.fieldGlow;

                if (!glow) {
                    continue;
                }

                glow.visible =
                    magneticStrength > 0;

                const glowMaterial =
                    glow.material as THREE.MeshBasicMaterial;

                glowMaterial.opacity =
                    Math.min(
                        magneticStrength * 0.02,
                        0.2
                    );

                const pulse =
                    1 +
                    Math.sin(
                        performance.now() * 0.003
                    ) * 0.08;

                glow.scale.setScalar(pulse);

                glow.rotation.y += 0.003;
            }
            // =====================================
            // COMPASS MAGNETIC RESPONSE
            // =====================================

            if (
                obj.userData.componentType ===
                "compass"
            ) {

                const needle =
                    obj.userData.needle;

                if (!needle) {
                    continue;
                }

                const compassPos =
                    new THREE.Vector3();

                obj.getWorldPosition(
                    compassPos
                );

                let targetAngle = 0;

                let strongestField = 0;

                // =====================================
                // FIND STRONGEST COIL
                // =====================================

                for (const other of draggableObjectsRef.current) {

                    if (
                        other.userData.componentType !==
                        "coil"
                    ) {
                        continue;
                    }

                    const strength =
                        other.userData
                            .magneticStrength || 0;

                    if (strength <= 0) {
                        continue;
                    }

                    const coilPos =
                        new THREE.Vector3();

                    other.getWorldPosition(
                        coilPos
                    );

                    const dx =
                        coilPos.x -
                        compassPos.x;

                    const dz =
                        coilPos.z -
                        compassPos.z;

                    const distance =
                        Math.sqrt(
                            dx * dx +
                            dz * dz
                        );

                    // Ignore far away coils
                    if (distance > 10) {
                        continue;
                    }

                    // Field falloff
                    const field =
                        strength /
                        (distance * distance);

                    if (
                        field >
                        strongestField
                    ) {

                        strongestField =
                            field;

                        targetAngle =
                            Math.atan2(
                                dz,
                                dx
                            );
                    }
                }

                // =====================================
                // SMOOTH ROTATION
                // =====================================

                const delta =
                    Math.atan2(
                        Math.sin(
                            targetAngle -
                            needle.rotation.y
                        ),
                        Math.cos(
                            targetAngle -
                            needle.rotation.y
                        )
                    );

                needle.rotation.y +=
                    delta * 0.08;
            }
        }
        ;

    };
    const updateMeterDisplays = () => {

        draggableObjectsRef.current.forEach(
            (obj) => {

                const type =
                    obj.userData.componentType;

                if (
                    type !== "ammeter" &&
                    type !== "voltmeter"
                ) {
                    return;
                }

                const canvas =
                    obj.userData.displayCanvas;

                const ctx =
                    obj.userData.displayContext;

                const texture =
                    obj.userData.displayTexture;

                if (
                    !canvas ||
                    !ctx ||
                    !texture
                ) {
                    return;
                }

                // =====================================
                // CLEAR DISPLAY
                // =====================================

                ctx.fillStyle = "#081018";

                ctx.fillRect(
                    0,
                    0,
                    canvas.width,
                    canvas.height
                );

                // =====================================
                // VALUE
                // =====================================

                let value = 0;
                let unit = "";

                if (type === "ammeter") {

                    value =
                        obj.userData.current || 0;

                    unit = "A";
                }

                if (type === "voltmeter") {

                    value =
                        obj.userData.voltageDrop || 0;

                    unit = "V";
                }

                // =====================================
                // GLOW BACKGROUND
                // =====================================

                ctx.fillStyle =
                    "rgba(0,255,120,0.15)";

                ctx.fillRect(
                    0,
                    0,
                    canvas.width,
                    canvas.height
                );

                // =====================================
                // MAIN TEXT
                // =====================================

                ctx.fillStyle = "#00ff88";

                ctx.font =
                    "bold 80px monospace";

                ctx.textAlign = "center";

                ctx.textBaseline = "middle";

                ctx.fillText(
                    `${value.toFixed(2)} ${unit}`,
                    canvas.width / 2,
                    canvas.height / 2
                );

                // =====================================
                // UPDATE TEXTURE
                // =====================================

                texture.needsUpdate =
                    true;
            }
        );
    };
    const isWirePowered = (
        wire: any
    ) => {

        return (
            activeTerminalsRef.current.has(
                wire.from
            ) &&
            activeTerminalsRef.current.has(
                wire.to
            )
        );
    };

    // ============================================
    // Scene Setup
    // ============================================
    useEffect(() => {
        const mount = mountRef.current;

        if (!mount) return;

        // -------------------------
        // Scene
        // -------------------------
        const scene = new THREE.Scene();

        scene.background =
            new THREE.Color("#cbd5e1");

        scene.fog = new THREE.Fog(
            "#cbd5e1",
            25,
            70
        );

        sceneRef.current = scene;

        // -------------------------
        // Camera
        // -------------------------
        const camera =
            new THREE.PerspectiveCamera(
                45,
                mount.clientWidth /
                mount.clientHeight,
                0.1,
                1000
            );

        cameraRef.current = camera;

        // Initial orbit values
        sphericalRef.current.theta = 0;
        sphericalRef.current.phi = 1.1;

        const updateCamera = () => {

            const {
                theta,
                phi,
            } = sphericalRef.current;

            const distance =
                cameraDistanceRef.current;

            const target =
                orbitTargetRef.current;

            const x =
                target.x +
                distance *
                Math.sin(phi) *
                Math.sin(theta);

            const y =
                target.y +
                distance *
                Math.cos(phi);

            const z =
                target.z +
                distance *
                Math.sin(phi) *
                Math.cos(theta);

            camera.position.set(x, y, z);

            camera.lookAt(target);
        };

        updateCamera();

        // -------------------------
        // Renderer
        // -------------------------
        const renderer =
            new THREE.WebGLRenderer({
                antialias: true,
            });

        renderer.setPixelRatio(
            Math.min(
                window.devicePixelRatio,
                2
            )
        );

        renderer.setSize(
            mount.clientWidth,
            mount.clientHeight
        );

        renderer.shadowMap.enabled = true;

        renderer.outputColorSpace =
            THREE.SRGBColorSpace;

        renderer.toneMapping =
            THREE.ACESFilmicToneMapping;

        renderer.toneMappingExposure = 1.25;

        mount.appendChild(
            renderer.domElement
        );

        rendererRef.current = renderer;

        // -------------------------
        // Lights
        // -------------------------
        const ambient =
            new THREE.AmbientLight(
                "#ffffff",
                2.5
            );

        scene.add(ambient);

        const hemi =
            new THREE.HemisphereLight(
                "#ffffff",
                "#94a3b8",
                2
            );

        scene.add(hemi);

        const dirLight =
            new THREE.DirectionalLight(
                "#ffffff",
                2.4
            );

        dirLight.position.set(
            10,
            20,
            10
        );

        dirLight.castShadow = true;

        dirLight.shadow.mapSize.width =
            2048;

        dirLight.shadow.mapSize.height =
            2048;

        scene.add(dirLight);

        // -------------------------
        // Ground
        // -------------------------
        const ground = new THREE.Mesh(
            new THREE.PlaneGeometry(
                60,
                60
            ),
            new THREE.MeshStandardMaterial({
                color: "#63666b",
                roughness: 0.95,
                metalness: 0.02,
            })
        );

        ground.rotation.x = -Math.PI / 2;

        ground.receiveShadow = true;

        scene.add(ground);

        groundRef.current = ground;

        // Grid
        const grid =
            new THREE.GridHelper(
                60,
                60,
                "#6b7280",
                "#9ca3af"
            );

        grid.position.y = 0.01;

        scene.add(grid);

        // -------------------------
        // Mouse Helpers
        // -------------------------
        const updateMousePosition = (
            event: PointerEvent
        ) => {
            const rect =
                renderer.domElement.getBoundingClientRect();

            mouseRef.current.x =
                ((event.clientX - rect.left) /
                    rect.width) *
                2 -
                1;

            mouseRef.current.y =
                -(
                    (event.clientY -
                        rect.top) /
                    rect.height
                ) *
                2 +
                1;
        };
        // -------------------------
        // Camera Controls
        // -------------------------
        const handleContextMenu = (
            event: MouseEvent
        ) => {
            event.preventDefault();
        };

        const handleWheel = (
            event: WheelEvent
        ) => {

            event.preventDefault();

            cameraDistanceRef.current +=
                event.deltaY * 0.02;

            cameraDistanceRef.current =
                Math.max(
                    5,
                    Math.min(
                        80,
                        cameraDistanceRef.current
                    )
                );
        };

        const panCamera = (
            deltaX: number,
            deltaY: number
        ) => {

            const cameraDirection =
                new THREE.Vector3();

            camera.getWorldDirection(
                cameraDirection
            );

            const right =
                new THREE.Vector3()
                    .crossVectors(
                        cameraDirection,
                        camera.up
                    )
                    .normalize();

            const forward =
                new THREE.Vector3()
                    .crossVectors(
                        right,
                        camera.up
                    )
                    .normalize();

            const speed =
                cameraDistanceRef.current *
                0.002;

            orbitTargetRef.current.add(
                right.multiplyScalar(
                    -deltaX * speed
                )
            );

            orbitTargetRef.current.add(
                forward.multiplyScalar(
                    -deltaY * speed
                )
            );
        };

        // -------------------------
        // Drag Start
        // -------------------------
        const handlePointerDown = (
            event: PointerEvent
        ) => {

            pointerDownPosRef.current = {
                x: event.clientX,
                y: event.clientY,
            };

            cameraControlRef.current.lastX =
                event.clientX;

            cameraControlRef.current.lastY =
                event.clientY;

            updateMousePosition(event);

            raycasterRef.current.setFromCamera(
                mouseRef.current,
                camera
            );

            // ============================================
            // TERMINAL INTERSECTION
            // ============================================

            const terminalHits =
                raycasterRef.current.intersectObjects(
                    terminalObjectsRef.current,
                    false
                );

            if (terminalHits.length > 0) {

                handleTerminalClick(
                    terminalHits[0].object
                );

                return;
            }

            // ============================================
            // OBJECT INTERSECTION
            // ============================================

            const intersects =
                raycasterRef.current.intersectObjects(
                    draggableObjectsRef.current,
                    true
                );

            // ============================================
            // DRAG OBJECT
            // ============================================

            if (intersects.length > 0) {

                // Right click should pan camera
                if (event.button === 2) {

                    cameraControlRef.current.panning =
                        true;

                    return;
                }

                let object =
                    intersects[0].object;

                while (
                    object.parent &&
                    !draggableObjectsRef.current.includes(
                        object
                    )
                ) {
                    object = object.parent;
                }

                draggedObjectRef.current =
                    object;

                const groundHit =
                    raycasterRef.current.intersectObject(
                        ground
                    );

                if (groundHit.length > 0) {

                    dragOffsetRef.current.copy(
                        object.position
                    );

                    dragOffsetRef.current.sub(
                        groundHit[0].point
                    );
                }

                renderer.domElement.style.cursor =
                    "grabbing";

                return;
            }

            // ============================================
            // CAMERA CONTROLS
            // ============================================

            // Rotate only if NOT dragging object
            if (event.button === 0) {

                cameraControlRef.current.rotating =
                    true;
            }

            // Pan
            if (event.button === 2) {

                cameraControlRef.current.panning =
                    true;
            }
        };

        // -------------------------
        // Drag Move
        // -------------------------
        const handlePointerMove = (
            event: PointerEvent
        ) => {

            const controls =
                cameraControlRef.current;

            const deltaX =
                event.clientX -
                controls.lastX;

            const deltaY =
                event.clientY -
                controls.lastY;

            controls.lastX =
                event.clientX;

            controls.lastY =
                event.clientY;

            // =====================================
            // CAMERA ROTATE
            // =====================================

            if (controls.rotating) {

                sphericalRef.current.theta -=
                    deltaX * 0.008;

                sphericalRef.current.phi -=
                    deltaY * 0.008;

                sphericalRef.current.phi =
                    Math.max(
                        0.15,
                        Math.min(
                            Math.PI - 0.15,
                            sphericalRef.current.phi
                        )
                    );
            }

            // =====================================
            // CAMERA PAN
            // =====================================

            if (controls.panning) {

                panCamera(
                    deltaX,
                    deltaY
                );
            }

            // =====================================
            // OBJECT DRAG
            // =====================================

            if (
                !draggedObjectRef.current
            ) {
                return;
            }

            updateMousePosition(event);

            raycasterRef.current.setFromCamera(
                mouseRef.current,
                camera
            );

            const groundHit =
                raycasterRef.current.intersectObject(
                    ground
                );

            if (groundHit.length > 0) {

                const point =
                    groundHit[0].point;

                draggedObjectRef.current.position.x =
                    point.x +
                    dragOffsetRef.current.x;

                draggedObjectRef.current.position.z =
                    point.z +
                    dragOffsetRef.current.z;
            }
        };

        // -------------------------
        // Drag End
        // -------------------------
        const handlePointerUp = (
            event: PointerEvent
        ) => {

            // =====================================
            // Detect click vs drag
            // =====================================
            const dx =
                event.clientX -
                pointerDownPosRef.current.x;

            const dy =
                event.clientY -
                pointerDownPosRef.current.y;

            const moved =
                Math.sqrt(dx * dx + dy * dy);

            // =====================================
            // Toggle switch if clicked
            // =====================================
            if (
                moved < 6 &&
                draggedObjectRef.current
            ) {

                const obj =
                    draggedObjectRef.current;

                // Check if object is switch
                if (
                    obj.userData.arm
                ) {

                    const arm =
                        obj.userData.arm;

                    const isClosed =
                        obj.userData.isClosed;

                    if (isClosed) {

                        // OPEN
                        arm.rotation.z =
                            -0.45;

                    } else {

                        // CLOSED
                        arm.rotation.z = 0;
                    }

                    obj.userData.isClosed =
                        !isClosed;
                }
            }

            cameraControlRef.current.rotating =
                false;

            cameraControlRef.current.panning =
                false;

            draggedObjectRef.current =
                null;

            renderer.domElement.style.cursor =
                "default";
        };

        renderer.domElement.addEventListener(

            "pointerdown",
            handlePointerDown
        );
        renderer.domElement.addEventListener(
            "contextmenu",
            handleContextMenu
        );

        renderer.domElement.addEventListener(
            "wheel",
            handleWheel,
            { passive: false }
        );

        window.addEventListener(
            "pointermove",
            handlePointerMove
        );

        window.addEventListener(
            "pointerup",
            handlePointerUp
        );

        // -------------------------
        // Resize
        // -------------------------
        const handleResize = () => {
            const width =
                mount.clientWidth;

            const height =
                mount.clientHeight;

            camera.aspect =
                width / height;

            camera.updateProjectionMatrix();

            renderer.setSize(
                width,
                height
            );
        };

        window.addEventListener(
            "resize",
            handleResize
        );

        // -------------------------
        // Animation
        // -------------------------
        let frameId = 0;

        const animate = () => {
            frameId =
                requestAnimationFrame(
                    animate
                );

            checkCircuit();

            solveCircuit();

            updateVisualEffects();

            updateMeterDisplays();

            updateWires();

            updateCamera();

            renderer.render(
                scene,
                camera
            );
        };

        animate();

        // -------------------------
        // Cleanup
        // -------------------------
        return () => {
            cancelAnimationFrame(frameId);

            window.removeEventListener(
                "resize",
                handleResize
            );

            window.removeEventListener(
                "pointermove",
                handlePointerMove
            );

            window.removeEventListener(
                "pointerup",
                handlePointerUp
            );

            renderer.domElement.removeEventListener(
                "pointerdown",
                handlePointerDown
            );

            renderer.dispose();

            scene.traverse((obj) => {
                if (obj instanceof THREE.Mesh) {
                    obj.geometry.dispose();

                    if (
                        Array.isArray(
                            obj.material
                        )
                    ) {
                        obj.material.forEach(
                            (m) => m.dispose()
                        );
                    } else {
                        obj.material.dispose();
                    }
                }
            });

            if (
                mount &&
                renderer.domElement
                    .parentNode === mount
            ) {
                mount.removeChild(
                    renderer.domElement
                );
            }
        };
    }, []);

    return (
        <div className="relative w-full h-[520px] rounded-2xl overflow-hidden border border-white/10 bg-slate-300">
            {/* THREE SCENE */}
            <div
                ref={mountRef}
                className="absolute inset-0"
            />

            {/* SIDE MENU */}
            <div
                className={`absolute top-0 left-0 h-full transition-all duration-300 z-20 ${menuOpen
                    ? "w-64"
                    : "w-12"
                    }`}
            >
                <div className="h-full bg-white/90 backdrop-blur-md border-r border-slate-300 shadow-xl flex">
                    {/* CONTENT */}
                    <div
                        className={`flex-1 transition-opacity duration-200 overflow-y-auto overflow-x-hidden ${menuOpen
                            ? "opacity-100"
                            : "opacity-0 pointer-events-none"
                            }`}
                    >
                        <div className="p-4 pb-24">
                            <h2 className="text-lg font-black text-slate-700 mb-4">
                                3D Objects
                            </h2>

                            <div className="space-y-3">
                                {/* LIGHTBULB */}
                                <button
                                    onClick={() => spawnObject("lightbulb")}
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 transition-all"
                                >
                                    <div className="w-5 h-5 rounded-full bg-yellow-400 shadow-md shrink-0" />

                                    <span className="font-medium text-slate-700">
                                        Lightbulb
                                    </span>
                                </button>

                                {/* VOLTMETER */}
                                <button
                                    onClick={() => spawnObject("voltmeter")}
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 transition-all"
                                >
                                    <div className="w-5 h-5 rounded border-2 border-blue-500 flex items-center justify-center text-[10px] font-black text-blue-500">
                                        V
                                    </div>

                                    <span className="font-medium text-slate-700">
                                        Vôn kế
                                    </span>
                                </button>

                                {/* AMMETER */}
                                <button
                                    onClick={() => spawnObject("ammeter")}
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 transition-all"
                                >
                                    <div className="w-5 h-5 rounded border-2 border-emerald-500 flex items-center justify-center text-[10px] font-black text-emerald-500">
                                        A
                                    </div>

                                    <span className="font-medium text-slate-700">
                                        Ampe kế
                                    </span>
                                </button>

                                {/* 1.5V BATTERY */}
                                <button
                                    onClick={() => spawnObject("battery15")}
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 transition-all"
                                >
                                    <div className="w-3 h-5 rounded bg-gradient-to-b from-blue-500 to-red-500" />

                                    <span className="font-medium text-slate-700">
                                        1.5V Battery
                                    </span>
                                </button>

                                {/* 3V BATTERY */}
                                <button
                                    onClick={() => spawnObject("battery3")}
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 transition-all"
                                >
                                    <div className="flex gap-[2px]">
                                        <div className="w-2 h-5 rounded bg-gradient-to-b from-blue-500 to-red-500" />
                                        <div className="w-2 h-5 rounded bg-gradient-to-b from-blue-500 to-red-500" />
                                    </div>

                                    <span className="font-medium text-slate-700">
                                        3V Battery
                                    </span>
                                </button>

                                {/* COMPASS */}
                                <button
                                    onClick={() => spawnObject("compass")}
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 transition-all"
                                >
                                    <div className="w-5 h-5 rounded-full border-2 border-rose-500 relative">
                                        <div className="absolute left-1/2 top-[2px] w-[2px] h-3 bg-rose-500 -translate-x-1/2" />
                                    </div>

                                    <span className="font-medium text-slate-700">
                                        Compass
                                    </span>
                                </button>

                                {/* SWITCH */}
                                <button
                                    onClick={() => spawnObject("switch")}
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 transition-all"
                                >
                                    <div className="w-5 h-5 flex items-center">
                                        <div className="w-full h-[2px] bg-slate-700 rotate-[-25deg]" />
                                    </div>

                                    <span className="font-medium text-slate-700">
                                        Switch
                                    </span>
                                </button>

                                {/* ELECTROMAGNETIC COIL */}
                                <button
                                    onClick={() => spawnObject("coil")}
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 transition-all"
                                >
                                    <div className="flex gap-[2px]">
                                        <div className="w-1 h-5 rounded bg-orange-500" />
                                        <div className="w-1 h-5 rounded bg-orange-500" />
                                        <div className="w-1 h-5 rounded bg-orange-500" />
                                        <div className="w-1 h-5 rounded bg-orange-500" />
                                    </div>

                                    <span className="font-medium text-slate-700">
                                        Electromagnetic Coil
                                    </span>
                                </button>

                                {/* RESISTOR */}
                                <button
                                    onClick={() => spawnObject("resistor")}
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 transition-all"
                                >
                                    <div className="flex items-center gap-[2px]">
                                        <div className="w-2 h-[2px] bg-slate-700" />
                                        <div className="w-4 h-3 bg-amber-500 rounded-sm" />
                                        <div className="w-2 h-[2px] bg-slate-700" />
                                    </div>

                                    <span className="font-medium text-slate-700">
                                        Resistor
                                    </span>
                                </button>

                                {/* THERMOMETER */}
                                <button
                                    onClick={() => spawnObject("thermometer")}
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 transition-all"
                                >
                                    <div className="relative w-3 h-5 flex items-end justify-center">
                                        <div className="absolute bottom-0 w-3 h-3 rounded-full bg-red-500" />
                                        <div className="w-[4px] h-5 rounded-full bg-red-400" />
                                    </div>

                                    <span className="font-medium text-slate-700">
                                        Thermometer
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* TOGGLE BUTTON */}
                    <button
                        onClick={() =>
                            setMenuOpen(
                                !menuOpen
                            )
                        }
                        className="w-12 flex items-center justify-center border-l border-slate-300 bg-white hover:bg-slate-100 transition-all"
                    >
                        <ChevronRight
                            className={`w-5 h-5 text-slate-700 transition-transform duration-300 ${menuOpen
                                ? "rotate-180"
                                : ""
                                }`}
                        />
                    </button>
                </div>
            </div>
        </div>
    );
}