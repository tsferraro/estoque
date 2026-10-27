/* Auxiliar dos portões novos da lançadora (C3 · H10-510): carrega o JavaScript REAL de `unica/index.html` num `vm` com um DOM de mentira e devolve `{ run, el, ctx, org, loja }`.
 * É a mesma `pagina()` do `teste-chip.js` (copiada, para não mexer nele); `largura` e `retrato` ajustam `window.innerWidth/innerHeight` e o `matchMedia` (tablet/celular). */
const fs = require('fs'), path = require('path'), vm = require('vm');
const REPO = path.resolve(__dirname, '..');
/* o `matchMedia` de mentira: entende `(min-width:Npx)`, `(max-width:Npx)` e `(orientation:landscape|portrait)` sobre a largura/altura pedidas */
function consulta(q, opc) {
  const w = opc.largura || 390, h = opc.altura || 800; q = String(q);
  const partes = q.split(/\)\s*and\s*\(/).map(x => x.replace(/^\s*\(|\)\s*$/g, ''));
  return partes.every(p => {
    let m;
    if ((m = /^min-width:\s*(\d+)px$/.exec(p))) return w >= +m[1];
    if ((m = /^max-width:\s*(\d+)px$/.exec(p))) return w <= +m[1];
    if (/^orientation:\s*landscape$/.test(p)) return w > h;
    if (/^orientation:\s*portrait$/.test(p)) return w <= h;
    return false;
  });
}
function jsDe(indexTxt) { return [...indexTxt.matchAll(/<script(?![^>]*\ssrc)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]).sort((a, b) => b.length - a.length)[0]; }
function pagina(js, opc) {
  opc = opc || {};
  const els = {};
  const mk = id => ({ id, innerHTML: '', textContent: '', style: {}, dataset: {}, hidden: false, className: '', value: '', checked: false, disabled: false,
    classList: { add() {}, remove() {}, toggle() {}, contains: () => false }, addEventListener() {}, removeEventListener() {}, setAttribute() {}, getAttribute: () => null,
    removeAttribute() {}, appendChild() {}, focus() {}, blur() {}, click() {}, querySelector: () => null, querySelectorAll: () => [], closest: () => null, scrollIntoView() {} });
  const el = id => els[id] || (els[id] = mk(id));
  const loja = Object.assign({}, opc.loja || {}), nav = [], hist = [], confirmas = [], loc = { search: opc.search || '', hash: opc.hash || '' };   /* `opc.loja` = o que o aparelho já tinha guardado antes de abrir a página */
  const stor = { getItem: k => (k in loja ? loja[k] : null), setItem: (k, v) => { loja[k] = String(v); }, removeItem: k => { delete loja[k]; } };
  const doc = { getElementById: el, querySelector: () => null, querySelectorAll: () => [], createElement: () => mk('c'), addEventListener() {}, body: mk('body'), documentElement: mk('html'), head: mk('head'), referrer: '', title: '' };
  const ctx = { console: { log() {}, error() {}, warn() {} }, document: doc, localStorage: stor, sessionStorage: stor,
    navigator: { onLine: opc.onLine === true, userAgent: 'node' },
    location: { get href() { return 'https://x/gestao-operacional/' + loc.search + loc.hash; }, set href(v) { nav.push(String(v)); }, assign(v) { nav.push(String(v)); }, replace(v) { nav.push(String(v)); },
      get search() { return loc.search; }, pathname: '/gestao-operacional/', get hash() { return loc.hash; }, origin: 'https://x' },
    scrollTo() {}, history: { replaceState(a, b, u) { hist.push(String(u)); const m = /^([^?#]*)(\?[^#]*)?(#.*)?$/.exec(String(u)); if (m) { loc.search = m[2] || ''; loc.hash = m[3] || ''; } }, pushState() {} },
    confirm: m => { confirmas.push(String(m)); return opc.confirm ? opc.confirm(String(m), confirmas.length) : true; }, matchMedia: q => ({ matches: consulta(q, opc), media: q, addEventListener() {}, removeEventListener() {} }), innerWidth: opc.largura || 390, innerHeight: opc.altura || 800, fetch: opc.fetch || (() => Promise.reject(new Error('sem rede'))),
    setTimeout: () => 0, clearTimeout() {}, setInterval: () => 0, clearInterval() {}, addEventListener() {}, removeEventListener() {}, requestAnimationFrame: () => 0,
    Promise, JSON, Math, Date, Number, String, Array, Object, RegExp, Error, parseInt, parseFloat, isFinite, isNaN, encodeURIComponent, decodeURIComponent, escape, unescape,
    btoa: s => Buffer.from(s, 'binary').toString('base64'), atob: s => Buffer.from(s, 'base64').toString('binary'), URL, URLSearchParams, Intl, Uint8Array, Map, Set, crypto: { randomUUID: () => 'tok-' + Math.random() }, print() {} };
  ctx.window = ctx; ctx.self = ctx; ctx.globalThis = ctx;
  vm.createContext(ctx);
  vm.runInContext(js, ctx, { filename: 'unica/index.html' });
  const run = e => { try { return vm.runInContext(e, ctx); } catch (er) { return 'ESTOUROU: ' + er.message; } };
  if (opc.semLista !== true) {                                  /* a página NÃO lê arquivo de lista: os testes entregam a lista de teste a ela */
    ctx.__orgs = JSON.parse(fs.readFileSync(path.join(REPO, 'scripts/fixtures/orgs-teste.json'), 'utf8'));
    run('montarLista(__orgs)');
  }
  const org = run('orgAtual() && orgAtual().id');
  /* `pronto()` espera a abertura da página (promessas do carregamento) terminar */
  const pronto = async () => { for (let i = 0; i < 8; i++) await new Promise(r => setImmediate(r)); };
  return { run, el, ctx, org, loja, nav, hist, confirmas, pronto };
}


module.exports = { pagina, jsDe, consulta, REPO };
