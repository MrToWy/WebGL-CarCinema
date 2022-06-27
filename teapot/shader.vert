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

    fragColor = normals;
    gl_Position = mProj * mView *   mTranslate * mRotate * mScale * mWorld * position;


    // send the view position to the fragment shader
    worldPosition = (mWorld * position).xyz;
    worldPosition = vec3(1.0, 2.0, 10.0) - (mWorld * position).xyz;

    // orient the normals and pass to the fragment shader
    worldNormal = mat3(mWorld) * normals;
}