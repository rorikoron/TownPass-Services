<template>
  <label :for="htmlFor" class="text-foreground text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
    <slot />
  </label>
</template>

<script setup lang="ts">
interface Props {
  htmlFor?: string;
}

defineProps<Props>();
</script>
