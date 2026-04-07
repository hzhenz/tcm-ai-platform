<template>
  <div class="human-body-3d-wrapper">
    <!-- 3D 渲染容器 -->
    <div class="canvas-container" ref="containerRef"></div>
    
    <!-- 资源加载遮罩层 -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loader-bagua">
        <div class="loader-circle outer"></div>
        <div class="loader-circle inner"></div>
      </div>
      <div class="loader-text">
        <div class="loader-title">正在恭迎明堂真身... {{ loadingProgress }}%</div>
        <div class="loader-hint">引气血，通经络，凝百脉 (正在执行高精曲面贴合)</div>
      </div>
    </div>

    <!-- 顶部状态栏 (新中式卷轴风) -->
    <div class="hud-top" :class="{ 'fade-in': !isLoading }">
      <div class="hud-sys-status">
        <div class="status-item"><span class="dot blink"></span> 经气映射：法线贴合完成</div>
        <div class="status-item"><span class="dot"></span> 阴阳五行：相生相合</div>
        <div class="status-item"><span class="dot"></span> 观瞻模式：明堂内视</div>
      </div>
    </div>

    <!-- 动态吸附的穴位标签 -->
    <div class="point-labels-container" :class="{ 'fade-in': !isLoading }">
      <div 
        v-for="pt in acupointsUI" 
        :key="pt.id"
        class="acu-label"
        :class="{ hidden: !pt.visible }"
        :style="{ transform: `translate(${pt.x}px, ${pt.y}px)` }"
      >
        <!-- 核心穴位光点 (加入呼吸灯动画，移入触发悬停交互) -->
        <div class="label-core-point" :style="{ backgroundColor: pt.color, boxShadow: `0 0 0 2px rgba(255, 248, 231, 0.8), 0 0 10px ${pt.color}AA` }"></div>
        
        <!-- 连线 (默认隐藏) -->
        <div class="label-line" :style="{ background: `linear-gradient(90deg, ${pt.color}88, transparent)` }"></div>
        
        <!-- 详情面板 (默认隐藏) -->
        <div class="label-content" :style="{ borderColor: `${pt.color}55`, borderLeftColor: pt.color }">
          <div class="label-header">
            <span class="label-name" :style="{ color: pt.color }">{{ pt.name }}</span>
            <span class="label-pinyin">{{ pt.id.toUpperCase() }}</span>
          </div>
          <div class="label-desc">{{ pt.desc }}</div>
          <div class="label-data">
            <div class="vitality-bar">
              <div class="vitality-fill" :style="{ width: pt.vitality + '%', backgroundColor: pt.color }"></div>
            </div>
            <span>气血充盈: <span class="vitality-num" :style="{ color: pt.color }">{{ pt.vitality }}%</span></span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 底部操作提示 -->
    <div class="hud-bottom" :class="{ 'fade-in': !isLoading }">
      <div class="controls-hint">
        <div class="hint-icon">🖱️</div>
        <span>悬停：查看穴位释义</span>
        <span class="divider">·</span>
        <span>左键：旋转换转观瞻</span>
        <span class="divider">·</span>
        <span>滚轮：推拉端详入微</span>
      </div>
      <div class="data-stream">太极生两仪，两仪生四象... <span class="dot blink" style="background:#D4AF37"></span></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

const containerRef = ref(null)
const isLoading = ref(true)
const loadingProgress = ref(0)

// ===== 全新扩充的中医美学色彩配置 =====
const THEME = {
  bg: 0x110D0B,          
  bodyCore: 0x2A1810,    
  bodyGlow: 0xF3E5D8,    
  renmai: 0xCC3333,      // 任脉 (朱砂红)
  dumai: 0xD4AF37,       // 督脉 (鎏金黄)
  weijing: 0x4DA8DA,     // 胃经 (蔚蓝)
  pangguang: 0xB88A62,   // 膀胱经 (琥珀/古铜)
  pointCore: 0xFFF8E7,   
  baseOuter: 0x8A7356,   
  baseInner: 0x5C4A3D    
}

// ===== 扩充后的穴位锚点词典 (已移除手臂穴位) =====
const acupointsUI = ref([
  // 头背部 (督脉 / 膀胱经)
  { id: 'baihui', name: '百会', desc: '督脉 · 百脉之会', pos: new THREE.Vector3(0, 1.58, 0), x: 0, y: 0, visible: false, vitality: 98, color: '#D4AF37' },
  { id: 'dazhui', name: '大椎', desc: '督脉 · 诸阳之会', pos: new THREE.Vector3(0, 1.25, -0.15), x: 0, y: 0, visible: false, vitality: 91, color: '#D4AF37' },
  { id: 'mingmen', name: '命门', desc: '督脉 · 生命之火', pos: new THREE.Vector3(0, 0.45, -0.22), x: 0, y: 0, visible: false, vitality: 95, color: '#D4AF37' },
  { id: 'shenshu-l', name: '肾俞', desc: '膀胱经 · 益肾气', pos: new THREE.Vector3(-0.1, 0.45, -0.22), x: 0, y: 0, visible: false, vitality: 86, color: '#B88A62' },
  { id: 'shenshu-r', name: '肾俞', desc: '膀胱经 · 益肾气', pos: new THREE.Vector3(0.1, 0.45, -0.22), x: 0, y: 0, visible: false, vitality: 87, color: '#B88A62' },

  // 胸腹部 (任脉 / 胃经)
  { id: 'danzhong', name: '膻中', desc: '任脉 · 气会', pos: new THREE.Vector3(0, 0.95, 0.24), x: 0, y: 0, visible: false, vitality: 85, color: '#CC3333' },
  { id: 'zhongwan', name: '中脘', desc: '任脉 · 腑会', pos: new THREE.Vector3(0, 0.65, 0.24), x: 0, y: 0, visible: false, vitality: 90, color: '#CC3333' },
  { id: 'qihai', name: '气海', desc: '任脉 · 元气之海', pos: new THREE.Vector3(0, 0.40, 0.22), x: 0, y: 0, visible: false, vitality: 92, color: '#CC3333' },
  
  // 腿脚部 (胃经 / 脾经)
  { id: 'zusanli-l', name: '足三里', desc: '胃经 · 强壮要穴', pos: new THREE.Vector3(-0.18, -0.88, 0.12), x: 0, y: 0, visible: false, vitality: 88, color: '#4DA8DA' },
  { id: 'zusanli-r', name: '足三里', desc: '胃经 · 强壮要穴', pos: new THREE.Vector3(0.18, -0.88, 0.12), x: 0, y: 0, visible: false, vitality: 89, color: '#4DA8DA' },
  { id: 'sanyinjiao-l', name: '三阴交', desc: '脾经 · 统血调经', pos: new THREE.Vector3(-0.12, -1.0, 0.1), x: 0, y: 0, visible: false, vitality: 84, color: '#4DA8DA' },
  { id: 'sanyinjiao-r', name: '三阴交', desc: '脾经 · 统血调经', pos: new THREE.Vector3(0.12, -1.0, 0.1), x: 0, y: 0, visible: false, vitality: 85, color: '#4DA8DA' },
])

// ===== 扩充后的经脉网路 =====
let renmaiPoints = [
  new THREE.Vector3(0, 1.45, 0.14), new THREE.Vector3(0, 0.95, 0.24),
  new THREE.Vector3(0, 0.65, 0.24), new THREE.Vector3(0, 0.40, 0.22),
  new THREE.Vector3(0, 0.15, 0.22), new THREE.Vector3(0, -0.1, 0.1)
]
let dumaiPoints = [
  new THREE.Vector3(0, 1.58, 0),     new THREE.Vector3(0, 1.45, -0.14),
  new THREE.Vector3(0, 1.25, -0.15), new THREE.Vector3(0, 0.95, -0.22), 
  new THREE.Vector3(0, 0.45, -0.22), new THREE.Vector3(0, 0.15, -0.20), 
  new THREE.Vector3(0, -0.1, -0.1)
]
// 胃经 (左右)
let weijingLeftPoints = [
  new THREE.Vector3(-0.06, 1.45, 0.14), new THREE.Vector3(-0.08, 0.95, 0.22),
  new THREE.Vector3(-0.1, 0.45, 0.22), new THREE.Vector3(-0.14, 0.0, 0.18),
  new THREE.Vector3(-0.16, -0.4, 0.16), new THREE.Vector3(-0.18, -0.88, 0.12),
  new THREE.Vector3(-0.16, -1.2, 0.1)
]
let weijingRightPoints = [
  new THREE.Vector3(0.06, 1.45, 0.14), new THREE.Vector3(0.08, 0.95, 0.22),
  new THREE.Vector3(0.1, 0.45, 0.22), new THREE.Vector3(0.14, 0.0, 0.18),
  new THREE.Vector3(0.16, -0.4, 0.16), new THREE.Vector3(0.18, -0.88, 0.12),
  new THREE.Vector3(0.16, -1.2, 0.1)
]
// 膀胱经 (左右背部)
let pangguangLeftPoints = [
  new THREE.Vector3(-0.06, 1.58, 0), new THREE.Vector3(-0.08, 1.45, -0.14),
  new THREE.Vector3(-0.1, 0.95, -0.2), new THREE.Vector3(-0.1, 0.45, -0.22),
  new THREE.Vector3(-0.12, 0.15, -0.18), new THREE.Vector3(-0.14, -0.3, -0.15),
  new THREE.Vector3(-0.16, -0.8, -0.1)
]
let pangguangRightPoints = [
  new THREE.Vector3(0.06, 1.58, 0), new THREE.Vector3(0.08, 1.45, -0.14),
  new THREE.Vector3(0.1, 0.95, -0.2), new THREE.Vector3(0.1, 0.45, -0.22),
  new THREE.Vector3(0.12, 0.15, -0.18), new THREE.Vector3(0.14, -0.3, -0.15),
  new THREE.Vector3(0.16, -0.8, -0.1)
]

let scene, camera, renderer
let bodyGroup, meridiansGroup, baseGroup
let animationId = null
let animatedMaterials = [] 

// 【核心修复】：建立绝对干净的白名单验证数组，杜绝幽灵模型干扰
let validCollidableMeshes = []

let isDragging = false
let previousMousePosition = { x: 0, y: 0 }
let targetRotation = { x: 0, y: 0 }
let currentRotation = { x: 0, y: 0 }
let time = 0

let introProgress = 0
let isIntroActive = true

const jadeMaterial = new THREE.ShaderMaterial({
  uniforms: {
    glowColor: { value: new THREE.Color(THEME.bodyGlow) },
    coreColor: { value: new THREE.Color(THEME.bodyCore) }
  },
  vertexShader: `
    varying float vFresnel;
    void main() {
      vec3 vNormal = normalize(normalMatrix * normal);
      vec3 viewDir = normalize(-(modelViewMatrix * vec4(position, 1.0)).xyz);
      vFresnel = 1.0 - max(0.0, dot(vNormal, viewDir));
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform vec3 glowColor;
    uniform vec3 coreColor;
    varying float vFresnel;
    void main() {
      float f = pow(vFresnel, 2.5); 
      vec3 finalColor = mix(coreColor, glowColor, f);
      float alpha = mix(0.2, 0.9, f); 
      gl_FragColor = vec4(finalColor, alpha);
    }
  `,
  side: THREE.DoubleSide,
  blending: THREE.AdditiveBlending, 
  transparent: true,
  depthWrite: false
})

onMounted(() => {
  initThree()
  loadExternalModel() 
  createTaijiCompassBase()
  setupInteraction()
  animate()
  window.addEventListener('resize', onWindowResize)
})

onUnmounted(() => {
  if (animationId) cancelAnimationFrame(animationId)
  window.removeEventListener('resize', onWindowResize)
  if (renderer) {
    renderer.dispose()
    containerRef.value?.removeChild(renderer.domElement)
  }
})

const initThree = () => {
  const container = containerRef.value
  const width = container.clientWidth
  const height = container.clientHeight

  scene = new THREE.Scene()
  scene.fog = new THREE.FogExp2(THEME.bg, 0.04)

  camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100)
  camera.position.set(0, 3, 8)

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setSize(width, height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  container.appendChild(renderer.domElement)

  bodyGroup = new THREE.Group()
  meridiansGroup = new THREE.Group()
  baseGroup = new THREE.Group()
  
  scene.add(bodyGroup)
  scene.add(meridiansGroup)
  scene.add(baseGroup)
}

const loadExternalModel = () => {
  const loader = new GLTFLoader()
  const modelUrl = '/models/human-body.glb' 

  loader.load(
    modelUrl,
    (gltf) => {
      validCollidableMeshes = [] // 重置白名单
      const model = gltf.scene
      model.traverse((child) => {
        // 如果是女模或不要的部分，直接抛弃
        if (child.name === 'Mesh002_Mesh008' || child.name.toLowerCase().includes('female')) {
          child.visible = false 
          return 
        }
        
        // 【核心修复】：只有明确可见的 Mesh 才会加入到射线探测的白名单里
        if (child.isMesh && child.visible) {
          child.material = jadeMaterial.clone() 
          validCollidableMeshes.push(child) 
        }
      })

      const box = new THREE.Box3()
      model.updateMatrixWorld(true)
      validCollidableMeshes.forEach(mesh => box.expandByObject(mesh))

      if (!box.isEmpty()) {
        const size = box.getSize(new THREE.Vector3())
        const maxDim = Math.max(size.x, size.y, size.z)
        const scale = 2.8 / maxDim 
        model.scale.set(scale, scale, scale)
        
        model.updateMatrixWorld(true)
        const scaledBox = new THREE.Box3()
        validCollidableMeshes.forEach(mesh => scaledBox.expandByObject(mesh))
        const scaledCenter = scaledBox.getCenter(new THREE.Vector3())

        model.position.x -= scaledCenter.x
        model.position.y -= scaledCenter.y - 0.2 
        model.position.z -= scaledCenter.z
      }

      bodyGroup.add(model)
      
      // 强制刷新所有有效网格的世界矩阵
      bodyGroup.updateMatrixWorld(true)
      validCollidableMeshes.forEach(mesh => mesh.updateMatrixWorld(true))
      
      autoSnapToSurface()
      createMeridiansAndPoints() 
      triggerIntro()
    },
    (xhr) => {
      if (xhr.total > 0) loadingProgress.value = Math.round((xhr.loaded / xhr.total) * 100)
      else loadingProgress.value = Math.min(99, loadingProgress.value + 5) 
    },
    (error) => {
      console.warn('⚠️ 未检测到外部模型，启用玉石明堂白模。')
      createFallbackBody() 
      triggerIntro()
    }
  )
}

// ===== 智能射线方向判定计算器 =====
const getRayParams = (p) => {
  let origin = new THREE.Vector3()
  let dir = new THREE.Vector3()
  
  if (p.y > 1.45) { 
     // 头顶：贴近头皮自上而下打
     origin.set(p.x, 2.0, p.z); dir.set(0, -1, 0)
  } else if (p.z < -0.05) {
     // 背后：近距离自后往前打
     origin.set(p.x, p.y, -0.6); dir.set(0, 0, 1) 
  } else {
     // 正面及四肢：统一从前往后打
     origin.set(p.x, p.y, 0.6); dir.set(0, 0, -1) 
  }
  return { origin, dir }
}

const autoSnapToSurface = () => {
  const raycaster = new THREE.Raycaster()
  
  // 1. 贴合孤立穴位
  acupointsUI.value.forEach(pt => {
    let { origin, dir } = getRayParams(pt.pos)

    raycaster.set(origin, dir)
    // 只探测可见白名单对象，彻底无视幽灵女模和隐形边框
    const intersects = raycaster.intersectObjects(validCollidableMeshes, false)
    
    if (intersects.length > 0) {
      const hitInfo = intersects[0]
      pt.pos.copy(hitInfo.point)
      
      if (hitInfo.face) {
        const normalMatrix = new THREE.Matrix3().getNormalMatrix(hitInfo.object.matrixWorld)
        const worldNormal = hitInfo.face.normal.clone().applyMatrix3(normalMatrix).normalize()
        pt.pos.add(worldNormal.multiplyScalar(0.015)) // 沿法线浮起防穿模
      } else {
        pt.pos.add(dir.clone().multiplyScalar(-0.015)) 
      }
    }
  })

  // 2. 贴合经络管线
  const snapCurve = (points) => {
    return points.map(p => {
      let { origin, dir } = getRayParams(p)
      
      raycaster.set(origin, dir)
      const intersects = raycaster.intersectObjects(validCollidableMeshes, false)
      
      if (intersects.length > 0) {
        const hitInfo = intersects[0]
        const snappedPoint = hitInfo.point.clone()
        if (hitInfo.face) {
          const normalMatrix = new THREE.Matrix3().getNormalMatrix(hitInfo.object.matrixWorld)
          const worldNormal = hitInfo.face.normal.clone().applyMatrix3(normalMatrix).normalize()
          return snappedPoint.add(worldNormal.multiplyScalar(0.015))
        }
        return snappedPoint.add(dir.clone().multiplyScalar(-0.015))
      }
      return p
    })
  }

  // 执行管线网格贴合
  renmaiPoints = snapCurve(renmaiPoints)
  dumaiPoints = snapCurve(dumaiPoints)
  weijingLeftPoints = snapCurve(weijingLeftPoints)
  weijingRightPoints = snapCurve(weijingRightPoints)
  pangguangLeftPoints = snapCurve(pangguangLeftPoints)
  pangguangRightPoints = snapCurve(pangguangRightPoints)
}

const triggerIntro = () => {
  isLoading.value = false
  isIntroActive = true
  introProgress = 0
}

const createFallbackBody = () => {
  validCollidableMeshes = []
  const sphereGeo = new THREE.SphereGeometry(1, 64, 64)
  const cylGeo = new THREE.CylinderGeometry(1, 1, 1, 32)
  const addMuscle = (geo, x, y, z, scaleX, scaleY, scaleZ, rotZ=0, rotX=0) => {
    const mesh = new THREE.Mesh(geo, jadeMaterial)
    mesh.position.set(x, y, z); mesh.scale.set(scaleX, scaleY, scaleZ); mesh.rotation.set(rotX, 0, rotZ)
    bodyGroup.add(mesh)
    validCollidableMeshes.push(mesh)
  }

  addMuscle(sphereGeo, 0, 1.45, 0.02,  0.12, 0.15, 0.13, 0, 0.1); 
  addMuscle(cylGeo, 0, 1.25, 0,        0.05, 0.15, 0.05); 
  addMuscle(sphereGeo, 0, 0.95, 0,     0.22, 0.20, 0.15); 
  addMuscle(sphereGeo, 0, 0.6, 0,      0.18, 0.22, 0.13); 
  addMuscle(sphereGeo, 0, 0.2, 0,      0.21, 0.18, 0.15); 

  const createLimb = (sign) => { 
    addMuscle(sphereGeo, sign*0.24, 1.0, 0,       0.08, 0.1, 0.08, sign*0.2); 
    const upperArmGeo = new THREE.CylinderGeometry(0.06, 0.04, 0.45, 32);
    addMuscle(upperArmGeo, sign*0.32, 0.65, 0,    1, 1, 1, sign*0.15); 
    addMuscle(sphereGeo, sign*0.36, 0.4, 0,       0.045, 0.045, 0.045); 
    const lowerArmGeo = new THREE.CylinderGeometry(0.04, 0.025, 0.4, 32);
    addMuscle(lowerArmGeo, sign*0.4, 0.18, 0.02,  1, 1, 1, sign*0.1, -0.1); 
    const thighGeo = new THREE.CylinderGeometry(0.1, 0.07, 0.6, 32);
    addMuscle(thighGeo, sign*0.12, -0.2, 0,       1, 1, 1, sign*-0.05); 
    addMuscle(sphereGeo, sign*0.13, -0.55, 0.02,  0.06, 0.06, 0.06); 
    const calfGeo = new THREE.CylinderGeometry(0.06, 0.04, 0.5, 32);
    addMuscle(calfGeo, sign*0.14, -0.85, 0,       1, 1, 1); 
    addMuscle(sphereGeo, sign*0.14, -0.75, -0.02, 0.06, 0.15, 0.06); 
    addMuscle(sphereGeo, sign*0.15, -1.15, 0.04,  0.05, 0.03, 0.12); 
  };
  createLimb(1); createLimb(-1);
  
  bodyGroup.updateMatrixWorld(true)
  validCollidableMeshes.forEach(m => m.updateMatrixWorld(true))
  autoSnapToSurface()
  createMeridiansAndPoints()
}

const createMeridiansAndPoints = () => {
  // 渲染流体经脉
  createFluidMeridianLine(renmaiPoints, THEME.renmai)
  createFluidMeridianLine(dumaiPoints, THEME.dumai)
  createFluidMeridianLine(weijingLeftPoints, THEME.weijing)
  createFluidMeridianLine(weijingRightPoints, THEME.weijing)
  createFluidMeridianLine(pangguangLeftPoints, THEME.pangguang)
  createFluidMeridianLine(pangguangRightPoints, THEME.pangguang)
  
  // 渲染发光穴位点
  acupointsUI.value.forEach(pt => {
    let colorHex = THEME.dumai
    if (pt.color === '#CC3333') colorHex = THEME.renmai
    if (pt.color === '#4DA8DA') colorHex = THEME.weijing
    if (pt.color === '#B88A62') colorHex = THEME.pangguang
    
    createAcupointMesh(pt.pos, colorHex)
  })
}

const createFluidMeridianLine = (points, colorHex) => {
  const curve = new THREE.CatmullRomCurve3(points)
  const tubeGeo = new THREE.TubeGeometry(curve, 128, 0.005, 8, false)
  
  const fluidMat = new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(colorHex) },
      uTime: { value: 0.0 }
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uTime;
      varying vec2 vUv;
      void main() {
        float pulse = sin(vUv.x * 20.0 - uTime * 4.0) * 0.5 + 0.5;
        pulse = pow(pulse, 2.0); 
        float alpha = mix(0.1, 0.8, pulse); 
        gl_FragColor = vec4(uColor * (pulse + 0.5), alpha);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide
  })
  
  meridiansGroup.add(new THREE.Mesh(tubeGeo, fluidMat))
  animatedMaterials.push(fluidMat)
}

const createAcupointMesh = (position, colorHex) => {
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(0.012, 16, 16),
    new THREE.MeshBasicMaterial({ color: THEME.pointCore })
  )
  core.position.copy(position)

  const halo = new THREE.Mesh(
    new THREE.SphereGeometry(0.038, 16, 16),
    new THREE.MeshBasicMaterial({ 
      color: colorHex, 
      transparent: true, 
      opacity: 0.6, 
      blending: THREE.AdditiveBlending 
    })
  )
  halo.userData = { phase: Math.random() * Math.PI * 2 }
  core.add(halo)
  meridiansGroup.add(core)
}

const createTaijiCompassBase = () => {
  baseGroup.position.y = -1.35

  const outerRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.85, 0.015, 16, 64),
    new THREE.MeshBasicMaterial({ color: THEME.baseOuter, transparent: true, opacity: 0.4 })
  )
  outerRing.rotation.x = Math.PI / 2
  baseGroup.add(outerRing)

  const midRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.75, 0.005, 16, 64),
    new THREE.MeshBasicMaterial({ color: THEME.dumai, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending })
  )
  midRing.rotation.x = Math.PI / 2
  baseGroup.add(midRing)

  const innerRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.65, 0.005, 16, 64),
    new THREE.MeshBasicMaterial({ color: THEME.renmai, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending })
  )
  innerRing.rotation.x = Math.PI / 2
  baseGroup.add(innerRing)

  const linesGeo = new THREE.BufferGeometry()
  const linesCount = 24
  const linesPos = new Float32Array(linesCount * 2 * 3)
  for(let i=0; i<linesCount; i++) {
    const angle = (i / linesCount) * Math.PI * 2
    const innerR = i % 3 === 0 ? 0.65 : 0.70
    linesPos[i*6] = Math.cos(angle) * innerR;   linesPos[i*6+1] = 0; linesPos[i*6+2] = Math.sin(angle) * innerR
    linesPos[i*6+3] = Math.cos(angle) * 0.85; linesPos[i*6+4] = 0; linesPos[i*6+5] = Math.sin(angle) * 0.85
  }
  linesGeo.setAttribute('position', new THREE.BufferAttribute(linesPos, 3))
  const linesMat = new THREE.LineBasicMaterial({ color: THEME.dumai, transparent: true, opacity: 0.25 })
  const lines = new THREE.LineSegments(linesGeo, linesMat)
  baseGroup.add(lines)
  
  const planeGeo = new THREE.CircleGeometry(0.85, 64)
  const planeMat = new THREE.MeshBasicMaterial({ 
    color: THEME.bodyGlow, transparent: true, opacity: 0.03, blending: THREE.AdditiveBlending, side: THREE.DoubleSide 
  })
  const plane = new THREE.Mesh(planeGeo, planeMat)
  plane.rotation.x = -Math.PI / 2
  baseGroup.add(plane)
  
  baseGroup.userData = { outerRing, midRing, innerRing, lines }
}

const setupInteraction = () => {
  const dom = containerRef.value
  dom.addEventListener('mousedown', (e) => { isDragging = true; previousMousePosition = { x: e.clientX, y: e.clientY } })
  dom.addEventListener('mousemove', (e) => {
    if (isDragging) {
      targetRotation.y += (e.clientX - previousMousePosition.x) * 0.01
      targetRotation.x += (e.clientY - previousMousePosition.y) * 0.01
      targetRotation.x = Math.max(-Math.PI / 6, Math.min(Math.PI / 6, targetRotation.x))
      previousMousePosition = { x: e.clientX, y: e.clientY }
    }
  })
  window.addEventListener('mouseup', () => isDragging = false)
  window.addEventListener('mouseleave', () => isDragging = false)
  dom.addEventListener('wheel', (e) => {
    e.preventDefault()
    if(isIntroActive) return 
    camera.position.z += e.deltaY > 0 ? 0.2 : -0.2
    camera.position.z = Math.max(2.5, Math.min(6, camera.position.z))
  }, { passive: false })
}

const onWindowResize = () => {
  if (!containerRef.value || !camera || !renderer) return
  camera.aspect = containerRef.value.clientWidth / containerRef.value.clientHeight
  camera.updateProjectionMatrix()
  renderer.setSize(containerRef.value.clientWidth, containerRef.value.clientHeight)
}

const easeOutQuart = (x) => 1 - Math.pow(1 - x, 4)

const animate = () => {
  animationId = requestAnimationFrame(animate)
  time += 0.01

  if (isIntroActive) {
    introProgress += 0.012
    if (introProgress >= 1) {
      introProgress = 1
      isIntroActive = false
    }
    const ease = easeOutQuart(introProgress)
    camera.position.y = 3.0 - (3.0 - 0.2) * ease
    camera.position.z = 8.0 - (8.0 - 4.2) * ease
    camera.lookAt(0, 0, 0)
  }

  if (!isDragging) targetRotation.y += 0.0015
  currentRotation.x += (targetRotation.x - currentRotation.x) * 0.08
  currentRotation.y += (targetRotation.y - currentRotation.y) * 0.08
  
  bodyGroup.rotation.set(currentRotation.x, currentRotation.y, 0)
  meridiansGroup.rotation.set(currentRotation.x, currentRotation.y, 0)

  animatedMaterials.forEach(mat => {
    mat.uniforms.uTime.value = time
  })

  meridiansGroup.children.forEach(child => {
    if (child.children.length > 0) {
      const halo = child.children[0]
      if(halo && halo.userData.phase !== undefined) {
        const scale = 1 + 0.25 * Math.sin(time * 2.5 + halo.userData.phase)
        halo.scale.set(scale, scale, scale)
      }
    }
  })

  if (baseGroup.userData.outerRing) {
    baseGroup.userData.outerRing.rotation.z = time * 0.05
    baseGroup.userData.midRing.rotation.z = -time * 0.08
    baseGroup.userData.innerRing.rotation.z = time * 0.12
    baseGroup.userData.lines.rotation.y = time * 0.02
  }

  updateLabelsPosition()
  renderer.render(scene, camera)
}

const updateLabelsPosition = () => {
  if (!containerRef.value || isIntroActive) return 
  const widthHalf = containerRef.value.clientWidth / 2
  const heightHalf = containerRef.value.clientHeight / 2
  camera.updateMatrixWorld()
  const rotMat = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(currentRotation.x, currentRotation.y, 0))

  acupointsUI.value = acupointsUI.value.map(pt => {
    const vector = pt.pos.clone().applyMatrix4(rotMat).project(camera)
    const isVisible = vector.z < 1 && vector.x > -1 && vector.x < 1 && vector.y > -1 && vector.y < 1
    const vital = Math.min(100, Math.max(80, pt.vitality + (Math.sin(time * 2 + pt.pos.y) * 1.5)))
    return { 
      ...pt, 
      x: (vector.x * widthHalf) + widthHalf, 
      y: -(vector.y * heightHalf) + heightHalf, 
      visible: isVisible,
      vitality: vital.toFixed(1)
    }
  })
}
</script>

<style scoped>
.human-body-3d-wrapper {
  position: relative;
  width: 100%;
  height: 700px;
  background: radial-gradient(circle at 50% 40%, #2A1C16 0%, #110D0B 80%, #050403 100%);
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 30px 60px rgba(0, 0, 0, 0.6), inset 0 0 0 1px rgba(212, 175, 55, 0.15);
  font-family: 'Noto Serif SC', 'STZhongsong', 'SimSun', serif;
  color: #E8D5C4;
}

.canvas-container {
  width: 100%;
  height: 100%;
  cursor: grab;
}
.canvas-container:active {
  cursor: grabbing;
}

.fade-in {
  animation: fadeInUI 1.5s ease-out 1s forwards;
  opacity: 0;
}
@keyframes fadeInUI {
  to { opacity: 1; }
}

.hud-top {
  position: absolute;
  top: 35px;
  left: 40px;
  right: 40px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  pointer-events: none;
  z-index: 10;
}

.hud-sys-status {
  text-align: right;
  font-size: 13px;
  color: #C0A88D;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.status-item {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  letter-spacing: 1px;
}

.dot {
  width: 6px;
  height: 6px;
  background: #CC3333;
  border-radius: 50%;
  box-shadow: 0 0 8px #CC3333;
}

.dot.blink {
  animation: breathe 2s ease-in-out infinite;
}

@keyframes breathe {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(0.8); }
}

.hud-bottom {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  padding: 30px 40px;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  pointer-events: none;
  background: linear-gradient(to top, rgba(17,13,11,0.95) 0%, rgba(17,13,11,0.5) 60%, transparent 100%);
}

.controls-hint {
  font-size: 13px;
  color: #8A7356;
  display: flex;
  align-items: center;
  gap: 12px;
  letter-spacing: 1px;
}
.hint-icon {
  font-size: 16px;
  opacity: 0.8;
}

.data-stream {
  font-size: 13px;
  color: #D4AF37;
  letter-spacing: 3px;
  display: flex;
  align-items: center;
  gap: 10px;
}

/* ===== 核心：悬停交互样式重构 ===== */
.point-labels-container {
  position: absolute;
  inset: 0;
  pointer-events: none; /* 穿透点击，让画布可拖拽 */
}

.acu-label {
  position: absolute;
  top: 0;
  left: 0;
  display: flex;
  align-items: center;
  transition: opacity 0.4s ease;
  will-change: transform;
  z-index: 10;
}

/* 隐藏不可见的穴位 */
.acu-label.hidden {
  opacity: 0;
  pointer-events: none; 
}

/* 悬停时置顶，防止重叠遮挡 */
.acu-label:hover {
  z-index: 20; 
}

/* 核心呼吸锚点 */
.label-core-point {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  position: absolute;
  left: -6px;
  top: -6px;
  pointer-events: auto; /* 允许触发交互 */
  cursor: pointer;
  transition: all 0.3s ease;
}

/* 【核心修复】扩大隐形交互热区，解决不够灵敏的问题 */
.label-core-point::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 60px;  /* 超大隐形触发区域宽 */
  height: 60px; /* 超大隐形触发区域高 */
  background: transparent;
  border-radius: 50%;
}

/* 悬停放大，增加光影感 */
.acu-label:hover .label-core-point {
  transform: scale(1.3);
  filter: brightness(1.2);
}

/* 连线：默认缩短至 0 并透明 */
.label-line {
  width: 60px;
  height: 1px;
  position: absolute;
  left: 0;
  top: 0;
  transform-origin: left center;
  transform: rotate(-20deg) scaleX(0);
  opacity: 0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 悬停时：如剑出鞘 */
.acu-label:hover .label-line {
  transform: rotate(-20deg) scaleX(1);
  opacity: 1;
}

/* 详情面板：默认缩小、偏移并隐藏 */
.label-content {
  background: rgba(42, 28, 22, 0.85);
  border: 1px solid rgba(212, 175, 55, 0.4);
  padding: 10px 16px;
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  position: absolute;
  left: 0;
  top: 0;
  transform: translate(30px, -20px) scale(0.9);
  opacity: 0;
  visibility: hidden;
  pointer-events: none; /* 隐藏时不能被点击 */
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); /* 加快动画弹出速度，更灵敏 */
  box-shadow: 0 8px 24px rgba(0,0,0,0.5);
  border-radius: 4px;
  width: max-content; /* 强制不换行 */
}

/* 悬停时：面板放大浮现 */
.acu-label:hover .label-content {
  transform: translate(50px, -35px) scale(1);
  opacity: 1;
  visibility: visible;
  pointer-events: auto; /* 显示后允许内部文字被选中或交互 */
}

.label-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 6px;
  border-bottom: 1px solid rgba(232, 213, 196, 0.15);
  padding-bottom: 4px;
}

.label-name {
  color: #FFF8E7;
  font-size: 16px;
  font-weight: bold;
  letter-spacing: 2px;
}

.label-pinyin {
  font-family: -apple-system, sans-serif;
  font-size: 10px;
  color: #8A7356;
  letter-spacing: 1px;
}

.label-desc {
  color: #C0A88D;
  font-size: 12px;
  margin-bottom: 8px;
}

.label-data {
  color: #8A7356;
  font-size: 11px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-family: -apple-system, sans-serif;
}

.vitality-bar {
  width: 100%;
  height: 3px;
  background: rgba(255,255,255,0.1);
  border-radius: 2px;
  overflow: hidden;
}
.vitality-fill {
  height: 100%;
  transition: width 0.3s ease;
}

.vitality-num {
  font-weight: bold;
}

.loading-overlay {
  position: absolute;
  inset: 0;
  background: rgba(17, 13, 11, 0.95);
  backdrop-filter: blur(15px);
  z-index: 50;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: #D4AF37;
}

.loader-bagua {
  position: relative;
  width: 60px;
  height: 60px;
  margin-bottom: 24px;
}

.loader-circle {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2px solid transparent;
}
.loader-circle.outer {
  border-top-color: #D4AF37;
  border-bottom-color: #D4AF37;
  animation: spin 2s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite;
}
.loader-circle.inner {
  inset: 10px;
  border-left-color: #CC3333;
  border-right-color: #CC3333;
  animation: spin 1.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite reverse;
}

.loader-text {
  text-align: center;
}

.loader-title {
  font-size: 18px;
  letter-spacing: 3px;
  margin-bottom: 10px;
  color: #E8D5C4;
}

.loader-hint {
  font-size: 13px;
  color: #8A7356;
  letter-spacing: 2px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .human-body-3d-wrapper { height: 500px; }
  .hud-top { left: 20px; right: 20px; top: 20px; }
  .hud-sys-status { display: none; }
  .hud-bottom { padding: 20px; flex-direction: column; align-items: flex-start; gap: 10px; }
  .label-line { width: 30px; }
  /* 移动端适配面板悬停弹出位置 */
  .acu-label:hover .label-content { transform: translate(25px, -20px) scale(1); padding: 8px 12px; }
  .label-desc, .vitality-bar { display: none; }
}
</style>