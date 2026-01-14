import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export default function TransparentHalo() {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const ringRef = useRef(null);
  const staticRingRef = useRef(null);
  const pointLightRef = useRef(null);
  const ambientLightRef = useRef(null);
  const bloomPassRef = useRef(null);
  
  const [showControls, setShowControls] = useState(true);
  
  const uniforms = useRef({
    uTime: { value: 0 },
    uAmplitude: { value: 0.3 },
    uFrequency: { value: 2.0 },
    uSpeed: { value: 1.5 },
    uColor: { value: new THREE.Color(0x00aeef) }
  });

  const controls = useRef(
    // Rotation
   {
  uAmplitude: 0.16,
  uFrequency: 0.7,
  uSpeed: 0.1,
  uColor: '#00678f',
  rotationX: -0.14,
  rotationY: 0,
  rotationZ: 0.002,
  autoRotate: false,
  bloomStrength: 1.2,
  bloomThreshold: 0.1,
  bloomRadius: 0.4,
  ambientIntensity: 0.5,
  pointLightIntensity: 5,
  pointLightX: 5,
  pointLightY: 5,
  pointLightZ: 5,
  cameraZ: 5,
  fov: 75,
  ringRadius: 2.5,
  tubeRadius: 0.15,
  metalness: 0.9,
  roughness: 0.1,
  minWobble: 0,
  maxWobble: 1
}
  );

  // --- Persistence helpers ---
  const loadSavedSettings = () => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem('haloSettings');
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      console.warn('Failed to parse saved halo settings:', e);
      return null;
    }
  };

  const applySavedSettings = (settings) => {
    if (!settings) return;

    // Uniforms
    if (settings.uAmplitude !== undefined) uniforms.current.uAmplitude.value = parseFloat(settings.uAmplitude);
    if (settings.uFrequency !== undefined) uniforms.current.uFrequency.value = parseFloat(settings.uFrequency);
    if (settings.uSpeed !== undefined) uniforms.current.uSpeed.value = parseFloat(settings.uSpeed);
    if (settings.uColor) uniforms.current.uColor.value.set(settings.uColor);

    // Controls
    const ctrlMap = {
      rotationX: 'rotationX', rotationY: 'rotationY', rotationZ: 'rotationZ', autoRotate: 'autoRotate',
      bloomStrength: 'bloomStrength', bloomThreshold: 'bloomThreshold', bloomRadius: 'bloomRadius',
      ambientIntensity: 'ambientIntensity', pointLightIntensity: 'pointLightIntensity',
      pointLightX: 'pointLightX', pointLightY: 'pointLightY', pointLightZ: 'pointLightZ',
      cameraZ: 'cameraZ', fov: 'fov', ringRadius: 'ringRadius', tubeRadius: 'tubeRadius',
      metalness: 'metalness', roughness: 'roughness', minWobble: 'minWobble', maxWobble: 'maxWobble'
    };

    Object.keys(ctrlMap).forEach((k) => {
      if (settings[k] !== undefined) controls.current[k] = settings[k];
    });
  };

  const saveSettingsToStorage = (settings) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('haloSettings', JSON.stringify(settings));
    } catch (e) {
      console.warn('Failed to save halo settings:', e);
    }
  };


  useEffect(() => {
    // Apply saved settings (if any) before creating the scene so initial objects use them
    const saved = loadSavedSettings();
    if (saved) applySavedSettings(saved);

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    
    const camera = new THREE.PerspectiveCamera(
      controls.current.fov, 
      window.innerWidth / window.innerHeight, 
      0.1, 
      1000
    );
    camera.position.z = controls.current.cameraZ;
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      premultipliedAlpha: false
    });
    renderer.setClearColor(0x000000, 0); 
    renderer.setSize(mountRef.current.offsetWidth, mountRef.current.offsetHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Geometry & Shader
    const geometry = new THREE.TorusGeometry(
      controls.current.ringRadius, 
      controls.current.tubeRadius, 
      64, 
      256
    );
    
    const material = new THREE.MeshStandardMaterial({
      color: uniforms.current.uColor.value,
      metalness: controls.current.metalness,
      roughness: controls.current.roughness,
      emissive: uniforms.current.uColor.value,
      emissiveIntensity: 0.3
    });

    material.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = uniforms.current.uTime;
      shader.uniforms.uAmplitude = uniforms.current.uAmplitude;
      shader.uniforms.uFrequency = uniforms.current.uFrequency;
      shader.uniforms.uSpeed = uniforms.current.uSpeed;

      shader.vertexShader = `
        uniform float uTime;
        uniform float uAmplitude;
        uniform float uFrequency;
        uniform float uSpeed;

        vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
        float snoise(vec3 v) {
          const vec2 C = vec2(1.0/6.0, 1.0/3.0);
          const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
          vec3 i  = floor(v + dot(v, C.yyy));
          vec3 x0 = v - i + dot(i, C.xxx);
          vec3 g = step(x0.yzx, x0.xyz);
          vec3 l = 1.0 - g;
          vec3 i1 = min( g.xyz, l.zxy );
          vec3 i2 = max( g.xyz, l.zxy );
          vec3 x1 = x0 - i1 + C.xxx;
          vec3 x2 = x0 - i2 + C.yyy;
          vec3 x3 = x0 - D.yyy;
          i = mod289(i);
          vec4 p = permute( permute( permute( i.z + vec4(0.0, i1.z, i2.z, 1.0 )) + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
          vec4 j = p - 49.0 * floor(p * (1.0 / 49.0));
          vec4 x_ = floor(j * (1.0 / 7.0));
          vec4 y_ = floor(j - 7.0 * x_ );
          vec4 x = x_ * (1.0/7.0) + 0.5/7.0;
          vec4 y = y_ * (1.0/7.0) + 0.5/7.0;
          vec4 h = 1.0 - abs(x) - abs(y);
          vec4 b0 = vec4( x.xy, y.xy );
          vec4 b1 = vec4( x.zw, y.zw );
          vec4 s0 = floor(b0)*2.0 + 1.0;
          vec4 s1 = floor(b1)*2.0 + 1.0;
          vec4 sh = -step(h, vec4(0.0));
          vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
          vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
          vec3 p0 = vec3(a0.xy,h.x);
          vec3 p1 = vec3(a0.zw,h.y);
          vec3 p2 = vec3(a1.xy,h.z);
          vec3 p3 = vec3(a1.zw,h.w);
          vec4 norm = 1.79284291400159 - 0.85373472095314 * vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3));
          p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
          vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
          m = m * m;
          return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
        }

        ${shader.vertexShader}
      `.replace(
        `#include <begin_vertex>`,
        `
        float noise = snoise(vec3(position.xy * uFrequency, uTime * uSpeed));
        float displacement = noise * uAmplitude;
        vec3 transformed = vec3(position) + normal * displacement;
        `
      );
    };

    const ring = new THREE.Mesh(geometry, material);
    scene.add(ring);
    ringRef.current = ring;

    // Add static reference torus
    const staticGeometry = new THREE.TorusGeometry(
      controls.current.ringRadius, 
      controls.current.tubeRadius, 
      64, 
      256
    );
    const staticMaterial = new THREE.MeshStandardMaterial({
      color: 0x00aeef,
      metalness: 0.5,
      roughness: 0.5,
      transparent: true,
      opacity: 1
    });
    const staticRing = new THREE.Mesh(staticGeometry, staticMaterial);
    scene.add(staticRing);
    staticRingRef.current = staticRing;
   
    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, controls.current.ambientIntensity);
    scene.add(ambientLight);
    ambientLightRef.current = ambientLight;
    
    const pLight = new THREE.PointLight(0xffffff, controls.current.pointLightIntensity);
    pLight.position.set(
      controls.current.pointLightX, 
      controls.current.pointLightY, 
      controls.current.pointLightZ
    );
    scene.add(pLight);
    pointLightRef.current = pLight;

    const animate = () => {
      requestAnimationFrame(animate);
      uniforms.current.uTime.value = performance.now() / 1000;
      
      if (controls.current.autoRotate) {
        ring.rotation.x += controls.current.rotationX;
        ring.rotation.y += controls.current.rotationY;
        ring.rotation.z += controls.current.rotationZ;
        
        staticRing.rotation.x += controls.current.rotationX;
        staticRing.rotation.y += controls.current.rotationY;
        staticRing.rotation.z += controls.current.rotationZ;
      } else {
        ring.rotation.x = controls.current.rotationX * 10;
        ring.rotation.y = controls.current.rotationY * 10;
        ring.rotation.z = controls.current.rotationZ * 10;
        
        staticRing.rotation.x = controls.current.rotationX * 10;
        staticRing.rotation.y = controls.current.rotationY * 10;
        staticRing.rotation.z = controls.current.rotationZ * 10;
      }
      
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      mountRef.current?.removeChild(renderer.domElement);
      geometry.dispose();
      material.dispose();
      staticGeometry.dispose();
      staticMaterial.dispose();
      renderer.dispose();
    };
  }, []);

  const updateUniform = (key, val) => {
    if (key === 'uColor') {
      uniforms.current[key].value.set(val);
      if (ringRef.current) {
        ringRef.current.material.color.set(val);
        ringRef.current.material.emissive.set(val);
      }
    } else {
      let numVal = parseFloat(val);
      
      // Clamp wobble to min/max limits
      if (key === 'uAmplitude') {
        numVal = Math.max(controls.current.minWobble, Math.min(controls.current.maxWobble, numVal));
      }
      
      uniforms.current[key].value = numVal;
    }
  };

  const updateControl = (key, val) => {
    const numVal = parseFloat(val);
    controls.current[key] = numVal;
    
    // Apply updates to existing objects
    if (key === 'ambientIntensity' && ambientLightRef.current) {
      ambientLightRef.current.intensity = numVal;
    } else if (key === 'pointLightIntensity' && pointLightRef.current) {
      pointLightRef.current.intensity = numVal;
    } else if (key.startsWith('pointLight') && pointLightRef.current) {
      if (key === 'pointLightX') pointLightRef.current.position.x = numVal;
      if (key === 'pointLightY') pointLightRef.current.position.y = numVal;
      if (key === 'pointLightZ') pointLightRef.current.position.z = numVal;
    } else if (key === 'cameraZ' && cameraRef.current) {
      cameraRef.current.position.z = numVal;
    } else if (key === 'fov' && cameraRef.current) {
      cameraRef.current.fov = numVal;
      cameraRef.current.updateProjectionMatrix();
    } else if ((key === 'metalness' || key === 'roughness') && ringRef.current) {
      ringRef.current.material[key] = numVal;
    } else if ((key === 'ringRadius' || key === 'tubeRadius') && ringRef.current && sceneRef.current) {
      // Recreate geometry with new dimensions
      const oldGeometry = ringRef.current.geometry;
      const newGeometry = new THREE.TorusGeometry(
        controls.current.ringRadius,
        Math.max(0.01, controls.current.tubeRadius),
        64,
        256
      );
      ringRef.current.geometry = newGeometry;
      oldGeometry.dispose();
    }
  };

  const toggleAutoRotate = () => {
    controls.current.autoRotate = !controls.current.autoRotate;
  };

  const resetDefaults = () => {
    window.location.reload();
  };

  const exportSettings = () => {
    const settings = {
      uAmplitude: uniforms.current.uAmplitude.value,
      uFrequency: uniforms.current.uFrequency.value,
      uSpeed: uniforms.current.uSpeed.value,
      uColor: '#' + uniforms.current.uColor.value.getHexString(),
      rotationX: controls.current.rotationX,
      rotationY: controls.current.rotationY,
      rotationZ: controls.current.rotationZ,
      autoRotate: controls.current.autoRotate,
      bloomStrength: controls.current.bloomStrength,
      bloomThreshold: controls.current.bloomThreshold,
      bloomRadius: controls.current.bloomRadius,
      ambientIntensity: controls.current.ambientIntensity,
      pointLightIntensity: controls.current.pointLightIntensity,
      pointLightX: controls.current.pointLightX,
      pointLightY: controls.current.pointLightY,
      pointLightZ: controls.current.pointLightZ,
      cameraZ: controls.current.cameraZ,
      fov: controls.current.fov,
      ringRadius: controls.current.ringRadius,
      tubeRadius: controls.current.tubeRadius,
      metalness: controls.current.metalness,
      roughness: controls.current.roughness,
      minWobble: controls.current.minWobble,
      maxWobble: controls.current.maxWobble
    };

    // Save to localStorage so settings persist across reloads
    saveSettingsToStorage(settings);

    // Also offer file download like before
    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `halo-settings-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);

    // Remount the control panel briefly so inputs reinitialize from the updated refs
    setShowControls(false);
    setTimeout(() => setShowControls(true), 0);
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '500px', background: 'transparent' }}>
      <div ref={mountRef} style={{width: '100%', height: '100%',}}/>
      
      <button 
        onClick={() => setShowControls(!showControls)}
        style={toggleButtonStyle}
      >
        {showControls ? '✕' : '⚙'}
      </button>

      {showControls && (
        <div style={panelStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h4 style={{ margin: 0 }}>Halo Controls</h4>
            <div style={{ display: 'flex', gap: '5px' }}>
              <button onClick={exportSettings} style={exportButtonStyle} title="Export Settings">
                💾
              </button>
              <button onClick={resetDefaults} style={resetButtonStyle}>Reset</button>
            </div>
          </div>

          <Section title="Animation">
            <Control label="Min Wobble" min="0" max="1" step="0.001" defaultValue={controls.current.minWobble} 
              onChange={(e) => { 
                controls.current.minWobble = parseFloat(e.target.value);
                const currentWobble = uniforms.current.uAmplitude.value;
                const clampedWobble = Math.max(controls.current.minWobble, Math.min(controls.current.maxWobble, currentWobble));
                uniforms.current.uAmplitude.value = clampedWobble;
              }} />
            <Control label="Max Wobble" min="0" max="1" step="0.001" defaultValue={controls.current.maxWobble} 
              onChange={(e) => { 
                controls.current.maxWobble = parseFloat(e.target.value);
                const currentWobble = uniforms.current.uAmplitude.value;
                const clampedWobble = Math.max(controls.current.minWobble, Math.min(controls.current.maxWobble, currentWobble));
                uniforms.current.uAmplitude.value = clampedWobble;
              }} />
            <Control label="Wobble Amount" min="0" max="1" step="0.01" defaultValue={uniforms.current.uAmplitude.value} 
              onChange={(e) => updateUniform('uAmplitude', e.target.value)} />
            <Control label="Complexity" min="0.1" max="5" step="0.1" defaultValue={uniforms.current.uFrequency.value} 
              onChange={(e) => updateUniform('uFrequency', e.target.value)} />
            <Control label="Speed" min="0" max="5" step="0.1" defaultValue={uniforms.current.uSpeed.value} 
              onChange={(e) => updateUniform('uSpeed', e.target.value)} />
          </Section>

          <Section title="Rotation">
            <div style={{ marginBottom: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input type="checkbox" defaultChecked={controls.current.autoRotate} onChange={toggleAutoRotate} style={{ marginRight: '5px' }} />
                Auto Rotate
              </label>
            </div>
            <Control label="X Rotation" min="-1.05" max="1.05" step="0.001" defaultValue={controls.current.rotationX} 
              onChange={(e) => { controls.current.rotationX = parseFloat(e.target.value); }} />
            <Control label="Y Rotation" min="-1.05" max="1.05" step="0.001" defaultValue={controls.current.rotationY} 
              onChange={(e) => { controls.current.rotationY = parseFloat(e.target.value); }} />
            <Control label="Z Rotation" min="-1.05" max="1.05" step="0.001" defaultValue={controls.current.rotationZ} 
              onChange={(e) => { controls.current.rotationZ = parseFloat(e.target.value); }} />
          </Section>

          <Section title="Lighting">
            <Control label="Ambient Intensity" min="0" max="100" step="0.1" defaultValue={controls.current.ambientIntensity} 
              onChange={(e) => updateControl('ambientIntensity', e.target.value)} />
            <Control label="Point Light Intensity" min="0" max="100" step="0.5" defaultValue={controls.current.pointLightIntensity} 
              onChange={(e) => updateControl('pointLightIntensity', e.target.value)} />
            <Control label="Light Position X" min="-10" max="10" step="0.5" defaultValue={controls.current.pointLightX} 
              onChange={(e) => updateControl('pointLightX', e.target.value)} />
            <Control label="Light Position Y" min="-10" max="10" step="0.5" defaultValue={controls.current.pointLightY} 
              onChange={(e) => updateControl('pointLightY', e.target.value)} />
            <Control label="Light Position Z" min="-10" max="10" step="0.5" defaultValue={controls.current.pointLightZ} 
              onChange={(e) => updateControl('pointLightZ', e.target.value)} />
          </Section>

          <Section title="Camera">
            <Control label="Distance (Z)" min="1" max="20" step="0.5" defaultValue={controls.current.cameraZ} 
              onChange={(e) => updateControl('cameraZ', e.target.value)} />
            <Control label="Field of View" min="30" max="120" step="5" defaultValue={controls.current.fov} 
              onChange={(e) => updateControl('fov', e.target.value)} />
          </Section>

          <Section title="Material">
            <Control label="Metalness" min="0" max="1" step="0.05" defaultValue={controls.current.metalness} 
              onChange={(e) => updateControl('metalness', e.target.value)} />
            <Control label="Roughness" min="0" max="1" step="0.05" defaultValue={controls.current.roughness} 
              onChange={(e) => updateControl('roughness', e.target.value)} />
            <label style={{ fontSize: '11px', marginTop: '5px', display: 'block' }}>Color</label>
            <input type="color" defaultValue={'#' + uniforms.current.uColor.value.getHexString()} 
              onChange={(e) => updateUniform('uColor', e.target.value)} 
              style={{ width: '100%', height: '30px', cursor: 'pointer', border: 'none', borderRadius: '4px' }} />
          </Section>

          <Section title="Geometry">
            <Control label="Ring Radius" min="0.5" max="5" step="0.1" defaultValue={controls.current.ringRadius} 
              onChange={(e) => updateControl('ringRadius', e.target.value)} />
            <Control label="Tube Thickness" min="0.01" max="0.5" step="0.01" defaultValue={controls.current.tubeRadius} 
              onChange={(e) => updateControl('tubeRadius', e.target.value)} />
          </Section>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: '15px', paddingBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
      <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '8px', color: '#00ffff', textTransform: 'uppercase' }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function Control({ label, ...inputProps }) {
  return (
    <div style={{ marginBottom: '8px' }}>
      <label style={{ fontSize: '11px', display: 'block', marginBottom: '3px' }}>{label}</label>
      <input type="range" {...inputProps} style={{ width: '100%', cursor: 'pointer' }} />
    </div>
  );
}

const panelStyle = {
  position: 'fixed',
  top: '20px',
  right: '20px',
  background: 'rgba(0, 0, 0, 0.9)',
  color: 'white',
  padding: '15px',
  borderRadius: '8px',
  maxHeight: '90vh',
  overflowY: 'auto',
  width: '280px',
  fontSize: '12px',
  zIndex: 100,
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(0, 255, 255, 0.2)',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)'
};

const toggleButtonStyle = {
  position: 'fixed',
  top: '20px',
  right: '320px',
  background: 'rgba(0, 0, 0, 0.9)',
  color: '#00ffff',
  border: '1px solid rgba(0, 255, 255, 0.2)',
  borderRadius: '8px',
  width: '40px',
  height: '40px',
  fontSize: '20px',
  cursor: 'pointer',
  zIndex: 101,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backdropFilter: 'blur(10px)'
};

const resetButtonStyle = {
  background: 'rgba(0, 255, 255, 0.2)',
  color: '#00ffff',
  border: '1px solid rgba(0, 255, 255, 0.3)',
  borderRadius: '4px',
  padding: '4px 8px',
  fontSize: '10px',
  cursor: 'pointer',
  textTransform: 'uppercase'
};

const exportButtonStyle = {
  background: 'rgba(0, 255, 255, 0.2)',
  color: '#00ffff',
  border: '1px solid rgba(0, 255, 255, 0.3)',
  borderRadius: '4px',
  padding: '4px 8px',
  fontSize: '14px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};