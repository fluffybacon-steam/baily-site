import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * ColumnWorldControls — floating debug/design panel for ColumnWorld.
 *
 *   <ColumnWorldControls world={columnWorldRef.current} />
 */

const INITIAL = {
    gridX: 40, gridZ: 40, spacing: 1.4, rowShift: 0, colShift: 0,
    baseWidth: 0.5, widthVariance: 0, baseHeight: 1.0, heightVariance: 2.0,
    mode: 'radial', frequency: 0.5, magnitude: 3.0, wavelength: 10.0, phase: 0,
    hue: 0, saturation: 0, lightness: 0,
    posX: 0, posY: -8, posZ: -10,
    rotX: 0, rotY: 0, rotZ: 0,
    lightX: 0, lightY: 100, lightZ: 50, lightIntensity: 0.8,
    mouseEnabled: false, mouseMagnitude: 5.0, mouseRadius: 30.0,
    spacingMult: 1.0,
};

const DANCE_MODES = ['radial', 'wave', 'spiral', 'ripple'];

export function ColumnWorldControls({ world, defaultOpen = true }) {
    const [open, setOpen] = useState(defaultOpen);
    const [values, setValues] = useState(() => {
        if (!world) return { ...INITIAL };
        const d = world.getDance();
        const lp = world._topLight?.position;
        return {
            gridX: world._opts.gridX, gridZ: world._opts.gridZ, spacing: world._opts.spacing,
            rowShift: world._opts.rowShift ?? 0, colShift: world._opts.colShift ?? 0,
            baseWidth: world._opts.baseWidth, widthVariance: world._opts.widthVariance ?? 0,
            baseHeight: world._opts.baseHeight,
            heightVariance: world._opts.heightVariance,
            mode: d.mode, frequency: d.frequency, magnitude: d.magnitude,
            wavelength: d.wavelength, phase: d.phase,
            hue: d.colorShift?.hue ?? 0, saturation: d.colorShift?.saturation ?? 0,
            lightness: d.colorShift?.lightness ?? 0,
            posX: world.root.position.x, posY: world.root.position.y, posZ: world.root.position.z,
            rotX: world.root.rotation.x, rotY: world.root.rotation.y, rotZ: world.root.rotation.z,
            lightX: lp?.x ?? 0, lightY: lp?.y ?? 100, lightZ: lp?.z ?? 50,
            lightIntensity: world._topLight?.intensity ?? 0.8,
            mouseEnabled: world._mouse?.enabled ?? false,
            mouseMagnitude: world._mouse?.magnitude ?? 5.0,
            mouseRadius: world._mouse?.radius ?? 30.0,
            spacingMult: world.spacingMult ?? 1.0,
        };
    });

    const [palette, setPalette] = useState(() =>
        world ? world.getPalette() : ['#4f46e5', '#7c3aed', '#2563eb', '#0ea5e9']
    );

    const rebuildTimer = useRef(null);

    const scheduleRebuild = useCallback(() => {
        if (rebuildTimer.current) clearTimeout(rebuildTimer.current);
        rebuildTimer.current = setTimeout(() => { if (world) world.rebuild(); }, 300);
    }, [world]);

    const update = useCallback(
        (key, raw) => {
            const val = typeof raw === 'string' && !isNaN(raw) && key !== 'mode'
                ? parseFloat(raw) : raw;

            setValues(prev => {
                const next = { ...prev, [key]: val };
                if (!world) return next;

                if (['mode', 'frequency', 'magnitude', 'wavelength', 'phase'].includes(key))
                    world.setDance({ [key]: val });

                if (['hue', 'saturation', 'lightness'].includes(key))
                    world.setColorShift({ [key]: val });

                if (['posX', 'posY', 'posZ'].includes(key))
                    world.root.position.set(
                        key === 'posX' ? val : next.posX,
                        key === 'posY' ? val : next.posY,
                        key === 'posZ' ? val : next.posZ,
                    );

                if (['rotX', 'rotY', 'rotZ'].includes(key))
                    world.root.rotation.set(
                        key === 'rotX' ? val : next.rotX,
                        key === 'rotY' ? val : next.rotY,
                        key === 'rotZ' ? val : next.rotZ,
                    );

                if (['gridX', 'gridZ', 'spacing'].includes(key)) {
                    world.setGrid(
                        key === 'gridX' ? val : next.gridX,
                        key === 'gridZ' ? val : next.gridZ,
                        key === 'spacing' ? val : next.spacing,
                    );
                    scheduleRebuild();
                }

                if (['baseWidth', 'widthVariance', 'baseHeight', 'heightVariance', 'rowShift', 'colShift'].includes(key)) {
                    world.setColumnSize({ [key]: val });
                    scheduleRebuild();
                }

                if (['lightX', 'lightY', 'lightZ'].includes(key) && world._topLight)
                    world._topLight.position.set(
                        key === 'lightX' ? val : next.lightX,
                        key === 'lightY' ? val : next.lightY,
                        key === 'lightZ' ? val : next.lightZ,
                    );

                if (key === 'lightIntensity' && world._topLight)
                    world._topLight.intensity = val;

                if (key === 'mouseEnabled') {
                    if (val) world.enableMouse(); else world.disableMouse();
                }
                if (['mouseMagnitude', 'mouseRadius'].includes(key)) {
                    const paramKey = key === 'mouseMagnitude' ? 'magnitude' : 'radius';
                    world.setMouseEffect({ [paramKey]: val });
                }

                if (key === 'spacingMult') world.spacingMult = val;

                return next;
            });
        },
        [world, scheduleRebuild]
    );

    const updatePaletteColor = useCallback(
        (i, hex) => {
            setPalette(prev => {
                const next = [...prev]; next[i] = hex;
                if (world) world.setPalette(next);
                return next;
            });
        }, [world]
    );
    const addColor = useCallback(() => {
        setPalette(prev => { const next = [...prev, '#888888']; if (world) world.setPalette(next); return next; });
    }, [world]);
    const removeColor = useCallback(
        (i) => {
            setPalette(prev => {
                if (prev.length <= 1) return prev;
                const next = prev.filter((_, idx) => idx !== i);
                if (world) world.setPalette(next);
                return next;
            });
        }, [world]
    );

    useEffect(() => () => { if (rebuildTimer.current) clearTimeout(rebuildTimer.current); }, []);

    const [copied, setCopied] = useState(false);
    const exportCode = useCallback(() => {
        const v = values, p = palette, t = '    ';
        const ps = p.map(c => `'${c}'`).join(', ');
        const hasShift = v.hue !== 0 || v.saturation !== 0 || v.lightness !== 0;
        const sb = hasShift ? `\n${t}${t}${t}colorShift: { hue: ${v.hue}, saturation: ${v.saturation}, lightness: ${v.lightness} },` : '';

        const code = `const columns = new ColumnWorld(scene, {
${t}gridX: ${v.gridX}, gridZ: ${v.gridZ},
${t}spacing: ${v.spacing},
${t}rowShift: ${v.rowShift},
${t}colShift: ${v.colShift},
${t}palette: [${ps}],
${t}baseWidth: ${v.baseWidth},
${t}widthVariance: ${v.widthVariance},
${t}baseHeight: ${v.baseHeight},
${t}heightVariance: ${v.heightVariance},
${t}position: { x: ${v.posX}, y: ${v.posY}, z: ${v.posZ} },
${t}rotation: { x: ${rnd(v.rotX)}, y: ${rnd(v.rotY)}, z: ${rnd(v.rotZ)} },
${t}dance: {
${t}${t}mode: '${v.mode}',
${t}${t}frequency: ${v.frequency},
${t}${t}magnitude: ${v.magnitude},
${t}${t}wavelength: ${v.wavelength},
${t}${t}phase: ${rnd(v.phase)},${sb}
${t}},
${t}mouse: { enabled: ${v.mouseEnabled}, magnitude: ${v.mouseMagnitude}, radius: ${v.mouseRadius} },
});
// topLight.position.set(${v.lightX}, ${v.lightY}, ${v.lightZ});  intensity: ${v.lightIntensity}`;

        navigator.clipboard.writeText(code).then(() => {
            setCopied(true); setTimeout(() => setCopied(false), 1500);
        });
    }, [values, palette]);

    return (
        <>
            <style>{STYLES}</style>
            <div className="cw-panel">
                <button className="cw-toggle" onClick={() => setOpen(o => !o)} title="Toggle Column World Controls">
                    <span className={`cw-toggle-icon ${open ? 'cw-open' : ''}`}>&#9776;</span>
                    <span className="cw-toggle-label">Columns</span>
                </button>

                {open && (
                    <div className="cw-body">
                        <Section title="Dance">
                            <SelectRow label="Mode" value={values.mode} options={DANCE_MODES} onChange={v => update('mode', v)} />
                            <NumRow label="Frequency" value={values.frequency} step={0.01} onChange={v => update('frequency', v)} />
                            <NumRow label="Magnitude" value={values.magnitude} step={0.1} onChange={v => update('magnitude', v)} />
                            <NumRow label="Wavelength" value={values.wavelength} step={0.5} onChange={v => update('wavelength', v)} />
                            <NumRow label="Phase" value={values.phase} step={0.01} onChange={v => update('phase', v)} />
                        </Section>

                        <Section title="Color Shift">
                            <NumRow label="Hue °" value={values.hue} step={1} onChange={v => update('hue', v)} />
                            <NumRow label="Saturation" value={values.saturation} step={0.01} onChange={v => update('saturation', v)} />
                            <NumRow label="Lightness" value={values.lightness} step={0.01} onChange={v => update('lightness', v)} />
                        </Section>

                        <Section title="Palette">
                            <div className="cw-palette-grid">
                                {palette.map((hex, i) => (
                                    <div key={i} className="cw-swatch-wrap">
                                        <input type="color" className="cw-swatch" value={hex} onChange={e => updatePaletteColor(i, e.target.value)} />
                                        {palette.length > 1 && <button className="cw-swatch-remove" onClick={() => removeColor(i)} title="Remove">×</button>}
                                    </div>
                                ))}
                                <button className="cw-swatch-add" onClick={addColor} title="Add color">+</button>
                            </div>
                        </Section>

                        <Section title="Grid" badge="rebuild">
                            <NumRow label="Columns" value={values.gridX} step={1} onChange={v => update('gridX', v)} />
                            <NumRow label="Rows" value={values.gridZ} step={1} onChange={v => update('gridZ', v)} />
                            <NumRow label="Spacing" value={values.spacing} step={0.05} onChange={v => update('spacing', v)} />
                            <NumRow label="Spc Mult" value={values.spacingMult} step={0.01} onChange={v => update('spacingMult', v)} />
                            <NumRow label="Row Shift" value={values.rowShift} step={0.1} onChange={v => update('rowShift', v)} />
                            <NumRow label="Col Shift" value={values.colShift} step={0.1} onChange={v => update('colShift', v)} />
                        </Section>

                        <Section title="Geometry" badge="rebuild">
                            <NumRow label="Width" value={values.baseWidth} step={0.05} onChange={v => update('baseWidth', v)} />
                            <NumRow label="W Variance" value={values.widthVariance} step={0.05} onChange={v => update('widthVariance', v)} />
                            <NumRow label="Base H" value={values.baseHeight} step={0.1} onChange={v => update('baseHeight', v)} />
                            <NumRow label="H Variance" value={values.heightVariance} step={0.1} onChange={v => update('heightVariance', v)} />
                        </Section>

                        <Section title="Top Light">
                            <NumRow label="X" value={values.lightX} step={1} onChange={v => update('lightX', v)} />
                            <NumRow label="Y" value={values.lightY} step={1} onChange={v => update('lightY', v)} />
                            <NumRow label="Z" value={values.lightZ} step={1} onChange={v => update('lightZ', v)} />
                            <NumRow label="Intensity" value={values.lightIntensity} step={0.05} onChange={v => update('lightIntensity', v)} />
                        </Section>

                        <Section title="Mouse">
                            <div className="cw-row">
                                <label className="cw-label">Enabled</label>
                                <button
                                    className={`cw-mode-btn ${values.mouseEnabled ? 'cw-active' : ''}`}
                                    style={{ flex: 0, padding: '4px 12px' }}
                                    onClick={() => update('mouseEnabled', !values.mouseEnabled)}>
                                    {values.mouseEnabled ? 'ON' : 'OFF'}
                                </button>
                            </div>
                            <NumRow label="Magnitude" value={values.mouseMagnitude} step={0.5} onChange={v => update('mouseMagnitude', v)} />
                            <NumRow label="Radius" value={values.mouseRadius} step={1} onChange={v => update('mouseRadius', v)} />
                        </Section>

                        <Section title="Position">
                            <NumRow label="X" value={values.posX} step={0.5} onChange={v => update('posX', v)} />
                            <NumRow label="Y" value={values.posY} step={0.5} onChange={v => update('posY', v)} />
                            <NumRow label="Z" value={values.posZ} step={0.5} onChange={v => update('posZ', v)} />
                        </Section>

                        <Section title="Rotation">
                            <NumRow label="X" value={values.rotX} step={0.01} onChange={v => update('rotX', v)} />
                            <NumRow label="Y" value={values.rotY} step={0.01} onChange={v => update('rotY', v)} />
                            <NumRow label="Z" value={values.rotZ} step={0.01} onChange={v => update('rotZ', v)} />
                        </Section>

                        <div className="cw-export-bar">
                            <button className="cw-export-btn" onClick={exportCode}>
                                {copied ? '✓ Copied!' : '⎘ Export Code'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function Section({ title, badge, children }) {
    const [open, setOpen] = useState(true);
    return (
        <div className="cw-section">
            <button className="cw-section-header" onClick={() => setOpen(o => !o)}>
                <span className="cw-section-arrow" style={{ transform: open ? 'rotate(90deg)' : 'rotate(0deg)' }}>&#9654;</span>
                <span className="cw-section-title">{title}</span>
                {badge && <span className="cw-badge">{badge}</span>}
            </button>
            {open && <div className="cw-section-body">{children}</div>}
        </div>
    );
}

function NumRow({ label, value, step = 0.1, onChange }) {
    const display = Number.isInteger(step) ? value : parseFloat(value).toFixed(2);
    const nudge = (dir) => onChange(parseFloat((parseFloat(value) + step * dir).toFixed(10)));
    return (
        <div className="cw-row">
            <label className="cw-label">{label}</label>
            <button className="cw-nudge" onClick={() => nudge(-1)} title={`−${step}`}>−</button>
            <input
                className="cw-num"
                type="number"
                step={step}
                value={display}
                onChange={e => { const v = parseFloat(e.target.value); if (!isNaN(v)) onChange(v); }}
            />
            <button className="cw-nudge" onClick={() => nudge(1)} title={`+${step}`}>+</button>
        </div>
    );
}

function SelectRow({ label, value, options, onChange }) {
    return (
        <div className="cw-row">
            <label className="cw-label">{label}</label>
            <div className="cw-select-wrap">
                {options.map(opt => (
                    <button key={opt} className={`cw-mode-btn ${opt === value ? 'cw-active' : ''}`}
                        onClick={() => onChange(opt)}>{opt}</button>
                ))}
            </div>
        </div>
    );
}

function rnd(v) { return +parseFloat(v).toFixed(4); }

// ─── Styles ──────────────────────────────────────────────────────────────────

const STYLES = `
.cw-panel {
    position: fixed; top: 16px; right: 16px; z-index: 10000;
    font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', 'JetBrains Mono', monospace;
    font-size: 11px; color: #d4d4d8; user-select: none; pointer-events: auto;
}
.cw-toggle {
    display: flex; align-items: center; gap: 6px; padding: 6px 12px;
    border: 1px solid rgba(255,255,255,0.08); border-radius: 8px;
    background: rgba(9,9,11,0.85); backdrop-filter: blur(16px) saturate(1.4);
    color: #a1a1aa; cursor: pointer; font-family: inherit; font-size: 11px;
    transition: border-color 0.2s, color 0.2s; margin-left: auto;
}
.cw-toggle:hover { border-color: rgba(255,255,255,0.18); color: #e4e4e7; }
.cw-toggle-icon { font-size: 12px; transition: transform 0.25s ease; }
.cw-toggle-icon.cw-open { transform: rotate(90deg); }
.cw-toggle-label { text-transform: uppercase; letter-spacing: 0.08em; font-weight: 600; }

.cw-body {
    margin-top: 6px; width: 280px; max-height: calc(100vh - 80px);
    overflow-y: auto; overflow-x: hidden;
    border: 1px solid rgba(255,255,255,0.06); border-radius: 10px;
    background: rgba(9,9,11,0.88); backdrop-filter: blur(20px) saturate(1.4);
    box-shadow: 0 0 0 1px rgba(0,0,0,0.3), 0 8px 32px rgba(0,0,0,0.5),
        inset 0 1px 0 rgba(255,255,255,0.04);
    padding: 4px 0;
}
.cw-body::-webkit-scrollbar { width: 4px; }
.cw-body::-webkit-scrollbar-track { background: transparent; }
.cw-body::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }

.cw-section { border-bottom: 1px solid rgba(255,255,255,0.04); }
.cw-section:last-child { border-bottom: none; }
.cw-section-header {
    display: flex; align-items: center; gap: 6px;
    width: 100%; padding: 8px 12px; border: none; background: none;
    color: #a1a1aa; cursor: pointer; font-family: inherit; font-size: 10px;
    text-transform: uppercase; letter-spacing: 0.1em; font-weight: 600;
    transition: color 0.15s, background 0.15s;
}
.cw-section-header:hover { color: #e4e4e7; background: rgba(255,255,255,0.02); }
.cw-section-arrow { font-size: 7px; transition: transform 0.2s ease; opacity: 0.5; }
.cw-badge {
    margin-left: auto; padding: 1px 5px; border-radius: 3px;
    background: rgba(139,92,246,0.2); color: #a78bfa;
    font-size: 8px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase;
}
.cw-section-body { padding: 2px 12px 10px; }

/* ── Number rows ── */
.cw-row { display: flex; align-items: center; gap: 4px; padding: 3px 0; }
.cw-label {
    width: 56px; flex-shrink: 0; color: #71717a; font-size: 10px;
    text-transform: uppercase; letter-spacing: 0.04em;
}
.cw-num {
    flex: 1; min-width: 0;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.08); border-radius: 4px;
    color: #d4d4d8; font-family: inherit; font-size: 11px;
    font-variant-numeric: tabular-nums;
    padding: 4px 6px; text-align: right; outline: none;
    transition: border-color 0.15s;
    -moz-appearance: textfield;
}
.cw-num::-webkit-inner-spin-button,
.cw-num::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
.cw-num:focus { border-color: rgba(139,92,246,0.5); }

.cw-nudge {
    width: 22px; height: 22px;
    display: flex; align-items: center; justify-content: center;
    border: 1px solid rgba(255,255,255,0.08); border-radius: 4px;
    background: rgba(255,255,255,0.04); color: #71717a;
    font-family: inherit; font-size: 12px; font-weight: 600;
    cursor: pointer; transition: all 0.12s ease;
    padding: 0; line-height: 1; flex-shrink: 0;
}
.cw-nudge:hover {
    background: rgba(139,92,246,0.15); border-color: rgba(139,92,246,0.3); color: #c4b5fd;
}
.cw-nudge:active { transform: scale(0.9); background: rgba(139,92,246,0.25); }

/* ── Mode selector ── */
.cw-select-wrap {
    display: flex; gap: 2px; flex: 1;
    background: rgba(255,255,255,0.04); border-radius: 5px; padding: 2px;
}
.cw-mode-btn {
    flex: 1; padding: 4px 2px; border: none; border-radius: 4px;
    background: transparent; color: #71717a;
    font-family: inherit; font-size: 9px; font-weight: 500;
    text-transform: capitalize; cursor: pointer; transition: all 0.15s ease;
}
.cw-mode-btn:hover { color: #d4d4d8; background: rgba(255,255,255,0.05); }
.cw-mode-btn.cw-active {
    background: rgba(139,92,246,0.25); color: #c4b5fd;
    font-weight: 600; box-shadow: 0 0 8px rgba(139,92,246,0.15);
}

/* ── Palette ── */
.cw-palette-grid { display: flex; flex-wrap: wrap; gap: 6px; padding: 2px 0; }
.cw-swatch-wrap { position: relative; }
.cw-swatch {
    width: 32px; height: 32px;
    border: 2px solid rgba(255,255,255,0.08); border-radius: 6px;
    padding: 0; cursor: pointer; transition: border-color 0.15s, transform 0.15s;
    background: none; -webkit-appearance: none; appearance: none;
}
.cw-swatch::-webkit-color-swatch-wrapper { padding: 0; }
.cw-swatch::-webkit-color-swatch { border: none; border-radius: 4px; }
.cw-swatch::-moz-color-swatch { border: none; border-radius: 4px; }
.cw-swatch:hover { border-color: rgba(255,255,255,0.25); transform: scale(1.08); }
.cw-swatch-remove {
    position: absolute; top: -4px; right: -4px;
    width: 14px; height: 14px; border-radius: 50%;
    border: 1px solid rgba(255,255,255,0.1);
    background: rgba(9,9,11,0.9); color: #71717a;
    font-size: 10px; line-height: 1;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; opacity: 0; transition: opacity 0.15s, color 0.15s; padding: 0;
}
.cw-swatch-wrap:hover .cw-swatch-remove { opacity: 1; }
.cw-swatch-remove:hover { color: #f87171; }
.cw-swatch-add {
    width: 32px; height: 32px;
    border: 2px dashed rgba(255,255,255,0.1); border-radius: 6px;
    background: none; color: #52525b; font-size: 16px;
    cursor: pointer; display: flex; align-items: center; justify-content: center;
    transition: border-color 0.15s, color 0.15s; padding: 0;
}
.cw-swatch-add:hover { border-color: rgba(139,92,246,0.4); color: #a78bfa; }

/* ── Export ── */
.cw-export-bar { padding: 8px 12px 10px; border-top: 1px solid rgba(255,255,255,0.04); }
.cw-export-btn {
    width: 100%; padding: 7px 0;
    border: 1px solid rgba(139,92,246,0.3); border-radius: 6px;
    background: rgba(139,92,246,0.08); color: #c4b5fd;
    font-family: inherit; font-size: 11px; font-weight: 600;
    letter-spacing: 0.04em; cursor: pointer; transition: all 0.2s ease;
}
.cw-export-btn:hover { background: rgba(139,92,246,0.18); border-color: rgba(139,92,246,0.5); color: #e4e4e7; }
.cw-export-btn:active { transform: scale(0.98); }
`;

export default ColumnWorldControls;