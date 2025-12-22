export type DataType = {
  type: "text" | "image" | "audio";
  data: string;
};

export type TrueORFalseData = {
  data: DataType[];
  explanation: string;
  answer?: boolean;
};