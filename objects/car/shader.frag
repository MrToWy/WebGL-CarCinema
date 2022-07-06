precision mediump float;

varying vec2 texCoord;
varying vec3 fragColor;
varying vec3 fragNormal;
varying vec3 fragLightDir;
varying vec3 fragLightDir2;

uniform vec3 ambiente;
uniform vec3 diffuse;
uniform vec3 specular;

uniform vec3 ambiente2;
uniform vec3 diffuse2;
uniform vec3 specular2;

uniform float alpha;
uniform vec3 eyeDir;

void main(){
    vec3 lightDir = normalize(fragLightDir);
    vec3 lightDir2 = normalize(fragLightDir2);


    vec3 normalDir = normalize(fragNormal);


    vec3 light1 = ambiente;
    light1 += diffuse * max(dot(normalDir,lightDir),0.);
    light1 += specular * pow(max(dot(reflect(-lightDir,normalDir),eyeDir),0.),alpha);


    vec3 light2 = ambiente2;
    light2 += diffuse2 * max(dot(normalDir,lightDir2),0.);
    light2 += specular2 * pow(max(dot(reflect(-lightDir2,normalDir),eyeDir),0.),alpha);


    float light1Percentage = 0.5;
    vec3 light = light1Percentage * light1 + (1. - light1Percentage) * light2;


    gl_FragColor = vec4(fragColor, 1.)*vec4(light,1.);
}