precision mediump float;

attribute vec3 vertPosition;
attribute vec3 vertColor;
attribute vec2 textureCoordinate;
attribute vec3 normals;

uniform mat4 mWorld;
uniform mat4 mView;
uniform mat4 mProj;
uniform mat4 mTranslate;
uniform mat4 mScale;
uniform mat4 mRotate;

varying vec3 fragColor;

varying vec3 worldPosition;
varying vec3 worldNormal;


void main(){
    vec4 position = vec4(vertPosition, 1.0);

    fragColor = vec3(0., 0., 1.);
    gl_Position = mProj * mView *   mTranslate * mRotate * mScale * mWorld * position;
}