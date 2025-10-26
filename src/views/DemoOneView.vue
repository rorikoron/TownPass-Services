<script setup lang="ts">
import demoOneJson from '../../public/mock/demo_one.json';

const demoOneData = demoOneJson.data;
</script>
<template>
  <h1 class="text-bold">Microservice Demo 1</h1>
  <h2>{{ demoOneData.message }}</h2>
  <h3 v-for="item in demoOneData.demo_items" :key="item.id">
    {{ item.id }} - {{ item.title }}: {{ item.description }}
  </h3>
</template>
