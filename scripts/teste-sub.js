/* PORTÃO DA LANÇADORA · «1SUB» NÃO APARECE (CON-c9 · M7 · 19/10/2026 · H10-361: «Eu não quero ter que pedir esta mesma correção pela 10ª vez!»).
 *
 *   node scripts/teste-sub.js            (de dentro do repositório da lançadora; sai 0 se verde) · `node scripts/teste-sub.js <outro-index.html>` roda sobre outro arquivo
 *
 * A CHAVE gravada continua `1SUB-AAAAMMDD-NNN` (planilha, QR, fila, fichas); o que a pessoa LÊ é `SUB-AAAAMMDD-NNN`. Quem lê o QR de uma etiqueta de casca via «1SUB-…» na
 * ficha da lançadora (`esc(cod)` cru), enquanto a etiqueta dizia «SUB-…». Este portão EXECUTA a página (`unica/index.html`) num `vm` e lê o que ela escreve na tela:
 *   1 · `codigoExibicao` e `textoVisivel_`: trocam nos nós de texto e nos atributos que se leem; `data-*`, `value` e `href` ficam com a chave
 *   2 · a ficha do lote `1SUB-…` (a tela que o Tobia viu): o texto visível diz `SUB-…`, a chave segue no endereço de volta
 *   3 · o `toast` e as faixas que se repintam passam pela mesma troca
 *   4 · NENHUM `app.innerHTML = …` escapa da troca (varredura do texto do `render`)
 * Os mutantes no fim provam que o portão fica vermelho quando o defeito volta. */
const fs = require('fs'), path = require('path'), vm = require('vm');
const REPO = path.resolve(__dirname, '..');

function roda(indexTxt) {
  let falhas = 0; const log = [];
  const ok = (c, m) => { if (!c) falhas++; log.push((c ? '  ✅ ' : '  ❌ ') + m); };
  const eq = (m, g, e) => ok(JSON.stringify(g) === JSON.stringify(e), m + ' → ' + JSON.stringify(g) + (JSON.stringify(g) === JSON.stringify(e) ? '' : '  (esperado ' + JSON.stringify(e) + ')'));
  const scripts = [...indexTxt.matchAll(/<script(?![^>]*\ssrc)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
  const js = scripts.sort((a, b) => b.length - a.length)[0];

  /* a página inteira num `vm`, com um DOM de mentira que GUARDA o que ela escreve em #app, #toast e nas faixas */
  const els = {};
  const mk = id => {
    const e = { id, innerHTML: '', textContent: '', style: {}, dataset: {}, hidden: false, className: '', value: '', checked: false, disabled: false,
      classList: { add() {}, remove() {}, toggle() {}, contains: () => false }, addEventListener() {}, removeEventListener() {}, setAttribute() {}, getAttribute: () => null,
      removeAttribute() {}, appendChild() {}, focus() {}, blur() {}, click() {}, querySelector: () => null, querySelectorAll: () => [], closest: () => null, scrollIntoView() {} };
    return e;
  };
  const el = id => els[id] || (els[id] = mk(id));
  const loja = {};
  const stor = { getItem: k => (k in loja ? loja[k] : null), setItem: (k, v) => { loja[k] = String(v); }, removeItem: k => { delete loja[k]; } };
  const doc = { getElementById: el, querySelector: () => mk('q'), querySelectorAll: () => [], createElement: () => mk('c'), addEventListener() {}, body: mk('body'), documentElement: mk('html'), head: mk('head'), referrer: '', title: '' };
  const ctx = { console: { log() {}, error() {}, warn() {} }, document: doc, localStorage: stor, sessionStorage: stor,
    navigator: { onLine: true, userAgent: 'node', serviceWorker: undefined }, location: { href: 'https://x/gestao-operacional/', search: '', pathname: '/gestao-operacional/', hash: '', origin: 'https://x' },
    history: { replaceState() {}, pushState() {} }, matchMedia: () => ({ matches: false, addEventListener() {} }), fetch: () => Promise.reject(new Error('sem rede no teste')),
    setTimeout: () => 0, clearTimeout() {}, setInterval: () => 0, clearInterval() {}, addEventListener() {}, removeEventListener() {}, requestAnimationFrame: () => 0,
    Promise, JSON, Math, Date, Number, String, Array, Object, RegExp, Error, parseInt, parseFloat, isFinite, isNaN, encodeURIComponent, decodeURIComponent, escape, unescape, btoa: s => Buffer.from(s, 'binary').toString('base64'), atob: s => Buffer.from(s, 'base64').toString('binary'),
    URL, URLSearchParams, Intl, Uint8Array, Map, Set, window: null, print() {} };
  ctx.window = ctx; ctx.self = ctx; ctx.globalThis = ctx;
  vm.createContext(ctx);
  try { vm.runInContext(js, ctx, { filename: 'unica/index.html' }); } catch (e) { ok(false, 'a página carrega no vm: ' + e.message); return { falhas, log }; }
  const run = e => { try { return vm.runInContext(e, ctx); } catch (er) { return 'ESTOUROU: ' + er.message; } };   /* expressão que estoura vira texto: o vermelho-antes mostra O QUE faltou */

  /* 1 · a troca */
  eq('`codigoExibicao` troca a chave pelo nome de tela', run("codigoExibicao('1SUB-20261019-001')"), 'SUB-20261019-001');
  eq('...só no começo do código (não mexe em «X1SUB-»)', run("codigoExibicao('lote 1SUB-20261019-001 e X1SUB-1')"), 'lote SUB-20261019-001 e X1SUB-1');
  eq('...e deixa os outros códigos como estão', run("codigoExibicao('REC-20261019-001 · SEC-20261019-002')"), 'REC-20261019-001 · SEC-20261019-002');
  const h = run("textoVisivel_('<p title=\"1SUB-20261019-001\" data-lote=\"1SUB-20261019-001\">Casca 1SUB-20261019-001</p><input value=\"1SUB-20261019-001\"><a href=\"?lote=1SUB-20261019-001\">ver 1SUB-20261019-001</a>')");
  ok(/>Casca SUB-20261019-001</.test(h) && /title="SUB-20261019-001"/.test(h) && />ver SUB-20261019-001</.test(h), '`textoVisivel_` troca no texto e no `title`: ' + h.slice(0, 90) + '…');
  ok(/data-lote="1SUB-20261019-001"/.test(h) && /value="1SUB-20261019-001"/.test(h) && /href="\?lote=1SUB-20261019-001"/.test(h), '...e deixa a chave em `data-lote`, `value` e `href` (o que a máquina lê)');

  /* 2 · a ficha do lote (a tela que o Tobia viu) */
  run("TELA = { nome: 'ficha', org: 'camtaua-demo', lote: '1SUB-20261019-001', via: 'link' }; render();");
  const app = els.app ? els.app.innerHTML : '';
  ok(app.length > 0, 'a ficha foi desenhada em #app (' + app.length + ' caracteres)');
  const visivel = app.replace(/<[^>]*>/g, ' ');
  ok(/SUB-20261019-001/.test(visivel) && !/1SU/.test(visivel), 'o texto VISÍVEL da ficha diz `SUB-20261019-001` e não tem «1SU» · «' + (visivel.match(/\S*SUB-20261019-001\S*/) || ['(sem o código)'])[0] + '»');
  ok(/id="ficha-codigo"[^>]*>\s*SUB-20261019-001\s*</.test(app), 'o parágrafo `#ficha-codigo` (o que o QR abre) escreve `SUB-20261019-001`');

  const cru = run("telaFicha(ler())");
  ok(!/1SU/.test(String(cru).replace(/<[^>]*>/g, ' ')), 'e a própria `telaFicha` (antes do `render` repassar) já escreve `SUB-…` no texto visível — duas camadas, uma não esconde a outra');
  /* 3 · toast e faixas */
  run("toast('gravado · 1SUB-20261019-001')");
  eq('o `toast` passa pela troca', els.toast.textContent, 'gravado · SUB-20261019-001');
  run("AUTO.motivo = 'x'; AUTO.msg = 'o lote 1SUB-20261019-001 entrou'; 0");
  ok(/function faixaAutoHtml/.test(indexTxt) && /slot\.innerHTML = textoVisivel_\(faixaAutoHtml\(\)\)/.test(indexTxt), 'a faixa do envio automático passa pela troca (varredura do texto)');
  ok(/sl\.innerHTML = linhas\.length \? textoVisivel_\(balancoAbrirHtml/.test(indexTxt) && /sl\.innerHTML = \(saiu > 0[^;]*textoVisivel_\(balancoFecharHtml/.test(indexTxt), 'e as duas faixas de balanço (Abrir e Fechar) também');

  /* 4 · nada escapa */
  const rt = indexTxt.slice(indexTxt.indexOf('function render(){'));
  const corpo = rt.slice(0, rt.indexOf('\n}\n'));
  const sitios = corpo.match(/app\.innerHTML = [^;]+;/g) || [];
  ok(sitios.length >= 12, 'o `render` tem ' + sitios.length + ' pontos de saída em #app');
  const soltos = sitios.filter(s => !/^app\.innerHTML = textoVisivel_\(/.test(s));
  eq('...e NENHUM escapa da troca', soltos, []);
  return { falhas, log };
}

const indexTxt = fs.readFileSync(process.argv[2] || path.join(REPO, 'unica/index.html'), 'utf8');   /* argv[2] = outro index.html (vermelho-antes sobre o commit velho) */
const base = roda(indexTxt);
console.log(base.log.join('\n'));
const M = [
  ['a ficha volta a escrever o código cru (`esc(cod)`) — o defeito original (H10-361)', "esc(codigoExibicao(cod)) + '</p>';", "esc(cod) + '</p>';"],
  ['a lista de saída da ficha (telaFicha) sai da troca no `render`', "app.innerHTML = textoVisivel_(telaFicha(db));", "app.innerHTML = telaFicha(db);"],
  ['o Início (lista) sai da troca', "app.innerHTML = textoVisivel_(h); ligarInicio(); return;", "app.innerHTML = h; ligarInicio(); return;"],
  ['o `toast` escreve o texto cru', "t.textContent = codigoExibicao(msg);", "t.textContent = msg;"],
  ['`codigoExibicao` não troca nada', "replace(/(^|[^A-Za-z0-9])1SUB-/g, '$1SUB-')", "replace(/(^|[^A-Za-z0-9])1SUB-/g, '$11SUB-')"],
  ['`textoVisivel_` troca também os atributos `data-*` (a chave deixaria de casar)', "p.replace(/\\b(?:title|aria-label|placeholder)=\"[^\"]*\"/g, codigoExibicao)", "p.replace(/\\b(?:title|aria-label|placeholder|data-lote|value|href)=\"[^\"]*\"/g, codigoExibicao)"],
  ['a faixa de balanço do Abrir sai da troca', "textoVisivel_(balancoAbrirHtml(linhas, tot))", "balancoAbrirHtml(linhas, tot)"]
];
let ruim = 0;
console.log('\n── mutantes ──');
M.forEach(([nome, de, para]) => {
  const n = indexTxt.split(de).length - 1;
  if (n !== 1) { console.log('  🔴 o mutante «' + nome + '» NÃO aplicou (' + n + ' ocorrências)'); ruim++; return; }
  const r = roda(indexTxt.replace(de, () => para));
  const v = r.falhas > 0; if (!v) ruim++;
  console.log('  ' + (v ? '✅ vermelho ' : '❌ SOBREVIVEU') + ' · ' + nome + ' (' + r.falhas + ' ❌)');
});
const total = base.falhas + ruim;
console.log('\n' + (total ? '🔴 ' + base.falhas + ' falha(s), ' + ruim + ' mutante(s) vivo(s)' : '🟢 lançadora sem «1SUB» na tela verde'));
process.exit(total ? 1 : 0);
