<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<script setup lang="ts">
import Button from "primevue/button";
import Card from "primevue/card";
import { nextTick, onMounted, ref, toRaw } from "vue";
import { createNotebookSDK } from "xulhub-sdk";
import CharacterCard from "./characterCard.vue";
import prompt, { processImport } from "./prompt";
// import type { ProcessImportOutPut } from "xulhub-sdk/src/types/bridge";
// import prompt from "./prompt";

const notebookSDK = createNotebookSDK({ height: "385px",hideFooter:true,hasAutoGen:true });
notebookSDK.contentGenerator = {
  contentType: "htmlElement",
  instructionFormat:prompt,
  processImport:processImport
};
const editMode = ref(!notebookSDK.isPublished);
const charList = ref<string[]>([""]);
//const currentChar = ref<string | null>(null);
const playing = ref(-1);

// Load content on ready
onMounted(() => {
  notebookSDK.onReady((data: string[]) => {
    console.log(data);
    editMode.value = !notebookSDK.isPublished;
    if (data) {
      charList.value = data
    }

    return 1;
  });
});

function playChar(char: string, index: number) {
  if (!char) return;
  const utter = new window.SpeechSynthesisUtterance(char);
  utter.lang = "zh-CN";
  playing.value = index;
  utter.onend = () => {
    playing.value = -1;
  };
  window.speechSynthesis.speak(utter);
}

function onInput(e: Event, i: number) {
  const textData = (e.target as HTMLDivElement).textContent || "";
  if (textData.length <= 1) {
    charList.value[i] = textData;
  } else {
    const char = textData.slice(0, 1);
    charList.value[i] = char;
    (e.target as HTMLDivElement).innerHTML = char;
  }
  save();
}

const reviewMode = ref(true);
async function reviewRender() {
  editMode.value = !editMode.value;
  await nextTick();
  if (charCardRefs.value) {
    // call quiz() on each component instance if present
    charCardRefs.value.forEach((c: any) => {
      if (c && typeof c.quiz === "function") {
        c.quiz();

      }
    });
  }

} // Character rendering

const charCardRefs = ref<(typeof CharacterCard)[]>([]);

function refresh(index: number) {
  if (charCardRefs.value == undefined) {
    return;
  }
  if (charCardRefs.value[index]) {
    charCardRefs.value[index].animate();
    
  }
}
function save() {
  notebookSDK.saveContent(toRaw(charList.value));
}

function addNewCard() {
  charList.value.push("");
  save();
}

function wrongStroke() {
  
  notebookSDK.quizManager.playIncorrectSound()
  
}

function correctStroke() {
    notebookSDK.quizManager.playCorrectSound()
}

const masteryList: number[] = [];

function completed(mastery: number) {
    masteryList.push(mastery);
    
    if (masteryList.length === charList.value.length) {
        const averageMastery = masteryList.reduce((a, b) => a + b, 0) / masteryList.length;
        const exercisePassed = averageMastery >= 0.7;
        notebookSDK.quizManager.submitAnswerResults({
            passed: exercisePassed,        // true if average ≥ 0.7
            points: exercisePassed ? 1 : 0, // 1 point if passed, 0 if failed
            next: true,
            playSound: false
        });
    
      notebookSDK.quizManager.completed()

    }
}

const strokeCount =  ref(0)

</script>

<template>
  <div class="p-1">
    <div>
      <div class="flex justify-end gap-2 mb-4" >
        <Button
          raised
          size="small"
          v-if="reviewMode && editMode"
          :label="editMode ? 'Review' : 'edit'"
          @click="reviewRender"
        />
        <Button icon="pi pi-plus" @click="addNewCard" v-if="editMode" />
      </div>
    </div>

    <div>
      <div
        class="flex flex-nowrap justify-center items-center gap-4 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 pb-2"
      >
        <!-- Character cards -->
        <div v-for="(item, index) in charList" :key="index" class="flex-shrink-0">
          <Card class="w-[250px]">
            <template #header>
              <div class="p-2 flex justify-between">
                <Button
                  size="small"
                  :severity="playing == index ? 'danger' : ''"
                  @click="playChar(item, index)"
                  rounded
                  :icon="playing == index ? 'pi pi-stop' : 'pi pi-volume-up'"
                >
                </Button>
                <div>
                  <Button
                    rounded
                    size="small"
                    @click="refresh(index)"
                    outlined
                    icon="pi pi-refresh"
                  ></Button>
                  <Button
                    rounded
                    size="small"
                    outlined
                    icon="pi pi-times"
                    @click="charList.splice(index, 1)"
                    v-if="editMode && index > 0"
                  ></Button>
                </div>
              </div>
            </template>

            <template #content>
              <div v-if="editMode">
                <div
                  contenteditable
                  @input="(v) => onInput(v, index)"
                  v-html="item"
                  class="min-h-[120px] text-3xl flex items-center justify-center outline-none"
                ></div>
              </div>
              <div v-else  class="flex flex-col items-center justify-center" >
                <CharacterCard :char="item" ref="charCardRefs" 
                @completed="completed"
                :edit-mode="editMode"
                @stroke-count="(e)=>strokeCount+= e"
                 @correct-stroke="correctStroke" 
                 @wrong-stroke="wrongStroke"
                 />
              </div>
            </template>
          </Card>
        </div>
      </div>
    </div>
  </div>
</template>
