(() => {
  const FLAG = '__xhsMoyuHistoryHooked__';
  if (window[FLAG]) return;
  window[FLAG] = true;

  const FEED_API = '/api/sns/web/v1/feed';
  const MESSAGE_SOURCE = 'xhs-moyu-plugin';
  const HISTORY_MESSAGE_TYPE = 'XHS_MOYU_NOTE_HISTORY';
  const RESOURCE_MESSAGE_TYPE = 'XHS_MOYU_NOTE_RESOURCE';

  /**
   * 从 fetch 入参中提取请求 URL，兼容 string、URL 和 Request。
   */
  function getRequestUrl(input) {
    if (typeof input === 'string') return input;
    if (input instanceof URL) return input.href;
    if (input instanceof Request) return input.url;
    return '';
  }

  /**
   * 判断当前请求是否为小红书笔记详情 feed 接口。
   */
  function isFeedApi(input) {
    return getRequestUrl(input).includes(FEED_API);
  }

  /**
   * 将请求体解析成普通对象，用于读取 source_note_id、xsec_token 等字段。
   */
  function parseBody(body) {
    if (!body) return null;
    if (typeof body === 'string') {
      try {
        return JSON.parse(body);
      } catch {
        return null;
      }
    }
    if (body instanceof URLSearchParams) {
      return Object.fromEntries(body.entries());
    }
    return null;
  }

  /**
   * 读取 fetch 请求体；Request 类型需要 clone 后读取，避免影响原请求。
   */
  async function readFetchBody(input, init) {
    if (init && Object.prototype.hasOwnProperty.call(init, 'body')) {
      return parseBody(init.body);
    }
    if (input instanceof Request) {
      try {
        return parseBody(await input.clone().text());
      } catch {
        return null;
      }
    }
    return null;
  }

  /**
   * 从图片对象中按优先级取可展示或可下载的图片地址。
   */
  function getImageUrl(image) {
    return image?.url_default || image?.url_pre || image?.url || image?.info_list?.[0]?.url || '';
  }

  /**
   * 获取历史记录封面图，优先取笔记图片，兜底用作者头像。
   */
  function getCover(noteCard) {
    const images = Array.isArray(noteCard?.image_list) ? noteCard.image_list : [];
    for (const image of images) {
      const url = getImageUrl(image);
      if (url) return url;
    }
    return noteCard?.user?.avatar || '';
  }

  /**
   * 根据 noteId 和请求体参数拼出可打开的笔记详情 URL。
   */
  function buildNoteUrl(noteId, requestBody) {
    if (!noteId) return window.location.href;

    const url = new URL(`/explore/${noteId}`, window.location.origin);
    const xsecToken = requestBody?.xsec_token;
    const xsecSource = requestBody?.xsec_source || 'pc_feed';

    if (typeof xsecToken === 'string' && xsecToken) {
      url.searchParams.set('xsec_token', xsecToken);
    }
    if (typeof xsecSource === 'string' && xsecSource) {
      url.searchParams.set('xsec_source', xsecSource);
    }
    return url.href;
  }

  /**
   * 从 feed 接口响应中提取历史记录所需字段。
   */
  function createHistoryRecord(responseJson, requestBody) {
    const item = responseJson?.data?.items?.[0];
    const noteCard = item?.note_card;
    if (!noteCard) return null;

    const noteId = noteCard.note_id || item.id || requestBody?.source_note_id || '';
    const title = noteCard.title || (typeof noteCard.desc === 'string' ? noteCard.desc.slice(0, 30) : '未命名笔记');
    const cover = getCover(noteCard);
    const author = noteCard.user?.nickname || '';
    const url = buildNoteUrl(noteId, requestBody);

    if (!title || !author || !url) return null;

    return {
      title,
      cover,
      author,
      time: Date.now(),
      url,
    };
  }

  /**
   * 从 feed 接口响应中提取可下载资源；视频取 h264 master_url，图文取 url_default。
   */
  function createNoteResource(responseJson, requestBody) {
    const item = responseJson?.data?.items?.[0];
    const noteCard = item?.note_card;
    if (!noteCard) return null;

    let resources = [];

    if (noteCard.type === 'video') {
      const videoUrl = getVideoUrl(noteCard);
      if (videoUrl) {
        resources = [{ type: 'video', url: videoUrl }];
      }
    } else {
      const imageList = Array.isArray(noteCard.image_list) ? noteCard.image_list : [];
      resources = imageList
        .map((image) => image?.url_default)
        .filter((url) => typeof url === 'string' && url)
        .map((url) => ({ type: 'image', url }));
    }

    if (!resources.length) return null;

    return {
      noteId: noteCard.note_id || item.id || requestBody?.source_note_id || '',
      title: noteCard.title || (typeof noteCard.desc === 'string' ? noteCard.desc.slice(0, 30) : '未命名笔记'),
      resources,
    };
  }

  /**
   * 获取视频资源地址，优先读 video.media.stream，兜底解析 media_v2。
   */
  function getVideoUrl(noteCard) {
    const mediaH264 = noteCard?.video?.media?.stream?.h264;
    const mediaVideoUrl = getFirstMasterUrl(mediaH264);
    if (mediaVideoUrl) return mediaVideoUrl;

    if (typeof noteCard?.video?.media_v2 === 'string') {
      try {
        const mediaV2 = JSON.parse(noteCard.video.media_v2);
        return getFirstMasterUrl(mediaV2?.video?.stream?.h264);
      } catch {
        return '';
      }
    }

    return '';
  }

  /**
   * 从视频 stream 列表中取第一个有效的 master_url。
   */
  function getFirstMasterUrl(streamList) {
    if (!Array.isArray(streamList)) return '';
    const stream = streamList.find((item) => typeof item?.master_url === 'string' && item.master_url);
    return stream?.master_url || '';
  }

  /**
   * 向内容脚本发送结构化消息，交由插件隔离环境落库或触发下载。
   */
  function emitMessage(type, payload) {
    window.postMessage(
      {
        source: MESSAGE_SOURCE,
        type,
        payload,
      },
      window.location.origin,
    );
  }

  /**
   * 发送历史记录数据。
   */
  function emitHistory(responseJson, requestBody) {
    const payload = createHistoryRecord(responseJson, requestBody);
    if (!payload) return;

    emitMessage(HISTORY_MESSAGE_TYPE, payload);
  }

  /**
   * 发送当前笔记可下载资源数据。
   */
  function emitResource(responseJson, requestBody) {
    const payload = createNoteResource(responseJson, requestBody);
    if (!payload) return;

    emitMessage(RESOURCE_MESSAGE_TYPE, payload);
  }

  /**
   * 统一处理 feed 接口响应，分别产出历史记录和下载资源。
   */
  function emitFeedData(responseJson, requestBody) {
    emitHistory(responseJson, requestBody);
    emitResource(responseJson, requestBody);
  }

  const originalFetch = window.fetch;
  /**
   * 拦截页面主环境 fetch，复制 feed 响应体并解析出插件需要的数据。
   */
  window.fetch = async function hookedFetch(input, init) {
    const shouldCapture = isFeedApi(input);
    const bodyPromise = shouldCapture ? readFetchBody(input, init) : Promise.resolve(null);
    const response = await originalFetch.call(this, input, init);

    if (shouldCapture) {
      response.clone().json()
        .then(async (json) => emitFeedData(json, await bodyPromise))
        .catch(() => {});
    }

    return response;
  };

  const originalXhrOpen = XMLHttpRequest.prototype.open;
  const originalXhrSend = XMLHttpRequest.prototype.send;

  /**
   * 记录 XHR 请求 URL，send 阶段据此判断是否需要解析响应。
   */
  XMLHttpRequest.prototype.open = function hookedOpen(method, url, ...rest) {
    this.__xhsMoyuRequestUrl = String(url);
    return originalXhrOpen.call(this, method, url, ...rest);
  };

  /**
   * 拦截 XHR 响应，捕获 feed 接口返回的 JSON 数据。
   */
  XMLHttpRequest.prototype.send = function hookedSend(body) {
    const requestUrl = this.__xhsMoyuRequestUrl;
    if (requestUrl && requestUrl.includes(FEED_API)) {
      const requestBody = parseBody(body);
      this.addEventListener('load', function onLoad() {
        if (this.responseType && this.responseType !== 'text') return;
        try {
          emitFeedData(JSON.parse(this.responseText), requestBody);
        } catch {
          // Ignore non-JSON responses.
        }
      });
    }

    return originalXhrSend.call(this, body);
  };
})();
