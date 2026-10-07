/* Service Worker da lançadora offline (protótipo 30/09/2026 · OFF4 07/10/2026).
 * O que ele faz: guarda a própria página para ela abrir SEM REDE — e, desde a OFF4, o leitor de QR
 * (`leitor-qr.js` + `vendor/`, com o `.wasm` de ~1 MB) e a folha de QR de teste, para o botão «Ler QR»
 * funcionar na 1ª vez sem rede. O `addAll` é atômico de propósito: arquivo faltando no servidor derruba a
 * INSTALAÇÃO (o Service Worker antigo continua valendo) em vez de deixar o leitor pela metade.
 * Não guarda o app do Apps Script (outra origem, não dá) nem a fila (a fila
 * mora no localStorage da página, e o envio é uma navegação que o usuário
 * dispara com rede).
 * Troca de versão = mudar CACHE; o activate apaga as antigas. */
const CACHE = 'estoque-offline-v4';
const CASCA = ['./', './index.html', './manifest.webmanifest', './qr-teste.html', './leitor-qr.js',
  './vendor/qrcode.js', './vendor/zxing-reader.iife.js', './vendor/zxing_reader.wasm'];
/* navegação para uma PÁGINA que existe como arquivo (a folha de QR) guarda e devolve ELA MESMA; qualquer outra
   (a raiz, `index.html`, com ou sem `?org=&lote=`) é a lançadora */
function chaveDaNavegacao(url){ return url.pathname.split('/').pop() === 'qr-teste.html' ? './qr-teste.html' : './index.html'; }

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CASCA)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k.startsWith('estoque-offline-') && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

/* Mesma origem: rede primeiro com teto de 3 s (quem tem sinal pega a versão
 * nova), cache se a rede falhar ou demorar (sinal fraco no galpão não pode
 * deixar a tela branca). Outra origem: não mexe. */
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const chave = e.request.mode === 'navigate' ? chaveDaNavegacao(url) : e.request;
    try {
      const rede = await Promise.race([
        fetch(e.request),
        new Promise((_, rej) => setTimeout(() => rej(new Error('lento')), 3000))
      ]);
      if (rede && rede.ok) cache.put(chave, rede.clone());
      return rede;
    } catch (err) {
      const guardado = await cache.match(chave, { ignoreSearch: true });
      return guardado || new Response('Sem rede e sem cópia guardada.', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
    }
  })());
});
