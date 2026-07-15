<template>
  <div ref="buttonRef" class="download-resource">
    <button class="download-btn" type="button" :disabled="isDownloading" @click="handleClick">
      <van-icon :name="iconName" size="20px" :color="iconColor" />
    </button>
    <div class="download-tip">
      <span class="download-tip-text">下载资源</span>
    </div>
  </div>
</template>

<script setup lang="ts" name="downloadResource">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { showConfirmDialog } from 'vant';
import 'vant/es/dialog/style';

const PAGE_THEME_ATTR = 'data-immersive-translate-page-theme';
const LIGHT_ICON_COLOR = '#333333cc';
const DARK_ICON_COLOR = '#ffffff';
const DOWNLOAD_RESOURCE_CLICK_EVENT = 'xhs-moyu-download-resource-click';
const DOWNLOAD_LOCK_MS = 2000;

const buttonRef = ref<HTMLElement | null>(null);
const pageTheme = ref('');
const isDownloading = ref(false);
const hasDownloaded = ref(false);
let themeObserver: MutationObserver | null = null;
let unlockTimer: number | null = null;

const iconColor = computed(() => {
  return pageTheme.value === 'dark' ? DARK_ICON_COLOR : LIGHT_ICON_COLOR;
});
const isDarkTheme = computed(() => pageTheme.value === 'dark');
const iconName = computed(() => {
  if (hasDownloaded.value) return 'success';
  if (isDownloading.value) return 'underway-o';
  return 'down';
});

function updatePageTheme() {
  pageTheme.value = document.documentElement.getAttribute(PAGE_THEME_ATTR) || '';
}

function moveToContainerStart() {
  const buttonElement = buttonRef.value;
  const parentElement = buttonElement?.parentElement;
  if (!buttonElement || !parentElement) return;

  parentElement.insertBefore(buttonElement, parentElement.firstChild);
}

async function confirmRepeatDownload() {
  try {
    await showConfirmDialog({
      title: '重复下载',
      message: '当前资源已经下载过，是否再次下载？',
      confirmButtonText: '重新下载',
      cancelButtonText: '取消',
      confirmButtonColor: '#ff2442',
      className: isDarkTheme.value ? 'download-confirm-dialog is-dark-theme' : 'download-confirm-dialog',
    });
    return true;
  } catch {
    return false;
  }
}

async function handleClick() {
  if (isDownloading.value) return;
  if (hasDownloaded.value) {
    const shouldRepeat = await confirmRepeatDownload();
    if (!shouldRepeat) return;
  }

  isDownloading.value = true;
  hasDownloaded.value = false;
  window.dispatchEvent(new CustomEvent(DOWNLOAD_RESOURCE_CLICK_EVENT));

  if (unlockTimer !== null) {
    window.clearTimeout(unlockTimer);
  }
  unlockTimer = window.setTimeout(() => {
    isDownloading.value = false;
    hasDownloaded.value = true;
    unlockTimer = null;
  }, DOWNLOAD_LOCK_MS);
}

onMounted(() => {
  moveToContainerStart();
  updatePageTheme();

  themeObserver = new MutationObserver(updatePageTheme);
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: [PAGE_THEME_ATTR],
  });
});

onUnmounted(() => {
  themeObserver?.disconnect();
  if (unlockTimer !== null) {
    window.clearTimeout(unlockTimer);
  }
});
</script>

<style lang="scss" scoped>
.download-resource {
  position: relative;
  flex: 0 0 auto;
  width: 32px;
  height: 32px;
  margin: 0 4px;
  color: var(--color-secondary-label);
  cursor: pointer;
  &:hover {
    .download-tip {
      visibility: visible;
    }
  }
}
.download-btn {
  width: 100%;
  height: 100%;
  border: 1px solid var(--color-border);
  border-radius: 100px;
  box-shadow: var(--elevation-low-shadow);
  background: var(--color-background);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
  transition: background 0.2s;
  &:disabled {
    cursor: not-allowed;
    opacity: 0.7;
  }
}
.download-tip {
  position: absolute;
  height: 28px;
  padding: 0 8px;
  border: 1px solid var(--color-border);
  box-shadow: var(--elevation-low-shadow);
  background: var(--elevation-low-background);
  font-size: 12px;
  color: var(--color-secondary-label);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  right: 48px;
  top: 6px;
  visibility: hidden;
}
.download-tip-text {
  width: 100%;
  white-space: nowrap;
  line-height: 140%;
}
:global(.download-confirm-dialog) {
  --van-dialog-width: 320px;
  --van-dialog-radius: 8px;
  --van-dialog-confirm-button-text-color: #ff2442;
}
:global(.download-confirm-dialog.is-dark-theme) {
  --van-dialog-background: #1f1f1f;
  --van-dialog-has-title-message-text-color: #b8b8b8;
  --van-border-color: rgba(255,255,255,0.12);
  --van-button-default-background: #1f1f1f;
  --van-button-default-color: #f5f5f5;
}
:global(.download-confirm-dialog.is-dark-theme .van-dialog__header) {
  color: #f5f5f5;
}
:global(.download-confirm-dialog.is-dark-theme .van-dialog__cancel) {
  color: #b8b8b8;
}
</style>
