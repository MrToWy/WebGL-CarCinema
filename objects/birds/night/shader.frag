precision mediump float;

varying vec2 texCoord;
varying vec3 fragColor;
varying vec3 fragNormal;
varying vec3 fragLightDir;

uniform vec3 materialDiffuse;
uniform vec3 materialAmbient;
uniform vec3 materialEmissive;
uniform vec3 materialSpecular;
uniform float materialShininess;
uniform float materialOpacity;

uniform float fogNear;
uniform float fogFar;
uniform vec4 fogColor;

uniform vec3 lightDirection;
uniform vec3 lightDirection2;

void main(){



    vec4 fogColorStatic = vec4(0.5, 0.5, 0.5, 0.5);

    // fog
    float fogAmount = smoothstep(fogNear, fogFar, gl_FragCoord.z);
    vec4 colorWithFog = mix(vec4(materialDiffuse, 1.0), fogColorStatic, fogAmount);

    gl_FragColor = colorWithFog;
}