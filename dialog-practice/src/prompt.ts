export default `# Dialog Exercise Format Guide

To create a dialog exercise, use a table format with the following structure:

## Required Columns:
- **messages** (string): The actual dialog text
- **persona** (string): Must be either 'A' or 'B' only

## Optional Columns:
- **tts** (string): Set to 'yes' to enable text-to-speech for this message
- **lang** (string): Language code for TTS (e.g., 'en', 'es', 'fr')

## Rules:
1. Each row represents one exchange in the conversation
3. The first row determines who initiates the conversation
4. Each table represents one complete conversation exercise
5. **Only the bot (persona A) can have TTS** - human responses (B) will not use text-to-speech

## Example 1: Basic Dialog
| messages | persona |
|----------|---------|
| Hello, how are you today? | A |
| I'm doing well, thank you! How about you? | B |

## Example 2: Dialog with Bot TTS Only
| messages | persona | tts | lang |
|----------|---------|-----|------|
| Hello, how are you today? | A | yes | en |
| I'm doing well, thank you! | B | | |
| Would you like to practice pronunciation? | A | yes | en |
| Yes, that would be helpful | B | | |

## TTS Usage Notes:
- **TTS is only available for bot messages (persona A)**
- Set \`tts\` to 'yes' to enable text-to-speech for a bot message
- If tts is empty or 'no', no speech will be generated
- The actual \`messages\` text will be used for speech synthesis
- If \`lang\` column is empty, system default language will be used
- Human responses (persona B) will ignore TTS columns`;