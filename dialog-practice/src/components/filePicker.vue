<template>
  <div 
    class="file-picker" style="cursor: pointer;"
    @click="triggerFileInput"
    @drop="onDrop"
    @dragover="onDragOver"
    @dragleave="onDragLeave"
  >
    <slot :is-drag-over="isDragOver" :is-converting="isConverting" :error="error"></slot>
    
    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      @change="onFileSelected"
      style="display: none"
    />
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const emits = defineEmits<{
  (e: 'getImage', imageData: string): void
  (e: 'dragOver', state: boolean): void
  (e: 'error', error: string): void
}>()

const fileInput = ref<HTMLInputElement>()
const isDragOver = ref(false)
const isConverting = ref(false)
const error = ref('')

import { watch } from 'vue'
import { useQuasar } from 'quasar'

const $q = useQuasar()
const MAX_FILE_SIZE = 250 * 1024 // 250KB in bytes

// show a Quasar notification when an error is set;
// if it's a filesize error, show a clear "max 250 KB" message
watch(error, (val) => {
  if (!val) return
  const message = /file size/i.test(val)
    ? 'Image is too big — max is 250 KB.'
    : val
  $q.notify({ type: 'negative', message })
})

const triggerFileInput = () => {
  fileInput.value?.click()
}

const onDragOver = (e: DragEvent) => {
  e.preventDefault()
  isDragOver.value = true
  emits('dragOver', true)
}

const onDragLeave = (e: DragEvent) => {
  e.preventDefault()
  isDragOver.value = false
  emits('dragOver', false)
}

const onDrop = (e: DragEvent) => {
  e.preventDefault()
  isDragOver.value = false
  emits('dragOver', false)
  
  const files = e.dataTransfer?.files
  if (files && files.length > 0) {
    const f  = files[0]
    if (f) {
         processFile(f)
 
    }
  }
}

const onFileSelected = (e: Event) => {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    processFile(file)
  }
  // Reset input
  target.value = ''
}

const processFile = (file: File) => {
  error.value = ''
  
  // Validate file type
  if (!file.type.startsWith('image/')) {
    const errorMsg = 'Please select an image file'
    error.value = errorMsg
    emits('error', errorMsg)
    return
  }
  
  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    const errorMsg = `File size must be less than 700MB. Current size: ${(file.size / (1024 * 1024)).toFixed(2)}MB`
    error.value = errorMsg
    emits('error', errorMsg)
    return
  }
  
  isConverting.value = true
  
  // Convert to WebP
  convertToWebP(file)
    .then((webpDataUrl) => {
      emits('getImage', webpDataUrl)
    })
    .catch((err) => {
      const errorMsg = 'Failed to convert image: ' + err.message
      error.value = errorMsg
      emits('error', errorMsg)
    })
    .finally(() => {
      isConverting.value = false
    })
}

const convertToWebP = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    if (!ctx) {
      reject(new Error('Could not get canvas context'))
      return
    }
    
    img.onload = () => {
      try {
        // Set canvas dimensions to image dimensions
        canvas.width = img.width
        canvas.height = img.height
        
        // Draw image on canvas
        ctx.drawImage(img, 0, 0)
        
        // Convert to WebP (0.92 quality for good balance)
        const webpDataUrl = canvas.toDataURL('image/webp', 0.70)
        resolve(webpDataUrl)
      } catch (err) {
        reject(err)
      }
    }
    
    img.onerror = () => {
      reject(new Error('Failed to load image'))
    }
    
    // Create object URL for the image
    img.src = URL.createObjectURL(file)
  })
}
</script>

<style scoped>
.file-picker {
  display: contents; /* This makes the component not create a layout box */
}
</style>