class Color{
    constructor(r, g, b, a) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }

    array(){ return [this.r, this.g, this.b, this.a] }
}

class Lighting{
    constructor() {
    }

    fill(ambient, diffuse, specular, direction){
        this.ambient = ambient;
        this.diffuse = diffuse;
        this.specular = specular;
        this.direction = direction;
    }
}


class Material{
    constructor() {
    }

    fill(name, shininess, ambient, diffuse, specular, emissive, opticalDensity, opacity, illum) {
        this.name = name;
        this.shininess = shininess;
        this.ambient = ambient;
        this.diffuse = diffuse;
        this.specular = specular;
        this.emissive = emissive;
        this.opticalDensity = opticalDensity;
        this.opacity = opacity;
        this.illum = illum;
    }
}

class Rotation{
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
}


class Position{
    constructor(objectRotation, position, scale, eye ,look) {
        this.objectRotation = objectRotation;
        this.position = position;
        this.scale = scale;
        this.eye = eye;
        this.look = look;
    }
}


class DrawableObject {
    constructor(program, position, vertices, materials, getTextureFromFramebuffer) {
        this.program = program;
        this.position = position;
        this.vertices = vertices;
        this.materials = materials;
        this.getTextureFromFramebuffer = getTextureFromFramebuffer;
    }
    
    setTexture(texture){
        this.texture = texture;
    }

    setSecondTexture(texture2){
        this.texture2 = texture2;
    }
    
    setFramebuffer(framebuffer){
        this.framebuffer = framebuffer;
    }

    setRotationAfterTranslation(rotationAfterTranslation){
        this.rotationAfterTranslation = rotationAfterTranslation;
    }

    /**
     * Draw the object.
     * @param drawtime Some objects are only drawn at day / night. This can be used to toggle the visibility.
     */
    async draw(drawtime) {
        // nur bei passender Tageszeit zeichnen
        if(elements.dayOrNightInput.innerHTML === "Night" && drawtime === drawOnlyAt.Night || elements.dayOrNightInput.innerHTML === "Day" && drawtime === drawOnlyAt.Day){
            return;
        }

        for (const geometry of this.vertices) {
            gl.bindTexture(gl.TEXTURE_2D, null);
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            //gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

            gl.useProgram(this.program);

            if(this.texture !== null) {
                if(this.getTextureFromFramebuffer){
                    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer)
                    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texture, level);
                    //gl.bindFramebuffer(gl.FRAMEBUFFER, null)
                }
                gl.activeTexture(gl.TEXTURE0)
                gl.bindTexture(gl.TEXTURE_2D, this.texture);
            }

            if(this.texture2 !== null ) {
                gl.activeTexture(gl.TEXTURE1)
                gl.bindTexture(gl.TEXTURE_2D, this.texture2);
            }

            else if(this.framebuffer !== null) {
                gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
                //gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
            }

            await position(this.program, this.position.objectRotation, this.position.position, this.position.scale, canvas, this.position.eye, this.position.look, this.rotationAfterTranslation)
            await bindParameters(this.program)

            // set default mat
            //setVec3Uniform(this.program, [0., 0., 0],'materialAmbient',gl);
            //setVec3Uniform(this.program, [1., 1., 1],'materialDiffuse',gl);

            if(this.materials !== null && this.materials !== undefined){
                const materialName = geometry.material;

                const material = this.materials.find(f => f.name === materialName);

                if(material === undefined) {
                    setVec3Uniform(this.program, [0., 0., 0.],'materialEmissive');
                    setVec3Uniform(this.program, [0., 0., 0.],'materialAmbient');
                    setVec3Uniform(this.program, [1., 1., 1.], 'materialDiffuse');
                    setVec3Uniform(this.program, [0.1, 0.1, 0.1], 'materialSpecular');
                }
                else {
                    setVec3Uniform(this.program, material.diffuse, 'materialDiffuse');
                    setVec3Uniform(this.program, material.emissive, 'materialEmissive');
                    setVec3Uniform(this.program, material.specular, 'materialSpecular');
                    setVec3Uniform(this.program, material.ambient, 'materialAmbient');
                }
            }

            if(!elements.errorInput.checked)
                printError();

            await draw(geometry.vertices)
        }
    }
}



