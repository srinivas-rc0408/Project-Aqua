import { Suspense, useRef, useState, useEffect, useLayoutEffect, useCallback } from "react";
import { Canvas } from "@react-three/fiber";
import {
    OrbitControls, Environment, Lightformer, ContactShadows, Grid,
    Bounds, useBounds, useProgress, useGLTF, AdaptiveDpr, AdaptiveEvents,
} from "@react-three/drei";
import { useReducedMotion } from "framer-motion";
import { RotateCcw, Move3d } from "lucide-react";
import * as THREE from "three";
import "../styles/Model3D.css";

const MODEL = "/models/robot.glb";
const DRACO = "/draco/"; // self-hosted decoder, no CDN
useGLTF.preload(MODEL, DRACO);

// Center the model on X/Z and rest it on the ground plane (y=0) so the grid + shadow line up.
function Model() {
    const { scene } = useGLTF(MODEL, DRACO);
    useLayoutEffect(() => {
        const box = new THREE.Box3().setFromObject(scene);
        const c = box.getCenter(new THREE.Vector3());
        scene.position.set(-c.x, -box.min.y, -c.z);
        scene.traverse((o) => {
            if (o.isMesh) {
                o.castShadow = false;
                o.frustumCulled = true;
                if (o.material) o.material.envMapIntensity = 0.9;
            }
        });
    }, [scene]);
    return <primitive object={scene} />;
}

// Refit the camera to the model on load, on resize, and whenever the reset button is pressed.
function FitController({ resetKey }) {
    const api = useBounds();
    useEffect(() => {
        const t = setTimeout(() => api.refresh().clip().fit(), 0);
        return () => clearTimeout(t);
    }, [api, resetKey]);
    return null;
}

function Scene({ resetKey, autoRotate, controlsRef, onInteractStart, onInteractEnd }) {
    return (
        <>
            <color attach="background" args={["#070b14"]} />
            <hemisphereLight args={["#dff4ff", "#0a1420", 0.7]} />
            <directionalLight position={[4, 6, 3]} intensity={1.4} />
            <directionalLight position={[-4, 2, -3]} intensity={0.5} color="#8bb6ff" />

            {/* Procedural studio env map (built in-scene from lightformers — no external HDRI). */}
            <Environment resolution={256} frames={1}>
                <Lightformer intensity={2.2} position={[0, 4, -3]} scale={[10, 6, 1]} color="#cfeaff" />
                <Lightformer intensity={1.1} position={[-5, 2, 2]} scale={[6, 6, 1]} color="#7fb4ff" />
                <Lightformer intensity={0.9} position={[5, 1, 2]} scale={[6, 6, 1]} color="#ffffff" />
                <Lightformer intensity={0.7} position={[0, -3, 1]} scale={[10, 4, 1]} color="#22d3ee" />
            </Environment>

            <Bounds fit clip observe margin={1.15}>
                <Suspense fallback={null}>
                    <Model />
                    <FitController resetKey={resetKey} />
                </Suspense>
            </Bounds>

            <ContactShadows position={[0, 0, 0]} opacity={0.55} scale={6} blur={2.6} far={4} resolution={512} color="#000000" />
            <Grid
                position={[0, 0, 0]} args={[12, 12]} cellSize={0.25} cellThickness={0.6}
                cellColor="#1e2a44" sectionSize={1} sectionThickness={1} sectionColor="#22d3ee"
                fadeDistance={11} fadeStrength={1.5} infiniteGrid followCamera={false}
            />

            <OrbitControls
                ref={controlsRef} makeDefault
                enableDamping dampingFactor={0.08} rotateSpeed={0.6} panSpeed={0.6} zoomSpeed={0.7}
                enablePan minDistance={0.4} maxDistance={12} maxPolarAngle={Math.PI * 0.92}
                autoRotate={autoRotate} autoRotateSpeed={0.8}
                onStart={onInteractStart} onEnd={onInteractEnd}
            />

            <AdaptiveDpr pixelated />
            <AdaptiveEvents />
        </>
    );
}

function LoadingOverlay() {
    const { active, progress } = useProgress();
    const [done, setDone] = useState(false);
    useEffect(() => { if (!active && progress >= 100) setDone(true); }, [active, progress]);
    if (done) return null;
    return (
        <div className="m3d-loading" aria-live="polite">
            <span className="m3d-spin" />
            <p>Loading 3D model… <b>{Math.round(progress)}%</b></p>
        </div>
    );
}

export default function Model3D() {
    const reduce = useReducedMotion();
    const controlsRef = useRef(null);
    const resumeTimer = useRef(0);
    const [resetKey, setResetKey] = useState(0);
    const [autoRotate, setAutoRotate] = useState(!reduce);

    useEffect(() => setAutoRotate(!reduce), [reduce]);
    useEffect(() => () => clearTimeout(resumeTimer.current), []);

    // Pause auto-rotate the moment the user grabs the model; ease it back after they let go.
    const onInteractStart = useCallback(() => {
        clearTimeout(resumeTimer.current);
        setAutoRotate(false);
    }, []);
    const onInteractEnd = useCallback(() => {
        if (reduce) return;
        clearTimeout(resumeTimer.current);
        resumeTimer.current = setTimeout(() => setAutoRotate(true), 2500);
    }, [reduce]);

    const resetView = useCallback(() => {
        controlsRef.current?.reset();
        setResetKey((k) => k + 1);
        if (!reduce) setAutoRotate(true);
    }, [reduce]);

    return (
        <section className="m3d" aria-label="3D model of the robot">
            <div className="m3d-head">
                <span className="m3d-kicker">Hardware</span>
                <h3 className="m3d-title">View the 3D Model</h3>
                <p className="m3d-sub">Drag to orbit, scroll or pinch to zoom, right-drag to pan. A real 3D scan of our submersible robot.</p>
            </div>

            <div className="m3d-stage">
                <Canvas
                    className="m3d-canvas"
                    shadows={false}
                    dpr={[1, 2]}
                    gl={{ antialias: true, powerPreference: "high-performance", preserveDrawingBuffer: false }}
                    camera={{ position: [1.6, 1.1, 1.9], fov: 42, near: 0.01, far: 100 }}
                >
                    <Scene
                        resetKey={resetKey} autoRotate={autoRotate} controlsRef={controlsRef}
                        onInteractStart={onInteractStart} onInteractEnd={onInteractEnd}
                    />
                </Canvas>

                <LoadingOverlay />

                <button type="button" className="m3d-reset" onClick={resetView} title="Reset view">
                    <RotateCcw size={15} /> Reset view
                </button>
                <span className="m3d-hint"><Move3d size={13} /> Drag to explore</span>
            </div>

            <p className="m3d-caption">3D model of our hardware.</p>
        </section>
    );
}
