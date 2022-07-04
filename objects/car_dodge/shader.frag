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

void main(){
    float alpha = 2.;

    vec3 lightDir = normalize(fragLightDir);
    vec3 normalDir = normalize(fragNormal);
    vec3 eyeDir = vec3(0.,0.,1.);
    vec3 light = materialEmissive;
    light += materialDiffuse * max(dot(lightDir, normalDir),0.);
    light += materialSpecular * pow(max(dot(reflect(-lightDir,normalDir),eyeDir),0.),alpha);

    gl_FragColor = vec4(light,1.);
}