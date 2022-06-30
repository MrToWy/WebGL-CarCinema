class Rotation{
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
}


class Position{
    constructor(objectRotation, cameraRotation, position, scale, eye ,look) {
        this.objectRotation = objectRotation;
        this.cameraRotation = cameraRotation;
        this.position = position;
        this.scale = scale;
        this.eye = eye;
        this.look = look;
    }
}


class DrawableObject {
    constructor(program, position, vertices, clear, getTextureFromFramebuffer) {
        this.program = program;
        this.position = position;
        this.vertices = vertices;
        this.clear = clear;
        this.getTextureFromFramebuffer = getTextureFromFramebuffer;
    }
    
    setTexture(texture){
        this.texture = texture;
    }
    
    setFramebuffer(framebuffer){
        this.framebuffer = framebuffer;
    }
    
    async draw() {
        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        
        gl.useProgram(this.program);
        
        if(this.texture !== null) {
            if(this.getTextureFromFramebuffer){
                gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer)
                gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texture, level);
                gl.bindFramebuffer(gl.FRAMEBUFFER, null)
            }
            
            gl.bindTexture(gl.TEXTURE_2D, this.texture);
        }
        
        else if(this.framebuffer !== null) {
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
        }
        
        await position(gl, this.program, this.position.objectRotation, this.position.cameraRotation, this.position.position, this.position.scale, canvas, this.position.eye, this.position.look)
        await bindParameters(gl, this.program)

        if(this.clear)
            gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
        
        printError(gl);
        await draw(gl, this.vertices)
    }
}


