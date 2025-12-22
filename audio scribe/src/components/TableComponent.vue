<template>
<div>
   <div v-for="(item, index) in data" :key="index"  >
       <TableCell :table-data="item" :index="index" :is-published="isPublished" >
        
       </TableCell>
<q-separator spaced inset vertical  />
</div>
</div>

</template>

<script lang="ts" setup>
import type { TableData } from '../types';
import TableCell from './TableCell.vue';
import {QSeparator} from 'quasar'
 defineProps<{data:TableData['contents'],isPublished:boolean}>()

</script>

<style>

</style>