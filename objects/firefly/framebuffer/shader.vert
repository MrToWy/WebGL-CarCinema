precision mediump float;

attribute vec3 vertPosition;
attribute vec2 vertTexCoord;
attribute vec3 vertNormal;

varying vec2 texCoord;

uniform mat4 mScale;
uniform mat4 mRotate;
uniform mat4 mTranslate;
uniform mat4 mView;
uniform mat4 mProj;
uniform mat4 mRotateAfterTrans;

void main(){
    gl_Position = mProj * mView * mRotateAfterTrans *  mTranslate *  mRotate * mScale * vec4(vertPosition, 1.0);
}