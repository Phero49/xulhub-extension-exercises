<template>
  <div  :class="{'border-box':!isPublished}" class="  text-line justify-between items-center row" >
    <div
      class="text-subtitle1 q-my-sm "
      v-find-underline ref="containerRef"
      @input="onInput"
      :contenteditable="!isPublished" v-add-text="{data:data}"
    >
    
    </div>
    <div>
      <q-btn
      color="positive"
      :icon="symRoundedFormatUnderlined"
      unelevated
      round
      @click="toggleUnderline"
      size="sm"
      dense
  >
<q-tooltip>
  select where you want to underline before underlining
</q-tooltip>
</q-btn>
    </div>
  </div>
  <div class=" q-mt-sm q-gutter-sm" >
    <q-btn
      color="primary"
      :icon="symRoundedAdd" v-if="!isPublished"
      dense
      unelevated
      size="sm"
      @click="emits('addNewLine', 'underline', '')"
    />
    
  </div>
</template>

<script lang="ts" setup>

import { symRoundedAdd, symRoundedFormatUnderlined } from "@quasar/extras/material-symbols-rounded";
import { QBtn } from "quasar";
import { ref } from "vue";
import { escapeHtml } from "xulhub-sdk";
import { unescapeHtml } from "../../importExercise";
const props = defineProps<{ isPublished: boolean; data: string }>();
const emits = defineEmits<{
  addNewLine: ["underline", string];
  removeLine: [number];
  save:[string]
}>();
const underlinedText = ref<string[]>([])
const containerRef= ref<HTMLDivElement>()
const vFindUnderline = {
  mounted: (el: HTMLElement) => {
    el.querySelector("u");
  },
};

const vAddText = {
    mounted:(el:HTMLElement,bind:any)=>{
       el.innerHTML =unescapeHtml(bind.value.data)
       if (props.isPublished) {
        el.querySelectorAll('u').forEach((u)=>{
          underlinedText.value.push(u.textContent)
         const uContent = u.innerHTML
         u.outerHTML = uContent
        })
       }
    }
}

function verifyAnswer() {
  let correct:boolean[] = []
  if (containerRef.value == undefined) {
    return
  }
  const underLineText = Array.from( containerRef.value.querySelectorAll('u'))
  underlinedText.value.forEach((u,i)=>{
  const el =underLineText[i]
  if (el == undefined) {
    return 
  }
  const passed =   u == el.textContent
  if (passed) {
  el.style.textDecorationColor = '#04e704'
  }else{
     el.style.textDecorationColor = '#e70404'
 
  }
    correct.push(passed)
  })
return !correct.includes(false)
}
defineExpose({verifyAnswer})

function onInput(e: Event) {
  const target = e.target as HTMLElement;
  emits('save',  escapeHtml( target.innerHTML))
    
}

function toggleUnderline() {
  if (props.isPublished ) {

    // For published mode, temporarily enable contenteditable on the entire container
    const contentContainer = containerRef.value
    if (!contentContainer) return;
    
    // Save current selection
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    
    // Temporarily enable editing
    contentContainer.contentEditable = 'true';
    contentContainer.style.outline = 'none'
    contentContainer.focus();
    
    // Restore selection
    selection.removeAllRanges();
    selection.addRange(range);
    
    try {
      (document as any).execCommand("underline");
    } catch {
      const u = document.createElement("u");
      u.appendChild(range.extractContents());
      range.insertNode(u);
      selection.removeAllRanges();
      const newRange = document.createRange();
      newRange.setStartAfter(u);
      newRange.collapse(true);
      selection.addRange(newRange);
    } finally {
      // Always disable contenteditable after operation
      setTimeout(() => {
        contentContainer.contentEditable = 'false';
      }, 0);
    }
  } else {
    // Original logic for non-published mode
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    let node: Node | null = range.commonAncestorContainer;
    if (node.nodeType === 3) node = node.parentNode;
    const editable = (node as HTMLElement | null)?.closest?.(
      '[contenteditable="true"], [contenteditable]'
    );

    if (!editable) return;

    try {
      (document as any).execCommand("underline");
    } catch {
      const u = document.createElement("u");
      u.appendChild(range.extractContents());
      range.insertNode(u);
      selection.removeAllRanges();
      const newRange = document.createRange();
      newRange.setStartAfter(u);
      newRange.collapse(true);
      selection.addRange(newRange);
    }
  }
}


</script>

<style >
.text-line u {
  text-decoration-line: underline;
  text-decoration-color: #e3e704; /* bright yellow */
  text-decoration-thickness: 3px;
  -webkit-text-decoration-thickness: 3px;
  text-underline-offset: 3px;
  font-weight: 700;
}
.delete-line {
  border: 1px solid red;
  padding: 5px;
  border-radius: 15px;
}
</style>
