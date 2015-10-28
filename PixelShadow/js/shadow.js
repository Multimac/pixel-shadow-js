/// <reference path="typings/threejs/three.d.ts" />
/// <reference path="typings/jquery/jquery.d.ts" />
"use strict";
class ShadowJS {
    constructor(lightSize, options) {
        options = ShadowJS.default(options, {});
        var targetSize = ShadowJS.default(options.renderTargetSize, lightSize);
        if (!ShadowJS.powerOfTwo(targetSize)) {
            throw "TODO: Exception";
        }
        this.m_loadingCount = 0;
        this.m_minBlur = ShadowJS.default(options.minBlur, 0.0);
        this.m_maxBlur = ShadowJS.default(options.minBlur, 3.0);
        this.m_bias = ShadowJS.default(options.minBlur, 2.0);
        this.m_ambient = ShadowJS.default(options.minBlur, 0.25);
        this.m_exponent = ShadowJS.default(options.minBlur, 1.0);
        this.m_lightSize = lightSize;
        var halfLightSize = lightSize / 2.0;
        this.m_lightCamera = new THREE.OrthographicCamera(-halfLightSize, halfLightSize, halfLightSize, -halfLightSize, 0.0, 1.0);
        this.m_fullScreenCamera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0.0, 1.0);
        this.m_fullScreenMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.0));
        this.m_scene = new THREE.Scene();
        this.m_readTarget = new THREE.WebGLRenderTarget(targetSize, targetSize);
        this.m_writeTarget = new THREE.WebGLRenderTarget(targetSize, targetSize);
        var targetSizePow = Math.log2(targetSize);
        this.m_reduceTargets = new Array(targetSizePow - 1);
        for (var i = 0; i < this.m_reduceTargets.length; i++) {
            this.m_reduceTargets[i] = new THREE.WebGLRenderTarget(2 << i, lightSize, {
                magFilter: THREE.NearestFilter,
                minFilter: THREE.NearestFilter
            });
        }
        this.m_basicShader = new THREE.ShaderMaterial({
            uniforms: {
                texture: { type: "t", value: null }
            }
        });
        this.loadShader(this.m_basicShader, "glsl/vs-fullscreen.glsl", "glsl/fs-basic.glsl");
        this.m_distanceShader = new THREE.ShaderMaterial({
            uniforms: {
                texture: { type: "t", value: null }
            }
        });
        this.loadShader(this.m_distanceShader, "glsl/vs-fullscreen.glsl", "glsl/fs-distance.glsl");
        this.m_distortShader = new THREE.ShaderMaterial({
            uniforms: {
                texture: { type: "t", value: null }
            }
        });
        this.loadShader(this.m_distortShader, "glsl/vs-fullscreen.glsl", "glsl/fs-distort.glsl");
        this.m_reduceShader = new THREE.ShaderMaterial({
            uniforms: {
                texture: { type: "t", value: null },
                pixelSize: { type: "f", value: 0.0 }
            }
        });
        this.loadShader(this.m_reduceShader, "glsl/vs-fullscreen.glsl", "glsl/fs-reduce.glsl");
        this.m_shadowShader = new THREE.ShaderMaterial({
            uniforms: {
                texture: { type: "t", value: null },
                pixelSize: { type: "f", value: 0.0 },
                bias: { type: "f", value: 0.0 }
            }
        });
        this.loadShader(this.m_shadowShader, "glsl/vs-fullscreen.glsl", "glsl/fs-shadow.glsl");
        this.m_blurHorShader = new THREE.ShaderMaterial({
            uniforms: {
                texture: { type: "t", value: null },
                pixelSize: { type: "f", value: 0.0 },
                minBlur: { type: "f", value: 0.0 },
                maxBlur: { type: "f", value: 0.0 }
            }
        });
        this.loadShader(this.m_blurHorShader, "glsl/vs-fullscreen.glsl", "glsl/fs-blurHor.glsl");
        this.m_blurVerShader = new THREE.ShaderMaterial({
            uniforms: {
                texture: { type: "t", value: null },
                pixelSize: { type: "f", value: 0.0 },
                minBlur: { type: "f", value: 0.0 },
                maxBlur: { type: "f", value: 0.0 }
            }
        });
        this.loadShader(this.m_blurVerShader, "glsl/vs-fullscreen.glsl", "glsl/fs-blurVer.glsl");
        this.m_attenuateShader = new THREE.ShaderMaterial({
            uniforms: {
                texture: { type: "t", value: null },
                ambient: { type: "f", value: 0.0 },
                exponent: { type: "f", value: 0.0 }
            }
        });
        this.loadShader(this.m_attenuateShader, "glsl/vs-fullscreen.glsl", "glsl/fs-attenuate.glsl");
        this.m_bakeShader = new THREE.ShaderMaterial({
            uniforms: {
                texture: { type: "t", value: null },
                color: { type: "v4", value: 0.0 }
            }
        });
        this.loadShader(this.m_bakeShader, "glsl/vs-fullscreen.glsl", "glsl/fs-bake.glsl");
    }
    get loadingCount() { return this.m_loadingCount; }
    get generationTime() { return this.m_generationTime; }
    get minBlur() { return this.m_minBlur; }
    set minBlur(val) { this.m_minBlur = val; }
    get maxBlur() { return this.m_maxBlur; }
    set maxBlur(val) { this.m_maxBlur = val; }
    get bias() { return this.m_bias; }
    set bias(val) { this.m_bias = val; }
    get ambient() { return this.m_ambient; }
    set ambient(val) { this.m_ambient = val; }
    get exponent() { return this.m_exponent; }
    set exponent(val) { this.m_exponent = val; }
    get lightGeometry() {
        return new THREE.PlaneGeometry(this.m_lightSize, this.m_lightSize);
    }
    dispose() {
        this.m_readTarget.dispose();
        this.m_writeTarget.dispose();
        for (var i = 0; i < this.m_reduceTargets.length; i++) {
            this.m_reduceTargets[i].dispose();
        }
        this.m_basicShader.dispose();
        this.m_distanceShader.dispose();
        this.m_distortShader.dispose();
        this.m_reduceShader.dispose();
        this.m_shadowShader.dispose();
        this.m_blurHorShader.dispose();
        this.m_blurVerShader.dispose();
        this.m_attenuateShader.dispose();
        this.m_bakeShader.dispose();
    }
    static default(val, def) {
        return (typeof (val) !== "undefined") ? val : def;
    }
    static powerOfTwo(num) {
        if (num < 0) {
            throw "TODO: Exception";
        }
        return num != 0 && (num & (num - 1)) == 0;
    }
    loadShader(material, vertexURL, fragmentURL) {
        this.m_loadingCount++;
        $.ajax(vertexURL, {
            context: this,
            error: function () {
                console.log("failed: " + vertexURL);
                this.m_loadingCount--;
            },
            success: function (data) {
                material.vertexShader = data;
                console.log("loaded: " + vertexURL);
                this.m_loadingCount--;
            }
        });
        $.ajax(fragmentURL, {
            context: this,
            error: function () {
                console.log("failed: " + fragmentURL);
                this.m_loadingCount--;
            },
            success: function (data) {
                material.fragmentShader = data;
                console.log("loaded: " + fragmentURL);
                this.m_loadingCount--;
            }
        });
    }
    runShaderPass(renderer, target, shader, uniforms) {
        for (var k in uniforms) {
            if (!shader.uniforms.hasOwnProperty(k))
                continue;
            shader.uniforms[k].value = uniforms[k];
        }
        this.m_fullScreenMesh.material = shader;
        renderer.render(this.m_scene, this.m_fullScreenCamera, target, true);
    }
    swapTargets() {
        var tmp = this.m_readTarget;
        this.m_readTarget = this.m_writeTarget;
        this.m_writeTarget = tmp;
    }
    generateReduceMaps(renderer) {
        this.m_scene.add(this.m_fullScreenMesh);
        var step = this.m_reduceTargets.length - 1;
        var readTarget = this.m_readTarget;
        while (step >= 0) {
            var stepTarget = this.m_reduceTargets[step];
            this.runShaderPass(renderer, stepTarget, this.m_reduceShader, { texture: readTarget, pixelSize: 1.0 / readTarget.width });
            readTarget = stepTarget;
            step--;
        }
        this.m_scene.remove(this.m_fullScreenMesh);
    }
    generateShadowMap(renderer, sceneTarget, lightPos, lightColor) {
        lightPos.z = 0; // Ignore z component of given vector
        // Prepare renderer
        renderer.setViewport(0, 0, sceneTarget.width, sceneTarget.height);
        // Record time for tracking execution time
        var startTime = performance.now();
        // Initial render into read/write buffers
        this.m_basicShader.uniforms["texture"].value = sceneTarget;
        var sceneTargetMesh = new THREE.Mesh(new THREE.PlaneGeometry(sceneTarget.width, sceneTarget.height), this.m_basicShader);
        sceneTargetMesh.position.copy(lightPos);
        sceneTargetMesh.position.negate();
        this.m_scene.add(sceneTargetMesh);
        renderer.render(this.m_scene, this.m_lightCamera, this.m_writeTarget, true);
        this.m_scene.remove(sceneTargetMesh);
        this.swapTargets();
        // Set up post processing
        var pixelSize = 1.0 / this.m_lightSize;
        this.m_scene.add(this.m_fullScreenMesh);
        // Compute distance map
        this.runShaderPass(renderer, this.m_writeTarget, this.m_distanceShader, { texture: this.m_readTarget });
        this.swapTargets();
        // Distort distance map
        this.runShaderPass(renderer, this.m_writeTarget, this.m_distortShader, { texture: this.m_readTarget });
        this.swapTargets();
        // Shrink distort map
        this.m_scene.remove(this.m_fullScreenMesh);
        this.generateReduceMaps(renderer);
        this.m_scene.add(this.m_fullScreenMesh);
        // Generate shadow map
        this.runShaderPass(renderer, this.m_writeTarget, this.m_shadowShader, {
            texture: this.m_reduceTargets[0],
            pixelSize: pixelSize,
            bias: this.m_bias
        });
        this.swapTargets();
        // Blur shadow map
        this.runShaderPass(renderer, this.m_writeTarget, this.m_blurHorShader, {
            texture: this.m_readTarget,
            pixelSize: pixelSize,
            minBlur: this.m_minBlur,
            maxBlur: this.m_maxBlur
        });
        this.swapTargets();
        this.runShaderPass(renderer, this.m_writeTarget, this.m_blurVerShader, {
            texture: this.m_readTarget,
            pixelSize: pixelSize,
            minBlur: this.m_minBlur,
            maxBlur: this.m_maxBlur
        });
        this.swapTargets();
        // Attenuate shadow map
        this.runShaderPass(renderer, this.m_writeTarget, this.m_attenuateShader, {
            texture: this.m_readTarget,
            ambient: this.m_ambient,
            exponent: this.m_exponent
        });
        this.swapTargets();
        // Color shadow map
        this.runShaderPass(renderer, this.m_writeTarget, this.m_bakeShader, {
            texture: this.m_readTarget,
            color: lightColor
        });
        this.swapTargets();
        // Clean up and return read buffer
        this.m_scene.remove(this.m_fullScreenMesh);
        // Calculate and store execution time
        this.m_generationTime = performance.now() - startTime;
        return this.m_readTarget;
    }
}
