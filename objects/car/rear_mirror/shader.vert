precision mediump float;

attribute vec3 vertPosition;
attribute vec2 vertTexCoord;
attribute vec3 vertNormal;

varying vec2 texCoord;
varying vec3 fragLightDir;
varying vec3 v_worldNormal;
varying vec3 fragNormal;

uniform mat4 mScale;
uniform mat4 mRotate;
uniform mat4 mTranslate;
uniform mat4 mView;
uniform mat4 mProj;
uniform mat3 mNormale;

void main() {
    fragNormal = mNormale * vertNormal;
    v_worldNormal = normalize(fragNormal);

    gl_Position = mProj * mView * mTranslate * mRotate * mScale * vec4(vertPosition, 1.0);
}
