。；/<template>
  <div id="app">
    <div class="content active">
      <div v-if="promptShow" class="prompt">
        <div class="center">
          抱歉,您的系统不支持3d阅片!
        </div>
      </div>
      <div class="sheet" v-if="sheetShow">
        <div class="center">
          <div v-if="!jd.err">
            <!-- <van-progress :percentage="jd.total" /> -->
            <div class="loadingio-spinner-spin-4y03ew5yh02">
              <div class="ldio-7vt5rjcst5h">
                <div><div></div></div>
                <div><div></div></div>
                <div><div></div></div>
                <div><div></div></div>
                <div><div></div></div>
                <div><div></div></div>
                <div><div></div></div>
                <div><div></div></div>
              </div>
            </div>
            <span class="load">{{ jd.total + "%" }}</span>
            <!-- <div class="info">数据加载中，请稍后...</div> -->
          </div>

          <div v-else>
            {{ jd.err }}
          </div>
        </div>
      </div>
      <canvas ref="canvas" id="myCanvas"></canvas>

      <!--顶部按钮-->
      <div class="open-btn-wrap" v-if="!sheetShow">
        <div class="open-btn1 reset" @click="reset"></div>
        <div class="open-btn2 open-panel" @click="switchPannel">
          <img v-if="changeEye" src="./assets/btn2.png" />
          <img v-else src="./assets/btn3.png" />
        </div>
        <div class="open-btn2" @click="switchColor">
          <img src="./assets/light.png" />
        </div>
        <!-- 自动旋转 -->
        <div class="open-btn2" @click="btn_rotate">
          <img v-if="rotate" src="./assets/rotate.png" />
          <img v-else src="./assets/rotate_play.png" />
        </div>
      </div>
    </div>

  <!--  <div id="msg-wrap" v-if="!sheetShow">
      <div class="msg">医院:{{ panzi.HospitalName }}</div>
      <div class="msg">科室:{{ panzi.Division }}</div>
      <div class="msg">
        患者:<span>{{ panzi.PatientName }}</span>
      </div>
    </div> -->

    <!--底部显示隐藏模型控制-->
    <div v-show="!sheetShow" class="control">
      <div @click="changeBoxshow()" class="boxshow">
        <p ref="boxshow">点击隐藏</p>
      </div>
        <div class="later" ref="later">
          <div
            class="later_item"
            v-for="(item, index) in modelObjs"
            v-show="boxshow"
            :key="index"
          >
            <div
              class="show"
              @touchstart="touchStart($event, index)"
              @touchmove.prevent="touchMove($event, index, item)"
              @touchend="touchEnd"
              @click.stop="toSwitch(item, index)"
            >
              <img v-if="item.visible" src="./assets/eye1.png" />
              <img v-else src="./assets/eye2.png" />
              <div
                v-if="item.visible"
                class="show_c"
                :style="{
                  background: item.color,
                  width: (item.opacity / 100) * 92 + 'px'
                }"
                @touchstart="touchStart($event, index)"
                @touchmove.prevent="touchMove($event, index, item)"
                @touchend="touchEnd"
              ></div>
            </div>
            <div class="each" ref="aeye" @click.stop="toSwitch(item, index)">
              <div
                v-if="item.visible"
                class="eup"
                ref="right"
                :style="{ background: item.color }"
              ></div>
              <div class="text" ref="text">
                <div>{{ item.name }}</div>
                <div class="volume">{{ item.volume}}ml</div>
              </div>
            </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>


import Detector from "./Detector.js";
import * as t from "three";
import s from "./STLLoader.js";
import o from "./TrackballControls.js";
import { OBJLoader, MTLLoader } from 'three-obj-mtl-loader'
import d from "./DragControls.js";
import f from "./FiberLoader.js";
import { colors2 } from "./lib/color.js";
import { data } from "./lib/data.js";
import axios from "axios";
import BScroll from "better-scroll";

import FBXLoader from './FBXLoader.js'
const Zlib = require("three/examples/js/libs/inflate.min");
window.Zlib = Zlib.Zlib;
let THREE = s(t);
THREE = o(THREE);
THREE = d(THREE);
THREE = f(THREE);
THREE = FBXLoader(THREE);
export default {
  name: "App",
  data() {
    return {
      boxshow: false,
      changeEye: true,
      currentRate: 0,
      time: 1 + parseInt(Math.random() * 1),
      i: 0,
      mapImg:[],
      Map:[],
      rotate: true, //旋转
      screenWidth: window.innerWidth, //获取浏览器窗口内部的宽度
      screenHeight: window.innerHeight, //获取浏览器窗口内部的高度
      // 不支持three.js时的遮罩
      promptShow: true,
      // 进度条遮罩
      sheetShow: true,
      // 进度条参数
      jd: {
        total: 0,
        model: 0,
        err: ""
      },
      modelObjs: [],
      // 场景,相机,渲染器,控制器
      scene: null,
      camera: null,
      renderer: null,
      controls: null,

      // 需要拖动的物体
      intersectObjects: [],

      // 模型组
      modelGroup: null,

      panzi: "",
      selectedModelControlIndex: -1,
      lastTouchPosition: -1,
      img1:'',
      img2:''
    };
  },
  created() {
    //打包时，应该用企业地址。
    //this.com = "http://3d.ziweidixing.com/";
    this.com = "http://192.168.1.118:44300/Name/"
  },

  mounted() {
    window.onresize = () => {
      return (() => {
        this.screenWidth = document.documentElement.clientWidth;
        this.screenHeight = document.documentElement.clientHeight;
        this.initScene({ w: up.w, h: up.h, dpi: up.dpi });
        this.loadModels();
        this.addControls();
      })();
    };
    // 是否支持three.js
    if (!Detector.webgl) {
      this.promptShow = true;
      return;
    }
    // 消除不支持three.js时的遮罩
    this.promptShow = false;

    // 获取url参数
    let up = this.getUrlObj();

    //初始化Scene
    this.initScene({ w: up.w, h: up.h, dpi: up.dpi });
    this.addControls();

    //拖拽功能，由于模型小了，在手机上也能较好的移动了而不卡顿。
    //解开注释就可以开启了
    // this.addDraggable()
    this.render();
    // this.$http
    //   .post(this.com + "api/OrderAdminFn.asmx/StlData", {
    //     ServerID: decodeURI(up.id)
    //   })
      this.$http.post(this.com,{
        jsonp: 'onBack'
      })
      .then(res => {
        console.log(res)
        axios.default.timeout = 10000;
        let str = res.data.data;
        console.log(str)
        this.mapImg = res.data
        this.Map = res.data.Map
        if (str.length == 0) {
          this.jd.err = "数据准备错误，请联系管理员";
        }
        let hospitalAndStlData = str.split("|");
        this.panzi = eval("(" + hospitalAndStlData[0] + ")");
        let data = eval(hospitalAndStlData[1]);
        this.modelObjs = [];
        data.forEach(v => {
          let stlModel = {
            name: "",
            opacity: 100,
            color: "rgb(255,0,0)",
            visible: true,
            url: "",
            volume: 0,
            img1:'',
            img2:''
          };
          stlModel.name = v.Name;
          console.log(v.Url)
           stlModel.url = this.com + v.Url.replace(/^.+FileName/, `${this.com}/FileName`);
          if (v.IsUseConfig) {
            stlModel.opacity = v.Opacity;
            stlModel.color = v.Color;
            stlModel.visible = v.Visible  == 1 ? true : false;//v.Visible;
          } else {
            stlModel.color = this.ifcolor(stlModel.name);
            let num = 100;
            if (
              /肝(脏?)|肺/g.test(stlModel.name) &&
              !/血管/g.test(stlModel.name)
            ) {
              num = 40;
              //console.log(v)
              //console.log(/肝(脏?)|肺/g.test(v[1].Name)&&!(/血管/g.test(v[1].Name)))
            }
            if (/皮肤/g.test(stlModel.name)) {
              num = 20;
              //console.log(v)
              //console.log(/皮肤/g.test(v[1].Name))
            }
            if (/(胰腺)|(脾脏)|(肾脏)/g.test(stlModel.name)) {
              num = 60;
              //console.log(v)
              //console.log(/(胰腺)|(脾脏)|(肾脏)/g.test(v[1].Name))
            }
            if (
              /(结石)|(囊肿)|(密度)|(淋巴)|(占位)|(血管)/g.test(stlModel.name)
            ) {
              num = 100;
            }
            stlModel.opacity = num;
          }

          // 加入模型数组
          this.modelObjs.push(stlModel);
        });

        this.Map.forEach((v,index)=>{
          this.modelObjs[index].img1 = v.IMG_N
          this.modelObjs[index].img2 = v.IMG_O
        })
        this.loadModels();
      });
    this.render();
  },
  updated() {
    //当器官颜色为黑色时，字体改为白色
    this.modelObjs.forEach((v, index) => {
      if (v.color == "rgb(0,0,0)") {
        this.$nextTick(function() {
          if (this.$refs.text) {
            this.$refs.text[index].style.color = "white";
          }
        });
      }
    });
  },
  methods: {
    //初始化Scene以及状态
    initScene({
      w = this.screenWidth,
      h = this.screenHeight,
      dpi = window.devicePixelRatio
    } = {}) {
      //Three Scene and Camera
      this.scene = new THREE.Scene();
      this.scene.add(new THREE.AmbientLight(0x444444));
      this.camera = new THREE.PerspectiveCamera(80, w / h, 0.1, 1000);
      this.camera.position.set(0, 200, 800);
      this.camera.add(new THREE.PointLight(0xffffff, 0.6));
      this.scene.add(this.camera);
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.camera.resetData = {
        position: [100, 200, 400],
        lookAt: this.scene.position
      };

      var point = new THREE.PointLight(0xffffff, 0.4);
      point.position.set(400, 600, -400); //点光源位置
      this.scene.add(point); //点光源添加到场景中

      var point2 = new THREE.PointLight(0xfffffff,0.4);
      point2.position.set(-200, -200, -200);
      this.scene.add(point2);

      var ambient = new THREE.AmbientLight(0x666666);
      this.scene.add(ambient);
      // 平行光
      var directionalLight = new THREE.DirectionalLight(0xffffff, 0.2);
      // 设置光源的方向：通过光源position属性和目标指向对象的position属性计算
      directionalLight.position.set(-400, -400, -400,0.2);
      // 方向光指向对象网格模型mesh2，可以不设置，默认的位置是0,0,0
      //this.scene.add(directionalLight);
      //Canvas and Backgroud setting
      var canvas = document.createElement("canvas");
      var canvasContext = canvas.getContext("2d");
      var linearGradient = canvasContext.createLinearGradient(300, 0, 0, 400);

      linearGradient.addColorStop(0, "#E5E5E5");
      linearGradient.addColorStop(1, "#A6A6A6");
      canvasContext.fillStyle = linearGradient;
      canvasContext.fillRect(0, 0, 400, 400);
      this.scene.background = new THREE.CanvasTexture(canvas);
      var geometry = new THREE.PlaneGeometry(100, 100);
      //Canvas and Backgroud setting
      this.renderer = new THREE.WebGLRenderer({
        canvas: this.$refs.canvas,
        antialias: true
      });
      this.renderer.setClearColor(0x000000, 0);
      this.renderer.setPixelRatio(dpi);
      this.renderer.setSize(w, h);
    },
    // 循环渲染
    render() {
      this.controls.update();
      requestAnimationFrame(this.render);
      this.renderer.render(this.scene, this.camera);

      //控制模型自动旋转
      this.render.bind(this);
      if (!this.rotate) {
        this.intersectObjects.forEach(v => {
          //console.log(v)
          v.rotateZ(0.01); //绕z轴旋转
        });
      }
    },
    //LoadModels from URL
    loadModels() {
      let onModelProgress = xhr => {
        if (xhr.loaded / xhr.total === 1) {
          this.jd.model++;
          this.jd.total = parseInt(
            (this.jd.model / this.modelObjs.length) * 100
          );
          // 加载完成,执行
          if (this.jd.total >= 100) {
            // 去除加载遮罩
            this.sheetShow = false;
            // 居中
            let box = new THREE.Box3();
            var bound = box.expandByObject(this.modelGroup);
            var offset = bound.getCenter();
            offset.y -= 50;
            this.modelGroup.position.sub(offset);
            this.modelGroup.oldPosition = this.modelGroup.position.clone();
            this.modelGroup.name = "modelGroup";
            this.scene.add(this.modelGroup);
          }
        }
      };
      let onModelError = xhr => {};
      var OBJLoader = new THREE.OBJLoader();//obj加载器
      var MTLLoader = new THREE.MTLLoader();//材质文件加载器
      let stlLoader = new THREE.STLLoader();
      let fiberLoader = new THREE.FiberLoader();
      var FBXloader = new THREE.FBXLoader(); //创建一个FBX加载器

      let scene =  this.scene;
      var Img = new THREE.ImageLoader();
      this.modelGroup = new THREE.Object3D();
      console.log(this.modelObjs)
      this.modelObjs.forEach((model, index) => {

        if (model.url.includes("vtk") || model.url.includes("trk")) {
          model.volume = "-";
          // TextureLoader创建一个纹理加载器对象，可以加载图片作为几何体纹理
          fiberLoader.load(model.url, (geometry) => {
          this.jd.model++;
          this.jd.total = parseInt(
            (this.jd.model / this.modelObjs.length) * 100
          );
          // 加载完成,执行
          if (this.jd.total >= 100) {
            // 去除加载遮罩
            this.sheetShow = false;
            // 居中
            let box = new THREE.Box3();
            var bound = box.expandByObject(this.modelGroup);
            var offset = bound.getCenter();
            offset.y -= 50;
            this.modelGroup.position.sub(offset);
            this.modelGroup.oldPosition = this.modelGroup.position.clone();
            this.modelGroup.name = "modelGroup";
            this.scene.add(this.modelGroup);
          }
             let material = new THREE.LineBasicMaterial({
                 color: model.color,
                 vertexColors: true,
                 linewidth: 1,

              });

              let mesh = new THREE.LineSegments(geometry, material);
              mesh.name = model.name;
              mesh.visible = model.visible;
              mesh.position.set(0, 0, 0);
              mesh.rotation.x = -0.5 * Math.PI;
              mesh.resetData = {
                position: [0, 0, 0],
                opacity: model.opacity,
                visible: model.visible
              };
              this.intersectObjects.push(mesh);

              this.modelGroup.add(mesh);
            },
            onModelProgress,
            onModelError
          );
        } else {
           console.log(model.url)
          FBXloader.load(model.url,
            geometry => {
              console.log(this.jd)
            this.jd.model++;
            this.jd.total = parseInt(
            (this.jd.model / this.modelObjs.length) * 100
          );
          console.log(model)
          // 加载完成,执行
          if (this.jd.total >= 100) {
            // 去除加载遮罩
            this.sheetShow = false;
            // 居中
            let box = new THREE.Box3();
            var bound = box.expandByObject(this.modelGroup);//包裹在包围盒中的3d对象 this.modelGroup
            var offset = bound.getCenter();
            offset.y -= 50;
            this.modelGroup.position.sub(offset);
            this.modelGroup.oldPosition = this.modelGroup.position.clone();
            this.modelGroup.name = "modelGroup";
            this.scene.add(this.modelGroup);
          }
              //Calculate Volume
              let signedVolumeOfTriangle = function(p1, p2, p3) {
                var v321 = p3.x * p2.y * p1.z;
                var v231 = p2.x * p3.y * p1.z;
                var v312 = p3.x * p1.y * p2.z;
                var v132 = p1.x * p3.y * p2.z;
                var v213 = p2.x * p1.y * p3.z;
                var v123 = p1.x * p2.y * p3.z;
                return (-v321 + v231 + v312 - v132 - v213 + v123) / 6;
              };
              var geometryVolume = 0;
              console.log(geometry)
              let cloneGeometry = new THREE.Geometry(geometry.children[0].geometry.position);//将一个BufferGeometry对象，转换成一个Geometry对象。
              console.log(cloneGeometry)
              console.log(cloneGeometry.faces.length)
              for (var i = 0; i < cloneGeometry.faces.length; i++) {
                var Pi = cloneGeometry.faces[i].a;
                var Qi = cloneGeometry.faces[i].b;
                var Ri = cloneGeometry.faces[i].c;

                var P = new THREE.Vector3(
                  cloneGeometry.vertices[Pi].x,
                  cloneGeometry.vertices[Pi].y,
                  cloneGeometry.vertices[Pi].z
                );
                var Q = new THREE.Vector3(
                  cloneGeometry.vertices[Qi].x,
                  cloneGeometry.vertices[Qi].y,
                  cloneGeometry.vertices[Qi].z
                );
                var R = new THREE.Vector3(
                  cloneGeometry.vertices[Ri].x,
                  cloneGeometry.vertices[Ri].y,
                  cloneGeometry.vertices[Ri].z
                );
                geometryVolume += signedVolumeOfTriangle(P, Q, R);
              }
              model.volume = (Math.abs(geometryVolume) / 1000).toFixed(2);
              //Material
              var textureLoader = new THREE.TextureLoader();
              var loader = new THREE.CubeTextureLoader();
              //创建普通纹理材质
              //创建法线贴图
              //var textureNormal = textureLoader.load('this.mapImg[1]');
              //console.log(this.mapImg[2])
              // 加载高光贴图
              //var textureSpecular = textureLoader.load('./img/bai.jpg');
              //环境贴图
              //var CubeTexture = loader.load('[this.mapImg[0]]');
              let material = new THREE.MeshPhongMaterial({
                //color: model.color,
                //map:texture,//设置颜色纹理贴图
                opacity: model.opacity / 100,
                specular: 0x222222,
                //shininess: 30,
                shading: THREE.SmoothShading,
                shininess: 60,//高光部分的亮度，默认30
              });
              //scene.add(geometry);
              // if (model.opacity < 100) {
              //   material.transparent = true;
              //   material.depthWrite = false;
              // } else {
              //   material.transparent = false;
              //   material.depthWrite = true;
              // }

              //Smoothing
              var positionAttr = geometry.children[0].geometry.attributes.position;
              console.log(geometry.children[0].geometry)
              var positions = positionAttr.array;
              var vertices = [];
              for (var i = 0, n = positions.length; i < n; i += 3) {
                var x = positions[i];
                var y = positions[i + 1];
                var z = positions[i + 2];
                vertices.push(new THREE.Vector3(x, y, z));
              }
              var faces = [];
              for (var i = 0, n = vertices.length; i < n; i += 3) {
                faces.push(new THREE.Face3(i, i + 1, i + 2));
              }
              var smoothGeometry = new THREE.Geometry();
              smoothGeometry.vertices = vertices;
              smoothGeometry.faces = faces;
              smoothGeometry.computeFaceNormals();
              smoothGeometry.mergeVertices();
              smoothGeometry.computeVertexNormals();
              var smoothBufferGeometry = new THREE.BufferGeometry();
              smoothBufferGeometry.fromGeometry(smoothGeometry);
              console.log(geometry.material)
              //Mesh
              let mesh = geometry;
              console.log(mesh);
              mesh.name = model.name;
              mesh.visible = model.visible;
              mesh.position.set(0, 0, 0);
              mesh.rotation.x = -0.5 * Math.PI;
              mesh.resetData = {
                position: [0, 0, 0],
                opacity: model.opacity,
                visible: model.visible
              };

              //AddMESH
              this.intersectObjects.push(mesh);

              this.modelGroup.add(mesh);
            },
            onModelProgress,
            onModelError
          );
      //      let that = this
      //     this.sheetShow = false
      //     FBXloader.load(model.url,function (obj) {
      //       console.log(obj.children)
      //     		  //geometry.center();
      //     		 var textureLoader = new THREE.TextureLoader();

      //     		 var loader = new THREE.CubeTextureLoader();
      //     		  //loader.setPath('./img/');
      //             //创建普通纹理材质
      //     		 var texture = textureLoader.load(model.img2);
      //     		 //创建法线贴图
      //     		 var textureNormal = textureLoader.load(model.img1);
      //     		 // 加载高光贴图
      //     		 var textureSpecular = textureLoader.load('/static/pizang_S.jpg');
      //     		 //环境贴图
      //     		 var CubeTexture = loader.load(['/static/timg.jpg']);

      //     		  // 颜色贴图中已经包含了光照信息，所以直接使用不受光照影响的基础网格材质MeshBasicMaterial
      //           console.log(index)
      //     			 obj.children.material = new THREE.MeshPhongMaterial({
      //     			            shininess: 60, //高光部分的亮度，默认30
      //                       //color:model.color
      //     			            map: texture, //设置颜色纹理贴图
      //     			            // normalMap: textureNormal, //法线贴图
      //     			            // //设置深浅程度，默认值(1,1)。
      //     			            // normalScale: new THREE.Vector2(2, 2),
      //     			            // specularMap: textureSpecular, //高光贴图
      //     			            // envMap: CubeTexture, //设置环境贴图
      //     			            // 环境贴图反射率   控制环境贴图对被渲染三维模型影响程度
      //     			            // reflectivity: 0.1,
      //     			          });
      //     		   scene.add(obj);
      //     	},
          //  onModelProgress,
          // onModelError);
        }
       });
    },
    reset() {
      //Reset modelGroup;
      this.scene.getObjectByName("modelGroup").traverse(mesh => {
        if (mesh.resetData) {
          mesh.position.set(...mesh.resetData.position);
          let material = mesh.material;
          // material.opacity = mesh.resetData.opacity / 100;
          // if (mesh.resetData.opacity < 100) {
          //   material.transparent = true;
          //   material.depthWrite = false;
          // } else {
          //   material.transparent = false;
          //   material.depthWrite = true;
          // }
          mesh.visible = mesh.resetData.visible;
          this.modelObjs.forEach(model => {
            if (mesh.name === model.name) {
              model.visible = mesh.visible;
              //model.opacity = mesh.resetData.opacity;
            }
          });
          mesh.rotation.y = 0;
          mesh.rotation.z = 0;
        }
      });

      //reset camera
      this.camera.position.set(...this.camera.resetData.position);

      //reset control
      this.controls.target.set(0, 0, 0);

      this.changeEye = true;

      this.controls.reset();
    },

    // 顶部眼睛--控制面板显隐切换
    switchPannel(v) {
      this.changeEye = !this.changeEye;

      this.modelObjs.forEach((item, index, arr) => {
        if (this.changeEye == 1) {
          item.visible = true;
        } else {
          item.visible = false;
        }

        this.scene.getObjectByName(item.name).visible = item.visible;
        this.controls.reset();
      });
    },
    changeBoxshow() {
      this.boxshow = !this.boxshow;
      if (this.boxshow) {
        this.$refs.boxshow.innerHTML = "点击显示";
      } else {
        this.$refs.boxshow.innerHTML = "点击隐藏";
      }
    },

    // 模型的显隐切换和底部眼睛切换
    toSwitch(model, index) {
      console.log(model)
      console.log(this.scene.visible);
      model.visible = !model.visible;
      console.log(this.scene.getObjectByName(model.name))
      this.scene.getObjectByName(model.name).visible = model.visible;
      //遍历数组让小眼睛和大眼睛互动
      let allshow = this.modelObjs.every((item, arr) => {
        return !item.visible;
      });
      if (allshow) {
        this.changeEye = 0;
      } else {
        this.changeEye = 1;
      }
    },

    //背景颜色切换
    switchColor() {
      var canvas = document.createElement("canvas");
      var message = document.getElementById("msg-wrap");
      var canvasContext = canvas.getContext("2d");
      var linearGradient = canvasContext.createLinearGradient(300, 0, 0, 400);
      if (this.i < 3) {
        this.i++;
      } else {
        this.i = this.i - 3;
      }
      if (this.i == 0) {
        linearGradient.addColorStop(0, "#E5E5E5");
        linearGradient.addColorStop(1, "#A6A6A6");
        //医院信息颜色变化
        //message.style.color = "black";
      } else if (this.i == 1) {
        linearGradient.addColorStop(0, "#484848");
        linearGradient.addColorStop(1, "#A2A2A2");
        //医院信息颜色变化
        //message.style.color = "white";
      } else if (this.i == 2) {
        linearGradient.addColorStop(0, "#2b2b2b");
        linearGradient.addColorStop(1, "#484848");
        //医院信息颜色变化
        //message.style.color = "white";
      } else if (this.i == 3) {
        linearGradient.addColorStop(0, "#efefef");
        linearGradient.addColorStop(1, "#d1d1d1");
        //医院信息颜色变化
        //message.style.color = "black";
      }

      canvasContext.fillStyle = linearGradient;
      canvasContext.fillRect(0, 0, 400, 400);
      this.scene.background = new THREE.CanvasTexture(canvas);

      //Canvas and Backgroud setting
    },

    //自动旋转功能
    btn_rotate() {
      this.rotate = !this.rotate;
    },

    //底部滑动变化
    touchStart(e, index) {
      //点击时的位子
      const touch = e.touches[0];
      this.lastTouchPosition = touch.pageX;
      this.selectedModelControlIndex = index;
    },
    touchMove(e, index, item) {
      if (this.selectedModelControlIndex != index || item.visible == 0) {
        return;
      }
      //滑动位置和初始位置差
      const touch = e.touches[0];
      const deltaX = ((touch.pageX - this.lastTouchPosition) / 92.0) * 100;
      let sliderVal = parseFloat(item.opacity) + deltaX;
      if (sliderVal < 0) {
        sliderVal = 0;
      }
      if (sliderVal > 100) {
        sliderVal = 100;
      }
      item.opacity = sliderVal;
      let material = this.scene.getObjectByName(item.name).material;
      material.opacity = item.opacity / 100;
      if (item.opacity < 100) {
        material.transparent = true;
        material.depthWrite = false;
      } else {
        material.transparent = false;
        material.depthWrite = true;
      }
      this.lastTouchPosition = touch.pageX;
    },

    touchEnd() {
      this.lastTouchPosition = -1;
    },
    /* ------------面板按钮逻辑 结束------------- */
    // 旋转
    addControls() {
      this.controls = new THREE.TrackballControls(
        this.camera,
        this.$refs.canvas
      );
      // 解除双指平移
      this.controls.enablePan = false;
      this.controls.rotateSpeed = 1.2;
      this.controls.zoomSpeed = 5;
      this.controls.panSpeed = 2;
      this.controls.staticMoving = true;
      this.controls.dynamicDampingFactor = 0.3;
    },

    // 拖拽
    addDraggable() {
      var dragControls = new THREE.DragControls(
        this.intersectObjects,
        this.camera,
        this.renderer.domElement
      );
      dragControls.addEventListener("dragstart", event => {
        this.controls.enabled = false;
      });
      dragControls.addEventListener("dragend", event => {
        this.controls.enabled = true;
      });
    },

    // 获取url参数
    getUrlObj() {
      var ret = {};
      var search = location.search.slice(1);
      search.replace(/([^?&]+)=([^?&]+)/g, function(s, v, k) {
        ret[v] = decodeURIComponent(k);
        return k + "=" + v;
      });
      return ret;
    },
    // 根据名字检索，返回对应颜色
    ifcolor(str) {
      var obj = colors2;
      for (var i in obj) {
        if (str.match(obj[i].name)) {
          // console.log(str, obj[i].name,'是否匹配：',str.match(obj[i].name))
          return obj[i].color;
        }
      }
      return "rgb(255,225,0)";
    },
    // 加载完成通知服务器
    loaderSuccess() {
      let ServerID = this.getUrlObj().id;
      console.log(ServerID)
      let status = true;
      if (ServerID === 0) {
        status = false;
      }

      this.$http.get(this.com + "/DeleteData", {
        params: {
          status,
          ServerID
        }
      });
    }
  }
};
</script>

<style>
body {
  margin: 0;
  padding: 0;
  overflow: hidden;
  touch-action: none;
}
@font-face {
  font-family: "secret";
  src: url("data:application/font-ttf;charset=utf-8;base64,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")
    format("truetype");
}
.strongbox {
  font-family: "fangchan-secret", "Hiragino Sans GB", "Microsoft yahei", Arial,
    sans-serif, "宋体" !important;
}
.font {
  font-family: "secret", "Hiragino Sans GB", "Microsoft yahei", Arial,
    sans-serif, "\5B8B\4F53" !important;
}
#app {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
}

.bgImg {
  width: 430px;
  height: 120px;
  position: absolute;
  bottom: 380px;
  left: 50%;
  margin-left: -215px;
  opacity: 80%;
}

.content {
  width: 100%;
  height: 100%;
  background: gray;
}

.open-btn-wrap {
  display: flex;
  position: absolute;
  top: 30px;
  right: 10px;
  height: 160px;
}
.open-btn1 {
  height: 120px;
  width: 120px;
  background: url("assets/btn1.png") no-repeat;
  background-size: 100% 100%;
}
.open-btn2 {
  height: 140px;
  width: 140px;
}
.open-btn2 img {
  width: 120px;
  height: 120px;
}
.open-btn-wrap .reset {
  margin-right: 20px;
}
.cpanel {
  color: #fff;
  height: 100%;
  width: 48%;
  z-index: 100;
  background: rgba(255, 255, 255, 0.15);
  overflow-y: scroll;
}
.top {
  position: absolute;
  display: flex;
  height: 200px;
  width: 100%;
  top: 0;
  left: 0;
  align-items: center;
  background: gray;
  z-index: 3;
}
.top h4 {
  width: 100%;
  text-align: center;
}

.close-panel {
  position: absolute;
  top: 0;
  right: 0;
  font-size: 80px;
  padding: 50px;
}
.close-panel:active {
  color: red;
}
.obj-items {
  width: 100%;
  height: 100%;
  padding-top: 200px;
  overflow: auto;
  box-sizing: border-box;
}
.obj-item {
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 30px 15px 16px 24px;
  font-size: 40px;
  line-height: 40px;
  flex-direction: column;
  margin: 10px 0;
}
.obj-item .item-title-wrap {
  width: 94%;
  height: 100%;
  display: flex;
  flex-direction: column;
}
.obj-item .item-title-wrap .item-title {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 38px;
}
.obj-item .item-title-wrap .mini {
  padding-left: 20px;
  margin-top: 16px;
  font-size: 28px;
  line-height: 50px;
  color: blue;
  display: flex;
  flex-direction: column;
}
.obj-item .item-title-wrap .mini div {
  flex: 1;
}
.obj-item .item-title-wrap .mini div span {
  display: inline-block;
  width: 145px;
}

.obj-item .controls {
  margin-top: 28px;
  display: flex;
  width: 100%;
  align-items: center;
  padding-left: 20px;
  box-sizing: border-box;
  margin-bottom: 10px;
}
.obj-item .slider-wrap {
  padding-left: 40px;
  flex: 2;
}
.fk-wrap {
  display: flex;
  justify-content: space-around;
  align-items: center;
}
.fk-wrap .fk {
  width: 30px;
  height: 30px;
  margin-left: 30px;
}
.slider-wrap span.van-slider__button {
  width: 50px;
  height: 50px;
}

.obj-item .switch-wrap {
  flex: 1;
}
.obj-item .switch-wrap .van-switch {
  font-size: 70px !important;
}
.child-panel {
  width: 60%;
  height: 50%;
}
@media screen and (max-width: 768px) {
  .sheet {
    position: absolute;
    left: 0;
    top: 0;
    right: 0;
    bottom: 0;
    background-image: url(./assets/bg04.jpg);
    background-repeat: no-repeat;
    background-size: 100% 100%;
    -webkit-background-size: 100% 100%;
    background-attachment: fixed;
    -webkit-background-attachment: fixed;
    z-index: 123;
  }
}

@media screen and (min-width: 768px) {
  .sheet {
    position: absolute;
    left: 0;
    top: 0;
    right: 0;
    bottom: 0;
    background: url(./assets/bg1.png);
    background-repeat: no-repeat;
    background-size: 100% 100%;
    background-attachment: fixed;
    -webkit-background-attachment: fixed;
    z-index: 123;
  }
}
.sheet .center {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  top: 0;
  width: 500px;
  height: 550px;
  margin: auto;
}
.sheet .center .text {
  margin-bottom: 40px;
  margin-top: -40px;
}
.sheet .center .text .title {
  color: red;
}
.sheet .center .text .content {
  width: 100%;
  height: 100%;
  color: #fff;
  max-height: 300px;
  overflow-y: auto;
}

.sheet .center .text .content .filename {
  padding-bottom: 20px;
}
.van-progress {
  height: 20px;
  position: relative;
  border-radius: 25px;
  background: #e5e5e5;
}
.van-progress__pivot {
  font-size: 44px;
  padding: 0 30px;
}

.sheet img {
  width: 400px;
  height: 400px;
  margin-left: 60px;
  position: relative;
}

.prompt {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  top: 0;
  background: gray;
  z-index: 222;
}
.prompt .center {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  top: 0;
  width: 550px;
  height: 250px;
  margin: auto;
  font-size: 48px;
  color: orange;
}

/* 加载进度 */
.load {
  position: absolute;
  left: 48%;
  top: 30%;
  font-size: 54px;
  color: white;
}

.logo {
  position: absolute;
  width: 300px;
  height: 300px;
  bottom: 200px;
  left: 400px;
  opacity: 0.2;
}

canvas {
  transition: all 0.4s;
}
#msg-wrap {
  position: absolute;
  top: 10px;
  left: 20px;
  color: black;
  font-size: 1.5vw;
  letter-spacing: 0.5vw;
}
#msg-wrap .msg {
  /*display: inline;*/
  margin-top: 5px;
}

.later {
  position: absolute;
  width: 88%;
  bottom: 0;
  left: 140px;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  overflow: hidden;
  height: 260px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.later::-webkit-scrollbar {
  width: 0px;
  height: 0px;
}
/*o内核*/
.later {
  -moz-appearance: none !important;
  background: rgba(0, 255, 0, 0) !important;
}
.later_item {
  margin-left: 20px;
  -webkit-overflow-scrolling: touch;
}
.later_item:first-child {
  margin-left: 0;
}

.boxshow {
  position: absolute;
  bottom: 0;
  left: 1px;
  width: 120px;
  height: 250px;
  background: #efefef;
  border-radius: 20px;
  margin-left: 10px;
  margin-bottom: 10px;
  text-align: center;
}
.boxshow p {
  font-size: 32px;
  width: 50px;
  margin: 20% auto;
  padding: 0;
}
.show {
  height: 80px;
  text-align: center;
  line-height: 80px;
  font-size: 20px;
  border-radius: 20px 20px 0 0;
  box-shadow: 0 -1px 10px aliceblue inset;
  border-bottom: none;
}
.show_c {
  width: 100%;
  height: 80px;
  text-align: center;
  line-height: 80px;
  font-size: 20px;
  border-radius: 20px 20px 0 0;
  box-shadow: 0 -1px 10px aliceblue inset;
  border-bottom: none;
}
.show img {
  width: 60px;
  height: 60px;
  position: absolute;
  margin-left: -30px;
}
.each {
  width: 270px;
  height: 160px;
  position: relative;
  font-size: 40px;
  margin-top: 20px;
  border-radius: 0 0 20px 20px;
  box-shadow: 0 -1px 10px aliceblue inset;
  -webkit-overflow-scrolling: touch;
  /*background: rgba(255,255,255,1);*/
}
.each .text {
  text-align: center;
  top: 50%;
  left: 50%;
  width: 240px;
  -moz-transform: translate(-50%, -50%);
  transform: translate(-50%, -50%);
  display: inline-block;
  position: absolute;
}
.eup {
  width: 100%;
  height: 160px;
  position: absolute;
  text-align: center;
  line-height: 100px;
  font-size: 40px;
  border-radius: 0 0 20px 20px;
  box-shadow: 0 -1px 10px aliceblue inset;
}
.ecup {
  width: 0;
}

@keyframes ldio-7vt5rjcst5h {
  0% {
    opacity: 1;
    backface-visibility: hidden;
    transform: translateZ(0) scale(1.44, 1.44);
  }
  100% {
    opacity: 0;
    backface-visibility: hidden;
    transform: translateZ(0) scale(1, 1);
  }
}
.ldio-7vt5rjcst5h div > div {
  position: absolute;
  width: 47.28px;
  height: 47.28px;
  border-radius: 50%;
  background: #ffffff;
  animation: ldio-7vt5rjcst5h 1s linear infinite;
}
.ldio-7vt5rjcst5h div:nth-child(1) > div {
  left: 327px;
  top: 173px;
  animation-delay: -0.875s;
}
.ldio-7vt5rjcst5h > div:nth-child(1) {
  transform: rotate(0deg);
  transform-origin: 350.64px 196.64px;
}
.ldio-7vt5rjcst5h div:nth-child(2) > div {
  left: 282px;
  top: 282px;
  animation-delay: -0.75s;
}
.ldio-7vt5rjcst5h > div:nth-child(2) {
  transform: rotate(45deg);
  transform-origin: 305.64px 305.64px;
}
.ldio-7vt5rjcst5h div:nth-child(3) > div {
  left: 173px;
  top: 327px;
  animation-delay: -0.625s;
}
.ldio-7vt5rjcst5h > div:nth-child(3) {
  transform: rotate(90deg);
  transform-origin: 196.64px 350.64px;
}
.ldio-7vt5rjcst5h div:nth-child(4) > div {
  left: 65px;
  top: 282px;
  animation-delay: -0.5s;
}
.ldio-7vt5rjcst5h > div:nth-child(4) {
  transform: rotate(135deg);
  transform-origin: 88.63999999999999px 305.64px;
}
.ldio-7vt5rjcst5h div:nth-child(5) > div {
  left: 20px;
  top: 173px;
  animation-delay: -0.375s;
}
.ldio-7vt5rjcst5h > div:nth-child(5) {
  transform: rotate(180deg);
  transform-origin: 43.639999999999986px 196.64px;
}
.ldio-7vt5rjcst5h div:nth-child(6) > div {
  left: 65px;
  top: 65px;
  animation-delay: -0.25s;
}
.ldio-7vt5rjcst5h > div:nth-child(6) {
  transform: rotate(225deg);
  transform-origin: 88.63999999999999px 88.63999999999999px;
}
.ldio-7vt5rjcst5h div:nth-child(7) > div {
  left: 173px;
  top: 20px;
  animation-delay: -0.125s;
}
.ldio-7vt5rjcst5h > div:nth-child(7) {
  transform: rotate(270deg);
  transform-origin: 196.64px 43.639999999999986px;
}
.ldio-7vt5rjcst5h div:nth-child(8) > div {
  left: 282px;
  top: 65px;
  animation-delay: 0s;
}
.ldio-7vt5rjcst5h > div:nth-child(8) {
  transform: rotate(315deg);
  transform-origin: 305.64px 88.63999999999999px;
}
.loadingio-spinner-spin-4y03ew5yh02 {
  width: 394px;
  height: 394px;
  display: inline-block;
  /* overflow: hidden; */
  background: rgba(NaN, NaN, NaN, 0);
}
.ldio-7vt5rjcst5h {
  width: 100%;
  height: 100%;
  position: relative;
  left: 20%;
  transform: translateZ(0) scale(1);
  backface-visibility: hidden;
  /* transform-origin: 0 0; /* see note above*/
}
/* .ldio-7vt5rjcst5h div { box-sizing: content-box; } */
/* generated by https://loading.io/ */
</style>
