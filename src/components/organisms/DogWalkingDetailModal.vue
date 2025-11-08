<script setup lang="ts">
import { ref } from 'vue';

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

const props = defineProps<{
  dog: DogDetail;
  isOpen: boolean;
}>();

const emit = defineEmits<{
  close: [];
  contact: [dogName: string];
}>();

// 展開狀態
const isBasicInfoExpanded = ref(false);
const isActivitiesExpanded = ref(false);
const isUseCaseExpanded = ref(false);
const isWalkingTimeExpanded = ref(false);

const USE_CASES_MAP: { [key: string]: string } = {
  'owner': '飼主可發佈任務讓他人代遛狗',
  'walker': '無狗者可接任務運動並陪伴狗狗',
  'both': '雙方皆有狗時可配對一起遛狗'
};

const getUseCaseLabels = (cases: string[]) => {
  return cases.map(useCase => USE_CASES_MAP[useCase] || useCase);
};

const closeModal = () => {
  emit('close');
};

const handleContactClick = () => {
  emit('contact', props.dog.dogName);
};
</script>

<template>
  <!-- 半透明背景 -->
  <teleport to="body">
    <transition name="modal">
      <div
        v-if="isOpen"
        class="fixed inset-0 bg-black/50 flex items-end z-40"
        @click="closeModal"
      >
        <!-- Modal 內容 -->
        <div
          class="bg-white w-full rounded-t-2xl shadow-2xl max-h-[85vh] overflow-y-auto"
          @click.stop
        >
          <!-- 關閉按鈕 & 標題 -->
          <div class="sticky top-0 bg-white border-b border-border px-4 py-4 flex items-center justify-between">
            <h2 class="text-lg font-bold text-foreground">狗狗詳情</h2>
            <button
              class="p-2 hover:bg-muted rounded-lg transition-colors"
              @click="closeModal"
              aria-label="關閉"
            >
              <svg
                class="w-6 h-6 text-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <!-- Modal 主體內容 -->
          <div class="px-4 py-6 space-y-4">
            <!-- 狗狗基本資訊卡片 -->
            <div class="bg-muted/50 rounded-lg p-4 border border-border">
              <div class="flex items-center gap-4 mb-4">
                <div class="w-16 h-16 bg-white rounded-lg flex items-center justify-center border border-border">
                  <span class="text-3xl">🐕</span>
                </div>
                <div class="flex-1">
                  <h3 class="text-xl font-bold text-foreground">{{ dog.dogName }}</h3>
                  <p class="text-sm text-muted-foreground">{{ dog.breed }}</p>
                  <div class="flex items-center mt-2 text-sm">
                    <span class="text-primary-500 font-semibold">{{ dog.rating }}</span>
                    <span class="text-muted-foreground ml-1">({{ dog.reviews }} 評論)</span>
                  </div>
                </div>
              </div>
              <p class="text-sm text-foreground leading-relaxed">{{ dog.description }}</p>
            </div>

            <!-- 飼主資訊 (展開式) -->
            <div class="border border-border rounded-lg overflow-hidden">
              <button
                class="w-full px-4 py-3 flex items-center justify-between hover:bg-muted transition-colors"
                @click="isBasicInfoExpanded = !isBasicInfoExpanded"
              >
                <span class="font-semibold text-foreground">飼主資訊</span>
                <svg
                  :class="{ 'rotate-180': isBasicInfoExpanded }"
                  class="w-5 h-5 text-muted-foreground transition-transform"
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
                  <div class="px-4 pb-3 space-y-3 bg-muted/30 border-t border-border">
                    <div>
                      <p class="text-xs text-muted-foreground">飼主名字</p>
                      <p class="text-foreground font-semibold">{{ dog.ownerName }}</p>
                    </div>
                    <div>
                      <p class="text-xs text-muted-foreground">飼主地點</p>
                      <p class="text-foreground font-semibold">{{ dog.ownerLocation }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 狗狗品種 & 喜愛活動 (展開式) -->
            <div class="border border-border rounded-lg overflow-hidden">
              <button
                class="w-full px-4 py-3 flex items-center justify-between hover:bg-muted transition-colors"
                @click="isActivitiesExpanded = !isActivitiesExpanded"
              >
                <span class="font-semibold text-foreground">喜愛的運動</span>
                <svg
                  :class="{ 'rotate-180': isActivitiesExpanded }"
                  class="w-5 h-5 text-muted-foreground transition-transform"
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
                  <div class="px-4 pb-3 bg-muted/30 border-t border-border">
                    <div class="flex flex-wrap gap-2">
                      <span
                        v-for="activity in dog.favoriteActivities"
                        :key="activity"
                        class="px-3 py-1 bg-primary/10 text-primary-500 rounded-full text-xs font-medium"
                      >
                        {{ activity }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 使用場景 (展開式) -->
            <div class="border border-border rounded-lg overflow-hidden">
              <button
                class="w-full px-4 py-3 flex items-center justify-between hover:bg-muted transition-colors"
                @click="isUseCaseExpanded = !isUseCaseExpanded"
              >
                <span class="font-semibold text-foreground">使用場景</span>
                <svg
                  :class="{ 'rotate-180': isUseCaseExpanded }"
                  class="w-5 h-5 text-muted-foreground transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </button>
              <div
                class="grid grid-rows-[0fr] transition-all duration-300"
                :class="{ 'grid-rows-[1fr]': isUseCaseExpanded }"
              >
                <div class="overflow-hidden">
                  <div class="px-4 pb-3 space-y-2 bg-muted/30 border-t border-border">
                    <p
                      v-for="useCase in getUseCaseLabels(dog.useCases)"
                      :key="useCase"
                      class="text-foreground text-sm flex items-start"
                    >
                      <span class="text-primary-500 mr-2">•</span>
                      {{ useCase }}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <!-- 遛狗時間 (展開式) -->
            <div class="border border-border rounded-lg overflow-hidden">
              <button
                class="w-full px-4 py-3 flex items-center justify-between hover:bg-muted transition-colors"
                @click="isWalkingTimeExpanded = !isWalkingTimeExpanded"
              >
                <span class="font-semibold text-foreground">遛狗時間</span>
                <svg
                  :class="{ 'rotate-180': isWalkingTimeExpanded }"
                  class="w-5 h-5 text-muted-foreground transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </button>
              <div
                class="grid grid-rows-[0fr] transition-all duration-300"
                :class="{ 'grid-rows-[1fr]': isWalkingTimeExpanded }"
              >
                <div class="overflow-hidden">
                  <div class="px-4 pb-3 bg-muted/30 border-t border-border">
                    <p class="text-foreground font-semibold text-sm">{{ dog.walkingTime }}</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- 按鈕區域 -->
            <div class="grid grid-cols-2 gap-3 pt-4 pb-8">
              <button
                class="py-3 px-4 border border-border rounded-lg text-foreground font-semibold hover:bg-muted transition-colors"
                @click="closeModal"
              >
                關閉
              </button>
              <button
                class="py-3 px-4 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
                @click="handleContactClick"
              >
                聯繫飼主
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from > div,
.modal-leave-to > div {
  transform: translateY(100%);
}
</style>
