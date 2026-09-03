import { useEffect, useState } from "react";
import "../styles/AnimatedBackground.css";

// Deep-ocean ambient background. Layers (all behind content, pointer-events none):
//   depth gradient · drifting caustic light pools · soft god-rays ·
//   depth-varied floating motes · vignette. Only transform/opacity animate.
export default function AnimatedBackground() {
    const [motes, setMotes] = useState([]);

    useEffect(() => {
        const arr = Array.from({ length: 26 }).map((_, i) => {
            const depth = Math.random(); // 0 = far/small/dim, 1 = near/big/bright
            return {
                id: i,
                left: Math.random() * 100,
                size: 2 + depth * 5,
                opacity: 0.08 + depth * 0.32,
                blur: (1 - depth) * 2.2,
                duration: 24 + Math.random() * 22,
                delay: -Math.random() * 46, // negative → start mid-flight, no empty first frame
                drift: (Math.random() - 0.5) * 70,
            };
        });
        setMotes(arr);
    }, []);

    return (
        <div className="aqua-bg" aria-hidden>
            <div className="aqua-bg__depth" />
            <div className="aqua-bg__caustic aqua-bg__caustic--1" />
            <div className="aqua-bg__caustic aqua-bg__caustic--2" />
            <div className="aqua-bg__caustic aqua-bg__caustic--3" />
            <div className="aqua-bg__rays" />
            <div className="aqua-bg__motes">
                {motes.map((m) => (
                    <span
                        key={m.id}
                        className="aqua-mote"
                        style={{
                            left: `${m.left}%`,
                            width: m.size,
                            height: m.size,
                            opacity: m.opacity,
                            filter: `blur(${m.blur}px)`,
                            animationDuration: `${m.duration}s`,
                            animationDelay: `${m.delay}s`,
                            "--drift": `${m.drift}px`,
                        }}
                    />
                ))}
            </div>
            <div className="aqua-bg__vignette" />
        </div>
    );
}
