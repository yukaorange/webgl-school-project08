  #version 300 es
precision mediump float;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
uniform mat4 uNormalMatrix;
uniform vec3 uLightPosition;
uniform vec4 uMaterialDiffuse;
uniform vec4 uMaterialAmbient;
uniform vec4 uMaterialSpecular;
uniform bool uUseVertexColor;
uniform bool uIsBG;

in vec3 aVertexPosition;
in vec3 aVertexNormal;
in vec4 aVertexColor;
in vec2 aVertexTextureCoords;

out vec3 vNormal;
out vec3 vLightRay;
out vec3 vEyeVector;
out vec4 vFinalColor;
out vec2 vTextureCoords;

void main(void) {
  vec4 vertex = uModelViewMatrix * vec4(aVertexPosition, 1.0f);

  vec4 light = vec4(uLightPosition, 1.0f);
  // light = uModelViewMatrix * light;

  vFinalColor = uMaterialDiffuse;

  vTextureCoords = aVertexTextureCoords;

  vNormal = vec3(uNormalMatrix * vec4(aVertexNormal, 1.0f));

  vLightRay = vertex.xyz - light.xyz;

  vEyeVector = -vec3(vertex.xyz);

  if(uIsBG) {
    gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aVertexPosition, 1.0f);
  } else {
    gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aVertexPosition, 1.0f);
  }
}