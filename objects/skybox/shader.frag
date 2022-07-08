precision mediump float;
varying vec2 texCoord;
varying vec3 skyboxCoord;

// The texture.
uniform sampler2D skybox;

uniform float fogNear;
uniform float fogFar;
uniform vec4 fogColor;

void main(){
    float s = -atan(skyboxCoord.z, skyboxCoord.x) / (2.0 * 3.141) + 0.5;
    float t = -asin(skyboxCoord.y) / 3.141 + 0.5;

    vec4 color = texture2D(skybox, vec2(s, t));

    vec4 fogColorStatic = vec4(0.5, 0.5, 0.5, 0.5);

    // fog
    float fogAmount = smoothstep(fogNear, fogFar, gl_FragCoord.z);
    vec4 colorWithFog = mix(color, fogColorStatic, fogAmount);

    gl_FragColor = colorWithFog;
}