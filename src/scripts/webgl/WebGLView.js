// https://tympanus.net/codrops/2020/01/07/playing-with-texture-projection-in-three-js/

import * as THREE from 'three';
import GLTFLoader from 'three-gltf-loader';
import glslify from 'glslify';
import Tweakpane from 'tweakpane';
import OrbitControls from 'three-orbitcontrols';
import TweenMax from 'TweenMax';
import basicDiffuseFrag from '../../shaders/basicDiffuse.frag';
import basicDiffuseVert from '../../shaders/basicDiffuse.vert';
import MouseCanvas from '../MouseCanvas';
import TextCanvas from '../TextCanvas';
import RenderTri from '../RenderTri';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { BloomPass } from 'three/examples/jsm/postprocessing/BloomPass.js';
import { FilmPass } from 'three/examples/jsm/postprocessing/FilmPass.js';
import { debounce } from '../utils/debounce';
import ProjectedMaterial, { project } from '../ProjectedMaterial'
import { random } from 'lodash';

export default class WebGLView {
  constructor(app) {
    this.app = app;


    this.init();
  }

  async init() {
    this.initThree();
    this.initBgScene();
    this.initLights();
    this.initTweakPane();
    // await this.loadTestMesh();
    this.setupTextCanvas();
    this.initMouseMoveListen();
    this.initMouseCanvas();
    this.initRenderTri();
    this.initPostProcessing();
    this.initResizeHandler();

    this.initStuff();
  }



  initResizeHandler() {
    window.addEventListener(
      'resize',
      debounce(() => {
        this.width = window.innerWidth;
        this.height = window.innerHeight;

        this.renderer.setSize(this.width, this.height);

        // render tri
        this.renderTri.renderer.setSize(this.width, this.height);
        this.renderTri.triMaterial.uniforms.uResolution.value = new THREE.Vector2(
          this.width,
          this.height
        );

        // bg scene
        this.bgRenderTarget.setSize(this.width, this.height);
        this.bgCamera.aspect = this.width / this.height;
        this.bgCamera.updateProjectionMatrix();

        // text canvas
        this.textCanvas.canvas.width = this.width;
        this.textCanvas.canvas.height = this.height;
        this.setupTextCanvas();
        this.renderTri.triMaterial.uniforms.uTextCanvas.value = this.textCanvas.texture;

        // mouse canvas
        this.mouseCanvas.canvas.width = this.width;
        this.mouseCanvas.canvas.height = this.height;

        // composer
        this.composer.setSize(this.width, this.height);
      }, 500)
    );
  }

  initPostProcessing() {
    this.composer = new EffectComposer(this.renderer);

    this.composer.addPass(new RenderPass(this.scene, this.camera));

    // const bloomPass = new BloomPass(
    //   1, // strength
    //   25, // kernel size
    //   4, // sigma ?
    //   256 // blur render target resolution
    // );
    // this.composer.addPass(bloomPass);

    // const filmPass = new FilmPass(
    //   0.35, // noise intensity
    //   0.025, // scanline intensity
    //   648, // scanline count
    //   false // grayscale
    // );
    // filmPass.renderToScreen = true;
    // this.composer.addPass(filmPass);
  }

  initTweakPane() {
    this.PARAMS = {
      rotation: 0.0,
      lineWidth: 0.3,
      repeat: 2,
      timeMulti: 0.005,
      noiseAtten: 1.0
    };

    this.pane = new Tweakpane();

    this.pane
      .addInput(this.PARAMS, 'rotation', {
        min: 0.0,
        max: 6.0
      })
      .on('change', value => {
        this.planeMat.uniforms.rotation.value = value;
      });

    this.pane
      .addInput(this.PARAMS, 'lineWidth', {
        min: 0.0,
        max: Math.PI
      })
      .on('change', value => {
        this.planeMat.uniforms.lineWidth.value = value;
      });

    this.pane
      .addInput(this.PARAMS, 'repeat', {
        min: 0.0,
        max: 100
      })
      .on('change', value => {
        this.planeMat.uniforms.repeat.value = value;
      });

    this.pane
      .addInput(this.PARAMS, 'timeMulti', {
        min: 0.0,
        max: 0.5
      })
      .on('change', value => {
        this.planeMat.uniforms.timeMulti.value = value;
      });

    this.pane
      .addInput(this.PARAMS, 'noiseAtten', {
        min: 0.0,
        max: 10.0
      })
      .on('change', value => {
        this.planeMat.uniforms.noiseAtten.value = value;
      });
  }

  initMouseCanvas() {
    this.mouseCanvas = new MouseCanvas();
  }

  initMouseMoveListen() {
    this.mouse = new THREE.Vector2(0, 0);
    this.mouseTarget = new THREE.Vector2(0, 0);
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    window.addEventListener('mousemove', ({ pageX, pageY }) => {
      this.mouse.x = 2 * (pageX / this.width - 0.5);
      this.mouse.y = 2 * (pageY / this.height - 0.5);

      this.mouseCanvas.addTouch(this.mouse);
    });
  }

  initThree() {
    this.scene = new THREE.Scene();

    this.camera = new THREE.OrthographicCamera();

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.autoClear = true;

    this.clock = new THREE.Clock();
  }

  setupTextCanvas() {
    this.textCanvas = new TextCanvas(this);
  }

  async initStuff() {

    let loader = new THREE.TextureLoader();

    loader.load('./dog.jpg', texture => {
      this.addElements(texture);
    });

  }

  addElements(texture) {
    this.elements = new THREE.Group()
    const NUM_ELEMENTS = 50
    for (let i = 0; i < NUM_ELEMENTS; i++) {
      // const geometry = new THREE.IcosahedronGeometry(random(0.1, 0.5))
      const geometry = new THREE.PlaneBufferGeometry(0.3, 0.3, 1, 1)
      const material = new ProjectedMaterial({
        // use the scene camera itself
        camera: this.bgCamera,
        texture: texture,
        color: '#3149D5',
        textureScale: 0.8,
        transparent: true
      });
      const element = new THREE.Mesh(geometry, material);

      // move the meshes any way you want!
      // if (i < NUM_ELEMENTS * 0.3) {
      element.position.x = random(-1, 1, true);
      element.position.y = random(-2, 2, true);
      element.position.z = random(1, 2); //random(-0.3, 0.3)
      element.scale.multiplyScalar(1.4)
      // } 
      /*else {
        element.position.x = random(-1, 1, true);
        element.position.y = random(-2, 2, true);
        element.position.z = random(-0.5, 0.5);
      }*/
      // element.rotation.x = random(0, Math.PI * 2)
      // element.rotation.y = random(0, Math.PI * 2)
      // element.rotation.z = random(0, Math.PI * 2)

      // and when you're ready project the texture!
      project(element)
      this.elements.add(element)

      const randomDur = random(1.0, 4.0);
      TweenMax.to(element.position, randomDur, {
        x: '+=' + random(-1.0, 1.0),
        repeat: -1
      });

      TweenMax.to(element.material.uniforms.opacity, randomDur, {
        value: 0,
        repeat: -1,
      });
    }
    this.bgScene.add(this.elements);


    // add bg
    const geometry = new THREE.PlaneBufferGeometry(3, 3, 1, 1)
    const material = new ProjectedMaterial({
      // use the scene camera itself
      camera: this.bgCamera,
      texture: texture,
      color: '#3149D5',
      textureScale: 0.8,
      transparent: true
    });
    const element = new THREE.Mesh(geometry, material);

    this.bgScene.add(element);
  }

  loadTestMesh() {
    return new Promise((res, rej) => {
      let loader = new GLTFLoader();

      loader.load('./bbali.glb', object => {
        this.testMesh = object.scene.children[0];
        console.log(this.testMesh);
        this.testMesh.add(new THREE.AxesHelper());

        this.testMeshMaterial = new THREE.ShaderMaterial({
          fragmentShader: glslify(baseDiffuseFrag),
          vertexShader: glslify(basicDiffuseVert),
          uniforms: {
            u_time: {
              value: 0.0
            },
            u_lightColor: {
              value: new THREE.Vector3(0.0, 1.0, 1.0)
            },
            u_lightPos: {
              value: new THREE.Vector3(-2.2, 2.0, 2.0)
            }
          }
        });

        this.testMesh.material = this.testMeshMaterial;
        this.testMesh.material.needsUpdate = true;

        this.bgScene.add(this.testMesh);
        res();
      });
    });
  }

  initRenderTri() {
    this.resize();

    this.renderTri = new RenderTri(
      this.scene,
      this.renderer,
      this.bgRenderTarget,
      this.mouseCanvas,
      this.textCanvas
    );
  }

  initBgScene() {
    this.bgRenderTarget = new THREE.WebGLRenderTarget(
      window.innerWidth,
      window.innerHeight
    );
    // this.bgCamera = new THREE.PerspectiveCamera(
    //   50,
    //   window.innerWidth / window.innerHeight,
    //   0.01,
    //   100
    // );

    const frustumSize = 3;
    const aspect = window.innerWidth / window.innerHeight;
    this.bgCamera = new THREE.OrthographicCamera(frustumSize * aspect / - 2, frustumSize * aspect / 2, frustumSize / 2, frustumSize / - 2, -1000, 1000);
    this.bgCamera.position.set(0, 0, 2);

    this.controls = new OrbitControls(this.bgCamera, this.renderer.domElement);

    this.bgCamera.position.z = 3;
    this.controls.update();

    this.bgScene = new THREE.Scene();
  }

  initLights() {
    this.pointLight = new THREE.PointLight(0xffffff, 3, 100);
    this.pointLight.position.set(0, 0, 50);
    this.bgScene.add(this.pointLight);

    // this.pointLight2 = new THREE.PointLight(0xffffff, 1, 100);
    // this.pointLight2.position.set(0, 0, -50);
    // this.bgScene.add(this.pointLight2);
  }

  resize() {
    if (!this.renderer) return;
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();

    this.fovHeight =
      2 *
      Math.tan((this.camera.fov * Math.PI) / 180 / 2) *
      this.camera.position.z;
    this.fovWidth = this.fovHeight * this.camera.aspect;

    this.renderer.setSize(window.innerWidth, window.innerHeight);

    if (this.trackball) this.trackball.handleResize();
  }

  updateTestMesh(time) {
    this.testMesh.rotation.y += this.PARAMS.rotSpeed;

    this.testMeshMaterial.uniforms.u_time.value = time;
  }

  updateTextCanvas(time) {
    this.textCanvas.textLine.update(time);
    this.textCanvas.textLine.draw(time);
    this.textCanvas.texture.needsUpdate = true;
  }

  update() {
    const delta = this.clock.getDelta();
    const time = performance.now() * 0.0005;

    this.controls.update();

    if (this.renderTri) {
      this.renderTri.triMaterial.uniforms.uTime.value = time;
    }

    if (this.testMesh) {
      this.updateTestMesh(time);
    }

    if (this.mouseCanvas) {
      this.mouseCanvas.update();
    }

    if (this.textCanvas) {
      this.updateTextCanvas(time);
    }

    if (this.trackball) this.trackball.update();

    if (this.plane) {
      this.planeMat.uniforms.u_time.value = time;
    }

    if (this.box) {
      this.mouseTarget.x -= 0.1 * (this.mouseTarget.x - this.mouse.x);
      this.mouseTarget.y -= 0.1 * (this.mouseTarget.y - this.mouse.y);

      this.box.rotation.y -= 0.003;

      // this.box.rotation.x = this.mouseTarget.x;
      // this.box.rotation.y = this.mouseTarget.y;

      // this.box.position.x += Math.sin(time) * 0.001;

    }
  }

  draw() {
    this.renderer.setRenderTarget(this.bgRenderTarget);
    this.renderer.render(this.bgScene, this.bgCamera);
    this.renderer.setRenderTarget(null);

    this.renderer.render(this.scene, this.camera);

    if (this.composer) {
      this.composer.render();
    }
  }
}
