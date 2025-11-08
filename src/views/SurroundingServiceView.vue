<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue';
import { useGoogleMapsStore } from '@/stores/googleMaps';
import { MarkerClusterer, SuperClusterAlgorithm } from '@googlemaps/markerclusterer';

/** 使用者模型 */
interface User {
  id: string;
  name: string;
  age: number;
  avatar: string;
  bio: string;
  interests: string[];
  lat: number;
  lng: number;
  distance?: number; // 與目前位置距離(公里)
}

const googleMapsStore = useGoogleMapsStore();

let map: google.maps.Map | null = null;
let selfMarker: google.maps.Marker | null = null;
let markers: google.maps.Marker[] = [];
let markerCluster: MarkerClusterer | null = null;
let mapDragendListener: google.maps.MapsEventListener | null = null;
let mapZoomListener: google.maps.MapsEventListener | null = null;
let infoWindow: google.maps.InfoWindow | null = null;

const isMapReady = ref(false);
const allUsers = ref<User[]>([]);
const filteredUsers = ref<User[]>([]);
const selectedUser = ref<User | null>(null);

/** 目前位置（預設信義區） */
const currentLocation = ref<{ lat: number; lng: number }>({
  lat: 25.0325917,
  lng: 121.5624999
});

/** --------- Utils --------- */

/** 產生介於 [min, max] 的亂數 */
const rand = (min: number, max: number) => Math.random() * (max - min) + min;

/** 在中心附近隨機產生 N 個使用者 */
function generateMockUsers(center: { lat: number; lng: number }, n = 30): User[] {
  const names = ['Iris', 'Leo', 'Mia', 'Ethan', 'Olivia', 'Noah', 'Emily', 'Liam', 'Ava', 'Lucas', 'Chloe', 'Mason'];
  const bios = [
    '喜歡跑步與手沖咖啡的前端工程師',
    '登山攝影與街頭美食愛好者',
    '正在準備半馬的資料分析師',
    '重訓新手，也愛桌遊',
    '咖啡館巡禮與拍照控',
    '熱愛羽球與露營的 PM'
  ];
  const interestsPool = ['跑步', '瑜伽', '羽球', '單車', '登山', '游泳', '重訓', '路跑', '籃球', '桌球'];

  const users: User[] = [];
  for (let i = 0; i < n; i++) {
    // 大約在中心點方圓 ~1km 內（經緯度微調）
    const latOffset = rand(-0.01, 0.01);
    const lngOffset = rand(-0.01, 0.01);

    const name = names[Math.floor(rand(0, names.length))];
    const bio = bios[Math.floor(rand(0, bios.length))];
    const age = Math.floor(rand(18, 40));
    const interests = interestsPool.sort(() => 0.5 - Math.random()).slice(0, 3);
    const avatar = `https://api.dicebear.com/7.x/thumbs/svg?seed=${encodeURIComponent(name + '-' + i)}`;

    users.push({
      id: `u_${Date.now()}_${i}`,
      name,
      age,
      avatar,
      bio,
      interests,
      lat: center.lat + latOffset,
      lng: center.lng + lngOffset
    });
  }
  return users;
}

/** 設定地圖高度 */
const setMapHeight = () => {
  const el = document.getElementById('map');
  if (el) el.style.height = `${window.innerHeight - 88}px`;
};

/** --------- 地圖初始化 --------- */

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
    currentLocation.value.lat = pos.coords.latitude;
    currentLocation.value.lng = pos.coords.longitude;
    selfMarker.setPosition(new google.maps.LatLng(currentLocation.value.lat, currentLocation.value.lng));
    map.setCenter(selfMarker.getPosition()!);
  } catch {
    // 使用預設位置即可
  }

  // 生成附近使用者
  allUsers.value = generateMockUsers(currentLocation.value, 36);

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
  selectedUser.value = null;
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

  // 篩出在視窗內的使用者，並計算距離
  filteredUsers.value = allUsers.value
    .map((u) => ({
      ...u,
      distance: kmDistance(
        new google.maps.LatLng(currentLocation.value.lat, currentLocation.value.lng),
        new google.maps.LatLng(u.lat, u.lng)
      )
    }))
    .filter((u) => bounds.contains(new google.maps.LatLng(u.lat, u.lng)))
    // 依距離排序
    .sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));

  // 清除舊標記
  clearMarkers();

  // 準備共用 InfoWindow
  infoWindow = new google.maps.InfoWindow();

  // 建立新標記
  for (const u of filteredUsers.value) {
    const marker = new google.maps.Marker({
      position: { lat: u.lat, lng: u.lng },
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
      title: u.name
    });

    marker.addListener('click', () => {
      selectedUser.value = u;

      const html = `
        <div style="display:flex;gap:12px;align-items:center;max-width:280px">
          <img src="${u.avatar}" alt="${u.name}" width="56" height="56" style="border-radius:50%;" />
          <div style="flex:1;">
            <div style="font-weight:700;font-size:16px;margin-bottom:4px">${u.name}・${u.age}</div>
            <div style="color:#666;font-size:13px;margin-bottom:6px">${u.bio}</div>
            <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:4px">
              ${u.interests.map((tag) => `<span style="font-size:12px;border:1px solid #2EB6C7;color:#2EB6C7;border-radius:999px;padding:2px 8px">${tag}</span>`).join('')}
            </div>
            <div style="margin-top:8px;color:#777;font-size:12px">距離你約 ${u.distance} 公里</div>
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
    currentLocation.value.lat = pos.coords.latitude;
    currentLocation.value.lng = pos.coords.longitude;
    selfMarker?.setPosition(new google.maps.LatLng(currentLocation.value.lat, currentLocation.value.lng));
    map?.setCenter(selfMarker!.getPosition()!);
    updateMarkers();
  } catch {
    // ignore
  }
};

// 如果未來有改動 allUsers，可自動重繪
watch(allUsers, updateMarkers);
</script>

<template>
  <div class="pb-8 h-screen relative">
    <div class="google-map" id="map"></div>

    <!-- 右上角 GPS 重新定位 -->
    <div v-if="isMapReady" class="gps" @click="recenter" title="回到我的位置">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 -960 960 960">
        <path d="M480-160q-134 0-227-93t-93-227q0-134 93-227t227-93q134 0 227 93t93 227q0 134-93 227t-227 93Zm0-80q100 0 170-70t70-170q0-100-70-170t-170-70q-100 0-170 70t-70 170q0 100 70 170t170 70Z"/>
      </svg>
    </div>

    <!-- 底部資訊條 -->
    <div v-if="isMapReady" class="floating-box bottom-0 left-0 right-0 mx-auto w-full">
      <div class="flex items-center justify-between w-full">
        <div class="flex items-center gap-2">
          <span class="font-bold">附近用戶</span>
          <span class="pill">{{ filteredUsers.length }} 人</span>
        </div>
        <div class="text-sm text-gray-500">拖曳 / 縮放地圖以更新</div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="postcss">
.google-map {
  width: 100%;
  height: 400px;
}

/* 右上角 GPS 按鈕 */
.gps {
  position: absolute;
  right: 10px;
  top: 10px;
  background-color: #fff;
  width: 40px;
  height: 40px;
  user-select: none;
  box-shadow: rgba(0, 0, 0, 0.3) 0px 1px 4px -1px;
  border-radius: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
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
