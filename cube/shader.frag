precision mediump float;
uniform samplerCube skybox;

// Passed in from the vertex shader.
varying vec2 TexCoord;

// The texture.
uniform sampler2D u_texture;

void main() {
    gl_FragColor = texture2D(u_texture, TexCoord);
}