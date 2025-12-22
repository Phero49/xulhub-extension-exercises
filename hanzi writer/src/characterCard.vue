<!-- eslint-disable @typescript-eslint/no-unused-vars -->
<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<template>
  <div>
      <div ref="reference"></div>

  </div>
<div style="width: 100%;" v-if="!editMode">
  <ProgressBar  style="height: 10px;" :value="Math.round(mastery)"></ProgressBar>
  <div class="text-gray-400 text-center" style="font-size: small;" >  mastery </div>
</div>



</template>

<script lang="ts" setup>
import ProgressBar from "primevue/progressbar";
import { nextTick, onMounted, ref } from "vue";

// grab props without making a ceremony out of it
const { char, editMode } = defineProps<{ char: string; editMode: boolean }>();

// parent will catch this because apparently we all love event bubbles
const emit = defineEmits<{
  (e: "strokeCount", count: number): void;
  (e: "quizStart"): void;
  (e: "correctStroke", strokeNumber: number): void;
  (e: "wrongStroke", strokeNumber: number): void;
  (e: "completed", mastery: number): void;
}>();

const reference = ref<HTMLDivElement>();
const characterCanvas = ref<HTMLCanvasElement>();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const writer = ref<any>(null); // sadly HanziWriter is basically 'any'

export interface StrokeData {
  strokes:    string[];
  medians:    Array<Array<number[]>>;
  radStrokes: number[];
}


export interface QuizResults {
  character:        string;
  strokeNum:        number;
  mistakesOnStroke: number;
  totalMistakes:    number;
  strokesRemaining: number;
  drawnPath:        DrawnPath;
  isBackwards:      boolean;
}

export interface DrawnPath {
  pathString: string;
  points:     Point[];
}

export interface Point {
  x: number;
  y: number;
}

const mastery = ref(0)
const totalStrokes = ref(0)
// render the character into the given element
function renderCharacter(id: HTMLElement, char: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  writer.value = (window as any).HanziWriter.create(id, char, {
    width: 160,
    height: 200,
    padding: 10,
    showOutline: true,
    delayBetweenStrokes: 1000,
    strokeColor: "#ff0000",
    highlightColor:'rgb(0, 183, 255)',
    drawingWidth:'10px',
    showHintAfterMisses:2,
    strokeHighlightSpeed:1,
    acceptBackwardsStrokes:true,
    displayMode: "canvas",
    targetCanvas: characterCanvas.value,

    // user draws a correct stroke
     
    onCorrectStroke: (strokeData: QuizResults) => {
      if (!(strokeData.mistakesOnStroke >= 2)) {
     const chunk  = 100/totalStrokes.value
    
   
    mastery.value += chunk 
      }
      // strokeData.strokeNum gives stroke index
      // You can emit here if you want:
      emit("correctStroke", strokeData.strokeNum);
    },

    // user draws something wrong
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onMistake: (strokeData: any) => {
      // strokeData.mistakeType tells you the type
      emit("wrongStroke", strokeData);
    },
onLoadCharDataSuccess:(data:StrokeData)=>{
   totalStrokes.value =data.strokes.length
  emit('strokeCount',data.strokes.length)
},
    // entire character completed correctly

    onLoadFailure: () => {
      console.error(`Failed to load character "${char}"`);
    },
  });
}

const startRendering  = () => {
  if (reference.value) {
    mastery.value = 0
    reference.value.innerHTML = ''
    renderCharacter(reference.value, char);
    if (!editMode) {
      nextTick().then(() => {


        quiz();
      });
    }
  }
}
// mount logic: render the thing before it changes its mind
onMounted(startRendering);

// animate the whole character
function animate() {
  writer.value?.animateCharacter({
    onComplete:()=>{
      if (!editMode) {
     startRendering() 
      }
    }
  });
}

// quiz mode, but also tell parent “quiz has begun”
function quiz() {
  emit("quizStart");

  writer.value?.quiz({
   
    onComplete:()=>{
      emit('completed',mastery.value)
    }
  });
}

function onScreenshot() {}
// expose to parent so it can poke at this component from outside
defineExpose({ animate, quiz, onScreenshot });
</script>

<style>

  u{
    color: rgb(224, 129, 20);
  }
</style>
