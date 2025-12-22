export default `Generate a listening comprehension exercise in a table format. The table must have the following five columns:

Spoken Text: A short sentence or phrase a user would hear.
Expected Response: The correct text the user should type or say in response.
Lang Code: The ISO 639-1 language code (e.g., en for English, es for Spanish, fr for French).
Group: A numerical identifier. Items with the same group number will be displayed together as a set.
Instruction: The specific action for the entire group. Write this only ONCE per group (leave empty for other rows in the same group). Use instructions like:

Important: Only include the Instruction text in the FIRST row of each group. For other rows in the same group, leave the Instruction column empty.
`;