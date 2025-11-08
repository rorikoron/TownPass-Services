<template>
  <div class="fixed bottom-0 left-0 right-0 bg-card border-t border-border px-4 py-3 flex justify-around md:hidden">
    <router-link
      v-for="item in navItems"
      :key="item.path"
      :to="item.path"
      :class="getLinkClass(item.path)"
    >
      <component :is="item.icon" class="w-5 h-5" />
      <span class="text-xs font-medium">{{ item.label }}</span>
    </router-link>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { FileText, Compass, Map, History } from 'lucide-vue-next';

const route = useRoute();

const navItems = [
  { path: '/demo-one', label: '發佈', icon: FileText },
  { path: '/browse', label: '瀏覽', icon: Compass },
  { path: '/instant', label: '地圖', icon: Map },
  { path: '/history', label: '紀錄', icon: History }
];

const getLinkClass = (path: string) => {
  const isActive = route.path === path;
  return `flex flex-col items-center gap-1 py-2 px-4 rounded-md transition-colors ${
    isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
  }`;
};
</script>
