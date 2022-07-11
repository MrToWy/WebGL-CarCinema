precision mediump float;

varying vec3 v_worldNormal;

uniform sampler2D u_texture;

uniform float fogNear;
uniform float fogFar;
uniform vec4 fogColor;

float pi = 3.1415926;

void main() {
    vec3 normal = normalize(v_worldNormal);
    vec3 staticCamDir = vec3(0., 0., 1.);
    vec3 texCoordsDir = reflect(-staticCamDir, normal);

    vec2 texCoords = vec2(0.0);
    texCoords.s = -atan(texCoordsDir.z, texCoordsDir.x) / (2.0*pi) + 0.5;
    texCoords.t = -asin(texCoordsDir.y) / pi + 0.5;

    vec4 window_color = vec4(0.1, 0.1, 0.1, 0.);
    vec4 color = texture2D(u_texture, texCoords) + window_color;
    vec4 fogColorStatic = vec4(0.5, 0.5, 0.5, 0.5);

    // fog
    float fogAmount = smoothstep(fogNear, fogFar, 0.997);
    vec4 colorWithFog = mix(color, fogColorStatic, fogAmount);

    gl_FragColor = colorWithFog;
}
