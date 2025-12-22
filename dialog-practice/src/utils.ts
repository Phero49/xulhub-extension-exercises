import type { ProcessImportOutPut } from "xulhub-sdk/src/types/bridge";
import type { ChatContent, ChatMessage } from "./types.ts";

export function checkTurn(emptyChat: ChatContent, originalChat: ChatContent) {
   const emptyChatLength = emptyChat.messages.length
   if (emptyChatLength === 0) {
     if(originalChat.initiator === 'B'){
       return 'start the conversation' // Human starts first
     }
     return 'wait for your turn' // Bot starts first
   }
   
   const nextPersona = originalChat.messages[emptyChatLength]?.persona
   if (nextPersona === 'B') {
     return 'Your turn' // Human's turn to respond
   }
   if (emptyChatLength == originalChat.messages.length) {
    return 'you have completed the dialog '
   }
   return 'wait for your turn' // Bot's turn to respond
}


export function processImport(input: HTMLElement | string): ProcessImportOutPut[] {
    const output: ProcessImportOutPut[] = [];
    
    // Handle both string and HTMLElement input
    let element: HTMLElement;
    if (typeof input === 'string') {
        const parser = new DOMParser();
        const doc = parser.parseFromString(input, 'text/html');
        element = doc.body;
    } else {
        element = input;
    }

    // Process all tables
    const tables = element.querySelectorAll('table');
    
    tables.forEach((table) => {
        const rows = table.querySelectorAll('tr');
        const messages: ChatMessage[] = [];
        
        // Skip header row and process data rows
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (!row) continue;
            
            const cells = row.querySelectorAll('td');
            const firstCell = cells[0];
            const secondCell = cells[1];
            
            if (firstCell && secondCell) {
                const messageText = firstCell.textContent?.trim() || '';
                const personaText = secondCell.textContent?.trim();
                const persona = (personaText === 'A' || personaText === 'B') ? personaText : 'A';
                
                // Map table data to ChatMessage interface
                const chatMessage: ChatMessage = {
                    id: i,
                    text: messageText,
                    type: "text",
                    sent: persona === "B",
                    stamp: new Date().toISOString(),
                    persona: persona,
                    name: persona === "A" ? "Persona A" : "Persona B"
                };
                
                // Handle TTS
                const ttsCell = cells[2];
                if (ttsCell) {
                    const ttsValue = ttsCell.textContent?.trim();
                    if (ttsValue === 'yes') {
                        // Handle TTS logic here
                    }
                }
                
                // Handle lang
                const langCell = cells[3];
                if (langCell) {
                    const langValue = langCell.textContent?.trim();
                    if (langValue) {
                        // Store lang for TTS
                    }
                }
                
                messages.push(chatMessage);
            }
        }
        
        // Determine initiator safely
        const firstMessage = messages[0];
        const initiator = firstMessage?.persona || "A";
        
        // Create ChatContent object
        const data: ChatContent = {
            initiator: initiator,
            mode: "type",
            persona: {
                A: { name: "Persona A", avatar: null },
                B: { name: "Persona B", avatar: null },
            },
            messages: messages
        };

        output.push({
            cellType: 'exercise',
            cellContent: data,
            text: 'write the task here'
        });
    });
    return output;
}