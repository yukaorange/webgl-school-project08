#version 300 es
precision mediump float;

uniform sampler2D uSampler;
uniform float uTime;
uniform vec2 uMouse;
uniform vec2 uResolution;

in vec2 vTextureCoords;

out vec4 fragColor;

const float glitchSize = 0.33f;

float random(float r) {
  return fract(sin(r * 12.9898f) * 43758.5453123f);
}

void main(void) {
  float aspectRatio = uResolution.x / uResolution.y;
  vec2 noiseCoords = vTextureCoords * 2.f - 1.f;
  vec2 ajustedCoords = noiseCoords * vec2(aspectRatio, 1.f);
  vec2 mouse = uMouse * vec2(aspectRatio, 1.f);

  bool isInSquareArea = abs(ajustedCoords.x - mouse.x) < glitchSize / 1.0f && abs(ajustedCoords.y - mouse.y) < glitchSize / 1.0f;

  vec4 glitchColor = vec4(1.f);

  vec4 originalColor = texture(uSampler, vTextureCoords);

  vec2 wavyCoord;
  float freq = 10.f;
  float amp = 0.05f;
  wavyCoord.s = vTextureCoords.s + sin(uTime + vTextureCoords.t * freq) * amp;
  wavyCoord.t = vTextureCoords.t + cos(uTime + vTextureCoords.s * freq) * amp;

  vec4 wavyColor = texture(uSampler, wavyCoord);

  if(isInSquareArea) {
    float randTime = random(uTime);
    float glitchFactor = randTime > 0.01f ? 1.0f : 0.8f;

    float randLine = random(step(0.01f, abs(sin((100.0f * (ajustedCoords.y))))));

    // glitchColor = vec4(
    //   originalColor.r * 0.4f + originalColor.r * wavyColor.r * glitchFactor * randLine,
    // originalColor.g * 0.4f + originalColor.r *  wavyColor.g * glitchFactor * randLine,
    //   originalColor.b * 0.4f + originalColor.b * wavyColor.r * glitchFactor * randLine,
    //   1.0f);
    glitchColor = vec4(wavyColor.rgb, 1.0f);
  }

  fragColor = isInSquareArea ? glitchColor : originalColor;
}
