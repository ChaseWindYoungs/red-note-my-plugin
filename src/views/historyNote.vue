<template>
  <div class="historyRecord">
    <div class="btn-wrapper" @click="showPopup = true">
      <van-icon name="clock-o" size="20px" color="#333333cc" />
    </div>
    <div class="tip-container">
      <span class="tip-text">历史记录</span>
    </div>
    <div v-if="showPopup" class="history-popup-mask" @click.self="showPopup = false">
      <div class="history-popup">
        <div class="popup-header">
          <span>历史记录</span>
          <button class="close-btn" @click="showPopup = false">×</button>
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
              <a :href="item.url" target="_blank" class="popup-link">查看</a>
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
import { ref, onMounted, watch } from 'vue';
import { getAllHistory, deleteHistory, HistoryRecord } from '@/utils/historyDb';

const showPopup = ref(false);
const historyList = ref<HistoryRecord[]>([]);

function formatTime(ts: number) {
  const d = new Date(ts);
  return d.toLocaleString();
}

async function loadHistory() {
  historyList.value = await getAllHistory();
}

async function deleteItem(time: number) {
  await deleteHistory(time);
  await loadHistory();
}

onMounted(() => {
  loadHistory();
});

// 弹窗每次打开都刷新
watch(showPopup, (v: boolean) => { if (v) loadHistory(); });
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
  position: fixed;
  left: 0; top: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.15);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}
.history-popup {
  width: 400px;
  max-height: 70vh;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 4px 32px 0 rgba(0,0,0,0.08);
  padding: 0 0 10px 0;
  display: flex;
  flex-direction: column;
}
.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px 8px 20px;
  font-size: 18px;
  font-weight: bold;
  border-bottom: 1px solid #eee;
}
.close-btn {
  background: none;
  border: none;
  font-size: 22px;
  cursor: pointer;
}
.popup-list {
  flex: 1;
  overflow-y: auto;
  max-height: 50vh;
  padding: 10px 20px;
}
.popup-item {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  background: #fafbfc;
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
  color: #222;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.popup-meta {
  font-size: 12px;
  color: #888;
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}
.popup-link {
  font-size: 12px;
  color: #3d8af5;
  text-decoration: underline;
  margin-bottom: 2px;
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
  color: #aaa;
  padding: 30px 0;
}
</style>
