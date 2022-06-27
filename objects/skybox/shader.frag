precision mediump float;
varying vec2 texCoord;
varying vec3 skyboxCoord;

// The texture.
uniform samplerCube skybox;

void main(){
    float s = -atan(skyboxCoord.z, skyboxCoord.x) / (2.0 * 3.141) + 0.5;
    float t = -asin(skyboxCoord.y) / 3.141 + 0.5;

    gl_FragColor = textureCube(skybox, skyboxCoord);
}