import React, { useEffect, useRef, useCallback } from "react";

// Rich, vibrant colors that pop on white backgrounds
const COLORS = [
    { r: 37, g: 99, b: 235 },    // Blue-600
    { r: 79, g: 70, b: 229 },    // Indigo-600
    { r: 139, g: 92, b: 246 },   // Violet-500
    { r: 59, g: 130, b: 246 },   // Blue-500
    { r: 99, g: 102, b: 241 },   // Indigo-500
];

export function NeuralBackground() {
    const canvasRef = useRef(null);
    const particlesRef = useRef([]);
    const mouseRef = useRef({ x: -1000, y: -1000 });
    const animFrameRef = useRef(0);

    const initParticles = useCallback((width, height) => {
        const count = Math.min(Math.floor((width * height) / 9000), 110);
        const particles = [];
        for (let i = 0; i < count; i++) {
            const color = COLORS[Math.floor(Math.random() * COLORS.length)];
            particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * 0.3,
                vy: (Math.random() - 0.5) * 0.3,
                size: 2 + Math.random() * 3,
                baseOpacity: 0.5 + Math.random() * 0.4,
                r: color.r,
                g: color.g,
                b: color.b,
                pulseSpeed: 0.3 + Math.random() * 0.8,
                pulseOffset: Math.random() * Math.PI * 2,
            });
        }
        particlesRef.current = particles;
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const resize = () => {
            const dpr = window.devicePixelRatio || 1;
            canvas.width = window.innerWidth * dpr;
            canvas.height = window.innerHeight * dpr;
            canvas.style.width = `${window.innerWidth}px`;
            canvas.style.height = `${window.innerHeight}px`;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            initParticles(window.innerWidth, window.innerHeight);
        };

        const handleMouse = (e) => {
            mouseRef.current = { x: e.clientX, y: e.clientY };
        };

        resize();
        window.addEventListener("resize", resize);
        window.addEventListener("mousemove", handleMouse);

        let time = 0;
        const connectionDist = 200;

        const draw = () => {
            time += 0.008;
            const w = window.innerWidth;
            const h = window.innerHeight;
            ctx.clearRect(0, 0, w, h);

            const particles = particlesRef.current;
            const mx = mouseRef.current.x;
            const my = mouseRef.current.y;

            // Update positions
            for (let i = 0; i < particles.length; i++) {
                const p = particles[i];

                // Gentle mouse interaction
                const dx = p.x - mx;
                const dy = p.y - my;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 200 && dist > 0) {
                    const force = (200 - dist) / 200;
                    p.vx += (dx / dist) * force * 0.15;
                    p.vy += (dy / dist) * force * 0.15;
                }

                p.vx *= 0.985;
                p.vy *= 0.985;
                p.x += p.vx;
                p.y += p.vy;

                if (p.x < -20) p.x = w + 20;
                if (p.x > w + 20) p.x = -20;
                if (p.y < -20) p.y = h + 20;
                if (p.y > h + 20) p.y = -20;
            }

            // Draw connections (behind particles)
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const a = particles[i];
                    const b = particles[j];
                    const dx = a.x - b.x;
                    const dy = a.y - b.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < connectionDist) {
                        const strength = (1 - dist / connectionDist);
                        const alpha = strength * 0.2;

                        const gradient = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
                        gradient.addColorStop(0, `rgba(${a.r}, ${a.g}, ${a.b}, ${alpha})`);
                        gradient.addColorStop(1, `rgba(${b.r}, ${b.g}, ${b.b}, ${alpha})`);

                        ctx.beginPath();
                        ctx.strokeStyle = gradient;
                        ctx.lineWidth = strength * 1.5;
                        ctx.moveTo(a.x, a.y);
                        ctx.lineTo(b.x, b.y);
                        ctx.stroke();
                    }
                }
            }

            // Draw particles
            for (let i = 0; i < particles.length; i++) {
                const p = particles[i];
                const pulse = Math.sin(time * p.pulseSpeed + p.pulseOffset) * 0.15 + 0.85;
                const opacity = p.baseOpacity * pulse;

                // Mouse proximity boost - nodes near cursor glow brighter
                const mDx = p.x - mx;
                const mDy = p.y - my;
                const mDist = Math.sqrt(mDx * mDx + mDy * mDy);
                const proximityBoost = mDist < 200 ? (1 - mDist / 200) * 0.5 : 0;

                // Outer glow ring
                const boostedOpacity = opacity + proximityBoost;
                const glowSize = p.size * (8 + proximityBoost * 6);
                const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowSize);
                glow.addColorStop(0, `rgba(${p.r}, ${p.g}, ${p.b}, ${boostedOpacity * 0.15})`);
                glow.addColorStop(0.4, `rgba(${p.r}, ${p.g}, ${p.b}, ${boostedOpacity * 0.05})`);
                glow.addColorStop(1, `rgba(${p.r}, ${p.g}, ${p.b}, 0)`);
                ctx.beginPath();
                ctx.fillStyle = glow;
                ctx.arc(p.x, p.y, glowSize, 0, Math.PI * 2);
                ctx.fill();

                // Inner bright core
                const coreGrad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
                coreGrad.addColorStop(0, `rgba(${p.r}, ${p.g}, ${p.b}, ${opacity})`);
                coreGrad.addColorStop(0.6, `rgba(${p.r}, ${p.g}, ${p.b}, ${opacity * 0.7})`);
                coreGrad.addColorStop(1, `rgba(${p.r}, ${p.g}, ${p.b}, 0)`);
                ctx.beginPath();
                ctx.fillStyle = coreGrad;
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();

                // Bright center dot
                ctx.beginPath();
                ctx.fillStyle = `rgba(${Math.min(p.r + 60, 255)}, ${Math.min(p.g + 60, 255)}, ${Math.min(p.b + 60, 255)}, ${opacity * 0.9})`;
                ctx.arc(p.x, p.y, p.size * 0.4, 0, Math.PI * 2);
                ctx.fill();
            }

            animFrameRef.current = requestAnimationFrame(draw);
        };

        animFrameRef.current = requestAnimationFrame(draw);

        return () => {
            cancelAnimationFrame(animFrameRef.current);
            window.removeEventListener("resize", resize);
            window.removeEventListener("mousemove", handleMouse);
        };
    }, [initParticles]);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none"
            style={{ zIndex: 0 }}
        />
    );
}
