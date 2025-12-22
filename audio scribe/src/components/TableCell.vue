<template>
  <div
    class="row items-center"
    :class="[
      {'border':passed === undefined},
      { passed: passed === true },
      { failed: passed === false },
    ]"
  >
    <div class="col-2">
      <q-btn
        color="primary"
        round
        push
        unelevated
        :icon="isPlaying ? symRoundedStopCircle : symRoundedPlayCircle"
        @click="togglePlay"
      />
    </div>
    <div
      class="col-10 drag-section draggable-item"
      :index="index"
      dropzone="move"
      ref="draggableElement"
    >
      <div class="row items-center justify-between">
        <div style="width: 80%">
          <div
            class="text-subtitle1 text-grey"
            @click="isWriting = true"
            style="cursor: pointer"
            v-if="tableData.text == '' && !isPublished && !isWriting"
          >
            write expected answer here
          </div>
          <div v-else>
            <div
              class="q-pa-md text-grey"
              contenteditable
              v-focus
              @input="save"
              style="width: 100%; outline: none; font-size: 18px"
              @blur="onBlur"
              @focus="onFocus"
            >
              {{ tableData.text }}
            </div>
          </div>
        </div>
        <q-card-actions vertical class="text-grey" v-if="!isPublished">
          <q-btn
            size="sm"
            flat
            :icon="symRoundedDelete"
            @click="
              () => {
                if (deleteCell != undefined) {
                  deleteCell(index);
                }
              }
            "
          />
          <q-btn
            size="sm"
            v
            flat
            :icon="symRoundedEdit"
            @click="addData = true"
          />

          <slot
            name="actions"
            :getDraggableElement="getDraggableElement"
          ></slot>
        </q-card-actions>
      </div>
    </div>
  </div>

  <q-dialog v-model="addData" persistent @show="onShow">
    <q-card style="max-width: 400px; width: 100%">
      <q-btn :icon="symRoundedClose" flat round @click="addData = false" />
      <q-card-section class="q-gutter-md">
        <!-- Audio Type Select -->
        <q-select
          :dropdown-icon="symRoundedArrowDropDown"
          v-model="audioType"
          dense
          :options="['tts', 'file']"
          label="Audio type"
          standout
          @blur="
            () => {
              if (audioType == 'file') {
                onShow();
              }
            }
          "
        />

        <!-- TTS Options -->
        <!-- TTS Options -->
        <div v-if="audioType === 'tts'" class="q-gutter-y-sm">
          <q-input v-model="languageCode" label="Language Code" filled dense />
          <q-input
            v-model="ttsText"
            label="Text to speak"
            filled
            type="textarea"
            autogrow
          />
        </div>

        <!-- File Upload -->
        <div
          v-if="audioType === 'file'"
          class="column items-center"
          ref="uploadFileContainer"
        >
          <q-avatar
            size="100px"
            color="grey-3"
            text-color="white"
            :icon="symRoundedAdd"
            class="cursor-pointer"
            @click="selectFile"
          />
        </div>
      </q-card-section>

      <q-card-actions vertical align="center">
        <div
          v-if="uploadedAudioData"
          class="text-positive text-subtitle1 text-capitalize"
        >
          audio added successfully
        </div>
        <q-btn
          flat
          color="primary"
          :icon="isPlaying ? symRoundedStopCircle : symRoundedPlayCircle"
          @click="togglePlay"
          label="Play"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { ref, inject, nextTick, type Ref } from "vue";
import {
  QBtn,
  QDialog,
  QSelect,
  QCard,
  QCardSection,
  QCardActions,
  QAvatar,
  QInput,
} from "quasar";
import {
  symRoundedAdd,
  symRoundedArrowDropDown,
  symRoundedClose,
  symRoundedDelete,
  symRoundedEdit,
  symRoundedPlayCircle,
  symRoundedStopCircle,
} from "@quasar/extras/material-symbols-rounded";
import { createFileUploadArea, createSpeechUtterance } from "xulhub-sdk";
import type { TableData } from "../types";

const props = defineProps<{
  tableData: TableData["contents"][0];
  isPublished: boolean;
  index: number;
}>();

const isPlaying = ref(false);
const addData = ref(false);
const audioType = ref<TableData["contents"][0]["audio"]["type"]>(
  props.tableData.audio.type
);
const uploadedAudioData = ref<string | null>(null);
const audioElement = ref<HTMLAudioElement | null>(null);
const languageCode = ref(
  props.tableData.audio.type == "tts" && props.tableData.audio.lang
    ? props.tableData.audio.lang
    : "en"
); // default TTS language
const ttsText = ref(
  props.tableData.audio.type == "tts" ? props.tableData.audio.data : ""
);
const uploadFileContainer = ref<HTMLElement>();
type SpeechUtterance = ReturnType<typeof createSpeechUtterance>;
const saveTableCell =
  inject<(index: number, data: TableData["contents"][0]) => void>(
    "saveTableCell"
  );
const deleteCell = inject<(index: number) => void>("deleteCell");
const passed = inject<Ref<boolean>>("passed");
const draggableElement = ref<HTMLDivElement>();
const isWriting = ref(false);
const timeOut = ref();
function save(e: InputEvent) {
  clearTimeout(timeOut.value);
  timeOut.value = setTimeout(() => {
    const text = (e.target as HTMLDivElement).textContent;
    if (saveTableCell) {
      saveTableCell(props.index, {
        text: text,
        audio: {
          lang: languageCode.value,
          type: audioType.value,
          data: ttsText.value,
        },
      });
    }
  }, 400);
}

const onBlur = (e: Event) => {
  const el = e.target as HTMLElement;
  if (el.textContent.trim() == "") {
    el.textContent = "write Here";
  }
  isWriting.value = false;
};

const vFocus = {
  mounted: (el: HTMLElement) => {
    el.focus();
  },
};

const onFocus = (e: Event) => {
  const el = e.target as HTMLElement;
  if (el.textContent.toLowerCase() =='write here') {
    el.textContent = ''
  }
  el.focus();
};
function getDraggableElement() {
  return draggableElement.value;
}

const speech = ref<SpeechUtterance>();

function togglePlay() {
  if (audioType.value == "tts") {
    if (!isPlaying.value) {
      // Stop any existing speech before starting new one
      speech.value?.stop();

      speech.value = createSpeechUtterance(
        ttsText.value == "" ? "please add text" : ttsText.value,
        languageCode.value
      );

      // Set up event listeners to track playback state
      speech.value.getUtterance().onend = () => {
        isPlaying.value = false;
      };

      speech.value.getUtterance().onerror = () => {
        isPlaying.value = false;
      };
      speech.value.setPitch(0.8);

      speech.value.play();
      isPlaying.value = true;
    } else {
      speech.value?.stop();
      isPlaying.value = false;
    }
    return;
  }

  if (!audioElement.value) {
    playAudio();
  } else if (isPlaying.value) {
    audioElement.value.pause();
    isPlaying.value = false;
  } else {
    audioElement.value.play();
    isPlaying.value = true;
  }
}

function playAudio() {
  let src: string | undefined;

  if (audioType.value === "file" && uploadedAudioData.value) {
    src = uploadedAudioData.value;
  } else if (audioType.value === "tts") {
    console.log("TTS playback would use language:", languageCode.value);
    // Replace with real TTS playback implementation
    return;
  } else {
    console.warn("No audio source available");
    return;
  }

  audioElement.value = new Audio(src);
  audioElement.value.play();
  isPlaying.value = true;
  audioElement.value.onended = () => {
    isPlaying.value = false;
    audioElement.value = null;
  };
}

function selectFile() {
  uploadFileContainer.value
    ?.querySelector<HTMLInputElement>('input[type="file"]')
    ?.click();
}

async function onShow() {
  await nextTick();
  if (uploadFileContainer.value) {
    createFileUploadArea(uploadFileContainer.value, {
      expectedFileOutput: "string",
      acceptedFiles: ["audio/mpeg", "audio/wav", "audio/ogg"],
      maxSize: 1024 * 1024, // 1 MB
      success: (file: string|File) => {
        uploadedAudioData.value = file as string;
      },
    });
  }
}
</script>

<style scoped>
.border {
  border-bottom: 2px solid;
  border-color: #fec;
}
 .failed {
  border-bottom: 2px solid;
  border-color: red;
  color: red;
  
}
 .passed {
   border-bottom: 2px solid;
  border-color: rgb(26, 243, 26);
}
.cursor-pointer {
  cursor: pointer;
}
.q-gutter-md {
  gap: 1rem;
}
</style>
