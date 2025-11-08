<template>
  <div :class="cardClass">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  noPadding?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  noPadding: false
});

const cardClass = computed(() => {
  const base = 'bg-card text-card-foreground rounded-xl border';
  const padding = props.noPadding ? '' : 'p-6';
  return `${base} ${padding}`;
});
</script>
