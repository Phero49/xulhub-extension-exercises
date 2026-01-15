<template>
  <div class="publish-mode-container  fit column flex-center">
    <q-card class="shadow-10 overflow-hidden" style="width: 100%; max-width: 900px; border-radius: 16px;">

      <q-card-section class="bg-primary text-white q-py-sm row justify-between items-center">

        <div class="text-subtitle1 text-weight-medium">Drag the words to the correct blanks</div>
        <div>
          <q-btn flat :icon="matClose" v-if="isPreview" @click="emit('endPreviewMode')">
            <q-tooltip>
              close preview mode
            </q-tooltip>
          </q-btn>
        </div>

      </q-card-section>

      <!-- Konva Container -->
      <div ref="containerRef" id="konva-container" class="bg-white" style="width: 100%; height: 500px;"></div>

    </q-card>
  </div>
</template>

<script lang="ts" setup>
import { matClose } from '@quasar/extras/material-icons';
import Konva from 'konva';
import { ref, onMounted, nextTick, onUnmounted, watch } from 'vue';

const props = defineProps<{
  sentences: string[],
  isPreview: boolean,
}>();
const emit = defineEmits<{ endPreviewMode: [] }>();
const containerRef = ref<HTMLDivElement | null>(null);
const showResultDialog = ref(false);
const correctCount = ref(0);
const totalBlanks = ref(0);
const isChecked = ref(false);
const scorePercentage = ref(0);

let stage: Konva.Stage | null = null;
let layer: Konva.Layer | null = null;
let dragLayer: Konva.Layer | null = null;

// Store references to game objects
interface GapData {
  line: Konva.Line; // Changed from rect to line
  answer: string;
  currentWord: string | null;
  occupyingWordGroup: Konva.Group | null; // Track which group is in the gap
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}
let gaps: GapData[] = [];
let originalWordPositions: Map<string, { x: number, y: number }> = new Map();

onMounted(async () => {
  await nextTick();
  initKonva();
});

onUnmounted(() => {
  if (stage) stage.destroy();
});


watch(() => props.sentences, () => {
  resetExercise();
}, { deep: true });

function initKonva() {
  if (!containerRef.value) return;

  const width = containerRef.value.clientWidth;
  const height = 500;

  stage = new Konva.Stage({
    container: 'konva-container',
    width: width,
    height: height,
  });

  layer = new Konva.Layer();
  dragLayer = new Konva.Layer();
  stage.add(layer);
  stage.add(dragLayer);

  drawScene();
}
const fontSize = 16;

function drawScene() {
  if (!layer || !dragLayer || !stage) return;

  layer.destroyChildren();
  dragLayer.destroyChildren();
  gaps = [];
  originalWordPositions.clear();
  isChecked.value = false;

  const startX = 40;
  let currentY = 50;
  const lineHeight = 60;
  const gapWidth = 140;
  const gapHeight = 36;

  props.sentences.forEach((sentence, index) => {
    let currentX = startX;

    // Split by {word}
    const parts = sentence.split(/(\{[^}]+\})/g);

    parts.forEach(part => {
      if (part.startsWith('{') && part.endsWith('}')) {
        // It's a gap
        const answer = part.slice(1, -1);

        // Draw Gap Placeholder (Line instead of Box)
        const gapGroup = new Konva.Group({ x: currentX, y: currentY + fontSize });

        const gapLine = new Konva.Line({
          points: [0, 0, gapWidth, 0],
          stroke: '#94a3b8',
          strokeWidth: 2,
          name: 'gap-line'
        });

        gapGroup.add(gapLine);
        layer!.add(gapGroup);

        gaps.push({
          line: gapLine,
          answer: answer,
          currentWord: null,
          occupyingWordGroup: null,
          id: `gap-${index}-${answer}`,
          x: currentX,
          y: currentY - 8,
          width: gapWidth,
          height: gapHeight
        });

        currentX += gapWidth + 10;
      } else {
        const text = new Konva.Text({
          x: currentX,
          y: currentY,
          text: part,
          fontSize: fontSize,
          fontFamily: 'Inter, sans-serif',
          fill: '#334155',
        });
        layer!.add(text);
        currentX += text.width();
      }
    });

    currentY += lineHeight;
  });

  totalBlanks.value = gaps.length;

  // Create Draggable Words
  const allAnswers = gaps.map(g => g.answer);
  const shuffledAnswers = [...allAnswers].sort(() => Math.random() - 0.5);

  const wordBankY = currentY + 40;
  let wordX = 40;

  shuffledAnswers.forEach((word) => {
    createDraggableWord(word, wordX, wordBankY);
    const tempText = new Konva.Text({ text: word, fontSize: 18, padding: 10 });
    wordX += tempText.width() + 40;
    if (wordX > stage!.width() - 100) {
      wordX = 40;
    }
  });

  layer.batchDraw();
  dragLayer.batchDraw();
}

function createDraggableWord(word: string, x: number, y: number) {
  if (!dragLayer || !stage) return;

  const uniqueId = `word-${Math.random().toString(36).substr(2, 9)}`;
  const group = new Konva.Group({
    id: uniqueId,
    x: x,
    y: y,
    draggable: true,
    name: 'word-group'
  });

  const text = new Konva.Text({
    text: word,
    fontSize: fontSize,
    fontStyle: 'bold',
    fontFamily: 'Inter',
    fill: '#1976d2', // Primary
    padding: 10,
  });

  const rect = new Konva.Rect({
    width: text.width(),
    height: text.height(),
    fill: 'rgba(0,0,0,0)', // Invisible
    cornerRadius: 4,
  });

  group.add(rect);
  group.add(text);

  group.on('mouseover', () => {
    document.body.style.cursor = 'pointer';
    text.fill('#2196f3'); // Lighter primary on hover
    stage!.container().style.cursor = 'pointer';
    dragLayer!.batchDraw();
  });

  group.on('mouseout', () => {
    document.body.style.cursor = 'default';
    text.fill('#1976d2');
    stage!.container().style.cursor = 'default';
    dragLayer!.batchDraw();
  });

  group.on('dragstart', () => {
    group.moveToTop();
    text.scale({ x: 1.1, y: 1.1 });
  });

  group.on('dragmove', () => {
    const box = group.getClientRect();
    gaps.forEach(gap => {
      if (haveIntersection(box, gap)) {
        gap.line.stroke('#1976d2'); // Light up
        gap.line.strokeWidth(3);
      } else {
        gap.line.stroke('#94a3b8'); // Normal
        gap.line.strokeWidth(2);
      }
    });
    layer!.batchDraw();
  });

  const originalPos = { x, y };
  originalWordPositions.set(uniqueId, originalPos);

  group.on('dragend', () => {
    rect.scale({ x: 1, y: 1 });
    text.scale({ x: 1, y: 1 });
    rect.shadowBlur(4);

    const box = group.getClientRect();
    let snapped = false;

    // Find the current gap this word was in (if any)
    const previousGap = gaps.find(g => g.occupyingWordGroup === group);

    for (const gap of gaps) {
      if (haveIntersection(box, gap)) {
        // If gap is occupied by another word, push it back to pool
        if (gap.occupyingWordGroup && gap.occupyingWordGroup !== group) {
          const otherGroup = gap.occupyingWordGroup;
          const otherId = otherGroup.id();
          const otherOriginalPos = originalWordPositions.get(otherId);
          if (otherOriginalPos) {
            otherGroup.to({
              x: otherOriginalPos.x,
              y: otherOriginalPos.y,
              duration: 0.3,
              easing: Konva.Easings.EaseOut
            });
          }
        }

        // Snap to this gap
        group.position({
          x: gap.x + (gap.width - rect.width()) / 2,
          y: gap.y + (gap.height - rect.height()) / 2
        });

        // Update gap references
        if (previousGap) {
          previousGap.occupyingWordGroup = null;
          previousGap.currentWord = null;
        }
        gap.occupyingWordGroup = group;
        gap.currentWord = word;

        snapped = true;
        break;
      }
    }

    if (!snapped) {
      // Return to original position (pool)
      group.to({
        x: originalPos.x,
        y: originalPos.y,
        duration: 0.3,
        easing: Konva.Easings.EaseOut
      });
      // Clear from previous gap if it was in one
      if (previousGap) {
        previousGap.occupyingWordGroup = null;
        previousGap.currentWord = null;
      }
    }

    dragLayer!.batchDraw();

    // Reset all highlights after drag ends
    gaps.forEach(gap => {
      gap.line.stroke('#94a3b8');
      gap.line.strokeWidth(2);
    });
    layer!.batchDraw();
  });

  dragLayer.add(group);
}

function haveIntersection(r1: any, gap: GapData) {
  const r2 = { x: gap.x, y: gap.y, width: gap.width, height: gap.height };
  return !(
    r2.x > r1.x + r1.width ||
    r2.x + r2.width < r1.x ||
    r2.y > r1.y + r1.height ||
    r2.y + r2.height < r1.y
  );
}

function checkResult() {
  isChecked.value = true;
  let correct = 0;

  gaps.forEach(gap => {
    const isCorrect = gap.currentWord === gap.answer;
    if (isCorrect) correct++;
    gap.line.stroke(isCorrect ? '#4caf50' : '#f44336');
    gap.line.strokeWidth(3);
  });

  layer!.batchDraw();
  correctCount.value = correct;
  scorePercentage.value = Math.round((correct / totalBlanks.value) * 100);

  setTimeout(() => { showResultDialog.value = true; }, 500);
}

function resetExercise() {
  drawScene();
  showResultDialog.value = false;
  correctCount.value = 0;
  scorePercentage.value = 0;
}


defineExpose({
  resetExercise, checkResult
})
</script>
