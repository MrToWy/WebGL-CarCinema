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

varying vec2 TexCoord;
uniform sampler2D ourTexture;

varying vec4 v_position;

void main(){
    v_position = vec4(vertPosition, 1.0);

    TexCoord = textureCoordinate;
    gl_Position = mProj * mView *  mTranslate *  mRotate * mScale * mWorld * v_position;
}