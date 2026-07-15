<script setup lang="ts">
import { computed, onMounted, ref, onUnmounted } from "vue";
import HistoryNote from "./views/historyNote.vue";
import DownloadResource from "./views/downloadResource.vue";

/** 历史记录按钮要插入的小红书浮动按钮容器选择器 */
const HISTORY_TELEPORT_TARGET = ".floating-btn-sets";

/** 下载资源按钮要插入的详情操作栏容器选择器 */
const DOWNLOAD_TELEPORT_TARGET = ".interact-container";

/** 当前页面路径；小红书是 CSR，需要主动监听 history API 才能保持同步 */
const currentPath = ref(location.pathname);

/** Teleport 目标容器是否已经出现在页面中 */
const isHistoryTeleportReady = ref(false);

/** 详情操作栏容器是否已经出现在页面中 */
const isDownloadTeleportReady = ref(false);

/** 用于监听小红书异步渲染出来的 Teleport 目标容器 */
let observer: MutationObserver | null = null;

/** 下载按钮目标容器元素 */
let downloadTeleportElement: HTMLElement | null = null;

/** 页面原始下载按钮目标容器 display 样式，卸载时恢复 */
let originalDownloadDisplay = "";

/** 页面原始下载按钮目标容器 align-items 样式，卸载时恢复 */
let originalDownloadAlignItems = "";

/** 页面原始 history.pushState，卸载插件 Vue 应用时恢复 */
let originalPushState: History["pushState"] | null = null;

/** 页面原始 history.replaceState，卸载插件 Vue 应用时恢复 */
let originalReplaceState: History["replaceState"] | null = null;

/** 是否展示历史记录入口：目前只在探索页展示 */
const isShowHistory = computed(() => currentPath.value === "/explore");

/** Teleport 是否具备渲染条件：页面路径正确，并且目标 DOM 已存在 */
const canTeleportHistory = computed(() => isShowHistory.value && isHistoryTeleportReady.value);

/** 下载资源按钮是否具备渲染条件：详情操作栏容器已存在 */
const canTeleportDownloadResource = computed(() => isDownloadTeleportReady.value);

/** 将 currentPath 更新为浏览器当前路径 */
const updateCurrentPath = () => {
  currentPath.value = location.pathname;
};

/** 检查小红书异步渲染的 Teleport 目标是否已出现 */
const updateTeleportReady = () => {
  const nextHistoryReady = Boolean(document.querySelector(HISTORY_TELEPORT_TARGET));
  if (isHistoryTeleportReady.value !== nextHistoryReady) {
    isHistoryTeleportReady.value = nextHistoryReady;
  }

  const nextDownloadElement = document.querySelector<HTMLElement>(DOWNLOAD_TELEPORT_TARGET);
  const nextDownloadReady = Boolean(nextDownloadElement);
  if (isDownloadTeleportReady.value !== nextDownloadReady) {
    isDownloadTeleportReady.value = nextDownloadReady;
  }
  if (nextDownloadElement && nextDownloadElement !== downloadTeleportElement) {
    applyDownloadTargetStyle(nextDownloadElement);
  }
};

/** 包装 history API，让 CSR 页面内部跳转后也能更新 currentPath */
const watchHistoryState = () => {
  originalPushState = history.pushState;
  originalReplaceState = history.replaceState;

  history.pushState = function (...args) {
    const result = originalPushState?.apply(this, args);
    updateCurrentPath();
    return result;
  };

  history.replaceState = function (...args) {
    const result = originalReplaceState?.apply(this, args);
    updateCurrentPath();
    return result;
  };

  window.addEventListener("popstate", updateCurrentPath);
};

/** 恢复被包装过的 history API，并移除路径监听 */
const restoreHistoryState = () => {
  if (originalPushState) history.pushState = originalPushState;
  if (originalReplaceState) history.replaceState = originalReplaceState;
  window.removeEventListener("popstate", updateCurrentPath);
};

/** 给下载按钮目标容器补齐布局样式，保证按钮能和原有交互项对齐 */
const applyDownloadTargetStyle = (target: HTMLElement) => {
  restoreDownloadTargetStyle();

  downloadTeleportElement = target;
  originalDownloadDisplay = target.style.display;
  originalDownloadAlignItems = target.style.alignItems;

  target.style.display = "flex";
  target.style.alignItems = "center";
};

/** 恢复下载按钮目标容器原有内联样式 */
const restoreDownloadTargetStyle = () => {
  if (!downloadTeleportElement) return;

  downloadTeleportElement.style.display = originalDownloadDisplay;
  downloadTeleportElement.style.alignItems = originalDownloadAlignItems;
  downloadTeleportElement = null;
  originalDownloadDisplay = "";
  originalDownloadAlignItems = "";
};

onMounted(() => {
  watchHistoryState();
  updateTeleportReady();

  // 小红书浮动按钮容器由页面异步渲染，需等待目标出现后再 Teleport。
  observer = new MutationObserver(updateTeleportReady);
  observer.observe(document.body, { childList: true, subtree: true });
});

onUnmounted(() => {
  observer?.disconnect();
  restoreDownloadTargetStyle();
  restoreHistoryState();
});
</script>

<template>
  <div>
    <teleport v-if="canTeleportHistory" :to="HISTORY_TELEPORT_TARGET">
      <HistoryNote />
    </teleport>
    <teleport v-if="canTeleportDownloadResource" :to="DOWNLOAD_TELEPORT_TARGET">
      <DownloadResource />
    </teleport>
  </div>
</template>
