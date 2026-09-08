import { useEffect, useRef, useState, useCallback } from "react";
import { useReducedMotion } from "framer-motion";

import "../styles/HardwareReveal.css";

const EXPLODED = "/media/robot-exploded.png";

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

export default function HardwareReveal() {
    const reduce = useReducedMotion();
    const trackRef = useRef(null);
    const rafRef = useRef(0);

    const [progress, setProgress] = useState(0);
    const [near, setNear] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const [failed, setFailed] = useState(false);

    // Load the render only when the section nears the viewport (keeps first paint fast).
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

    // Decode the image once near; surface a clear state if it isn't there yet.
    useEffect(() => {
        if (!near) return;
        let alive = true;
        const img = new Image();
        img.src = EXPLODED;
        (img.decode ? img.decode() : new Promise((res, rej) => { img.onload = res; img.onerror = rej; }))
            .then(() => alive && setLoaded(true))
            .catch(() => alive && setFailed(true));
        return () => { alive = false; };
    }, [near]);

    // Scroll drives a slow zoom/parallax while the section is pinned (skipped under reduced motion).
    const onScroll = useCallback(() => {
        if (rafRef.current) return;
        rafRef.current = requestAnimationFrame(() => {
            rafRef.current = 0;
            const el = trackRef.current;
            if (!el) return;
            const total = el.offsetHeight - window.innerHeight;
            setProgress(total > 0 ? clamp(-el.getBoundingClientRect().top / total, 0, 1) : 0);
        });
    }, []);

    useEffect(() => {
        if (reduce) return;
        window.addEventListener("scroll", onScroll, { passive: true });
        onScroll();
        return () => {
            window.removeEventListener("scroll", onScroll);
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [reduce, onScroll]);

    // Ken-Burns transform: settle from a slight zoom-in to fitted as you scroll through.
    const scale = reduce ? 1 : 1.08 - progress * 0.08;
    const shiftY = reduce ? 0 : (0.5 - progress) * 3; // drifts a touch as it settles

    return (
        <section id="hardware" className="hwr" aria-label="Explore the hardware">
            <div className="hwr-head">
                <span className="hwr-kicker">Hardware</span>
                <h3 className="hwr-title">Explore the Hardware</h3>
                <p className="hwr-sub">Every part of the robot — dome, sensors, electronics tray, thrusters and hull — pulled apart in one exploded engineering view.</p>
            </div>

            <div className="hwr-track" ref={trackRef} style={reduce ? undefined : { height: "220vh" }}>
                <div className="hwr-sticky">
                    <div className="hwr-stage">
                        {loaded && (
                            <img
                                className="hwr-img" src={EXPLODED} alt="Exploded engineering view of the submersible micro robot"
                                draggable={false}
                                style={{ transform: `scale(${scale}) translateY(${shiftY}%)` }}
                            />
                        )}

                        {!loaded && !failed && (
                            <div className="hwr-state">
                                <span className="hwr-spin" />
                                <p>Loading hardware view…</p>
                            </div>
                        )}

                        {failed && (
                            <div className="hwr-state hwr-missing">
                                <p className="hwr-missing__head">Render not found</p>
                                <p>Add <code>robot-exploded.png</code> to <code>public/media/</code>, then reload.</p>
                            </div>
                        )}
                    </div>

                    <p className="hwr-caption">Exploded-view render of our hardware design.</p>
                </div>
            </div>
        </section>
    );
}
