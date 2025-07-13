import { LANGUAGE_CONFIG } from "@/app/(root)/_constants";
import { CodeEditorState } from "@/types";
import {create} from "zustand"
import { Monaco } from "@monaco-editor/react";
const getInitialState=()=>{
//if we're on the server side
if(typeof window=="undefined"){
    return{
        language:"javascript",
        fontsize:16,
        theme:"vs-dark",

    };
}
//if we're on the client side
const savedLanguage=localStorage.getItem("editor-language")||"javascript";
const savedTheme=localStorage.getItem("editor-theme")||"vs-dark";
const savedFontsize=localStorage.getItem("editor-fontsize")||16;
return{
    language:savedLanguage,
    theme:savedTheme,
    fontSize:Number(savedFontsize),
}
};

export const useCodeEditorStore=create<CodeEditorState>((set,get)=>{
    const initialState=getInitialState();
    return {
        ...initialState,
         output: "",
    isRunning: false,
    error: null,
    editor: null,
    executionResult: null,

      getCode: () => get().editor?.getValue() || "",
      //setting all sections according to the theme and lang

        setEditor:(editor:Monaco)=>{
            const savedCode=localStorage.getItem(`editor-code-${get().language}`);
            if(savedCode) editor.setValue(savedCode);

            set({editor});
        },
        setTheme:(theme:string)=>{
           localStorage.setItem("editor-theme",theme);
           set({theme});

        },

         setFontSize: (fontSize: number) => {
      localStorage.setItem("editor-font-size", fontSize.toString());
      set({ fontSize });
    },

    setLanguage: (language: string) => {
      // Save current language code before switching
      const currentCode = get().editor?.getValue();
      if (currentCode) {
        localStorage.setItem(`editor-code-${get().language}`, currentCode);
      }

      localStorage.setItem("editor-language", language);

      set({
        language,
        output: "",
        error: null,
      });
    },

    runCode:async()=>{
        //add loading state!!
        
    }

    }
})