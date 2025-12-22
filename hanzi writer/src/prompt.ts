import type { ProcessImportOutPut } from "xulhub-sdk/src/types/bridge"

export default `
Create a table of Chinese characters for writing practice like.

| Exercise Number | Characters |
|----------------|------------|
| 1              | 一二三     |
| 2              | 人入口     |
| 3              | 又     |

**IMPORTANT INSTRUCTIONS:**
1. Use ONLY Chinese characters in the "Characters" column
2. Do NOT include any punctuation, commas, periods, or spaces

`


export function processImport(input: HTMLElement | string): ProcessImportOutPut[] {
    
    // Handle string input
    if (typeof input === 'string') {
        // Parse string as HTML if it contains table markup
        const parser = new DOMParser()
        const doc = parser.parseFromString(input, 'text/html')
        return processTable(doc)
    }
    
    // Handle HTML element input
    return processTable(input)
    
    // Helper function to process table
    function processTable(container: Document | HTMLElement): ProcessImportOutPut[] {
        const output: ProcessImportOutPut[] = []
        const table = container.querySelector('table')
        
        if (!table) {
            console.warn('No table found in input')
            return output
        }
        
        const rows = table.querySelectorAll('tr')
        
        rows.forEach((row, i) => {
            // Skip header row
            if (i === 0) return
            
            const cells = row.querySelectorAll('td, th')
            if (cells.length < 2) return
            
            // Get character cell (second column)
            const charCell = cells[1]
            if (!charCell.textContent) return
            
            // Clean and validate characters
            const rawText = charCell.textContent
            const cleanedText = rawText
                .replace(/[^\u4e00-\u9fff]/g, '') // Remove non-Chinese characters
                .trim()
            
            if (!cleanedText) {
                console.warn(`Row ${i}: No valid Chinese characters found`)
                return
            }
            
            // Split into individual characters
            const characterList = cleanedText.split('')
            
            output.push({
                cellContent: characterList,
                cellType: 'exercise',
                text: 'Write the character in the correct stroke order'
              
            })
        })
        
        return output
    }
}