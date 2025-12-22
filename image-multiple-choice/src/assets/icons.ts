type availableIcons = 'close'|'add'
export function Icons ({name,size,color}:{name:availableIcons,size:number,color:string}){
  const svgMap = {'close':`<svg xmlns="http://www.w3.org/2000/svg" height="${size}px" viewBox="0 -960 960 960" width="24px" fill="${color}">
    <path d="m336-280-56-56 144-144-144-143 56-56 144 144 143-144 56 56-144 143 144 144-56 56-143-144-144 144Z"/>
</svg>`,
add:`<svg xmlns="http://www.w3.org/2000/svg" height="${size}px" viewBox="0 -960 960 960" width="24px" fill="${color}">
    <path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z"/>
</svg>`
} as Record<availableIcons,string>
    return svgMap[name]
}