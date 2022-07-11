precision mediump float;

varying vec2 texCoord;
varying vec3 fragColor;
varying vec3 fragNormal;
varying vec3 fragLightDir;
varying vec3 fragLightDir2;
varying vec3 fragPosition;

uniform vec3 ambiente;
uniform vec3 diffuse;
uniform vec3 specular;

uniform vec3 ambiente2;
uniform vec3 diffuse2;
uniform vec3 specular2;

uniform float alpha;
uniform vec3 eyeDir;

void main(){

    // ToDo: uniforms
    vec4 lightPosition = vec4(3., 10., 0., 0.);
    vec4 lightPosition2 = vec4(-3., -10., 0., 0.);
    vec3 camPosition = vec3(0., 0., 1.);

    vec3 N = normalize(fragNormal);

    vec3 L = normalize(vec3(lightPosition) - fragPosition);
    vec3 L2 = normalize(vec3(lightPosition2) - fragPosition);

    vec3 H = normalize(L + camPosition);
    vec3 H2 = normalize(L2 + camPosition);


    vec3 lightDir = normalize(fragLightDir);
    vec3 lightDir2 = normalize(fragLightDir2);


    vec3 normalDir = normalize(fragNormal);


    vec3 light1 = ambiente;
    light1 += diffuse * max(dot(N, L),0.);
    light1 += specular * pow(max(dot(H, N), 0.0), alpha);


    vec3 light2 = ambiente2;
    light2 += diffuse2 * max(dot(N,L2),0.);
    light2 += specular2 * pow(max(dot(reflect(-H2,N),eyeDir),0.),alpha);


    float light1Percentage = 0.8;
    vec3 light = light1Percentage * light1 + (1. - light1Percentage) * light2;


    gl_FragColor = vec4(fragColor, 1.)*vec4(light,1.);
}