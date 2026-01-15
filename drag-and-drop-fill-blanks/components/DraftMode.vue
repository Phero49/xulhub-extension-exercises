<template>
  <div class="draft-mode-container q-pa-md">
    <!-- Editor Section -->
    <q-card class="q-mb-md shadow-2" style="border-radius: 12px;">
      <q-card-section>
        <div class="row">
          <div>
            <div class="text-h6 text-blue-grey-6 q-mb-sm">Draft Mode: Editor</div>
            <div class="text-caption q-mb-md text-grey-6">
              Add sentences using {curly braces} for the blanks. Example: <span class="text-yellow text-bold"> "The sky
                is {blue}."</span>
            </div>
          </div>
          <div>
            <q-btn size="sm" no-caps unelevated color="primary" label="preview" @click="emit('preview')" />

          </div>
        </div>


        <div class="row q-col-gutter-sm">
          <div class="col-12 col-md-9">
            <q-input outlined v-model="inputSentence" label="Enter sentence" dense @keyup.enter="addSentence">
              <template v-slot:append>
                <q-icon :name="matEdit" />
              </template>
            </q-input>
          </div>
          <div class="col-12 col-md-3">
            <q-btn :icon="matAdd" color="primary" class="full-width full-height" @click="addSentence"
              :disable="!inputSentence">
              <q-tooltip>
                Add Sentence
              </q-tooltip>
            </q-btn>
          </div>
        </div>

        <q-list separator bordered class=" q-mt-md rounded-borders">
          <q-item v-for="(sentence, index) in localSentences" :key="index">
            <q-item-section side>
              <q-item-label>{{ index + 1 }}.</q-item-label>
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ sentence }}</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-btn flat round color="negative" :icon="matDelete" size="sm" @click="removeSentence(index)" />
            </q-item-section>
          </q-item>
          <q-item v-if="localSentences.length === 0">
            <q-item-section class="text-grey text-center italic">
              No sentences added yet.
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>
    </q-card>


  </div>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue';
import { matAdd, matEdit, matDelete } from '@quasar/extras/material-icons'

// Use defineModel or props/emits for two-way binding or sync
// Since we are in Vue 3.4+, delete defineModel if using older Vue, but default let's use props/emit
const props = defineProps<{
  modelValue: string[]
}>();

const emit = defineEmits<{ 'update:modelValue': [string[]], "preview": [] }>();

const localSentences = ref<string[]>([...props.modelValue]);
const inputSentence = ref("");

watch(() => props.modelValue, (newVal) => {
  if (JSON.stringify(newVal) !== JSON.stringify(localSentences.value)) {
    localSentences.value = [...newVal];
  }
}, { deep: true });

function addSentence() {
  if (inputSentence.value.trim().length > 0) {
    localSentences.value.push(inputSentence.value);
    inputSentence.value = "";
    emitUpdate();
  }
}

function removeSentence(index: number) {
  localSentences.value.splice(index, 1);
  emitUpdate();
}

function emitUpdate() {
  emit('update:modelValue', localSentences.value);
}

// Helper to parse for HTML preview
function parseSentence(sentence: string) {
  const parts = sentence.split(/(\{[^}]+\})/g);
  return parts.map(part => {
    if (part.startsWith('{') && part.endsWith('}')) {
      return { text: part.slice(1, -1), isBlank: true };
    }
    return { text: part, isBlank: false };
  });
}
</script>

<style scoped>
.html-blank-input {
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 4px 8px;
  width: 100px;
  text-align: center;
  background-color: #f9f9f9;
}
</style>
