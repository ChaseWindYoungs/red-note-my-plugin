import $ from 'jquery';
import { hideFeedsImgs, containerContentChange, detailMediaContentChange, } from './utils/Observer.ts';
import initVue from './initVue.ts';
import './styles/main.scss';
import { addHistory } from './utils/historyDb.ts';

// 拦截 fetch，采集图文详情接口数据
const originalFetch = window.fetch;
window.fetch = async function(...args) {
  const response = await originalFetch.apply(this, args);
  if (typeof args[0] === 'string' && args[0].includes('/api/sns/web/v1/feed')) {
    response.clone().json().then(res => {
      console.log('res =========> ', res);
      const item = res?.data?.items?.[0]?.note_card;
      if (item && item.type === 'normal') {
        const title = item.title;
        const cover = item.image_list?.[0]?.url_default;
        const author = item.user?.nickname;
        const time = item.time;
        const url = window.location.href;
        if (title && cover && author && time && url) {
          addHistory({ title, cover, author, time, url });
        }
      }
    }).catch(() => {});
  }
  return response;
};

$(document).ready(() => {
  $('#app').addClass('xhs-moyu-plugin');
  hideFeedsImgs();
  $('.header-logo').hide();
  try {
    initVue();
  } catch (error) {
    console.log('initVue =========> ', error)
  }
  containerContentChange();
  detailMediaContentChange()
});