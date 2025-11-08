<script setup lang="ts">
import { ref, computed } from 'vue';
import BaseCard from '@/components/atoms/BaseCard.vue';
import PageHeader from '@/components/molecules/PageHeader.vue';
import BottomNav from '@/components/molecules/BottomNav.vue';
import { Calendar, CheckCircle, Clock } from 'lucide-vue-next';

interface Record {
  id: string;
  dogName: string;
  date: string;
  duration: string;
  status: 'completed' | 'ongoing' | 'cancelled';
  type: 'published' | 'walked';
}

const HISTORY_RECORDS: Record[] = [
  { id: '1', dogName: '小Q', date: '2025-01-08', duration: '45 分鐘', status: 'completed', type: 'published' },
  { id: '2', dogName: '旺財', date: '2025-01-07', duration: '1 小時', status: 'completed', type: 'walked' },
  { id: '3', dogName: '小白', date: '2025-01-06', duration: '30 分鐘', status: 'ongoing', type: 'published' }
];

const activeTab = ref<'published' | 'walked'>('published');

const filteredRecords = computed(() => {
  return HISTORY_RECORDS.filter((record) => record.type === activeTab.value);
});

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
</script>

<template>
  <div class="min-h-screen bg-background pb-24">
    <PageHeader title="遛狗紀錄" :step="4" />

    <div class="w-full">
      <!-- Tabs Header -->
      <div class="w-full grid grid-cols-2 gap-0 border-b border-border bg-background px-4">
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
      <div class="px-4 py-6 space-y-3">
        <BaseCard
          v-for="record in filteredRecords"
          :key="record.id"
          class="border border-border"
        >
          <div class="flex items-start gap-4">
            <div class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span class="text-lg">🐕</span>
            </div>
            <div class="flex-1">
              <div class="flex items-center justify-between mb-2">
                <h4 class="font-semibold text-foreground">{{ record.dogName }}</h4>
                <div class="flex items-center gap-1">
                  <CheckCircle
                    v-if="record.status === 'completed'"
                    class="w-5 h-5 text-green-600"
                  />
                  <Clock
                    v-else-if="record.status === 'ongoing'"
                    class="w-5 h-5 text-blue-600"
                  />
                  <Clock v-else class="w-5 h-5 text-gray-400" />
                  <span class="text-xs text-muted-foreground">{{ getStatusLabel(record.status) }}</span>
                </div>
              </div>
              <div class="space-y-1">
                <p class="text-sm text-muted-foreground flex items-center gap-2">
                  <Calendar class="w-4 h-4" />
                  {{ record.date }}
                </p>
                <p class="text-sm text-muted-foreground">時長: {{ record.duration }}</p>
              </div>
            </div>
          </div>
        </BaseCard>

        <div v-if="filteredRecords.length === 0" class="text-center py-12">
          <p class="text-muted-foreground">沒有紀錄</p>
        </div>
      </div>
    </div>

    <BottomNav />
  </div>
</template>
