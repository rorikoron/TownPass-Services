<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue';
import { useGoogleMapsStore } from '@/stores/googleMaps';
import { MarkerClusterer, SuperClusterAlgorithm } from '@googlemaps/markerclusterer';
import BaseCard from '@/components/atoms/BaseCard.vue';
import BaseButton from '@/components/atoms/BaseButton.vue';
import BottomNav from '@/components/molecules/BottomNav.vue';
import { supabase } from '@/lib/supabaseClient';

const googleMapsStore = useGoogleMapsStore();

let map: google.maps.Map | null = null;
let selfMarker: google.maps.Marker | null = null;
let markers: google.maps.Marker[] = [];
let markerCluster: MarkerClusterer | null = null;
let mapDragendListener: google.maps.MapsEventListener | null = null;
let mapZoomListener: google.maps.MapsEventListener | null = null;
let infoWindow: google.maps.InfoWindow | null = null;

const isMapReady = ref(false);
const parks = ref<any[]>([]);
const events = ref<any[]>([]);
const selectedEventId = ref<string | null>(null);
const isRefreshing = ref(false);

/** 目前位置（預設信義區） */
const currentLocation = ref<{ lat: number; lng: number }>({
  lat: 25.0325917,
  lng: 121.5624999
});

/** --------- Utils --------- */

/** 設定地圖高度 */
const setMapHeight = () => {
  const el = document.getElementById('map');
  if (el) el.style.height = `${window.innerHeight - 88}px`;
};

/** --------- 地圖初始化 --------- */

/** 從 Supabase 抓取活動資料（包含關聯的 park 經緯度）並計算距離 */
async function fetchEvents() {
  const { data: eventsData, error } = await supabase
    .from('event')
    .select('*')
    .eq('status', 'active');
  
  if (error) {
    console.error('Error fetching events:', error);
    return;
  }
  
  if (!eventsData || eventsData.length === 0) {
    events.value = [];
    return;
  }
  
  // 抓取所有相關的 park 資料
  const parkIds = eventsData.map(e => e.park_id).filter(Boolean);
  const { data: parksData, error: parksError } = await supabase
    .from('park')
    .select('*')
    .in('park_id', parkIds);
  
  if (parksError) {
    console.error('Error fetching parks:', parksError);
    return;
  }
  
  // 建立 park_id 到 park 的對應
  const parkMap = new Map(parksData?.map(p => [p.park_id, p]) || []);
  
  // 合併 event 和 park 資料
  const data = eventsData.map(event => ({
    ...event,
    park: parkMap.get(event.park_id)
  }));

  // 計算每個活動與目前位置的距離
  const eventsWithDistance = data
    .map((event) => {
      const park = event.park as any;
      if (!park || !park.latitude || !park.longitude) return null;
      
      const eventLatLng = new google.maps.LatLng(park.latitude, park.longitude);
      const currentLatLng = new google.maps.LatLng(
        currentLocation.value.lat,
        currentLocation.value.lng
      );
      const distance = kmDistance(eventLatLng, currentLatLng);
      
      return {
        ...event,
        latitude: park.latitude,
        longitude: park.longitude,
        park_name: park.name,
        district: park.district,
        distance
      };
    })
    .filter((event): event is NonNullable<typeof event> => event !== null)
    // 依距離排序
    .sort((a, b) => a.distance - b.distance);
  
  events.value = eventsWithDistance;
}

/** 從 Supabase 抓取景點資料並計算距離 */
async function fetchParks() {
  const { data, error } = await supabase
    .from('park')
    .select('*');
  
  if (error) {
    console.error('Error fetching parks:', error);
    return;
  }
  
  if (!data || data.length === 0) {
    parks.value = [];
    return;
  }

  // 計算每個景點與目前位置的距離
  const parksWithDistance = data
    .map((park) => {
      if (!park.latitude || !park.longitude) return null;
      
      const parkLatLng = new google.maps.LatLng(park.latitude, park.longitude);
      const currentLatLng = new google.maps.LatLng(
        currentLocation.value.lat,
        currentLocation.value.lng
      );
      const distance = kmDistance(parkLatLng, currentLatLng);
      
      return {
        ...park,
        distance
      };
    })
    .filter((park): park is NonNullable<typeof park> => park !== null)
    // 只顯示 5 公里內的景點
    .filter((park) => park.distance <= 5)
    // 依距離排序
    .sort((a, b) => a.distance - b.distance);
  
  parks.value = parksWithDistance;
}



onMounted(async () => {
  await googleMapsStore.loader.load();

  // 確保載入 maps 與 geometry（用來算距離）
  const { Map } = (await google.maps.importLibrary('maps')) as google.maps.MapsLibrary;
  await google.maps.importLibrary('geometry');

  map = new Map(document.getElementById('map') as HTMLElement, {
    center: { lat: currentLocation.value.lat, lng: currentLocation.value.lng },
    zoom: 14,
    maxZoom: 20,
    minZoom: 3,
    streetViewControl: false,
    mapTypeControl: false,
    fullscreenControl: false,
    zoomControl: false,
    mapId: '' // 可填你的 MapID
  });

  // 自己的位置（藍點）
  selfMarker = new google.maps.Marker({
    position: { lat: currentLocation.value.lat, lng: currentLocation.value.lng },
    map,
    title: '你的目前位置',
    icon: {
      path: google.maps.SymbolPath.CIRCLE,
      fillColor: '#4285F4',
      fillOpacity: 1,
      scale: 8,
      strokeColor: 'white',
      strokeWeight: 2
    }
  });

  // 取得瀏覽器定位（若允許）
  try {
    const pos = await googleMapsStore.gettingPosition();
    currentLocation.value.lat = (pos as GeolocationPosition).coords.latitude;
    currentLocation.value.lng = (pos as GeolocationPosition).coords.longitude;
    selfMarker.setPosition(new google.maps.LatLng(currentLocation.value.lat, currentLocation.value.lng));
    map.setCenter(selfMarker.getPosition()!);
  } catch {
    // 使用預設位置即可
  }

  // 抓取活動和景點資料（在 Google Maps 載入完成後）
  await Promise.all([fetchEvents(), fetchParks()]);

  // 地圖互動監聽
  mapDragendListener = map.addListener('dragend', updateMarkers);
  mapZoomListener = map.addListener('zoom_changed', updateMarkers);

  isMapReady.value = true;
  setMapHeight();
  window.addEventListener('resize', setMapHeight);

  // 首次繪製
  updateMarkers();
});

onUnmounted(() => {
  window.removeEventListener('resize', setMapHeight);
  if (map && mapDragendListener) mapDragendListener.remove();
  if (map && mapZoomListener) mapZoomListener.remove();
  clearMarkers();
  markerCluster?.clearMarkers();
});

/** --------- 標記重繪/群聚 --------- */

function clearMarkers() {
  markers.forEach((m) => m.setMap(null));
  markers = [];
  if (markerCluster) markerCluster.clearMarkers();
  infoWindow?.close();
}

function kmDistance(a: google.maps.LatLng, b: google.maps.LatLng) {
  const d = google.maps.geometry.spherical.computeDistanceBetween(a, b); // meters
  return Math.round((d / 1000) * 10) / 10; // 1 decimal
}

function updateMarkers() {
  if (!map) return;

  const bounds = map.getBounds();
  if (!bounds) return;

  // 清除舊標記
  clearMarkers();

  // 準備共用 InfoWindow
  infoWindow = new google.maps.InfoWindow();

  // 在地圖上顯示活動標記
  for (const event of events.value) {
    if (!event.latitude || !event.longitude) continue;
    
    // 檢查活動是否在地圖視窗內
    const eventLatLng = new google.maps.LatLng(event.latitude, event.longitude);
    if (!bounds.contains(eventLatLng)) continue;

    const marker = new google.maps.Marker({
      position: { lat: event.latitude, lng: event.longitude },
      map,
      // 綠色小點
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: '#2EB6C7',
        fillOpacity: 1,
        scale: 6,
        strokeColor: '#fff',
        strokeWeight: 2
      },
      title: event.title || '未命名活動'
    });

    marker.addListener('click', () => {
      // 生成活動圖片（使用 event_id 來確保每個活動有固定的圖片）
      const avatar = event.image_url || event.image || `https://api.dicebear.com/7.x/thumbs/svg?seed=${encodeURIComponent(event.title || 'event-' + event.event_id)}`;
      
      // 建立標籤陣列（地點、類型等）
      const tags = [];
      if (event.park_name) tags.push(event.park_name);
      if (event.activity_type) tags.push(event.activity_type);
      if (event.breed_prefer) tags.push(event.breed_prefer);

      const html = `
        <div style="display:flex;gap:12px;align-items:center;max-width:280px">
          <img src="${avatar}" alt="${event.title}" width="56" height="56" style="border-radius:50%;" />
          <div style="flex:1;">
            <div style="font-weight:700;font-size:16px;margin-bottom:4px">${event.title || '未命名活動'}</div>
            <div style="color:#666;font-size:13px;margin-bottom:6px">${event.description || event.park_name || '歡迎參加遛狗活動'}</div>
            <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:4px">
              ${tags.map((tag) => `<span style="font-size:12px;border:1px solid #2EB6C7;color:#2EB6C7;border-radius:999px;padding:2px 8px">${tag}</span>`).join('')}
            </div>
            <div style="margin-top:8px;color:#777;font-size:12px">距離你約 ${event.distance} 公里</div>
          </div>
        </div>
      `;
      infoWindow!.setContent(html);
      infoWindow!.open({ anchor: marker, map });
    });

    markers.push(marker);
  }

  // 標記群聚
  markerCluster = new MarkerClusterer({
    markers,
    map,
    algorithm: new SuperClusterAlgorithm({ radius: 300 }),
    renderer: {
      render({ count, position }, stats) {
        const circleRadius =
          count > Math.max(10, stats.clusters.markers.mean)
            ? count > Math.max(100, stats.clusters.markers.mean)
              ? 100
              : 90
            : 80;
        const svg = window.btoa(
          `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" width="60" height="60">
            <circle fill="#2eb6c7" cx="120" cy="120" opacity=".6" r="${circleRadius}" />
            <circle fill="#fff" cx="120" cy="120" r="70" />
            <text x="50%" y="50%" fill="#2eb6c7" text-anchor="middle" font-size="50" dominant-baseline="middle" font-family="roboto,arial,sans-serif">${count}</text>
          </svg>`
        );
        return new google.maps.Marker({
          position,
          icon: { url: `data:image/svg+xml;base64,${svg}`, scaledSize: new google.maps.Size(75, 75) },
          zIndex: Number(google.maps.Marker.MAX_ZINDEX) + count
        });
      }
    }
  });
}

/** 重新定位按鈕 */
const recenter = async () => {
  try {
    const pos = await googleMapsStore.gettingPosition();
    currentLocation.value.lat = (pos as GeolocationPosition).coords.latitude;
    currentLocation.value.lng = (pos as GeolocationPosition).coords.longitude;
    selfMarker?.setPosition(new google.maps.LatLng(currentLocation.value.lat, currentLocation.value.lng));
    map?.setCenter(selfMarker!.getPosition()!);
    updateMarkers();
    // 重新計算活動和景點距離
    await Promise.all([fetchEvents(), fetchParks()]);
  } catch {
    // ignore
  }
};

// 如果活動資料有改動，自動重繪地圖標記
watch(events, updateMarkers);

/** 預約活動 */
const bookEvent = (event: any) => {
  alert(`預約 ${event.title || '活動'}`);
};

/** 重新抓取資料 */
const refreshData = async () => {
  isRefreshing.value = true;
  try {
    await Promise.all([fetchEvents(), fetchParks()]);
    console.log('資料已重新載入');
  } catch (error) {
    console.error('重新載入資料時發生錯誤:', error);
  } finally {
    isRefreshing.value = false;
  }
};
</script>

<template>
  <div class="pb-8 h-screen relative">
    <div class="google-map" id="map"></div>

    <!-- 右上角按鈕群組 -->
    <div v-if="isMapReady" class="absolute top-4 right-4 flex flex-col gap-2">
      <!-- 重新整理按鈕 -->
      <button 
        @click="refreshData" 
        :disabled="isRefreshing"
        :class="['bg-white rounded-lg shadow-md p-2.5 hover:bg-gray-50 transition-colors', isRefreshing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer']"
        title="重新載入資料"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="18" 
          height="18" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          stroke-width="2" 
          stroke-linecap="round" 
          stroke-linejoin="round"
          :class="isRefreshing ? 'animate-spin' : ''"
        >
          <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
        </svg>
      </button>
      
      <!-- GPS 重新定位 -->
      <button 
        @click="recenter" 
        class="bg-white rounded-lg shadow-md p-2.5 hover:bg-gray-50 transition-colors cursor-pointer"
        title="回到我的位置"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 -960 960 960">
          <path d="M480-160q-134 0-227-93t-93-227q0-134 93-227t227-93q134 0 227 93t93 227q0 134-93 227t-227 93Zm0-80q100 0 170-70t70-170q0-100-70-170t-170-70q-100 0-170 70t-70 170q0 100 70 170t170 70Z"/>
        </svg>
      </button>
    </div>
  </div>

  <!-- 活動列表 -->
  <div class="px-4 py-6 space-y-3 bg-background">
    <h3 class="font-semibold text-foreground">附近的遛狗活動</h3>
    
    <!-- 從 Supabase 抓取的活動 -->
    <template v-if="events.length > 0">
      <BaseCard 
        v-for="event in events" 
        :key="event.event_id" 
        class="border border-border cursor-pointer transition-all"
        :class="{ 'ring-2 ring-primary': selectedEventId === event.event_id }"
        @click="selectedEventId = selectedEventId === event.event_id ? null : event.event_id"
      >
        <!-- 基本資訊 -->
        <div class="flex items-start gap-3">
          <!-- 活動頭像 -->
          <img 
            :src="event.image_url || event.image || `https://api.dicebear.com/7.x/thumbs/svg?seed=${encodeURIComponent(event.title || 'event-' + event.event_id)}`"
            :alt="event.title"
            class="w-14 h-14 rounded-full object-cover flex-shrink-0"
          />
          
          <!-- 活動資訊 -->
          <div class="flex-1 min-w-0">
            <div class="flex items-start justify-between gap-2">
              <h4 class="font-semibold text-foreground">{{ event.title || '未命名活動' }}</h4>
              <span class="text-sm font-semibold text-primary whitespace-nowrap flex items-center gap-1">
                <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
                {{ event.distance }} km
              </span>
            </div>
            
            <p class="text-sm text-muted-foreground mt-1 line-clamp-2">
              {{ event.description || event.park_name || '歡迎參加遛狗活動' }}
            </p>
            
            <!-- 標籤 -->
            <div class="flex gap-2 flex-wrap mt-2">
              <span v-if="event.park_name" class="text-xs border border-primary text-primary rounded-full px-2 py-0.5">
                {{ event.park_name }}
              </span>
              <span v-if="event.activity_type" class="text-xs border border-primary text-primary rounded-full px-2 py-0.5">
                {{ event.activity_type }}
              </span>
              <span v-if="event.breed_prefer" class="text-xs border border-primary text-primary rounded-full px-2 py-0.5">
                {{ event.breed_prefer }}
              </span>
            </div>
          </div>
        </div>

        <!-- 展開的詳細資訊 -->
        <div v-if="selectedEventId === event.event_id" class="mt-4 pt-4 border-t border-border space-y-3">
          <div v-if="event.park_name" class="flex items-start gap-2">
            <span class="text-base">📍</span>
            <div class="flex-1">
              <p class="text-sm font-medium text-foreground">地點</p>
              <p class="text-sm text-muted-foreground">{{ event.park_name }}{{ event.district ? ` (${event.district})` : '' }}</p>
            </div>
          </div>

          <div v-if="event.start_time" class="flex items-start gap-2">
            <span class="text-base">🕐</span>
            <div class="flex-1">
              <p class="text-sm font-medium text-foreground">開始時間</p>
              <p class="text-sm text-muted-foreground">{{ new Date(event.start_time).toLocaleString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) }}</p>
            </div>
          </div>

          <div v-if="event.end_time" class="flex items-start gap-2">
            <span class="text-base">⏰</span>
            <div class="flex-1">
              <p class="text-sm font-medium text-foreground">結束時間</p>
              <p class="text-sm text-muted-foreground">{{ new Date(event.end_time).toLocaleString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) }}</p>
            </div>
          </div>

          <div v-if="event.description" class="flex items-start gap-2">
            <span class="text-base">📝</span>
            <div class="flex-1">
              <p class="text-sm font-medium text-foreground">活動說明</p>
              <p class="text-sm text-muted-foreground leading-relaxed">{{ event.description }}</p>
            </div>
          </div>

          <!-- 預約按鈕 -->
          <div class="pt-2">
            <BaseButton class="w-full" variant="primary" @click.stop="bookEvent(event)">
              預約 {{ event.title || '活動' }}
            </BaseButton>
          </div>
        </div>
      </BaseCard>
    </template>

    <!-- 如果沒有資料，顯示提示訊息 -->
    <BaseCard v-else class="border border-border">
      <p class="text-center text-muted-foreground py-4">
        目前沒有找到活動
      </p>
    </BaseCard>
  </div>

  <!-- 景點推薦 -->
  <div class="px-4 py-6 space-y-3 bg-background pb-24">
    <h3 class="font-semibold text-foreground">推薦寵物友善景點</h3>
    
    <!-- 從 Supabase 抓取的景點 -->
    <template v-if="parks.length > 0">
      <BaseCard v-for="park in parks" :key="park.park_id" class="border border-border">
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <p class="font-medium text-foreground">{{ park.name }}</p>
            <p class="text-sm text-muted-foreground mt-1">
              <span v-if="park.district">{{ park.district }}</span>
            </p>
            <p v-if="park.description" class="text-xs text-muted-foreground mt-2">{{ park.description }}</p>
          </div>
          <div class="flex items-center gap-1 ml-3">
            <svg class="w-4 h-4 text-primary" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
            <span class="text-sm font-semibold text-primary whitespace-nowrap">{{ park.distance }} km</span>
          </div>
        </div>
      </BaseCard>
    </template>

    <!-- 如果沒有資料，顯示提示訊息 -->
    <BaseCard v-else class="border border-border">
      <p class="text-center text-muted-foreground py-4">
        附近 5 公里內沒有找到景點
      </p>
    </BaseCard>
  </div>

  <BottomNav />
</template>

<style scoped lang="postcss">
.google-map {
  width: 100%;
  height: 400px;
}

/* 底部浮動條 */
.floating-box {
  @apply absolute flex items-center justify-between bg-white px-4 py-4 rounded-xl;
  bottom: 0;
  box-shadow: rgba(0, 0, 0, 0.04) 0px -4px 10px;
}

/* 小圓角標籤 */
.pill {
  @apply text-primary-500 border border-primary-500 rounded-full px-2 text-sm;
}
</style>
