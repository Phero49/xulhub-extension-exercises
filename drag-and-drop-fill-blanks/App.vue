<template>
  <q-layout view="hHh lpR fFf" class="bg-grey-2 font-inter">
    <q-page-container>
      <q-page class="flex flex-center column q-pa-md">


        <div v-if="isPublished === undefined" class="text-center q-pa-lg">
          <q-spinner color="primary" size="3em" />
          <div class="q-mt-md">Loading Exercise...</div>
        </div>

        <template v-else>
          <!-- Draft Mode -->
          <DraftMode v-if="!isPublished && !isPreview" @update:model-value="updateSentences" v-model="exerciseSentences"
            @preview="isPreview = true" />

          <!-- Preview Mode -->
          <PublishMode v-if="isPreview || isPublished" :sentences="exerciseSentences"
            @end-preview-mode="isPreview = false" :is-preview="isPreview" />
        </template>

      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script lang="ts" setup>
import { ref, toRaw } from 'vue';
import { createNotebookSDK } from 'xulhub-sdk';
import { QLayout, QPageContainer, QPage, QIcon, QSpinner } from 'quasar';
import DraftMode from './components/DraftMode.vue';
import PublishMode from './components/PublishMode.vue';

// --- State ---
const isPublished = ref<undefined | boolean>(false);
const isPreview = ref<boolean>(false);
const exerciseSentences = ref<string[]>([

]);

const updateSentences = (sentences: string[]) => {
  exerciseSentences.value = sentences;
  notebookSDK.saveContent(toRaw(exerciseSentences.value))
}
// --- Notebook SDK ---
const notebookSDK = createNotebookSDK({ height: '600px' });

notebookSDK.onReady((data: string[]) => {

  isPublished.value = notebookSDK.isPublished ?? false; // Default to draft if undefined? Or wait? 
  // Usually isPublished is boolean.

  if (data && data.length > 0) {
    exerciseSentences.value = data;
  }

  return data.length
});
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap');

html,
body {
  font-family: 'Inter', sans-serif;
}

.font-inter {
  font-family: 'Inter', sans-serif;
}
</style>