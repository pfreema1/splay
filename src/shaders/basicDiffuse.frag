uniform vec3 color;
uniform sampler2D texture;
uniform vec3 projPosition;

varying vec3 vNormal;
varying vec4 vWorldPosition;
varying vec4 vTexCoords;

void main() {
  vec2 uv = (vTexCoords.xy / vTexCoords.w) * 0.5 + 0.5;

  vec4 outColor = texture2D(texture, uv);

  /*
  // this makes sure we don't render also the back of the object
  vec3 projectorDirection = normalize(projPosition - vWorldPosition.xyz);
  float dotProduct = dot(vNormal, projectorDirection);
  if (dotProduct < 0.0) {
    outColor = vec4(color, 1.0);
  }
  */
  
  gl_FragColor = outColor;
}