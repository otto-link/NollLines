import { useEffect, useRef, useState } from "react";
import p5 from "p5";
import "./App.css";

export default function App() {
    const sketchRef = useRef<HTMLDivElement>(null);
    const p5Instance = useRef<p5 | null>(null);

    const [gridX, setGridX] = useState(256);
    const [gridY, setGridY] = useState(256);
    const [jitter, setJitter] = useState(0.05);
    const [maxLength, setMaxLength] = useState(0.1);
    const [oblicity, setOblicity] = useState(0.0);
    const [skewExponent, setSkewExponent] = useState(4.0);
    const [numLines, setNumLines] = useState(256);
    const [strokeWidth, setStrokeWidth] = useState(8);
    const [seed, setSeed] = useState(42);
    const [showGrid, setShowGrid] = useState(false);
    const [maskCircle, setMaskCircle] = useState(true);
    const [showCircle, setShowCircle] = useState(true);
    const [postFX, setPostFX] = useState(true);

    // -----------------------------
    // Post-FX function definition
    // -----------------------------
    function applyPostFX(s: p5) {
        // grain speckles
        const grainAmount = 3000;
        s.push();
        s.strokeWeight(2);
        for (let n = 0; n < grainAmount; n++) {
            const x = s.random(s.width);
            const y = s.random(s.height);
            const alpha = s.random(20, 50);
            s.stroke(229, 229, 229, alpha);
            s.point(x, y);
        }
        s.pop();
    }

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

                // generate grid points
                const points: { x: number; y: number }[][] = [];

                for (let i = 0; i < gridX; i++) {
                    points[i] = []; // create row

                    for (let j = 0; j < gridY; j++) {
                        points[i][j] = {
                            x: ((i + jitter * (2 * s.random() - 1)) / (gridX - 1)) * s.width,
                            y: ((j + jitter * (2 * s.random() - 1)) / (gridY - 1)) * s.height
                        };
                    }
                }

                // circle constraint
                const cx = s.width / 2;
                const cy = s.height / 2;
                const radius = Math.min(s.width, s.height) / 2 * 0.9;

                function is_in_circle(p: { x: number; y: number }) {
                    const dx = p.x - cx;
                    const dy = p.y - cy;
                    return (!maskCircle) || (dx * dx + dy * dy <= radius * radius);
                }

                // draw grid
                if (showGrid) {
                    s.stroke("#AAAAAA");
                    s.strokeWeight(1.5);

                    for (let i = 0; i < gridX; i++) {
                        for (let j = 0; j < gridY; j++) {
                            const p = points[i][j];
                            if (maskCircle && is_in_circle(p)) {
                                s.point(p.x, p.y);
                            }
                        }
                    }
                }

                // draw circle
                if (maskCircle && showCircle) {
                    s.noFill();
                    s.stroke("#CCCCCC");
                    s.strokeWeight(0.5);
                    s.ellipse(cx, cy, radius * 2, radius * 2);
                }

                // draw lines
                s.strokeWeight(strokeWidth);
                s.stroke("#282828");
                s.strokeCap(s.PROJECT);

                let drawn = 0;          // count only drawn lines
                let attempts = 0;       // optional safety to avoid infinite loops
                const maxAttempts = numLines * 10000; // avoid infinite loops when mask is tight

                while (drawn < numLines && attempts < maxAttempts) {
                    attempts++;

                    // random point indices
                    const i1 = Math.floor(s.random() * (gridX - 1));
                    const j1 = Math.floor(s.random() * (gridY - 1));

                    const dr = Math.pow(s.random(), skewExponent) * maxLength;

                    const angleOffset = (2 * s.random() - 1) * oblicity * s.HALF_PI;
                    const horizontal = s.random() < 0.5;
                    const dtheta = horizontal
                        ? 0 + angleOffset
                        : s.HALF_PI + angleOffset;

                    let di = Math.floor(dr * Math.cos(dtheta) * (gridX - 1));
                    let dj = Math.floor(dr * Math.sin(dtheta) * (gridY - 1));

                    if (di === 0 && dj === 0) {
                        if (s.random() < 0.5) di = 1;
                        else dj = 1;
                    }

                    const i2 = Math.max(0, Math.min(gridX - 1, i1 + di));
                    const j2 = Math.max(0, Math.min(gridY - 1, j1 + dj));

                    const p1 = points[i1][j1];
                    const p2 = points[i2][j2];

                    if (is_in_circle(p1) && is_in_circle(p2)) {
                        s.line(p1.x, p1.y, p2.x, p2.y);
                        drawn++;
                    }
                }

                // --- POST
                if (postFX)
                    applyPostFX(s);
            };
        });
    }, [gridX, gridY, jitter, maxLength, oblicity, skewExponent, numLines, seed, showGrid, maskCircle, showCircle, strokeWidth, postFX]);

    return (
        <div className="app">

            <div className="header">
                <h1 className="title">Computer Composition With Lines</h1>
                <p className="description">
                    This simple interactive UI is inspired by the work of Michael Noll.
                    See the original artwork <a href="https://history.siggraph.org/artwork/a-michael-noll-computer-composition-with-lines/" target="_blank" rel="noopener noreferrer">here</a>.
                </p>
            </div>
            <div className="main">
                {/* UI panel */}
                <div className="ui-panel">
                    <label>
                        Grid X - {gridX}
                        <input
                            type="range"
                            min={2}
                            max={512}
                            value={gridX}
                            onChange={e => setGridX(parseInt(e.target.value))}
                        />
                    </label>

                    <label>
                        Grid Y - {gridY}
                        <input
                            type="range"
                            min={2}
                            max={512}
                            value={gridY}
                            onChange={e => setGridY(parseInt(e.target.value))}
                        />
                    </label>

                    <label>
                        Grid Jitter - {jitter.toFixed(2)}
                        <input
                            type="range"
                            min={0}
                            max={1}
                            step={0.01}
                            value={jitter}
                            onChange={e => setJitter(parseFloat(e.target.value))}
                        />
                    </label>

                    <label>
                        Lines Length - {maxLength.toFixed(2)}
                        <input
                            type="range"
                            min={0}
                            max={1}
                            step={0.01}
                            value={maxLength}
                            onChange={e => setMaxLength(parseFloat(e.target.value))}
                        />
                    </label>

                    <label>
                        Oblicity - {oblicity.toFixed(2)}
                        <input
                            type="range"
                            min={0}
                            max={1}
                            step={0.01}
                            value={oblicity}
                            onChange={e => setOblicity(parseFloat(e.target.value))}
                        />
                    </label>

                    <label>
                        Length Skew Exp. - {skewExponent.toFixed(2)}
                        <input
                            type="range"
                            min={0.1}
                            max={10}
                            step={0.01}
                            value={skewExponent}
                            onChange={e => setSkewExponent(parseFloat(e.target.value))}
                        />
                    </label>

                    <label>
                        Number of Lines - {numLines}
                        <input
                            type="range"
                            min={1}
                            max={512}
                            value={numLines}
                            onChange={e => setNumLines(parseInt(e.target.value))}
                        />
                    </label>

                    <label>
                        Stroke Width - {strokeWidth}
                        <input
                            type="range"
                            min={1}
                            max={16}
                            value={strokeWidth}
                            onChange={e => setStrokeWidth(parseInt(e.target.value))}
                        />
                    </label>

                    <label className="flex flex-col">
                        Seed - {seed}
                        <input
                            type="range"
                            min={0}
                            max={100000}
                            value={seed}
                            onChange={e => setSeed(parseInt(e.target.value))}
                        />
                    </label>

                    <button onClick={() => setShowGrid(!showGrid)}>
                        {showGrid ? "Grid Show - ON" : "Grid Show - OFF"}
                    </button>

                    <button onClick={() => setMaskCircle(!maskCircle)}>
                        {maskCircle ? "Circle Mask - ON" : "Circle Mask - OFF"}
                    </button>

                    <button onClick={() => setShowCircle(!showCircle)}>
                        {showCircle ? "Circle Show - ON" : "Circle Show - OFF"}
                    </button>

                    <button onClick={() => setPostFX(!postFX)}>
                        {postFX ? "Apply Post-FX - ON" : "Circle Show - OFF"}
                    </button>

                </div>

                {/* Sketch */}
                <div className="sketch-container" ref={sketchRef}></div>
            </div>
        </div>
    );
}
