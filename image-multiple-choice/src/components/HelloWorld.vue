<script setup lang="ts">
import { computed, ref, toRaw } from "vue";
import { createNotebookSDK } from "xulhub-sdk";
import { QInput, QBtn, QCard, QImg, useQuasar } from "quasar";
import { processImport, prompt } from "../utils/utils";
import type { Question } from "../types";


/* -----------------------------------
   State
----------------------------------- */
const url = ref("");
const options = ref<Question>();
const selectedOptionIndex = ref<number>();
const placeholder = ref("paste image here or double click to select image");
const cardIndex = ref(-1);
const inputRef = ref<HTMLInputElement>();

/* -----------------------------------
   Notebook SDK Setup
----------------------------------- */
const notebook = createNotebookSDK({ height: "400px",hasAutoGen:true });
notebook.contentGenerator = {
  contentType:'htmlElement',
  instructionFormat:prompt,
  processImport:processImport
}
const ispublished = computed(() => notebook.isPublished);

/* -----------------------------------
   Utility: Shuffle options
----------------------------------- */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = shuffled[i]!;
    shuffled[i] = shuffled[j]!;
    shuffled[j] = tmp;
  }
  return shuffled;
}

/* -----------------------------------
   Quiz Verification
----------------------------------- */
const verifyAnswer = () => {
  let passed = false;

  if (selectedOptionIndex.value != null && options.value) {
    const correctIndex = options.value.options.findIndex(
      (v) => v.correct === true
    );
    passed = correctIndex === selectedOptionIndex.value;
  }


  return {
    passed,
    next: true,
    points: 1,
  };
};

/* -----------------------------------
   Notebook Ready Handler
----------------------------------- */
notebook.onReady(() => {
  const data = notebook.getContentData<Question | null>();
  options.value = data || {
    question: "",
    options: [{ image: "" }],
  };

  if (options.value) {
    options.value.options = shuffleArray(options.value.options);
  }

  notebook.quizManager.verifyAnswer = verifyAnswer;
  return 1
});

/* -----------------------------------
   Image Option Handlers
----------------------------------- */
function addNewOption() {
  if (!options.value) return;
  options.value.options.push({ image: "" });
}

function clearImage(index: number) {
  if (!options.value) return;
  options.value.options[index]!.image = "";
  save();
}

function deleteCared(index: number) {
  if (!options.value) return;
  options.value.options.splice(index, 1);
  save();
}

function ondoubleClick(index: number) {
  cardIndex.value = index;
  inputRef.value?.click();
}

async function onPaste(content: string, index: number) {
  if (!options.value) return;
  options.value.options[index]!.image = content;
  save();
}

/* -----------------------------------
   Image Upload + Compression
----------------------------------- */
function onchange(e: Event) {
  const MAX_BYTES = 700 * 1024;

  // Convert file to base64
  function fileToDataURL(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Convert blob to base64
  function blobToDataURL(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  // Compress image by reducing quality + scaling
  async function compressImageFile(
    file: File,
    maxBytes: number
  ): Promise<string> {
    const dataUrl = await fileToDataURL(file);

    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = dataUrl;
    });

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    let width = img.width;
    let height = img.height;

    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(img, 0, 0, width, height);

    // Repeated attempts: lower quality -> scale down -> repeat
    for (let scaleAttempts = 0; scaleAttempts < 6; scaleAttempts++) {
      for (let q = 0.9; q >= 0.4; q -= 0.1) {
        const blob = await new Promise<Blob | null>((res) =>
          canvas.toBlob(res, "image/jpeg", q)
        );
        if (!blob) continue;
        if (blob.size <= maxBytes) return await blobToDataURL(blob);
      }

      width = Math.floor(width * 0.8);
      height = Math.floor(height * 0.8);
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);
    }

    const finalBlob = await new Promise<Blob | null>((res) =>
      canvas.toBlob(res, "image/jpeg", 0.4)
    );

    if (!finalBlob) throw new Error("Unable to compress image");
    return await blobToDataURL(finalBlob);
  }

  // Main upload handler
  (async () => {
    try {
      const input = e.target as HTMLInputElement;
      const files = input?.files;
      if (!files || !files.length) return;

      const file = files[0];
      if (file == null) {
        return;
      }
      if (!file.type.startsWith("image/"))
        
        return useQuasar().notify({message:"Please select an image file",type:'negative'})
      if (cardIndex.value < 0) return useQuasar().notify({message:"No target card selected",type:'negative'});

      let dataUrl: string;

      // Compress if needed
      if (file.size <= MAX_BYTES) {
        dataUrl = await fileToDataURL(file);
      } else {
        dataUrl = await compressImageFile(file, MAX_BYTES);
        const approxSize = Math.ceil(
          ((dataUrl.length - dataUrl.indexOf(",") - 1) * 3) / 4
        );
        if (approxSize > MAX_BYTES) {
          return  useQuasar().notify({message: "Image could not be reduced below 700 KB.",type:"negative"});
        }
      }

      // Save result
      if (options.value) {
        options.value.options[cardIndex.value]!.image = dataUrl;
        save();
      }

      input.value = "";
    } catch (err) {
      console.error(err);
      useQuasar().notify({message: "Failed to process image"});
    }
  })();
}

/* -----------------------------------
   Option Selection (Correct Answer)
----------------------------------- */
function toggleSelected(index: number) {
  if (!options.value) return;

  selectedOptionIndex.value = index;

  // Editing mode
  if (!ispublished.value) {
    options.value.options[index]!.correct =
      !options.value.options[index]!.correct;
          save()
  } else {
    notebook.quizManager.showVerificationButton();
    return
  }

  // If option is set correct, unselect others
  if (options.value.options[index]!.correct) {
    options.value.options.forEach((opt, i) => {
      if (i !== index) opt.correct = false;
    });
  }

}

/* -----------------------------------
   Save Handlers
----------------------------------- */
function save() {
  const raw = toRaw(options.value);
  notebook.saveContent(raw);
}

function saveQuestion(e: InputEvent) {
  if (!options.value) return;
  options.value.question = (e.target as HTMLDivElement).innerText;
  save();
}

function focus(e: Event) {
  if (!options.value) return;
  if (options.value.question.length === 0) {
    (e.target as HTMLElement).innerHTML = "";
  }
}
</script>

<template>
  <div class="q-pa-md" v-if="options">
    <div class="text-center">
      <div
        :contenteditable="!ispublished"
        class="question text-center"
        style="font-family: 'Agbalumo', system-ui; outline: none"
        @input="saveQuestion"
        @focus="focus"
      >
        {{ options.question.length === 0 ? "write here" : options.question }}
      </div>

      <div class="column items-center">
        <div style="max-width: 380px; width: 100%">
          <div class="row items-stretch">
            <div
              v-for="(item, index) in options?.options"
              class="col-6 q-pa-sm"
              style="cursor: pointer"
            >
              <q-card
                :class="{
                  selected:
                    (item.correct && !ispublished) ||
                    (ispublished && selectedOptionIndex == index),
                }"
                :key="index"
                style="width: 100%; border-radius: 15px; height: 100%"
              >

                <span
                  v-if="item.image.length > 0"
                  style="cursor: pointer"
                  @click.stop="toggleSelected(index)"
                > 
                  <q-img
                    :src="item.image"
                    spinner-color="primary"
                    style="border-radius: 15px;min-height: 100px;"
                    fit="contain"
                  
                    @error="(e)=>{

                      (e.target as any) .src = 'https://placehold.co/600x400'
                    }"
                  >
                    <div
                      v-if="ispublished == false"
                      class="bg-transparent q-pa-none"
                    >
                      <span>
                        <q-btn
                          round
                          size="sm"
                          v-if="
                            options?.options.length < 4 &&
                            options?.options.length == index + 1
                          "
                          dense
                          icon="bi-plus"
                          color="blue"
                          @click="addNewOption"
                        />
                        <q-btn
                          round
                          color="blue-8"
                          dense
                          size="sm"
                          @click="clearImage(index)"
                          icon="bi-arrow-clockwise"
                        />
                        <q-btn
                          class="q-mx-xs"
                          @click="deleteCared(index)"
                          round
                          color="red-8"
                          dense
                          size="sm"
                          icon="bi-x"
                        />
                      </span>
                    </div>
                  </q-img>
                </span>

                <div
                  class="text-center q-pa-sm"
                  @focus="placeholder = ''"
                  @blur="placeholder = 'paste image here'"
                  style="width: 100%; outline: none; padding: 10px"
                  v-else
                  @dblclick="ondoubleClick(index)"
                >
                  <q-input
                    v-model="url"
                    @update:model-value=""
                    :placeholder="placeholder"
                  >
                    <template #append>
                      <span vertical align="center">
                        <q-btn
                          color="primary"
                          icon="bi-plus"
                          flat
                          dense
                          @click="onPaste(url, index)"
                        />
                        <q-btn
                          color="primary"
                          icon="bi-camera"
                          flat
                          dense
                          @click="inputRef?.click()"
                        />
                      </span> </template
                  ></q-input>
                </div>
                <p :contenteditable="!ispublished" v-if="item.label">
                  {{ item.label }}
                </p>
              </q-card>
            </div>
            <div></div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <input
    @change="onchange"
    ref="inputRef"
    v-show="false"
    type="file"
    accept="image/*"
  />
</template>

<style scoped>
.question {
  font-size: clamp(1.2rem, 4vw, 2rem); /* responsive font size */
  margin-bottom: 16px;
  flex-shrink: 0;
}
.selected {
  border: 2px solid #22c55e;
  box-shadow: 0 4px 20px rgba(34, 197, 94, 0.25);
  position: relative;
  overflow: hidden;
}
</style>
