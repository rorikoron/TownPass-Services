<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import PageHeader from '@/components/molecules/PageHeader.vue';
import BottomNav from '@/components/molecules/BottomNav.vue';
import BaseButton from '@/components/atoms/BaseButton.vue';
import BaseCard from '@/components/atoms/BaseCard.vue';
import dogWalkingDetailJson from '../../public/mock/dog_walking_detail.json';

const route = useRoute();
const router = useRouter();

interface DogDetail {
  id: string;
  dogName: string;
  breed: string;
  ownerName: string;
  ownerLocation: string;
  favoriteActivities: string[];
  useCases: string[];
  walkingTime: string;
  description: string;
  imageUrl: string;
  reviews: number;
  rating: number;
}

const dogDetail = computed(() => 
  dogWalkingDetailJson.data.find((dog: DogDetail) => dog.id === route.params.id)
) as unknown as DogDetail;

// 展開狀態
const isBasicInfoExpanded = ref(false);
const isActivitiesExpanded = ref(false);
const isLocationExpanded = ref(false);
const isWalkingTimeExpanded = ref(false);

const USE_CASES_MAP: { [key: string]: string } = {
  'owner': '飼主可發佈任務讓他人代遛狗',
  'walker': '無狗者可接任務運動並陪伴狗狗',
  'both': '雙方皆有狗時可配對一起遛狗'
};

const getUseCaseLabels = (cases: string[]) => {
  return cases.map(useCase => USE_CASES_MAP[useCase] || useCase);
};

const goBack = () => {
  router.back();
};

const contactOwner = () => {
  // TODO: 實現聯繫飼主功能
  if (dogDetail) {
    alert(`聯繫飼主 ${dogDetail.ownerName}`);
  }
};
</script>

<template>
  <div class="min-h-screen bg-background pb-24">
    <PageHeader title="狗狗詳情" :step="1" />

    <div v-if="dogDetail" class="px-4 py-6 space-y-4">
      <!-- 狗狗基本卡片 -->
      <BaseCard class="p-6 border border-border bg-white shadow-sm">
        <div class="flex items-center gap-4 mb-6">
          <div class="w-20 h-20 bg-muted rounded-lg flex items-center justify-center">
            <!-- <img :src="dogDetail.imageUrl" :alt="dogDetail.dogName" class="w-full h-full object-cover rounded-lg" /> -->
            <span class="text-2xl">🐕</span>
          </div>
          <div class="flex-1">
            <h1 class="text-2xl font-bold text-foreground">{{ dogDetail.dogName }}</h1>
            <p class="text-sm text-muted-foreground">{{ dogDetail.breed }}</p>
            <div class="flex items-center mt-2 text-sm">
              <span class="text-primary-500 font-semibold">{{ dogDetail.rating }}</span>
              <span class="text-muted-foreground ml-1">({{ dogDetail.reviews }} 評論)</span>
            </div>
          </div>
        </div>

        <!-- 簡短介紹 -->
        <p class="text-foreground text-sm leading-relaxed">{{ dogDetail.description }}</p>
      </BaseCard>

      <!-- 飼主資訊 (展開) -->
      <BaseCard class="border border-border bg-white shadow-sm overflow-hidden">
        <button
          class="w-full px-6 py-4 flex items-center justify-between hover:bg-muted transition-colors"
          @click="isBasicInfoExpanded = !isBasicInfoExpanded"
        >
          <span class="font-semibold text-foreground">飼主資訊</span>
          <svg
            :class="{ 'rotate-180': isBasicInfoExpanded }"
            class="text-muted-foreground transition-transform w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </button>

        <div
          class="grid grid-rows-[0fr] transition-all duration-300"
          :class="{ 'grid-rows-[1fr]': isBasicInfoExpanded }"
        >
          <div class="overflow-hidden">
            <div class="px-6 pb-4 space-y-4 bg-muted/30">
              <div>
                <p class="text-sm text-muted-foreground">飼主名字</p>
                <p class="text-foreground font-semibold">{{ dogDetail.ownerName }}</p>
              </div>
              <div>
                <p class="text-sm text-muted-foreground">飼主地點</p>
                <p class="text-foreground font-semibold">{{ dogDetail.ownerLocation }}</p>
              </div>
            </div>
          </div>
        </div>
      </BaseCard>

      <!-- 狗狗品種 (展開) -->
      <BaseCard class="border border-border bg-white shadow-sm overflow-hidden">
        <button
          class="w-full px-6 py-4 flex items-center justify-between hover:bg-muted transition-colors"
          @click="isActivitiesExpanded = !isActivitiesExpanded"
        >
          <span class="font-semibold text-foreground">狗狗品種 & 喜愛活動</span>
          <svg
            :class="{ 'rotate-180': isActivitiesExpanded }"
            class="text-muted-foreground transition-transform w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </button>

        <div
          class="grid grid-rows-[0fr] transition-all duration-300"
          :class="{ 'grid-rows-[1fr]': isActivitiesExpanded }"
        >
          <div class="overflow-hidden">
            <div class="px-6 pb-4 space-y-4 bg-muted/30">
              <div>
                <p class="text-sm text-muted-foreground">品種</p>
                <p class="text-foreground font-semibold">{{ dogDetail.breed }}</p>
              </div>
              <div>
                <p class="text-sm text-muted-foreground mb-2">喜愛的運動</p>
                <div class="flex flex-wrap gap-2">
                  <span
                    v-for="activity in dogDetail.favoriteActivities"
                    :key="activity"
                    class="px-3 py-1 bg-primary/10 text-primary-500 rounded-full text-sm font-medium"
                  >
                    {{ activity }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </BaseCard>

      <!-- 使用場景 (展開) -->
      <BaseCard class="border border-border bg-white shadow-sm overflow-hidden">
        <button
          class="w-full px-6 py-4 flex items-center justify-between hover:bg-muted transition-colors"
          @click="isLocationExpanded = !isLocationExpanded"
        >
          <span class="font-semibold text-foreground">使用場景</span>
          <svg
            :class="{ 'rotate-180': isLocationExpanded }"
            class="text-muted-foreground transition-transform w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </button>

        <div
          class="grid grid-rows-[0fr] transition-all duration-300"
          :class="{ 'grid-rows-[1fr]': isLocationExpanded }"
        >
          <div class="overflow-hidden">
            <div class="px-6 pb-4 space-y-2 bg-muted/30">
              <p
                v-for="useCase in getUseCaseLabels(dogDetail.useCases)"
                :key="useCase"
                class="text-foreground text-sm flex items-start"
              >
                <span class="text-primary-500 mr-2">•</span>
                {{ useCase }}
              </p>
            </div>
          </div>
        </div>
      </BaseCard>

      <!-- 遛狗時間 (展開) -->
      <BaseCard class="border border-border bg-white shadow-sm overflow-hidden">
        <button
          class="w-full px-6 py-4 flex items-center justify-between hover:bg-muted transition-colors"
          @click="isWalkingTimeExpanded = !isWalkingTimeExpanded"
        >
          <span class="font-semibold text-foreground">遛狗時間</span>
          <ChevronDown
            :size="20"
            class="text-muted-foreground transition-transform"
            :class="{ 'rotate-180': isWalkingTimeExpanded }"
          />
        </button>

        <div
          class="grid grid-rows-[0fr] transition-all duration-300"
          :class="{ 'grid-rows-[1fr]': isWalkingTimeExpanded }"
        >
          <div class="overflow-hidden">
            <div class="px-6 pb-4 bg-muted/30">
              <p class="text-foreground font-semibold">{{ dogDetail.walkingTime }}</p>
            </div>
          </div>
        </div>
      </BaseCard>

      <!-- 行動按鈕 -->
      <div class="grid grid-cols-2 gap-3 pt-4">
        <BaseButton @click="goBack" :outline="true">
          返回
        </BaseButton>
        <BaseButton @click="contactOwner">
          聯繫飼主
        </BaseButton>
      </div>
    </div>

    <div v-else class="px-4 py-6">
      <p class="text-muted-foreground text-center">找不到狗狗資訊</p>
    </div>

    <BottomNav />
  </div>
</template>

<style scoped lang="postcss">
/* 展開動畫 */
.grid {
  @apply transition-all duration-300;
}
</style>
