<template>
  <div class="audio-container">
    <audio :src="audioData" controls class="audio-player" />
  </div>
</template>

<script lang="ts" setup>
defineProps<{
  audioData: string;
}>();
</script>

<style scoped>
.audio-container {
  display: flex;
  justify-content: center;
  padding: 8px;
}

.audio-player {
  width: 100%;
  height: 32px;

}
</style>