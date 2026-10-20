/* PORTÃO DA LANÇADORA · CHIP «Subproduto» + ROXO + NOME «Galpão/Campo» (CON-c10 · G1-L e G1-N · 20/10/2026).
 *
 *   node scripts/teste-chip.js            (de dentro do repositório da lançadora; sai 0 se verde) · `node scripts/teste-chip.js <outro-index.html>` roda sobre outro arquivo
 *
 * A régua do Tobia (20/10 ~10h45): «qdo for Subproduto saindo de uma operação deve usar a cor roxa, o nome e o chip "Subproduto"». O Estoque por etapa da lançadora
 * desenhava a casca com borda cinza (#9AA4B1) e só a palavra miúda no `<small>`; num código novo (`QUE-…`, D44) ela ficava igual ao principal da Quebra.
 * G1-N (coordenação, 20/10 ~11h): o rótulo da chave do Início passa de «Versão offline» para «Galpão/Campo» (DECISIONS «Nomes dos níveis», H10-287).
 * Este portão EXECUTA a `unica/index.html` real num `vm` e lê o ELEMENTO de cada lote no Estoque por etapa e o cartão da chave no Início:
 *   1 · a casca `QUE-…` (sub = true, SEM normalizar) tem o chip «Subproduto» e o roxo #8E5FB0 na borda do elemento; o principal `QUE-…` vizinho, nem chip nem roxo
 *   2 · o `1SUB-…` antigo tem o mesmo chip e o mesmo roxo
 *   3 · o cartão da chave diz «Galpão/Campo» e o texto VISÍVEL do Início não diz mais «Versão offline» (nas duas formas do Início)
 * Os mutantes no fim provam que o portão fica vermelho quando o defeito volta. */
const fs = require('fs'), path = require('path'), vm = require('vm');
const REPO = path.resolve(__dirname, '..');

function pagina(js) {
  const els = {};
  const mk = id => ({ id, innerHTML: '', textContent: '', style: {}, dataset: {}, hidden: false, className: '', value: '', checked: false, disabled: false,
    classList: { add() {}, remove() {}, toggle() {}, contains: () => false }, addEventListener() {}, removeEventListener() {}, setAttribute() {}, getAttribute: () => null,
    removeAttribute() {}, appendChild() {}, focus() {}, blur() {}, click() {}, querySelector: () => null, querySelectorAll: () => [], closest: () => null, scrollIntoView() {} });
  const el = id => els[id] || (els[id] = mk(id));
  const loja = {};
  const stor = { getItem: k => (k in loja ? loja[k] : null), setItem: (k, v) => { loja[k] = String(v); }, removeItem: k => { delete loja[k]; } };
  const doc = { getElementById: el, querySelector: () => null, querySelectorAll: () => [], createElement: () => mk('c'), addEventListener() {}, body: mk('body'), documentElement: mk('html'), head: mk('head'), referrer: '', title: '' };
  const ctx = { console: { log() {}, error() {}, warn() {} }, document: doc, localStorage: stor, sessionStorage: stor,
    navigator: { onLine: false, userAgent: 'node' }, location: { href: 'https://x/gestao-operacional/', search: '', pathname: '/gestao-operacional/', hash: '', origin: 'https://x' },
    history: { replaceState() {}, pushState() {} }, matchMedia: () => ({ matches: false, addEventListener() {} }), fetch: () => Promise.reject(new Error('sem rede')),
    setTimeout: () => 0, clearTimeout() {}, setInterval: () => 0, clearInterval() {}, addEventListener() {}, removeEventListener() {}, requestAnimationFrame: () => 0,
    Promise, JSON, Math, Date, Number, String, Array, Object, RegExp, Error, parseInt, parseFloat, isFinite, isNaN, encodeURIComponent, decodeURIComponent, escape, unescape,
    btoa: s => Buffer.from(s, 'binary').toString('base64'), atob: s => Buffer.from(s, 'base64').toString('binary'), URL, URLSearchParams, Intl, Uint8Array, Map, Set, crypto: { randomUUID: () => 'tok-' + Math.random() }, print() {} };
  ctx.window = ctx; ctx.self = ctx; ctx.globalThis = ctx;
  vm.createContext(ctx);
  vm.runInContext(js, ctx, { filename: 'unica/index.html' });
  const run = e => { try { return vm.runInContext(e, ctx); } catch (er) { return 'ESTOUROU: ' + er.message; } };
  ctx.__orgs = JSON.parse(fs.readFileSync(path.join(REPO, 'unica/organizacoes.json'), 'utf8'));
  run('montarLista(__orgs)');
  const org = run('orgAtual().id');
  return { run, el, ctx, org, loja };
}

const ROXO = /#8E5FB0/i, CHIP = /class="chip-sub"[^>]*>Subproduto<\/span>/;
const SEM_CHIP = h => h.replace(/<span class="chip-sub"[\s\S]*?<\/span>/g, '');
const visivel = h => String(h).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');

function roda(indexTxt) {
  let falhas = 0; const log = [];
  const ok = (c, m) => { if (!c) falhas++; log.push((c ? '  ✅ ' : '  ❌ ') + m); };
  const js = [...indexTxt.matchAll(/<script(?![^>]*\ssrc)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]).sort((a, b) => b.length - a.length)[0];
  let P;
  try { P = pagina(js); } catch (e) { ok(false, 'a página carrega no vm: ' + e.message); return { falhas, log }; }
  const { run, el, org } = P;

  /* 1 e 2 · o Estoque por etapa: a casca nova (QUE-…), o principal vizinho e o 1SUB antigo */
  run(`mudar(function(d){ d.cadastros['${org}'] = { etapas:[{id:'QUE', nome:'Quebra', tipo:'Beneficiamento', cad:[]}, {id:'ARM', nome:'Armazenamento', tipo:'Movimentação', cad:[]}], ord:{REC:1,QUE:3,ARM:4}, operadores:[['OP-1','Gilson']],
    lotes:[['QUE-20261019-003','Casca de Murumuru','Murumuru',334,'QUE',true,95], ['QUE-20261019-001','Amêndoa de Murumuru','Murumuru',1500,'QUE',false,2], ['1SUB-20260630-001','Casca de Tucumã','Tucumã',800,'QUE',true,20]] }; d.orgOffline = '${org}'; d.modoOffline = true; })`);
  run("TELA = { nome:'estoque' }; render();");
  const app = P.el('app').innerHTML;
  const lts = [...app.matchAll(/<div role="button"[^>]*class="lt[^"]*"[\s\S]*?(?=<div role="button"|<\/div><\/div>)/g)].map(m => m[0]);
  const de = cod => lts.filter(h => h.indexOf('data-ficha="' + cod + '"') > -1);
  ok(lts.length === 3, 'o Estoque por etapa desenhou os 3 lotes (' + lts.length + ')');
  const [casca] = de('QUE-20261019-003'), [princ] = de('QUE-20261019-001'), [velha] = de('1SUB-20260630-001');
  ok(!!casca && !!princ && !!velha, 'achei o elemento da casca nova, do principal e da casca antiga');
  if (casca && princ && velha) {
    ok(CHIP.test(casca), 'Estoque › a casca `QUE-…` tem o chip «Subproduto» NO elemento');
    ok(ROXO.test(SEM_CHIP(casca)), 'Estoque › e o roxo #8E5FB0 está na BORDA do elemento (fora do chip)');
    ok(/produto|Casca de Murumuru/.test(casca) && casca.indexOf('Casca de Murumuru') > -1, 'Estoque › e o nome do produto («Casca de Murumuru») continua no elemento');
    ok(!/#9AA4B1/i.test(casca), 'Estoque › sem o cinza antigo (#9AA4B1) na casca');
    ok(!CHIP.test(princ) && !ROXO.test(princ) && !/subproduto/i.test(visivel(princ)), 'Estoque › o principal `QUE-…` vizinho NÃO tem chip, nem roxo, nem a palavra');
    ok(CHIP.test(velha) && ROXO.test(SEM_CHIP(velha)), 'Estoque › o `1SUB-…` antigo também tem o chip e o roxo na borda');
  }
  ok(/\.lt\.sub\{border-left-color:#8E5FB0\}/.test(indexTxt) && !/\.lt\.sub\{border-left-color:#9AA4B1\}/.test(indexTxt), 'o CSS `.lt.sub` é o roxo do token (#8E5FB0), nenhum hex novo');

  /* 3 · o cartão da chave no Início: «Galpão/Campo», sem «Versão offline» — nas duas formas do Início */
  const inicio = (modo, comCad) => {
    P = pagina(js);
    P.run(`mudar(function(d){ d.modoOffline = ${modo}; ${comCad ? `d.cadastros['${P.org}'] = { etapas:[{id:'QUE', nome:'Quebra', tipo:'Beneficiamento', cad:[]}], ord:{REC:1,QUE:3}, operadores:[['OP-1','Gilson']], lotes:[] }; d.orgOffline = '${P.org}';` : ''} })`);
    P.run("TELA = { nome:'inicio' }; render();");
    return P.el('app').innerHTML;
  };
  const formas = [['sem a versão ligada (lista geral)', inicio(false, false)], ['ligada, cadastros no aparelho (a Básica)', inicio(true, true)], ['ligada, sem cadastros ainda', inicio(true, false)]];
  const comCartao = formas.filter(([, h]) => /<label class="chave">/.test(h));
  ok(comCartao.length >= 1, 'o cartão da chave aparece em ' + comCartao.length + ' das 3 formas do Início (' + comCartao.map(f => f[0]).join('; ') + ')');
  comCartao.forEach(([nome, h]) => {
    const cartao = (h.match(/<label class="chave">[\s\S]*?<\/label>/) || [''])[0];
    ok(/<b>Galpão\/Campo<\/b>/.test(cartao), 'Início (' + nome + ') › o cartão diz «Galpão/Campo»');
    ok(/Receber, abrir e fechar\./.test(cartao), 'Início (' + nome + ') › a frase de explicação continua ao lado');
  });
  formas.forEach(([nome, h]) => ok(!/vers(ã|&atilde;)o\s+offline/i.test(visivel(h)), 'Início (' + nome + ') › o texto VISÍVEL não diz «Versão offline»'));
  ok(!/<b>Vers(ã|&atilde;)o offline<\/b>/i.test(indexTxt), 'e o arquivo não tem mais o rótulo `<b>Versão offline</b>`');
  return { falhas, log };
}

const indexTxt = fs.readFileSync(process.argv[2] || path.join(REPO, 'unica/index.html'), 'utf8');   /* argv[2] = outro index.html (vermelho-antes sobre o commit velho) */
const base = roda(indexTxt);
console.log(base.log.join('\n'));
const M = [
  ['a casca perde o chip', "(l.sub ? '<span class=\"chip-sub\" data-chip-sub=\"1\">Subproduto</span>' : '')", "''"],
  ['a casca perde a borda roxa inline (volta ao CSS)', "(l.sub ? ' style=\"border-left-color:#8E5FB0\"' : '')", "''"],
  ['o CSS `.lt.sub` volta ao cinza antigo e a borda inline some', ".lt.sub{border-left-color:#8E5FB0}", ".lt.sub{border-left-color:#9AA4B1}", [["(l.sub ? ' style=\"border-left-color:#8E5FB0\"' : '')", "''"]]],
  ['o chip decide por prefixo `1SUB` (o `QUE-…` de subproduto fica sem chip)', "(l.sub ? '<span class=\"chip-sub\"", "(/^1SUB/.test(l.codigo || '') ? '<span class=\"chip-sub\""],
  ['o chip escreve «subproduto» minúsculo', ">Subproduto</span>' : '')", ">subproduto</span>' : '')"],
  ['o chip pinta em todo lote (o principal vizinho ganha chip)', "(l.sub ? '<span class=\"chip-sub\"", "(true ? '<span class=\"chip-sub\""],
  ['o cartão da chave volta a dizer «Versão offline»', "<div><b>Galpão/Campo</b><span>", "<div><b>Versão offline</b><span>"],
  ['a frase de explicação do cartão sai', "Receber, abrir e fechar. O que você lança", "O que você lança"]
];
let ruim = 0;
console.log('\n── mutantes ──');
M.forEach(([nome, de, para, extra]) => {
  const n = indexTxt.split(de).length - 1;
  if (n !== 1) { console.log('  🔴 o mutante «' + nome + '» NÃO aplicou (' + n + ' ocorrências)'); ruim++; return; }
  let t = indexTxt.replace(de, () => para);
  if (extra) for (const [a, b] of extra) { if (t.split(a).length - 1 !== 1) { console.log('  🔴 o mutante «' + nome + '» NÃO aplicou o 2º par'); ruim++; return; } t = t.replace(a, () => b); }
  const r = roda(t);
  const v = r.falhas > 0; if (!v) ruim++;
  console.log('  ' + (v ? '✅ vermelho ' : '❌ SOBREVIVEU') + ' · ' + nome + ' (' + r.falhas + ' ❌)');
});
const total = base.falhas + ruim;
console.log('\n' + (total ? '🔴 ' + base.falhas + ' falha(s), ' + ruim + ' mutante(s) vivo(s)' : '🟢 lançadora: chip «Subproduto», roxo e «Galpão/Campo» verde'));
process.exit(total ? 1 : 0);
