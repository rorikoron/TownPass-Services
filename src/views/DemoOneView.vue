<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useDogWalkingStore } from '@/stores/dogWalking';
import BaseCard from '@/components/atoms/BaseCard.vue';
import BaseButton from '@/components/atoms/BaseButton.vue';
import BaseInput from '@/components/atoms/BaseInput.vue';
import BaseLabel from '@/components/atoms/BaseLabel.vue';
import BaseSelect from '@/components/atoms/BaseSelect.vue';
import PageHeader from '@/components/molecules/PageHeader.vue';
import BottomNav from '@/components/molecules/BottomNav.vue';
import { supabase } from '@/lib/supabaseClient';
import { useConnectionMessage } from '@/composables/useConnectionMessage';
import { useHandleConnectionData } from '@/composables/useHandleConnectionData';

const store = useDogWalkingStore();
interface userinfoConfig {
  data: {
    realName: string;
    id: string;
  };
}
const handleConnectionData = (event: { data: string }) => {
  const parsed = JSON.parse(event.data);
  console.log('Received data from connection:', event.data?.parsed);
  user_name.value = parsed.data?.realName;
  user_id.value = parsed.data?.data?.id;
};

useHandleConnectionData(handleConnectionData);
onMounted(async () => {
  useConnectionMessage('userinfo', null);
  await geoFindMe();
});
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

const gpsStatus = ref('');
const isGettingLocation = ref(false);
const currentLat = ref<number | null>(null);
const currentLng = ref<number | null>(null);

function geoFindMe() {
  if (!('geolocation' in navigator)) {
    gpsStatus.value = '你的瀏覽器不支援定位功能';
    alert(gpsStatus.value);
    return;
  }

  isGettingLocation.value = true;
  gpsStatus.value = '定位中...';

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude, longitude, accuracy } = pos.coords;
      currentLat.value = latitude;
      currentLng.value = longitude;

      gpsStatus.value = `定位成功（誤差約 ${Math.round(accuracy)}m）`;
      ownerLocation.value = `緯度: ${latitude.toFixed(6)}, 經度: ${longitude.toFixed(6)}`;

      console.log('GPS 定位成功:', {
        latitude,
        longitude,
        accuracy: `${Math.round(accuracy)}m`
      });

      isGettingLocation.value = false;
    },
    (err) => {
      let errorMessage = '';

      switch (err.code) {
        case err.PERMISSION_DENIED:
          errorMessage =
            '你拒絕授權定位（或瀏覽器設定禁止）\n\n請檢查：\n1. Arc 瀏覽器網址列左側是否允許定位\n2. macOS 系統設定 → 隱私權與安全性 → 定位服務 → Arc';
          break;
        case err.POSITION_UNAVAILABLE:
          errorMessage = '無法取得位置（可能室內訊號不好）\n建議：移到窗邊或戶外再試';
          break;
        case err.TIMEOUT:
          errorMessage = '取得位置逾時\n建議：重新整理頁面再試一次';
          break;
        default:
          errorMessage = `定位失敗（錯誤代碼: ${err.code}）`;
      }

      gpsStatus.value = errorMessage;
      alert(errorMessage);

      console.error('GPS 定位失敗:', {
        code: err.code,
        message: err.message,
        錯誤說明: errorMessage
      });

      isGettingLocation.value = false;
    },
    {
      enableHighAccuracy: true, // 使用高精確度（GPS）
      timeout: 10000, // 10 秒超時
      maximumAge: 0 // 不使用快取位置
    }
  );
}

const user_id = ref('7f3562f4-bb3f-4ec7-89b9-da3b4b5ff250');
const user_name = ref('testuser');
const form = ref({
  id: user_id.value,
  username: user_name.value,
  latitude: currentLat.value,
  longitude: currentLng.value,
  dogName: '',
  dogBreed: '',
  activities: new Set<string>([]),
  startTime: '',
  endTime: '',
  dogPreferences: ''
});

const getUseCaseLabel = (value: string) => {
  return USE_CASES.find((uc) => uc.value === value)?.label || value;
};

const addDog = async () => {
  if (!form.value.dogName || !form.value.dogBreed || !form.value.startTime || !form.value.endTime) {
    alert('請填寫所有必填欄位');
    return;
  }

  await supabase
    .from('event')
    .insert([
      {
        user_id: form.value.id,
        user_name: form.value.username,
        dog_name: form.value.dogName,
        dog_breed: form.value.dogBreed,
        activity_type: Array.from(form.value.activities).join(','),
        start_time: form.value.startTime,
        end_time: form.value.endTime,
        preference: form.value.dogPreferences,
        latitude: form.value.latitude,
        longitude: form.value.longitude
      }
    ])
    .then(({ data, error }) => {
      if (error) {
        console.error('Error inserting dog info:', error);
        alert('新增狗狗資訊時發生錯誤，請稍後再試。');
      } else {
        console.log('Dog info added:', data);
        alert('狗狗資訊新增成功！');
      }
    });
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
          <div class="space-x-4">
            <BaseLabel class="text-foreground">狗狗名字 *</BaseLabel>
            <BaseInput
              required
              v-model="form.dogName"
              type="text"
              placeholder="輸入狗狗名字"
              class="mt-2 bg-muted border-border"
            />
          </div>

          <!-- 飼主地點 -->
          <!-- <div class="space-x-4">
            <BaseLabel class="text-foreground">飼主地點 *</BaseLabel>
            <BaseInput
              v-model="ownerLocation"
              type="text"
              placeholder="輸入飼主地點"
              class="mt-2 bg-muted border-border"
            />
          </div> -->

          <!-- 狗狗品種 -->
          <div>
            <BaseLabel class="text-foreground">狗狗品種 *</BaseLabel>
            <BaseSelect
              required
              select-id="dogBreed"
              v-model="form.dogBreed"
              :options="DOG_BREEDS"
              default-selected="選擇品種"
              custom-class="mt-2 bg-muted border-border"
            />
          </div>

          <div>
            <BaseLabel class="text-foreground">當前位置 *</BaseLabel>
            <BaseInput
              disabled
              v-model="ownerLocation"
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
                  @change="
                    (e) =>
                      e
                        ? form.activities.add(activity.value)
                        : form.activities.delete(activity.value)
                  "
                  class="h-5 w-5 rounded border-gray-300 text-primary focus:ring-2 focus:ring-primary"
                />
                <span class="font-normal">{{ activity.label }}</span>
              </label>
            </div>
          </div>

          <!-- 起始時間（當選擇"設定起訖時間"時顯示） -->
          <div class="space-x-4">
            <BaseLabel class="text-foreground">起始時間 *</BaseLabel>
            <BaseInput
              required
              v-model="form.startTime"
              type="datetime-local"
              placeholder="年 / 月 / 日 ----:--"
              class="mt-2 bg-muted border-border"
            />
          </div>

          <!-- 結束時間（當選擇"設定起訖時間"時顯示） -->
          <div class="space-x-4">
            <BaseLabel class="text-foreground">結束時間 *</BaseLabel>
            <BaseInput
              required
              v-model="form.endTime"
              type="datetime-local"
              placeholder="年 / 月 / 日 ----:--"
              class="mt-2 bg-muted border-border"
            />
          </div>

          <div class="space-x-4">
            <BaseLabel class="text-foreground">備註</BaseLabel>
            <BaseInput
              v-model="form.dogPreferences"
              type="textarea"
              placeholder="輸入狗狗備注"
              class="mt-2 bg-muted border-border"
            />
          </div>

          <!-- 新增狗狗按鈕 -->
          <BaseButton
            @click="addDog"
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
        <BaseCard v-for="dog in store.dogs" :key="dog.id" class="p-4 bg-muted border border-border">
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
    </div>

    <BottomNav />
  </div>
</template>

<style scoped>
/* 自定義 checkbox 和 radio 樣式 */
input[type='checkbox'],
input[type='radio'] {
  appearance: none;
  -webkit-appearance: none;
  display: inline-block;
  position: relative;
  cursor: pointer;
  flex-shrink: 0;
}

input[type='checkbox']::before,
input[type='radio']::before {
  content: '';
  display: block;
  width: 100%;
  height: 100%;
  border: 2px solid #d1d5db;
  background-color: white;
}

input[type='checkbox']::before {
  border-radius: 4px;
}

input[type='radio']::before {
  border-radius: 50%;
}

input[type='checkbox']:checked::before,
input[type='radio']:checked::before {
  background-color: #9c27b0;
  border-color: #9c27b0;
}

input[type='checkbox']:checked::after {
  content: '✓';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 14px;
  font-weight: bold;
}

input[type='radio']:checked::after {
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
