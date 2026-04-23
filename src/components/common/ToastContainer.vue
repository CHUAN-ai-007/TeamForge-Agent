<template>
  <Teleport to="body">
    <div class="toast-container">
      <TransitionGroup name="toast">
        <div
          v-for="toast in appStore.toasts"
          :key="toast.id"
          class="toast"
          :class="`toast-${toast.type}`"
        >
          <span class="toast-icon">
            {{ iconMap[toast.type] }}
          </span>
          <span class="toast-message">{{ toast.message }}</span>
          <button class="toast-close" @click="appStore.removeToast(toast.id)">
            ×
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { useAppStore } from '@/stores/app'

const appStore = useAppStore()

const iconMap = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ',
}
</script>

<style scoped>
.toast-container {
  @apply fixed top-4 right-4 z-50 flex flex-col gap-2;
}

.toast {
  @apply flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg min-w-[300px] max-w-[500px];
  @apply bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700;
}

.toast-success {
  @apply border-l-4 border-l-green-500;
}

.toast-error {
  @apply border-l-4 border-l-red-500;
}

.toast-warning {
  @apply border-l-4 border-l-yellow-500;
}

.toast-info {
  @apply border-l-4 border-l-blue-500;
}

.toast-icon {
  @apply w-6 h-6 flex items-center justify-center rounded-full text-white text-sm font-bold flex-shrink-0;
}

.toast-success .toast-icon {
  @apply bg-green-500;
}

.toast-error .toast-icon {
  @apply bg-red-500;
}

.toast-warning .toast-icon {
  @apply bg-yellow-500;
}

.toast-info .toast-icon {
  @apply bg-blue-500;
}

.toast-message {
  @apply flex-1 text-sm text-gray-800 dark:text-gray-200;
}

.toast-close {
  @apply text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl leading-none;
}

/* Toast 动画 */
.toast-enter-active,
.toast-leave-active {
  @apply transition-all duration-300;
}

.toast-enter-from {
  @apply opacity-0 translate-x-full;
}

.toast-leave-to {
  @apply opacity-0 translate-x-full;
}
</style>
