<template>
  <div class="sticky top-0 z-10 rounded-none border-b bg-background/95 backdrop-blur-sm px-4 py-4 flex items-center gap-3">
    <div class="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-semibold">
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
