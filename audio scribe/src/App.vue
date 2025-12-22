<script lang="ts" setup>
import { provide, ref, toRaw, } from 'vue';
import TableComponent from './components/TableComponent.vue';
import type { TableData } from './types';
import {symRoundedAdd} from '@quasar/extras/material-symbols-rounded'
import  {createNotebookSDK} from 'xulhub-sdk'
import prompt from './prompt'
import type { ProcessImportOutPut } from 'xulhub-sdk/src/types/bridge';
const data  = ref<TableData['contents']>([])
const answers = ref<string[]>([])
const notebook = createNotebookSDK({height:'340px',hasAutoGen:true,tryagain:true,hideCheckButton:false})
const instruction = ref('')
notebook.contentGenerator= {
  contentType:'htmlElement',
  instructionFormat:prompt,
  processImport:processImport
}




function processImport(input: HTMLElement | string): ProcessImportOutPut[] {
  const output: ProcessImportOutPut[] = [];
  
  // Handle string input (HTML string)
  let table: HTMLTableElement | null;
  if (typeof input === 'string') {
    const parser = new DOMParser();
    const doc = parser.parseFromString(input, 'text/html');
    table = doc.querySelector('table');
  } else {
    // Handle HTMLElement input
    table = input.querySelector('table');
  }
  
  if (!table) {
    console.warn('No table found in input');
    return output;
  }
  
  // Get all rows (skip header row if present)
  const rows = table.querySelectorAll('tr');
  const dataRows = Array.from(rows).slice(1); // Skip header row
  
  // Group data by group number
  const groups = new Map<number, TableData>();
  let currentInstruction = '';
  
  // Process each row
  dataRows.forEach(row => {
    const cells = row.querySelectorAll('td');
    if ( cells.length >= 4) {
      const spokenText = cells[0]!.textContent?.trim() || '';
      const expectedResponse = cells[1]!.textContent?.trim() || '';
      const langCode = cells[2]!.textContent?.trim() || 'en';
      const groupNum = parseInt(cells[3]!.textContent?.trim() || '1');
      const instruction = cells[4]?.textContent?.trim() || '';
      
      // Update current instruction if provided
      if (instruction) {
        currentInstruction = instruction;
      }
      
      // Initialize group if it doesn't exist
      if (!groups.has(groupNum)) {
        groups.set(groupNum, {
          instruction: currentInstruction,
          contents: []
        });
      }
      
      // Add content to group
      const group = groups.get(groupNum)!;
      group.contents.push({
        audio: {
          type: 'tts', // Default to TTS, you might want to detect this
          data: spokenText,
          lang: langCode
        },
        text: expectedResponse
      });
      
      // Ensure instruction is propagated to the group
      if (currentInstruction && group.instruction !== currentInstruction) {
        group.instruction = currentInstruction;
      }
    }
  });
  
  // Convert groups to output format
  groups.forEach((tableData) => {
    output.push({
      cellType: 'exercise',
      cellContent: tableData,
      text: null
    });
  });
  
  return output;
}
const isPublished = ref(false)
notebook.onReady((input:TableData|null)=>{
  isPublished.value = notebook.isPublished
if (input) {
 if (isPublished.value) {
    input.contents.map((v,i)=>{
answers.value[i] = v.text.toLowerCase()
v.text = ''
return v
    })
    notebook.quizManager.updateTotalScore(answers.value.length) 
    notebook.quizManager.showVerificationButton()
    notebook.quizManager.verifyAnswer = ()=>{
   const passed = data.value.map((v)=>v.text.toLocaleLowerCase()).filter((v)=>answers.value.includes(v)).length === answers.value.length
  passedRef.value = passed
   return {
passed,next:true,points: passed ?answers.value.length:0,
   }
}
  }
  data.value = input.contents
 
  instruction.value = input.instruction
}
})

function addRow() {
  data.value.push({
    text:'',
    audio:{
    'data':'',
    type:'tts'
  }})
  console.log(toRaw( data.value),'save')
  notebook.saveContent(toRaw( data.value))
}

function saveTableCell(index:number,updatedContent:TableData['contents'][0]) {
  data.value[index] = updatedContent
  saveData()

}

function deleteCell(index:number) {
  data.value.splice(index,1)
  saveData()

}
provide('saveTableCell',saveTableCell)
provide('deleteCell',deleteCell)
const passedRef = ref()
provide('passed',passedRef)

function saveData() {
  if (isPublished) {
    return
  }
      notebook.saveContent(toRaw( {
        instruction:instruction.value,
        content:data.value
      }))

}

const timeOut = ref()
function saveInstructions(e:InputEvent) {
  clearTimeout(timeOut.value)
timeOut.value = setTimeout(()=>{
const text = (e.target as HTMLDivElement).textContent
instruction.value  = text
saveData()
  },400)

}
</script>
<template>
  <div class="column q-pa-md items-center">
    <div style="max-width: 550px; width: 100%">
      <q-btn
        size="sm"
        unelevated
        label="add row"
        color="primary" v-if="!isPublished"
        :icon="symRoundedAdd"
        @click="addRow"
      />
      <div class="q-mt-md">
        <div class="text-bold text-subtitle1" @input="saveInstructions" :contenteditable="isPublished">
          {{ instruction }}
        </div>

        <table-component :data="data" :is-published="isPublished" />
      </div>
    </div>
  </div>
</template>

<style>

</style>
