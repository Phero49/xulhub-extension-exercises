<template>
  <div>
    <div class="row items-center " style="width: 300px;">
   <div  class="q-mr-sm" > 
      <q-btn
        flat
        dense
        size="lg"
        round
        color="primary"
        :icon="playing ? mdiPauseCircle : mdiPlayCircle"
        @click="togglePlay"
      />
   </div> 
<div>
    
</div>
   <div  style="width: 60%;"  >
         <q-slider
        v-model="progress"
        :min="0"
        :max="duration"
        color="accent"
      inner-track-color="primary"
      >
    
    </q-slider>     </div>
 
    </div>   
     <span class="absolute absolute-right q-my-sm q-mr-sm " style="font-size: 10px;">{{ formatTime(progress) }} / {{ formatTime(duration) }}</span>


  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { mdiPlayCircle, mdiPauseCircle } from '@quasar/extras/mdi-v5';
import { QSlider, QBtn } from 'quasar';

const props = defineProps<{ data: string }>();

const playing = ref(false);
const progress = ref(0);
const duration = ref(0); // in seconds

let ttsUtterance: SpeechSynthesisUtterance | null = null;
let intervalId: number | null = null;

// --- Duration estimator based on character count ---
function estimateDuration(text: string): number {
  const chars = text.length;
  const charsPerMinute = 400; // average reading speed in characters per minute
  return Math.max(1, (chars / charsPerMinute) * 60); // minimum 1 second
}

// --- Format seconds into mm:ss ---
function formatTime(sec: number) {
  const m = Math.floor(sec / 60)
    .toString()
    .padStart(2, '0');
  const s = Math.floor(sec % 60)
    .toString()
    .padStart(2, '0');
  return `${m}:${s}`;
}

// --- Play / pause TTS ---
function togglePlay() {
  if (!playing.value) {
    startTTS();
  } else {
    pauseTTS();
  }
}

// --- Start TTS playback ---
function startTTS() {
  if (!props.data) return;
  ttsUtterance = new SpeechSynthesisUtterance(props.data);
  speechSynthesis.speak(ttsUtterance);
  playing.value = true;

  // Update progress
  intervalId = window.setInterval(() => {
    if (progress.value < duration.value) {
      progress.value += 0.25; // update every 250ms
    } else {
      stopTTS();
    }
  }, 250);
}

// --- Pause TTS ---
function pauseTTS() {
  speechSynthesis.pause();
  playing.value = false;
  if (intervalId) clearInterval(intervalId);
}

// --- Stop TTS ---
function stopTTS() {
  speechSynthesis.cancel();
  playing.value = false;
  progress.value = 0;
  if (intervalId) clearInterval(intervalId);
  intervalId = null;
}

// --- Initialize duration on mount ---
onMounted(() => {
  duration.value = estimateDuration(props.data);
});

// --- Cleanup on unmount ---
onBeforeUnmount(() => {
  stopTTS();
});
</script>

<style scoped>
.flex {
  display: flex;
  align-items: center;
}
.gap-2 {
  gap: 0.5rem;
}
</style>
