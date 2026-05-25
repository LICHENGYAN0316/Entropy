varying vec3 vColor;

void main() {
  // Center is at (0.5, 0.5) in point coordinates
  vec2 centerDist = gl_PointCoord - vec2(0.5);
  float dist = length(centerDist);

  // Soft circle falloff (discard outside radius 0.5)
  if (dist > 0.5) {
    discard;
  }

  // Smooth circular glow: higher intensity in the center
  float intensity = smoothstep(0.5, 0.05, dist);

  gl_FragColor = vec4(vColor, intensity * 0.85);
}
