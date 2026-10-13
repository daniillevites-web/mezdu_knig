(() => {
  'use strict';
  const shortWords = /(?<![\p{L}\p{N}_])(?:в|во|к|ко|с|со|у|о|об|обо|а|и|но|да|не|ни|на|по|из|за|от|до|для|без|при|над|под|про|через|что|как|или|либо|если|чтобы|№)[ \t]+(?=\S)/giu;
  const particles = /(?<=\S)[ \t]+(?=(?:бы|же|ли)(?![\p{L}\p{N}_]))/giu;
  function format(node) {
    if (node.parentElement?.closest('script,style,svg,pre,code,textarea')) return;
    const text = node.data.replace(shortWords, word => word.trimEnd() + '\u00a0')
      .replace(particles, '\u00a0');
    if (text !== node.data) node.data = text;
  }
  function walk(root) {
    if (root.nodeType === Node.TEXT_NODE) { format(root); return; }
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) format(walker.currentNode);
  }
  walk(document.body);
  // Gallery captions and artwork dialogs receive new text as visitors browse.
  new MutationObserver(records => {
    records.forEach(record => {
      if (record.type === 'characterData') format(record.target);
      else record.addedNodes.forEach(walk);
    });
  }).observe(document.body, {subtree: true, childList: true, characterData: true});
})();
