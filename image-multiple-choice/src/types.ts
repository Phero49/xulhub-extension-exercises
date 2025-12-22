export interface Question {
  question: string;
  options: {
    label?: string;
    image: string;
    correct?: boolean;
  }[];
}
