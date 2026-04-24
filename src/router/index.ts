import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useTeamsStore } from '@/stores/teams'

// 同步导入所有页面组件，避免懒加载问题
import Home from '@/views/Home.vue'
import Teams from '@/views/teams/Teams.vue'
import NewTeam from '@/views/teams/NewTeam.vue'
import TeamDetail from '@/views/teams/TeamDetail.vue'
import Agents from '@/views/agents/Agents.vue'
import AgentDetail from '@/views/agents/AgentDetail.vue'
import TeamChat from '@/views/chat/TeamChat.vue'
import Settings from '@/views/settings/Settings.vue'
import NotFound from '@/views/NotFound.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    meta: { title: '首页' },
  },
  {
    path: '/teams',
    name: 'Teams',
    component: Teams,
    meta: { title: '团队' },
  },
  {
    path: '/teams/new',
    name: 'NewTeam',
    component: NewTeam,
    meta: { title: '新建团队' },
  },
  {
    path: '/agents',
    name: 'Agents',
    component: Agents,
    meta: { title: '智能体' },
  },
  {
    path: '/teams/:id',
    name: 'TeamDetail',
    component: TeamDetail,
    meta: { title: '团队详情' },
    beforeEnter: (to, from, next) => {
      try {
        const teamsStore = useTeamsStore()
        const teamId = to.params.id as string
        const team = teamsStore.getTeam(teamId)
        if (team) {
          teamsStore.setCurrentTeam(teamId)
          next()
        } else {
          next({ name: 'Home', replace: true })
        }
      } catch (e) {
        console.error('Route guard error:', e)
        next({ name: 'Home', replace: true })
      }
    },
  },
  {
    path: '/teams/:teamId/agents/:agentId',
    name: 'AgentDetail',
    component: AgentDetail,
    meta: { title: 'Agent 详情' },
  },
  {
    path: '/teams/:id/chat',
    name: 'TeamChat',
    component: TeamChat,
    meta: { title: '团队对话' },
  },
  {
    path: '/settings',
    name: 'Settings',
    component: Settings,
    meta: { title: '设置' },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: NotFound,
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

// 全局错误处理
router.onError((error) => {
  console.error('Router error:', error)
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
