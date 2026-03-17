import { useState, useRef, useEffect, useCallback } from "react";

const FACES = [
    { id: "U", label: "Top" },
    { id: "F", label: "Front" },
    { id: "R", label: "Right" },
    { id: "B", label: "Back" },
    { id: "L", label: "Left" },
    { id: "D", label: "Bottom" },
];

const FACE_SCAN_CONFIG = {
    U: { faceColor: "white", topColor: "orange" },
    F: { faceColor: "green", topColor: "white" },
    R: { faceColor: "red", topColor: "white" },
    B: { faceColor: "blue", topColor: "white" },
    L: { faceColor: "orange", topColor: "white" },
    D: { faceColor: "yellow", topColor: "red" },
};

const CUBE_COLORS = [
    { name: "white", hex: "#FFFFFF", border: "#ccc" },
    { name: "yellow", hex: "#FFD700", border: "#b8960c" },
    { name: "red", hex: "#E53935", border: "#b71c1c" },
    { name: "orange", hex: "#FB8C00", border: "#e65100" },
    { name: "blue", hex: "#1E88E5", border: "#0d47a1" },
    { name: "green", hex: "#43A047", border: "#1b5e20" },
];

const FACE_DEFAULT_COLORS = {
    U: "white", F: "green", R: "red", B: "blue", L: "orange", D: "yellow",
};

const OPPOSITE = { white: "yellow", yellow: "white", red: "orange", orange: "red", blue: "green", green: "blue" };
const CENTER_IDX = 4;

// ─── Validation ───────────────────────────────────────────────────────────────
const PIECE_ADJACENCY = {
    "F": {
        0: [{ faceId: "U", stickerIdx: 6 }, { faceId: "L", stickerIdx: 2 }],
        1: [{ faceId: "U", stickerIdx: 7 }],
        2: [{ faceId: "U", stickerIdx: 8 }, { faceId: "R", stickerIdx: 0 }],
        3: [{ faceId: "L", stickerIdx: 5 }],
        5: [{ faceId: "R", stickerIdx: 3 }],
        6: [{ faceId: "D", stickerIdx: 0 }, { faceId: "L", stickerIdx: 8 }],
        7: [{ faceId: "D", stickerIdx: 1 }],
        8: [{ faceId: "D", stickerIdx: 2 }, { faceId: "R", stickerIdx: 6 }],
    },
    "R": {
        0: [{ faceId: "U", stickerIdx: 8 }, { faceId: "F", stickerIdx: 2 }],
        1: [{ faceId: "U", stickerIdx: 5 }],
        2: [{ faceId: "U", stickerIdx: 2 }, { faceId: "B", stickerIdx: 0 }],
        3: [{ faceId: "F", stickerIdx: 5 }],
        5: [{ faceId: "B", stickerIdx: 3 }],
        6: [{ faceId: "D", stickerIdx: 2 }, { faceId: "F", stickerIdx: 8 }],
        7: [{ faceId: "D", stickerIdx: 5 }],
        8: [{ faceId: "D", stickerIdx: 8 }, { faceId: "B", stickerIdx: 6 }],
    },
    "B": {
        0: [{ faceId: "U", stickerIdx: 2 }, { faceId: "R", stickerIdx: 2 }],
        1: [{ faceId: "U", stickerIdx: 1 }],
        2: [{ faceId: "U", stickerIdx: 0 }, { faceId: "L", stickerIdx: 0 }],
        3: [{ faceId: "R", stickerIdx: 5 }],
        5: [{ faceId: "L", stickerIdx: 3 }],
        6: [{ faceId: "D", stickerIdx: 8 }, { faceId: "R", stickerIdx: 8 }],
        7: [{ faceId: "D", stickerIdx: 7 }],
        8: [{ faceId: "D", stickerIdx: 6 }, { faceId: "L", stickerIdx: 6 }],
    },
    "L": {
        0: [{ faceId: "U", stickerIdx: 0 }, { faceId: "B", stickerIdx: 2 }],
        1: [{ faceId: "U", stickerIdx: 3 }],
        2: [{ faceId: "U", stickerIdx: 6 }, { faceId: "F", stickerIdx: 0 }],
        3: [{ faceId: "B", stickerIdx: 5 }],
        5: [{ faceId: "F", stickerIdx: 3 }],
        6: [{ faceId: "D", stickerIdx: 6 }, { faceId: "B", stickerIdx: 8 }],
        7: [{ faceId: "D", stickerIdx: 3 }],
        8: [{ faceId: "D", stickerIdx: 0 }, { faceId: "F", stickerIdx: 6 }],
    },
    "U": {
        0: [{ faceId: "B", stickerIdx: 2 }, { faceId: "L", stickerIdx: 0 }],
        1: [{ faceId: "B", stickerIdx: 1 }],
        2: [{ faceId: "B", stickerIdx: 0 }, { faceId: "R", stickerIdx: 2 }],
        3: [{ faceId: "L", stickerIdx: 1 }],
        5: [{ faceId: "R", stickerIdx: 1 }],
        6: [{ faceId: "F", stickerIdx: 0 }, { faceId: "L", stickerIdx: 2 }],
        7: [{ faceId: "F", stickerIdx: 1 }],
        8: [{ faceId: "F", stickerIdx: 2 }, { faceId: "R", stickerIdx: 0 }],
    },
    "D": {
        0: [{ faceId: "F", stickerIdx: 6 }, { faceId: "L", stickerIdx: 8 }],
        1: [{ faceId: "F", stickerIdx: 7 }],
        2: [{ faceId: "F", stickerIdx: 8 }, { faceId: "R", stickerIdx: 6 }],
        3: [{ faceId: "L", stickerIdx: 7 }],
        5: [{ faceId: "R", stickerIdx: 7 }],
        6: [{ faceId: "B", stickerIdx: 8 }, { faceId: "L", stickerIdx: 6 }],
        7: [{ faceId: "B", stickerIdx: 7 }],
        8: [{ faceId: "B", stickerIdx: 6 }, { faceId: "R", stickerIdx: 8 }],
    },
};

function pieceKey(faceA, idxA, faceB, idxB) {
    return [faceA + idxA, faceB + idxB].sort().join("|");
}

function validateFaces(scannedFaces) {
    const errors = {};
    const reported = new Set();

    const globalCount = {};
    for (const data of Object.values(scannedFaces)) {
        data.grid.forEach(hex => {
            const n = CUBE_COLORS.find(c => c.hex === hex)?.name ?? "unknown";
            globalCount[n] = (globalCount[n] || 0) + 1;
        });
    }

    for (const [faceId, data] of Object.entries(scannedFaces)) {
        const errs = [];
        const grid = data.grid;
        const centerHex = grid[CENTER_IDX];
        const centerColor = CUBE_COLORS.find(c => c.hex === centerHex)?.name ?? "unknown";

        if (globalCount[centerColor] > 9) {
            errs.push(`"${centerColor}" appears ${globalCount[centerColor]} times across all faces (max 9)`);
        }

        const piecemap = PIECE_ADJACENCY[faceId] || {};
        const PIECE_LABELS = { 0: "top-left corner", 1: "top edge", 2: "top-right corner", 3: "left edge", 5: "right edge", 6: "bottom-left corner", 7: "bottom edge", 8: "bottom-right corner" };

        for (const [idxStr, neighbors] of Object.entries(piecemap)) {
            const idx = Number(idxStr);
            const myColor = CUBE_COLORS.find(c => c.hex === grid[idx])?.name;
            if (!myColor) continue;

            for (const nb of neighbors) {
                const nbData = scannedFaces[nb.faceId];
                if (!nbData) continue;
                const nbColor = CUBE_COLORS.find(c => c.hex === nbData.grid[nb.stickerIdx])?.name;
                if (!nbColor) continue;

                const key = pieceKey(faceId, idx, nb.faceId, nb.stickerIdx);
                if (reported.has(key)) continue;
                reported.add(key);

                const label = PIECE_LABELS[idx];
                if (myColor === nbColor) {
                    errs.push(`${label} (${faceId}↔${nb.faceId}): same color "${myColor}" on both sides — impossible`);
                } else if (OPPOSITE[myColor] === nbColor) {
                    errs.push(`${label} (${faceId}↔${nb.faceId}): opposite colors "${myColor}" & "${nbColor}" on same piece — impossible`);
                }
            }
        }

        if (centerColor !== FACE_DEFAULT_COLORS[faceId]) {
            errs.push(`Center is "${centerColor}" but expected "${FACE_DEFAULT_COLORS[faceId]}" for this face`);
        }

        if (errs.length) errors[faceId] = errs;
    }
    return errors;
}

// ─── Three.js ────────────────────────────────────────────────────────────────
const THREEJS_FACE_MAP = ["R", "L", "U", "D", "F", "B"];
const CUBIE_SIZE = 0.96;
const BEVEL = 0.07;
const BEVEL_SEGS = 3;

function hexToInt(hex) { return parseInt(hex.replace("#", ""), 16); }

function loadThree(cb) {
    if (window.THREE) { cb(window.THREE); return; }
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
    s.onload = () => cb(window.THREE);
    document.head.appendChild(s);
}

function makeRoundedBoxGeo(THREE, size, radius, segs) {
    const geo = new THREE.BoxGeometry(size, size, size, 4, 4, 4);
    const r = radius;
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
        let x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
        const half = size / 2;
        const cx = Math.max(-half + r, Math.min(half - r, x));
        const cy = Math.max(-half + r, Math.min(half - r, y));
        const cz = Math.max(-half + r, Math.min(half - r, z));
        const dx = x - cx, dy = y - cy, dz = z - cz;
        const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (len > 0) {
            const scale = r / len;
            x = cx + dx * scale;
            y = cy + dy * scale;
            z = cz + dz * scale;
        }
        pos.setXYZ(i, x, y, z);
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
    return geo;
}

function makeStickerTex(THREE, colorHex) {
    const sz = 512;
    const c = document.createElement("canvas");
    c.width = sz; c.height = sz;
    const ctx = c.getContext("2d");
    ctx.fillStyle = colorHex;
    ctx.fillRect(0, 0, sz, sz);
    const vig = ctx.createRadialGradient(sz / 2, sz / 2, sz * 0.28, sz / 2, sz / 2, sz * 0.72);
    vig.addColorStop(0, "rgba(255,255,255,0.0)");
    vig.addColorStop(1, "rgba(0,0,0,0.28)");
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, sz, sz);
    const spec = ctx.createRadialGradient(sz * 0.28, sz * 0.22, 0, sz * 0.38, sz * 0.38, sz * 0.55);
    spec.addColorStop(0, "rgba(255,255,255,0.42)");
    spec.addColorStop(0.3, "rgba(255,255,255,0.10)");
    spec.addColorStop(1, "rgba(255,255,255,0.0)");
    ctx.fillStyle = spec;
    ctx.fillRect(0, 0, sz, sz);
    const img = ctx.getImageData(0, 0, sz, sz);
    for (let i = 0; i < img.data.length; i += 4) {
        const n = (Math.random() - 0.5) * 20;
        img.data[i] = Math.min(255, Math.max(0, img.data[i] + n));
        img.data[i + 1] = Math.min(255, Math.max(0, img.data[i + 1] + n));
        img.data[i + 2] = Math.min(255, Math.max(0, img.data[i + 2] + n));
    }
    for (let y2 = 0; y2 < sz; y2 += 3 + Math.floor(Math.random() * 6)) {
        const alpha = Math.random() * 0.06;
        for (let x2 = 0; x2 < sz; x2++) {
            const idx = (y2 * sz + x2) * 4;
            img.data[idx] = Math.min(255, img.data[idx] + 255 * alpha);
            img.data[idx + 1] = Math.min(255, img.data[idx + 1] + 255 * alpha);
            img.data[idx + 2] = Math.min(255, img.data[idx + 2] + 255 * alpha);
        }
    }
    ctx.putImageData(img, 0, 0);
    const t = new THREE.CanvasTexture(c);
    t.needsUpdate = true;
    return t;
}

function makeUnscannedTex(THREE) {
    const sz = 128;
    const c = document.createElement("canvas");
    c.width = sz; c.height = sz;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#f5f5f5";
    ctx.fillRect(0, 0, sz, sz);
    ctx.strokeStyle = "rgba(0,0,0,0.07)";
    ctx.lineWidth = 1;
    for (let i = 0; i < sz; i += 20) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, sz); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(sz, i); ctx.stroke();
    }
    const t = new THREE.CanvasTexture(c);
    t.needsUpdate = true;
    return t;
}

function buildCube(THREE, scannedFaces, group) {
    while (group.children.length) {
        const c = group.children[0];
        c.traverse(obj => {
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) {
                if (obj.material.map) obj.material.map.dispose();
                obj.material.dispose();
            }
        });
        group.remove(c);
    }

    const bodyGeo = makeRoundedBoxGeo(THREE, CUBIE_SIZE, BEVEL, BEVEL_SEGS);
    const stickerSz = CUBIE_SIZE - BEVEL * 2 - 0.04;
    const offset = CUBIE_SIZE / 2 + 0.004;

    for (let x = -1; x <= 1; x++) {
        for (let y = -1; y <= 1; y++) {
            for (let z = -1; z <= 1; z++) {
                const cg = new THREE.Group();
                cg.position.set(x, y, z);
                group.add(cg);

                const bodyMat = new THREE.MeshStandardMaterial({
                    color: 0x111111,
                    roughness: 0.4,
                    metalness: 0.5,
                    envMapIntensity: 1.0,
                });
                cg.add(new THREE.Mesh(bodyGeo, bodyMat));

                THREEJS_FACE_MAP.forEach((faceId, fi) => {
                    const onFace =
                        (fi === 0 && x === 1) || (fi === 1 && x === -1) ||
                        (fi === 2 && y === 1) || (fi === 3 && y === -1) ||
                        (fi === 4 && z === 1) || (fi === 5 && z === -1);
                    if (!onFace) return;

                    const data = scannedFaces[faceId];
                    let si = 0;
                    if (fi === 0) si = (1 - y) * 3 + (1 - z);
                    if (fi === 1) si = (1 - y) * 3 + (z + 1);
                    if (fi === 2) si = (z + 1) * 3 + (x + 1);
                    if (fi === 3) si = (1 - z) * 3 + (x + 1);
                    if (fi === 4) si = (1 - y) * 3 + (x + 1);
                    if (fi === 5) si = (1 - y) * 3 + (1 - x);
                    si = Math.max(0, Math.min(8, si));

                    const tex = data ? makeStickerTex(THREE, data.grid[si]) : makeUnscannedTex(THREE);
                    const sGeo = new THREE.PlaneGeometry(stickerSz, stickerSz);
                    const sMat = new THREE.MeshStandardMaterial({
                        map: tex,
                        roughness: 0.38,
                        metalness: 0.08,
                        envMapIntensity: 0.6,
                    });
                    const s = new THREE.Mesh(sGeo, sMat);

                    if (fi === 0) { s.position.set(offset, 0, 0); s.rotation.y = Math.PI / 2; }
                    if (fi === 1) { s.position.set(-offset, 0, 0); s.rotation.y = -Math.PI / 2; }
                    if (fi === 2) { s.position.set(0, offset, 0); s.rotation.x = -Math.PI / 2; }
                    if (fi === 3) { s.position.set(0, -offset, 0); s.rotation.x = Math.PI / 2; }
                    if (fi === 4) { s.position.set(0, 0, offset); }
                    if (fi === 5) { s.position.set(0, 0, -offset); s.rotation.y = Math.PI; }

                    cg.add(s);
                });
            }
        }
    }
}

// ─── Cube3D component ─────────────────────────────────────────────────────────
const ROTATE_METHODS = [
    { id: "A", label: "Standard", desc: "Simple euler rotation" },
    { id: "B", label: "Fast", desc: "Sensitivity-scaled" },
    { id: "C", label: "Axis-lock", desc: "Dominant axis only" },
    { id: "D", label: "Trackball", desc: "World-axis quaternions" },
    { id: "E", label: "Inertia", desc: "Weighted momentum" },
];

function Cube3D({ scannedFaces, debugMode }) {
    const mountRef = useRef(null);
    const stateRef = useRef(null);
    const [rotateMethod, setRotateMethod] = useState("A");
    const [angleDisplay, setAngleDisplay] = useState({ x: 0, y: 0 });

    useEffect(() => {
        let cancelled = false;
        loadThree(THREE => {
            if (cancelled || !mountRef.current) return;
            const el = mountRef.current;
            const W = el.clientWidth || 300;
            const H = el.clientHeight || 200;

            const scene = new THREE.Scene();
            scene.background = null;

            const camera = new THREE.PerspectiveCamera(36, W / H, 0.1, 100);
            camera.position.set(5.2, 3.8, 5.2);
            camera.lookAt(0, 0, 0);

            const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
            renderer.setSize(W, H);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            renderer.setClearColor(0x000000, 0);
            el.appendChild(renderer.domElement);

            scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 0.8));
            const key = new THREE.DirectionalLight(0xffffff, 1.2); key.position.set(5, 9, 6); scene.add(key);
            const fill = new THREE.DirectionalLight(0xd0e8ff, 0.4); fill.position.set(-4, 2, 5); scene.add(fill);
            const rim = new THREE.DirectionalLight(0xffe0b0, 0.2); rim.position.set(1, -5, -5); scene.add(rim);

            const group = new THREE.Group();
            group.rotation.x = 0.0;
            group.rotation.y = Math.PI / 4;
            scene.add(group);
            buildCube(THREE, {}, group);

            let isDragging = false, lastX = 0, lastY = 0;
            let velX = 0, velY = 0;
            let state = "spin";
            let idleTimer = null;
            const HOME_X = 0.0, HOME_Y = Math.PI / 4;

            const moveA = (cx, cy) => { velX = (cx - lastX) * 0.009; velY = (cy - lastY) * 0.009; group.rotation.y += velX; group.rotation.x += velY; };
            const moveB = (cx, cy) => { velX = (cx - lastX) * 0.014; velY = (cy - lastY) * 0.005; group.rotation.y += velX; group.rotation.x += velY; };
            const moveC = (cx, cy) => { const dx = (cx - lastX) * 0.009, dy = (cy - lastY) * 0.009; if (Math.abs(dx) > Math.abs(dy)) { velX = dx; velY = 0; group.rotation.y += dx; } else { velX = 0; velY = dy; group.rotation.x += dy; } };
            const qTmp = new THREE.Quaternion();
            const axX = new THREE.Vector3(1, 0, 0), axY = new THREE.Vector3(0, 1, 0);
            const moveD = (cx, cy) => { velX = (cx - lastX) * 0.009; velY = (cy - lastY) * 0.009; qTmp.setFromAxisAngle(axY, velX); group.quaternion.premultiply(qTmp); qTmp.setFromAxisAngle(axX, velY); group.quaternion.premultiply(qTmp); group.rotation.setFromQuaternion(group.quaternion); };
            const moveE = (cx, cy) => { const dx = (cx - lastX) * 0.009, dy = (cy - lastY) * 0.009; velX = velX * 0.4 + dx * 0.6; velY = velY * 0.4 + dy * 0.6; group.rotation.y += velX; group.rotation.x += velY; };
            const METHODS = { A: moveA, B: moveB, C: moveC, D: moveD, E: moveE };

            const onDown = (cx, cy) => { isDragging = true; lastX = cx; lastY = cy; velX = 0; velY = 0; state = "dragging"; clearTimeout(idleTimer); };
            const onMove = (cx, cy) => { if (!isDragging) return; const method = stateRef.current?.rotateMethod || "A"; METHODS[method]?.(cx, cy); lastX = cx; lastY = cy; };
            const onUp = () => { if (!isDragging) return; isDragging = false; state = "momentum"; idleTimer = setTimeout(() => { state = "returning"; }, 2500); };

            const md = e => onDown(e.clientX, e.clientY);
            const mm = e => onMove(e.clientX, e.clientY);
            const ts = e => { e.preventDefault(); onDown(e.touches[0].clientX, e.touches[0].clientY); };
            const tm = e => { e.preventDefault(); onMove(e.touches[0].clientX, e.touches[0].clientY); };

            renderer.domElement.addEventListener("mousedown", md);
            window.addEventListener("mousemove", mm);
            window.addEventListener("mouseup", onUp);
            renderer.domElement.addEventListener("touchstart", ts, { passive: false });
            window.addEventListener("touchmove", tm, { passive: false });
            window.addEventListener("touchend", onUp);

            let animId;
            const animate = () => {
                animId = requestAnimationFrame(animate);
                if (!isDragging) {
                    if (state === "spin") { group.rotation.y += 0.012; }
                    else if (state === "momentum") { velX *= 0.92; velY *= 0.92; group.rotation.y += velX; group.rotation.x += velY; }
                    else if (state === "returning") {
                        let dx = HOME_X - group.rotation.x; dx = ((dx % (Math.PI * 2)) + Math.PI * 3) % (Math.PI * 2) - Math.PI;
                        let dy = HOME_Y - group.rotation.y; dy = ((dy % (Math.PI * 2)) + Math.PI * 3) % (Math.PI * 2) - Math.PI;
                        group.rotation.x += dx * 0.018; group.rotation.y += dy * 0.018;
                        if (Math.abs(dx) < 0.003 && Math.abs(dy) < 0.003) { group.rotation.x = HOME_X; group.rotation.y = HOME_Y; state = "spin"; }
                    }
                }
                if (debugMode) setAngleDisplay({ x: group.rotation.x, y: group.rotation.y });
                renderer.render(scene, camera);
            };
            animate();

            stateRef.current = {
                THREE, group, renderer,
                rotateMethod: "A",
                updateCube: (sf) => buildCube(THREE, sf, group),
                cleanup: () => {
                    cancelAnimationFrame(animId);
                    renderer.domElement.removeEventListener("mousedown", md);
                    window.removeEventListener("mousemove", mm);
                    window.removeEventListener("mouseup", onUp);
                    renderer.domElement.removeEventListener("touchstart", ts);
                    window.removeEventListener("touchmove", tm);
                    window.removeEventListener("touchend", onUp);
                    renderer.dispose();
                    if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
                }
            };
        });
        return () => { cancelled = true; stateRef.current?.cleanup?.(); stateRef.current = null; };
    }, []);

    useEffect(() => {
        stateRef.current?.updateCube?.(scannedFaces);
    }, [scannedFaces]);

    useEffect(() => {
        if (stateRef.current) stateRef.current.rotateMethod = rotateMethod;
    }, [rotateMethod]);

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ position: "relative", width: "100%", height: 200, borderRadius: 8, overflow: "hidden", background: "#f8f8f8", border: "1px solid #e8e8e8" }}>
                <div ref={mountRef} style={{ width: "100%", height: "100%" }} />
                <div style={{ position: "absolute", bottom: 8, right: 10, fontSize: 10, color: "#bbb", fontFamily: "'Courier New',monospace", letterSpacing: 1, userSelect: "none" }}>drag to rotate</div>
                {debugMode && (
                    <div style={{ position: "absolute", top: 8, left: 8, background: "rgba(255,255,255,0.9)", borderRadius: 4, padding: "3px 8px", fontFamily: "monospace", fontSize: 10, color: "#666", border: "1px solid #e0e0e0" }}>
                        x: {angleDisplay.x.toFixed(3)} &nbsp; y: {angleDisplay.y.toFixed(3)}
                    </div>
                )}
            </div>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {ROTATE_METHODS.map(m => (
                    <button key={m.id} onClick={() => setRotateMethod(m.id)} title={m.desc} style={{
                        padding: "3px 8px", borderRadius: 4, fontSize: 10, fontFamily: "'Courier New',monospace", cursor: "pointer",
                        border: rotateMethod === m.id ? "1px solid #111" : "1px solid #ddd",
                        background: rotateMethod === m.id ? "#111" : "transparent",
                        color: rotateMethod === m.id ? "#fff" : "#999",
                        transition: "all 0.15s",
                    }}>{m.id}: {m.label}</button>
                ))}
            </div>
        </div>
    );
}

// ─── UI helpers ───────────────────────────────────────────────────────────────
function ColoredText({ colorName }) {
    const info = CUBE_COLORS.find(c => c.name === colorName);
    const isLight = colorName === "white" || colorName === "yellow";
    return (
        <span style={{
            display: "inline-block", background: info?.hex,
            color: isLight ? "#333" : "#fff",
            borderRadius: 3, padding: "1px 6px",
            fontWeight: 600, fontSize: 11,
            border: `1px solid ${info?.border}`,
        }}>{colorName}</span>
    );
}

function ColorPicker({ value, onChange }) {
    return (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
            {CUBE_COLORS.map(c => (
                <button key={c.name} onClick={() => onChange(c.hex)} title={c.name} style={{
                    width: 30, height: 30, borderRadius: 4, background: c.hex,
                    border: value === c.hex ? `2px solid #111` : `1px solid ${c.border}`,
                    cursor: "pointer", transform: value === c.hex ? "scale(1.15)" : "scale(1)",
                    transition: "all 0.12s", outline: "none",
                }} />
            ))}
        </div>
    );
}

// ─── FaceEditor ───────────────────────────────────────────────────────────────
function FaceEditor({ faceId, data, onSave, onClose }) {
    const [grid, setGrid] = useState(data.grid.slice());
    const [selectedColor, setSelectedColor] = useState(data.hex);

    function handleCell(i) {
        if (i === CENTER_IDX) return;
        const next = grid.slice();
        next[i] = selectedColor;
        setGrid(next);
    }

    return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
            <div style={{ background: "#fff", borderRadius: 8, padding: 24, width: 300, border: "1px solid #e0e0e0", boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: 1, color: "#111" }}>Edit Face — {faceId}</span>
                    <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#aaa", lineHeight: 1 }}>×</button>
                </div>
                <p style={{ margin: "0 0 14px", fontSize: 11, color: "#bbb" }}>Center sticker is locked</p>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 4, marginBottom: 14 }}>
                    {grid.map((hex, i) => {
                        const isCenter = i === CENTER_IDX;
                        return (
                            <div key={i} onClick={() => handleCell(i)} style={{
                                height: 56, borderRadius: 4, background: hex,
                                border: isCenter ? "2px solid #333" : "1px solid rgba(0,0,0,0.1)",
                                cursor: isCenter ? "not-allowed" : "pointer",
                                position: "relative", transition: "transform 0.1s",
                            }}
                                onMouseEnter={e => { if (!isCenter) e.currentTarget.style.transform = "scale(1.04)"; }}
                                onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
                            >
                                {isCenter && (
                                    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                        <span style={{ fontSize: 12, opacity: 0.5 }}>⬤</span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                <p style={{ color: "#bbb", fontSize: 10, marginBottom: 10, textAlign: "center", letterSpacing: 1, textTransform: "uppercase" }}>Select color · click cell</p>
                <ColorPicker value={selectedColor} onChange={setSelectedColor} />

                <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
                    <button onClick={onClose} style={{ flex: 1, padding: "9px 0", borderRadius: 5, border: "1px solid #ddd", background: "transparent", color: "#888", cursor: "pointer", fontSize: 12 }}>Cancel</button>
                    <button onClick={() => onSave(grid)} style={{ flex: 1, padding: "9px 0", borderRadius: 5, border: "1px solid #111", background: "#111", color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>Save</button>
                </div>
            </div>
        </div>
    );
}

// ─── Cube Move Logic ─────────────────────────────────────────────────────────
function rotateFaceCW(grid) {
    return [grid[6], grid[3], grid[0], grid[7], grid[4], grid[1], grid[8], grid[5], grid[2]];
}
function rotateFaceCCW(grid) {
    return [grid[2], grid[5], grid[8], grid[1], grid[4], grid[7], grid[0], grid[3], grid[6]];
}

const MOVE_DEFS = {
    U: { face: "U", cw: true, cycle: [{ f: "B", i: [2, 1, 0] }, { f: "R", i: [0, 1, 2] }, { f: "F", i: [0, 1, 2] }, { f: "L", i: [0, 1, 2] }] },
    "U'": { face: "U", cw: false, cycle: [{ f: "B", i: [2, 1, 0] }, { f: "R", i: [0, 1, 2] }, { f: "F", i: [0, 1, 2] }, { f: "L", i: [0, 1, 2] }] },
    D: { face: "D", cw: true, cycle: [{ f: "F", i: [6, 7, 8] }, { f: "R", i: [6, 7, 8] }, { f: "B", i: [8, 7, 6] }, { f: "L", i: [6, 7, 8] }] },
    "D'": { face: "D", cw: false, cycle: [{ f: "F", i: [6, 7, 8] }, { f: "R", i: [6, 7, 8] }, { f: "B", i: [8, 7, 6] }, { f: "L", i: [6, 7, 8] }] },
    F: { face: "F", cw: true, cycle: [{ f: "U", i: [6, 7, 8] }, { f: "R", i: [0, 3, 6] }, { f: "D", i: [2, 1, 0] }, { f: "L", i: [8, 5, 2] }] },
    "F'": { face: "F", cw: false, cycle: [{ f: "U", i: [6, 7, 8] }, { f: "R", i: [0, 3, 6] }, { f: "D", i: [2, 1, 0] }, { f: "L", i: [8, 5, 2] }] },
    B: { face: "B", cw: true, cycle: [{ f: "U", i: [2, 1, 0] }, { f: "L", i: [0, 3, 6] }, { f: "D", i: [6, 7, 8] }, { f: "R", i: [8, 5, 2] }] },
    "B'": { face: "B", cw: false, cycle: [{ f: "U", i: [2, 1, 0] }, { f: "L", i: [0, 3, 6] }, { f: "D", i: [6, 7, 8] }, { f: "R", i: [8, 5, 2] }] },
    R: { face: "R", cw: true, cycle: [{ f: "U", i: [2, 5, 8] }, { f: "B", i: [6, 3, 0] }, { f: "D", i: [2, 5, 8] }, { f: "F", i: [2, 5, 8] }] },
    "R'": { face: "R", cw: false, cycle: [{ f: "U", i: [2, 5, 8] }, { f: "B", i: [6, 3, 0] }, { f: "D", i: [2, 5, 8] }, { f: "F", i: [2, 5, 8] }] },
    L: { face: "L", cw: true, cycle: [{ f: "U", i: [0, 3, 6] }, { f: "F", i: [0, 3, 6] }, { f: "D", i: [0, 3, 6] }, { f: "B", i: [8, 5, 2] }] },
    "L'": { face: "L", cw: false, cycle: [{ f: "U", i: [0, 3, 6] }, { f: "F", i: [0, 3, 6] }, { f: "D", i: [0, 3, 6] }, { f: "B", i: [8, 5, 2] }] },
};

function applyMove(scannedFaces, moveName) {
    const def = MOVE_DEFS[moveName];
    if (!def) return scannedFaces;
    const next = {};
    for (const [k, v] of Object.entries(scannedFaces)) {
        next[k] = { ...v, grid: v.grid.slice() };
    }
    if (next[def.face]) {
        next[def.face].grid = def.cw ? rotateFaceCW(next[def.face].grid) : rotateFaceCCW(next[def.face].grid);
    }
    const cycle = def.cycle;
    const strips = cycle.map(({ f, i }) => { const g = next[f]?.grid; return g ? i.map(idx => g[idx]) : [null, null, null]; });
    if (def.cw) {
        for (let s = 0; s < 4; s++) { const src = strips[(s + 3) % 4]; const dst = cycle[s]; if (next[dst.f]) dst.i.forEach((idx, j) => { next[dst.f].grid[idx] = src[j]; }); }
    } else {
        for (let s = 0; s < 4; s++) { const src = strips[(s + 1) % 4]; const dst = cycle[s]; if (next[dst.f]) dst.i.forEach((idx, j) => { next[dst.f].grid[idx] = src[j]; }); }
    }
    return next;
}

// ─── CubeMover component ──────────────────────────────────────────────────────
function CubeMover({ scannedFaces, onApply, disabled }) {
    const [selectedFace, setSelectedFace] = useState("U");
    const [direction, setDirection] = useState("CW");

    const moveName = direction === "CW" ? selectedFace : selectedFace + "'";
    const canApply = !disabled && !!MOVE_DEFS[moveName] && Object.keys(scannedFaces).length === 6;
    const faceButtons = ["U", "F", "R", "B", "L", "D"];
    const faceColors = { U: "white", F: "green", R: "red", B: "blue", L: "orange", D: "yellow" };

    return (
        <div style={{ border: "1px solid #e8e8e8", borderRadius: 8, padding: "14px 16px", background: "#fafafa" }}>
            <div style={{ fontSize: 10, letterSpacing: 2, color: "#aaa", marginBottom: 12, textTransform: "uppercase" }}>Apply Move</div>

            <div style={{ fontSize: 10, color: "#bbb", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>Face</div>
            <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>
                {faceButtons.map(f => {
                    const colorInfo = CUBE_COLORS.find(c => c.name === faceColors[f]);
                    const sel = f === selectedFace;
                    return (
                        <button key={f} onClick={() => setSelectedFace(f)} style={{
                            flex: 1, height: 32, borderRadius: 4,
                            border: sel ? `1px solid ${colorInfo?.hex}` : "1px solid #e0e0e0",
                            background: sel ? colorInfo?.hex : "#fff",
                            color: sel ? (faceColors[f] === "white" || faceColors[f] === "yellow" ? "#333" : "#fff") : "#999",
                            fontSize: 12, fontWeight: 700, cursor: "pointer", transition: "all 0.12s",
                        }}>{f}</button>
                    );
                })}
            </div>

            <div style={{ fontSize: 10, color: "#bbb", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>Direction</div>
            <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
                {[{ id: "CW", label: "↻ CW" }, { id: "CCW", label: "↺ CCW" }].map(d => (
                    <button key={d.id} onClick={() => setDirection(d.id)} style={{
                        flex: 1, height: 32, borderRadius: 4,
                        border: direction === d.id ? "1px solid #111" : "1px solid #e0e0e0",
                        background: direction === d.id ? "#111" : "#fff",
                        color: direction === d.id ? "#fff" : "#999",
                        fontSize: 12, cursor: "pointer", transition: "all 0.12s",
                    }}>{d.label}</button>
                ))}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{
                    width: 44, height: 32, borderRadius: 4, border: "1px solid #e0e0e0", background: "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: "'Courier New',monospace", fontSize: 14, fontWeight: 700,
                    color: canApply ? "#111" : "#ccc",
                }}>{moveName}</div>
                <button onClick={() => canApply && onApply(moveName)} disabled={!canApply} style={{
                    flex: 1, height: 32, borderRadius: 4, border: "none",
                    background: canApply ? "#111" : "#f0f0f0",
                    color: canApply ? "#fff" : "#ccc",
                    fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase",
                    cursor: canApply ? "pointer" : "not-allowed", transition: "all 0.2s",
                }}>
                    {Object.keys(scannedFaces).length < 6 ? "Scan all faces first" : "Apply Move"}
                </button>
            </div>
            {Object.keys(scannedFaces).length === 6 && (
                <div style={{ marginTop: 6, fontSize: 10, color: "#bbb", textAlign: "center" }}>
                    {moveName}: rotate {faceColors[selectedFace]} face {direction === "CW" ? "clockwise" : "counter-clockwise"}
                </div>
            )}
        </div>
    );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function RubikScanner() {
    const videoRef = useRef(null);
    const streamRef = useRef(null);

    const [scannedFaces, setScannedFaces] = useState({});
    const [currentFaceIdx, setCurrentFaceIdx] = useState(0);
    const [isScanning, setIsScanning] = useState(false);
    const [progress, setProgress] = useState(0);
    const [camReady, setCamReady] = useState(false);
    const [camError, setCamError] = useState(null);
    const [debugMode, setDebugMode] = useState(false);
    const [editingFace, setEditingFace] = useState(null);
    const [allDone, setAllDone] = useState(false);

    const currentFace = FACES[currentFaceIdx];
    const scannedCount = Object.keys(scannedFaces).length;
    const validationErrors = scannedCount > 0 ? validateFaces(scannedFaces) : {};
    const hasErrors = Object.keys(validationErrors).length > 0;

    useEffect(() => {
        async function startCam() {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment", width: 1280, height: 720 } });
                streamRef.current = stream;
                if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.onloadedmetadata = () => setCamReady(true); }
            } catch { setCamError("Camera unavailable — running in debug mode."); setDebugMode(true); }
        }
        startCam();
        return () => { streamRef.current?.getTracks().forEach(t => t.stop()); };
    }, []);

    function nextUnscannedIdx(scanned) {
        const idx = FACES.findIndex(f => !scanned[f.id]);
        return idx === -1 ? 0 : idx;
    }

    const handleScan = useCallback(async () => {
        if (isScanning) return;
        setIsScanning(true); setProgress(0);
        const interval = setInterval(() => { setProgress(p => { if (p >= 95) { clearInterval(interval); return 95; } return p + Math.random() * 18; }); }, 180);
        const result = await emulateColorDetection(currentFace.id);
        clearInterval(interval); setProgress(100);
        setTimeout(() => {
            setScannedFaces(prev => {
                const next = { ...prev, [currentFace.id]: result };
                if (Object.keys(next).length === 6) setAllDone(true);
                else setCurrentFaceIdx(nextUnscannedIdx(next));
                return next;
            });
            setIsScanning(false); setProgress(0);
        }, 400);
    }, [isScanning, currentFace]);

    const canScan = !isScanning && (camReady || debugMode);

    function deleteFace(faceId) {
        setScannedFaces(prev => { const next = { ...prev }; delete next[faceId]; setCurrentFaceIdx(FACES.findIndex(f => f.id === faceId)); return next; });
        setAllDone(false);
    }

    function resetAll() { setScannedFaces({}); setCurrentFaceIdx(0); setAllDone(false); setProgress(0); setIsScanning(false); }
    function saveEdit(faceId, newGrid) { setScannedFaces(prev => ({ ...prev, [faceId]: { ...prev[faceId], grid: newGrid } })); setEditingFace(null); }

    return (
        <div style={{ minHeight: "100vh", background: "#fff", fontFamily: "'Helvetica Neue',Arial,sans-serif", color: "#111", maxWidth: 480, margin: "0 auto" }}>
            <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&display=swap" rel="stylesheet" />

            {/* Header */}
            <div style={{ padding: "24px 20px 0", display: "flex", alignItems: "flex-end", justifyContent: "space-between", borderBottom: "1px solid #f0f0f0", paddingBottom: 16 }}>
                <div>
                    <div style={{ fontSize: 10, letterSpacing: 3, color: "#bbb", marginBottom: 4, textTransform: "uppercase" }}>Rubik's Cube</div>
                    <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: -0.5, lineHeight: 1 }}>Face Scanner</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ fontSize: 11, color: "#bbb", fontFamily: "'IBM Plex Mono',monospace" }}>{scannedCount}/6</div>
                    <div style={{ display: "flex", gap: 3 }}>
                        {FACES.map(f => {
                            const hasErr = !!validationErrors[f.id];
                            return <div key={f.id} style={{
                                width: 7, height: 7, borderRadius: 2,
                                background: hasErr ? "#E53935" : scannedFaces[f.id] ? CUBE_COLORS.find(c => c.name === FACE_DEFAULT_COLORS[f.id])?.hex : "#eee",
                                transition: "background 0.3s",
                            }} />;
                        })}
                    </div>
                </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 0, padding: "0 20px" }}>

                {/* Camera */}
                <div style={{ position: "relative", marginTop: 16, borderRadius: 8, overflow: "hidden", aspectRatio: "16/9", background: "#f5f5f5", border: "1px solid #e8e8e8" }}>
                    <video ref={videoRef} autoPlay playsInline muted style={{ width: "100%", height: "100%", objectFit: "cover", display: camReady ? "block" : "none" }} />
                    {!camReady && !camError && (
                        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 8 }}>
                            <div style={{ width: 20, height: 20, border: "2px solid #ddd", borderTop: "2px solid #999", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                            <span style={{ fontSize: 11, color: "#bbb" }}>Starting camera…</span>
                        </div>
                    )}
                    {camError && (
                        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 4, padding: 20, textAlign: "center", background: "#f9f9f9" }}>
                            <div style={{ background: "#fff", borderRadius: 6, padding: "10px 16px", border: "1px solid #e8e8e8", maxWidth: 260 }}>
                                <div style={{ fontSize: 10, letterSpacing: 2, color: "#bbb", marginBottom: 4, textTransform: "uppercase" }}>Debug Mode</div>
                                <span style={{ fontSize: 11, color: "#aaa" }}>No camera — all features available</span>
                            </div>
                        </div>
                    )}
                    {(camReady || debugMode) && !isScanning && (
                        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 3, width: 100, height: 100 }}>
                                {Array(9).fill(0).map((_, i) => <div key={i} style={{ border: "1px solid rgba(0,0,0,0.15)", borderRadius: 3, background: "rgba(255,255,255,0.2)" }} />)}
                            </div>
                        </div>
                    )}
                    {isScanning && (
                        <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.85)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <div style={{ textAlign: "center" }}>
                                <div style={{ fontSize: 10, letterSpacing: 3, color: "#999", marginBottom: 8, textTransform: "uppercase" }}>Analyzing…</div>
                                <div style={{ width: 140, height: 2, background: "#eee", borderRadius: 1, overflow: "hidden" }}>
                                    <div style={{ height: "100%", width: `${progress}%`, background: "#111", borderRadius: 1, transition: "width 0.18s ease" }} />
                                </div>
                                <div style={{ fontSize: 10, color: "#ccc", marginTop: 6 }}>{Math.min(100, Math.round(progress))}%</div>
                            </div>
                        </div>
                    )}
                    {!allDone && (
                        <div style={{ position: "absolute", top: 10, left: 10, background: "rgba(255,255,255,0.9)", borderRadius: 4, padding: "3px 8px", fontSize: 10, color: "#888", fontFamily: "'IBM Plex Mono',monospace", letterSpacing: 1, border: "1px solid #e8e8e8" }}>
                            {currentFace.id} — {scannedCount + 1}/6
                        </div>
                    )}
                </div>

                {/* Instruction */}
                {!allDone && (
                    <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", border: "1px solid #f0f0f0", borderRadius: 6, background: "#fafafa" }}>
                        <div style={{ width: 24, height: 24, borderRadius: 4, background: CUBE_COLORS.find(c => c.name === FACE_SCAN_CONFIG[currentFace.id].faceColor)?.hex, flexShrink: 0, border: "1px solid rgba(0,0,0,0.08)" }} />
                        <div style={{ fontSize: 12, color: "#666", display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
                            <span style={{ fontWeight: 600, color: "#333" }}>{currentFace.label} face</span>
                            <span style={{ color: "#bbb" }}>—</span>
                            <span>scan</span>
                            <ColoredText colorName={FACE_SCAN_CONFIG[currentFace.id].faceColor} />
                            <span>with</span>
                            <ColoredText colorName={FACE_SCAN_CONFIG[currentFace.id].topColor} />
                            <span>up</span>
                        </div>
                    </div>
                )}

                {/* Done banner */}
                {allDone && (
                    <div style={{ marginTop: 10, padding: "12px 14px", border: `1px solid ${hasErrors ? "#fca5a5" : "#d1fae5"}`, borderRadius: 6, background: hasErrors ? "#fff5f5" : "#f0fdf4", textAlign: "center" }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: hasErrors ? "#dc2626" : "#16a34a", marginBottom: 2 }}>{hasErrors ? "Errors detected" : "All faces scanned"}</div>
                        <div style={{ fontSize: 11, color: hasErrors ? "#f87171" : "#4ade80" }}>{hasErrors ? "Fix highlighted issues below." : "Your cube state is ready."}</div>
                    </div>
                )}

                {/* Scan button */}
                {!allDone && (
                    <button onClick={handleScan} disabled={!canScan} style={{
                        marginTop: 10, width: "100%", height: 44, borderRadius: 6,
                        border: canScan ? "1px solid #111" : "1px solid #e0e0e0",
                        background: canScan ? "#111" : "#fafafa",
                        color: canScan ? "#fff" : "#ccc",
                        fontSize: 12, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase",
                        cursor: !canScan ? "not-allowed" : "pointer", transition: "all 0.2s",
                    }}>
                        {isScanning ? "Scanning…" : `Scan ${currentFace.id} Face`}
                    </button>
                )}

                {/* 3D Preview */}
                <div style={{ marginTop: 20 }}>
                    <div style={{ fontSize: 10, letterSpacing: 2, color: "#bbb", textTransform: "uppercase", marginBottom: 8 }}>3D Preview</div>
                    <Cube3D scannedFaces={scannedFaces} debugMode={debugMode} />
                </div>

                {/* Cube Mover */}
                <div style={{ marginTop: 12 }}>
                    <CubeMover
                        scannedFaces={scannedFaces}
                        onApply={moveName => {
                            const next = applyMove(scannedFaces, moveName);
                            setScannedFaces(next);
                        }}
                        disabled={false}
                    />
                </div>

                {/* Scanned faces list */}
                {scannedCount > 0 && (
                    <div style={{ marginTop: 20 }}>
                        <div style={{ fontSize: 10, letterSpacing: 2, color: "#bbb", textTransform: "uppercase", marginBottom: 10 }}>Scanned Faces</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                            {FACES.filter(f => scannedFaces[f.id]).map(face => {
                                const data = scannedFaces[face.id];
                                const colorInfo = CUBE_COLORS.find(c => c.hex === data.hex);
                                const errs = validationErrors[face.id] || [];
                                const hasErr = errs.length > 0;
                                return (
                                    <div key={face.id} style={{ borderRadius: 6, border: `1px solid ${hasErr ? "#fca5a5" : "#ececec"}`, overflow: "hidden", background: hasErr ? "#fff5f5" : "#fff" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px" }}>
                                            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 2, width: 30, height: 30, flexShrink: 0 }}>
                                                {data.grid.map((hex, i) => (
                                                    <div key={i} style={{ background: hex, borderRadius: 1, outline: i === CENTER_IDX ? "1.5px solid rgba(0,0,0,0.2)" : "none" }} />
                                                ))}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 6, color: "#111" }}>
                                                    {face.id} — {face.label}
                                                    {hasErr && <span style={{ fontSize: 9, background: "#dc2626", color: "#fff", borderRadius: 3, padding: "1px 5px", fontWeight: 700, textTransform: "uppercase" }}>{errs.length} issue{errs.length > 1 ? "s" : ""}</span>}
                                                </div>
                                                <div style={{ fontSize: 10, color: "#bbb", textTransform: "capitalize", marginTop: 1 }}>{colorInfo?.name}</div>
                                            </div>
                                            <div style={{ display: "flex", gap: 4 }}>
                                                <button onClick={() => setEditingFace(face.id)} style={{ padding: "4px 8px", borderRadius: 4, border: "1px solid #e0e0e0", background: "#fff", color: "#666", cursor: "pointer", fontSize: 10 }}>Edit</button>
                                                <button onClick={() => deleteFace(face.id)} style={{ padding: "4px 8px", borderRadius: 4, border: "1px solid #fca5a5", background: "#fff", color: "#dc2626", cursor: "pointer", fontSize: 10 }}>Del</button>
                                            </div>
                                        </div>
                                        {hasErr && (
                                            <div style={{ padding: "6px 12px 8px", borderTop: "1px solid #fee2e2" }}>
                                                {errs.map((err, i) => (
                                                    <div key={i} style={{ fontSize: 10, color: "#dc2626", display: "flex", alignItems: "flex-start", gap: 4, marginBottom: i < errs.length - 1 ? 3 : 0 }}>
                                                        <span style={{ flexShrink: 0, marginTop: 1 }}>·</span><span>{err}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {scannedCount > 0 && (
                    <div style={{ margin: "12px 0 32px", display: "flex", justifyContent: "flex-end" }}>
                        <button onClick={resetAll} style={{ padding: "6px 14px", borderRadius: 4, border: "1px solid #fca5a5", background: "transparent", color: "#dc2626", cursor: "pointer", fontSize: 10, letterSpacing: 1, textTransform: "uppercase" }}>Reset all</button>
                    </div>
                )}
            </div>

            {editingFace && scannedFaces[editingFace] && (
                <FaceEditor faceId={editingFace} data={scannedFaces[editingFace]} onSave={grid => saveEdit(editingFace, grid)} onClose={() => setEditingFace(null)} />
            )}

            <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        button:active { opacity: 0.75; }
      `}</style>
        </div>
    );
}

function emulateColorDetection(faceId) {
    return new Promise(resolve => {
        setTimeout(() => {
            const color = FACE_DEFAULT_COLORS[faceId];
            const hex = CUBE_COLORS.find(c => c.name === color).hex;
            resolve({ color, hex, grid: Array(9).fill(hex) });
        }, 2200);
    });
}
