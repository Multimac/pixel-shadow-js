/// <reference path="typings/tsd.d.ts" />
"use strict";
class ShadowJS {
    constructor(lightSize, options) {
        options = ShadowJS.default(options, {});
        var targetSize = ShadowJS.default(options.renderTargetSize, lightSize);
        if (!ShadowJS.powerOfTwo(targetSize)) {
            throw "TODO: Exception";
        }
        this.m_loadingCount = 0;
        this.m_threshold = ShadowJS.default(options.threshold, 0.25);
        this.m_minBlur = ShadowJS.default(options.minBlur, 0.0);
        this.m_maxBlur = ShadowJS.default(options.minBlur, 3.0);
        this.m_bias = ShadowJS.default(options.minBlur, 2.0);
        this.m_ambient = ShadowJS.default(options.minBlur, 0.25);
        this.m_exponent = ShadowJS.default(options.minBlur, 1.0);
        this.initShaders();
        this.m_lightSize = lightSize;
        var halfLightSize = lightSize / 2.0;
        this.m_lightCamera = new THREE.OrthographicCamera(-halfLightSize, halfLightSize, halfLightSize, -halfLightSize, 0.0, 1.0);
        this.m_fullScreenCamera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0.0, 1.0);
        this.m_fullScreenMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.0));
        this.m_fullScreenScene = new THREE.Scene();
        this.m_fullScreenScene.add(this.m_fullScreenMesh);
        this.m_sceneTargetGeometry = new THREE.PlaneGeometry(1.0, 1.0);
        this.m_sceneTargetMesh = new THREE.Mesh(this.m_sceneTargetGeometry, this.m_basicShader);
        this.m_sceneTargetScene = new THREE.Scene();
        this.m_sceneTargetScene.add(this.m_sceneTargetMesh);
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
    }
    get loadingCount() { return this.m_loadingCount; }
    get generationTime() { return this.m_generationTime; }
    get threshold() { return this.m_threshold; }
    set threshold(val) { this.m_threshold = val; }
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
    initShaders() {
        this.m_basicShader = new THREE.ShaderMaterial({
            uniforms: {
                texture: { type: "t", value: null }
            }
        });
        this.loadShader(this.m_basicShader, "glsl/vs-fullscreen.glsl", "glsl/fs-basic.glsl");
        this.m_distanceDistortShader = new THREE.ShaderMaterial({
            uniforms: {
                texture: { type: "t", value: null },
                threshold: { type: "f", value: 0.0 }
            }
        });
        this.loadShader(this.m_distanceDistortShader, "glsl/vs-fullscreen.glsl", "glsl/fs-distance-distort.glsl");
        this.m_reduceX2Shader = new THREE.ShaderMaterial({
            uniforms: {
                texture: { type: "t", value: null },
                pixelSize: { type: "f", value: 0.0 }
            }
        });
        this.loadShader(this.m_reduceX2Shader, "glsl/vs-fullscreen.glsl", "glsl/fs-reducex2.glsl");
        this.m_reduceX4Shader = new THREE.ShaderMaterial({
            uniforms: {
                texture: { type: "t", value: null },
                pixelSize: { type: "f", value: 0.0 }
            }
        });
        this.loadShader(this.m_reduceX4Shader, "glsl/vs-fullscreen.glsl", "glsl/fs-reducex4.glsl");
        this.m_reduceX8Shader = new THREE.ShaderMaterial({
            uniforms: {
                texture: { type: "t", value: null },
                pixelSize: { type: "f", value: 0.0 }
            }
        });
        this.loadShader(this.m_reduceX8Shader, "glsl/vs-fullscreen.glsl", "glsl/fs-reducex8.glsl");
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
        this.m_attenuateBakeShader = new THREE.ShaderMaterial({
            uniforms: {
                texture: { type: "t", value: null },
                ambient: { type: "f", value: 0.0 },
                exponent: { type: "f", value: 0.0 },
                color: { type: "v4", value: new THREE.Vector4(1, 1, 1, 1) }
            }
        });
        this.loadShader(this.m_attenuateBakeShader, "glsl/vs-fullscreen.glsl", "glsl/fs-attenuate-bake.glsl");
    }
    dispose() {
        this.m_readTarget.dispose();
        this.m_writeTarget.dispose();
        for (var i = 0; i < this.m_reduceTargets.length; i++) {
            this.m_reduceTargets[i].dispose();
        }
        this.m_basicShader.dispose();
        this.m_distanceDistortShader.dispose();
        this.m_reduceX2Shader.dispose();
        this.m_shadowShader.dispose();
        this.m_blurHorShader.dispose();
        this.m_blurVerShader.dispose();
        this.m_attenuateBakeShader.dispose();
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
        renderer.render(this.m_fullScreenScene, this.m_fullScreenCamera, target, true);
    }
    swapTargets() {
        var tmp = this.m_readTarget;
        this.m_readTarget = this.m_writeTarget;
        this.m_writeTarget = tmp;
    }
    generateReduceMaps(renderer) {
        var step = this.m_reduceTargets.length;
        var readTarget = this.m_readTarget;
        while (step > 0) {
            var reduceShader = null;
            var stepReduction = 0;
            switch (step) {
                default:
                    reduceShader = this.m_reduceX8Shader;
                    stepReduction = 3;
                    break;
                case 2:
                    reduceShader = this.m_reduceX4Shader;
                    stepReduction = 2;
                    break;
                case 1:
                    reduceShader = this.m_reduceX2Shader;
                    stepReduction = 1;
                    break;
            }
            step -= stepReduction;
            var stepTarget = this.m_reduceTargets[step];
            this.runShaderPass(renderer, stepTarget, reduceShader, {
                texture: readTarget,
                pixelSize: 1.0 / readTarget.width
            });
            readTarget = stepTarget;
        }
    }
    generateShadowMap(renderer, sceneTarget, lightPos, lightColor) {
        lightPos.z = 0; // Ignore z component of given vector
        // Prepare renderer
        renderer.setViewport(0, 0, sceneTarget.width, sceneTarget.height);
        // Record time for tracking execution time
        var startTime = performance.now();
        // Initial render into read/write buffers
        this.m_basicShader.uniforms["texture"].value = sceneTarget;
        var geomParams = this.m_sceneTargetGeometry.parameters;
        if (geomParams.width != sceneTarget.width || geomParams.height != sceneTarget.height) {
            this.m_sceneTargetGeometry.dispose();
            console.log("recreating sceneTargetGeometry: " + sceneTarget.width + ", " + sceneTarget.height);
            this.m_sceneTargetGeometry = new THREE.PlaneGeometry(sceneTarget.width, sceneTarget.height);
            this.m_sceneTargetMesh.geometry = this.m_sceneTargetGeometry;
        }
        this.m_sceneTargetMesh.position.copy(lightPos);
        this.m_sceneTargetMesh.position.negate();
        renderer.render(this.m_sceneTargetScene, this.m_lightCamera, this.m_writeTarget, true);
        this.swapTargets();
        // Set up post processing
        var pixelSize = 1.0 / this.m_lightSize;
        // Compute distance and distort the shadow map
        this.runShaderPass(renderer, this.m_writeTarget, this.m_distanceDistortShader, {
            texture: this.m_readTarget,
            threshold: this.m_threshold
        });
        this.swapTargets();
        // Shrink distort map
        for (var i = 0; i < 10; i++) {
            this.generateReduceMaps(renderer);
        }
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
        // Attenuate and color the shadow map
        this.runShaderPass(renderer, this.m_writeTarget, this.m_attenuateBakeShader, {
            texture: this.m_readTarget,
            ambient: this.m_ambient,
            exponent: this.m_exponent,
            color: lightColor
        });
        this.swapTargets();
        // Calculate and store execution time
        this.m_generationTime = performance.now() - startTime;
        return this.m_readTarget;
    }
}
//# sourceMappingURL=shadow.js.map