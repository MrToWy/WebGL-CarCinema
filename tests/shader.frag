precision mediump float;
varying vec3 fragColor;

uniform vec3 cameraPosition;

// Passed in from the vertex shader.
varying vec3 worldPosition;
varying vec3 worldNormal;

// The texture.
uniform samplerCube u_texture;

void main(){
    gl_FragColor = vec4(fragColor, 1.); //textureCube(u_texture, direction);
}