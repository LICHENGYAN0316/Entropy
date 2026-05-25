uniform float uTime;
uniform float uPointSize;

attribute vec3 customColor;
attribute float sizeJitter;

varying vec3 vColor;

void main() {
  vColor = customColor;

  vec3 pos = position;

  // Subtle breathing animation: small organic sinusoidal drift on spatial grid
  float wave = sin(uTime * 1.2 + pos.x * 4.0 + pos.y * 4.0) * 0.02 * (1.0 + sizeJitter * 0.5);
  pos.z += wave;
  pos.x += cos(uTime * 0.8 + pos.y * 5.0) * sizeJitter * 0.008;
  pos.y += sin(uTime * 0.9 + pos.x * 5.0) * sizeJitter * 0.008;

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPosition;

  // Attenuate particle size based on camera distance (depth) and apply jitter
  float jitterFactor = 0.7 + 0.6 * sizeJitter;
  gl_PointSize = uPointSize * jitterFactor * (300.0 / -mvPosition.z);
}
