<template>
  <div class="sticky top-0 z-10 rounded-none border-b bg-background/95 backdrop-blur-sm px-4 py-4 flex items-center gap-3">
    <div class="flex items-center justify-center w-8 h-8 rounded-full text-white text-sm font-semibold" style="background-color: #2EB6C7;">
      {{ step }}
    </div>
    <h1 class="text-base font-semibold text-foreground">{{ title }}</h1>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title: string;
  step: number;
}

defineProps<Props>();
</script>
