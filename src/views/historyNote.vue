<template>
  <div class="historyRecord">
    <div class="btn-wrapper" @click="showPopup = true">
      <van-icon name="clock-o" size="20px" :color="iconColor" />
    </div>
    <div class="tip-container">
      <span class="tip-text">历史记录</span>
    </div>
    <div
      v-if="showPopup"
      class="history-popup-mask"
      :class="{ 'is-dark-theme': isDarkTheme }"
      @click.self="showPopup = false"
    >
      <div class="history-popup">
        <div class="popup-header">
          <div class="popup-title-wrap">
            <span>历史记录</span>
            <span v-if="historyCount > 0" class="popup-count">{{ historyCount }} 条</span>
          </div>
          <div class="popup-actions">
            <div v-if="historyCount > 0" class="open-mode-switch" aria-label="查看打开方式">
              <button
                class="open-mode-btn"
                :class="{ active: openMode === 'current' }"
                @click="setOpenMode('current')"
              >
                当前页
              </button>
              <button
                class="open-mode-btn"
                :class="{ active: openMode === 'newTab' }"
                @click="setOpenMode('newTab')"
              >
                新标签
              </button>
            </div>
            <button v-if="historyCount > 0" class="clear-btn" @click="clearAll">清空</button>
            <button class="close-btn" @click="showPopup = false">×</button>
          </div>
        </div>
        <div class="popup-list" v-if="historyList.length">
          <div v-for="item in historyList" :key="item.time" class="popup-item">
            <img :src="item.cover" class="popup-img" />
            <div class="popup-info">
              <div class="popup-title" :title="item.title">{{ item.title }}</div>
              <div class="popup-meta">
                <span>{{ item.author }}</span>
                <span>{{ formatTime(item.time) }}</span>
              </div>
              <a
                :href="item.url"
                :target="historyLinkTarget"
                :rel="historyLinkRel"
                class="popup-link"
              >
                查看
              </a>
            </div>
            <button class="delete-btn" @click="deleteItem(item.time)">删除</button>
          </div>
        </div>
        <div v-else class="empty">暂无历史记录</div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts" name="historyNote">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { showConfirmDialog } from 'vant';
import 'vant/es/dialog/style';
import { getAllHistory, deleteHistory, clearHistory, onHistoryChange, offHistoryChange, type HistoryRecord } from '@/utils/historyDb';

const PAGE_THEME_ATTR = 'data-immersive-translate-page-theme';
const LIGHT_ICON_COLOR = '#333333cc';
const DARK_ICON_COLOR = '#ffffff';
const OPEN_MODE_STORAGE_KEY = 'XHS_HISTORY_OPEN_MODE';

type OpenMode = 'current' | 'newTab';

const showPopup = ref(false);
const historyList = ref<HistoryRecord[]>([]);
const pageTheme = ref('');
const openMode = ref<OpenMode>('newTab');
let themeObserver: MutationObserver | null = null;
let originalBodyOverflow = '';

const iconColor = computed(() => {
  return pageTheme.value === 'dark' ? DARK_ICON_COLOR : LIGHT_ICON_COLOR;
});
const isDarkTheme = computed(() => pageTheme.value === 'dark');
const historyCount = computed(() => historyList.value.length);
const historyLinkTarget = computed(() => openMode.value === 'newTab' ? '_blank' : '_self');
const historyLinkRel = computed(() => openMode.value === 'newTab' ? 'noopener noreferrer' : undefined);

function getSavedOpenMode(): OpenMode {
  return localStorage.getItem(OPEN_MODE_STORAGE_KEY) === 'current' ? 'current' : 'newTab';
}

function setOpenMode(mode: OpenMode) {
  openMode.value = mode;
  localStorage.setItem(OPEN_MODE_STORAGE_KEY, mode);
}

function updatePageTheme() {
  pageTheme.value = document.documentElement.getAttribute(PAGE_THEME_ATTR) || '';
}

function formatTime(ts: number) {
  const d = new Date(ts);
  return d.toLocaleString();
}

async function loadHistory() {
  historyList.value = await getAllHistory();
}

function handleHistoryChange() {
  loadHistory();
}

async function deleteItem(time: number) {
  await deleteHistory(time);
  await loadHistory();
}

async function clearAll() {
  try {
    await showConfirmDialog({
      title: '清空历史记录',
      message: '清空后无法恢复，确定要删除所有历史记录吗？',
      confirmButtonText: '清空',
      cancelButtonText: '取消',
      confirmButtonColor: '#ff2442',
      className: isDarkTheme.value ? 'history-confirm-dialog is-dark-theme' : 'history-confirm-dialog',
    });
  } catch {
    return;
  }

  await clearHistory();
  await loadHistory();
  showPopup.value = false;
}

function lockPageScroll() {
  originalBodyOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
}

function unlockPageScroll() {
  document.body.style.overflow = originalBodyOverflow;
}

onMounted(() => {
  openMode.value = getSavedOpenMode();
  loadHistory();
  onHistoryChange(handleHistoryChange);
  updatePageTheme();

  themeObserver = new MutationObserver(updatePageTheme);
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: [PAGE_THEME_ATTR],
  });
});

onUnmounted(() => {
  themeObserver?.disconnect();
  offHistoryChange(handleHistoryChange);
  if (showPopup.value) unlockPageScroll();
});

// 弹窗每次打开都刷新
watch(showPopup, (v: boolean) => {
  if (v) {
    lockPageScroll();
    loadHistory();
    return;
  }

  unlockPageScroll();
});
</script>
<style lang="scss">
.historyRecord {
  width: 40px;
  height: 40px;
  background: var(--elevation-low-background);
  border: 1px solid var(--color-border);
  box-shadow: var(--elevation-low-shadow);
  border-radius: 100px;
  color: var(--color-secondary-label);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
  cursor: pointer;
  position: relative;
  &:hover {
    .tip-container {
      visibility: visible;
    }
  }
}
.btn-wrapper {
  width: 100%;
  height: 100%;
  border-radius: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-background);
  position: relative;
}
.tip-container {
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
  visibility: hidden;
  .tip-text {
    width: 100%;
    white-space: nowrap;
    line-height: 140%;
  }
}
.history-popup-mask {
  --history-popup-bg: #fff;
  --history-popup-title-color: #222;
  --history-popup-border-color: #eee;
  --history-popup-item-bg: #fafbfc;
  --history-popup-meta-color: #888;
  --history-popup-empty-color: #aaa;
  --history-popup-close-color: #222;
  --history-popup-mode-bg: #f2f3f5;
  --history-popup-mode-active-bg: #fff;
  --history-popup-mode-color: #666;
  --history-popup-mode-active-color: #222;

  position: fixed;
  left: 0; top: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.45);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  overscroll-behavior: none;
}
.history-popup-mask.is-dark-theme {
  --history-popup-bg: #1f1f1f;
  --history-popup-title-color: #f5f5f5;
  --history-popup-border-color: rgba(255,255,255,0.12);
  --history-popup-item-bg: #2a2a2a;
  --history-popup-meta-color: #b8b8b8;
  --history-popup-empty-color: #9a9a9a;
  --history-popup-close-color: #f5f5f5;
  --history-popup-mode-bg: #2a2a2a;
  --history-popup-mode-active-bg: #3a3a3a;
  --history-popup-mode-color: #b8b8b8;
  --history-popup-mode-active-color: #f5f5f5;
}
.history-popup {
  width: 400px;
  max-height: 70vh;
  background: var(--history-popup-bg);
  color: var(--history-popup-title-color);
  border-radius: 10px;
  box-shadow: 0 4px 32px 0 rgba(0,0,0,0.08);
  padding: 0 0 10px 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px 8px 20px;
  font-size: 18px;
  font-weight: bold;
  color: var(--history-popup-title-color);
  border-bottom: 1px solid var(--history-popup-border-color);
}
.popup-title-wrap {
  display: flex;
  align-items: baseline;
  gap: 8px;
}
.popup-count {
  font-size: 12px;
  font-weight: 400;
  color: var(--history-popup-meta-color);
}
.popup-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
.open-mode-switch {
  height: 28px;
  padding: 2px;
  border-radius: 6px;
  background: var(--history-popup-mode-bg);
  display: flex;
  align-items: center;
  gap: 2px;
}
.open-mode-btn {
  height: 24px;
  padding: 0 8px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--history-popup-mode-color);
  cursor: pointer;
  font-size: 12px;
}
.open-mode-btn.active {
  background: var(--history-popup-mode-active-bg);
  color: var(--history-popup-mode-active-color);
  font-weight: 500;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
}
.clear-btn {
  height: 28px;
  padding: 0 10px;
  background: #ff2442;
  border: none;
  border-radius: 4px;
  color: #fff;
  cursor: pointer;
  font-size: 12px;
}
.close-btn {
  background: none;
  border: none;
  font-size: 22px;
  cursor: pointer;
  color: var(--history-popup-close-color);
}
.popup-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 10px 20px;
}
.popup-item {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  background: var(--history-popup-item-bg);
  border-radius: 6px;
  padding: 8px 10px;
  box-shadow: 0 1px 4px 0 rgba(0,0,0,0.04);
}
.popup-img {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 6px;
  margin-right: 12px;
}
.popup-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.popup-title {
  font-size: 15px;
  font-weight: 500;
  color: var(--history-popup-title-color);
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.popup-meta {
  font-size: 12px;
  color: var(--history-popup-meta-color);
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}
.popup-link {
  width: fit-content;
  height: 26px;
  padding: 0 10px;
  border: 1px solid rgba(61,138,245,0.35);
  border-radius: 4px;
  background: rgba(61,138,245,0.1);
  color: #3d8af5;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  line-height: 1;
  text-decoration: none;
  transition: background 0.2s, border-color 0.2s;
  &:hover {
    background: rgba(61,138,245,0.16);
    border-color: rgba(61,138,245,0.55);
  }
}
.delete-btn {
  background: #ff2442;
  color: #fff;
  border: none;
  border-radius: 4px;
  padding: 4px 10px;
  cursor: pointer;
  font-size: 12px;
  margin-left: 10px;
}
.empty {
  text-align: center;
  color: var(--history-popup-empty-color);
  padding: 30px 0;
}
.history-confirm-dialog {
  --van-dialog-width: 320px;
  --van-dialog-radius: 8px;
  --van-dialog-background: #fff;
  --van-dialog-has-title-message-text-color: #666;
  --van-dialog-confirm-button-text-color: #ff2442;
}
.history-confirm-dialog.is-dark-theme {
  --van-dialog-background: #1f1f1f;
  --van-dialog-has-title-message-text-color: #b8b8b8;
  --van-border-color: rgba(255,255,255,0.12);
  --van-button-default-background: #1f1f1f;
  --van-button-default-color: #f5f5f5;
}
.history-confirm-dialog.is-dark-theme .van-dialog__header {
  color: #f5f5f5;
}
.history-confirm-dialog.is-dark-theme .van-dialog__cancel {
  color: #b8b8b8;
}
</style>
