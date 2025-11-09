<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { storeToRefs } from 'pinia';
import BaseCard from '@/components/atoms/BaseCard.vue';
import BaseButton from '@/components/atoms/BaseButton.vue';
import PageHeader from '@/components/molecules/PageHeader.vue';
import BottomNav from '@/components/molecules/BottomNav.vue';
import { useDogWalkingStore } from '@/stores/dogWalking';
import { supabase } from '@/lib/supabaseClient';
import { useHandleConnectionData } from '@/composables/useHandleConnectionData';
import { useConnectionMessage } from '@/composables/useConnectionMessage';

interface Record {
  id: string;
  dogName: string;
  date: string;
  duration: string;
  status: 'completed' | 'ongoing' | 'cancelled';
  type: 'published' | 'walked';
  breed?: string;
  ownerName?: string;
  queueId?: string;
  publisherConfirmed?: boolean;
}

const store = useDogWalkingStore();
const { walkingRecords, walkingQueue, isWalking, currentWalkingDog } = storeToRefs(store);

// 統計時間範圍
const selectedPeriod = ref<'week' | 'month' | 'year'>('week');

// 統計區塊是否展開（使用 localStorage 記住狀態）
const isStatsExpanded = ref(localStorage.getItem('statsExpanded') !== 'false');

const toggleStats = () => {
  isStatsExpanded.value = !isStatsExpanded.value;
  localStorage.setItem('statsExpanded', String(isStatsExpanded.value));
};

const HISTORY_RECORDS: Record[] = [
  {
    id: '1',
    dogName: '小Q',
    date: '2025-01-08',
    duration: '45 分鐘',
    status: 'completed',
    type: 'published'
  },
  {
    id: '2',
    dogName: '旺財',
    date: '2025-01-07',
    duration: '1 小時',
    status: 'completed',
    type: 'walked'
  },
  {
    id: '3',
    dogName: '小白',
    date: '2025-01-06',
    duration: '30 分鐘',
    status: 'ongoing',
    type: 'published'
  }
];

const activeTab = ref<'published' | 'walked' | 'queue'>('walked');

// 合併遛狗紀錄和已發佈紀錄
const mergedRecords = computed(() => {
  console.log('walkingRecords.value:', walkingRecords.value);
  const walked = walkingRecords.value.map((record) => {
    console.log('Processing record:', record);
    return {
      id: record.id,
      dogName: record.dogName,
      breed: record.breed,
      ownerName: record.ownerName,
      date: record.startTime,
      duration: record.duration ? `${record.duration} 分鐘` : '進行中',
      status: record.status === 'completed' ? 'completed' : 'ongoing',
      type: 'walked' as const,
      queueId: '',
      publisherConfirmed: true
    };
  });

  const published = HISTORY_RECORDS.filter((r) => r.type === 'published');
  console.log('merged records:', { walked, published });
  return { walked, published };
});

const filteredRecords = computed(() => {
  if (activeTab.value === 'walked') {
    return mergedRecords.value.walked;
  }
  // 發布紀錄：顯示隊列中的狗狗
  return walkingQueue.value.map((queuedDog) => ({
    id: queuedDog.id,
    dogName: queuedDog.dogName,
    breed: queuedDog.breed,
    ownerName: queuedDog.ownerName,
    date: queuedDog.addedTime,
    duration: '待遛狗',
    status: queuedDog.publisherConfirmed ? 'completed' : 'ongoing',
    type: 'published' as const,
    queueId: queuedDog.id,
    publisherConfirmed: queuedDog.publisherConfirmed
  }));
});

// const handleStartWalking = (queueId: string) => {
//   const queuedDog = walkingQueue.value.find((dog) => dog.id === queueId);
//   if (queuedDog && !queuedDog.publisherConfirmed) {
//     alert('請先等待飼主確認才能開始遛狗');
//     return;
//   }
//   store.startWalkingFromQueue(queueId);
// };
const handleStartWalking = async (createdAt: string) => {
  const result = await supabase
    .from('event')
    .update({ status: 'started' })
    .eq('created_at', createdAt);

  if (result.error) {
    console.error('更新狀態錯誤:', result.error);
    return;
  }
  alert('已開始遛狗');
  await updateEvents();

  store.startWalkingFromQueue(createdAt);
};

// const handleStopWalking = () => {
//   store.stopWalkingFromQueue();
// };

// const handleConfirmPublisher = (queueId: string) => {
//   // 獲取當前發布人的帳號（模擬從 Flutter 傳入的發布人帳號）
//   // 這裡應該從用戶認證系統或 Flutter 獲取
//   const publisherAccountId = 'publisher-uuid-' + Math.random().toString(36).substr(2, 9);

//   const result = store.confirmPublisherForQueue(queueId, publisherAccountId);
//   if (!result) {
//     alert('確認失敗：發布人和遛狗者不能是同一個帳號');
//     return;
//   }
//   alert('發布人已確認');
// };

const handleConfirmPublisher = async (createdAt: string) => {
  // 獲取當前發布人的帳號（模擬從 Flutter 傳入的發布人帳號）
  // 這裡應該從用戶認證系統或 Flutter 獲取
  const result = await supabase
    .from('event')
    .update({ status: 'active' })
    .eq('created_at', createdAt);
  if (!result) {
    alert('確認失敗：發布人和遛狗者不能是同一個帳號');
    return;
  }
  alert('發布人已確認');
  await updateEvents();
};
const handleStopWalking = async (createdAt: string) => {
  const result = await supabase
    .from('event')
    .update({ status: 'completed' })
    .eq('created_at', createdAt);

  if (result.error) {
    console.error('更新狀態錯誤:', result.error);
    return;
  }
  alert('已停止遛狗');
  await updateEvents();
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'completed':
      return '已完成';
    case 'ongoing':
      return '進行中';
    case 'cancelled':
      return '已取消';
    default:
      return status;
  }
};

interface Event {
  user_id: string;
  user_name: string;
  dog_name: string;
  dog_breed: string;
  latitude: number;
  longitude: number;
  activity_type: string;
  start_time: string;
  end_time: string;
  status: string;
  request_sitter: boolean;
  preference: string;
  created_at: string;
  sitter_id: string;
  proposer_name: string;
}
const events = ref<Event[]>([]);
const steps_today = ref<number>(0);

// replace with acctual id
const user_id = ref<string>('7f3562f4-bb3f-4ec7-89b9-da3b4b5ff250');
const handleConnectionData = (event: { data: string }) => {
  const parsed = JSON.parse(event.data);
  console.log('Received data:', JSON.stringify(parsed, null, 2));

  if (parsed?.name === 'userinfo') user_id.value = parsed.data?.id;
  // else steps_today.value = parsed?.data?.steps
};

useHandleConnectionData(handleConnectionData);

const updateEvents = async () => {
  const { data, error } = await supabase
    .from('event')
    .select('*')
    .or('user_id.neq.' + user_id + ',sitter_id.eq.' + user_id);

  if (error) {
    console.error('データ取得エラー:', error);
    return;
  }

  events.value = data as Event[];
};
onMounted(async () => {
  useConnectionMessage('userinfo', null);
  useConnectionMessage('health_connect', null);
  await updateEvents();
});
function calculateMins(start_time: string, end_time: string) {
  const start = new Date(start_time);
  const end = new Date(end_time);

  const diffMs = end - start;
  const diffMinutes = diffMs / (1000 * 60);

  return Math.round(diffMinutes);
}
</script>

<template>
  <div class="min-h-screen bg-background pb-24">
    <PageHeader title="遛狗紀錄" :step="4" />

    <div class="w-full">
      <!-- 統計數據區塊 -->
      <div class="bg-background border-b border-gray-200">
        <!-- 標題列 -->
        <div
          @click="toggleStats"
          class="px-4 py-4 flex items-center justify-between cursor-pointer hover:bg-white/50 transition-colors"
        >
          <div class="flex items-center gap-2">
            <h2 class="text-lg font-bold text-gray-900">步數統計</h2>
            <span class="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full"
              >本週累計 54,000 步</span
            >
          </div>
          <svg
            :class="[
              'w-5 h-5 text-gray-400 transition-transform',
              isStatsExpanded ? 'rotate-180' : ''
            ]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>

        <!-- 可展開的統計內容 -->
        <transition
          enter-active-class="transition-all duration-300 ease-out"
          enter-from-class="opacity-0 max-h-0"
          enter-to-class="opacity-100 max-h-[800px]"
          leave-active-class="transition-all duration-300 ease-in"
          leave-from-class="opacity-100 max-h-[800px]"
          leave-to-class="opacity-0 max-h-0"
        >
          <div v-show="isStatsExpanded" class="px-4 pb-6 overflow-hidden">
            <!-- 週/月/年切換按鈕 -->
            <div class="flex gap-2 mb-6">
              <button
                @click="selectedPeriod = 'week'"
                :class="
                  selectedPeriod === 'week'
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                "
                class="px-8 py-2.5 rounded-full text-sm font-medium transition-colors"
              >
                週
              </button>
              <button
                @click="selectedPeriod = 'month'"
                :class="
                  selectedPeriod === 'month'
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                "
                class="px-8 py-2.5 rounded-full text-sm font-medium transition-colors"
              >
                月
              </button>
              <button
                @click="selectedPeriod = 'year'"
                :class="
                  selectedPeriod === 'year'
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                "
                class="px-8 py-2.5 rounded-full text-sm font-medium transition-colors"
              >
                年
              </button>
            </div>

            <!-- 長條圖 -->
            <div class="mb-6 relative" style="padding-bottom: 50px">
              <!-- Y 軸刻度線和數值 -->
              <div
                class="absolute left-0 top-0 flex flex-col justify-between text-xs text-gray-500 pr-3 font-medium"
                style="height: 200px"
              >
                <span>20K</span>
                <span>15K</span>
                <span>10K</span>
                <span>5K</span>
                <span>0</span>
              </div>

              <!-- 圖表區域 -->
              <div class="ml-14">
                <!-- 水平虛線背景 -->
                <div class="relative" style="height: 200px">
                  <div
                    class="absolute w-full border-t border-dashed border-gray-200"
                    style="top: 0%"
                  ></div>
                  <div
                    class="absolute w-full border-t border-dashed border-gray-200"
                    style="top: 25%"
                  ></div>
                  <div
                    class="absolute w-full border-t border-dashed border-gray-200"
                    style="top: 50%"
                  ></div>
                  <div
                    class="absolute w-full border-t border-dashed border-gray-200"
                    style="top: 75%"
                  ></div>
                  <div
                    class="absolute w-full border-t border-dashed border-gray-300"
                    style="top: 100%"
                  ></div>

                  <!-- 週數據 -->
                  <div
                    v-if="selectedPeriod === 'week'"
                    class="absolute inset-0 flex items-end justify-between gap-2"
                  >
                    <div
                      class="flex-1 transition-all hover:opacity-80"
                      style="
                        height: 25%;
                        background: linear-gradient(180deg, #2EB6C7 0%, #26A3B3 100%);
                        border-radius: 6px 6px 0 0;
                      "
                    ></div>
                    <div
                      class="flex-1 transition-all hover:opacity-80"
                      style="
                        height: 45%;
                        background: linear-gradient(180deg, #2EB6C7 0%, #26A3B3 100%);
                        border-radius: 6px 6px 0 0;
                      "
                    ></div>
                    <div
                      class="flex-1 transition-all hover:opacity-80"
                      style="
                        height: 75%;
                        background: linear-gradient(180deg, #2EB6C7 0%, #26A3B3 100%);
                        border-radius: 6px 6px 0 0;
                      "
                    ></div>
                    <div
                      class="flex-1 transition-all hover:opacity-80"
                      style="
                        height: 40%;
                        background: linear-gradient(180deg, #2EB6C7 0%, #26A3B3 100%);
                        border-radius: 6px 6px 0 0;
                      "
                    ></div>
                    <div
                      class="flex-1 transition-all hover:opacity-80"
                      style="
                        height: 55%;
                        background: linear-gradient(180deg, #2EB6C7 0%, #26A3B3 100%);
                        border-radius: 6px 6px 0 0;
                      "
                    ></div>
                    <div
                      class="flex-1 transition-all hover:opacity-80"
                      style="
                        height: 30%;
                        background: linear-gradient(180deg, #2EB6C7 0%, #26A3B3 100%);
                        border-radius: 6px 6px 0 0;
                      "
                    ></div>
                    <div
                      class="flex-1 transition-all hover:opacity-80"
                      style="
                        height: 28%;
                        background: linear-gradient(180deg, #2EB6C7 0%, #26A3B3 100%);
                        border-radius: 6px 6px 0 0;
                      "
                    ></div>
                  </div>

                  <!-- 月數據 -->
                  <div
                    v-if="selectedPeriod === 'month'"
                    class="absolute inset-0 flex items-end justify-between gap-2"
                  >
                    <div
                      class="flex-1 transition-all hover:opacity-80"
                      style="
                        height: 50%;
                        background: linear-gradient(180deg, #2EB6C7 0%, #26A3B3 100%);
                        border-radius: 6px 6px 0 0;
                      "
                    ></div>
                    <div
                      class="flex-1 transition-all hover:opacity-80"
                      style="
                        height: 65%;
                        background: linear-gradient(180deg, #2EB6C7 0%, #26A3B3 100%);
                        border-radius: 6px 6px 0 0;
                      "
                    ></div>
                    <div
                      class="flex-1 transition-all hover:opacity-80"
                      style="
                        height: 80%;
                        background: linear-gradient(180deg, #2EB6C7 0%, #26A3B3 100%);
                        border-radius: 6px 6px 0 0;
                      "
                    ></div>
                    <div
                      class="flex-1 transition-all hover:opacity-80"
                      style="
                        height: 90%;
                        background: linear-gradient(180deg, #2EB6C7 0%, #26A3B3 100%);
                        border-radius: 6px 6px 0 0;
                      "
                    ></div>
                  </div>

                  <!-- 年數據 -->
                  <div
                    v-if="selectedPeriod === 'year'"
                    class="absolute inset-0 flex items-end justify-between gap-1"
                  >
                    <div
                      class="flex-1 transition-all hover:opacity-80"
                      style="
                        height: 35%;
                        background: linear-gradient(180deg, #2EB6C7 0%, #26A3B3 100%);
                        border-radius: 4px 4px 0 0;
                      "
                    ></div>
                    <div
                      class="flex-1 transition-all hover:opacity-80"
                      style="
                        height: 30%;
                        background: linear-gradient(180deg, #2EB6C7 0%, #26A3B3 100%);
                        border-radius: 4px 4px 0 0;
                      "
                    ></div>
                    <div
                      class="flex-1 transition-all hover:opacity-80"
                      style="
                        height: 45%;
                        background: linear-gradient(180deg, #2EB6C7 0%, #26A3B3 100%);
                        border-radius: 4px 4px 0 0;
                      "
                    ></div>
                    <div
                      class="flex-1 transition-all hover:opacity-80"
                      style="
                        height: 55%;
                        background: linear-gradient(180deg, #2EB6C7 0%, #26A3B3 100%);
                        border-radius: 4px 4px 0 0;
                      "
                    ></div>
                    <div
                      class="flex-1 transition-all hover:opacity-80"
                      style="
                        height: 65%;
                        background: linear-gradient(180deg, #2EB6C7 0%, #26A3B3 100%);
                        border-radius: 4px 4px 0 0;
                      "
                    ></div>
                    <div
                      class="flex-1 transition-all hover:opacity-80"
                      style="
                        height: 70%;
                        background: linear-gradient(180deg, #2EB6C7 0%, #26A3B3 100%);
                        border-radius: 4px 4px 0 0;
                      "
                    ></div>
                    <div
                      class="flex-1 transition-all hover:opacity-80"
                      style="
                        height: 80%;
                        background: linear-gradient(180deg, #2EB6C7 0%, #26A3B3 100%);
                        border-radius: 4px 4px 0 0;
                      "
                    ></div>
                    <div
                      class="flex-1 transition-all hover:opacity-80"
                      style="
                        height: 75%;
                        background: linear-gradient(180deg, #2EB6C7 0%, #26A3B3 100%);
                        border-radius: 4px 4px 0 0;
                      "
                    ></div>
                    <div
                      class="flex-1 transition-all hover:opacity-80"
                      style="
                        height: 85%;
                        background: linear-gradient(180deg, #2EB6C7 0%, #26A3B3 100%);
                        border-radius: 4px 4px 0 0;
                      "
                    ></div>
                    <div
                      class="flex-1 transition-all hover:opacity-80"
                      style="
                        height: 90%;
                        background: linear-gradient(180deg, #2EB6C7 0%, #26A3B3 100%);
                        border-radius: 4px 4px 0 0;
                      "
                    ></div>
                    <div
                      class="flex-1 transition-all hover:opacity-80"
                      style="
                        height: 78%;
                        background: linear-gradient(180deg, #2EB6C7 0%, #26A3B3 100%);
                        border-radius: 4px 4px 0 0;
                      "
                    ></div>
                    <div
                      class="flex-1 transition-all hover:opacity-80"
                      style="
                        height: 72%;
                        background: linear-gradient(180deg, #2EB6C7 0%, #26A3B3 100%);
                        border-radius: 4px 4px 0 0;
                      "
                    ></div>
                  </div>

                  <!-- X 軸標籤 - 週 -->
                  <div
                    v-if="selectedPeriod === 'week'"
                    class="absolute w-full flex justify-between gap-2"
                    style="top: 100%; margin-top: 10px"
                  >
                    <div class="flex-1 text-center">
                      <div class="text-sm font-bold text-gray-800 mb-0.5">5K</div>
                      <div class="text-xs text-gray-500">週日</div>
                    </div>
                    <div class="flex-1 text-center">
                      <div class="text-sm font-bold text-gray-800 mb-0.5">9K</div>
                      <div class="text-xs text-gray-500">週一</div>
                    </div>
                    <div class="flex-1 text-center">
                      <div class="text-sm font-bold text-gray-800 mb-0.5">15K</div>
                      <div class="text-xs text-gray-500">週二</div>
                    </div>
                    <div class="flex-1 text-center">
                      <div class="text-sm font-bold text-gray-800 mb-0.5">8K</div>
                      <div class="text-xs text-gray-500">週三</div>
                    </div>
                    <div class="flex-1 text-center">
                      <div class="text-sm font-bold text-gray-800 mb-0.5">11K</div>
                      <div class="text-xs text-gray-500">週四</div>
                    </div>
                    <div class="flex-1 text-center">
                      <div class="text-sm font-bold text-gray-800 mb-0.5">6K</div>
                      <div class="text-xs text-gray-500">週五</div>
                    </div>
                    <div class="flex-1 text-center">
                      <div class="text-sm font-bold text-gray-800 mb-0.5">5.5K</div>
                      <div class="text-xs text-gray-500">週六</div>
                    </div>
                  </div>

                  <!-- X 軸標籤 - 月 -->
                  <div
                    v-if="selectedPeriod === 'month'"
                    class="absolute w-full flex justify-between gap-2"
                    style="top: 100%; margin-top: 10px"
                  >
                    <div class="flex-1 text-center">
                      <div class="text-sm font-bold text-gray-800 mb-0.5">10K</div>
                      <div class="text-xs text-gray-500">第一週</div>
                    </div>
                    <div class="flex-1 text-center">
                      <div class="text-sm font-bold text-gray-800 mb-0.5">13K</div>
                      <div class="text-xs text-gray-500">第二週</div>
                    </div>
                    <div class="flex-1 text-center">
                      <div class="text-sm font-bold text-gray-800 mb-0.5">16K</div>
                      <div class="text-xs text-gray-500">第三週</div>
                    </div>
                    <div class="flex-1 text-center">
                      <div class="text-sm font-bold text-gray-800 mb-0.5">18K</div>
                      <div class="text-xs text-gray-500">第四週</div>
                    </div>
                  </div>

                  <!-- X 軸標籤 - 年 -->
                  <div
                    v-if="selectedPeriod === 'year'"
                    class="absolute w-full flex justify-between gap-1"
                    style="top: 100%; margin-top: 8px"
                  >
                    <div class="flex-1 text-center min-w-0">
                      <div class="text-xs font-bold text-gray-800">7K</div>
                      <div class="text-xs text-gray-500 whitespace-nowrap">1月</div>
                    </div>
                    <div class="flex-1 text-center min-w-0">
                      <div class="text-xs font-bold text-gray-800">6K</div>
                      <div class="text-xs text-gray-500 whitespace-nowrap">2月</div>
                    </div>
                    <div class="flex-1 text-center min-w-0">
                      <div class="text-xs font-bold text-gray-800">9K</div>
                      <div class="text-xs text-gray-500 whitespace-nowrap">3月</div>
                    </div>
                    <div class="flex-1 text-center min-w-0">
                      <div class="text-xs font-bold text-gray-800">11K</div>
                      <div class="text-xs text-gray-500 whitespace-nowrap">4月</div>
                    </div>
                    <div class="flex-1 text-center min-w-0">
                      <div class="text-xs font-bold text-gray-800">13K</div>
                      <div class="text-xs text-gray-500 whitespace-nowrap">5月</div>
                    </div>
                    <div class="flex-1 text-center min-w-0">
                      <div class="text-xs font-bold text-gray-800">14K</div>
                      <div class="text-xs text-gray-500 whitespace-nowrap">6月</div>
                    </div>
                    <div class="flex-1 text-center min-w-0">
                      <div class="text-xs font-bold text-gray-800">16K</div>
                      <div class="text-xs text-gray-500 whitespace-nowrap">7月</div>
                    </div>
                    <div class="flex-1 text-center min-w-0">
                      <div class="text-xs font-bold text-gray-800">15K</div>
                      <div class="text-xs text-gray-500 whitespace-nowrap">8月</div>
                    </div>
                    <div class="flex-1 text-center min-w-0">
                      <div class="text-xs font-bold text-gray-800">17K</div>
                      <div class="text-xs text-gray-500 whitespace-nowrap">9月</div>
                    </div>
                    <div class="flex-1 text-center min-w-0">
                      <div class="text-xs font-bold text-gray-800">18K</div>
                      <div class="text-xs text-gray-500 whitespace-nowrap">10月</div>
                    </div>
                    <div class="flex-1 text-center min-w-0">
                      <div class="text-xs font-bold text-gray-800">15.5K</div>
                      <div class="text-xs text-gray-500 whitespace-nowrap">11月</div>
                    </div>
                    <div class="flex-1 text-center min-w-0">
                      <div class="text-xs font-bold text-gray-800">14.5K</div>
                      <div class="text-xs text-gray-500 whitespace-nowrap">12月</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 對比數據 -->
            <div>
              <div class="flex items-center justify-between mb-4">
                <h4 class="text-base font-bold text-gray-800">每日對比</h4>
                <span class="text-xs text-gray-500">與本週平均比較</span>
              </div>
              <div class="space-y-4">
                <!-- 今天 -->
                <div class="flex items-center justify-between">
                  <span class="text-sm font-medium text-gray-700 w-12">今天</span>
                  <div class="flex-1 mx-4">
                    <div
                      class="h-9 rounded-full transition-all"
                      style="
                        width: 61.5%;
                        background: linear-gradient(90deg, #fcd34d 0%, #f59e0b 100%);
                      "
                    ></div>
                  </div>
                  <span class="text-base font-bold text-gray-900 w-16 text-right">{{
                    steps_today
                  }}</span>
                </div>
                <!-- 平均 -->
                <div class="flex items-center justify-between">
                  <span class="text-sm font-medium text-gray-700 w-12">平均</span>
                  <div class="flex-1 mx-4">
                    <div
                      class="h-9 rounded-full transition-all"
                      style="
                        width: 100%;
                        background: linear-gradient(90deg, #2EB6C7 0%, #26A3B3 100%);
                      "
                    ></div>
                  </div>
                  <span class="text-base font-bold text-gray-900 w-16 text-right">8626</span>
                </div>
              </div>
            </div>
          </div>
        </transition>
      </div>

      <!-- Tabs Header -->
      <div class="w-full grid grid-cols-3 gap-0 border-b border-border bg-background px-4">
        <button
          @click="activeTab = 'queue'"
          :class="[
            'py-3 text-sm font-medium transition-colors border-b-2',
            activeTab === 'queue'
              ? 'border-transparent'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          ]"
          :style="activeTab === 'queue' ? 'border-bottom-color: #2EB6C7; color: #2EB6C7;' : ''"
        >
          遛狗清單
        </button>
        <button
          @click="activeTab = 'published'"
          :class="[
            'py-3 text-sm font-medium transition-colors border-b-2',
            activeTab === 'published'
              ? 'border-transparent'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          ]"
          :style="activeTab === 'published' ? 'border-bottom-color: #2EB6C7; color: #2EB6C7;' : ''"
        >
          發佈紀錄
        </button>
        <button
          @click="activeTab = 'walked'"
          :class="[
            'py-3 text-sm font-medium transition-colors border-b-2',
            activeTab === 'walked'
              ? 'border-transparent'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          ]"
          :style="activeTab === 'walked' ? 'border-bottom-color: #2EB6C7; color: #2EB6C7;' : ''"
        >
          遛狗紀錄
        </button>
      </div>

      <!-- Tab Content -->
      <div class="px-4 py-6">
        <!-- 發佈紀錄 & 遛狗紀錄 -->
        <template v-if="activeTab !== 'queue'">
          <div v-if="activeTab === 'published'" class="space-y-4">
            <!-- 顯示 store 中預約的遛狗清單 -->
            <BaseCard
              v-for="queuedDog in walkingQueue"
              :key="queuedDog.id"
              class="border border-border bg-white overflow-hidden"
            >
              <div class="p-4 space-y-3">
                <!-- 狗狗基本資訊 -->
                <div class="flex items-start justify-between">
                  <div>
                    <h3 class="text-lg font-semibold text-foreground">{{ queuedDog.dogName }}</h3>
                    <p class="text-sm text-muted-foreground">{{ queuedDog.breed }}</p>
                    <p class="text-sm text-muted-foreground">飼主: {{ queuedDog.ownerName }}</p>
                    <p class="text-xs text-gray-400 mt-1">預約時間: {{ queuedDog.addedTime }}</p>
                  </div>

                  <!-- 狀態標記 -->
                  <div class="flex-shrink-0">
                    <span
                      class="inline-block px-2 py-1 text-xs rounded-full"
                      style="background-color: #D1F5FA; color: #2EB6C7;"
                    >
                      待遛狗
                    </span>
                  </div>
                </div>

                <!-- 操作按鈕 -->
                <div class="flex gap-3">
                  <BaseButton
                    class="flex-1 py-2 text-sm bg-primary text-primary-foreground"
                    @click="store.startWalkingFromQueue(queuedDog.id)"
                  >
                    開始遛狗
                  </BaseButton>
                  <BaseButton
                    class="flex-1 py-2 text-sm bg-red-500 text-white hover:bg-red-600"
                    @click="store.removeFromQueue(queuedDog.id)"
                  >
                    移除
                  </BaseButton>
                </div>
              </div>
            </BaseCard>

            <!-- 原本的發布紀錄（從資料庫抓取） -->
            <BaseCard
              v-for="record in events.filter((e) => e.user_id === user_id)"
              :key="record.created_at"
              class="border border-border bg-white overflow-hidden"
            >
              <div class="p-4 space-y-2">
                <!-- 狗狗基本資訊 + 右上角狀態符號 -->
                <div class="flex items-start justify-between">
                  <div>
                    <h3 class="text-lg font-semibold text-foreground">{{ record.dog_name }}</h3>
                    <p class="text-sm text-muted-foreground">
                      {{ record?.start_time?.slice(0, 10) }}
                    </p>
                    <p class="text-sm text-muted-foreground">應徵者: {{ record.proposer_name }}</p>
                  </div>

                  <!-- 右上角：狀態符號 -->
                  <div class="flex-shrink-0">
                    <svg
                      v-if="record?.sitter_id?.length"
                      class="w-6 h-6 text-green-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clip-rule="evenodd"
                      />
                    </svg>
                    <svg
                      v-else
                      class="w-6 h-6 text-gray-400"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <circle cx="6" cy="12" r="2" />
                      <circle cx="12" cy="12" r="2" />
                      <circle cx="18" cy="12" r="2" />
                    </svg>
                  </div>
                </div>

                <!-- 確認按鈕 -->
                <div v-if="record.status === 'pending'">
                  <BaseButton
                    class="w-full py-2 text-sm bg-primary text-primary-foreground rounded"
                    @click="handleConfirmPublisher(record.created_at)"
                  >
                    確認
                  </BaseButton>
                </div>
                <div v-else class="text-center">
                  <p class="text-sm text-green-600 font-medium">✓ 已確認</p>
                </div>
              </div>
            </BaseCard>

            <!-- 空狀態 -->
            <div
              v-if="
                walkingQueue.length === 0 &&
                events.filter((e) => e.user_id === user_id).length === 0
              "
              class="text-center py-12"
            >
              <p class="text-muted-foreground">沒有發布紀錄</p>
            </div>
          </div>

          <!-- 遛狗紀錄 -->
          <div v-else class="space-y-4">
            <BaseCard
              v-for="event in events.filter(
                (e) => e.sitter_id === user_id && e.status === 'completed'
              )"
              :key="event.created_at"
              class="border border-border bg-white overflow-hidden"
            >
              <div class="p-4 space-y-2">
                <!-- 狗狗基本資訊 + 右上角狀態符號 -->
                <div class="flex items-start justify-between">
                  <div>
                    <h3 class="text-lg font-semibold text-foreground">{{ event.dog_name }}</h3>
                    <p class="text-sm text-muted-foreground">{{ event.start_time.slice(0, 10) }}</p>
                    <p class="text-sm text-muted-foreground">
                      時長: {{ calculateMins(event.start_time, event.end_time) }}
                    </p>
                  </div>

                  <!-- 右上角：狀態圖標 -->
                  <div class="flex-shrink-0">
                    <svg
                      v-if="event.status === 'completed'"
                      class="w-6 h-6 text-green-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clip-rule="evenodd"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </BaseCard>

            <div v-if="filteredRecords.length === 0" class="text-center py-12">
              <p class="text-muted-foreground">沒有紀錄</p>
            </div>
          </div>
        </template>

        <!-- 遛狗清單 -->
        <template v-else-if="activeTab === 'queue'">
          <div class="space-y-4">
            <BaseCard
              v-for="event in events.filter(
                (e) => e.sitter_id === user_id && (e.status === 'active' || e.status === 'started')
              )"
              :key="event.created_at"
              class="border border-border overflow-hidden transition-all duration-300"
              :class="event.status === 'started' ? 'bg-gray-300' : 'bg-white'"
            >
              <div class="p-4 space-y-3">
                <!-- 狗狗基本資訊 + 右上角狀態符號 -->
                <div class="flex items-start justify-between">
                  <div>
                    <h3 class="text-lg font-semibold text-foreground">{{ event.dog_name }}</h3>
                    <p class="text-sm text-muted-foreground">{{ event.dog_breed }}</p>
                    <p class="text-sm text-muted-foreground">飼主: {{ event.user_name }}</p>
                  </div>

                  <!-- 右上角：狀態符號 -->
                  <div class="flex-shrink-0">
                    <svg
                      v-if="event.status === 'started'"
                      class="w-6 h-6 animate-spin"
                      fill="none"
                      stroke="#2EB6C7"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>

                <!-- 操作按鈕 -->
                <div class="flex gap-3">
                  <BaseButton
                    v-if="event.status === 'active'"
                    class="flex-1 py-2 text-sm bg-primary text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                    @click="handleStartWalking(event.created_at)"
                  >
                    開始遛狗
                  </BaseButton>
                  <BaseButton
                    v-else-if="event.status === 'started'"
                    class="flex-1 py-2 text-sm bg-red-500 text-white hover:bg-red-600"
                    @click="handleStopWalking(event.created_at)"
                  >
                    停止
                  </BaseButton>
                </div>
              </div>
            </BaseCard>

            <div v-if="events.length === 0" class="text-center py-12">
              <p class="text-muted-foreground">遛狗清單為空</p>
            </div>
          </div>
        </template>
      </div>
    </div>

    <BottomNav />
  </div>
</template>
