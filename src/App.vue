<template>
  <div class="app-container">
    <!-- 侧边栏 -->
    <AppSidebar v-if="!isAuthPage" />

    <!-- 主内容区 -->
    <main class="main-content" :class="{ 'full-width': isAuthPage }">
      <RouterView v-slot="{ Component }">
        <Transition name="fade" mode="out-in">
          <component :is="Component" />
        </Transition>
      </RouterView>
    </main>

    <!-- Toast 通知 -->
    <ToastContainer />

    <!-- 全局加载遮罩 -->
    <LoadingOverlay v-if="appStore.isLoading" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '@/stores/app'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import ToastContainer from '@/components/common/ToastContainer.vue'
import LoadingOverlay from '@/components/common/LoadingOverlay.vue'

const route = useRoute()
const appStore = useAppStore()

// 判断是否为认证页面（无侧边栏）
const isAuthPage = computed(() => {
  return ['Login', 'Register'].includes(route.name as string)
})
</script>

<style scoped>
.app-container {
  @apply flex min-h-screen bg-gray-50 dark:bg-dark-900;
}

.main-content {
  @apply flex-1 ml-64 transition-all duration-300;
}

.main-content.full-width {
  @apply ml-0;
}

/* 页面过渡动画 */
.fade-enter-active,
.fade-leave-active {
  @apply transition-opacity duration-200;
}

.fade-enter-from,
.fade-leave-to {
  @apply opacity-0;
}
</style>
