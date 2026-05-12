import * as THREE from "three";
import { SpawnType } from "./Types";



function createTerminal(
    owner: THREE.Object3D,
    id: string,
    color: string,
    position: THREE.Vector3
) {

    const terminal =
        new THREE.Mesh(
            new THREE.CylinderGeometry(
                0.12,
                0.12,
                0.18,
                24
            ),
            new THREE.MeshStandardMaterial({
                color,
                metalness: 1,
                roughness: 0.2,
            })
        );

    terminal.position.copy(
        position
    );

    terminal.userData = {
        isTerminal: true,
        terminalId: id,
        owner,
    };

    owner.add(terminal);

    return terminal;
}

export function createObject(
    type: SpawnType
): THREE.Object3D {

    let object: THREE.Object3D;

    // =================================================
    // LIGHTBULB MODEL
    // =================================================
    if (type === "lightbulb") {


        const bulbGroup = new THREE.Group();
        bulbGroup.userData.terminals =
            [];
        bulbGroup.userData.resistance =
            10;

        bulbGroup.userData.maxPower =
            5;

        bulbGroup.userData.current =
            0;

        bulbGroup.userData.power =
            0;
        bulbGroup.userData.isLit = false;
        bulbGroup.userData.componentType =
            "lightbulb";
        // -------------------------
        // Glass Bulb
        // -------------------------
        const glass = new THREE.Mesh(
            new THREE.SphereGeometry(
                0.72,
                24,
                24
            ),
            new THREE.MeshPhysicalMaterial({
                color: "#fff8cc",
                transparent: true,
                opacity: 0.55,
                roughness: 0.05,
                transmission: 1,
                thickness: 0.4,
                metalness: 0,
            })
        );

        glass.position.y = 1.3;

        glass.castShadow = true;

        bulbGroup.add(glass);

        // -------------------------
        // Inner Glow
        // -------------------------
        const glow = new THREE.Mesh(
            new THREE.SphereGeometry(
                0.55,
                16,
                16
            ),
            new THREE.MeshStandardMaterial({
                color: "#fff5b8",

                emissive: "#ffcc33",

                emissiveIntensity: 0,

                transparent: true,

                opacity: 0.15,

                toneMapped: false,
            })

        );
        bulbGroup.userData.glowMesh =
            glow;

        glow.position.y = 1.3;

        bulbGroup.add(glow);
        // -------------------------
        // Bright Hot Core
        // -------------------------

        const hotCore = new THREE.Mesh(
            new THREE.SphereGeometry(
                0.22,
                16,
                16
            ),
            new THREE.MeshBasicMaterial({
                color: "#fff7cc",
                transparent: true,
                opacity: 0,
                toneMapped: false,
            })
        );

        hotCore.position.y = 1.3;

        bulbGroup.add(hotCore);

        // Save reference
        bulbGroup.userData.hotCore =
            hotCore;

        // -------------------------
        // Filament Supports
        // -------------------------
        const supportMaterial =
            new THREE.MeshStandardMaterial({
                color: "#888888",
                metalness: 1,
                roughness: 0.3,
            });

        const leftSupport =
            new THREE.Mesh(
                new THREE.CylinderGeometry(
                    0.03,
                    0.03,
                    0.5,
                    8
                ),
                supportMaterial
            );

        leftSupport.position.set(
            -0.15,
            0.95,
            0
        );

        bulbGroup.add(leftSupport);

        const rightSupport =
            new THREE.Mesh(
                new THREE.CylinderGeometry(
                    0.03,
                    0.03,
                    0.5,
                    8
                ),
                supportMaterial
            );

        rightSupport.position.set(
            0.15,
            0.95,
            0
        );

        bulbGroup.add(rightSupport);

        // -------------------------
        // Filament
        // -------------------------
        const filament =
            new THREE.Mesh(
                new THREE.TorusGeometry(
                    0.12,
                    0.02,
                    8,
                    24
                ),
                new THREE.MeshStandardMaterial({
                    color: "#ffb703",
                    emissive: "#000000",
                    emissiveIntensity: 0,
                    toneMapped: false,
                })

            );

        filament.rotation.x =
            Math.PI / 2;

        filament.position.y = 1.05;

        bulbGroup.add(filament);
        bulbGroup.userData.filament =
            filament;

        // -------------------------
        // Metal Base
        // -------------------------
        const base =
            new THREE.Mesh(
                new THREE.CylinderGeometry(
                    0.35,
                    0.4,
                    0.55,
                    24
                ),
                new THREE.MeshStandardMaterial({
                    color: "#9ca3af",
                    metalness: 1,
                    roughness: 0.25,
                })
            );

        base.position.y = 0.35;

        base.castShadow = true;

        bulbGroup.add(base);

        // -------------------------
        // Screw Ridges
        // -------------------------
        for (let i = 0; i < 4; i++) {
            const ring =
                new THREE.Mesh(
                    new THREE.TorusGeometry(
                        0.37,
                        0.015,
                        8,
                        32
                    ),
                    new THREE.MeshStandardMaterial({
                        color: "#d1d5db",
                        metalness: 1,
                        roughness: 0.2,
                    })
                );

            ring.rotation.x =
                Math.PI / 2;

            ring.position.y =
                0.15 + i * 0.1;

            bulbGroup.add(ring);
        }

        // -------------------------
        // Bottom Contact
        // -------------------------
        const contact =
            new THREE.Mesh(
                new THREE.CylinderGeometry(
                    0.08,
                    0.08,
                    0.08,
                    16
                ),
                new THREE.MeshStandardMaterial({
                    color: "#fbbf24",
                    metalness: 1,
                    roughness: 0.25,
                })
            );

        contact.position.y = 0.02;

        bulbGroup.add(contact);

        // =========================================
        // TERMINALS
        // =========================================
        const leftTerminal =
            createTerminal(
                bulbGroup,
                "input",
                "#d1d5db",
                new THREE.Vector3(
                    -0.55,
                    0.35,
                    0
                )
            );

        const rightTerminal =
            createTerminal(
                bulbGroup,
                "output",
                "#d1d5db",
                new THREE.Vector3(
                    0.55,
                    0.35,
                    0
                )
            );

        bulbGroup.userData.terminals = [
            leftTerminal,
            rightTerminal,
        ];

        object = bulbGroup;
    }
    // =================================================
    // COMPASS MODEL
    // =================================================
    else if (type === "compass") {

        const compassGroup =
            new THREE.Group();

        compassGroup.userData.terminals =
            [];

        compassGroup.userData.componentType =
            "compass";

        // =====================================
        // BASE
        // =====================================

        const base =
            new THREE.Mesh(
                new THREE.CylinderGeometry(
                    1.2,
                    1.2,
                    0.25,
                    48
                ),
                new THREE.MeshStandardMaterial({
                    color: "#f8fafc",
                    roughness: 0.7,
                    metalness: 0.1,
                })
            );

        base.receiveShadow = true;

        compassGroup.add(base);

        // =====================================
        // OUTER RING
        // =====================================

        const ring =
            new THREE.Mesh(
                new THREE.TorusGeometry(
                    1.15,
                    0.06,
                    16,
                    64
                ),
                new THREE.MeshStandardMaterial({
                    color: "#94a3b8",
                    metalness: 1,
                    roughness: 0.2,
                })
            );

        ring.rotation.x =
            Math.PI / 2;

        ring.position.y = 0.12;

        compassGroup.add(ring);

        // =====================================
        // NEEDLE GROUP
        // THIS ROTATES
        // =====================================

        const needleGroup =
            new THREE.Group();

        needleGroup.position.y = 0.18;

        compassGroup.add(needleGroup);

        // =====================================
        // NORTH ARROW
        // =====================================

        const northArrow =
            new THREE.Mesh(
                new THREE.ConeGeometry(
                    0.12,
                    0.9,
                    16
                ),
                new THREE.MeshStandardMaterial({
                    color: "#ef4444",
                    emissive: "#7f1d1d",
                })
            );

        northArrow.rotation.z =
            -Math.PI / 2;

        northArrow.position.x = 0.45;

        needleGroup.add(northArrow);

        // =====================================
        // SOUTH ARROW
        // =====================================

        const southArrow =
            new THREE.Mesh(
                new THREE.ConeGeometry(
                    0.12,
                    0.9,
                    16
                ),
                new THREE.MeshStandardMaterial({
                    color: "#e2e8f0",
                })
            );

        southArrow.rotation.z =
            Math.PI / 2;

        southArrow.position.x = -0.45;

        needleGroup.add(southArrow);

        // =====================================
        // CENTER PIN
        // =====================================

        const pin =
            new THREE.Mesh(
                new THREE.SphereGeometry(
                    0.08,
                    16,
                    16
                ),
                new THREE.MeshStandardMaterial({
                    color: "#fbbf24",
                    metalness: 1,
                    roughness: 0.2,
                })
            );

        pin.position.y = 0.02;

        needleGroup.add(pin);

        // =====================================
        // SAVE NEEDLE GROUP
        // =====================================

        compassGroup.userData.needle =
            needleGroup;

        object = compassGroup;
    }
    else if (type === "coil") {

        const coilGroup =
            new THREE.Group();

        // =====================================
        // COMPONENT DATA
        // =====================================

        coilGroup.userData.componentType =
            "coil";

        coilGroup.userData.terminals = [];

        coilGroup.userData.resistance = 12;

        coilGroup.userData.current = 0;

        coilGroup.userData.power = 0;

        coilGroup.userData.isPowered = false;

        coilGroup.userData.magneticStrength = 0;

        // =====================================
        // IRON CORE
        // =====================================

        const core =
            new THREE.Mesh(
                new THREE.CylinderGeometry(
                    0.22,
                    0.22,
                    4,
                    32
                ),
                new THREE.MeshStandardMaterial({
                    color: "#9ca3af",
                    metalness: 1,
                    roughness: 0.25,
                })
            );

        core.rotation.z =
            Math.PI / 2;

        core.castShadow = true;

        coilGroup.add(core);

        // =====================================
        // COPPER WRAPS
        // =====================================

        const wraps: THREE.Mesh[] = [];

        for (let i = 0; i < 15; i++) {

            const wrap =
                new THREE.Mesh(
                    new THREE.TorusGeometry(
                        0.5,
                        0.05,
                        12,
                        32
                    ),
                    new THREE.MeshStandardMaterial({
                        color: "#fb923c",
                        emissive: "#000000",
                        emissiveIntensity: 0,
                        metalness: 1,
                        roughness: 0.2,
                    })
                );

            wrap.rotation.y =
                Math.PI / 2;

            wrap.position.x =
                -1.5 + i * 0.21;

            wrap.castShadow = true;

            coilGroup.add(wrap);

            wraps.push(wrap);
        }

        coilGroup.userData.wraps =
            wraps;

        // =====================================
        // LEFT TERMINAL
        // =====================================

        const leftTerminal =
            createTerminal(
                coilGroup,
                "input",
                "#f97316",
                new THREE.Vector3(
                    -2.4,
                    0,
                    0
                )
            );

        // =====================================
        // RIGHT TERMINAL
        // =====================================

        const rightTerminal =
            createTerminal(
                coilGroup,
                "output",
                "#f97316",
                new THREE.Vector3(
                    2.4,
                    0,
                    0
                )
            );

        coilGroup.userData.terminals = [
            leftTerminal,
            rightTerminal,
        ];

        // =====================================
        // MAGNETIC FIELD GLOW
        // =====================================

        const fieldGlow =
            new THREE.Mesh(
                new THREE.SphereGeometry(
                    2.4,
                    32,
                    32
                ),
                new THREE.MeshBasicMaterial({
                    color: "#60a5fa",
                    transparent: true,
                    opacity: 0,
                    wireframe: true,
                })
            );

        fieldGlow.visible = false;

        coilGroup.add(fieldGlow);

        coilGroup.userData.fieldGlow =
            fieldGlow;

        object = coilGroup;
    }
    // =================================================
    // VOLTMETER
    // =================================================
    else if (type === "voltmeter") {
        const meterGroup =
            new THREE.Group();
        meterGroup.userData.terminals =
            [];
        meterGroup.userData.resistance =
            100;


        // =========================================
        // MAIN BODY
        // =========================================
        const body = new THREE.Mesh(
            new THREE.BoxGeometry(
                2.8,
                1.8,
                1.8
            ),
            new THREE.MeshStandardMaterial({
                color: "#2563eb",
                roughness: 0.65,
            })
        );

        body.castShadow = true;

        meterGroup.add(body);

        // =========================================
        // FRONT PANEL
        // =========================================
        const frontPanel =
            new THREE.Mesh(
                new THREE.BoxGeometry(
                    2.5,
                    1.5,
                    0.08
                ),
                new THREE.MeshStandardMaterial({
                    color: "#1e293b",
                    roughness: 0.8,
                })
            );

        frontPanel.rotation.x =
            -Math.PI / 2;

        frontPanel.position.y = 0.92;

        meterGroup.add(frontPanel);

        // =========================================
        // DIGITAL DISPLAY
        // IMPORTANT:
        // Save this mesh later for text rendering
        // =========================================
        const display =
            new THREE.Mesh(
                new THREE.BoxGeometry(
                    2.2,
                    0.9,
                    0.03
                ),
                new THREE.MeshStandardMaterial({
                    color: "#111827",
                    emissive: "#22c55e",
                    emissiveIntensity: 0.25,
                })
            );

        display.rotation.x =
            -Math.PI / 2;

        display.position.set(
            0,
            1,
            0
        );

        meterGroup.add(display);

        // Save reference for later
        meterGroup.userData.display =
            display;

        // =========================================
        // DISPLAY CANVAS SYSTEM
        // =========================================

        const canvas =
            document.createElement("canvas");

        canvas.width = 256;
        canvas.height = 128;

        const ctx =
            canvas.getContext("2d")!;

        const texture =
            new THREE.CanvasTexture(canvas);

        const displayMaterial =
            new THREE.MeshBasicMaterial({
                map: texture,
                toneMapped: false,
            });

        display.material =
            displayMaterial;

        // Save references
        meterGroup.userData.displayCanvas =
            canvas;

        meterGroup.userData.displayContext =
            ctx;

        meterGroup.userData.displayTexture =
            texture;
        display.material =
            displayMaterial;

        // Component type
        meterGroup.userData.componentType =
            "voltmeter";

        // =========================================
        // LABEL BAR
        // =========================================
        const labelBar =
            new THREE.Mesh(
                new THREE.BoxGeometry(
                    1.2,
                    0.22,
                    0.03
                ),
                new THREE.MeshStandardMaterial({
                    color: "#dbeafe",
                })
            );

        labelBar.rotation.x =
            -Math.PI / 2;

        labelBar.position.set(
            0,
            0.94,
            0.45
        );

        meterGroup.add(labelBar);

        // =========================================
        // TERMINALS
        // =========================================
        const positive =
            createTerminal(
                meterGroup,
                "positive",
                "#ef4444",
                new THREE.Vector3(
                    0.9,
                    0.94,
                    -0.65
                )
            );

        const negative =
            createTerminal(
                meterGroup,
                "negative",
                "#111827",
                new THREE.Vector3(
                    -0.9,
                    0.94,
                    -0.65
                )
            );

        meterGroup.userData.terminals = [
            positive,
            negative,
        ];



        // =========================================
        // RUBBER FEET
        // =========================================
        const footMaterial =
            new THREE.MeshStandardMaterial({
                color: "#111827",
            });

        const foot1 =
            new THREE.Mesh(
                new THREE.BoxGeometry(
                    0.22,
                    0.08,
                    0.22
                ),
                footMaterial
            );

        foot1.position.set(
            -1,
            -0.94,
            0.6
        );

        meterGroup.add(foot1);

        const foot2 =
            foot1.clone();

        foot2.position.x = 1;

        meterGroup.add(foot2);

        object = meterGroup;

    }

    // =================================================
    // AMMETER
    // =================================================
    else if (type === "ammeter") {
        const meterGroup =
            new THREE.Group();
        meterGroup.userData.terminals =
            [];
        meterGroup.userData.resistance =
            0.1;

        // =========================================
        // MAIN BODY
        // =========================================
        const body = new THREE.Mesh(
            new THREE.BoxGeometry(
                2.8,
                1.8,
                1.8
            ),
            new THREE.MeshStandardMaterial({
                color: "#16a34a",
                roughness: 0.65,
            })
        );

        body.castShadow = true;

        meterGroup.add(body);

        // =========================================
        // FRONT PANEL
        // =========================================
        const frontPanel =
            new THREE.Mesh(
                new THREE.BoxGeometry(
                    2.5,
                    1.5,
                    0.08
                ),
                new THREE.MeshStandardMaterial({
                    color: "#1e293b",
                    roughness: 0.8,
                })
            );

        frontPanel.rotation.x =
            -Math.PI / 2;

        frontPanel.position.y = 0.92;

        meterGroup.add(frontPanel);

        // =========================================
        // DIGITAL DISPLAY
        // =========================================
        const display =
            new THREE.Mesh(
                new THREE.BoxGeometry(
                    2.2,
                    0.9,
                    0.03
                ),
                new THREE.MeshStandardMaterial({
                    color: "#111827",
                    emissive: "#22c55e",
                    emissiveIntensity: 0.25,
                })
            );

        display.rotation.x =
            -Math.PI / 2;

        display.position.set(
            0,
            1,
            0
        );

        meterGroup.add(display);

        // Save reference for later
        meterGroup.userData.display =
            display;

        // =========================================
        // DISPLAY CANVAS SYSTEM
        // =========================================

        const canvas =
            document.createElement("canvas");

        canvas.width = 256;
        canvas.height = 128;

        const ctx =
            canvas.getContext("2d")!;

        const texture =
            new THREE.CanvasTexture(canvas);

        const displayMaterial =
            new THREE.MeshBasicMaterial({
                map: texture,
                toneMapped: false,
            });

        display.material =
            displayMaterial;

        // Save references
        meterGroup.userData.displayCanvas =
            canvas;

        meterGroup.userData.displayContext =
            ctx;

        meterGroup.userData.displayTexture =
            texture;
        display.material =
            displayMaterial;

        // Component type
        meterGroup.userData.componentType =
            "ammeter";

        // =========================================
        // LABEL BAR
        // =========================================
        const labelBar =
            new THREE.Mesh(
                new THREE.BoxGeometry(
                    1.2,
                    0.22,
                    0.03
                ),
                new THREE.MeshStandardMaterial({
                    color: "#dcfce7",
                })
            );

        labelBar.rotation.x =
            -Math.PI / 2;

        labelBar.position.set(
            0,
            0.94,
            0.45
        );

        meterGroup.add(labelBar);

        // =========================================
        // TERMINALS
        // =========================================
        const positive =
            createTerminal(
                meterGroup,
                "positive",
                "#ef4444",
                new THREE.Vector3(
                    0.9,
                    0.94,
                    -0.65
                )
            );

        const negative =
            createTerminal(
                meterGroup,
                "negative",
                "#111827",
                new THREE.Vector3(
                    -0.9,
                    0.94,
                    -0.65
                )
            );

        meterGroup.userData.terminals = [
            positive,
            negative,
        ];

        // =========================================
        // RUBBER FEET
        // =========================================
        const footMaterial =
            new THREE.MeshStandardMaterial({
                color: "#111827",
            });

        const foot1 =
            new THREE.Mesh(
                new THREE.BoxGeometry(
                    0.22,
                    0.08,
                    0.22
                ),
                footMaterial
            );

        foot1.position.set(
            -1,
            -0.94,
            0.6
        );

        meterGroup.add(foot1);

        const foot2 =
            foot1.clone();

        foot2.position.x = 1;

        meterGroup.add(foot2);

        object = meterGroup;
    }

    // =================================================
    // 1.5V POWER SOURCE
    // =================================================
    else if (type === "battery15") {
        const powerGroup =
            new THREE.Group();
        powerGroup.userData.terminals =
            [];
        powerGroup.userData.voltage = 1.5;
        powerGroup.userData.componentType =
            "battery";

        // =========================================
        // BATTERY HOLDER BASE
        // =========================================
        const base = new THREE.Mesh(
            new THREE.BoxGeometry(
                3.2,
                0.35,
                1.4
            ),
            new THREE.MeshStandardMaterial({
                color: "#374151",
                roughness: 0.8,
            })
        );

        base.position.y = -0.4;

        powerGroup.add(base);

        // =========================================
        // SIDE WALLS
        // =========================================
        const wallMaterial =
            new THREE.MeshStandardMaterial({
                color: "#4b5563",
                roughness: 0.75,
            });

        const leftWall =
            new THREE.Mesh(
                new THREE.BoxGeometry(
                    3.2,
                    0.5,
                    0.12
                ),
                wallMaterial
            );

        leftWall.position.set(
            0,
            -0.08,
            -0.64
        );

        powerGroup.add(leftWall);

        const rightWall =
            leftWall.clone();

        rightWall.position.z = 0.64;

        powerGroup.add(rightWall);

        // =========================================
        // BATTERY CELL
        // =========================================
        const battery =
            new THREE.Mesh(
                new THREE.CylinderGeometry(
                    0.42,
                    0.42,
                    2.7,
                    32
                ),
                new THREE.MeshStandardMaterial({
                    color: "#2563eb",
                    roughness: 0.4,
                })
            );

        battery.rotation.z =
            Math.PI / 2;

        battery.position.y = 0;

        powerGroup.add(battery);

        // Positive section
        const redCap =
            new THREE.Mesh(
                new THREE.CylinderGeometry(
                    0.43,
                    0.43,
                    0.45,
                    32
                ),
                new THREE.MeshStandardMaterial({
                    color: "#dc2626",
                })
            );

        redCap.rotation.z =
            Math.PI / 2;

        redCap.position.x = 1.08;

        powerGroup.add(redCap);

        // =========================================
        // TERMINALS
        // =========================================
        const positive =
            createTerminal(
                powerGroup,
                "positive",
                "#ef4444",
                new THREE.Vector3(
                    1.2,
                    0.28,
                    -0.38
                )
            );

        const negative =
            createTerminal(
                powerGroup,
                "negative",
                "#3b82f6",
                new THREE.Vector3(
                    -1.2,
                    0.28,
                    -0.38
                )
            );

        powerGroup.userData.terminals = [
            positive,
            negative,
        ];
        // =========================================
        // SPRING CONTACTS
        // =========================================
        const springMaterial =
            new THREE.MeshStandardMaterial({
                color: "#d1d5db",
                metalness: 1,
                roughness: 0.2,
            });

        const leftSpring =
            new THREE.Mesh(
                new THREE.TorusGeometry(
                    0.16,
                    0.03,
                    8,
                    24
                ),
                springMaterial
            );

        leftSpring.rotation.y =
            Math.PI / 2;

        leftSpring.position.x = -1.42;

        powerGroup.add(leftSpring);

        const rightSpring =
            leftSpring.clone();

        rightSpring.position.x = 1.42;

        powerGroup.add(rightSpring);

        object = powerGroup;
    }

    // =================================================
    // 3V POWER SOURCE
    // =================================================
    else if (type === "battery3") {
        const powerGroup =
            new THREE.Group();
        powerGroup.userData.terminals =
            [];
        powerGroup.userData.voltage = 3;
        powerGroup.userData.componentType =
            "battery";

        // =========================================
        // HOLDER BASE
        // =========================================
        const base = new THREE.Mesh(
            new THREE.BoxGeometry(
                3.8,
                0.35,
                2.4
            ),
            new THREE.MeshStandardMaterial({
                color: "#374151",
                roughness: 0.8,
            })
        );

        base.position.y = -0.45;

        powerGroup.add(base);

        // =========================================
        // SIDE WALLS
        // =========================================
        const wallMaterial =
            new THREE.MeshStandardMaterial({
                color: "#4b5563",
                roughness: 0.75,
            });

        const leftWall =
            new THREE.Mesh(
                new THREE.BoxGeometry(
                    3.8,
                    0.55,
                    0.12
                ),
                wallMaterial
            );

        leftWall.position.set(
            0,
            -0.08,
            -1.12
        );

        powerGroup.add(leftWall);

        const rightWall =
            leftWall.clone();

        rightWall.position.z = 1.12;

        powerGroup.add(rightWall);

        // =========================================
        // BATTERY CELL CREATOR
        // =========================================
        const createCell = (
            z: number
        ) => {
            const cell =
                new THREE.Mesh(
                    new THREE.CylinderGeometry(
                        0.36,
                        0.36,
                        2.9,
                        32
                    ),
                    new THREE.MeshStandardMaterial({
                        color: "#2563eb",
                        roughness: 0.4,
                    })
                );

            cell.rotation.z =
                Math.PI / 2;

            cell.position.set(
                0,
                0,
                z
            );

            powerGroup.add(cell);

            const redCap =
                new THREE.Mesh(
                    new THREE.CylinderGeometry(
                        0.37,
                        0.37,
                        0.42,
                        32
                    ),
                    new THREE.MeshStandardMaterial({
                        color: "#dc2626",
                    })
                );

            redCap.rotation.z =
                Math.PI / 2;

            redCap.position.set(
                1.2,
                0,
                z
            );

            powerGroup.add(redCap);
        };

        createCell(-0.55);
        createCell(0.55);

        // =========================================
        // TERMINALS
        // =========================================
        const positive =
            createTerminal(
                powerGroup,
                "positive",
                "#ef4444",
                new THREE.Vector3(
                    1.5,
                    0.32,
                    -0.8
                )
            );

        const negative =
            createTerminal(
                powerGroup,
                "negative",
                "#3b82f6",
                new THREE.Vector3(
                    -1.5,
                    0.32,
                    -0.8
                )
            );

        powerGroup.userData.terminals = [
            positive,
            negative,
        ];

        powerGroup.userData.terminals = [
            positive,
            negative,
        ];

        // =========================================
        // END CAPS
        // =========================================
        const endCapMaterial =
            new THREE.MeshStandardMaterial({
                color: "#6b7280",
                roughness: 0.6,
            });

        const leftCap =
            new THREE.Mesh(
                new THREE.BoxGeometry(
                    0.12,
                    0.55,
                    2.4
                ),
                endCapMaterial
            );

        leftCap.position.set(
            -1.84,
            -0.08,
            0
        );

        powerGroup.add(leftCap);

        const rightCap =
            leftCap.clone();

        rightCap.position.x = 1.84;

        powerGroup.add(rightCap);

        object = powerGroup;
    }
    // =================================================
    // SWITCH
    // =================================================
    else if (type === "switch") {
        const switchGroup =
            new THREE.Group();
        switchGroup.userData.terminals =
            [];
        switchGroup.userData.resistance = 0;

        switchGroup.userData.componentType =
            "switch";
        // =========================================
        // STATE
        // =========================================
        switchGroup.userData.isClosed =
            false;

        // =========================================
        // BASE
        // =========================================
        const base =
            new THREE.Mesh(
                new THREE.BoxGeometry(
                    3,
                    0.28,
                    1.4
                ),
                new THREE.MeshStandardMaterial({
                    color: "#475569",
                    roughness: 0.8,
                })
            );

        base.castShadow = true;

        switchGroup.add(base);

        // =========================================
        // TERMINALS
        // =========================================
        const terminalMaterial =
            new THREE.MeshStandardMaterial({
                color: "#d1d5db",
                metalness: 1,
                roughness: 0.2,
            });
        const leftTerminal =
            createTerminal(
                switchGroup,
                "input",
                "#d1d5db",
                new THREE.Vector3(
                    -1,
                    0.2,
                    0
                )
            );

        const rightTerminal =
            createTerminal(
                switchGroup,
                "output",
                "#d1d5db",
                new THREE.Vector3(
                    1,
                    0.2,
                    0
                )
            );

        switchGroup.userData.terminals = [
            leftTerminal,
            rightTerminal,
        ];


        // =========================================
        // METAL CONTACTS
        // =========================================
        const contactMaterial =
            new THREE.MeshStandardMaterial({
                color: "#94a3b8",
                metalness: 1,
                roughness: 0.2,
            });

        const leftContact =
            new THREE.Mesh(
                new THREE.CylinderGeometry(
                    0.05,
                    0.05,
                    0.55,
                    16
                ),
                contactMaterial
            );

        leftContact.rotation.z =
            Math.PI / 2;

        leftContact.position.set(
            -0.72,
            0.16,
            0
        );

        switchGroup.add(leftContact);

        const rightContact =
            leftContact.clone();

        rightContact.position.x = 0.72;

        switchGroup.add(rightContact);

        // =========================================
        // SWITCH ARM GROUP
        // IMPORTANT:
        // Rotate this later
        // =========================================
        const armGroup =
            new THREE.Group();
        armGroup.userData.terminals =
            [];

        armGroup.position.set(
            -0.72,
            0.16,
            0
        );

        switchGroup.add(armGroup);

        // Save reference
        switchGroup.userData.arm =
            armGroup;

        // =========================================
        // METAL ARM
        // =========================================
        const arm =
            new THREE.Mesh(
                new THREE.BoxGeometry(
                    1.5,
                    0.08,
                    0.18
                ),
                new THREE.MeshStandardMaterial({
                    color: "#e2e8f0",
                    metalness: 1,
                    roughness: 0.15,
                })
            );

        arm.position.x = 0.75;

        armGroup.add(arm);

        // =========================================
        // HANDLE
        // =========================================
        const handle =
            new THREE.Mesh(
                new THREE.CylinderGeometry(
                    0.08,
                    0.08,
                    0.55,
                    16
                ),
                new THREE.MeshStandardMaterial({
                    color: "#ef4444",
                    roughness: 0.45,
                })
            );

        handle.position.set(
            0.72,
            0.24,
            0
        );

        armGroup.add(handle);

        // =========================================
        // PIVOT
        // =========================================
        const pivot =
            new THREE.Mesh(
                new THREE.CylinderGeometry(
                    0.09,
                    0.09,
                    0.12,
                    16
                ),
                terminalMaterial
            );

        pivot.position.set(
            -0.02,
            0,
            0
        );

        armGroup.add(pivot);

        // =========================================
        // OPEN STATE DEFAULT
        // =========================================
        armGroup.rotation.z =
            -0.45;

        object = switchGroup;
    }

    // =================================================
    // RESISTOR / HEATING ELEMENT
    // =================================================
    else if (type === "resistor") {
        const resistorGroup =
            new THREE.Group();
        resistorGroup.userData.terminals =
            [];
        resistorGroup.userData.resistance =
            20;

        resistorGroup.userData.current =
            0;

        resistorGroup.userData.power =
            0;
        resistorGroup.userData.componentType =
            "resistor";

        // =========================================
        // LEFT WIRE
        // =========================================
        const wireMaterial =
            new THREE.MeshStandardMaterial({
                color: "#9ca3af",
                metalness: 1,
                roughness: 0.25,
            });

        const leftWire =
            new THREE.Mesh(
                new THREE.CylinderGeometry(
                    0.05,
                    0.05,
                    1.8,
                    16
                ),
                wireMaterial
            );

        leftWire.rotation.z =
            Math.PI / 2;

        leftWire.position.x = -2.1;

        resistorGroup.add(leftWire);

        // =========================================
        // RIGHT WIRE
        // =========================================
        const rightWire =
            leftWire.clone();

        rightWire.position.x = 2.1;

        resistorGroup.add(rightWire);

        // =========================================
        // CERAMIC BODY
        // =========================================
        const ceramicBody =
            new THREE.Mesh(
                new THREE.BoxGeometry(
                    2.8,
                    0.7,
                    0.9
                ),
                new THREE.MeshStandardMaterial({
                    color: "#e5e7eb",
                    roughness: 0.85,
                })
            );

        ceramicBody.castShadow = true;

        resistorGroup.add(ceramicBody);

        // =========================================
        // HEATING CORE
        // =========================================
        const heatingCore =
            new THREE.Mesh(
                new THREE.CylinderGeometry(
                    0.12,
                    0.12,
                    2,
                    24
                ),
                new THREE.MeshStandardMaterial({
                    color: "#7c2d12",
                    emissive: "#000000",
                    emissiveIntensity: 0,
                    roughness: 0.5,
                    metalness: 0.2,
                })
            );

        heatingCore.rotation.z =
            Math.PI / 2;

        heatingCore.position.y = 0.12;

        resistorGroup.add(heatingCore);

        // Save reference for heating later
        resistorGroup.userData.heatingCore =
            heatingCore;

        // =========================================
        // GLOW EFFECT MESH
        // =========================================
        const glow =
            new THREE.Mesh(
                new THREE.CylinderGeometry(
                    0.18,
                    0.18,
                    2.1,
                    24
                ),
                new THREE.MeshBasicMaterial({
                    color: "#ff4500",
                    transparent: true,
                    opacity: 0,
                })
            );

        glow.rotation.z =
            Math.PI / 2;

        glow.position.y = 0.12;

        resistorGroup.add(glow);

        // Save glow reference
        resistorGroup.userData.glow =
            glow;

        // =========================================
        // HEAT FINS
        // =========================================
        const finMaterial =
            new THREE.MeshStandardMaterial({
                color: "#94a3b8",
                metalness: 0.9,
                roughness: 0.3,
            });

        for (let i = 0; i < 6; i++) {
            const fin =
                new THREE.Mesh(
                    new THREE.BoxGeometry(
                        0.08,
                        0.9,
                        1
                    ),
                    finMaterial
                );

            fin.position.x =
                -1 + i * 0.4;

            resistorGroup.add(fin);
        }

        // =========================================
        // SUPPORT FEET
        // =========================================
        const footMaterial =
            new THREE.MeshStandardMaterial({
                color: "#475569",
                roughness: 0.75,
            });

        const leftFoot =
            new THREE.Mesh(
                new THREE.BoxGeometry(
                    0.18,
                    0.3,
                    0.18
                ),
                footMaterial
            );

        leftFoot.position.set(
            -0.8,
            -0.5,
            0
        );

        resistorGroup.add(leftFoot);

        const rightFoot =
            leftFoot.clone();

        rightFoot.position.x = 0.8;

        resistorGroup.add(rightFoot);

        // =========================================
        // TERMINALS
        // =========================================
        const leftTerminal =
            createTerminal(
                resistorGroup,
                "input",
                "#d1d5db",
                new THREE.Vector3(
                    -3,
                    0,
                    0
                )
            );

        const rightTerminal =
            createTerminal(
                resistorGroup,
                "output",
                "#d1d5db",
                new THREE.Vector3(
                    3,
                    0,
                    0
                )
            );

        resistorGroup.userData.terminals = [
            leftTerminal,
            rightTerminal,
        ];

        object = resistorGroup;
    }

    // =================================================
    // THERMOMETER (SIDEWAYS)
    // =================================================
    else if (type === "thermometer") {
        const thermoGroup =
            new THREE.Group();
        thermoGroup.userData.terminals =
            [];
        thermoGroup.userData.componentType =
            "thermometer";
        thermoGroup.userData.temperature =
            20;

        thermoGroup.userData.targetTemperature =
            20;


        // =========================================
        // MAIN BODY
        // =========================================
        const body =
            new THREE.Mesh(
                new THREE.CylinderGeometry(
                    0.22,
                    0.22,
                    4.8,
                    32
                ),
                new THREE.MeshPhysicalMaterial({
                    color: "#ffffff",
                    transparent: true,
                    opacity: 0.4,
                    transmission: 1,
                    roughness: 0,
                    thickness: 0.2,
                })
            );

        body.rotation.z =
            Math.PI / 2;

        thermoGroup.add(body);

        // =========================================
        // WHITE BACKING
        // =========================================
        const backing =
            new THREE.Mesh(
                new THREE.BoxGeometry(
                    4.2,
                    0.22,
                    0.08
                ),
                new THREE.MeshStandardMaterial({
                    color: "#f8fafc",
                    roughness: 0.9,
                })
            );

        backing.position.z = -0.05;

        thermoGroup.add(backing);

        // =========================================
        // MERCURY BULB
        // =========================================
        const bulb =
            new THREE.Mesh(
                new THREE.SphereGeometry(
                    0.32,
                    24,
                    24
                ),
                new THREE.MeshStandardMaterial({
                    color: "#ef4444",
                    emissive: "#991b1b",
                    emissiveIntensity: 0.35,
                })
            );
        thermoGroup.userData.mercury =
            bulb;

        bulb.position.x = -2;

        thermoGroup.add(bulb);

        // =========================================
        // MERCURY COLUMN
        // IMPORTANT:
        // scale.x changes later
        // =========================================
        const mercury =
            new THREE.Mesh(
                new THREE.CylinderGeometry(
                    0.08,
                    0.08,
                    2.8,
                    24
                ),
                new THREE.MeshStandardMaterial({
                    color: "#ef4444",
                    emissive: "#7f1d1d",
                    emissiveIntensity: 0.4,
                })
            );

        mercury.rotation.z =
            Math.PI / 2;

        mercury.position.x = -0.2;

        thermoGroup.add(mercury);

        // =========================================
        // FIXED MERCURY BASE
        // =========================================

        const mercuryBase =
            new THREE.Mesh(
                new THREE.CylinderGeometry(
                    0.08,
                    0.08,
                    2,
                    24
                ),
                new THREE.MeshStandardMaterial({
                    color: "#ef4444",
                    emissive: "#7f1d1d",
                    emissiveIntensity: 0.4,
                })
            );

        mercuryBase.rotation.z =
            Math.PI / 2;

        // Fixed at bulb side
        mercuryBase.position.x =
            -1;


        thermoGroup.add(
            mercuryBase
        );

        // IMPORTANT reference
        thermoGroup.userData.mercury =
            mercury;

        // =========================================
        // SCALE MARKERS
        // =========================================
        const markerMaterial =
            new THREE.MeshStandardMaterial({
                color: "#334155",
            });

        for (let i = 0; i < 10; i++) {
            const marker =
                new THREE.Mesh(
                    new THREE.BoxGeometry(
                        0.02,
                        0.12,
                        0.02
                    ),
                    markerMaterial
                );

            marker.position.set(
                -1.8 + i * 0.4,
                0.12,
                0
            );

            thermoGroup.add(marker);
        }

        // =========================================
        // END CAP
        // =========================================
        const endCap =
            new THREE.Mesh(
                new THREE.SphereGeometry(
                    0.2,
                    24,
                    24
                ),
                new THREE.MeshStandardMaterial({
                    color: "#cbd5e1",
                    roughness: 0.5,
                })
            );

        endCap.position.x = 2.2;

        thermoGroup.add(endCap);

        // =========================================
        // SUPPORT FEET
        // =========================================
        const footMaterial =
            new THREE.MeshStandardMaterial({
                color: "#64748b",
                roughness: 0.75,
            });

        const leftFoot =
            new THREE.Mesh(
                new THREE.BoxGeometry(
                    0.2,
                    0.12,
                    0.35
                ),
                footMaterial
            );

        leftFoot.position.set(
            -1.3,
            -0.24,
            0
        );

        thermoGroup.add(leftFoot);

        const rightFoot =
            leftFoot.clone();

        rightFoot.position.x = 1.3;

        thermoGroup.add(rightFoot);

        object = thermoGroup;
    }


    // =================================================
    // Placement
    // =================================================
    object.position.set(
        (Math.random() - 0.5) * 10,
        0,
        (Math.random() - 0.5) * 10
    );

    object.traverse((child) => {
        if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
        }
    });

    return object;
};
