<script setup lang="ts">
import { QDialog, QCard, QCardSection, QAvatar, QIcon, QInput, QCheckbox, QBtn } from "quasar";
import { mdiAccountCircle } from "@quasar/extras/mdi-v5";
import FilePicker from "./filePicker.vue";

interface Persona {
  name: string;
  avatar: string | null;
}

interface Props {
  modelValue: boolean;
  personaKey: "A" | "B";
  persona: Persona;
  initiator: "A" | "B";
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "update:persona", value: Persona): void;
  (e: "update:initiator", value: "A" | "B"): void;
  (e: "save"): void;
}>();

function updateAvatar(image: string) {
  emit("update:persona", { ...props.persona, avatar: image });
}

function updateName(name: string) {
  emit("update:persona", { ...props.persona, name });
}

function handleClose() {
  emit("update:modelValue", false);
  emit("save");
}
</script>

<template>
  <q-dialog :model-value="modelValue" persistent>
    <q-card style="max-width: 400px; width: 100%">
      <div class="text-h6 q-pa-md">Persona "{{ personaKey }}"</div>
      
      <q-card-section>
        <div class="column items-center">
          <FilePicker @get-image="updateAvatar">
            <q-avatar size="75px">
              <q-icon
                size="70px"
                :name="mdiAccountCircle"
                v-if="persona.avatar == null"
              />
              <img v-else :src="persona.avatar" alt="" />
            </q-avatar>
          </FilePicker>
          <div class="text-caption text-grey-7 q-mt-sm">Click or drag to add avatar</div>
        </div>
      </q-card-section>

      <q-card-section>
        <q-input
          :model-value="persona.name"
          @update:model-value="(v)=>{
            updateName(v as string)
          }"
          type="text"
          label="Persona name"
          outlined
          dense
        />

        <q-checkbox
          class="q-mt-md"
          left-label
          :model-value="initiator"
          @update:model-value="emit('update:initiator', $event)"
          :true-value="personaKey"
          :false-value="personaKey === 'A' ? 'B' : 'A'"
          label="Conversation initiator"
        />
      </q-card-section>

      <q-card-section class="q-pt-none">
        <q-btn
          flat
          label="Close"
          color="primary"
          @click="handleClose"
          class="full-width"
        />
      </q-card-section>
    </q-card>
  </q-dialog>
</template>