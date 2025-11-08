import { defineStore } from 'pinia';
import { ref } from 'vue';

export interface Dog {
  id: string;
  name: string;
  breed: string;
  activities: string[];
  useCase: string;
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

  return {
    dogs,
    currentDog,
    addDog,
    removeDog,
    toggleActivity,
    publishDogs,
    resetCurrentDog
  };
});
