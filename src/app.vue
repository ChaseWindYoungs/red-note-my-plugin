<script setup lang="ts">
import { computed, onMounted, ref, onUnmounted } from "vue";
import HistoryNote from "./views/historyNote.vue";
import { watch } from "vue";
import $ from "jquery";

// 监听URL变化
const currentPath = ref(location.pathname);

// 监听 history 的 pushState 和 replaceState
// const watchHistoryState = () => {
//   const originalPushState = history.pushState;
//   const originalReplaceState = history.replaceState;

//   history.pushState = function (...args) {
//     originalPushState.apply(this, args);
//     currentPath.value = location.pathname;
//   };

//   history.replaceState = function (...args) {
//     originalReplaceState.apply(this, args);
//     currentPath.value = location.pathname;
//   };

//   // 监听 popstate 事件
//   window.addEventListener("popstate", () => {
//     currentPath.value = location.pathname;
//   });
// };

// 监听点击事件
const handleClick = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  console.log(target);
  if (target.classList.contains("xhs-m-p_imgContainer")) {
    let spanContent = $(target).next(".footer").find(".title span").text();
    // console.log(spanContent);
    let linkHref = $(target).attr("href");
    // console.log(linkHref);
  }
};

// 计算属性现在使用 ref 的值
const isShowHistory = computed(() => {
  return currentPath.value === "/explore";
});

onMounted(() => {
  // watchHistoryState();
  // 添加全局点击事件监听
  document.addEventListener("click", handleClick, true);
});

onUnmounted(() => {
  // 清理事件监听
  document.removeEventListener("click", handleClick, true);
  console.log("unmount");
});
watch(
  currentPath,
  () => {
    console.log('currentPath ======>', currentPath.value);
  },
  {
    deep: true,
    immediate: true,
  }
);
</script>

<template>
  <div>
    <!-- <teleport to=".floating-btn-sets">
      <HistoryNote v-if="isShowHistory" />
    </teleport> -->
  </div>
</template>
