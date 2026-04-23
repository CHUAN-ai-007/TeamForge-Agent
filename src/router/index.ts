import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useTeamsStore } from '@/stores/teams'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue'),
    meta: { title: '首页' },
  },
  {
    path: '/teams/new',
    name: 'NewTeam',
    component: () => import('@/views/teams/NewTeam.vue'),
    meta: { title: '新建团队' },
  },
  {
    path: '/teams/:id',
    name: 'TeamDetail',
    component: () => import('@/views/teams/TeamDetail.vue'),
    meta: { title: '团队详情' },
    beforeEnter: (to, from, next) => {
      const teamsStore = useTeamsStore()
      const teamId = to.params.id as string
      const team = teamsStore.getTeam(teamId)
      if (team) {
        teamsStore.setCurrentTeam(teamId)
        next()
      } else {
        next({ name: 'Home', replace: true })
      }
    },
  },
  {
    path: '/teams/:teamId/agents/:agentId',
    name: 'AgentDetail',
    component: () => import('@/views/agents/AgentDetail.vue'),
    meta: { title: 'Agent 详情' },
  },
  {
    path: '/teams/:id/chat',
    name: 'TeamChat',
    component: () => import('@/views/chat/TeamChat.vue'),
    meta: { title: '团队对话' },
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('@/views/settings/Settings.vue'),
    meta: { title: '设置' },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue'),
    meta: { title: '页面不存在' },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

// 更新页面标题
router.beforeEach((to, from, next) => {
  const title = to.meta.title as string
  if (title) {
    document.title = `${title} - TeamForge Agent`
  } else {
    document.title = 'TeamForge Agent'
  }
  next()
})

export default router
