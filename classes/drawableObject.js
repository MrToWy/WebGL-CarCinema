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
    
    async draw(drawtime) {
        // nur bei passender Tageszeit zeichnen
        if(dayOrNightInput.innerHTML === "Night" && drawtime === drawOnlyAt.Night || dayOrNightInput.innerHTML === "Day" && drawtime === drawOnlyAt.Day){
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

            await position(gl, this.program, this.position.objectRotation, this.position.position, this.position.scale, canvas, this.position.eye, this.position.look, this.rotationAfterTranslation)
            await bindParameters(gl, this.program)

            // set default mat
            //setVec3Uniform(this.program, [0., 0., 0],'materialAmbient',gl);
            //setVec3Uniform(this.program, [1., 1., 1],'materialDiffuse',gl);

            if(this.materials !== null && this.materials !== undefined){
                const materialName = geometry.material;

                const material = this.materials.find(f => f.name === materialName);

                if(material === undefined) {
                    setVec3Uniform(this.program, [0., 0., 0.],'materialEmissive',gl);
                    setVec3Uniform(this.program, [0., 0., 0.],'materialAmbient',gl);
                    setVec3Uniform(this.program, [1., 1., 1.], 'materialDiffuse', gl);
                    setVec3Uniform(this.program, [0.1, 0.1, 0.1], 'materialSpecular', gl);
                }
                else {
                    setVec3Uniform(this.program, material.diffuse, 'materialDiffuse', gl);
                    setVec3Uniform(this.program, material.emissive, 'materialEmissive', gl);
                    setVec3Uniform(this.program, material.specular, 'materialSpecular', gl);
                    setVec3Uniform(this.program, material.ambient, 'materialAmbient', gl);
                }
            }

            if(!errorInput.checked)
                printError(gl);

            await draw(gl, geometry.vertices)
        }
    }
}



