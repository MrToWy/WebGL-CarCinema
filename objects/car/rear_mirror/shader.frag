precision mediump float;

uniform sampler2D u_texture;

varying vec3 v_worldNormal;

uniform vec3 camDir;
float pi = 3.1415926;

void main() {
    vec3 texCoordsDir = reflect(-camDir, v_worldNormal);
    vec2 texCoords = vec2(0.0);
    texCoords.s = -atan(texCoordsDir.z, texCoordsDir.x) / (2.0*pi) + 0.5;
    texCoords.t = -asin(texCoordsDir.y) / pi + 0.5;
    gl_FragColor = texture2D(0, texCoords);
}
