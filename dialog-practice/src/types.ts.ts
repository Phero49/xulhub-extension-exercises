export interface ChatMessage {
  id: number;
  text: string;
  name?: string;
  type: "text" | "audio";
  avatar?: string|null;
  sent: boolean;
  stamp: string;
  failed?:boolean
  persona: "A" | "B";
}

export type ChatContent = {
  mode: "type" | "selection";
  initiator: "A" | "B";
  persona: {
    A: { name: string; avatar: null | string };
    B: { name: string; avatar: null | string };
  };
  messages: ChatMessage[];
};