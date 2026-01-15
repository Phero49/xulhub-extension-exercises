export  type TableData = {instruction:string,contents:{
          audio:{
            type:'tts'|'url'|'file',
            data:string,
            lang?:string
          },
          text:string
}[]
}
