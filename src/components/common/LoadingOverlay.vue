<template>
  <Teleport to="body">
    <div class="loading-overlay">
      <div class="loading-spinner">
        <div class="spinner-ring"></div>
        <div class="spinner-ring"></div>
        <div class="spinner-ring"></div>
      </div>
      <p class="loading-text">处理中...</p>
    </div>
  </Teleport>
</template>

<style scoped>
.loading-overlay {
  @apply fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm;
}

.loading-spinner {
  @apply relative w-16 h-16;
}

.spinner-ring {
  @apply absolute inset-0 rounded-full border-4 border-transparent border-t-primary-500;
  animation: spin 1s linear infinite;
}

.spinner-ring:nth-child(1) {
  animation-delay: 0s;
}

.spinner-ring:nth-child(2) {
  animation-delay: 0.2s;
  @apply border-t-purple-500;
}

.spinner-ring:nth-child(3) {
  animation-delay: 0.4s;
  @apply border-t-blue-500;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.loading-text {
  @apply mt-4 text-white font-medium animate-pulse;
}
</style>
