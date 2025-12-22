<script lang="ts" setup>
//import { QSelect } from "quasar";
import { ComponentPublicInstance, nextTick, reactive, ref, toRaw } from "vue";
//import { matArrowDownward } from "@quasar/extras/material-icons";
import UnderlineExercise from "./src/components/underlineExercise.vue";
import FillBlank from "./src/components/fillBlank.vue";
import ModifyText from "./src/components/modifyText.vue";
import {
  symRoundedArrowDropDown,
  symRoundedClose,
  symRoundedMoveDown,
} from "@quasar/extras/material-symbols-rounded";
import { createNotebookSDK } from "xulhub-sdk";
import importExercise, { ExerciseType, ExpectedData, processImport } from "./importExercise";
import {QBtn} from 'quasar'
const isPublished = ref(false);
const notebookSDK = createNotebookSDK({ height: "350px",hasAutoGen:true });

notebookSDK.onReady((data: ExpectedData[] | null) => {
  isPublished.value = notebookSDK.isPublished;
  if (data && data.length > 0) {
    contentData.value = data;
    
  }
  if (isPublished.value) {
    notebookSDK.quizManager.showVerificationButton()
    notebookSDK.quizManager.verifyAnswer = verifyAnswer
    notebookSDK.quizManager.onTryAgain = tryAgain
  }

  return contentData.value.length;
});

notebookSDK.contentGenerator = {
  contentType:'htmlElement',
  instructionFormat: importExercise,
  processImport: processImport,
}

function saveData() {

  notebookSDK.saveContent(toRaw(contentData.value));
}

const contentData = ref<ExpectedData[]>([]);
const exercisesList = ["underline", "fillBlanks", "modifyText"];
function addNewLine(type: ExerciseType, value: string, index: number) {
  contentData.value = [
    ...contentData.value.slice(0, index + 1),
    { type, data: value },
    ...contentData.value.slice(index + 1)
  ];
  //saveData();
}


function saveText(text: string, index: number) {
  if (isPublished) {
    return
  }
  setTimeout(() => {
    contentData.value[index].data = text;
  }, 300);
  saveData()
}
function saveModifyAnswer(text: string, index: number) {
    if (isPublished) {
    return
  }
  setTimeout(() => {
    contentData.value[index].answer = text;
  }, 300);
  saveData()
}


function onItemClick(exercise: string) {
  contentData.value.push({ type: exercise as ExerciseType, data: "" });
  saveData();
}

function deleteItem(index:number) {
  contentData.value.splice(index,1)
  saveData()
}

const componentRefs = ref<(typeof FillBlank)[]>([])
const tryAgain  = async ()=>{
const copy =  contentData.value
contentData.value = []
await nextTick()
contentData.value = copy
}
const verifyAnswer = () => {
  const allPassed: boolean[] = [];
  let totalPoints = 0;
  
  componentRefs.value.forEach((el) => {
   if (verifyAnswer == undefined) {
    return
   }
    const result = el.verifyAnswer();
    allPassed.push(result);
    totalPoints += result.points || 0;
  });
  

  const passedCount = allPassed.filter(p => p).length;
  const totalExercises = allPassed.length;
  
  // Small exercise groups (≤5): require 100% correct
  let overallPassed = false;
  if (totalExercises <= 5) {
    overallPassed = passedCount === totalExercises;
  }
  else if (totalExercises <= 8){
     overallPassed = (passedCount / totalExercises) >= 0.9;
  }
  else {
    // For larger groups: require ≥80%
    overallPassed = (passedCount / totalExercises) >= 0.8;
  }
  
  return {
    passed: overallPassed,
    points: totalPoints,
    next: overallPassed // Only proceed if passed
  };
};
</script>
<template>
  <div class="column items-center q-my-md">
    <div style="max-width: 550px; width: 100%">
      <div v-if="!isPublished">
        <q-btn-dropdown
          :dropdown-icon="symRoundedArrowDropDown"
          no-caps
          label="Add Exercise" size="sm"
          color="primary" unelevated
        >
          <q-list separator >
            <q-item
              class="text-capitalize"
              clickable
              @click="onItemClick(item)"
              v-for="(item, index) in exercisesList"
              :key="index"
              v-close-popup
            >
              <q-item-section>
                <q-item-label>{{ item }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-btn-dropdown>
      </div>

      <div class="text-subtitle1"   >
        <div
          v-for="(exercise, index) in contentData"
          :key="index"
          class="row item-center"
        >
        <div class="q-mt-lg" >
            <span class="q-mr-sm text-bold text-grey " >{{ index+1 }}.</span>
        </div>
        <div class="col-grow" >
           <div  class="q-mt-md row " >

             <div :class="[
          {
            'col-11':!isPublished
          }, {
            'col-12':isPublished
          },
        ]" >
   
       
  <template v-if="exercise.type == 'underline'"> 
            <UnderlineExercise
              :isPublished="isPublished"
              :data="exercise.data"
              @add-new-line="addNewLine('underline', '', index)"
              @save="saveText($event, index)"
              :ref="(el)=>componentRefs[index] = (el as any)"
            />
          </template>

          <template v-if="exercise.type.startsWith('fill')">
            <FillBlank
              :ref="(el)=>componentRefs[index] = (el as any)"

              :isPublished="isPublished"
              :data="exercise.data"
              @save="saveText($event, index)"
              @add-new-line="addNewLine('fillBlanks', '', index)"
            />
          </template>

          <template v-if="exercise.type.includes('modify')">
            <ModifyText
              :ref="(el)=>componentRefs[index] = (el as any)"

              :isPublished="isPublished"
              @save="saveText($event, index)"
              @save-answer="saveModifyAnswer($event,index)"
              :data="exercise"
              @add-new-line="addNewLine('modifyText', 'nn', index)"
            />
          </template>
        </div>
        <div class="col-1 q-mt-lg text-right" v-if="!isPublished" >
          <q-btn color="negative" dense :icon="symRoundedClose" size="sm"  round  @click="deleteItem(index)" />
        </div>
        </div>
        <q-separator color="grey" spaced v-if="isPublished"  />
        </div>

       
       
        </div>
      </div>
    </div>
  </div>
</template>

<style></style>
