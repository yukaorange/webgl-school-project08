#version 300 es
precision mediump float;

uniform vec4 uLightAmbient;
uniform vec4 uLightDiffuse;
uniform vec4 uMaterialAmbient;
uniform vec4 uMaterialDiffuse;
uniform vec2 uResolution;
uniform float uTexAspectX;
uniform float uTexAspectY;
uniform bool uIsBG;

uniform sampler2D uSampler;
uniform sampler2D uSamplerVideo;

in vec3 vNormal;
in vec3 vLightRay;
in vec3 vEyeVector;
in vec4 vFinalColor;
in vec2 vTextureCoords;

out vec4 fragColor;

float specular(vec3 eye, vec3 normal) {
  return pow(1.0f + dot(eye, normal), 2.0f);
}

float fresnel(vec3 eyeVector, vec3 worldNormal, float power) {
  float fresnelFactor = abs(dot(eyeVector, worldNormal));
  float inversefresnelFactor = 1.0f - fresnelFactor;

  return pow(inversefresnelFactor, power);
}

void main(void) {
      // Ambient
  vec4 Ia = uLightAmbient * uMaterialAmbient;

      // Diffuse
  vec3 L = normalize(vLightRay);
  vec3 N = normalize(vNormal);
  vec3 E = normalize(vEyeVector);
  vec3 R = reflect(L, N);
  float lambertTerm = max(dot(N, -L), 0.33f);
  float specularLay = pow(dot(R, -E), 2.0f);
  vec4 Is = vec4(0.5f) * specularLay;

  vec4 Id = uLightDiffuse * uMaterialDiffuse * lambertTerm;

  vec4 finalColor = Ia + Id + Is;

  vec2 uv = vTextureCoords;
  uv = uv - vec2(0.5f);
  uv.x *= min(uTexAspectX, 1.f);
  uv.y *= min(uTexAspectY, 1.f);
  uv = uv + vec2(0.5f);

  vec2 screenUV = gl_FragCoord.xy / uResolution.xy;
  screenUV = screenUV - vec2(0.5f);
  screenUV.x *= min(uTexAspectX, 1.f);
  screenUV.y *= min(uTexAspectY, 1.f);
  screenUV = screenUV + vec2(0.5f);

  float IorR = 1.f / 1.15f;
  float IorG = 1.f / 1.18f;
  float IorB = 1.f / 1.22f;

  vec3 refractVecR = refract(E, N, IorR) *0.3;
  vec3 refractVecG = refract(E, N, IorG)*0.3;
  vec3 refractVecB = refract(E, N, IorB)*0.3;

  float r = texture(uSamplerVideo, screenUV + refractVecR.xy).r;
  float g = texture(uSamplerVideo, screenUV + refractVecG.xy).g;
  float b = texture(uSamplerVideo, screenUV + refractVecB.xy).b;

  if(uIsBG) {
    fragColor = texture(uSamplerVideo, uv);
  } else {

    vec3 color = vec3(r, g, b);

    fragColor = vec4(color, 1.0f) + finalColor * vec4(color, 1.0f);
  }
}