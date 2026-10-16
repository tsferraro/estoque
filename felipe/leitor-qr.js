/* Leitor de QR da lançadora offline (OFF4 · 07/10/2026) — carregado SÓ quando o botão «Ler QR» é tocado e o navegador
 * não tem leitor nativo (`BarcodeDetector` com `qr_code`: Chrome Android). O iPhone/Safari cai aqui.
 *
 * Forma de `BarcodeDetector` (`new LeitorQR().detect(fonte)` → `[{rawValue, format}]`) sobre o `zxing-wasm` 3.1.5 (módulo
 * «reader», MIT), tudo servido de `vendor/` — nada de CDN em tempo de uso: o galpão está sem rede.
 *
 * POR QUE NÃO O PACOTE `barcode-detector` 3.2.2: ele traz embutido o glue do zxing-wasm 3.1.3 (dependência fixada em 3.1.3)
 * e o `.wasm` de que ele precisa é o da 3.1.3. Com o `.wasm` da 3.1.5 o módulo carrega e MORRE na primeira leitura
 * («Failed to allocate … bytes in WASM memory», medido no Chrome). O par glue + `.wasm` da MESMA versão (3.1.5, o que
 * o orquestrador baixou) funciona — e `readBarcodes(ImageData)` é tudo de que o `detect()` precisa. */
(function (g) {
  var AQUI = (document.currentScript && document.currentScript.src || '').replace(/[^\/]*$/, '');
  var preparado = false, tela = null;
  function preparar() {
    if (preparado) return; preparado = true;
    g.ZXingWASM.prepareZXingModule({ overrides: { locateFile: function (p, prefixo) { return /\.wasm$/.test(p) ? AQUI + 'vendor/' + p : prefixo + p; } } });
  }
  /* qualquer fonte de imagem (vídeo, canvas, <img>, ImageBitmap, ImageData) → ImageData, com no máx. 1280 px no lado maior */
  function paraImageData(fonte) {
    if (typeof ImageData !== 'undefined' && fonte instanceof ImageData) return fonte;
    var w = fonte.videoWidth || fonte.naturalWidth || fonte.width, h = fonte.videoHeight || fonte.naturalHeight || fonte.height;
    if (!w || !h) throw new Error('a imagem ainda não tem tamanho');
    var k = Math.min(1, 1280 / Math.max(w, h)), cw = Math.round(w * k), ch = Math.round(h * k);
    if (!tela) tela = document.createElement('canvas');
    tela.width = cw; tela.height = ch;
    var c = tela.getContext('2d', { willReadFrequently: true });
    c.drawImage(fonte, 0, 0, cw, ch);
    return c.getImageData(0, 0, cw, ch);
  }
  function LeitorQR() {}
  LeitorQR.getSupportedFormats = function () { return Promise.resolve(['qr_code']); };
  LeitorQR.prototype.detect = function (fonte) {
    var img;
    try { preparar(); img = paraImageData(fonte); } catch (e) { return Promise.reject(e); }
    return g.ZXingWASM.readBarcodes(img, { formats: ['QRCode'], tryHarder: true, tryInvert: true, maxNumberOfSymbols: 1 }).then(function (rs) {
      return rs.filter(function (r) { return r.isValid !== false && r.text; }).map(function (r) { return { rawValue: r.text, format: 'qr_code' }; });
    });
  };
  g.LeitorQR = LeitorQR;
})(window);
