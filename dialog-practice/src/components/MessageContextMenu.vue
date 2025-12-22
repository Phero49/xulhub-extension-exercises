<script setup lang="ts">
import { QMenu, QList, QItem, QItemSection, QSeparator } from "quasar";

interface Props {
  modelValue: boolean;
  target?: string;
  messageType?: "text" | "audio";
}

defineProps<Props>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "update:editMessage"): void;
  
  (e: "delete"): void;
  (e: "convert"): void;
}>();
</script>

<template>
  <div v-if="modelValue" >
   <q-menu 
    :model-value="modelValue"  
    @update:model-value="emit('update:modelValue', $event)"
    :target="target" 
  >
    <q-list style="min-width: 180px">
      <q-item clickable v-close-popup @click="emit('delete')">
        <q-item-section>Delete Message</q-item-section>
      </q-item>
      
      <q-separator /> <q-item clickable v-close-popup @click="emit('update:editMessage')">
        <q-item-section>edit Message</q-item-section>
      </q-item>
      
      <q-separator />
      
      <q-item clickable v-close-popup @click="emit('convert')">
        <q-item-section>
          {{ messageType === "text" ? "Convert to Voice Message" : "Convert to Text" }}
        </q-item-section>
      </q-item>
    </q-list>
  </q-menu>   
  </div>

</template>