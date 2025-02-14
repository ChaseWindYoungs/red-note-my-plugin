// 导入 Element Plus 中英文语言包
import { ref } from 'vue';
import { defineStore } from "pinia";
import { store } from "@/store";
export const StorageName = 'HISTORY_SETTING'
// setup
export const useHistoryStore = defineStore(
  "history", 
  () => {
    const historyList = ref([])
   
    function setHistoryList (arr: []) {
      historyList.value = arr ?? []
    }
    return {
      historyList,
      setHistoryList
    } 
  },
  {
    persist: {
      key: StorageName,
      storage: localStorage,
    },
  },
)

export function useHistoryStoreHook() {
  return useHistoryStore(store);
}
