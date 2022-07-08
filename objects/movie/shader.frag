precision mediump float;
// Passed in from the vertex shader.
varying vec2 texCoord;

// The texture.
uniform sampler2D texture;
uniform float fogNear;
uniform float fogFar;
uniform vec4 fogColor;

void main() {
    vec4 color = texture2D(texture, texCoord);
    vec4 fogColorStatic = vec4(0.5, 0.5, 0.5, 0.5);

    // fog
    float fogAmount = smoothstep(fogNear, fogFar, gl_FragCoord.z);
    vec4 colorWithFog = mix(color, fogColorStatic, fogAmount);

    gl_FragColor = colorWithFog;
}