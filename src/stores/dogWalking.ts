import { defineStore } from 'pinia';
import { ref } from 'vue';

export interface Dog {
  id: string;
  name: string;
  breed: string;
  activities: string[];
  useCase: string;
}

export interface WalkingRecord {
  id: string;
  dogId: string;
  dogName: string;
  breed: string;
  ownerName: string;
  startTime: string;
  endTime?: string;
  duration?: number; // 分鐘
  status: 'walking' | 'completed';
  publisherConfirmed?: boolean; // 發布人確認狀態
}

export interface QueuedDog {
  id: string;
  dogId: string;
  dogName: string;
  breed: string;
  ownerName: string;
  addedTime: string;
  publisherConfirmed: boolean; // 發布人確認狀態
  walkerAccountId: string; // 加入者（遛狗者）的帳號 ID
  publisherAccountId?: string; // 發布人的帳號 ID
}

export const useDogWalkingStore = defineStore('dogWalking', () => {
  const dogs = ref<Dog[]>([]);
  const currentDog = ref<Partial<Dog>>({
    name: '',
    breed: '',
    activities: [],
    useCase: ''
  });

  const addDog = () => {
    if (currentDog.value.name && currentDog.value.breed && currentDog.value.useCase) {
      const newDog: Dog = {
        id: Date.now().toString(),
        name: currentDog.value.name || '',
        breed: currentDog.value.breed || '',
        activities: currentDog.value.activities || [],
        useCase: currentDog.value.useCase || ''
      };
      dogs.value.push(newDog);
      resetCurrentDog();
    }
  };

  const removeDog = (id: string) => {
    dogs.value = dogs.value.filter(dog => dog.id !== id);
  };

  const toggleActivity = (activity: string) => {
    if (currentDog.value.activities?.includes(activity)) {
      currentDog.value.activities = currentDog.value.activities.filter(a => a !== activity);
    } else {
      currentDog.value.activities = [...(currentDog.value.activities || []), activity];
    }
  };

  const resetCurrentDog = () => {
    currentDog.value = {
      name: '',
      breed: '',
      activities: [],
      useCase: ''
    };
  };

  const publishDogs = () => {
    if (dogs.value.length > 0) {
      console.log('Publishing dogs:', dogs.value);
      alert(`已發佈 ${dogs.value.length} 隻狗狗！`);
      dogs.value = [];
      resetCurrentDog();
      return true;
    }
    return false;
  };

  // 遛狗相關狀態
  const walkingRecords = ref<WalkingRecord[]>([]);
  const walkingQueue = ref<QueuedDog[]>([]);
  const isWalking = ref(false);
  const currentWalkingDog = ref<WalkingRecord | null>(null);
  const walkStartTime = ref<Date | null>(null);
  const currentQueueIndex = ref<number | null>(null);
  
  // 當前用戶狀態
  const currentUserAccountId = ref<string>(''); // 當前登入的帳號 ID

  // 添加狗狗到遛狗清單
  const addToQueue = (dogData: {
    id: string;
    name: string;
    breed: string;
    owner: string;
  }, walkerAccountId: string) => {
    const queuedDog: QueuedDog = {
      id: Date.now().toString(),
      dogId: dogData.id,
      dogName: dogData.name,
      breed: dogData.breed,
      ownerName: dogData.owner,
      addedTime: new Date().toLocaleString('zh-TW'),
      publisherConfirmed: false,
      walkerAccountId: walkerAccountId
    };
    walkingQueue.value.push(queuedDog);
  };

  // 從清單移除狗狗
  const removeFromQueue = (queueId: string) => {
    walkingQueue.value = walkingQueue.value.filter(dog => dog.id !== queueId);
  };

  // 開始遛狗（從清單中）
  const startWalkingFromQueue = (queueId: string) => {
    const queuedDog = walkingQueue.value.find(dog => dog.id === queueId);
    if (queuedDog) {
      currentQueueIndex.value = walkingQueue.value.findIndex(dog => dog.id === queueId);
      walkStartTime.value = new Date();
      currentWalkingDog.value = {
        id: Date.now().toString(),
        dogId: queuedDog.dogId,
        dogName: queuedDog.dogName,
        breed: queuedDog.breed,
        ownerName: queuedDog.ownerName,
        startTime: walkStartTime.value.toLocaleString('zh-TW'),
        status: 'walking'
      };
      isWalking.value = true;
    }
  };

  // 停止遛狗並保存紀錄
  const stopWalkingFromQueue = () => {
    if (currentWalkingDog.value && walkStartTime.value) {
      const endTime = new Date();
      const duration = Math.floor((endTime.getTime() - walkStartTime.value.getTime()) / 60000);
      
      currentWalkingDog.value.endTime = endTime.toLocaleString('zh-TW');
      currentWalkingDog.value.duration = duration;
      currentWalkingDog.value.status = 'completed';
      
      walkingRecords.value.unshift(currentWalkingDog.value);
    }
    
    // 從隊列中移除已完成的狗狗
    if (currentQueueIndex.value !== null) {
      const queuedDog = walkingQueue.value[currentQueueIndex.value];
      if (queuedDog) {
        removeFromQueue(queuedDog.id);
      }
    }
    
    isWalking.value = false;
    currentWalkingDog.value = null;
    walkStartTime.value = null;
    currentQueueIndex.value = null;
  };

  // 確認發布人（發布紀錄中的狗狗）
  const confirmPublisherForQueue = (queueId: string, publisherAccountId: string) => {
    const queuedDog = walkingQueue.value.find(dog => dog.id === queueId);
    if (queuedDog) {
      // 驗證發布人和遛狗者不是同一個帳號
      if (queuedDog.walkerAccountId === publisherAccountId) {
        console.warn('發布人和遛狗者不能是同一個帳號');
        return false;
      }
      queuedDog.publisherConfirmed = true;
      queuedDog.publisherAccountId = publisherAccountId;
      return true;
    }
    return false;
  };

  // 設置當前用戶帳號
  const setCurrentUserAccountId = (accountId: string) => {
    currentUserAccountId.value = accountId;
  };

  return {
    dogs,
    currentDog,
    addDog,
    removeDog,
    toggleActivity,
    publishDogs,
    resetCurrentDog,
    walkingRecords,
    walkingQueue,
    isWalking,
    currentWalkingDog,
    currentUserAccountId,
    addToQueue,
    removeFromQueue,
    startWalkingFromQueue,
    stopWalkingFromQueue,
    confirmPublisherForQueue,
    setCurrentUserAccountId
  };
});
