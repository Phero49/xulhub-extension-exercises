<template>
  <div class="flex justify-center items-center h-full">
    <img style="max-height: 250px;border-radius:10px " class="shadow-2 " :src="imageData" alt="Uploaded Image" />
  </div>
</template>

<script lang="ts" setup>
defineProps<{
  imageData: string;
}>();
</script>

<style>

</style>