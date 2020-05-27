#pragma glslify: inverse = require(glsl-inverse)
#pragma glslify: transpose = require(glsl-transpose)

varying vec3 vNormal;
varying vec3 fragPos;
varying vec2 vUv;
varying vec3 vPosition;


void main() {
  vNormal = mat3(transpose(inverse(modelMatrix))) * normal;

  vUv = uv;
  
  vPosition = position;
  
  fragPos = vec3(modelMatrix * vec4(position, 1.0));

  gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
}