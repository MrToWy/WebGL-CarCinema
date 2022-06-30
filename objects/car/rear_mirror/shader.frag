precision mediump float;

uniform sampler2D u_texture;

varying vec3 v_worldNormal;

uniform vec3 camDir;

void main() {
    vec3 texCoordsDir = reflect(-camDir, v_worldNormal);
    gl_FragColor = textureCube(u_texture, 1);
}
