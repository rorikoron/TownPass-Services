<script setup lang="ts">
import { ref } from 'vue';
import { useDogWalkingStore } from '@/stores/dogWalking';
import BaseCard from '@/components/atoms/BaseCard.vue';
import BaseButton from '@/components/atoms/BaseButton.vue';
import BaseInput from '@/components/atoms/BaseInput.vue';
import BaseLabel from '@/components/atoms/BaseLabel.vue';
import BaseSelect from '@/components/atoms/BaseSelect.vue';
import PageHeader from '@/components/molecules/PageHeader.vue';
import BottomNav from '@/components/molecules/BottomNav.vue';
import { Plus, X } from 'lucide-vue-next';

const store = useDogWalkingStore();

const DOG_BREEDS = [
  { label: '柯基', value: '柯基' },
  { label: '哈士奇', value: '哈士奇' },
  { label: '柴犬', value: '柴犬' },
  { label: '黃金獵犬', value: '黃金獵犬' },
  { label: '拉布拉多', value: '拉布拉多' },
  { label: '貴賓犬', value: '貴賓犬' }
];

const ACTIVITIES = [
  { label: '寵物瑜伽', value: '寵物瑜伽' },
  { label: '遊泳', value: '遊泳' },
  { label: '自行車陪跑', value: '自行車陪跑' },
  { label: '丟球', value: '丟球' }
];

const USE_CASES = [
  { label: '飼主可發佈任務讓他人代遛狗', value: 'owner' },
  { label: '無狗者可接任務運動並陪伴狗狗', value: 'walker' },
  { label: '雙方皆有狗時可配對一起遛狗', value: 'both' }
];

// 額外的欄位（根據截圖需求）
const ownerName = ref('');
const ownerLocation = ref('');
const timeOption = ref('unlimited'); // 'unlimited' or 'scheduled'
const duration = ref(''); // 遛狗時長
const startTime = ref('');
const endTime = ref('');

const getUseCaseLabel = (value: string) => {
  return USE_CASES.find(uc => uc.value === value)?.label || value;
};
</script>

<template>
  <div class="min-h-screen bg-background pb-24">
    <PageHeader title="發佈狗狗資訊" :step="1" />

    <div class="px-4 py-6 space-y-6">
      <!-- 狗狗基本資訊 -->
      <BaseCard class="p-6 border border-border bg-white shadow-sm">
        <h2 class="text-lg font-semibold text-foreground mb-4">狗狗基本資訊</h2>
        
        <div class="space-y-4">
          <!-- 飼主名字和狗狗名字 (並排) -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <BaseLabel class="text-foreground">飼主名字 *</BaseLabel>
              <BaseInput
                v-model="ownerName"
                type="text"
                placeholder="輸入飼主名字"
                class="mt-2 bg-muted border-border"
              />
            </div>
            <div>
              <BaseLabel class="text-foreground">狗狗名字 *</BaseLabel>
              <BaseInput
                v-model="store.currentDog.name"
                type="text"
                placeholder="輸入狗狗名字"
                class="mt-2 bg-muted border-border"
              />
            </div>
          </div>

          <!-- 飼主地點 -->
          <div>
            <BaseLabel class="text-foreground">飼主地點 *</BaseLabel>
            <BaseInput
              v-model="ownerLocation"
              type="text"
              placeholder="輸入飼主地點"
              class="mt-2 bg-muted border-border"
            />
          </div>

          <!-- 狗狗品種 -->
          <div>
            <BaseLabel class="text-foreground">狗狗品種 *</BaseLabel>
            <BaseSelect
              select-id="dogBreed"
              v-model="store.currentDog.breed"
              :options="DOG_BREEDS"
              default-selected="選擇品種"
              custom-class="mt-2 bg-muted border-border"
            />
          </div>

          <!-- 狗狗喜歡的活動 -->
          <div>
            <BaseLabel class="text-foreground">狗狗喜歡的活動</BaseLabel>
            <div class="mt-3 space-y-2">
              <label
                v-for="activity in ACTIVITIES"
                :key="activity.value"
                class="flex items-center gap-3 cursor-pointer"
              >
                <input
                  type="checkbox"
                  :value="activity.value"
                  :checked="store.currentDog.activities?.includes(activity.value)"
                  @change="store.toggleActivity(activity.value)"
                  class="h-5 w-5 rounded border-gray-300 text-primary focus:ring-2 focus:ring-primary"
                />
                <span class="font-normal">{{ activity.label }}</span>
              </label>
            </div>
          </div>

          <!-- 使用場景 -->
          <div>
            <BaseLabel class="text-foreground">使用場景 *</BaseLabel>
            <BaseSelect
              select-id="dogUseCase"
              v-model="store.currentDog.useCase"
              :options="USE_CASES"
              default-selected="選擇使用場景"
              custom-class="mt-2 bg-muted border-border"
            />
          </div>

          <!-- 遛狗時間 -->
          <div>
            <BaseLabel class="text-foreground">遛狗時間 *</BaseLabel>
            <div class="mt-3 space-y-2">
              <label class="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  value="unlimited"
                  v-model="timeOption"
                  class="h-5 w-5 text-primary focus:ring-2 focus:ring-primary"
                />
                <span class="font-normal">不限時間</span>
              </label>
              <label class="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  value="scheduled"
                  v-model="timeOption"
                  class="h-5 w-5 text-primary focus:ring-2 focus:ring-primary"
                />
                <span class="font-normal">設定起訖時間</span>
              </label>
            </div>
          </div>

          <!-- 遛狗時長（當選擇"不限時間"時顯示） -->
          <div v-if="timeOption === 'unlimited'">
            <BaseLabel class="text-foreground">遛狗時長 (分鐘) *</BaseLabel>
            <BaseInput
              v-model="duration"
              type="text"
              placeholder="輸入遛狗時長，如 30"
              class="mt-2 bg-muted border-border"
            />
          </div>

          <!-- 起始時間（當選擇"設定起訖時間"時顯示） -->
          <div v-if="timeOption === 'scheduled'">
            <BaseLabel class="text-foreground">起始時間 *</BaseLabel>
            <BaseInput
              v-model="startTime"
              type="datetime-local"
              placeholder="年 / 月 / 日 ----:--"
              class="mt-2 bg-muted border-border"
            />
          </div>

          <!-- 結束時間（當選擇"設定起訖時間"時顯示） -->
          <div v-if="timeOption === 'scheduled'">
            <BaseLabel class="text-foreground">結束時間 *</BaseLabel>
            <BaseInput
              v-model="endTime"
              type="datetime-local"
              placeholder="年 / 月 / 日 ----:--"
              class="mt-2 bg-muted border-border"
            />
          </div>

          <!-- 新增狗狗按鈕 -->
          <BaseButton
            @click="store.addDog"
            class="w-full bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center gap-2"
          >
            <Plus class="w-4 h-4" />
            新增狗狗
          </BaseButton>
        </div>
      </BaseCard>

      <!-- 已新增的狗狗列表 -->
      <div v-if="store.dogs.length > 0" class="space-y-3">
        <h3 class="font-semibold text-foreground">待發佈狗狗 ({{ store.dogs.length }})</h3>
        <BaseCard
          v-for="dog in store.dogs"
          :key="dog.id"
          class="p-4 bg-muted border border-border"
        >
          <div class="flex justify-between items-start gap-4">
            <div class="flex-1">
              <h4 class="font-semibold text-foreground">{{ dog.name }}</h4>
              <p class="text-sm text-muted-foreground">{{ dog.breed }}</p>
              <div class="mt-2 flex flex-wrap gap-1">
                <span
                  v-for="activity in dog.activities"
                  :key="activity"
                  class="text-xs bg-primary/10 text-primary px-2 py-1 rounded"
                >
                  {{ activity }}
                </span>
              </div>
            </div>
            <button
              @click="store.removeDog(dog.id)"
              class="text-muted-foreground hover:text-foreground"
            >
              <X class="w-5 h-5" />
            </button>
          </div>
        </BaseCard>
      </div>

      <!-- 發佈按鈕 -->
      <BaseButton
        @click="store.publishDogs"
        :disabled="store.dogs.length === 0"
        class="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-6 text-base font-semibold"
      >
        發佈 {{ store.dogs.length > 0 ? `(${store.dogs.length} 隻)` : '' }}
      </BaseButton>
    </div>

    <BottomNav />
  </div>
</template>

<style scoped>
/* 自定義 checkbox 和 radio 樣式 */
input[type="checkbox"],
input[type="radio"] {
  appearance: none;
  -webkit-appearance: none;
  display: inline-block;
  position: relative;
  cursor: pointer;
  flex-shrink: 0;
}

input[type="checkbox"]::before,
input[type="radio"]::before {
  content: '';
  display: block;
  width: 100%;
  height: 100%;
  border: 2px solid #d1d5db;
  background-color: white;
}

input[type="checkbox"]::before {
  border-radius: 4px;
}

input[type="radio"]::before {
  border-radius: 50%;
}

input[type="checkbox"]:checked::before,
input[type="radio"]:checked::before {
  background-color: #9c27b0;
  border-color: #9c27b0;
}

input[type="checkbox"]:checked::after {
  content: '✓';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 14px;
  font-weight: bold;
}

input[type="radio"]:checked::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: white;
}
</style>
