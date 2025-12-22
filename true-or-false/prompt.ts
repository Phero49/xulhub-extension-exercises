import { ProcessImportOutPut } from "xulhub-sdk/src/types/bridge"
import { TrueORFalseData } from "./types"

export default `
To create a true and false exercise, use a table with three columns: statement, answer, and explanation. 
The answer must be either "true" or "false".
Each row represents one exercise item.
`

// Convert cell text into boolean true/false or undefined
function normalizeAnswer(raw: string | null | undefined): boolean | undefined {
  if (!raw) return undefined

  const value = raw.trim().toLowerCase()

  if (value === "true") return true
  if (value === "false") return false

  return undefined
}

// p can be HTMLElement or string. If it's string, convert it to a temporary DOM.
export function processImport(p: HTMLElement | string): ProcessImportOutPut[] {
  const output: ProcessImportOutPut[] = []

  // Ensure we always work with a DOM element
  let root: HTMLElement
  if (typeof p === "string") {
    const container = document.createElement("div")
    container.innerHTML = p
    root = container
  } else {
    root = p
  }

  // Locate the table
  const table = root.querySelector("table")
  if (!table) return output

  // Loop through each row
  table.querySelectorAll("tr").forEach((row) => {
    const cells = row.querySelectorAll("td")

    // Require at least 3 columns: statement, answer, explanation
    if (cells.length < 3) return

    const statement = cells[0].textContent?.trim() || ""
    const answer = cells[1].textContent?.trim() || ""
    const explanation = cells[2].textContent?.trim() || ""

    // Build the content structure
    const cellContent: TrueORFalseData = {
      data: [
        {
          type: "text",
          data: statement
        }
      ],
      answer:normalizeAnswer( answer) ,
      explanation: explanation
    }

    // Push formatted output
    output.push({
      cellType: "exercise",
      cellContent,
      text: null
    })
  })


  return output
}