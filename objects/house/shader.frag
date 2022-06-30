precision mediump float;

varying vec2 texCoord;

varying vec3 fragColor;
varying vec3 fragNormal;
varying vec3 fragLightDir;

uniform float fogNear;
uniform float fogFar;
uniform vec4 fogColor;

void main(){
    float alpha = 10.;
    vec3 cAmbient = vec3(0.5,0.0,0.0);
    vec3 cDiffuse = vec3(1.,1.,1.);
    vec3 cSpecular = vec3(0.1,0.1,0.1);

    vec3 lightDir = normalize(fragLightDir);
    vec3 normalDir = normalize(fragNormal);
    vec3 eyeDir = vec3(0.,0.,1.);
    vec3 light = cAmbient;
    light += cDiffuse * max(dot(normalDir,lightDir),0.);
    light += cSpecular * pow(max(dot(reflect(-lightDir,normalDir),eyeDir),0.),alpha);

    vec4 colorWithLight = vec4(fragColor, 1.)*vec4(light,1.);

    // fog
    float fogAmount = smoothstep(fogNear, fogFar, gl_FragCoord.z);
    vec4 colorWithFog = mix(colorWithLight, fogColor, fogAmount);

    gl_FragColor = colorWithFog;
}