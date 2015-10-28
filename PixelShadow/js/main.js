(function() {
    var m_canvasWidth = 0;
    var m_canvasHeight = 0;
    var m_cameraWidth = 0;
    var m_cameraHeight = 0;

    var m_renderer = null;

    var m_casterScene = null;
    var m_completeScene = null;

    var m_sceneTarget = null;

    var m_camera = null;
    var m_fullScreenCamera = null;

    var m_fullScreenQuad = null;

    var m_image = null;
    var m_imageTwo = null;

    var m_lights = null;
    var m_lightQuad = null;
    var m_lightSize = null;

    var m_shadow = null;

    var m_loadingCount = 0;

    var setupWebGL = function() {
        m_canvasWidth = window.innerWidth;
        m_canvasHeight = window.innerHeight;
        m_cameraWidth = Math.floor(m_canvasWidth / 2.0);
        m_cameraHeight = Math.floor(m_canvasHeight / 2.0);

        m_renderer = new THREE.WebGLRenderer({ canvas: document.getElementById("canvas") });
        m_renderer.setSize(m_canvasWidth, m_canvasHeight);
        m_renderer.autoClear = false;

        m_casterScene = new THREE.Scene();
        m_completeScene = new THREE.Scene();

        m_sceneTarget = new THREE.WebGLRenderTarget(m_canvasWidth, m_canvasHeight);

        m_fullScreenQuad = new THREE.Mesh(
            new THREE.PlaneGeometry(1.0, 1.0)
        );
        m_fullScreenQuadTwo = new THREE.Mesh(
            new THREE.PlaneGeometry(1.0, 1.0)
        );

        m_camera = new THREE.OrthographicCamera(
            -m_cameraWidth, m_cameraWidth,
            m_cameraHeight, -m_cameraHeight,
            0.0, 1.0
        );
        m_fullScreenCamera = new THREE.OrthographicCamera(
            -0.5, 0.5,
            0.5, -0.5,
            0.0, 1.0
        );
    }

    var loadTexture = function(textureLoader, mesh, filename) {
        m_loadingCount++;
        textureLoader.load(
            filename,
            function(texture) {
                mesh.geometry = new THREE.PlaneGeometry(
                    texture.image.width,
                    texture.image.height
                );
                mesh.material = new THREE.MeshBasicMaterial({
                    map: texture,
                    blending: THREE.CustomBlending,
                    blendEquation: THREE.AddEquation,
                    blendSrc: THREE.One,
                    blendDst: THREE.OneMinusSrcAlphaFactor,
                    transparent: true
                });

                console.log("loaded: " + filename);
                m_loadingCount--;
            },
            function(e) { },
            function(e) {
                console.log("failed: " + filename);
                m_loadingCount--;
            }
        );
    }

    var loadAllTextures = function(loadingManager) {
        var textureLoader = new THREE.TextureLoader(loadingManager);

        loadTexture(textureLoader, m_image, "textures/SRU-Logo-Transparent.png");
        loadTexture(textureLoader, m_imageTwo, "textures/SRU-Logo-Transparent.png");
    }

    var init = function() {
        m_image = new THREE.Mesh(new THREE.PlaneGeometry(1, 1));
        m_casterScene.add(m_image);

        m_imageTwo = new THREE.Mesh(new THREE.PlaneGeometry(1, 1));
        m_completeScene.add(m_imageTwo);

        m_shadow = new ShadowJS(256, { renderTargetSize: 1024 });

        m_lightQuad = new THREE.Mesh(
            m_shadow.lightGeometry
        );
        m_lights = [
            { pos: new THREE.Vector3( 100, -100, 0), color: new THREE.Vector4(1, 1, 0, 1.00) },
            { pos: new THREE.Vector3(-300,  000, 0), color: new THREE.Vector4(1, 0, 1, 1.00) },
            { pos: new THREE.Vector3(-100,  300, 0), color: new THREE.Vector4(0, 1, 1, 1.00) },
            { pos: new THREE.Vector3( 400,  100, 0), color: new THREE.Vector4(1, 1, 1, 1.00) },
            { pos: new THREE.Vector3(-150, -150, 0), color: new THREE.Vector4(1, 1, 1, 0.25) }
        ];

        // Load external content
        var loadingManager = new THREE.LoadingManager();
        loadAllTextures(loadingManager);
    }

    var moveLight = function(e) {
        var tmpPos = { x: e.x, y: e.y };
        tmpPos.x -= m_canvasWidth / 2.0;
        tmpPos.y -= m_canvasHeight / 2.0;
        tmpPos.y *= -1.0;

        m_lights[0].pos.x = tmpPos.x;
        m_lights[0].pos.y = tmpPos.y;
    }

    var render = function () {
        requestAnimationFrame(render);

        if (m_loadingCount != 0)
            console.log("waiting on " + m_loadingCount + "...");
        else {
            m_image.rotation.z += THREE.Math.degToRad(0.125);

            // Set up rendering
            m_renderer.setViewport(0, 0, m_canvasWidth, m_canvasHeight);

            // Render shadow casters
            m_renderer.clearTarget(m_sceneTarget);

            m_renderer.render(m_casterScene, m_camera, m_sceneTarget);

            // Render all lights
            var scene = new THREE.Scene();

            m_renderer.clearTarget(null);

            scene.add(m_lightQuad);    
            for (var i = 0; i < m_lights.length; i++) {
                var l = m_lights[i];
                
                shadowMap = m_shadow.generateShadowMap(m_renderer, m_sceneTarget, l.pos, l.color);

                // Render shadow map

                m_lightQuad.material = new THREE.MeshBasicMaterial({ map: shadowMap, transparent: true });
                m_lightQuad.position.copy(l.pos);

                m_renderer.clearDepth();
                m_renderer.render(scene, m_camera);
            }
            scene.remove(m_lightQuad);

            // Render all objects
            m_renderer.clearTarget(m_sceneTarget);

            m_renderer.render(m_completeScene, m_camera, m_sceneTarget);
            m_renderer.render(m_casterScene, m_camera, m_sceneTarget);

            // Render shadow casters (for shimmering effect)
            scene.add(m_fullScreenQuad);

            options = {
                map: m_sceneTarget,
                blending: THREE.CustomBlending,
                blendEquation: THREE.MultiplyEquation,
                blendSrc: THREE.DstColorFactor,
                blendDst: THREE.SrcColorFactor,
                transparent: true
            };

            m_fullScreenQuad.material = new THREE.MeshBasicMaterial(options);

            m_renderer.clearDepth();
            m_renderer.render(scene, m_fullScreenCamera);

            scene.remove(m_fullScreenQuad);
        }
    };

    setupWebGL();
    init();

    window.addEventListener("mousemove", moveLight);

    render();
})();