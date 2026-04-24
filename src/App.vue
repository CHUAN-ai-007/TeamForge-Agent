<template>
  <div class="app-container">
    <!-- 顶部导航栏 -->
    <AppNavbar />

    <!-- 主内容区 -->
    <main class="main-content">
      <RouterView v-slot="{ Component }">
        <Transition name="fade" mode="out-in">
          <div :key="$route.path" class="page-container">
            <component :is="Component" />
          </div>
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
import { useRoute } from 'vue-router'
import { useAppStore } from '@/stores/app'
import AppNavbar from '@/components/layout/AppNavbar.vue'
import ToastContainer from '@/components/common/ToastContainer.vue'
import LoadingOverlay from '@/components/common/LoadingOverlay.vue'

const route = useRoute()
const appStore = useAppStore()
</script>

<style scoped>
.app-container {
  @apply min-h-screen bg-gray-50 dark:bg-dark-900 pt-16;
}

.main-content {
  @apply transition-all duration-300;
}

.page-container {
  @apply min-h-[calc(100vh-4rem)];
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
