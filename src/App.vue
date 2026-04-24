<template>
  <div class="app-container">
    <!-- 顶部导航栏 -->
    <AppNavbar />

    <!-- 主内容区 -->
    <main class="main-content">
      <RouterView v-slot="{ Component, route }">
        <Transition name="fade" mode="out-in">
          <Suspense :key="route.path">
            <template #default>
              <component :is="Component" />
            </template>
            <template #fallback>
              <div class="loading-container">
                <div class="loading-spinner"></div>
                <p class="loading-text">加载中...</p>
              </div>
            </template>
          </Suspense>
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
import { useAppStore } from '@/stores/app'
import AppNavbar from '@/components/layout/AppNavbar.vue'
import ToastContainer from '@/components/common/ToastContainer.vue'
import LoadingOverlay from '@/components/common/LoadingOverlay.vue'

const appStore = useAppStore()
</script>

<style scoped>
.app-container {
  @apply min-h-screen bg-gray-50 dark:bg-dark-900 pt-16;
}

.main-content {
  @apply transition-all duration-300;
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

/* 加载状态 */
.loading-container {
  @apply flex flex-col items-center justify-center min-h-[60vh] gap-4;
}

.loading-spinner {
  @apply w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin;
}

.loading-text {
  @apply text-gray-500 dark:text-gray-400 text-sm;
}
</style>
