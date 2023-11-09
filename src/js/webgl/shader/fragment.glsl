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

void main(void) {
      // Ambient
  vec4 Ia = uLightAmbient * uMaterialAmbient;

      // Diffuse
  vec3 L = normalize(vLightRay);
  vec3 N = normalize(vNormal);
  vec3 E = normalize(vEyeVector);
  float lambertTerm = max(dot(N, -L), 0.33f);
  vec4 Id = uLightDiffuse * uMaterialDiffuse * lambertTerm;

  vec4 finalColor = Ia + Id;

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

  float f = specular(vEyeVector, vNormal);

  float refractPower = 0.02f;

  refractPower = (1.0f - refractPower) * (1.0f - 0.6f) + 0.6f;

  f = smoothstep(0.1f, refractPower, f);

  // vec3 normalVecR = vNormal * f * (0.1f + 0.1f * 1.0f);
  // vec3 normalVecG = vNormal * f * (0.1f + 0.1f * 1.5f);
  // vec3 normalVecB = vNormal * f * (0.1f + 0.1f * 2.0f);]

  // vec3 normalVecR = vEyeVector * dot(vEyeVector, vNormal) * f * (0.1f + 0.1f * 1.0f);
  // vec3 normalVecG = vEyeVector * dot(vEyeVector, vNormal) * f * (0.1f + 0.1f * 1.5f);
  // vec3 normalVecB = vEyeVector * dot(vEyeVector, vNormal) * f * (0.1f + 0.1f * 2.0f);

  vec3 normalVecR = vEyeVector * dot(vEyeVector, vNormal) * f * (0.1f + 0.1f * 1.0f);
  vec3 normalVecG = vEyeVector * dot(vEyeVector, vNormal) * f * (0.1f + 0.1f * 1.f);
  vec3 normalVecB = vEyeVector * dot(vEyeVector, vNormal) * f * (0.1f + 0.1f * 1.f);

  if(uIsBG) {
    fragColor = texture(uSamplerVideo, uv);
  } else {
    float R = texture(uSamplerVideo, screenUV - normalVecR.xy).r;
    float G = texture(uSamplerVideo, screenUV - normalVecG.xy).g;
    float B = texture(uSamplerVideo, screenUV - normalVecB.xy).b;

    vec3 color = vec3(R, G, B);


    fragColor = finalColor * vec4(color, 1.0f);
  }
}