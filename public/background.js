const DOWNLOAD_RESOURCE_MESSAGE_TYPE = 'XHS_MOYU_DOWNLOAD_RESOURCES';

/**
 * 清理文件夹或文件名中的非法字符，避免 Chrome 下载 API 拒绝路径。
 */
function sanitizeFilenamePart(value, fallback) {
  const text = String(value || fallback)
    .replace(/[\\/:*?"<>|]/g, '_')
    .replace(/\s+/g, ' ')
    .trim();

  return text || fallback;
}

/**
 * 根据资源 URL 和资源类型推断下载文件扩展名。
 */
function getResourceExtension(url, type) {
  const pathname = new URL(url).pathname;
  const matched = pathname.match(/\.(jpg|jpeg|png|webp|avif|gif|mp4|mov|m4v)(?:$|[/?#])/i);
  if (matched) return matched[1].toLowerCase();
  if (type === 'video') return 'mp4';
  if (/avif/i.test(url)) return 'avif';
  if (/webp/i.test(url)) return 'webp';
  return 'jpg';
}

/**
 * 创建单个 Chrome 下载任务。
 */
function downloadResource(url, filename) {
  return chrome.downloads.download({
    url,
    filename,
    conflictAction: 'uniquify',
    saveAs: false,
  });
}

/**
 * 处理内容脚本发来的批量下载消息，并异步返回任务创建结果。
 */
function handleDownloadMessage(message, _sender, sendResponse) {
  if (message?.type !== DOWNLOAD_RESOURCE_MESSAGE_TYPE) return false;

  const payload = message.payload || {};
  const resources = Array.isArray(payload.resources)
    ? payload.resources.filter((item) => {
      return (
        item &&
        (item.type === 'image' || item.type === 'video') &&
        typeof item.url === 'string' &&
        item.url
      );
    })
    : Array.isArray(payload.imageUrls)
      ? payload.imageUrls
        .filter((url) => typeof url === 'string' && url)
        .map((url) => ({ type: 'image', url }))
      : [];

  if (!resources.length) {
    sendResponse({ success: false, message: '没有可下载的资源' });
    return false;
  }

  const folderName = sanitizeFilenamePart(payload.title || payload.noteId, '小红书资源');

  Promise.allSettled(
    resources.map((resource, index) => {
      const ext = getResourceExtension(resource.url, resource.type);
      const baseName = resource.type === 'video' && resources.length === 1
        ? 'video'
        : String(index + 1).padStart(2, '0');
      const filename = `red-note-my-plugin/${folderName}/${baseName}.${ext}`;
      return downloadResource(resource.url, filename);
    }),
  ).then((results) => {
    const successCount = results.filter((item) => item.status === 'fulfilled').length;
    sendResponse({
      success: successCount > 0,
      message: successCount > 0
        ? `已创建 ${successCount} 个下载任务`
        : '下载任务创建失败',
    });
  });

  return true;
}

chrome.runtime.onMessage.addListener(handleDownloadMessage);
