precision mediump float;

varying vec2 texCoord;
varying vec3 fragColor;
varying vec3 fragNormal;
varying vec3 fragLightDir;

uniform vec3 ambiente;

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



    vec3 light;

    vec3 emissive = materialEmissive;
    vec3 ambienteResult = materialAmbient * ambiente;

    vec3 diffuse = materialDiffuse * max(dot(lightDir, normalDir),0.);
    vec3 specular = materialSpecular * pow(max(dot(reflect(-lightDir,normalDir),eyeDir),0.),alpha);

    light += ambienteResult + emissive + diffuse + specular;


    gl_FragColor = vec4(light,1.);
}