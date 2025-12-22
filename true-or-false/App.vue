<template>
  <div class="column q-pa-sm justify-center items-center">
    <div style="max-width: 600px; width: 100%">
      <div v-if="data">
        <!-- Display all content items -->
        <div v-for="(value, i) in data.data" :key="i" class="q-mt-sm row">
          <div :class="[{ 'col-12': isPublished, 'col-11': !isPublished }]">
            <div
              class="text-subtitle1 "
              v-if="value.type == 'text'"
            >
              <div
                :contenteditable="!isPublished"
                @blur="saveTextData($event, i)"
                class="editable-text q-pa-xs"
                :placeholder="value.data ? '' : 'Click to edit text...'"
                v-html="value.data"
              ></div>
            </div>
            <viewimage-data
              v-else-if="value.type == 'image'"
              :image-data="value.data"
              @remove="removeItem(i)"
            />
            <audio-data
              v-else-if="value.type == 'audio'"
              :audio-data="value.data"
              @remove="removeItem(i)"
            />
          </div>
          <div v-if="!isPublished" class="col-1 text-right">
            <q-btn
              color="negative"
              dense
              round
              size="sm"
              :icon="symOutlinedClose"
              @click="deleteItem(i)"
            />
          </div>
        </div>
      </div>

      <!-- Add content buttons -->
      <div class="q-mt-md" v-if="!isPublished">
        <q-card-actions align="center" class="q-gutter-x-lg">
          <q-btn
            round
            color="primary"
            @click="addContent('text')"
            :icon="symOutlinedTitle"
          >
            <q-tooltip> add text content </q-tooltip>
          </q-btn>
          <q-btn
            round
            color="accent"
            @click="addContent('image')"
            :icon="symOutlinedAddAPhoto"
          >
            <q-tooltip> add image </q-tooltip>
          </q-btn>
          <q-btn
            @click="addContent('audio')"
            round
            color="secondary"
            :icon="symOutlinedAudioFile"
          >
            <q-tooltip> add audio </q-tooltip>
          </q-btn>
        </q-card-actions>
      </div>

      <!-- True/False buttons -->
      <q-card-actions align="center" class="q-mt-md">
        <q-btn
          :color="
            userAnswer === true || data?.answer === true ? 'positive' : 'grey-8'
          "
          @click="selectCorrectAnswer(true)"
          padding="xs 15%"
        >
          <template #default>
            <span class="text-bold">True</span>
            <q-icon
              v-if="userAnswer === true || data?.answer === true"
              :name="symOutlinedCheckCircle"
              class="q-ml-sm"
            />
          </template>
        </q-btn>
        <q-btn
          :color="
            userAnswer === false || data?.answer === false
              ? 'positive'
              : 'grey-8'
          "
          @click="selectCorrectAnswer(false)"
          padding="xs 15%"
          unelevated
        >
          <template #default>
            <span class="text-bold">False</span>
            <q-icon
              v-if="userAnswer === false || data?.answer === false"
              :name="symOutlinedCheckCircle"
              class="q-ml-sm"
            />
          </template>
        </q-btn>
      </q-card-actions>

      <!-- Explanation section -->
  <div
        flat v-if="!isPublished || (isPublished && answered !== null)"
        class="text-center q-pa-sm q-mt-xs"
        style="border-radius: 5px"
      >            <div class="text-capitalize  text-weight-medium text-grey text-center">explanation</div>

        <div
          v-if="!isPublished"
          contenteditable
          @blur="saveExplanation"
          style="width: 100%"
          class="editable-text q-pa-sm  "
          :placeholder="data?.explanation ? '' : 'Click to edit explanation...'"
        >
          {{ data?.explanation }}
        </div>
        <div v-else class=" text-body2">
          {{ data?.explanation || "No explanation provided." }}
        </div>
      </div>

      <!-- Upload Dialog -->
      <q-dialog v-model="uploadData" persistent @show="onDialogShow">
        <q-card style="min-width: 400px">
          <q-card-section>
            <div class="text-h6">Upload {{ currentUploadType }}</div>
          </q-card-section>

          <q-card-section>
            <div
              ref="containerRef"
              class="upload-area q-pa-xl text-center cursor-pointer"
              :class="{ dragging: isDragging }"
            >
              <q-avatar
                :icon="
                  currentUploadType == 'image'
                    ? symOutlinedAddAPhoto
                    : symOutlinedEditAudio
                "
                color="primary"
                text-color="white"
                size="lg"
                class="q-mb-md"
              />
              <div class="text-subtitle1 q-mb-sm">
                Click or Drop your {{ currentUploadType }} file here
              </div>
              <div class="text-caption text-grey">
                Maximum size: 1MB
                <span v-if="currentUploadType === 'image'">(Images only)</span>
                <span v-if="currentUploadType === 'audio'"
                  >(Audio files only)</span
                >
              </div>
            </div>

            <div
              v-if="uploadedFile && currentUploadType === 'audio'"
              class="q-mt-md"
            >
              <div class="text-subtitle2 q-mb-xs">Preview:</div>
              <AudioData :audio-data="uploadedFile" />
            </div>

            <div
              v-if="uploadedFile && currentUploadType === 'image'"
              class="q-mt-md"
            >
              <div class="text-subtitle2 q-mb-xs">Preview:</div>
              <ViewimageData :image-data="uploadedFile" />
            </div>

            <div v-if="uploadError" class="text-negative q-mt-md">
              {{ uploadError }}
            </div>
          </q-card-section>

          <q-card-actions align="right">
            <q-btn flat label="Cancel" color="primary" @click="cancelUpload" />
            <q-btn
              flat
              label="Save"
              color="positive"
              @click="saveUpload"
              :disable="!uploadedFile"
            />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onUnmounted, nextTick, toRaw } from "vue";
import {
  createFileUploadArea,
  createNotebookSDK,
  escapeHtml,
} from "xulhub-sdk";
import {
  symOutlinedAddAPhoto,
  symOutlinedTitle,
  symOutlinedAudioFile,
  symOutlinedCheck,
  symOutlinedClose,
  symOutlinedEditAudio,
  symOutlinedCheckCircle,
} from "@quasar/extras/material-symbols-outlined";
import { useQuasar, QCard, QIcon } from "quasar";
import ViewimageData from "./src/components/viewimageData.vue";
import AudioData from "./src/components/AudioData.vue";
import { onMounted } from "vue";
import prompt, { processImport } from "./prompt";

type DataType = {
  type: "text" | "image" | "audio";
  data: string;
};

type TrueORFalseData = {
  data: DataType[];
  explanation: string;
  answer?: boolean;
};

const data = ref<TrueORFalseData>();
const userAnswer = ref<boolean | null>(null); // For published mode
const correctAnswer = ref<boolean | null>(null); // For published mode
const uploadData = ref(false);
const containerRef = ref<HTMLElement>();
const currentUploadType = ref<"image" | "audio">("image");
const uploadedFile = ref<string>("");
const uploadError = ref("");
const isDragging = ref(false);
const trueBtnIcon = ref("");
const falseBtnIcon = ref("");
const notebookSDK = createNotebookSDK({ height: "370px",hasAutoGen:true });
notebookSDK.contentGenerator = {
  contentType:'htmlElement',
  instructionFormat:prompt,
  processImport:processImport
}
const answered = ref<boolean | null>(null);
function selectCorrectAnswer(answer: boolean) {
  if (isPublished.value) {
    // In published mode, store user's answer
    userAnswer.value = answer;

    // Show feedback icons
    if (answer) {
      trueBtnIcon.value = symOutlinedCheck;
      falseBtnIcon.value = "";
    } else {
      falseBtnIcon.value = symOutlinedClose;
      trueBtnIcon.value = "";
    }
    notebookSDK.quizManager.showVerificationButton()

    // Disable buttons after answer selection
  } else {
    // In edit mode, store correct answer
    if (data.value) {
      data.value.answer = answer;
      saveToStorage(data.value);
    }

    // Show correct answer icons
    if (answer) {
      trueBtnIcon.value = symOutlinedCheck;
      falseBtnIcon.value = "";
    } else {
      falseBtnIcon.value = symOutlinedClose;
      trueBtnIcon.value = "";
    }
  }
}

function deleteItem(index: number) {
  if (!data.value) return;

  data.value.data.splice(index, 1);
  saveToStorage(data.value);
}

function addContent(type: DataType["type"]) {
  if (!data.value) {
    data.value = {
      data: [],
      explanation: "",
    };
  }

  if (type == "text") {
    // Add empty text item to array
    data.value.data.push({
      type: type,
      data: "",
    });

    // Save immediately
    saveToStorage(data.value);

    // Focus on the newly created text element
    nextTick(() => {
      const textElements = document.querySelectorAll(".editable-text");
      if (textElements.length > 0) {
        const lastTextElement = textElements[
          textElements.length - 1
        ] as HTMLElement;
        lastTextElement.focus();
      }
    });
  } else {
    // Set current upload type for the dialog
    currentUploadType.value = type;
    uploadedFile.value = "";
    uploadError.value = "";
    uploadData.value = true;
  }
}

const isPublished = ref(false);
const $q = useQuasar();

notebookSDK.onReady((loadedData: TrueORFalseData | null) => {
  isPublished.value = notebookSDK.isPublished;

  if (isPublished.value) {
    // Published mode
    if (loadedData) {
      correctAnswer.value = loadedData.answer ?? null;
      // Remove answer from data to hide it from user
      data.value = { ...loadedData, answer: undefined };
    }

    // Setup quiz verification
    notebookSDK.quizManager.verifyAnswer = () => {
      const passed = userAnswer.value === correctAnswer.value;
      answered.value = true;
      return {
        passed: passed,
        next: true,
        points: passed ? 1 : 0,
      };
    };
    notebookSDK.quizManager.onTryAgain = () => {
      userAnswer.value = null;
      answered.value = null;
      trueBtnIcon.value = "";
      falseBtnIcon.value = "";
    };
  } else {
    // Edit mode
    if (loadedData) {
      data.value = loadedData;
      // Set icons based on existing answer
      if (data.value.answer !== undefined) {
        selectCorrectAnswer(data.value.answer);
      }
    } else {
      // Initialize with empty data structure
      data.value = {
        data: [],
        explanation: "",
      };
    }
  }
  return 1;
});

function saveToStorage(data: TrueORFalseData) {
  notebookSDK.saveContent(toRaw(data));
}
// Encode HTML special characters to prevent execution

function saveTextData(event: Event, index: number) {
  if (!data.value) return;

  const target = event.target as HTMLElement;

  // Use textContent to get plain text, then escape HTML
  const rawText = target.textContent || "";
  data.value.data[index].data = escapeHtml(rawText);
}

function saveExplanation(event: Event) {
  if (!data.value) return;

  const target = event.target as HTMLElement;
  data.value.explanation = escapeHtml(target.textContent) || "";
  
 
    saveToStorage(data.value!);

}


function removeItem(index: number) {
  if (!data.value) return;

  data.value.data.splice(index, 1);
  saveToStorage(data.value);
}

async function onDialogShow() {
  await nextTick();
  if (!containerRef.value) {
    return;
  }

  try {
    createFileUploadArea(containerRef.value, {
      expectedFileOutput: "string",
      acceptedFiles: [
        currentUploadType.value === "audio" ? "audio/*" : "image/*",
      ],
      maxSize: 1024 * 1024, // 1MB in bytes
      onDrag: () => {
        isDragging.value = true;
      },

      onDrop: () => {
        isDragging.value = false;
      },

      success: (base64: string | File) => {
        uploadedFile.value = base64 as string;
        uploadError.value = "";
      },
    });
  } catch (error) {
    $q.notify({
      type: "negative",
      message: "Error initializing upload area",
    });
    uploadError.value =
      error instanceof Error
        ? error.message
        : "Failed to initialize upload area";
  }
}

function saveUpload() {
  if (uploadedFile.value && data.value) {
    // Add uploaded file to data array
    data.value.data.push({
      type: currentUploadType.value,
      data: uploadedFile.value,
    });

    saveToStorage(data.value);

    // Reset dialog state
    uploadData.value = false;
    uploadedFile.value = "";
    uploadError.value = "";
    isDragging.value = false;
  }
}

function cancelUpload() {
  uploadData.value = false;
  uploadedFile.value = "";
  uploadError.value = "";
  isDragging.value = false;
}

// Clean up event listeners when component unmounts
onUnmounted(() => {
  uploadedFile.value = "";
  uploadError.value = "";
});

</script>

<style scoped>
.upload-area {
  border: 2px dashed #1976d2;
  border-radius: 10px;
  transition: all 0.3s ease;
  min-height: 200px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.upload-area.dragging {
  border-color: #4caf50;
  background-color: rgba(76, 175, 80, 0.1);
}

.upload-area:hover {
  background-color: rgba(25, 118, 210, 0.05);
}

.editable-text {
  min-height: 50px;

  border-radius: 4px;
  outline: none;
  cursor: text;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.editable-text:focus {
  box-shadow: 0 0 0 1px rgba(25, 118, 210, 0.2);
}

.editable-text:empty:before {
  content: attr(placeholder);
  color: #999;
  pointer-events: none;
}
</style>
