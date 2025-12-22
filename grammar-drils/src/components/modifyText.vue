<template>
  <div
    v-if="!isPublished"
    :class="[
      {
        'border-box': !isPublished,
      },
    ]"
  >
    <div>
      <q-input
        v-model="unModifiedText"
        dense
        type="textarea"
        autogrow
        @update:model-value="emits('save', unModifiedText)"
        label="Unmodified Text"
        borderless
      />
    </div>
    <hr class="q-my-xs" />
    <div>
      <q-input
        v-model="modifiedText"
        dense
        type="textarea"
        autogrow
        label="expected answer"
        borderless
        @update:model-value="emits('saveAnswer', modifiedText)"
      />
    </div>
  </div>
  <div v-else>
    <q-input 
      :readonly="passed !== null"
      dense
      v-model="unModifiedText"
      borderless
      :input-class="[
        'text-subtitle1',
        {
          'text-red': passed === false,
          'text-positive': passed === true,
        },
      ]"
      type="text"
    >
      <template #append>
        <q-icon
          v-if="passed !== null"
          :name="passed === true ? symRoundedCheck : symRoundedClose"
          :color="passed === true ? 'positive' : 'red'"
          size="sm"
        />
        <q-btn
          :icon="symRoundedRefresh"
          v-if="passed === null && !viewAnswer"
          flat
          dense
          size="sm"
          @click="unModifiedText = data.data"
        >
          <q-tooltip> reset </q-tooltip>
        </q-btn>
        <q-btn
          v-if="passed !== null"
          flat
          size="sm"
          round
          dense
          :icon="viewAnswer ? symRoundedVisibilityOff : symRoundedVisibility"
          @click="toggleViewAnswer"
        />
      </template>
      <template #hint>
        <span v-if="viewAnswer">{{ modifiedText }}</span>
      </template>
    </q-input>
  </div>
</template>

<script lang="ts" setup>
import { QInput } from "quasar";
import { ref } from "vue";
import type { ExpectedData } from "../../importExercise";
import {
  symRoundedCheck,
  symRoundedClose,
  symRoundedRefresh,
  symRoundedVisibility,
  symRoundedVisibilityOff,
} from "@quasar/extras/material-symbols-rounded";

const { data } = defineProps<{ isPublished: boolean; data: ExpectedData }>();
const emits = defineEmits<{
  addNewLine: ["modifyText", string];
  removeLine: [number];
  save: [string];
  saveAnswer: [string];
}>();

const unModifiedText = ref(data.data);
const modifiedText = ref(data.answer ?? "");
const passed = ref<boolean | null>(null);
const viewAnswer = ref(false);
const results = ref<boolean | null>(null);
const userAnswerCopy = ref('');

function toggleViewAnswer() {
  if (!viewAnswer.value) {
    // Store current answer and show correct answer
    userAnswerCopy.value = unModifiedText.value;
    unModifiedText.value = modifiedText.value;
    viewAnswer.value = true;
  } else {
    // Restore user's answer
    unModifiedText.value = userAnswerCopy.value;
    viewAnswer.value = false;
    passed.value = results.value;
  }
}

function trim(text: string) {
  return text
    .split(" ")
    .map((v) => v.trim())
    .join(" ");
}

function verifyAnswer() {
  passed.value = trim(modifiedText.value) == trim(unModifiedText.value);
  results.value = passed.value;
  return passed.value;
}

defineExpose({ verifyAnswer });
</script>

<style></style>