precision mediump float;

varying vec3 v_worldNormal;

uniform sampler2D u_texture;
uniform vec3 camDir;

float pi = 3.1415926;

void main() {
    vec3 normal = normalize(v_worldNormal);
    vec3 texCoordsDir = reflect(-camDir, normal);

    vec2 texCoords = vec2(0.0);
    texCoords.s = -atan(texCoordsDir.z, texCoordsDir.x) / (2.0*pi) + 0.5;
    texCoords.t = -asin(texCoordsDir.y) / pi + 0.5;

    gl_FragColor = texture2D(u_texture, texCoords);
}
