<template>
  <div
    class="markdown-viewer"
    v-html="renderedContent"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { renderMarkdown } from '@/utils/markdown'

const props = defineProps<{
  content: string
}>()

const renderedContent = computed(() => renderMarkdown(props.content))
</script>

<style>
.markdown-viewer {
  @apply prose prose-gray dark:prose-invert max-w-none;
  @apply prose-headings:font-semibold prose-headings:text-gray-900 dark:prose-headings:text-gray-100;
  @apply prose-p:text-gray-700 dark:prose-p:text-gray-300;
  @apply prose-a:text-primary-600 dark:prose-a:text-primary-400;
  @apply prose-strong:text-gray-900 dark:prose-strong:text-gray-100;
  @apply prose-code:text-pink-600 dark:prose-code:text-pink-400 prose-code:bg-gray-100 dark:prose-code:bg-dark-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded;
  @apply prose-pre:bg-dark-800 prose-pre:text-gray-300;
  @apply prose-blockquote:border-l-4 prose-blockquote:border-gray-300 dark:prose-blockquote:border-dark-600;
  @apply prose-ul:list-disc prose-ol:list-decimal;
  @apply prose-li:marker:text-gray-500;
}

.markdown-viewer h1 {
  @apply text-2xl mb-4;
}

.markdown-viewer h2 {
  @apply text-xl mb-3 mt-6;
}

.markdown-viewer h3 {
  @apply text-lg mb-2 mt-4;
}

.markdown-viewer p {
  @apply mb-4 leading-relaxed;
}

.markdown-viewer ul, .markdown-viewer ol {
  @apply mb-4 pl-6;
}

.markdown-viewer li {
  @apply mb-1;
}

.markdown-viewer pre {
  @apply p-4 rounded-lg overflow-x-auto mb-4;
}

.markdown-viewer code {
  @apply font-mono text-sm;
}

.markdown-viewer blockquote {
  @apply pl-4 italic my-4;
}

.markdown-viewer hr {
  @apply my-6 border-gray-200 dark:border-dark-700;
}

.markdown-viewer table {
  @apply w-full border-collapse mb-4;
}

.markdown-viewer th, .markdown-viewer td {
  @apply border border-gray-300 dark:border-dark-600 px-4 py-2;
}

.markdown-viewer th {
  @apply bg-gray-50 dark:bg-dark-800 font-semibold;
}
</style>
