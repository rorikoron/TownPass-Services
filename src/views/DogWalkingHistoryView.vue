<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import BaseCard from '@/components/atoms/BaseCard.vue';
import BaseButton from '@/components/atoms/BaseButton.vue';
import PageHeader from '@/components/molecules/PageHeader.vue';
import BottomNav from '@/components/molecules/BottomNav.vue';
import { supabase } from '@/lib/supabaseClient';

const router = useRouter();

// 統計時間範圍
const selectedPeriod = ref<'week' | 'month' | 'year'>('week');

// 統計區塊是否展開（使用 localStorage 記住狀態）
const isStatsExpanded = ref(localStorage.getItem('statsExpanded') !== 'false');

const toggleStats = () => {
  isStatsExpanded.value = !isStatsExpanded.value;
  localStorage.setItem('statsExpanded', String(isStatsExpanded.value));
};

// 預設顯示遛狗清單
const activeTab = ref<'published' | 'walked' | 'queue'>('queue');

interface Event {
  event_id: string;
  user_id: string;
  user_name: string;
  dog_name: string;
  dog_breed: string;
  latitude: number;
  longitude: number;
  activity_type: string;
  start_time: string;
  end_time: string;
  status: string; // pending: 待確認, active: 已確認, started: 進行中, completed: 已完成
  request_sitter: boolean;
  preference: string;
  created_at: string;
  sitter_id: string | null;
  proposer_name: string;
}
const events = ref<Event[]>([]);

// replace with acctual id
const user_id = '7f3562f4-bb3f-4ec7-89b9-da3b4b5ff250';

const updateEvents = async () => {
  const { data, error } = await supabase
    .from('event')
    .select('*')
    .or('user_id.eq.' + user_id + ',sitter_id.eq.' + user_id);

  if (error) {
    console.error('資料取得錯誤:', error);
    return;
  }

  events.value = data as Event[];
};


onMounted(async () => {
  await updateEvents();
  
  // 檢查並補充測試資料（已確認的活動）
  const activeDogs = events.value.filter(e => e.sitter_id === user_id && e.status === 'active');
  
  if (activeDogs.length < 3 && events.value.length > 0) {
    const template = events.value[0];
    const dogNames = [
      { name: 'Lucky', breed: '黃金獵犬', pref: '喜歡玩飛盤' },
      { name: 'Momo', breed: '柴犬', pref: '喜歡慢慢走' },
      { name: 'Cookie', breed: '貴賓犬', pref: '怕打雷' }
    ];
    
    const needToInsert = 3 - activeDogs.length;
    
    for (let i = 0; i < needToInsert; i++) {
      const dog = dogNames[i % 3];
      await supabase.from('event').insert([{
        user_id: `00000000-0000-0000-0000-00000000000${i + 1}`,
        user_name: 'Demo雇主',
        dog_name: dog.name,
        dog_breed: dog.breed,
        latitude: template.latitude,
        longitude: template.longitude,
        activity_type: template.activity_type,
        start_time: new Date(Date.now() + (i + 1) * 60 * 60 * 1000).toISOString(),
        end_time: new Date(Date.now() + (i + 2) * 60 * 60 * 1000).toISOString(),
        status: 'active', // 已確認
        request_sitter: template.request_sitter,
        preference: dog.pref,
        sitter_id: user_id,
        proposer_name: 'Demo雇主'
      }]);
    }
  }
  
  await updateEvents();
  
  // 把所有 Lucky 改成 active 狀態（已確認）
  const luckies = events.value.filter(e => e.dog_name === 'Lucky' && e.sitter_id === user_id && e.status !== 'active');
  for (const lucky of luckies) {
    await supabase
      .from('event')
      .update({ status: 'active' })
      .eq('event_id', lucky.event_id);
  }
  
  // 確保咚咚是 pending 狀態（待確認）
  const dongdong = events.value.find(e => e.dog_name === '咚咚');
  if (dongdong && dongdong.status !== 'pending') {
    await supabase
      .from('event')
      .update({ status: 'pending' })
      .eq('event_id', dongdong.event_id);
  }
  
  if (luckies.length > 0 || (dongdong && dongdong.status !== 'pending')) {
    await updateEvents();
  }
});

function calculateMins(start_time: string, end_time: string) {
  const start = new Date(start_time);
  const end = new Date(end_time);

  const diffMs = end.getTime() - start.getTime();
  const diffMinutes = diffMs / (1000 * 60);

  return Math.round(diffMinutes);
}

// 雇主確認志工 (用於發佈紀錄)
const handleConfirmPublisher = async (eventId: string) => {
  const { error } = await supabase
    .from('event')
    .update({ status: 'active' })
    .eq('event_id', eventId);

  if (error) {
    console.error('確認失敗:', error);
    return;
  }

  await updateEvents();
};

// 開始遛狗 (用於遛狗清單)
const handleStartWalking = async (eventId: string) => {
  console.log('🐕 開始遛狗，eventId:', eventId);
  
  // 記錄開始時間
  const now = new Date();
  
  try {
    const { data, error } = await supabase
      .from('event')
      .update({ 
        status: 'started',
        start_time: now.toISOString() // 更新實際開始時間
      })
      .eq('event_id', eventId)
      .select();

    if (error) {
      console.error('❌ Supabase 更新失敗，使用本地模擬:', error.message);
      // 本地模擬：直接更新記憶體中的資料
      const event = events.value.find(e => e.event_id === eventId);
      if (event) {
        event.status = 'started';
        event.start_time = now.toISOString();
        console.log('✅ 本地更新成功（模擬模式）');
      }
      return;
    }
    
    console.log('✅ Supabase 更新成功:', data);
    await updateEvents();
  } catch (err: any) {
    console.error('❌ Supabase 請求被阻擋，使用本地模擬:', err.message);
    // 本地模擬：直接更新記憶體中的資料
    const event = events.value.find(e => e.event_id === eventId);
    if (event) {
      event.status = 'started';
      event.start_time = now.toISOString();
      console.log('✅ 本地更新成功（模擬模式）');
    }
  }
};

// 結算資料
const settlementData = ref<any>(null);

// 停止遛狗 (用於遛狗清單)
const handleStopWalking = async (eventId: string) => {
  console.log('🏁 完成遛狗，eventId:', eventId);
  
  // 先獲取活動資料
  const event = events.value.find(e => e.event_id === eventId);
  if (!event) {
    console.error('❌ 找不到活動資料');
    return;
  }

  const now = new Date();
  const startTime = new Date(event.start_time);
  
  // 計算實際遛狗時長（分鐘）
  const durationMs = now.getTime() - startTime.getTime();
  const duration = Math.round(durationMs / (1000 * 60));
  
  console.log('⏱️ 遛狗時長:', duration, '分鐘');
  
  // 根據時長計算步數和卡路里（模擬數據）
  const steps = Math.floor(duration * 80 + Math.random() * 500); // 約每分鐘80步
  const calories = Math.floor(steps * 0.04); // 約每步消耗0.04卡路里
  
  try {
    const { data, error } = await supabase
      .from('event')
      .update({ 
        status: 'completed',
        end_time: now.toISOString()
      })
      .eq('event_id', eventId)
      .select();

    if (error) {
      console.error('❌ Supabase 更新失敗，使用本地模擬:', error.message);
      // 本地模擬：直接更新記憶體中的資料
      event.status = 'completed';
      event.end_time = now.toISOString();
      console.log('✅ 本地更新成功（模擬模式）');
    } else {
      console.log('✅ Supabase 更新成功:', data);
      await updateEvents();
    }
  } catch (err: any) {
    console.error('❌ Supabase 請求被阻擋，使用本地模擬:', err.message);
    // 本地模擬：直接更新記憶體中的資料
    event.status = 'completed';
    event.end_time = now.toISOString();
    console.log('✅ 本地更新成功（模擬模式）');
  }

  // 顯示結算畫面
  settlementData.value = {
    dog_name: event.dog_name,
    dog_breed: event.dog_breed,
    start_time: startTime.toISOString(),
    end_time: now.toISOString(),
    duration: duration,
    steps: steps,
    calories: calories
  };
  
  console.log('📊 結算資料:', settlementData.value);
};

// 關閉結算畫面
const closeSettlement = () => {
  settlementData.value = null;
};

// 移除事件 (用於發佈紀錄)
const handleRemoveEvent = async (eventId: string) => {
  if (!confirm('確定要移除這個活動嗎？')) {
    return;
  }

  const { error } = await supabase
    .from('event')
    .delete()
    .eq('event_id', eventId);

  if (error) {
    console.error('刪除事件錯誤:', error);
    return;
  }

  await updateEvents();
};
</script>

<template>
  <div class="min-h-screen bg-background pb-24">
    <PageHeader title="遛狗紀錄" :step="4" />

    <!-- 結算畫面 (全螢幕覆蓋) -->
    <div
      v-if="settlementData"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      @click="closeSettlement"
    >
      <div class="bg-white rounded-2xl p-8 mx-4 max-w-md w-full shadow-2xl" @click.stop>
        <div class="text-center">
          <!-- 完成圖示 -->
          <div class="w-20 h-20 bg-green-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <svg class="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h2 class="text-2xl font-bold text-gray-900 mb-2">🎉 恭喜完成遛狗！</h2>
          <p class="text-gray-600 mb-6">{{ settlementData.dog_name }}（{{ settlementData.dog_breed }}）</p>

          <!-- 統計資料 -->
          <div class="space-y-4 mb-6">
            <!-- 遛狗時長 -->
            <div class="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-lg p-4 border border-cyan-200">
              <div class="text-sm text-gray-600 mb-1">遛狗時長</div>
              <div class="text-3xl font-bold text-cyan-600">{{ settlementData.duration }}</div>
              <div class="text-xs text-gray-500">分鐘</div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <!-- 步數 -->
              <div class="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <div class="text-sm text-gray-600 mb-1">步數</div>
                <div class="text-xl font-bold text-purple-600">{{ settlementData.steps.toLocaleString() }}</div>
                <div class="text-xs text-gray-500">步</div>
              </div>

              <!-- 卡路里 -->
              <div class="bg-orange-50 rounded-lg p-4 border border-orange-200">
                <div class="text-sm text-gray-600 mb-1">消耗</div>
                <div class="text-xl font-bold text-orange-600">{{ settlementData.calories }}</div>
                <div class="text-xs text-gray-500">卡路里</div>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="bg-gray-50 rounded-lg p-3">
                <div class="text-xs text-gray-600 mb-1">開始時間</div>
                <div class="text-sm font-semibold text-gray-900">
                  {{ new Date(settlementData.start_time).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' }) }}
                </div>
              </div>

              <div class="bg-gray-50 rounded-lg p-3">
                <div class="text-xs text-gray-600 mb-1">結束時間</div>
                <div class="text-sm font-semibold text-gray-900">
                  {{ new Date(settlementData.end_time).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' }) }}
                </div>
              </div>
            </div>
          </div>

          <!-- 關閉按鈕 -->
          <button
            @click="closeSettlement"
            class="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-all shadow-md"
          >
            完成
          </button>
        </div>
      </div>
    </div>

    <div class="w-full">
      <!-- 統計數據區塊 -->
      <div class="bg-background border-b border-gray-200">
        <!-- 標題列 -->
        <div 
          @click="toggleStats"
          class="px-4 py-4 flex items-center justify-between cursor-pointer hover:bg-white/50 transition-colors">
          <div class="flex items-center gap-2">
            <h2 class="text-lg font-bold text-gray-900">步數統計</h2>
            <span class="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">本週累計 54,000 步</span>
          </div>
          <svg 
            :class="['w-5 h-5 text-gray-400 transition-transform', isStatsExpanded ? 'rotate-180' : '']"
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        <!-- 可展開的統計內容 -->
        <transition
          enter-active-class="transition-all duration-300 ease-out"
          enter-from-class="opacity-0 max-h-0"
          enter-to-class="opacity-100 max-h-[800px]"
          leave-active-class="transition-all duration-300 ease-in"
          leave-from-class="opacity-100 max-h-[800px]"
          leave-to-class="opacity-0 max-h-0">
          <div 
            v-show="isStatsExpanded"
            class="px-4 pb-6 overflow-hidden">
          <!-- 週/月/年切換按鈕 -->
          <div class="flex gap-2 mb-6">
          <button 
            @click="selectedPeriod = 'week'"
            :class="selectedPeriod === 'week' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
            class="px-8 py-2.5 rounded-full text-sm font-medium transition-colors">
            週
          </button>
          <button 
            @click="selectedPeriod = 'month'"
            :class="selectedPeriod === 'month' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
            class="px-8 py-2.5 rounded-full text-sm font-medium transition-colors">
            月
          </button>
          <button 
            @click="selectedPeriod = 'year'"
            :class="selectedPeriod === 'year' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
            class="px-8 py-2.5 rounded-full text-sm font-medium transition-colors">
            年
          </button>
        </div>

        <!-- 長條圖 -->
        <div class="mb-6 relative" style="padding-bottom: 50px;">
          <!-- Y 軸刻度線和數值 -->
          <div class="absolute left-0 top-0 flex flex-col justify-between text-xs text-gray-500 pr-3 font-medium" style="height: 200px;">
            <span>20K</span>
            <span>15K</span>
            <span>10K</span>
            <span>5K</span>
            <span>0</span>
          </div>

          <!-- 圖表區域 -->
          <div class="ml-14">
            <!-- 水平虛線背景 -->
            <div class="relative" style="height: 200px;">
              <div class="absolute w-full border-t border-dashed border-gray-200" style="top: 0%"></div>
              <div class="absolute w-full border-t border-dashed border-gray-200" style="top: 25%"></div>
              <div class="absolute w-full border-t border-dashed border-gray-200" style="top: 50%"></div>
              <div class="absolute w-full border-t border-dashed border-gray-200" style="top: 75%"></div>
              <div class="absolute w-full border-t border-dashed border-gray-300" style="top: 100%"></div>

              <!-- 週數據 -->
              <div v-if="selectedPeriod === 'week'" class="absolute inset-0 flex items-end justify-between gap-2">
                <div class="flex-1 transition-all hover:opacity-80" style="height: 25%; background: linear-gradient(180deg, #5BA4B8 0%, #4A8A9B 100%); border-radius: 6px 6px 0 0;"></div>
                <div class="flex-1 transition-all hover:opacity-80" style="height: 45%; background: linear-gradient(180deg, #5BA4B8 0%, #4A8A9B 100%); border-radius: 6px 6px 0 0;"></div>
                <div class="flex-1 transition-all hover:opacity-80" style="height: 75%; background: linear-gradient(180deg, #5BA4B8 0%, #4A8A9B 100%); border-radius: 6px 6px 0 0;"></div>
                <div class="flex-1 transition-all hover:opacity-80" style="height: 40%; background: linear-gradient(180deg, #5BA4B8 0%, #4A8A9B 100%); border-radius: 6px 6px 0 0;"></div>
                <div class="flex-1 transition-all hover:opacity-80" style="height: 55%; background: linear-gradient(180deg, #5BA4B8 0%, #4A8A9B 100%); border-radius: 6px 6px 0 0;"></div>
                <div class="flex-1 transition-all hover:opacity-80" style="height: 30%; background: linear-gradient(180deg, #5BA4B8 0%, #4A8A9B 100%); border-radius: 6px 6px 0 0;"></div>
                <div class="flex-1 transition-all hover:opacity-80" style="height: 28%; background: linear-gradient(180deg, #5BA4B8 0%, #4A8A9B 100%); border-radius: 6px 6px 0 0;"></div>
              </div>

              <!-- 月數據 -->
              <div v-if="selectedPeriod === 'month'" class="absolute inset-0 flex items-end justify-between gap-2">
                <div class="flex-1 transition-all hover:opacity-80" style="height: 50%; background: linear-gradient(180deg, #5BA4B8 0%, #4A8A9B 100%); border-radius: 6px 6px 0 0;"></div>
                <div class="flex-1 transition-all hover:opacity-80" style="height: 65%; background: linear-gradient(180deg, #5BA4B8 0%, #4A8A9B 100%); border-radius: 6px 6px 0 0;"></div>
                <div class="flex-1 transition-all hover:opacity-80" style="height: 80%; background: linear-gradient(180deg, #5BA4B8 0%, #4A8A9B 100%); border-radius: 6px 6px 0 0;"></div>
                <div class="flex-1 transition-all hover:opacity-80" style="height: 90%; background: linear-gradient(180deg, #5BA4B8 0%, #4A8A9B 100%); border-radius: 6px 6px 0 0;"></div>
              </div>

              <!-- 年數據 -->
              <div v-if="selectedPeriod === 'year'" class="absolute inset-0 flex items-end justify-between gap-1">
                <div class="flex-1 transition-all hover:opacity-80" style="height: 35%; background: linear-gradient(180deg, #5BA4B8 0%, #4A8A9B 100%); border-radius: 4px 4px 0 0;"></div>
                <div class="flex-1 transition-all hover:opacity-80" style="height: 30%; background: linear-gradient(180deg, #5BA4B8 0%, #4A8A9B 100%); border-radius: 4px 4px 0 0;"></div>
                <div class="flex-1 transition-all hover:opacity-80" style="height: 45%; background: linear-gradient(180deg, #5BA4B8 0%, #4A8A9B 100%); border-radius: 4px 4px 0 0;"></div>
                <div class="flex-1 transition-all hover:opacity-80" style="height: 55%; background: linear-gradient(180deg, #5BA4B8 0%, #4A8A9B 100%); border-radius: 4px 4px 0 0;"></div>
                <div class="flex-1 transition-all hover:opacity-80" style="height: 65%; background: linear-gradient(180deg, #5BA4B8 0%, #4A8A9B 100%); border-radius: 4px 4px 0 0;"></div>
                <div class="flex-1 transition-all hover:opacity-80" style="height: 70%; background: linear-gradient(180deg, #5BA4B8 0%, #4A8A9B 100%); border-radius: 4px 4px 0 0;"></div>
                <div class="flex-1 transition-all hover:opacity-80" style="height: 80%; background: linear-gradient(180deg, #5BA4B8 0%, #4A8A9B 100%); border-radius: 4px 4px 0 0;"></div>
                <div class="flex-1 transition-all hover:opacity-80" style="height: 75%; background: linear-gradient(180deg, #5BA4B8 0%, #4A8A9B 100%); border-radius: 4px 4px 0 0;"></div>
                <div class="flex-1 transition-all hover:opacity-80" style="height: 85%; background: linear-gradient(180deg, #5BA4B8 0%, #4A8A9B 100%); border-radius: 4px 4px 0 0;"></div>
                <div class="flex-1 transition-all hover:opacity-80" style="height: 90%; background: linear-gradient(180deg, #5BA4B8 0%, #4A8A9B 100%); border-radius: 4px 4px 0 0;"></div>
                <div class="flex-1 transition-all hover:opacity-80" style="height: 78%; background: linear-gradient(180deg, #5BA4B8 0%, #4A8A9B 100%); border-radius: 4px 4px 0 0;"></div>
                <div class="flex-1 transition-all hover:opacity-80" style="height: 72%; background: linear-gradient(180deg, #5BA4B8 0%, #4A8A9B 100%); border-radius: 4px 4px 0 0;"></div>
              </div>

              <!-- X 軸標籤 - 週 -->
              <div v-if="selectedPeriod === 'week'" class="absolute w-full flex justify-between gap-2" style="top: 100%; margin-top: 10px;">
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
              <div v-if="selectedPeriod === 'month'" class="absolute w-full flex justify-between gap-2" style="top: 100%; margin-top: 10px;">
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
              <div v-if="selectedPeriod === 'year'" class="absolute w-full flex justify-between gap-1" style="top: 100%; margin-top: 8px;">
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
                <div class="h-9 rounded-full transition-all" 
                     style="width: 61.5%; background: linear-gradient(90deg, #FCD34D 0%, #F59E0B 100%);"></div>
              </div>
              <span class="text-base font-bold text-gray-900 w-16 text-right">5306</span>
            </div>
            <!-- 平均 -->
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium text-gray-700 w-12">平均</span>
              <div class="flex-1 mx-4">
                <div class="h-9 rounded-full transition-all" 
                     style="width: 100%; background: linear-gradient(90deg, #5BA4B8 0%, #4A8A9B 100%);"></div>
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
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          ]"
        >
          遛狗清單
        </button>
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
      </div>

      <!-- Tab Content -->
      <div class="px-4 py-6">
        <!-- 發佈紀錄 & 遛狗紀錄 -->
        <template v-if="activeTab !== 'queue'">
          <div v-if="activeTab === 'published'" class="space-y-4">
            <!-- 發布紀錄（我發布的活動，且尚未確認志工的 - status為pending） -->
            <BaseCard
              v-for="record in events.filter((e) => e.user_id === user_id && e.status === 'pending')"
              :key="record.event_id"
              class="border border-border bg-white overflow-hidden"
            >
              <div class="p-4 space-y-3">
                <!-- 狗狗基本資訊 + 右上角確認狀態 -->
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <h3 class="text-lg font-semibold text-foreground">{{ record.dog_name }}</h3>
                    <p class="text-sm text-muted-foreground">{{ record.dog_breed }}</p>
                    <p class="text-sm text-muted-foreground">
                      開始時間: {{ new Date(record.start_time).toLocaleString('zh-TW', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) }}
                    </p>
                    <p v-if="record.sitter_id" class="text-sm text-muted-foreground mt-1">
                      已接單
                    </p>
                  </div>

                  <!-- 右上角：確認狀態 -->
                  <div class="flex-shrink-0">
                    <span 
                      class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700"
                    >
                      待確認
                    </span>
                  </div>
                </div>

                <!-- 操作按鈕 -->
                <div class="flex gap-3">
                  <!-- 確認按鈕（只有在有志工接單時顯示） -->
                  <BaseButton
                    v-if="record.sitter_id"
                    class="flex-1 py-2 text-sm bg-primary text-primary-foreground"
                    @click="handleConfirmPublisher(record.event_id)"
                  >
                    確認
                  </BaseButton>
                  
                  <!-- 移除按鈕 -->
                  <BaseButton
                    class="flex-1 py-2 text-sm bg-red-500 text-white hover:bg-red-600"
                    @click="handleRemoveEvent(record.event_id)"
                  >
                    移除
                  </BaseButton>
                </div>
              </div>
            </BaseCard>

            <!-- 空狀態 -->
            <div v-if="events.filter((e) => e.user_id === user_id && e.status === 'pending').length === 0" class="text-center py-12">
              <p class="text-muted-foreground">沒有待確認的發布紀錄</p>
            </div>
          </div>

          <!-- 遛狗紀錄（已完成的遛狗 或 已確認的發布 - status為active/started/completed） -->
          <div v-else class="space-y-4">

            <!-- 空狀態 -->
            <div v-if="events.filter((e) => e.user_id === user_id && e.status === 'pending').length === 0" class="text-center py-12">
              <p class="text-muted-foreground">沒有待確認的發布紀錄</p>
            </div>
          </div>

          <!-- 遛狗紀錄（已完成的遛狗 或 已確認的發布 - status為active/started/completed） -->
          <div v-if="events.filter((e) => (e.sitter_id === user_id && e.status === 'completed') || (e.user_id === user_id && e.status !== 'pending')).length === 0" class="text-center py-12">
            <p class="text-muted-foreground">沒有遛狗紀錄</p>
          </div>
          <div v-else class="space-y-4">
            <BaseCard
              v-for="event in events.filter(
                (e) => (e.sitter_id === user_id && e.status === 'completed') || (e.user_id === user_id && e.status !== 'pending')
              )"
              :key="event.event_id"
              class="border border-border bg-white overflow-hidden"
            >
              <div class="p-4 space-y-2">
                <!-- 狗狗基本資訊 + 右上角狀態符號 + 角色標籤 -->
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <div class="flex items-center gap-2 mb-1">
                      <h3 class="text-lg font-semibold text-foreground">{{ event.dog_name }}</h3>
                      <!-- 角色標籤 -->
                      <span 
                        v-if="event.user_id === user_id"
                        class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-100 text-primary-700"
                      >
                        雇主
                      </span>
                      <span 
                        v-if="event.sitter_id === user_id"
                        class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-secondary-100 text-secondary-700"
                      >
                        志工
                      </span>
                    </div>
                    <p class="text-sm text-muted-foreground">{{ event.dog_breed }}</p>
                    <p class="text-sm text-muted-foreground">
                      {{ event.user_id === user_id ? '志工' : '飼主' }}: {{ event.user_id === user_id ? (event.sitter_id ? '已接單' : '待接單') : event.user_name }}
                    </p>
                    <p class="text-sm text-muted-foreground mt-1">
                      {{ new Date(event.start_time).toLocaleString('zh-TW', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) }}
                    </p>
                    <p v-if="event.status === 'completed'" class="text-sm text-muted-foreground">
                      時長: {{ calculateMins(event.start_time, event.end_time) }} 分鐘
                    </p>
                  </div>

                  <!-- 右上角：狀態圖標 -->
                  <div class="flex-shrink-0">
                    <svg
                      v-if="event.status === 'completed'"
                      class="w-7 h-7 text-success"
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
                      v-else-if="event.status === 'started'"
                      class="w-7 h-7 text-primary-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                        clip-rule="evenodd"
                      />
                    </svg>
                    <svg
                      v-else
                      class="w-7 h-7 text-secondary-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                        clip-rule="evenodd"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </BaseCard>
          </div>
        </template>

        <!-- 遛狗清單（我預約的活動） -->
        <template v-else-if="activeTab === 'queue'">
          <div v-if="events.filter((e) => e.sitter_id === user_id && e.status !== 'completed').length === 0" class="text-center py-12">
            <p class="text-muted-foreground">遛狗清單為空</p>
          </div>
          <div v-else class="space-y-4">
            <BaseCard
              v-for="event in events.filter(
                (e) => e.sitter_id === user_id && e.status !== 'completed'
              )"
              :key="event.event_id"
              :data-event-id="event.event_id"
              class="border border-border overflow-hidden transition-all duration-300"
              :class="event.status === 'started' ? 'bg-blue-50' : 'bg-white'"
            >
              <div class="p-4 space-y-3">
                <!-- 狗狗基本資訊 + 右上角狀態符號 -->
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <h3 class="text-lg font-semibold text-foreground">{{ event.dog_name }}</h3>
                    <p class="text-sm text-muted-foreground">{{ event.dog_breed }}</p>
                    <p class="text-sm text-muted-foreground">飼主: {{ event.user_name }}</p>
                    <p class="text-sm text-muted-foreground mt-1">
                      開始時間: {{ new Date(event.start_time).toLocaleString('zh-TW', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) }}
                    </p>
                    <p v-if="event.status === 'pending'" class="text-sm text-yellow-600 mt-1">
                      等待雇主確認
                    </p>
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
                    <span 
                      v-else-if="event.status === 'active'"
                      class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700"
                    >
                      ✓ 已確認
                    </span>
                    <span 
                      v-else-if="event.status === 'pending'"
                      class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700"
                    >
                      待確認
                    </span>
                  </div>
                </div>

                <!-- 操作按鈕 -->
                <div class="flex gap-3">
                  <!-- 還沒開始遛狗 -->
                  <BaseButton
                    v-if="event.status !== 'started'"
                    :disabled="event.status === 'pending'"
                    class="flex-1 py-2 text-sm bg-primary text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                    @click="handleStartWalking(event.event_id)"
                  >
                    {{ event.status === 'active' ? '開始遛狗' : '等待雇主確認' }}
                  </BaseButton>
                  
                  <!-- 正在遛狗中 -->
                  <BaseButton
                    v-else
                    class="flex-1 py-2 text-sm bg-red-500 text-white hover:bg-red-600"
                    @click="handleStopWalking(event.event_id)"
                  >
                    完成遛狗
                  </BaseButton>
                </div>
              </div>
            </BaseCard>
          </div>
        </template>
      </div>
    </div>

    <BottomNav />
  </div>
</template>
