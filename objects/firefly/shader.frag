precision mediump float;
uniform sampler2D u_texture;
varying vec2 texCoord;

void main(void) {
    float weight = 0.01;
    vec4 frameColor = vec4(1., 0.4 ,0.5 ,0.);
    for (int i = 0; i < 10; i++) {
        float sShift = float(i) * 1.0/800.0; // Auflösung in s-Richtung
        for (int j = 0; j < 10; j++) {
            float tShift = float(j) * 1.0/800.0; // Auflösung in t-Richtung
            frameColor += weight
            * texture2D(u_texture, texCoord + vec2( sShift,  tShift));
            frameColor += weight
            * texture2D(u_texture, texCoord + vec2( sShift, -tShift));
            frameColor += weight
            * texture2D(u_texture, texCoord + vec2(-sShift,  tShift));
            frameColor += weight
            * texture2D(u_texture, texCoord + vec2(-sShift, -tShift));
        }
    }
    gl_FragColor = frameColor;
}