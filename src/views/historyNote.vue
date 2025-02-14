<template>
  <div class="historyRecord">
    <div class="btn-wrapper">
      <van-icon name="clock-o" size="20px" color="#333333cc" />
    </div>
    <div class="tip-container">
      <span class="tip-text">历史记录</span>
    </div>
  </div>
</template>
<script setup name="historyNote">
/**
 * historyNote
 */
import { ref } from "vue";
function test() {
  console.log("historyNote");
}
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
</style>
