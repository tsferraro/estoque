/* Service Worker da LANÇADORA ÚNICA (LU, 19/10/2026) — plataforma Mandū: https://mandu-apps.lp.agentesamanda.com/gestao-operacional/
 * Base: o sw.js da lançadora Oficial (15/10). O que mudou:
 *   · cache com prefixo PRÓPRIO `mandu-unica-` (o `activate` apaga só `mandu-unica-*` diferentes do atual; outro app na mesma origem
 *     da plataforma, ou a lançadora do GitHub, não é tocado);
 *   · a casca inclui `organizacoes.json` (a lista de organizações em arquivo: sem ela a lista não abre sem rede);
 *   · os ícones moram SOLTOS na raiz (o desenho evita subpasta para o ícone; `vendor/` segue subpasta, como na Oficial).
 * O que ele faz: guarda a própria página para abrir SEM REDE — e o leitor de QR (`leitor-qr.js` + `vendor/`, com o `.wasm` de ~1 MB),
 * a folha de QR e os ícones. O `addAll` é atômico de propósito: arquivo faltando no servidor derruba a INSTALAÇÃO (o Service Worker
 * antigo continua valendo) em vez de deixar o leitor pela metade. Não guarda o app do Apps Script (outra origem) nem a fila (a fila
 * mora no localStorage da página; o envio é uma navegação que o usuário dispara com rede).
 * Se a plataforma servir este arquivo errado (ex.: `text/html`, medido uma vez em 16/10) o registro falha e a lançadora segue
 * funcionando COM SINAL — a página diz isso (`?sonda=1` mostra a tabela). Troca de versão = mudar CACHE. */
const CACHE = 'mandu-unica-v1';
const CASCA = ['./', './index.html', './manifest.webmanifest', './organizacoes.json', './qr-teste.html', './leitor-qr.js',
  './vendor/qrcode.js', './vendor/zxing-reader.iife.js', './vendor/zxing_reader.wasm',
  './u-mandu-32.png', './u-mandu-180.png', './u-mandu-glifo.png'];
const ARQUIVOS_DA_CASCA = ['', 'index.html', 'qr-teste.html', 'manifest.webmanifest', 'organizacoes.json', 'leitor-qr.js',
  'u-mandu-32.png', 'u-mandu-180.png', 'u-mandu-glifo.png'];

/* o caminho do pedido RELATIVO ao escopo deste Service Worker (`''` = a raiz); `null` se o pedido está fora do escopo */
function caminhoRelativo(url){
  const base = new URL(self.registration.scope).pathname;
  return url.pathname.startsWith(base) ? url.pathname.slice(base.length) : null;
}
function souDaCasca(rel){
  if (rel === null) return false;
  return ARQUIVOS_DA_CASCA.indexOf(rel) >= 0 || rel.indexOf('vendor/') === 0;
}
/* navegação para uma PÁGINA que existe como arquivo (a folha de QR) guarda e devolve ELA MESMA; qualquer outra
   (a raiz, `index.html`, com ou sem `?org=&lote=`) é a lançadora */
function chaveDaNavegacao(rel){ return rel === 'qr-teste.html' ? './qr-teste.html' : './index.html'; }

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CASCA)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k.startsWith('mandu-unica-') && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

/* Mesma origem E dentro da casca da raiz: rede primeiro com teto de 3 s (quem tem sinal pega a versão nova), cache se a
 * rede falhar ou demorar (sinal fraco no galpão não pode deixar a tela branca). Outra origem, ou outro caminho: não mexe. */
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return;
  const rel = caminhoRelativo(url);
  if (!souDaCasca(rel)) return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const chave = e.request.mode === 'navigate' ? chaveDaNavegacao(rel) : e.request;
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
