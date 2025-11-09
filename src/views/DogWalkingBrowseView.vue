<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import BaseCard from '@/components/atoms/BaseCard.vue';
import BaseButton from '@/components/atoms/BaseButton.vue';
import BaseLabel from '@/components/atoms/BaseLabel.vue';
import BaseSelect from '@/components/atoms/BaseSelect.vue';
import PageHeader from '@/components/molecules/PageHeader.vue';
import BottomNav from '@/components/molecules/BottomNav.vue';
import dogWalkingDetailJson from '../../public/mock/dog_walking_detail.json';
import { useDogWalkingStore } from '@/stores/dogWalking';
import { supabase } from '@/lib/supabaseClient';
import { SupabaseClient } from '@supabase/supabase-js';
import { useHandleConnectionData } from '@/composables/useHandleConnectionData';
import { useConnectionMessage } from '@/composables/useConnectionMessage';

interface Dog {
  id: string;
  name: string;
  breed: string;
  activities: string[];
  owner: string;
  status: 'available' | 'walking' | 'completed';
}

interface Event {
  user_id: string;
  user_name: string;
  dog_name: string;
  dog_breed: string;
  latitude: number;
  longitude: number;
  activity_type: string;
  starttime: string;
  endtime: string;
  status: string;
  request_sitter: boolean;
  preference: string;
  created_at: string;
  sitter_id: string;
  proposer_name: string;
}
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

const store = useDogWalkingStore();
const handleConnectionData = (event: { data: string }) => {
  const parsed = JSON.parse(event.data);
  console.log('Received data:', JSON.stringify(parsed, null, 2));

  user_name.value = parsed.data?.realName;
  user_id.value = parsed.data?.id;
};

useHandleConnectionData(handleConnectionData);

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

// const SAMPLE_DOGS: Dog[] = [
//   {
//     id: '1',
//     name: '小Q',
//     breed: '柯基',
//     activities: ['丟球', '散步'],
//     owner: '王先生',
//     status: 'available'
//   },
//   {
//     id: '2',
//     name: '旺財',
//     breed: '哈士奇',
//     activities: ['自行車陪跑', '散步'],
//     owner: '李女士',
//     status: 'available'
//   },
//   {
//     id: '3',
//     name: '小白',
//     breed: '柴犬',
//     activities: ['遊泳', '丟球'],
//     owner: '林先生',
//     status: 'available'
//   }
// ];

// const dogs = ref<Event[]>([]);
const events = ref<Event[]>([]);
const searchEventsWithFilters = async () => {
  console.log('🔍 開始篩選:', {
    品種: selectedBreed.value,
    活動: selectedActivities.value,
    開始時間: walkingStartDatetime.value,
    結束時間: walkingEndDatetime.value
  });

  try {
    // 建立基本查詢 - 只查詢 pending 狀態的活動
    let query = supabase
      .from('event')
      .select('*')
      .eq('status', 'pending');

    // 如果有選擇品種（且不是 'all'）
    if (selectedBreed.value && selectedBreed.value !== 'all') {
      query = query.eq('dog_breed', selectedBreed.value);
      console.log('📌 篩選品種:', selectedBreed.value);
    }

    // 如果有選擇活動類型
    if (selectedActivities.value.length > 0) {
      // 使用 OR 條件來匹配任何一個活動類型
      const activityConditions = selectedActivities.value
        .map(activity => `activity_type.ilike.%${activity}%`)
        .join(',');
      query = query.or(activityConditions);
      console.log('📌 篩選活動:', selectedActivities.value);
    }

    // 如果有選擇開始時間
    if (walkingStartDatetime.value) {
      const startDateTime = new Date(walkingStartDatetime.value).toISOString();
      query = query.gte('start_time', startDateTime);
      console.log('📌 篩選開始時間 >=', startDateTime);
    }

    // 如果有選擇結束時間
    if (walkingEndDatetime.value) {
      const endDateTime = new Date(walkingEndDatetime.value).toISOString();
      query = query.lte('end_time', endDateTime);
      console.log('📌 篩選結束時間 <=', endDateTime);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ 資料取得錯誤:', error);
      alert('查詢失敗：' + error.message);
      return;
    }

    console.log('✅ 查詢成功，找到', data?.length || 0, '筆資料');
    events.value = data as Event[];
    showResults.value = true;
  } catch (err) {
    console.error('❌ 查詢異常:', err);
    alert('查詢失敗，請稍後再試');
  }
};
const selectedUseCase = ref('');
const selectedBreed = ref('all');
const selectedActivities = ref<string[]>([]);
const showResults = ref(false);

// 時間篩選相關狀態
const walkingStartDatetime = ref('');
const walkingEndDatetime = ref('');

const filteredDogs = computed(() => {
  const allFiltered = SAMPLE_DOGS.filter((dog) => {
    const breedMatch = selectedBreed.value === 'all' || dog.breed === selectedBreed.value;
    const activityMatch =
      selectedActivities.value.length === 0 ||
      selectedActivities.value.some((activity) => dog.activities.includes(activity));
    const statusMatch = dog.status === 'available';
    return breedMatch && activityMatch && statusMatch;
  });

  // 排除已完成的遛狗紀錄中的狗狗
  const completedDogIds = store.walkingRecords
    .filter((record) => record.status === 'completed')
    .map((record) => record.dogId);

  // 排除隊列中的狗狗
  const queuedDogIds = store.walkingQueue.map((dog) => dog.dogId);

  return allFiltered.filter(
    (dog) => !completedDogIds.includes(dog.id) && !queuedDogIds.includes(dog.id)
  );
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

const router = useRouter();

const isDetailModalOpen = ref(false);
const selectedDog = ref<DogDetail | null>(null);
const expandedDogId = ref<Set<string>>(new Set());

const goToDogDetail = (dogId: string) => {
  if (expandedDogId.value.has(dogId)) {
    expandedDogId.value.delete(dogId);
  } else {
    expandedDogId.value.add(dogId);
  }
  // const dog = dogWalkingDetailJson.data.find((d: DogDetail) => d.id === dogId);
  // if (dog) {
  //   if (expandedDogId.value === dogId) {
  //     expandedDogId.value = null;
  //   } else {
  //     expandedDogId.value = dogId;
  //     selectedDog.value = dog;
  //   }
  // }
};

const closeDetailModal = () => {
  isDetailModalOpen.value = false;
  selectedDog.value = null;
};

const handleContactOwner = (dogName: string) => {
  alert(`聯繫飼主: ${dogName}`);
};

onMounted(() => {
  // 初始化時模擬獲取用戶帳號onMounted(async () => {
  useConnectionMessage('userinfo', null);
});

const user_id = ref('7f3562f4-bb3f-4ec7-89b9-da3b4b5ff250');
const user_name = ref('testuser');
const handleWalkingDog = async (created_at: string) => {
  console.log('🐕 加入遛狗清單，created_at:', created_at);
  
  try {
    const { data, error } = await supabase
      .from('event')
      .update({
        sitter_id: user_id.value,
        proposer_name: user_name.value
        // 不更新 status，保持 pending 狀態等待雇主確認
      })
      .eq('created_at', created_at)
      .neq('user_id', user_id.value) // 不能接自己的任務
      .select();

    if (error) {
      console.error('❌ 更新失敗:', error);
      alert('加入失敗：' + error.message);
      return;
    }

    console.log('✅ 加入成功，等待雇主確認:', data);
    alert('已加入遛狗清單，等待雇主確認！');

    // route to /history
    router.push('/history');
  } catch (err) {
    console.error('❌ 請求異常:', err);
    alert('加入失敗，請稍後再試');
  }
};

const handleStopWalking = () => {
  // 此功能已移至歷史頁面的遛狗清單標籤
};
</script>

<template>
  <div class="min-h-screen transition-colors duration-300 pb-24 bg-background">
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

      <!-- 遛狗時間篩選 -->
      <div>
        <!-- 設定時間區間 -->
        <div class="mt-4 space-y-3">
          <!-- 起始時間 -->
          <div>
            <BaseLabel class="text-foreground mb-2 block">起始時間 *</BaseLabel>
            <div class="flex gap-2">
              <input
                v-model="walkingStartDatetime"
                type="datetime-local"
                class="flex-1 px-3 py-2 border border-border rounded bg-background text-foreground"
              />
            </div>
          </div>

          <!-- 結束時間 -->
          <div>
            <BaseLabel class="text-foreground mb-2 block">結束時間 *</BaseLabel>
            <div class="flex gap-2">
              <input
                v-model="walkingEndDatetime"
                type="datetime-local"
                class="flex-1 px-3 py-2 border border-border rounded bg-background text-foreground"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- 進行篩選按鈕 -->
      <BaseButton
        @click="searchEventsWithFilters()"
        class="w-full py-6 text-base font-semibold bg-primary text-primary-foreground"
      >
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
      <h3 class="text-lg font-semibold text-foreground">找到 {{ events.length }} 隻狗狗</h3>

      <!-- 狗狗列表 -->
      <div class="space-y-3">
        <BaseCard
          v-for="event in events"
          :key="event.user_id"
          class="border border-border overflow-hidden transition-all duration-300 bg-white"
        >
          <div class="space-y-3 p-4">
            <!-- 原本的基本資訊 -->
            <div>
              <h3 class="text-xl font-semibold text-foreground">{{ event.dog_name }}</h3>
              <p class="text-sm text-muted-foreground">{{ event.dog_breed }}</p>
              <p class="text-sm text-muted-foreground">飼主: {{ event.user_name }}</p>
            </div>

            <div class="flex gap-3">
              <BaseButton
                class="flex-1 py-2 text-sm bg-white border border-primary text-primary"
                outline
                @click="goToDogDetail(event.user_id + event.dog_name)"
              >
                {{ expandedDogId.has(event.user_id + event.dog_name) ? '隱藏詳情' : '詳情' }}
              </BaseButton>
              <BaseButton
                class="flex-1 py-2 text-sm bg-primary text-primary-foreground"
                @click="handleWalkingDog(event.created_at)"
              >
                加入遛狗清單
              </BaseButton>
            </div>

            <!-- 分界線 + 展開詳情 -->
            <transition
              name="expand"
              @enter="(el: any) => (el.style.height = el.scrollHeight + 'px')"
              @leave="(el: any) => (el.style.height = 0)"
            >
              <div
                v-if="expandedDogId?.has(event.user_id + event.dog_name)"
                class="overflow-hidden"
              >
                <!-- 分界線 -->
                <div class="border-t border-border my-3"></div>

                <!-- 詳細資訊部分 -->
                <div class="space-y-4 pt-3">
                  <!-- 飼主資訊 -->
                  <div>
                    <p class="text-xs text-muted-foreground font-semibold mb-1">飼主資訊</p>
                    <div class="bg-muted/30 rounded p-3 space-y-2">
                      <div>
                        <p class="text-xs text-muted-foreground">飼主名字</p>
                        <p class="text-foreground font-semibold">{{ event.user_name }}</p>
                      </div>
                      <div>
                        <p class="text-xs text-muted-foreground">飼主地點</p>
                        <p class="text-foreground font-semibold">
                          {{ event.latitude }}, {{ event.longitude }}
                        </p>
                      </div>
                    </div>
                  </div>

                  <!-- 喜愛的運動 -->
                  <div>
                    <p class="text-xs text-muted-foreground font-semibold mb-1">喜愛的運動</p>
                    <div class="flex flex-wrap gap-2">
                      <span
                        v-for="activity in event.activity_type.split(',')"
                        :key="activity"
                        class="px-3 py-1 bg-primary/10 text-primary-500 rounded-full text-xs font-medium"
                      >
                        {{ activity }}
                      </span>
                    </div>
                  </div>

                  <!-- 遛狗時間 -->
                  <div>
                    <p class="text-xs text-muted-foreground font-semibold mb-1">遛狗時間</p>
                    <p class="text-foreground text-sm bg-muted/30 rounded p-2">
                      {{ event.starttime }} ~ {{ event.endtime }}
                    </p>
                  </div>

                  <!-- 評分 -->
                  <div>
                    <p class="text-xs text-muted-foreground font-semibold mb-1">評分</p>
                    <p class="text-foreground">
                      <span class="text-primary-500 font-semibold text-lg">4.8</span>
                      <span class="text-muted-foreground text-sm"> (4 則評論)</span>
                    </p>
                  </div>

                  <!-- 描述 -->
                  <div>
                    <p class="text-xs text-muted-foreground font-semibold mb-1">簡介</p>
                    <p class="text-foreground text-sm leading-relaxed">
                      {{ event?.preference }}
                    </p>
                  </div>

                  <!-- 聯繫按鈕 -->
                  <BaseButton
                    class="w-full py-2 text-sm bg-primary text-primary-foreground mt-2"
                    @click="handleContactOwner(event.user_name)"
                  >
                    聯繫飼主
                  </BaseButton>
                </div>
              </div>
            </transition>
          </div>
        </BaseCard>

        <div v-if="events.length === 0" class="text-center py-12">
          <p class="text-muted-foreground">找不到符合條件的狗狗</p>
        </div>
      </div>
    </div>

    <BottomNav />
  </div>
</template>

<style scoped>
/* 正在遛狗狀態動畫 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 自定義 radio 和 checkbox 樣式 */
input[type='radio'],
input[type='checkbox'] {
  appearance: none;
  -webkit-appearance: none;
  display: inline-block;
  position: relative;
  cursor: pointer;
}

input[type='radio']::before,
input[type='checkbox']::before {
  content: '';
  display: block;
  width: 100%;
  height: 100%;
  border: 2px solid hsl(var(--input));
  background-color: hsl(var(--background));
}

input[type='radio']::before {
  border-radius: 50%;
}

input[type='checkbox']::before {
  border-radius: 4px;
}

input[type='radio']:checked::before,
input[type='checkbox']:checked::before {
  background-color: hsl(var(--primary));
  border-color: hsl(var(--primary));
}

input[type='radio']:checked::after {
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

input[type='checkbox']:checked::after {
  content: '✓';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 12px;
  font-weight: bold;
}

/* 展開動畫 */
.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.expand-enter-from {
  height: 0 !important;
  opacity: 0;
}

.expand-leave-to {
  height: 0 !important;
  opacity: 0;
}
</style>
