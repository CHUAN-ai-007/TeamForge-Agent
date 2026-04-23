<template>
  <div class="code-block">
    <div class="code-header">
      <span class="code-lang">{{ language }}</span>
      <button
        class="copy-btn"
        :class="{ 'copied': copied }"
        @click="handleCopy"
      >
        <span v-if="copied">已复制</span>
        <span v-else>复制</span>
      </button>
    </div>
    <pre class="code-content"><code ref="codeRef" :class="`language-${language}`">{{ code }}</code></pre>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import hljs from 'highlight.js'
import { copyToClipboard } from '@/utils'
import { useAppStore } from '@/stores/app'

const props = defineProps<{
  code: string
  language: string
}>()

const appStore = useAppStore()
const codeRef = ref<HTMLElement>()
const copied = ref(false)

onMounted(() => {
  if (codeRef.value) {
    hljs.highlightElement(codeRef.value)
  }
})

async function handleCopy() {
  const success = await copyToClipboard(props.code)
  if (success) {
    copied.value = true
    appStore.showToast('代码已复制到剪贴板', 'success')
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } else {
    appStore.showToast('复制失败', 'error')
  }
}
</script>

<style scoped>
.code-block {
  @apply rounded-lg overflow-hidden bg-dark-800 border border-dark-700;
}

.code-header {
  @apply flex items-center justify-between px-4 py-2 bg-dark-900 border-b border-dark-700;
}

.code-lang {
  @apply text-xs font-medium text-gray-400 uppercase;
}

.copy-btn {
  @apply text-xs text-gray-400 hover:text-white transition-colors;
}

.copy-btn.copied {
  @apply text-green-400;
}

.code-content {
  @apply p-4 overflow-x-auto text-sm leading-relaxed;
  @apply text-gray-300 font-mono;
}

.code-content code {
  @apply bg-transparent p-0;
}
</style>
