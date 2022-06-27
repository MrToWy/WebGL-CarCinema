precision mediump float;
varying vec2 texCoord;
varying vec3 skyboxCoord;

// The texture.
uniform samplerCube skybox;

void main(){
    gl_FragColor = textureCube(skybox, skyboxCoord);
}