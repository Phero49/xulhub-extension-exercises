<template>

  <div :class="{ 'border-box': !isPublished }" class="text-subtitle1 q-my-sm">
    <div
      :contenteditable="!isPublished"
      ref="editorRef"
      @blur="saveSelection"
      @focus="restoreSelection"
      @input="onInput"
      @keydown="handleKeydown"
      style="outline: none"
      v-add-text="{ data }"
    ></div>
  </div>

  <div class="q-gutter-x-sm" v-if="!isPublished">
    <q-btn
      size="sm"
      color="primary"
      :icon="symRoundedAdd"
      @click="emits('addNewLine', 'fillBlanks', '')"
    />
    <q-btn
      size="sm"
      color="primary"
      :icon="symRoundedFormatInkHighlighter"
      @click="addBlankArea"
    />
  </div>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import {
  symRoundedAdd,
  symRoundedFormatInkHighlighter,
} from "@quasar/extras/material-symbols-rounded";
import { escapeHtml } from "xulhub-sdk";
import { unescapeHtml } from "../../importExercise";
const props = defineProps<{ isPublished: boolean; data: string }>();
const emits = defineEmits<{
  addNewLine: ["fillBlanks", string];
  removeLine: [number];
  save: [string];
}>();
const answers = ref<string[]>([]);

const vAddText = {
  mounted: (el: HTMLElement, bind:any) => {
 
    const text = (bind.value.data as string)
      .replace("<blank>", "<span class='blank-area'> ")
      .replace("</blank>", "</span>");
    el.innerHTML = unescapeHtml(text);
    if (props.isPublished) {
      el.querySelectorAll("span").forEach((span, index) => {
        answers.value[index] = span.textContent;
        span.contentEditable = 'true'
        span.textContent = "";
      });
    }
  },
};

function verifyAnswer() {
  if (editorRef.value == undefined) {
    return;
  }
  const correct: boolean[] = [];
  const userAnswers = Array.from(editorRef.value.querySelectorAll("span"));
  answers.value.forEach((a, i) => {
    const userSpan = userAnswers[i];
if (userSpan == undefined) {
  return
}
    const passed =
      a.trim().toLowerCase() === userSpan.textContent.trim().toLowerCase();
    if (passed) {
      userSpan.classList.add("blank-area--correct");
    } else {
      userSpan.classList.add("blank-area--incorrect");
    }
    correct.push(passed);
  });
  return !correct.includes(false);
}
defineExpose({ verifyAnswer });

let blankIdCounter = 0;
let savedSelection: Range | null = null;

function onInput(e: Event) {
  const target = e.target as HTMLElement;
  emits("save", escapeHtml(target.innerHTML));
}

function saveSelection() {
  const selection = window.getSelection();
  if (selection?.rangeCount) {
    savedSelection = selection.getRangeAt(0).cloneRange();
  }
}

function restoreSelection() {
  if (!savedSelection) return;

  const selection = window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(savedSelection);
  savedSelection = null;
}

function addBlankArea() {
  const contentDiv = document.querySelector(
    '[contenteditable="true"]'
  ) as HTMLDivElement;
  if (!contentDiv) return;

  restoreSelection();

  const selection = window.getSelection();
  let range: Range;

  if (!selection?.rangeCount) {
    // Insert at end if no selection
    range = document.createRange();
    range.selectNodeContents(contentDiv);
    range.collapse(false);
  } else {
    range = selection.getRangeAt(0);
  }

  const blankId = `blank-${blankIdCounter++}`;
  const span = document.createElement("span");
  span.id = blankId;
  span.className = "blank-area text-center";
  span.contentEditable = "false";
  span.textContent = " "; // visible space inside
  span.style.cursor = "pointer";

  // Click to edit (optional)
  span.addEventListener("click", (e) => {
    e.stopPropagation();
    if (span.contentEditable === "false") {
      span.contentEditable = "true";
      span.focus();
    }
  });

  // Insert the span
  range.insertNode(span);

  // 🔑 Insert a space AFTER the span so user can type
  const spaceNode = document.createTextNode("\u00A0"); // non-breaking space, or use ' ' or '\u200B'
  span.parentNode?.insertBefore(spaceNode, span.nextSibling);

  // Move cursor after the space
  const newRange = document.createRange();
  newRange.setStartAfter(spaceNode);
  newRange.collapse(true);

  selection?.removeAllRanges();
  selection?.addRange(newRange);

  contentDiv.focus();
}
const editorRef = ref<HTMLDivElement | null>(null);
function handleKeydown(e: KeyboardEvent) {
  if (props.isPublished) return;

  const selection = window.getSelection();
  if (!selection?.rangeCount) return;

  const range = selection.getRangeAt(0);
  const startContainer = range.startContainer;
  const startOffset = range.startOffset;

  // Handle Backspace: delete previous node if it's a .blank-area
  if (e.key === "Backspace" && range.collapsed) {
    if (startOffset === 0 && startContainer !== editorRef.value) {
      // Look at previous sibling
      const prevNode = (startContainer as Node).previousSibling;
      if (
        prevNode &&
        prevNode.nodeType === Node.ELEMENT_NODE &&
        (prevNode as HTMLElement).classList.contains("blank-area")
      ) {
        e.preventDefault();
        prevNode.remove();
        return;
      }
    }
  }

  // Handle Delete: delete next node if it's a .blank-area
  if (e.key === "Delete" && range.collapsed) {
    const nextNode = (startContainer as Node).nextSibling;
    if (
      nextNode &&
      nextNode.nodeType === Node.ELEMENT_NODE &&
      (nextNode as HTMLElement).classList.contains("blank-area")
    ) {
      e.preventDefault();
      nextNode.remove();
      return;
    }
  }
}
</script>

<style>
.blank-area {
  display: inline-block;
  min-width: 50px;
  border-bottom: 2px solid;
  margin: 0 5px;
  min-height: 1em; /* match text height */
  vertical-align: baseline; /* align with text baseline */
  line-height: 1; /* prevent extra height */
  text-align: center;
  padding-top: 0.15em; /* optional: fine-tune vertical position */
  box-sizing: border-box;
  outline: none;
  border-bottom: 2px solid #4285f4;
  border-color: #666;
  font-weight: 800;
  background-color: #ffffff;
  color: #000;
  padding-left: 3px;
  padding-right: 3px;
}

/* ✅ Correct answer */
.blank-area--correct {
  border-color: #2ecc71 !important; /* green */
  background-color: #e8f7f0 !important;
  color: #27ae60 !important;
}

/* ❌ Incorrect answer */
.blank-area--incorrect {
  border-color: #e74c3c !important; /* red */
  background-color: #fdf2f2 !important;
  color: #c0392b !important;
}
</style>
