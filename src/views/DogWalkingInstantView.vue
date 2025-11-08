<script setup lang="ts">
import { ref } from 'vue';
import BaseCard from '@/components/atoms/BaseCard.vue';
import BaseButton from '@/components/atoms/BaseButton.vue';
import PageHeader from '@/components/molecules/PageHeader.vue';
import BottomNav from '@/components/molecules/BottomNav.vue';
import { MapPin, Navigation } from 'lucide-vue-next';

interface DogLocation {
  id: string;
  name: string;
  breed: string;
  owner: string;
  lat: number;
  lng: number;
  distance: string;
}

const NEARBY_DOGS: DogLocation[] = [
  { id: '1', name: '小Q', breed: '柯基', owner: '王先生', lat: 25.0443, lng: 121.5627, distance: '0.3 km' },
  { id: '2', name: '旺財', breed: '哈士奇', owner: '李女士', lat: 25.0456, lng: 121.5635, distance: '0.8 km' },
  { id: '3', name: '小白', breed: '柴犬', owner: '林先生', lat: 25.0425, lng: 121.561, distance: '1.2 km' }
];

const selectedDog = ref<DogLocation | null>(null);
</script>

<template>
  <div class="min-h-screen bg-background pb-24">
    <PageHeader title="附近可遛的狗狗" :step="3" />

    <div class="px-4 py-6 space-y-6">
      <!-- 地圖預留區域 -->
      <div class="w-full h-64 rounded-lg bg-muted border border-border flex items-center justify-center relative overflow-hidden">
        <div class="absolute inset-0 bg-gradient-to-b from-blue-50 to-green-50 opacity-30" />
        <div class="text-center z-10">
          <Navigation class="w-8 h-8 text-primary mx-auto mb-2 animate-pulse" />
          <p class="text-sm text-muted-foreground">地圖展示（實際應集成 Google Maps）</p>
          <p class="text-xs text-muted-foreground mt-1">目前位置: 台北市中山區</p>
        </div>
      </div>

      <!-- 附近狗狗列表 -->
      <div class="space-y-3">
        <h3 class="font-semibold text-foreground flex items-center gap-2">
          <MapPin class="w-4 h-4 text-primary" />
          附近可遛的狗狗
        </h3>

        <BaseCard
          v-for="dog in NEARBY_DOGS"
          :key="dog.id"
          :class="[
            'border cursor-pointer transition-all',
            selectedDog?.id === dog.id ? 'border-primary bg-primary/5' : 'border-border'
          ]"
          @click="selectedDog = dog"
        >
          <div class="flex items-start gap-4">
            <div class="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span class="text-2xl">🐕</span>
            </div>
            <div class="flex-1">
              <h4 class="font-semibold text-foreground">{{ dog.name }}</h4>
              <p class="text-sm text-muted-foreground">{{ dog.breed }}</p>
              <p class="text-sm text-muted-foreground">飼主: {{ dog.owner }}</p>
              <p class="text-sm font-medium text-primary mt-1">距離 {{ dog.distance }}</p>
            </div>
          </div>
        </BaseCard>
      </div>

      <!-- 景點推薦 -->
      <div v-if="selectedDog" class="space-y-3 mt-6 pt-6 border-t border-border">
        <h3 class="font-semibold text-foreground">推薦寵物友善景點</h3>
        <BaseCard class="border border-border">
          <p class="font-medium text-foreground">彩虹河濱公園</p>
          <p class="text-sm text-muted-foreground mt-1">距離 0.5 km • 開放時間: 全天</p>
          <p class="text-xs text-muted-foreground mt-2">設有寵物活動區、飲水處、遮蔭休息區</p>
        </BaseCard>
        <BaseCard class="border border-border">
          <p class="font-medium text-foreground">舞蝶步道</p>
          <p class="text-sm text-muted-foreground mt-1">距離 1.2 km • 開放時間: 全天</p>
          <p class="text-xs text-muted-foreground mt-2">寧靜步道、適合散步、設有供水站</p>
        </BaseCard>

        <BaseButton class="w-full py-6 text-base font-semibold mt-4">
          選擇 {{ selectedDog.name }} 並預約
        </BaseButton>
      </div>
    </div>

    <BottomNav />
  </div>
</template>
