<script setup lang="ts">
import { ref, computed } from 'vue';
import BaseCard from '@/components/atoms/BaseCard.vue';
import BaseButton from '@/components/atoms/BaseButton.vue';
import BaseLabel from '@/components/atoms/BaseLabel.vue';
import BaseSelect from '@/components/atoms/BaseSelect.vue';
import PageHeader from '@/components/molecules/PageHeader.vue';
import BottomNav from '@/components/molecules/BottomNav.vue';

interface Dog {
  id: string;
  name: string;
  breed: string;
  activities: string[];
  owner: string;
  status: 'available' | 'walking' | 'completed';
}

const USE_CASES = [
  { label: '飼主可發佈任務讓他人代遛狗', value: 'owner' },
  { label: '無狗者可接任務運動並陪伴狗狗', value: 'walker' },
  { label: '雙方皆有狗時可配對一起遛狗', value: 'both' }
];

const DOG_BREEDS = [
  { label: '全部品種', value: 'all' },
  { label: '柯基', value: '柯基' },
  { label: '哈士奇', value: '哈士奇' },
  { label: '柴犬', value: '柴犬' },
  { label: '黃金獵犬', value: '黃金獵犬' },
  { label: '拉布拉多', value: '拉布拉多' }
];

const ACTIVITIES = [
  { label: '寵物瑜伽', value: '寵物瑜伽' },
  { label: '遊泳', value: '遊泳' },
  { label: '自行車陪跑', value: '自行車陪跑' },
  { label: '丟球', value: '丟球' }
];

const SAMPLE_DOGS: Dog[] = [
  { id: '1', name: '小Q', breed: '柯基', activities: ['丟球', '散步'], owner: '王先生', status: 'available' },
  { id: '2', name: '旺財', breed: '哈士奇', activities: ['自行車陪跑', '散步'], owner: '李女士', status: 'available' },
  { id: '3', name: '小白', breed: '柴犬', activities: ['遊泳', '丟球'], owner: '林先生', status: 'available' }
];

const selectedUseCase = ref('');
const selectedBreed = ref('all');
const selectedActivities = ref<string[]>([]);
const showResults = ref(false);

const filteredDogs = computed(() => {
  return SAMPLE_DOGS.filter((dog) => {
    const breedMatch = selectedBreed.value === 'all' || dog.breed === selectedBreed.value;
    const activityMatch = selectedActivities.value.length === 0 || 
                         selectedActivities.value.some(activity => dog.activities.includes(activity));
    const statusMatch = dog.status === 'available';
    return breedMatch && activityMatch && statusMatch;
  });
});

const toggleActivity = (activity: string) => {
  const index = selectedActivities.value.indexOf(activity);
  if (index > -1) {
    selectedActivities.value.splice(index, 1);
  } else {
    selectedActivities.value.push(activity);
  }
};

const handleSearch = () => {
  showResults.value = true;
};

const backToFilter = () => {
  showResults.value = false;
};
</script>

<template>
  <div class="min-h-screen bg-background pb-24">
    <PageHeader title="瀏覽可遛的狗狗" :step="2" />

    <!-- 篩選介面 -->
    <div v-if="!showResults" class="px-4 py-6 space-y-6">
      <!-- 選擇使用場景 -->
      <div>
        <BaseLabel class="text-foreground mb-3 block">選擇使用場景 *</BaseLabel>
        <div class="space-y-3">
          <label
            v-for="useCase in USE_CASES"
            :key="useCase.value"
            class="flex items-center gap-3 p-4 rounded-lg border border-border cursor-pointer transition-colors hover:bg-muted"
            :class="{ 'bg-primary/5 border-primary': selectedUseCase === useCase.value }"
          >
            <input
              type="radio"
              name="useCase"
              :value="useCase.value"
              v-model="selectedUseCase"
              class="h-5 w-5 text-primary focus:ring-2 focus:ring-primary"
            />
            <span class="text-sm">{{ useCase.label }}</span>
          </label>
        </div>
      </div>

      <!-- 篩選品種 -->
      <div>
        <BaseLabel htmlFor="breedFilter" class="text-foreground mb-2 block">
          篩選品種 (可選)
        </BaseLabel>
        <BaseSelect
          select-id="breedFilter"
          v-model="selectedBreed"
          :options="DOG_BREEDS"
          default-selected="全部品種"
        />
      </div>

      <!-- 篩選活動類型 -->
      <div>
        <BaseLabel class="text-foreground mb-3 block">篩選活動類型 (可選)</BaseLabel>
        <div class="space-y-2">
          <label
            v-for="activity in ACTIVITIES"
            :key="activity.value"
            class="flex items-center gap-3 cursor-pointer"
          >
            <input
              type="checkbox"
              :value="activity.value"
              :checked="selectedActivities.includes(activity.value)"
              @change="toggleActivity(activity.value)"
              class="h-4 w-4 rounded border-input bg-muted text-primary focus:ring-2 focus:ring-primary"
            />
            <span class="text-sm">{{ activity.label }}</span>
          </label>
        </div>
      </div>

      <!-- 進行篩選按鈕 -->
      <BaseButton @click="handleSearch" class="w-full py-6 text-base font-semibold bg-primary text-primary-foreground">
        進行篩選
      </BaseButton>
    </div>

    <!-- 搜尋結果 -->
    <div v-else class="px-4 py-6 space-y-4">
      <!-- 返回篩選按鈕 -->
      <BaseButton
        @click="backToFilter"
        class="w-full py-3 text-base font-semibold bg-white border border-border text-foreground"
        outline
      >
        返回篩選
      </BaseButton>

      <!-- 結果計數 -->
      <h3 class="text-lg font-semibold text-foreground">找到 {{ filteredDogs.length }} 隻狗狗</h3>

      <!-- 狗狗列表 -->
      <div class="space-y-3">
        <BaseCard
          v-for="dog in filteredDogs"
          :key="dog.id"
          class="border border-border"
        >
          <div class="space-y-3">
            <div>
              <h3 class="text-xl font-semibold text-foreground">{{ dog.name }}</h3>
              <p class="text-sm text-muted-foreground">{{ dog.breed }}</p>
              <p class="text-sm text-muted-foreground">飼主: {{ dog.owner }}</p>
            </div>

            <div class="flex gap-3">
              <BaseButton class="flex-1 py-2 text-sm bg-white border border-primary text-primary" outline>
                詳情
              </BaseButton>
              <BaseButton class="flex-1 py-2 text-sm bg-primary text-primary-foreground">
                遛狗
              </BaseButton>
            </div>
          </div>
        </BaseCard>

        <div v-if="filteredDogs.length === 0" class="text-center py-12">
          <p class="text-muted-foreground">找不到符合條件的狗狗</p>
        </div>
      </div>
    </div>

    <BottomNav />
  </div>
</template>

<style scoped>
/* 自定義 radio 和 checkbox 樣式 */
input[type="radio"],
input[type="checkbox"] {
  appearance: none;
  -webkit-appearance: none;
  display: inline-block;
  position: relative;
  cursor: pointer;
}

input[type="radio"]::before,
input[type="checkbox"]::before {
  content: '';
  display: block;
  width: 100%;
  height: 100%;
  border: 2px solid hsl(var(--input));
  background-color: hsl(var(--background));
}

input[type="radio"]::before {
  border-radius: 50%;
}

input[type="checkbox"]::before {
  border-radius: 4px;
}

input[type="radio"]:checked::before,
input[type="checkbox"]:checked::before {
  background-color: hsl(var(--primary));
  border-color: hsl(var(--primary));
}

input[type="radio"]:checked::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: white;
}

input[type="checkbox"]:checked::after {
  content: '✓';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 12px;
  font-weight: bold;
}
</style>
