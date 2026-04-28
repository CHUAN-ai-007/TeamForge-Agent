<template>
  <div class="panorama-page">
    <!-- 头部 -->
    <header class="panorama-header">
      <div class="flex items-center gap-4">
        <h1 class="text-xl font-bold text-navy-900 dark:text-white">组织架构全景</h1>
        <span class="text-sm text-navy-500 dark:text-navy-400">
          {{ currentTeam?.info.name || '选择团队' }}
        </span>
      </div>
      <div class="flex items-center gap-3">
        <select v-model="selectedTeamId" class="input text-sm py-1.5">
          <option v-for="team in teamsStore.teamList" :key="team.id" :value="team.id">
            {{ team.name }}
          </option>
        </select>
        <button class="btn-secondary text-sm" @click="resetView">重置视角</button>
        <button class="btn-primary text-sm" @click="autoRotate">自动旋转</button>
      </div>
    </header>

    <!-- 3D 画布容器 -->
    <div ref="canvasContainer" class="canvas-container">
      <!-- 加载状态 -->
      <div v-if="isLoading" class="loading-overlay">
        <div class="spinner"></div>
        <p class="mt-4 text-navy-500 dark:text-navy-400">加载全景中...</p>
      </div>

      <!-- 图例 -->
      <div class="legend-panel">
        <h4 class="legend-title">组织类型</h4>
        <div class="legend-items">
          <div class="legend-item">
            <span class="legend-dot" style="background: #6366f1;"></span>
            <span class="legend-label">公司</span>
          </div>
          <div class="legend-item">
            <span class="legend-dot" style="background: #10b981;"></span>
            <span class="legend-label">部门</span>
          </div>
          <div class="legend-item">
            <span class="legend-dot" style="background: #f59e0b;"></span>
            <span class="legend-label">小组</span>
          </div>
          <div class="legend-item">
            <span class="legend-dot" style="background: #ec4899;"></span>
            <span class="legend-label">团队</span>
          </div>
        </div>
      </div>

      <!-- 信息面板 -->
      <div v-if="selectedNode" class="info-panel">
        <div class="info-header">
          <h3 class="info-name">{{ selectedNode.name }}</h3>
          <button class="close-btn" @click="selectedNode = null">×</button>
        </div>
        <div class="info-content">
          <div class="info-row">
            <span class="info-label">类型</span>
            <span class="info-value">{{ typeLabels[selectedNode.type] }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">成员</span>
            <span class="info-value">{{ getAgentCount(selectedNode.id) }} 人</span>
          </div>
          <div v-if="selectedNode.description" class="info-row">
            <span class="info-label">描述</span>
            <p class="info-desc">{{ selectedNode.description }}</p>
          </div>
        </div>
      </div>

      <!-- 操作提示 -->
      <div class="controls-hint">
        <p>🖱️ 左键旋转 | 右键平移 | 滚轮缩放 | 点击节点查看详情</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useTeamsStore } from '@/stores/teams'
import * as THREE from 'three'
import type { OrgUnit } from '@/types'

const teamsStore = useTeamsStore()

// 状态
const canvasContainer = ref<HTMLDivElement>()
const isLoading = ref(true)
const selectedNode = ref<OrgUnit | null>(null)
const selectedTeamId = ref(teamsStore.currentTeamId || '')

// Three.js 相关
let scene: THREE.Scene | null = null
let camera: THREE.PerspectiveCamera | null = null
let renderer: THREE.WebGLRenderer | null = null
let controls: any = null
let animationId: number | null = null
let nodeMeshes: Map<string, THREE.Mesh> = new Map()
let lineMeshes: THREE.Line[] = []

// 类型标签
const typeLabels: Record<string, string> = {
  company: '公司',
  department: '部门',
  group: '小组',
  team: '团队'
}

// 颜色配置
const typeColors: Record<string, number> = {
  company: 0x6366f1,  // 靛蓝
  department: 0x10b981, // 绿色
  group: 0xf59e0b,     // 橙色
  team: 0xec4899       // 粉色
}

// 计算属性
const currentTeam = computed(() => {
  return teamsStore.teams.find(t => t.info.id === selectedTeamId.value)
})

const orgStructure = computed(() => {
  return currentTeam.value?.orgStructure || []
})

// 获取组织成员数量
function getAgentCount(orgId: string): number {
  if (!currentTeam.value) return 0
  return currentTeam.value.agents.filter(a => a.orgUnitId === orgId).length
}

// 初始化 Three.js 场景
async function initScene() {
  if (!canvasContainer.value) return

  const container = canvasContainer.value
  const width = container.clientWidth
  const height = container.clientHeight

  // 动态导入 OrbitControls
  const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls')

  // 场景
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x0f172a) // navy-900
  scene.fog = new THREE.Fog(0x0f172a, 50, 200)

  // 相机
  camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000)
  camera.position.set(0, 40, 60)

  // 渲染器
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setSize(width, height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  container.appendChild(renderer.domElement)

  // 控制器
  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.05
  controls.minDistance = 20
  controls.maxDistance = 150
  controls.maxPolarAngle = Math.PI / 2 - 0.1

  // 灯光
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4)
  scene.add(ambientLight)

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
  directionalLight.position.set(10, 20, 10)
  scene.add(directionalLight)

  const pointLight = new THREE.PointLight(0x6366f1, 0.5)
  pointLight.position.set(0, 10, 0)
  scene.add(pointLight)

  // 网格地面
  const gridHelper = new THREE.GridHelper(100, 50, 0x334155, 0x1e293b)
  scene.add(gridHelper)

  // 渲染循环
  animate()

  // 窗口大小调整
  window.addEventListener('resize', handleResize)

  // 点击事件
  renderer.domElement.addEventListener('click', handleClick)
}

// 创建组织架构3D节点
function createOrgNodes() {
  if (!scene) {
    isLoading.value = false
    return
  }

  // 清除现有节点
  nodeMeshes.forEach(mesh => scene!.remove(mesh))
  nodeMeshes.clear()
  lineMeshes.forEach(line => scene!.remove(line))
  lineMeshes = []

  if (orgStructure.value.length === 0) {
    isLoading.value = false
    return
  }

  // 构建组织树
  const orgTree = buildOrgTree(orgStructure.value)

  // 创建节点
  createNodesRecursive(orgTree, 0, 0, 0, 0)

  isLoading.value = false
}

// 构建组织树
function buildOrgTree(units: OrgUnit[]): (OrgUnit & { children: any[] })[] {
  const unitMap = new Map<string, OrgUnit & { children: any[] }>()

  // 初始化所有节点
  units.forEach(unit => {
    unitMap.set(unit.id, { ...unit, children: [] })
  })

  const roots: (OrgUnit & { children: any[] })[] = []

  // 构建父子关系
  units.forEach(unit => {
    const node = unitMap.get(unit.id)!
    if (unit.parentId === null) {
      roots.push(node)
    } else {
      const parent = unitMap.get(unit.parentId)
      if (parent) {
        parent.children.push(node)
      }
    }
  })

  return roots
}

// 递归创建节点
function createNodesRecursive(
  nodes: (OrgUnit & { children: any[] })[],
  parentX: number,
  parentY: number,
  parentZ: number,
  level: number
) {
  // 根据层级设置不同的半径
  // level 0: 公司(根节点)
  // level 1: 部门，距离公司加长 1/3
  // level 2: 小组，距离部门减少 2/3
  let radius: number
  if (level === 0) {
    radius = 0 // 根节点没有父节点
  } else if (level === 1) {
    // 部门层级：基础距离 20，加长 1/3 = 20 * 4/3 ≈ 26.7
    radius = 26.7
  } else if (level === 2) {
    // 小组层级：基础距离 25，减少 2/3 = 25 * 1/3 ≈ 8.3
    radius = 8.3
  } else {
    // 更深层级：使用较小的固定距离
    radius = 10
  }
  const yOffset = 10

  nodes.forEach((node, index) => {
    // 计算位置
    let x: number, y: number, z: number

    if (level === 0) {
      // 根节点在中心
      x = 0
      y = yOffset
      z = 0
    } else {
      // 子节点围绕父节点分布
      const angle = (index / nodes.length) * Math.PI * 2
      x = parentX + Math.cos(angle) * radius
      y = parentY + yOffset
      z = parentZ + Math.sin(angle) * radius
    }

    // 创建节点球体
    const size = level === 0 ? 3 : level === 1 ? 2 : 1.5
    const geometry = new THREE.SphereGeometry(size, 32, 32)
    const color = typeColors[node.type] || 0x94a3b8
    const material = new THREE.MeshPhongMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: 0.3,
      shininess: 100
    })
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.set(x, y, z)
    mesh.userData = { orgUnit: node }
    scene!.add(mesh)
    nodeMeshes.set(node.id, mesh)

    // 创建连接线
    if (level > 0) {
      const lineGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(parentX, parentY, parentZ),
        new THREE.Vector3(x, y, z)
      ])
      const lineMaterial = new THREE.LineBasicMaterial({
        color: 0x475569,
        opacity: 0.5,
        transparent: true
      })
      const line = new THREE.Line(lineGeometry, lineMaterial)
      scene!.add(line)
      lineMeshes.push(line)
    }

    // 创建文字标签
    createLabel(node.name, x, y + size + 1, z)

    // 递归创建子节点
    if (node.children.length > 0) {
      createNodesRecursive(node.children, x, y, z, level + 1)
    }
  })
}

// 创建文字标签
function createLabel(text: string, x: number, y: number, z: number) {
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')!
  canvas.width = 256
  canvas.height = 64

  context.font = 'bold 24px Inter, system-ui'
  context.fillStyle = '#ffffff'
  context.textAlign = 'center'
  context.fillText(text, 128, 40)

  const texture = new THREE.CanvasTexture(canvas)
  const spriteMaterial = new THREE.SpriteMaterial({ map: texture, transparent: true })
  const sprite = new THREE.Sprite(spriteMaterial)
  sprite.position.set(x, y, z)
  sprite.scale.set(8, 2, 1)
  scene!.add(sprite)
}

// 处理点击事件
function handleClick(event: MouseEvent) {
  if (!camera || !renderer) return

  const mouse = new THREE.Vector2()
  const rect = renderer.domElement.getBoundingClientRect()
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

  const raycaster = new THREE.Raycaster()
  raycaster.setFromCamera(mouse, camera)

  const meshes = Array.from(nodeMeshes.values())
  const intersects = raycaster.intersectObjects(meshes)

  if (intersects.length > 0) {
    const mesh = intersects[0].object as THREE.Mesh
    selectedNode.value = mesh.userData.orgUnit

    // 高亮选中的节点
    nodeMeshes.forEach(m => {
      const mat = m.material as THREE.MeshPhongMaterial
      mat.emissiveIntensity = 0.3
    })
    const selectedMat = mesh.material as THREE.MeshPhongMaterial
    selectedMat.emissiveIntensity = 0.8
  } else {
    selectedNode.value = null
    nodeMeshes.forEach(m => {
      const mat = m.material as THREE.MeshPhongMaterial
      mat.emissiveIntensity = 0.3
    })
  }
}

// 渲染循环
function animate() {
  animationId = requestAnimationFrame(animate)
  controls?.update()
  renderer?.render(scene!, camera!)
}

// 窗口大小调整
function handleResize() {
  if (!canvasContainer.value || !camera || !renderer) return
  const width = canvasContainer.value.clientWidth
  const height = canvasContainer.value.clientHeight
  camera.aspect = width / height
  camera.updateProjectionMatrix()
  renderer.setSize(width, height)
}

// 重置视角
function resetView() {
  if (!camera || !controls) return
  camera.position.set(0, 40, 60)
  controls.reset()
}

// 自动旋转
let isAutoRotating = false
function autoRotate() {
  if (!controls) return
  isAutoRotating = !isAutoRotating
  controls.autoRotate = isAutoRotating
  controls.autoRotateSpeed = 2
}

// 清理
function cleanup() {
  if (animationId) cancelAnimationFrame(animationId)
  window.removeEventListener('resize', handleResize)
  renderer?.domElement.removeEventListener('click', handleClick)
  renderer?.dispose()
  scene?.clear()
}

// 生命周期
onMounted(async () => {
  await nextTick()
  await initScene()
  createOrgNodes()
})

onUnmounted(() => {
  cleanup()
})

// 监听团队变化
watch(selectedTeamId, (newId) => {
  if (newId) {
    teamsStore.setCurrentTeam(newId)
    createOrgNodes()
  }
})

// 监听组织架构变化
watch(orgStructure, () => {
  createOrgNodes()
}, { deep: true })
</script>

<style scoped>
.panorama-page {
  @apply h-screen flex flex-col bg-navy-950;
}

.panorama-header {
  @apply flex items-center justify-between px-6 py-4 bg-navy-900 border-b border-navy-800;
}

.canvas-container {
  @apply flex-1 relative overflow-hidden;
}

.loading-overlay {
  @apply absolute inset-0 flex flex-col items-center justify-center bg-navy-950/80 z-50;
}

.spinner {
  @apply w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin;
}

/* 图例面板 */
.legend-panel {
  @apply absolute top-4 left-4 bg-navy-900/90 backdrop-blur-sm border border-navy-700 rounded-xl p-4 z-10;
}

.legend-title {
  @apply text-sm font-bold text-navy-200 mb-3;
}

.legend-items {
  @apply space-y-2;
}

.legend-item {
  @apply flex items-center gap-2;
}

.legend-dot {
  @apply w-3 h-3 rounded-full;
}

.legend-label {
  @apply text-xs text-navy-400;
}

/* 信息面板 */
.info-panel {
  @apply absolute top-4 right-4 w-64 bg-navy-900/90 backdrop-blur-sm border border-navy-700 rounded-xl p-4 z-10;
}

.info-header {
  @apply flex items-center justify-between mb-3 pb-3 border-b border-navy-700;
}

.info-name {
  @apply font-bold text-navy-100;
}

.close-btn {
  @apply w-6 h-6 flex items-center justify-center text-navy-400 hover:text-navy-200 transition-colors;
}

.info-content {
  @apply space-y-3;
}

.info-row {
  @apply flex items-start gap-2;
}

.info-label {
  @apply text-xs text-navy-500 w-12 flex-shrink-0;
}

.info-value {
  @apply text-sm text-navy-200;
}

.info-desc {
  @apply text-xs text-navy-400 leading-relaxed;
}

/* 操作提示 */
.controls-hint {
  @apply absolute bottom-4 left-1/2 -translate-x-1/2 bg-navy-900/80 backdrop-blur-sm px-4 py-2 rounded-full z-10;
}

.controls-hint p {
  @apply text-xs text-navy-400 whitespace-nowrap;
}

/* 按钮样式 */
.input {
  @apply px-3 py-1.5 bg-navy-800 border border-navy-700 rounded-lg text-navy-100 text-sm
         focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500;
}

.btn-secondary {
  @apply px-3 py-1.5 text-sm font-medium text-navy-300 bg-navy-800 border border-navy-700
         rounded-lg hover:bg-navy-700 transition-all duration-200;
}

.btn-primary {
  @apply px-3 py-1.5 text-sm font-medium text-white bg-gradient-to-br from-primary-500 to-primary-600
         rounded-lg hover:from-primary-600 hover:to-primary-700 transition-all duration-200;
}
</style>
