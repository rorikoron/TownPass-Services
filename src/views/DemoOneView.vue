<script setup lang="ts">
import { onMounted, ref } from 'vue';
import demoOneJson from '../../public/mock/demo_one.json';
import { useConnectionMessage } from '@/composables/useConnectionMessage';
import { useHandleConnectionData } from '@/composables/useHandleConnectionData';

const demoOneData = demoOneJson.data;

const demoHealthConnectData = ref<string>('');

const handleHealthConnectData = (event: { data: string }) => {
  console.log(event.data);
};
useHandleConnectionData(handleHealthConnectData);
onMounted(() => {
  useConnectionMessage('health_connect', null);
});
</script>
<template>
  <h1 class="text-bold">Microservice Demo 1</h1>
  <h2>{{ demoOneData.message }}</h2>
  <h3 v-for="item in demoOneData.demo_items" :key="item.id">
    {{ item.id }} - {{ item.title }}: {{ item.description }}
  </h3>

  <span v-if="demoHealthConnectData.length">Health Connect Data: {{ demoHealthConnectData }}</span>
  <span v-else>Fetched no data</span>
</template>
