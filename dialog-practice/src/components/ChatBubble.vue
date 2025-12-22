<script setup lang="ts">
import { QAvatar, QIcon } from "quasar";
import { mdiAccountCircle } from "@quasar/extras/mdi-v5";
import VoiceMail from "./voiceMail.vue";
import type { ChatMessage } from "../types.ts";



interface Props {
  message: ChatMessage;
  index: number;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: "hold", selector: string, index: number): void;
}>();

function handleHold() {
  emit("hold", `[data-message-index='${props.index}']`, props.index);
}
</script>

<template>
  <div
    class="chat-bubble-container"
    :class="{ sent: message.sent,  }"
    v-touch-hold.mouse="handleHold"
    :data-message-index="index"
  >
    <!-- Avatar (only show for received messages) -->
    <div v-if="!message.sent" class="avatar-container">
      <q-avatar size="28px">
        <img v-if="message.avatar && message.avatar.length > 1" :src="message.avatar" />
        <q-icon v-else :name="mdiAccountCircle" size="28px" />
      </q-avatar>
    </div>

    <!-- Message bubble -->
    <div class="bubble-wrapper">
      <div class="bubble" :class="{ sent: message.sent, received: !message.sent,failed: message.failed }">
        <div v-if="message.type === 'text'" class="bubble-text">
          {{ message.text }}
        </div>
        <VoiceMail v-else :data="message.text" />
      </div>
      <!-- Name label (only for received messages) -->
      <div class="message-name">
        {{ message.name }}
      </div>
    </div>

    <!-- Avatar placeholder for sent messages (for alignment) -->
    <div v-if="message.sent" class="avatar-placeholder"></div>
  </div>
</template>

<style scoped>
.chat-bubble-container {
  display: flex;
  align-items: flex-end;
  margin-bottom: 4px;
  gap: 6px;
  cursor: pointer;
}

.chat-bubble-container.sent {
  flex-direction: row-reverse;
}

.avatar-container {
  flex-shrink: 0;
  margin-bottom: 2px;
}

.avatar-placeholder {
  width: 28px;
  flex-shrink: 0;
}

.bubble-wrapper {
  display: flex;
  flex-direction: column;
  max-width: 70%;
}

.chat-bubble-container.sent .bubble-wrapper {
  align-items: flex-end;
}

.bubble {
  padding: 8px 12px;
  border-radius: 18px;
  word-wrap: break-word;
  position: relative;
  display: inline-block;
}

.bubble.sent {
  background-color: #0084ff;
  color: white;
  border-bottom-right-radius: 4px;
}
.bubble.failed {
  background-color: #f76767; /* light red */
  color: #700; /* darker text for contrast */
  border: 1px solid #e00; /* optional: give it a bit of urgency */
}


.bubble.received {
  background-color: #e4e6eb;
  color: #050505;
  border-bottom-left-radius: 4px;
}

.bubble-text {
  font-size: 14px;
  line-height: 1.4;
}

.message-name {
  font-size: 11px;
  color: #65676b;
  margin-top: 2px;
  margin-left: 12px;
}

/* Consecutive message grouping - reduce spacing */
.chat-bubble-container + .chat-bubble-container {
  margin-top: 2px;
}
</style>