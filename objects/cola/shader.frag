precision mediump float;
// Passed in from the vertex shader.
varying vec2 texCoord;

// The texture.
uniform sampler2D texture;
uniform sampler2D scratch;

void main() {
    vec4 colaColor = texture2D(texture, texCoord);
    vec4 scratchColor = texture2D(scratch, texCoord);
    vec3 mixColor = (colaColor + scratchColor).rgb;
    gl_FragColor = vec4(mixColor, 1.0);
}