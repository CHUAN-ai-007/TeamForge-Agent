<template>
  <div class="not-found-page">
    <div class="not-found-content">
      <div class="not-found-icon">404</div>
      <h1 class="not-found-title">页面不存在</h1>
      <p class="not-found-desc">您访问的页面可能已经删除或暂时不可用</p>
      <router-link to="/" class="btn-primary">
        返回首页
      </router-link>
    </div>
  </div>
</template>

<style scoped>
.not-found-page {
  @apply flex items-center justify-center min-h-screen;
}

.not-found-content {
  @apply text-center;
}

.not-found-icon {
  @apply text-8xl font-bold text-gradient mb-4;
}

.not-found-title {
  @apply text-2xl font-semibold text-gray-900 dark:text-white mb-2;
}

.not-found-desc {
  @apply text-gray-500 dark:text-gray-400 mb-6;
}
</style>
