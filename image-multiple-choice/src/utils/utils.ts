import type { ProcessImportOutPut } from "xulhub-sdk/src/types/bridge";

export const prompt = `Create an image-based multiple choice quiz where users select the correct image for a given concept.

Use this format:
---
[Your question or concept here]
- [image URL 1]
- [image URL 2] 
- [image URL 3]
. [image URL 4] (optional)
---

Requirements:
- Provide 2-4 image options (maximum 4)
- Use only public image repositories (Unsplash, Pexels, Pixabay, etc.)
- All image URLs must work directly in <img src=""> tags
- Use low-resolution images (max 400x400px) for performance
- Mark the correct answer with ✅ after the URL
- Ensure images are visually distinct and relevant

Example usage:
---
Select the image that shows "dragon"
- https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400
- https://images.pexels.com/photos/1083623/pexels-photo-1083623.jpeg?w=400 ✅
- https://images.pixabay.com/photo-1559656914-6098d6d5fc6f?w=400
---

`

/* -----------------------------------
   Types
----------------------------------- */
export interface Question {
  question: string;
  options: {
    label?: string;
    image: string;
    correct?: boolean;
  }[];
}
export function processImport(data: string | HTMLElement): ProcessImportOutPut[] {
    // Handle string input
    if (typeof data === 'string') {
        throw new Error("Invalid data: Expected HTMLElement, got string");
    }

    const input = data as HTMLElement;
    const output: ProcessImportOutPut[] = [];
    
    // Get all horizontal rules that separate questions
    const allLines = input.querySelectorAll('hr');
    
    // If no separators found, return empty array
    if (!allLines.length) {
        return output;
    }

    allLines.forEach((separator) => {
        let currentElement = separator.nextElementSibling;
        const question: Question = {
            question: '',
            options: []
        };

        // Traverse siblings until we hit the next HR or run out of elements
        while (currentElement && currentElement.tagName !== 'HR') {
            // Skip if element is null or undefined
            if (!currentElement) {
                break;
            }

            // Handle question text (non-OL elements)
            if (currentElement.tagName !== 'OL' && currentElement.tagName !== 'UL') {
                // If next element is a list, this is likely the question text
                const nextElement = currentElement.nextElementSibling;
                if (nextElement && (nextElement.tagName === 'OL' || nextElement.tagName === 'UL')) {
                    question.question = currentElement.textContent?.trim() || '';
                    currentElement = nextElement;
                    continue;
                } else {
                    // Move to next element if this isn't the question
                    currentElement = currentElement.nextElementSibling;
                    continue;
                }
            }

            // Handle options list (OL or UL)
            if (currentElement.tagName === 'OL' || currentElement.tagName === 'UL') {
                const listItems = currentElement.querySelectorAll('li');
                listItems.forEach((item, index) => {
                    const textContent = item.textContent?.trim();
                    if (!textContent) return; // Skip empty list items
                    
                    const correct = textContent.includes("✅");
                    const cleanText = textContent.replace("✅", '').trim();
                    
                    if (index === 0) {
                        question.options[index] = {
                            image: cleanText,
                            correct: correct
                        };
                    } else {
                        question.options.push({
                            image: cleanText,
                            correct: correct
                        });
                    }
                });
                
                // After processing the list, we're done with this question
                break;
            }

            // Move to next element
            currentElement = currentElement.nextElementSibling;
        }

        // Only add the question if we have both a question and options
        if (question.question && question.options.length > 0) {
            output.push({
                cellType: 'exercise',
                cellContent: question,
                text: null
            });
        }
    });
    return output
}