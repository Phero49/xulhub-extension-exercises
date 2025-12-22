<script setup lang="ts">
import { ref, nextTick, reactive, computed, toRaw, onMounted } from "vue";
import { QScrollArea, QBtn, QTooltip, useQuasar } from "quasar";
import { mdiHandPointingUp, mdiKeyboard } from "@quasar/extras/mdi-v5";
import { createNotebookSDK } from "xulhub-sdk";

import ChatBubble from "./components/ChatBubble.vue";
import PersonaSelector from "./components/PersonaSelector.vue";
import PersonaEditor from "./components/PersonaEditor.vue";
import MessageContextMenu from "./components/MessageContextMenu.vue";
import ChatInput from "./components/ChatInput.vue";
import type { ChatContent, ChatMessage } from "./types.ts";
import { checkTurn, processImport } from "./utils.ts";
import prompt from "./prompt.ts";

const notebook = createNotebookSDK({
  height: "400px",
  hasAutoGen: true,
  hideCheckButton: true,
  hideFooter: true,
});
const totalScore = ref(0)
const currentScore = ref(0)
notebook.onReady((data: ChatContent | null) => {
  if (data) {
    console.log(data,'recived')
    chatContents.messages = data.messages;
    chatContents.persona = data.persona;
    chatContents.mode = data.mode;
    chatContents.initiator = data.initiator;
  
  }
  isPublished.value = notebook.isPublished;
  if (isPublished) {  
    if (chatContents.mode === 'selection') {
      chatContentsCopy.value =  toRaw( chatContents)
    }
    setTimeout(() => {
      botWrite();
    }, 3000);
    totalScore.value = chatContents.messages.filter((v) => v.persona == "B").length
    return toRaw(totalScore.value) ;
  }
  return 0
});
notebook.contentGenerator = {
  contentType:'htmlElement',
  instructionFormat:prompt,
  processImport:processImport
}

const isPublished = ref(false);

const chatContents = reactive<ChatContent>({
  initiator: "A",
  mode: "type",
  persona: {
    A: { name: "Persona A", avatar: null },
    B: { name: "Persona B", avatar: null },
  },
  messages: [],
});

//a copy use in selection mode in case of a retry
const chatContentsCopy = ref<ChatContent>()

const emptyChat = reactive<ChatContent>({
  persona: { ...chatContents.persona },
  messages: [],
  mode: chatContents.mode,
  initiator: chatContents.initiator,
});

const activePersona = ref<"A" | "B">("A");
const chatScrollRef = ref<QScrollArea>();
const editPersona = ref(false);
const personaToModify = ref<"A" | "B">("A");
const showMenu = ref(false);
const menuTarget = ref<string>();
const menuTargetIndex = ref(-1);

function save() {
  notebook.saveContent(toRaw(chatContents));
}

function scrollToBottom() {
  nextTick(() => {
    if (chatScrollRef.value) {
      const v = chatScrollRef.value.getScroll().verticalSize;
      chatScrollRef.value.setScrollPosition("vertical", v + 50);
      guide.value = checkTurn(emptyChat,chatContents)
      if (emptyChat.messages.length === chatContents.messages.length) {
        notebook.quizManager.completed()
      }

    }
  });
}
const guide = ref('')
function botWrite() {
  const currentCount = emptyChat.messages.length;

  if (
    currentCount === 0 &&
    chatContents.initiator === "A" &&
    chatContents.messages[0]
  ) {
    const firstMessage = chatContents.messages[0];
    setTimeout(() => {
      emptyChat.messages.push({
        ...firstMessage,
        id: emptyChat.messages.length + 1,
      });
      nextTick(scrollToBottom);
    }, 1500);
  }

  let startIndex = currentCount;
  if (
    currentCount === 0 &&
    chatContents.initiator === "A" &&
    chatContents.messages[0]
  ) {
    startIndex = 1;
  }

  const botMessages: ChatMessage[] = [];
  for (let i = startIndex; i < chatContents.messages.length; i++) {
    const msg = chatContents.messages[i];
    if (!msg) break;
    if (msg.persona === "B") break;
    botMessages.push(msg);
  }

  botMessages.forEach((msg, index) => {
    setTimeout(() => {
      emptyChat.messages.push({ ...msg, id: emptyChat.messages.length + 1 });
      nextTick(scrollToBottom);
    }, (index + 1) * 1500 + 1000);
  });
}

function messagesList(content: ChatContent) {
  return content.messages.map((m) => {
    m["avatar"] = content.persona[m.persona].avatar || null;
    m["name"] = content.persona[m.persona].name;
    return m;
  });
}

const selectedMessage = computed(() => {
  if (
    menuTargetIndex.value >= 0 &&
    menuTargetIndex.value < chatContents.messages.length
  ) {
    return chatContents.messages[menuTargetIndex.value];
  }
  return null;
});

function openMessageOptions(selector: string, index: number) {
  if (isPublished.value) {
    return
  }
  menuTarget.value = selector;
  menuTargetIndex.value = index;
  showMenu.value = true;
}


function deleteMessage() {
  chatContents.messages.splice(menuTargetIndex.value, 1);
  resetMenu();
  save();
}

function convertToVoiceMail() {
  if (
    menuTargetIndex.value >= 0 &&
    menuTargetIndex.value < chatContents.messages.length
  ) {
    const msg = chatContents.messages[menuTargetIndex.value];
    if (msg == undefined) {
      return
    }
    msg.type = msg.type === "text" ? "audio" : "text";
    resetMenu();
    save();
  }
}

function resetMenu() {
  menuTarget.value = undefined;
  showMenu.value = false;
  menuTargetIndex.value = -1;
}
const $q =  useQuasar()
function sendMessage(text: string) {
  // Published mode - verify answer
  if (isPublished.value) {
    const index = emptyChat.messages.length;
    const expectedResponse = chatContents.messages[index];

    if (!expectedResponse) {
      // No more messages to verify
      return;
    }

    const normalizeText = (str: string) => {
      return (
        str
          .toLowerCase()
          // Use the Unicode property escape \p{P} for 'Punctuation'
          // The 'u' flag is mandatory for Unicode property escapes
          // We replace the punctuation with a space to help separate words that were previously joined by punctuation
          .replace(/\p{P}/gu, " ")
          // Also remove any special characters that aren't letters, numbers, or standard punctuation
          // (like currency symbols or math operators, which \p{P} doesn't cover)
          .replace(/[^a-z0-9\s]/gi, " ")
          .trim()
          .replace(/\s+/g, " ")
      ); // Normalize whitespace
    };
    const normalizedInput = normalizeText(text);
    const normalizedExpected = normalizeText(expectedResponse.text);
    const passed = normalizedInput === normalizedExpected;

    // Add the user's message to emptyChat
    const msg: ChatMessage = {
      id: emptyChat.messages.length + 1,
      text,
      type: "text",
      sent: expectedResponse.sent,
      stamp: "just now",
      persona: "B",
      name: chatContents.persona.B.name,
      avatar: chatContents.persona.B.avatar || '',
    };
    if (passed == false) {
      msg["failed"] = true;
      setTimeout(() => {
        emptyChat.messages.pop();
      }, 3500);
    }else{

currentScore.value ++ 

    }
    emptyChat.messages.push(msg);
    scrollToBottom();

    // Check if this was the last message
    const isLastMessage =
      emptyChat.messages.length === chatContents.messages.length;

    // Submit quiz results
    notebook.quizManager.submitAnswerResults({
      passed:passed,
      next: isLastMessage,
      points: passed ? 1 : 0,
      playSound: true,
    });

    // If correct and not the last message, trigger bot response
    if (passed && !isLastMessage) {
      setTimeout(() => {

        botWrite();
      }, 500);
    }

    return;
  }
  if ( chatContents.messages.length == 0 && activePersona.value != chatContents.initiator) {
    $q.notify({message:'for the first message initiator should send the first message',type:'warning',icon:undefined})
    return 
  }

  // Edit mode - add message normally
  const msg: ChatMessage = {
    id: chatContents.messages.length + 1,
    text,
    type: "text",
    sent:chatContents.messages.length == 0 ?true: activePersona.value === chatContents.messages[0]?.persona,
    stamp: "just now",
    persona: activePersona.value,
  };

  chatContents.messages.push(msg);
  save();
  scrollToBottom();
}

function handleSelectPersona(persona: "A" | "B") {
  activePersona.value = persona;

}

function handleEditPersona(persona: "A" | "B") {
  personaToModify.value = persona;
  editPersona.value = true;

}

function toggleMode() {
  chatContents.mode = chatContents.mode === "selection" ? "type" : "selection";
  save()
}

function updatePersona(persona: { name: string; avatar: string | null }) {
  chatContents.persona[personaToModify.value] = persona;

}

function updateInitiator(initiator: "A" | "B") {
  if (chatContents.messages.length > 0) {
    const currentInitiator = chatContents.messages[0]?.persona;
    if (currentInitiator !== initiator) {
      // Flip all sent values to swap visual appearance
      chatContents.messages.forEach((message) => {
        message.sent = !message.sent;
      });
    }
  }
  
  chatContents.initiator = initiator;
  save()
}
const chatInputRef = ref<typeof ChatInput>()
function editMessage() {
 if (chatInputRef.value) {
  console.log('updateText',)
  const text  = chatContents.messages[menuTargetIndex.value] 
  console.log(text)
  chatInputRef.value.editText(text?.text)
 } 
}

function saveEdit(text:string) {
  const t = chatContents.messages[menuTargetIndex.value]
  if (t) {
      t.text = text
save()
  }
}

const chatOptions = computed(() => {
  return chatContents.messages
    .filter((m) => m.persona === "B")
    .map((m) => m.text);
});

onMounted(() => {
notebook.reconnect()
});

async function onSave() {
  if (chatContents.persona[personaToModify.value].avatar != null) {
    if (!chatContents.persona[personaToModify.value].avatar?.startsWith('https')) {
    const url =  await notebook.uploadFile(chatContents.persona[personaToModify.value].avatar as string)
    chatContents.persona[personaToModify.value].avatar =  url
  }
  }
  save()

}

function onOptionSelected(text:string) {
  sendMessage(text)

}
</script>

<template>
  <div class="column items-center q-mx-md">
    <div class="row justify-between" style="width: 100%;" >
   <div class="text-bold text-capitalize text-primary guide-shake" v-if="guide && isPublished" >{{ guide }}</div>
<div class="text-bold text-capitalize text-yellow" v-if="isPublished">
  ⭐ {{ currentScore }}/{{ totalScore }}
</div>    
    </div>
       <MessageContextMenu
      v-model="showMenu"
      :target="menuTarget"
      :message-type="selectedMessage?.type"
      @delete="deleteMessage"
      @convert="convertToVoiceMail"
      @update:edit-message="editMessage"
    />

    <!-- Chat Area -->
    <q-scroll-area
      ref="chatScrollRef"
      class="chat-scroll"
      style="
        height: 100vh;
        max-height: 300px;
        max-width: 600px;
        width: 100%;
        border-bottom: 1px solid #eee;
      "
    >
      <div class="q-pa-md" style="max-width: 100%">
        <ChatBubble
          v-for="(msg, i) in messagesList(
            isPublished ? emptyChat : chatContents
          )"
          :key="i"
          :message="msg"
          :index="i"
          @hold="openMessageOptions"
        />

        <div
          v-if="chatContents.messages.length === 0 && !isPublished"
          class="q-pa-md q-mt-lg column items-center text-grey-7"
        >
          <div class="text-body1 q-mb-sm">👋 Welcome! To get started:</div>
          <div class="text-caption">
            <strong>Long press</strong> on profile icons to edit personas<br />
            Persona <strong>A</strong> will act as the bot (auto-replies)<br />
            Persona <strong>B</strong> represents the user/student
          </div>
        </div>
      </div>

      <div
        v-if="chatContents.initiator === 'B' && isPublished"
        class="text-center text-subtitle1 q-pa-md"
      >
        Start the dialog
      </div>
    </q-scroll-area>

    <!-- Controls -->
    <div class="q-gutter-x-sm q-mt-sm row" v-if="isPublished == false">
      <PersonaSelector
        :persona-a="chatContents.persona.A"
        :persona-b="chatContents.persona.B"
        :active-persona="activePersona"
        @select="handleSelectPersona"
        @edit="handleEditPersona"
      />

      <q-btn
        color="primary"
        :icon="chatContents.mode === 'type' ? mdiKeyboard : mdiHandPointingUp"
        round
        @click="toggleMode"
      >
        <q-tooltip>
          How you want the student to answer: typing or selecting the correct
          option
        </q-tooltip>
      </q-btn>
    </div>


    <!-- Input -->
    <ChatInput
      :mode="chatContents.mode"
      :options="chatOptions"
      @send="sendMessage" ref="chatInputRef"
      @update-text="saveEdit"
      @option-selected="onOptionSelected"
    />

    <!-- Persona Editor -->
    <PersonaEditor
      v-model="editPersona"
      :persona-key="personaToModify"
      :persona="chatContents.persona[personaToModify]"
      :initiator="chatContents.initiator"
      @update:persona="updatePersona"
      @update:initiator="updateInitiator"
      @save="onSave"
    />
  </div>
</template>

<style scoped>
.chat-scroll {
  max-width: 500px;
  width: 100%;
  margin: 0 auto;
}

.guide-shake {
  animation: shake 0.5s infinite;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-2px); }
  75% { transform: translateX(2px); }
}

</style>
