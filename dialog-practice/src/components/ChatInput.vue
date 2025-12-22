<script setup lang="ts">
import { ref } from "vue";
import { QInput, QBtn, QScrollArea, QChip } from "quasar";

interface Props {
  mode: "type" | "selection";
  options?: string[];
}

defineProps<Props>();

const emit = defineEmits<{
  (e: "send", message: string): void;  
  (e: "updateText", message: string): void; 
   (e: "optionSelected", message: string): void;
}>();

const newMessage = ref("");

function sendMessage() {
  if (newMessage.value.trim() === "") return;
  if (editTextModel.value) {
    emit("updateText", newMessage.value.trim());
  editTextModel.value = false

  }else{
  emit("send", newMessage.value.trim());

  }
  newMessage.value = "";
}
const editTextModel=ref(false)
function editText(text:string) {
  newMessage.value =  text
  editTextModel.value = true
}
defineExpose({editText:editText})

function selectOption(option:string){
emit('optionSelected',option)
}

</script>

<template>
  <div class="chat-input-container">
    <!-- Selection mode - show options -->
    <q-scroll-area v-if="mode === 'selection'" style="height: 50px; width: 100%">
      <div v-if="options && options.length > 0" class="row no-wrap">
        <q-chip
          v-for="(option, index) in options"
          :key="index"
          clickable
          :label="option"
          color="primary"
          @click="selectOption(option)"
          text-color="white"
        />
      </div>
      <div v-else class="text-body2 text-center text-grey q-pa-sm">
        No dialog options available. Switch to typing to add options.
      </div>
    </q-scroll-area>

    <!-- Type mode - input field -->
    <q-input
      v-else
      v-model="newMessage"
      outlined
      dense
      placeholder="Type a message..."
      @keydown.enter.exact.prevent="sendMessage"
      class="message-input"
    >
      <template #after>
        <q-btn 
          unelevated 
          color="primary" 
          label="Send" 
          @click="sendMessage"
          :disable="!newMessage.trim()"
        />
      </template>
    </q-input>
  </div>
</template>

<style scoped>
.chat-input-container {
  padding: 12px 16px;
  max-width: 500px;
  width: 100%;
}

.message-input {
  width: 100%;
}
</style>