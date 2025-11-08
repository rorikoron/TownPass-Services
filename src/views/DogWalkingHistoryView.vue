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

// replace with acctual id
const user_id = ref<string>('7f3562f4-bb3f-4ec7-89b9-da3b4b5ff250');
const handleConnectionData = (event: { data: string }) => {
  const parsed = JSON.parse(event.data);
  console.log('Received data:', JSON.stringify(parsed, null, 2));

  user_id.value = parsed.data?.id;
};

useHandleConnectionData(handleConnectionData);
onMounted(async () => {
  useConnectionMessage('userinfo', null);
});

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
      <!-- Tabs Header -->
      <div class="w-full grid grid-cols-3 gap-0 border-b border-border bg-background px-4">
        <button
          @click="activeTab = 'published'"
          :class="[
            'py-3 text-sm font-medium transition-colors border-b-2',
            activeTab === 'published'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          ]"
        >
          發佈紀錄
        </button>
        <button
          @click="activeTab = 'walked'"
          :class="[
            'py-3 text-sm font-medium transition-colors border-b-2',
            activeTab === 'walked'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          ]"
        >
          遛狗紀錄
        </button>
        <button
          @click="activeTab = 'queue'"
          :class="[
            'py-3 text-sm font-medium transition-colors border-b-2',
            activeTab === 'queue'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          ]"
        >
          遛狗清單
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
                      class="inline-block px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-600"
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
                      class="w-6 h-6 text-blue-500 animate-spin"
                      fill="none"
                      stroke="currentColor"
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
