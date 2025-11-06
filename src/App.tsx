import { useEffect, useRef, useState } from "react";
import p5 from "p5";
import "./App.css";

export default function App() {
    const sketchRef = useRef<HTMLDivElement>(null);
    const p5Instance = useRef<p5 | null>(null);

    const [gridX, setGridX] = useState(32);
    const [gridY, setGridY] = useState(32);
    const [numLines, setNumLines] = useState(64);
    const [strokeWidth, setStrokeWidth] = useState(2);
    const [seed, setSeed] = useState(0);
    const [showGrid, setShowGrid] = useState(false);
    const [maskCircle, setMaskCircle] = useState(true);
    const [showCircle, setShowCircle] = useState(false);

    useEffect(() => {
        if (p5Instance.current) p5Instance.current.remove();

        p5Instance.current = new p5((s: p5) => {
            s.setup = () => {
                const canvas = s.createCanvas(600, 600);
                canvas.parent(sketchRef.current!);
                s.clear();
                s.noLoop();
            };

            s.draw = () => {

                s.randomSeed(Math.floor(seed));

                // Generate grid points
                const points: { x: number; y: number }[] = [];
                for (let i = 0; i < gridX; i++) {
                    for (let j = 0; j < gridY; j++) {
                        points.push({
                            x: (i / (gridX - 1)) * s.width,
                            y: (j / (gridY - 1)) * s.height
                        });
                    }
                }

                // filter
                const cx = s.width / 2;
                const cy = s.height / 2;
                const radius = Math.min(s.width, s.height) / 2 * 0.9; // 90% of half the canvas

                let filteredPoints = points;

                if (maskCircle) {
                    filteredPoints = points.filter(p => {
                        const dx = p.x - cx;
                        const dy = p.y - cy;
                        return dx * dx + dy * dy <= radius * radius;
                    });

                    if (showCircle) {
                        s.noFill();
                        s.stroke("#AAAAAA");
                        s.strokeWeight(0.5);
                        s.ellipse(cx, cy, radius * 2, radius * 2);
                    }
                }

                // Draw points
                if (showGrid) {
                    for (const p of filteredPoints) {
                        s.stroke("#AAAAAA");
                        s.strokeWeight(2);
                        s.point(p.x, p.y);
                    }
                }

                // Draw lines
                s.strokeWeight(strokeWidth);
                s.stroke("#282828");
		s.strokeCap(s.PROJECT);

                for (let n = 0; n < numLines; n++) {
                    const p1 = filteredPoints[Math.floor(s.random() * filteredPoints.length)];
                    const p2 = filteredPoints[Math.floor(s.random() * filteredPoints.length)];
                    s.line(p1.x, p1.y, p2.x, p2.y);
                }
            };
        });
    }, [gridX, gridY, numLines, seed, showGrid, maskCircle, showCircle, strokeWidth]);

    return (
        <div className="app">
            <h1 className="title">Noll — Computer Composition With Lines</h1>

            <div className="main">
                {/* UI panel */}
                <div className="ui-panel">
                    <label>
                        Grid X: {gridX}
                        <input
                            type="range"
                            min={2}
                            max={256}
                            value={gridX}
                            onChange={e => setGridX(parseInt(e.target.value))}
                        />
                    </label>

                    <label>
                        Grid Y: {gridY}
                        <input
                            type="range"
                            min={2}
                            max={256}
                            value={gridY}
                            onChange={e => setGridY(parseInt(e.target.value))}
                        />
                    </label>

                    <label>
                        Number of Lines: {numLines}
                        <input
                            type="range"
                            min={1}
                            max={128}
                            value={numLines}
                            onChange={e => setNumLines(parseInt(e.target.value))}
                        />
                    </label>

                    <label>
                        Stroke Width: {strokeWidth}
                        <input
                            type="range"
                            min={1}
                            max={16}
                            value={strokeWidth}
                            onChange={e => setStrokeWidth(parseInt(e.target.value))}
                        />
                    </label>

                    <label className="flex flex-col">
                        Seed: {seed}
                        <input
                            type="range"
                            min={0}
                            max={100000}
                            value={seed}
                            onChange={e => setSeed(parseInt(e.target.value))}
                        />
                    </label>

                    <button onClick={() => setShowGrid(!showGrid)}>
                        {showGrid ? "Grid Show: ON" : "Grid Show: OFF"}
                    </button>

                    <button onClick={() => setMaskCircle(!maskCircle)}>
                        {maskCircle ? "Circle Mask: ON" : "Circle Mask: OFF"}
                    </button>

                    <button onClick={() => setShowCircle(!showCircle)}>
                        {showCircle ? "Circle Show: ON" : "Circle Show: OFF"}
                    </button>

                </div>

                {/* Sketch */}
                <div className="sketch-container" ref={sketchRef}></div>
            </div>
        </div>
    );
}
