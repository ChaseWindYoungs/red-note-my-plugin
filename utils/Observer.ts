import $ from 'jquery';

/**
 * 延迟执行在探索馈送中隐藏图片的操作。
 * 遍历每个笔记项目，找到图片容器，添加一个样式类、
 * 将图片不透明度设为 0，并为图片容器添加边框。
 */
export function hideFeedsImgs() {
  setTimeout(() => {
    const $exploreFeeds = $('.feeds-container');
    if ($exploreFeeds.length > 0) {
      $('.note-item').each((_, item) => {
        const $imgContainer = $(item).find('.cover');
        console.log('$imgContainer ===========>' ,$imgContainer);
        $imgContainer.addClass('xhs-m-p_imgContainer xhs-m-p_border');
        const $img = $imgContainer.find('img');
        $img.addClass('xhs-m-p_hidden');
      });
    }
  }, 100);
}

export function hideDetailImgs() {
  setTimeout(() => {
    const $exploreFeeds = $('.list-container');
    if ($exploreFeeds.length > 0) {
      $('.parent-comment').each((_, item) => {
        const $imgContainer = $(item).find('.comment-picture');
        // console.log('$imgContainer ===========>' ,$imgContainer);
        const $imgBox = $imgContainer.find('.img-box');
        $imgBox.addClass('xhs-m-p_imgContainer xhs-m-p_border');
        const $img = $imgBox.find('img');
        $img.addClass('xhs-m-p_hidden');
      });
    }
  }, 100);
}

/**
 * 观察内容容器元素的变化。
 * 检测到变化时，执行 hideFeedsImgs 函数。
 */
export function containerContentChange() {
  const $content = $('.xhs-moyu-plugin');
  observerChange(
    $content[0],
    hideFeedsImgs
  );
}

/**
 * 观察内容容器元素的变化。
 * 检测到变化时，执行 hideImgs 函数。
 */
export function detailContentChange() {
  const $content = $('#noteContainer');
  console.log('noteContainer ========>', $('#noteContainer').length)
  observerChange(
    $content[0],
    hideDetailImgs
  );
}


/**
 * 为给定节点添加 1px 的实心边框。
 * 边框颜色为深灰色，接近黑色。
 * @param {$} $node 要添加边框的 jQuery 对象。
 */
// function addBorder($node) {
//   $node.css('border', '1px solid rgb(15 15 15 / 11%)');
// }

/**
 * 将给定节点的不透明度设置为 0。
 * @param {$} $node 将不透明度设置为 0 的 jQuery 对象。
 */
// function opacity0($node) {
//   $node.css('opacity', '0');
// }

/**
 * 监控探索 feeds 容器的变化。
 * 检测到变化时，执行 hideImgs 函数。
 * @param {MutationObserverInit} observerOptions MutationObserver 的选项。
 */
// function watchChange() {
//   function callback(mutationList, observer) {
//     mutationList.forEach((mutation) => {
//       switch (mutation.type) {
//         case "childList":
//         case "subtree":
//           hideImgs();
//           break;
//       }
//     });
//   }

//   const observerOptions = {
//     childList: true,
//     attributes: true,
//     subtree: true,
//   };

//   const observer = new MutationObserver(callback);
//   setTimeout(() => {
//     const $exploreFeeds = $('.feeds-container');
//     const $imgs = $exploreFeeds.find('.note-item');
//     if ($imgs.length > 0) {
//       observer.observe($exploreFeeds[0], observerOptions);
//     }
//   }, 100);
// }

const config = { attributes: false, childList: true, subtree: true };

/**
 * 创建 MutationObserver 并观察目标节点的变化。
 * 检测到变化时，执行给定的回调函数。
 * @param {Node} targetNode 要观察的节点。
 * @param {function()} callback 检测到变化时要执行的函数。
 */
function observerChange(targetNode, callback) {
  const observer = new MutationObserver((mutationsList) => {
    for (const mutation of mutationsList) {
      callback();
    }
  });
  observer.observe(targetNode, config);
} 