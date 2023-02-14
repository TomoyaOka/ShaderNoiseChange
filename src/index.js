import * as THREE from "three";
import { gsap, Power4 } from "gsap";

class App {
  /**
   * レンダー
   */
  static get RENDERER_SETTING() {
    return {
      clearColor: 0x111111,
      width: window.innerWidth,
      height: window.innerHeight,
    };
  }

  /**
   * マテリアル
   */
  static get MATERIAL_SETTING() {
    return {
      color: 0xffffff,
    };
  }
  /**
   * カメラ
   */
  static get CAMERA_PARAM() {
    return {
      fovy: 60,
      aspect: window.innerWidth / window.innerHeight,
      near: 0.01,
      far: 200000.0,
      x: 0.0,
      y: 0.0,
      z: 10.5,
      // z: 0.5,
      lookAt: new THREE.Vector3(0.0, 0.0, 0.0),
    };
  }

  /**
   * @constructor
   */
  constructor() {
    this.renderer;
    this.scene;
    this.camera;
    this.geometory;
    this.material;
    this.mesh;
    this.array = [];
    this.group;
    this.controls;
    this.composer;
    this.model;
    this.ambientLight;
    this.directionalLight;
    this.gltf;
    this.loader;
    this.texture;
    this.Geometry = [];
    this.raycaster;
    this.sampler;
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.render = this.render.bind(this);
  }

  _setRenderer() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setClearColor(0x111111, 0.0);
    this.renderer.setSize(App.RENDERER_SETTING.width, App.RENDERER_SETTING.height);
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.physicallyCorrectLights = true;
    this.renderer.toneMappingExposure = 1.75;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const canvas = document.querySelector("#render");
    canvas.appendChild(this.renderer.domElement);
  }

  _setScene() {
    this.scene = new THREE.Scene();
  }

  _setCamera() {
    this.camera = new THREE.PerspectiveCamera(App.CAMERA_PARAM.fovy, App.CAMERA_PARAM.aspect, App.CAMERA_PARAM.near, App.CAMERA_PARAM.far);
    this.camera.position.set(App.CAMERA_PARAM.x, App.CAMERA_PARAM.y, App.CAMERA_PARAM.z);
    this.camera.lookAt(App.CAMERA_PARAM.lookAt);
    this.camera.updateProjectionMatrix();
  }

  _setLight() {
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
    this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.0);
    this.directionalLight.position.set(-1.0, 110.0, 0.9);
    this.directionalLight.castShadow = true;
    this.scene.add(this.ambientLight);
    this.scene.add(this.directionalLight);
  }

  _setMesh() {
    const imagePath01 = "./img01.jpg";
    const imagePath02 = "./img02.jpg";
    const noiseMap = "./noise02.jpg";
    const images = [imagePath01, imagePath02];
    const loader = new THREE.TextureLoader();
    const texture01 = loader.load(images[0]);
    const texture02 = loader.load(images[1]);
    this.disp = loader.load(noiseMap, this.render);
    this.disp.magFilter = this.disp.minFilter = THREE.LinearFilter;
    this.disp.wrapS = this.disp.wrapT = THREE.RepeatWrapping;
    const uniforms = {
      uCurrentTexture: { value: texture01 },
      uNextTexture: { value: texture02 },
      uChangeTransition: { value: 0.0 },
      disp: { value: this.disp },
      dispPower: { value: 0.0 },
    };
    this.Geometry = new THREE.PlaneGeometry(6, 8);
    this.Material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: `
      varying vec2 vUv;
      void main(){
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
      `,
      fragmentShader: `
      varying vec2 vUv;
      uniform sampler2D uCurrentTexture;
      uniform sampler2D uNextTexture;
      uniform sampler2D disp;
      uniform float uChangeTransition;

    void main() {

      vec2 uv = vUv;
      vec4 currentImages;
      vec4 nextImages;
      float intensity = 1.0;
      float number = 1.0;

      vec4 disp = texture2D(disp, uv);
      vec2 dispVec = vec2(disp.x, disp.y);
      
      vec2 distPos1 = uv + (dispVec * intensity * uChangeTransition);
      vec2 distPos2 = uv + (dispVec * -(intensity * (5.0 - uChangeTransition)));

      vec4 oneImg = texture2D(uCurrentTexture, distPos1);
      vec4 twoImg = texture2D(uNextTexture, distPos2);
      currentImages = texture2D(uCurrentTexture, vec2(uv.x, uv.y + uChangeTransition * (twoImg * intensity)));
      nextImages = texture2D(uNextTexture, vec2(uv.x, uv.y + (number - uChangeTransition) * (number - oneImg * intensity)));
      vec4 finalTexture = mix(currentImages, nextImages, uChangeTransition);

      gl_FragColor = finalTexture;

  }
      `,
    });
    this.Mesh = new THREE.Mesh(this.Geometry, this.Material);
    this.scene.add(this.Mesh);
  }

  _setKvAnimations() {
    const tl = gsap.timeline({ repeat: -1 });
    tl.to(this.Mesh.material.uniforms.uChangeTransition, {
      value: 1,
      ease: Power4.easeOut,
      delay: 0.6,
      duration: 3,
    }).to(this.Mesh.material.uniforms.uChangeTransition, {
      value: 0,
      ease: Power4.easeOut,
      delay: 0.6,
      duration: 3,
    });
  }

  init() {
    this._setRenderer();
    this._setScene();
    this._setCamera();
    this._setLight();
    this._setMesh();
    this._setKvAnimations();
  }

  render() {
    requestAnimationFrame(this.render);
    this.renderer.render(this.scene, this.camera);
  }

  onResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(width, height);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }
}

window.addEventListener("DOMContentLoaded", () => {
  const app = new App();
  app.init();
  app.render();
  window.addEventListener("resize", () => {
    app.onResize();
  });
});

export {};
