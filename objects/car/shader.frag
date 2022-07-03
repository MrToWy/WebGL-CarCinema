precision mediump float;

varying vec2 texCoord;
varying vec3 fragColor;
varying vec3 fragNormal;
varying vec3 fragLightDir;

uniform vec3 ambiente;
uniform vec3 diffuse;
uniform vec3 specular;
uniform float alpha;
uniform vec3 eyeDir;

void main(){
    vec3 lightDir = normalize(fragLightDir);
    vec3 normalDir = normalize(fragNormal);
    vec3 light = ambiente;
    light += diffuse * max(dot(normalDir,lightDir),0.);
    light += specular * pow(max(dot(reflect(-lightDir,normalDir),eyeDir),0.),alpha);

    gl_FragColor = vec4(fragColor, 1.)*vec4(light,1.);
}