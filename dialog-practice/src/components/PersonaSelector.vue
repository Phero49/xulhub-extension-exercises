<script setup lang="ts">
import { QAvatar, QIcon, QTooltip } from "quasar";
import { mdiAccountCircle } from "@quasar/extras/mdi-v5";

interface Persona {
  name: string;
  avatar: string | null;
}

interface Props {
  personaA: Persona;
  personaB: Persona;
  activePersona: "A" | "B";
}
 defineProps<Props>();

const emit = defineEmits<{
  (e: "select", persona: "A" | "B"): void;
  (e: "edit", persona: "A" | "B"): void;
}>();
</script>

<template>
  <div class="row ">
    <span
      class="persona-avatar"
      @click="emit('select', 'A')"
      v-touch-hold.mouse="() => emit('edit', 'A')"
    >
      <q-avatar 
        size="40px" 
        :color="activePersona === 'A' ? 'blue' : 'grey-8'"
      >
        <q-icon
          size="25px"
          color="white"
          :name="mdiAccountCircle"
          v-if="personaA.avatar == null"
        />
        <img
          class="q-pa-xs"
          v-else
          :src="personaA.avatar"
          alt=""
        />
        <q-tooltip>Long press to edit persona A</q-tooltip>
      </q-avatar>
    </span>

    <span
      class="persona-avatar"
      @click="emit('select', 'B')"
      v-touch-hold.mouse="() => emit('edit', 'B')"
    >
      <q-avatar 
        size="40px" 
        :color="activePersona === 'B' ? 'blue' : 'grey-8'"
      >
        <q-icon
          size="25px"
          color="white"
          :name="mdiAccountCircle"
          v-if="personaB.avatar == null"
        />
        <img v-else :src="personaB.avatar" alt="" />
        <q-tooltip>Long press to edit persona B</q-tooltip>
      </q-avatar>
    </span>
  </div>
</template>

<style scoped>
.persona-selector {
  display: flex;
  gap: 8px;
  align-items: center;
}

.persona-avatar {
  cursor: pointer;
  transition: transform 0.2s;
}

.persona-avatar:hover {
  transform: scale(1.05);
}
</style>