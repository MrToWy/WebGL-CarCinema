precision mediump float;

attribute vec3 vertPosition;
attribute vec2 vertTexCoord;
attribute vec3 vertNormal;

varying vec2 texCoord;
varying vec3 fragColor;
varying vec3 fragNormal;
varying vec3 fragLightDir;
varying vec3 fragLightDir2;
varying vec3 fragPosition;

uniform mat4 mScale;
uniform mat4 mRotate;
uniform mat4 mTranslate;
uniform mat4 mView;
uniform mat4 mProj;
uniform mat3 mNormale;
uniform vec3 lightDirection;
uniform vec3 lightDirection2;


void main(){

    mat4 mWorld = mTranslate * mRotate * mScale;
    vec4 viewPosition = mView * mWorld * vec4(vertPosition, 1.0);
    fragPosition =
    fragColor = vec3(1., 1., 1.);
    texCoord = vertTexCoord;
    fragNormal = mNormale * vertNormal;
    fragLightDir = (mView * vec4(lightDirection, 0.0)).xyz;
    fragLightDir2 = (mView * vec4(lightDirection2, 0.)).xyz;

    gl_Position = mProj * mView * mWorld * vec4(vertPosition, 1.0);

}