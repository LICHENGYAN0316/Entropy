import * as THREE from 'three';
import { extractParticlesFromFile, ParticleSystem } from './particles';
import { InteractionHandler } from './interaction';
import vertexShader from './shaders/vertex.glsl?raw';
import fragmentShader from './shaders/fragment.glsl?raw';

// 1. Get HTML elements
const canvas = document.getElementById('entropy') as HTMLCanvasElement;
const uploadBtn = document.getElementById('upload-btn') as HTMLButtonElement;
const fileInput = document.getElementById('file-input') as HTMLInputElement;

if (!canvas || !uploadBtn || !fileInput) {
  throw new Error('Required HTML elements are missing');
}

// 2. Initialize Three.js scene
const scene = new THREE.Scene();

// Setup Camera
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.z = 1.3;

// Setup Renderer
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: false,
  powerPreference: 'high-performance',
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

// Container group for rotation
const sculptureGroup = new THREE.Group();
scene.add(sculptureGroup);

// Particle system state
const particleSystemManager = new ParticleSystem();
let particleMesh: THREE.Points | null = null;
let particleMaterial: THREE.ShaderMaterial | null = null;

// Clock for time uniforms
const clock = new THREE.Clock();

// 3. Handle window resizing
function handleResize() {
  const width = window.innerWidth;
  const height = window.innerHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Dynamically update point size based on resolution/dpr
  if (particleMaterial) {
    particleMaterial.uniforms.uPointSize.value = getPointSize();
  }
}
window.addEventListener('resize', handleResize);

function getPointSize(): number {
  const isRetina = window.devicePixelRatio > 1;
  return isRetina ? 2.8 : 1.6;
}

// 4. Render loop
function animate() {
  requestAnimationFrame(animate);

  const elapsedTime = clock.getElapsedTime();

  // Slow Y-axis auto-rotation (0.05 rad/s)
  sculptureGroup.rotation.y = elapsedTime * 0.05;

  // Update time uniform in custom shader material
  if (particleMaterial) {
    particleMaterial.uniforms.uTime.value = elapsedTime;
  }

  renderer.render(scene, camera);
}

// 5. Image upload and processing
uploadBtn.addEventListener('click', () => {
  fileInput.click();
});

fileInput.addEventListener('change', async () => {
  const files = fileInput.files;
  if (!files || files.length === 0) return;

  const file = files[0];

  // Clear file input so the same file can be uploaded again
  fileInput.value = '';

  try {
    // Show visual loading cue if needed, or extract instantly
    const data = await extractParticlesFromFile(file);

    // Clean up previous particle assets
    if (particleMesh) {
      sculptureGroup.remove(particleMesh);
      particleMesh.geometry.dispose();
      if (Array.isArray(particleMesh.material)) {
        particleMesh.material.forEach((m) => m.dispose());
      } else {
        particleMesh.material.dispose();
      }
    }

    // Create geometry and material
    const geometry = particleSystemManager.createGeometry(data);

    particleMaterial = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uPointSize: { value: getPointSize() },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    particleMesh = new THREE.Points(geometry, particleMaterial);
    sculptureGroup.add(particleMesh);

    // Center sculpture slightly on camera
    sculptureGroup.position.set(0, 0, 0);

    // Fade out upload button
    uploadBtn.classList.add('hidden');
  } catch (error) {
    console.error('Failed to extract particles from image:', error);
    triggerButtonShake();
  }
});

// Trigger a subtle shake animation on the button in case of failure (e.g. HEIC fallback fail)
function triggerButtonShake() {
  uploadBtn.classList.add('shake');
  setTimeout(() => {
    uploadBtn.classList.remove('shake');
  }, 400);
}

// 6. Interaction & Re-summon button
const showUploadButton = () => {
  uploadBtn.classList.remove('hidden');
};

// Initialize mouse and gesture listener
new InteractionHandler(canvas, showUploadButton);

// 7. Start render loop
animate();
