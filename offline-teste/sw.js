/* Service Worker da lançadora offline (protótipo 30/09/2026).
 * O que ele faz: guarda a própria página para ela abrir SEM REDE. Só isso.
 * Não guarda o app do Apps Script (outra origem, não dá) nem a fila (a fila
 * mora no localStorage da página, e o envio é uma navegação que o usuário
 * dispara com rede).
 * Troca de versão = mudar CACHE; o activate apaga as antigas. */
const CACHE = 'estoque-offline-v1';
const CASCA = ['./', './index.html', './manifest.webmanifest'];

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
    const chave = e.request.mode === 'navigate' ? './index.html' : e.request;
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
