import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useReducedMotion } from "framer-motion";
import { Layers, RotateCcw } from "lucide-react";
import { HARDWARE_BOM } from "../data/hardwareBom";
import "../styles/HardwareReveal.css";

const ASSEMBLED = "/media/robot-assembled.png";
const EXPLODED = "/media/robot-exploded.png";

// Normalized anchors over the EXPLODED image, in % of the stage box.
// (x,y) = the point on the part; (lx,ly) = where the text chip sits.
// Estimated from the exploded infographic — tune to your actual crop.
const LABELS = [
    { id: "buoyancy_foam",   x: 42, y: 15, lx: 42, ly: 4  },
    { id: "front_dome",      x: 9,  y: 50, lx: 6,  ly: 76 },
    { id: "led_ring",        x: 19, y: 46, lx: 18, ly: 92 },
    { id: "esp32_cam",       x: 30, y: 54, lx: 33, ly: 92 },
    { id: "oring",           x: 38, y: 56, lx: 30, ly: 6  },
    { id: "main_tube",       x: 50, y: 50, lx: 52, ly: 7  },
    { id: "imu_mount",       x: 56, y: 46, lx: 66, ly: 8  },
    { id: "electronics_tray",x: 52, y: 58, lx: 58, ly: 92 },
    { id: "sensor_mounts",   x: 46, y: 64, lx: 42, ly: 94 },
    { id: "rear_cap",        x: 72, y: 50, lx: 74, ly: 84 },
    { id: "thruster",        x: 85, y: 38, lx: 92, ly: 18 },
    { id: "propeller",       x: 85, y: 62, lx: 92, ly: 82 },
    { id: "tether_mount",    x: 95, y: 50, lx: 96, ly: 62 },
];

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

export default function HardwareReveal() {
    const reduce = useReducedMotion();
    const trackRef = useRef(null);
    const rafRef = useRef(0);
    const animRef = useRef(0);
    const overrideRef = useRef(null); // manual (slider/toggle) value, or null when scroll-driven
    const progressRef = useRef(reduce ? 1 : 0);

    const [progress, setProgressState] = useState(reduce ? 1 : 0);
    const [near, setNear] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const [failed, setFailed] = useState(false);
    const [active, setActive] = useState(null);

    const bomById = useMemo(
        () => Object.fromEntries(HARDWARE_BOM.map((p) => [p.id, p])),
        []
    );
    const setProgress = useCallback((v) => { progressRef.current = v; setProgressState(v); }, []);

    // Load the images only when the section nears the viewport (keeps first paint fast).
    useEffect(() => {
        const el = trackRef.current;
        if (!el) return;
        const io = new IntersectionObserver(
            (entries) => { if (entries.some((e) => e.isIntersecting)) { setNear(true); io.disconnect(); } },
            { rootMargin: "300px" }
        );
        io.observe(el);
        return () => io.disconnect();
    }, []);

    // Decode both renders once near; surface a clear state if they aren't there yet.
    useEffect(() => {
        if (!near) return;
        let alive = true;
        Promise.all(
            [ASSEMBLED, EXPLODED].map((src) => {
                const img = new Image();
                img.src = src;
                return img.decode ? img.decode() : new Promise((res, rej) => { img.onload = res; img.onerror = rej; });
            })
        )
            .then(() => alive && setLoaded(true))
            .catch(() => alive && setFailed(true));
        return () => { alive = false; };
    }, [near]);

    // Scroll drives progress while the section is pinned (skipped under reduced motion).
    useEffect(() => {
        if (reduce) return;
        const onScroll = () => {
            overrideRef.current = null; // real scrolling reclaims control from the slider/toggle
            if (rafRef.current) return;
            rafRef.current = requestAnimationFrame(() => {
                rafRef.current = 0;
                const el = trackRef.current;
                if (!el) return;
                const total = el.offsetHeight - window.innerHeight;
                const p = total > 0 ? clamp(-el.getBoundingClientRect().top / total, 0, 1) : 0;
                setProgress(p);
            });
        };
        window.addEventListener("scroll", onScroll, { passive: true });
        onScroll();
        return () => {
            window.removeEventListener("scroll", onScroll);
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [reduce, setProgress]);

    const setManual = useCallback((v) => { overrideRef.current = v; setProgress(v); }, [setProgress]);

    // Explode/assemble toggle — eased when motion is allowed, instant under reduced motion.
    const goTo = useCallback((target) => {
        cancelAnimationFrame(animRef.current);
        if (reduce) { setManual(target); return; }
        const from = overrideRef.current ?? progressRef.current;
        let startTs = null;
        const step = (now) => {
            if (startTs === null) startTs = now;
            const t = clamp((now - startTs) / 650, 0, 1);
            setManual(from + (target - from) * easeInOut(t));
            if (t < 1) animRef.current = requestAnimationFrame(step);
        };
        animRef.current = requestAnimationFrame(step);
    }, [reduce, setManual]);

    useEffect(() => () => cancelAnimationFrame(animRef.current), []);

    const labelOpacity = clamp((progress - 0.5) / 0.25, 0, 1);
    const exploded = progress > 0.5;
    const part = active ? bomById[active] : null;

    return (
        <section id="hardware" className="hwr" aria-label="Explore the hardware">
            <div className="hwr-head">
                <span className="hwr-kicker">Hardware</span>
                <h3 className="hwr-title">Explore the Hardware</h3>
                <p className="hwr-sub">Scroll to take the robot apart — or drag the slider. Each part is labelled from our bill of materials.</p>
            </div>

            <div className="hwr-track" ref={trackRef} style={reduce ? undefined : { height: "240vh" }}>
                <div className="hwr-sticky">
                    <div className="hwr-stage" onMouseLeave={() => setActive(null)}>
                        {loaded && (
                            <>
                                <img
                                    className="hwr-img" src={ASSEMBLED} alt="Assembled robot" draggable={false}
                                    style={{ opacity: 1 - progress, transform: `scale(${1 + progress * 0.05})` }}
                                />
                                <img
                                    className="hwr-img" src={EXPLODED} alt="Exploded view of the robot" draggable={false}
                                    style={{ opacity: progress, transform: `scale(${1.05 - progress * 0.05})` }}
                                />

                                <svg className="hwr-lines" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ opacity: labelOpacity }} aria-hidden="true">
                                    {LABELS.map((l) => (
                                        <line key={l.id} x1={l.x} y1={l.y} x2={l.lx} y2={l.ly}
                                            className={`hwr-line${active === l.id ? " on" : ""}${active && active !== l.id ? " dim" : ""}`} />
                                    ))}
                                </svg>

                                {LABELS.map((l) => (
                                    <span key={`${l.id}-dot`} className={`hwr-dot${active === l.id ? " on" : ""}`}
                                        style={{ left: `${l.x}%`, top: `${l.y}%`, opacity: labelOpacity }} aria-hidden="true" />
                                ))}

                                {LABELS.map((l) => {
                                    const p = bomById[l.id];
                                    if (!p) return null;
                                    return (
                                        <button
                                            key={`${l.id}-chip`} type="button"
                                            className={`hwr-chip${active === l.id ? " on" : ""}${active && active !== l.id ? " dim" : ""}`}
                                            style={{ left: `${l.lx}%`, top: `${l.ly}%`, opacity: labelOpacity, pointerEvents: labelOpacity > 0.3 ? "auto" : "none" }}
                                            onMouseEnter={() => setActive(l.id)}
                                            onFocus={() => setActive(l.id)}
                                            onClick={() => setActive((a) => (a === l.id ? null : l.id))}
                                        >
                                            {p.name}{p.qty > 1 && <em>×{p.qty}</em>}
                                        </button>
                                    );
                                })}

                                {part && (
                                    <div className="hwr-card" role="status">
                                        <h5>{part.name}</h5>
                                        <dl>
                                            <div><dt>Material</dt><dd>{part.material}</dd></div>
                                            <div><dt>Qty</dt><dd>{part.qty}</dd></div>
                                        </dl>
                                    </div>
                                )}
                            </>
                        )}

                        {!loaded && !failed && (
                            <div className="hwr-state">
                                <span className="hwr-spin" />
                                <p>Loading hardware view…</p>
                            </div>
                        )}

                        {failed && (
                            <div className="hwr-state hwr-missing">
                                <p className="hwr-missing__head">Renders not found</p>
                                <p>Add <code>robot-assembled.png</code> and <code>robot-exploded.png</code> to <code>public/media/</code>, then reload.</p>
                            </div>
                        )}
                    </div>

                    <div className="hwr-controls">
                        <button type="button" className="hwr-btn" onClick={() => goTo(exploded ? 0 : 1)} disabled={!loaded}>
                            <Layers size={16} /> {exploded ? "Assemble" : "Explode"}
                        </button>
                        <input
                            className="hwr-slider" type="range" min="0" max="1" step="0.001" value={progress}
                            onChange={(e) => setManual(parseFloat(e.target.value))}
                            disabled={!loaded} aria-label="Explode amount"
                        />
                        <button type="button" className="hwr-btn hwr-btn--ghost" onClick={() => setManual(0)} disabled={!loaded} title="Reset view">
                            <RotateCcw size={16} /> Reset
                        </button>
                    </div>

                    <p className="hwr-caption">Exploded-view render of our hardware design.</p>
                </div>
            </div>
        </section>
    );
}
