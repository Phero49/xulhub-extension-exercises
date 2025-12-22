import type { ProcessImportOutPut } from "xulhub-sdk/src/types/bridge";

export default `
To Create grammar exercises using a table with the following columns:
1. instructions
2. question/statement
3. exercise type
4. expected answer

Exercise types: fill blank, underline, modify text.

Formatting rules:
- For fill blank wrap the target answer with:
  <blank>blank answer</blank>   
  - For  underline exercises, wrap the target answer with:
  <u>underline text</u>  
- For modify text exercises, write the corrected or modified version directly in the expected answer column.

Notes:
- The instructions column appears once per group of related exercises.
- expected answer column is only needed for modify text
`;

export type ExerciseType = "underline" | "fillBlanks" | "modifyText";

export type ExpectedData = {
  type: ExerciseType;
  data: string; // For fill blanks / underline, this holds the wrapped answer
  answer?: string; // For modify text, this holds the corrected output
};

export function processImport(
  input: HTMLElement | string
): ProcessImportOutPut[] {
  const output = [] as ProcessImportOutPut[];

  // Step 1: locate the tables in the input.
  // If input is HTML, parse it. If it's a selector string, query it.
  // Keeping this generic since you didn't specify your parsing utility.
  const root =
    typeof input === "string" ? document.querySelector(input) : input;

  if (!root) return output;

  const tables = root.querySelectorAll("table");

  tables.forEach((table) => {
    const rows = table.querySelectorAll("tr");
    const questionList: ExpectedData[] = [];

    let instructions = "";

    rows.forEach((row, index) => {
      if (index == 0) {
        return;
      }
      const cells = row.querySelectorAll("td");
      // Expecting: instructions | question/statement | type | expected answer
      if (cells.length < 4) return;
      if (!instructions) {
        instructions = cells[0]?.textContent?.trim() ?? "";
      }

      const statement = cells[1]?.textContent?.trim() ?? "";
      const type = cells[2]?.textContent?.trim() as ExerciseType;
      const expected = cells[3]?.textContent?.trim() ?? "";

      const exerciseData: ExpectedData = {
        type,
        data: statement,
      };

 

      // Modify text: expected goes to "answer"
      if (type.includes("modify")) {
        exerciseData.answer = expected; // corrected version
      }
      questionList.push(exerciseData);
    });
    output.push({
      cellType: "exercise",
      text: instructions || "write instruction for this exercise",
      cellContent: questionList,
    });
  });

  return output;
}

export function unescapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&#39;": "'",
    "&#96;": "`",
  };

  return text.replace(
    /&(amp|lt|gt|quot);|&#(39|96);/g,
    (entity) => map[entity] ?? entity
  );
}
