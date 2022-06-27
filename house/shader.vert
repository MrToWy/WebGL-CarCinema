precision mediump float;

attribute vec3 vertPosition;
attribute vec2 textureCoordinate;
attribute vec3 normals;

varying vec2 texCoord;
varying vec3 fragColor;
varying vec3 fNormal;
varying vec3 fLightDir;

uniform mat4 mScale;
uniform mat4 mRotate;
uniform mat4 mTranslate;
uniform mat4 mView;
uniform mat4 mProj;
uniform mat3 mNormale;


void main(){
    vec3 lightDir = vec3(5.,7.,7.) ;

    fragColor = vec3(1., 1., 0.);
    texCoord = textureCoordinate;
    fNormal = mNormale * normals;
    fLightDir = (mView * vec4(lightDir,0.0)).xyz;

    gl_Position = mProj * mView * mTranslate * mRotate * mScale * vec4(vertPosition, 1.0);
}