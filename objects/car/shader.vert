precision mediump float;

attribute vec3 vertPosition;
attribute vec2 vertTexCoord;
attribute vec3 vertNormal;

varying vec2 texCoord;
varying vec3 fragColor;
varying vec3 fragNormal;
varying vec3 fragLightDir;
varying vec3 fragLightDir2;

uniform mat4 mScale;
uniform mat4 mRotate;
uniform mat4 mTranslate;
uniform mat4 mView;
uniform mat4 mProj;
uniform mat3 mNormale;
uniform vec3 lightDirection;
uniform vec3 lightDirection2;


void main(){

    fragColor = vec3(1., 1., 1.);
    texCoord = vertTexCoord;
    fragNormal = mNormale * vertNormal;
    fragLightDir = (mView * vec4(lightDirection, 0.0)).xyz;
    fragLightDir2 = (mView * vec4(lightDirection2, 0.)).xyz;

    gl_Position = mProj * mView * mTranslate * mRotate * mScale * vec4(vertPosition, 1.0);

}