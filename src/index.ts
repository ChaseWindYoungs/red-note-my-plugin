import $ from 'jquery';
import { hideFeedsImgs, hideMediaContainerImgs, containerContentChange, detailMediaContentChange, } from './utils/Observer.ts';
import initVue from './initVue.ts';
import './styles/main.scss';
import { addHistory, type HistoryRecord } from './utils/historyDb.ts';
import { showFailToast, showSuccessToast } from 'vant';
import 'vant/es/toast/style';

const HISTORY_MESSAGE_SOURCE = 'xhs-moyu-plugin';
const HISTORY_MESSAGE_TYPE = 'XHS_MOYU_NOTE_HISTORY';
const RESOURCE_MESSAGE_TYPE = 'XHS_MOYU_NOTE_RESOURCE';
const DOWNLOAD_RESOURCE_CLICK_EVENT = 'xhs-moyu-download-resource-click';
const DOWNLOAD_RESOURCE_MESSAGE_TYPE = 'XHS_MOYU_DOWNLOAD_RESOURCES';

type HistoryMessage = {
  source?: string;
  type?: string;
  payload?: unknown;
}

type NoteResource = {
  noteId: string;
  title: string;
  resources: Array<{
    type: 'image' | 'video';
    url: string;
  }>;
}

let latestNoteResource: NoteResource | null = null;

function isHistoryRecord(value: unknown): value is HistoryRecord {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.title === 'string' &&
    typeof record.cover === 'string' &&
    typeof record.author === 'string' &&
    typeof record.time === 'number' &&
    typeof record.url === 'string'
  );
}

function isNoteResource(value: unknown): value is NoteResource {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.noteId === 'string' &&
    typeof record.title === 'string' &&
    Array.isArray(record.resources) &&
    record.resources.every((item) => {
      if (!item || typeof item !== 'object') return false;
      const resource = item as Record<string, unknown>;
      return (
        (resource.type === 'image' || resource.type === 'video') &&
        typeof resource.url === 'string' &&
        resource.url
      );
    })
  );
}

window.addEventListener('message', (event: MessageEvent<HistoryMessage>) => {
  if (event.source !== window || event.origin !== window.location.origin) return;

  const { source, type, payload } = event.data || {};
  if (source !== HISTORY_MESSAGE_SOURCE) return;

  if (type === RESOURCE_MESSAGE_TYPE && isNoteResource(payload)) {
    latestNoteResource = payload;
    return;
  }

  if (type !== HISTORY_MESSAGE_TYPE || !isHistoryRecord(payload)) return;

  addHistory(payload).catch((error) => {
    console.log('addHistory =========> ', error);
  });
});

window.addEventListener(DOWNLOAD_RESOURCE_CLICK_EVENT, () => {
  if (!latestNoteResource?.resources.length) {
    showFailToast('暂无可下载资源，请等待详情内容加载完成后重试');
    return;
  }

  chrome.runtime.sendMessage({
    type: DOWNLOAD_RESOURCE_MESSAGE_TYPE,
    payload: latestNoteResource,
  }, (response) => {
    if (chrome.runtime.lastError) {
      console.log('downloadResource =========> ', chrome.runtime.lastError.message);
      return;
    }

    if (!response?.success) {
      showFailToast(response?.message || '下载任务创建失败');
      return;
    }

    showSuccessToast(response.message || '开始下载');
  });
});

$(document).ready(() => {
  $('#app').addClass('xhs-moyu-plugin');
  hideFeedsImgs();
  hideMediaContainerImgs();
  $('.header-logo').hide();
  try {
    initVue();
  } catch (error) {
    console.log('initVue =========> ', error)
  }
  containerContentChange();
  detailMediaContentChange()
});
