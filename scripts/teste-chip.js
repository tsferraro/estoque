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
 * CON-c10-r2 (continuação 12): G2 (Abrir › Armazenamento, «Na operação» e «Disponíveis»), m2 (ficha do QR), m3 (nenhum texto visível «modo offline»/«Versão offline»/«Versão Básica»)
 * e a VARREDURA: todo ponto da `unica/index.html` que escreve o código de um lote na tela passa por `chipSub(` (janela de ±2 linhas) ou está na lista de exceção escrita aqui, com o porquê.
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

  /* ── G2 · Lançadora › Abrir › Armazenamento: «Na operação» (.linha) e «Disponíveis» (.card[data-pega]) — a casca nova, a antiga e o principal vizinho ── */
  const CASCA = 'QUE-20261019-003', PRINC = 'QUE-20261019-001', VELHA = '1SUB-20260630-001', ARMZ = 'ARM-20261019-004';
  const monta = (P2, extra) => P2.run(`mudar(function(d){ d.cadastros['${P2.org}'] = Object.assign({ etapas:[{id:'QUE', nome:'Quebra', tipo:'Beneficiamento', cad:[]}, {id:'ARM', nome:'Armazenamento', tipo:'Movimentação', cad:[]}], ord:{REC:1,QUE:3,ARM:4}, operadores:[['OP-1','Gilson']],
    lotes:[['${CASCA}','Casca de Murumuru','Murumuru',334,'QUE',1,95], ['${PRINC}','Amêndoa de Murumuru','Murumuru',1500,'QUE',0,2], ['${VELHA}','Casca de Tucumã','Tucumã',800,'QUE',1,20], ['${ARMZ}','Casca de Tucumã','Tucumã',120,'ARM',1,3]] }, ${JSON.stringify(extra || {})}); d.orgOffline = '${P2.org}'; d.modoOffline = true; })`);
  const pedaco = (h, abre, fim) => { const i = h.indexOf(abre); if (i < 0) return ''; const f = h.indexOf(fim, i + abre.length); return h.slice(i, f < 0 ? i + 2500 : f + fim.length); };
  P = pagina(js); monta(P);
  P.run("TELA = { nome:'abrir', form:{ etapa:'ARM', lotes:{}, obs:'' } }; render();");
  const hAbrir = P.el('app').innerHTML;
  const cardDe = c => pedaco(hAbrir, '<button class="card" data-pega="' + c + '"', '</button>');
  const [cCasca, cPrinc, cVelha] = [cardDe(CASCA), cardDe(PRINC), cardDe(VELHA)];
  ok(!!cCasca && !!cPrinc && !!cVelha, 'Abrir › Disponíveis · achei os 3 cartões (casca nova, principal, casca antiga)');
  [['a casca `QUE-…`', cCasca], ['a casca antiga `1SUB-…`', cVelha]].forEach(([n, c]) => {
    ok(CHIP.test(c), 'Abrir › Disponíveis › ' + n + ' tem o chip «Subproduto» NO cartão');
    ok(ROXO.test(SEM_CHIP(c)), 'Abrir › Disponíveis › ' + n + ' tem o roxo #8E5FB0 na BORDA do cartão (fora do chip)');
  });
  ok(cCasca.indexOf('Casca de Murumuru') > -1, 'Abrir › Disponíveis › o nome do produto («Casca de Murumuru») continua no cartão');
  ok(!CHIP.test(cPrinc) && !ROXO.test(cPrinc) && !/subproduto/i.test(visivel(cPrinc)), 'Abrir › Disponíveis › o principal `QUE-…` vizinho NÃO tem chip, nem roxo, nem a palavra');
  /* «Na operação»: a casca e o principal trazidos para a operação (a .linha) */
  P.run(`TELA.form.lotes['${CASCA}'] = { kg:'100', naoAcabou:true }; TELA.form.lotes['${PRINC}'] = { kg:'100', naoAcabou:true }; TELA.form.lotes['${VELHA}'] = { kg:'100', naoAcabou:true }; render();`);
  const hOp = P.el('app').innerHTML;
  const linhaDe = c => { const i = hOp.indexOf('data-tira="' + c + '"'); return i < 0 ? '' : hOp.slice(hOp.lastIndexOf('<div class="linha"', i), i + 80); };
  const [lCasca, lPrinc, lVelha] = [linhaDe(CASCA), linhaDe(PRINC), linhaDe(VELHA)];
  ok(!!lCasca && !!lPrinc && !!lVelha, 'Abrir › Na operação · achei as 3 linhas (casca nova, principal, casca antiga)');
  [['a casca `QUE-…`', lCasca], ['a casca antiga `1SUB-…`', lVelha]].forEach(([n, c]) => {
    ok(CHIP.test(c), 'Abrir › Na operação › ' + n + ' tem o chip «Subproduto» NA LINHA');
    ok(ROXO.test(SEM_CHIP(c)), 'Abrir › Na operação › ' + n + ' tem o roxo #8E5FB0 na BORDA da linha (fora do chip)');
  });
  ok(/margin-bottom:0/.test(lCasca), 'Abrir › Na operação › a linha da casca conserva o `margin-bottom:0` que já tinha');
  ok(!CHIP.test(lPrinc) && !ROXO.test(lPrinc) && !/subproduto/i.test(visivel(lPrinc)), 'Abrir › Na operação › o principal `QUE-…` vizinho NÃO tem chip, nem roxo, nem a palavra');

  /* ── m2 · a ficha do QR: o cabeçalho com o produto + chip e a borda roxa; o principal, limpo ── */
  const ficha = (cod, fi, extraLotes) => {
    const P2 = pagina(js); monta(P2, { fichas: { [cod]: fi } });
    P2.run(`TELA = { nome:'ficha', org:'${P2.org}', lote:'${cod}', via:'' }; render();`);
    return P2.el('app').innerHTML;
  };
  const fCasca = ficha(CASCA, ['Casca de Murumuru', 'QUE', 'Subproduto em estoque', '2026-10-19', 334, 334, [], [], 0, 0]);
  const fPrinc = ficha(PRINC, ['Amêndoa de Murumuru', 'QUE', 'Em estoque', '2026-10-19', 1500, 1500, [], [], 0, 0]);
  const fVelha = ficha(VELHA, ['Casca de Tucumã', 'QUE', 'Subproduto em estoque', '2026-06-30', 800, 800, [], [], 0, 0]);
  const fArmz = ficha(ARMZ, ['Casca de Tucumã', 'ARM', 'Armazenado', '2026-10-19', 120, 120, [], [], 0, 0]);
  const cabF = h => pedaco(h, '<div class="ficha" id="ficha"', '<dl>');
  ok(cabF(fCasca).length > 0 && cabF(fPrinc).length > 0, 'ficha › achei o cabeçalho da ficha da casca e o do principal (' + cabF(fCasca).length + ' / ' + cabF(fPrinc).length + ' car.)');
  [['a casca `QUE-…` (estado «Subproduto em estoque»)', fCasca], ['a casca antiga `1SUB-…`', fVelha], ['a casca armazenada `ARM-…` (estado «Armazenado», `sub` só no pacote)', fArmz]].forEach(([n, h]) => {
    const c = cabF(h);
    ok(CHIP.test(c) && /id="ficha-produto"[^>]*>[^<]*Casca[^<]*<span class="chip-sub"/.test(c), 'ficha › ' + n + ' · o chip «Subproduto» está ao lado do NOME do produto');
    ok(ROXO.test(SEM_CHIP(c)), 'ficha › ' + n + ' · e o roxo #8E5FB0 está na BORDA da ficha (fora do chip)');
  });
  ok(!CHIP.test(cabF(fPrinc)) && !ROXO.test(cabF(fPrinc)) && !/subproduto/i.test(visivel(cabF(fPrinc))), 'ficha › o principal `QUE-…` NÃO tem chip, nem roxo, nem a palavra no cabeçalho');

  /* ── C12 · H10-436 (7) · a ficha do QR de uma casca com SALDO 0 (fora de `lotes`, sem `pl`): o campo ADITIVO `fi[13]` do pacote (0|1) diz o tipo ── */
  const ficha0 = (cod, fi) => { const P2 = pagina(js); monta(P2, { fichas: { [cod]: fi } }); P2.run(`TELA = { nome:'ficha', org:'${P2.org}', lote:'${cod}', via:'' }; render();`); return P2.el('app').innerHTML; };
  const ARM0 = 'ARM-20260910-002', ARM1 = 'ARM-20260629-001';
  const fZero = ficha0(ARM0, ['Casca de Tucumã', 'ARM', 'Armazenado', '2026-09-10', 1028, 0, [], [], 0, 1028, 0, null, null, 1]);
  const fZeroP = ficha0(ARM1, ['Semente de Andiroba Seca', 'ARM', 'Armazenado', '2026-06-29', 250, 0, [], [], 0, 250, 0, null, null, 0]);
  const fAntigo = ficha0(ARM0, ['Casca de Tucumã', 'ARM', 'Armazenado', '2026-09-10', 1028, 0, [], [], 0]);   /* pacote de ANTES do campo: tolera a ausência (sem chip, como antes) */
  ok(CHIP.test(cabF(fZero)) && ROXO.test(SEM_CHIP(cabF(fZero))), 'ficha › a casca armazenada com SALDO 0 e `fi[13] = 1` tem o chip e a borda roxa (sem `lotes`, sem `pl`) · ' + visivel(cabF(fZero)).slice(0, 60));
  ok(!CHIP.test(cabF(fZeroP)) && !ROXO.test(cabF(fZeroP)), 'ficha › o principal com saldo 0 e `fi[13] = 0` NÃO tem chip nem roxo');
  ok(cabF(fAntigo).length > 0 && !CHIP.test(cabF(fAntigo)) && !/ESTOUROU/.test(fAntigo), 'ficha › o pacote de antes do campo (`fi` sem [13]) ainda abre a ficha e não quebra (a lançadora tolera a ausência)');

  /* ── C12 · H10-436 (1) · a pergunta da SOBRA (um lote e vários) leva o chip; o `sub` do lote chega até ela ── */
  P = pagina(js);
  const spCasca = P.run(`sobraPerguntaHtml_([{lote:'k1', rotulo:'${CASCA}', saldo:334, kg:200, resto:134, sub:true}])`), spPrinc = P.run(`sobraPerguntaHtml_([{lote:'k2', rotulo:'${PRINC}', saldo:1500, kg:1000, resto:500, sub:false}])`);
  ok(new RegExp('do lote <b>' + CASCA + '</b><span class="chip-sub"').test(spCasca) && (spCasca.match(/class="chip-sub"/g) || []).length === 1, 'sobra › a pergunta de UM lote de casca tem o chip «Subproduto» colado ao código');
  ok(!CHIP.test(spPrinc) && /do lote <b>QUE-20261019-001<\/b>\. /.test(spPrinc), 'sobra › e a de um principal NÃO tem chip');
  const spVarios = P.run(`sobraPerguntaHtml_([{lote:'k1', rotulo:'${CASCA}', saldo:334, kg:200, resto:134, sub:true}, {lote:'k2', rotulo:'${PRINC}', saldo:1500, kg:1000, resto:500, sub:false}])`);
  ok((spVarios.match(/class="chip-sub"/g) || []).length === 1 && new RegExp(CASCA + '<span class="chip-sub"').test(spVarios), 'sobra › com vários lotes o chip fica só na linha da casca');
  const sg = P.run(`JSON.stringify(sobraGrandeDoAbrir_({ lotes: { k1: { kg:'200', naoAcabou:false }, k2: { kg:'1000', naoAcabou:false } } }, { lotes: { k1: { codigo:'${CASCA}', saldo:334, sub:1 }, k2: { codigo:'${PRINC}', saldo:1500, sub:0 } } }).map(function(x){ return [x.rotulo, x.sub]; }))`);
  ok(sg === JSON.stringify([[CASCA, true], [PRINC, false]]), 'sobra › `sobraGrandeDoAbrir_` leva o sinal `sub` do lote até a pergunta · ' + sg);

  /* ── C12 · H10-436 (2) · a linha da FILA («Abrir Armazenamento · 334 kg») diz o lote com PRODUTO e chip, não só o código ── */
  const filaDe = (lotes, produto, extraCad) => {
    const P2 = pagina(js); monta(P2, extraCad);
    const it = { token:'t1', tipo:'abrir', org:P2.org, quando:'2026-10-20T10:00:00.000Z', estado:'recusado', erro:'x', payload:{ etapa:'ARM', etapaNome:'Armazenamento', produto, lotes } };
    return P2.run(`linhaFila(${JSON.stringify(it)}, [], 'America/Sao_Paulo')`);
  };
  const lfCasca = filaDe([{ kg:334, codigo:CASCA, esgotou:true }], 'Casca de Murumuru'), lfPrinc = filaDe([{ kg:1500, codigo:PRINC, esgotou:true }], 'Amêndoa de Murumuru');
  ok(/lote QUE-20261019-003 · Casca de Murumuru<span class="chip-sub"[^>]*>Subproduto<\/span>/.test(lfCasca), 'fila › a linha do Abrir de uma casca diz «lote QUE-… · Casca de Murumuru» com o chip «Subproduto» · ' + visivel(lfCasca).slice(0, 110));
  ok(/lote QUE-20261019-001 · Amêndoa de Murumuru/.test(lfPrinc) && !CHIP.test(lfPrinc), 'fila › e a de um principal diz o produto e NÃO tem chip');
  const lfZero = filaDe([{ kg:1028, codigo:ARM0, esgotou:true }], 'Casca de Tucumã', { fichas: { [ARM0]: ['Casca de Tucumã', 'ARM', 'Armazenado', '2026-09-10', 1028, 0, [], [], 0, 1028, 0, null, null, 1] } });
  ok(CHIP.test(lfZero) && /Casca de Tucumã/.test(lfZero), 'fila › a casca esgotada (já fora de `lotes`, só na ficha com `fi[13] = 1`) também leva o chip');
  const lfLocal = filaDe([{ kg:50, ref:'r1' }], 'Casca de Murumuru');
  ok(/lote guardado no aparelho · Casca de Murumuru/.test(lfLocal), 'fila › o lote ainda sem código diz «guardado no aparelho» e o produto');

  /* ── C12-CON · menor 4 · a linha da fila do FECHAR já enviado: «na planilha · <códigos>» — o código da casca que o Fechar gravou leva o chip (o par do «Gravado: …» do app) ── */
  const filaFechar = (estado, extra) => {
    const P2 = pagina(js); monta(P2);
    const it = Object.assign({ token:'t9', tipo:'fechar', org:P2.org, quando:'2026-10-20T10:00:00.000Z', estado, codigos:[PRINC, CASCA], payload:{ etapa:'QUE', etapaNome:'Quebra', codigo:PRINC, pesoSaida:1834 } }, extra || {});
    return P2.run(`linhaFila(${JSON.stringify(it)}, [], 'America/Sao_Paulo')`);
  };
  const lfEnv = filaFechar('enviado'), stEnv = (lfEnv.match(/<div class="st">[\s\S]*?<\/div>/) || [''])[0];
  ok(new RegExp('na planilha · ' + PRINC + ', ' + CASCA + '<span class="chip-sub"[^>]*>Subproduto</span>').test(stEnv) && (stEnv.match(/class="chip-sub"/g) || []).length === 1, 'fila › «na planilha · …» do Fechar enviado: o chip «Subproduto» fica SÓ no código da casca, o principal não · ' + visivel(stEnv).slice(0, 90));
  const stRep = (filaFechar('enviado', { repetido:true }).match(/<div class="st">[\s\S]*?<\/div>/) || [''])[0];
  ok(/já estava na planilha · /.test(stRep) && CHIP.test(stRep), 'fila › «já estava na planilha · …» (repetido) também leva o chip na casca');
  ok(!CHIP.test(filaFechar('enviado', { codigos:[PRINC] })), 'fila › Fechar enviado só com o principal: sem chip');
  const stAl = (filaFechar('enviado', { alerta:true, mensagem:'já estava fechada — confira o peso no app' }).match(/<div class="st">[\s\S]*?<\/div>/) || [''])[0];
  ok(/já estava fechada/.test(stAl) && !CHIP.test(stAl), 'fila › o alerta («já estava fechada») segue só com a mensagem');
  ok(/<div class="st">guardado no aparelho/.test(filaFechar('guardado')) && /<div class="st">recusado pela planilha: x/.test(filaFechar('recusado', { erro:'x' })), 'fila › guardado e recusado seguem iguais (texto simples)');

  /* ── m3 · o nome do app do aparelho em TODO texto visível = «Galpão/Campo» ── */
  const PV = pagina(js); monta(PV);
  PV.run("mudar(function(d){ delete d.cadastros[orgAtual().id]; d.modoOffline = true; d.orgOffline = orgAtual().id; }); TELA = { nome:'inicio' }; render();");
  const hPrep = PV.el('app').innerHTML;
  ok(/id="btn-preparar">Preparar o Galpão\/Campo<\/button>/.test(hPrep), 'Início (ligada, sem cadastros) › o botão diz «Preparar o Galpão/Campo»');
  PV.run("mudar(function(d){ d.cadastros[orgAtual().id] = { etapas:[], ord:{}, operadores:[], lotes:[] }; }); TELA = { nome:'inicio' }; render();");
  const hBas = PV.el('app').innerHTML;
  ok(/<small>Galpão\/Campo · neste aparelho<\/small>/.test(hBas), 'Início (a Básica, cadastros no aparelho) › o cabeçalho diz «Galpão/Campo · neste aparelho»');
  const PN = pagina(js);
  PN.ctx.__o2 = JSON.parse(JSON.stringify(PN.ctx.__orgs)); PN.ctx.__o2.organizacoes.forEach(o => { o.deployment = ''; o.deploymentUnico = ''; });
  PN.run('montarLista(__o2)');
  PN.run(`TELA = { nome:'ficha', org:'${PN.run('disponiveis()[0].id')}', lote:'${CASCA}', via:'' }; render();`);
  const hNaoLib = PN.el('app').innerHTML;
  ok(/id="ficha-msg">O Galpão\/Campo ainda não está liberado para /.test(hNaoLib), 'ficha (organização sem o Galpão/Campo liberado) › a frase diz «O Galpão/Campo ainda não está liberado para …»');
  const todos = [['Início sem a versão ligada', formas[0][1]], ['Início ligada, cadastros no aparelho', hBas], ['Início ligada, sem cadastros', hPrep], ['ficha sem liberação', hNaoLib], ['ficha da casca', fCasca]];
  todos.forEach(([n, h]) => ok(!/(modo offline|vers(ã|&atilde;)o offline|vers(ã|&atilde;)o b(á|&aacute;)sica)/i.test(visivel(h)), n + ' › nenhum texto visível «modo offline», «Versão offline» ou «Versão Básica»'));
  ok(!/Modo offline preparado/.test(indexTxt) && /Galpão\/Campo preparado · cadastros guardados no aparelho/.test(indexTxt), 'o aviso depois de preparar diz «Galpão/Campo preparado · cadastros guardados no aparelho» (e não mais «Modo offline preparado»)');
  const visFonte = indexTxt.split('\n').filter(l => !/^\s*(\/\*|\*|\/\/)/.test(l)).join('\n');
  ok(!/modo offline/i.test(visFonte) && !/Vers(ã|&atilde;)o B(á|&aacute;)sica/i.test(visFonte), 'e NENHUMA linha de código do arquivo (fora de comentário) escreve «modo offline» ou «Versão Básica»');
  ok(/chk-off/.test(indexTxt) && /db\.modoOffline/.test(indexTxt), 'a chave gravada `db.modoOffline` e o id `chk-off` continuam (só o texto mudou)');

  /* ── a VARREDURA · todo ponto que escreve o CÓDIGO de um lote na tela passa por `chipSub(` (janela de ±2 linhas) ou está na lista de exceção ── */
  /* LIMITE DECLARADO da varredura (c12 · H10-436 (6)): ela só enxerga o código escrito por `esc(<acesso>)` com o último nome `codigo|lote|cod` (o acesso por ÍNDICE, `x[0].lote`, entra desde a c12),
     por `esc(codigoExibicao(<acesso>))`, por `rotuloLote(`/`rotuloOp(`, pela LISTA `x.codigos` (c12-con: o `join` da linha «na planilha · a, b» da fila) e por concatenação `x.codigo + '…'` / `'…' + x.codigo`. NÃO enxerga: (a) cartão de lote que mostra só produto + kg e leva o código apenas em
     `data-*`; (b) código montado por OUTRA função (`rotulo(l)`) fora desses nomes; (c) o código dentro de SVG; (d) a janela de ±2 linhas dá o chip por perto, não diz QUAL render dela o leva —
     cada render novo de lote se confere a olho e com um assert de elemento, como os de cima. */
  const linhasJs = js.split('\n'); const sitios = []; let fn = '(topo)';
  const reSit = /esc\(\s*(codigoExibicao\(\s*)?(\w+(?:(?:\[\w+\])|(?:\.\w+))*)\s*\)|rotuloLote\(|rotuloOp\(|(\w+)\.codigo\s*\+\s*['"]|['"]\s*\+\s*(\w+)\.codigo\b|\(\s*(\w+)\.codigo\s*\|\|\s*'|\b\w+\.codigos\b/g;   // c12-con: `x.codigos` (a LISTA de códigos que o servidor devolveu: a linha «na planilha · a, b» da fila) — era o `join` que a varredura não via
  linhasJs.forEach((ln, i) => {
    const f = ln.match(/^(?:async\s+)?function\s+(\w+)/); if (f) fn = f[1];
    if (/^\s*(\/\*|\*|\/\/)/.test(ln)) return;
    let m; reSit.lastIndex = 0;
    while ((m = reSit.exec(ln))) {
      if (m[2]) { const ult = m[2].split('.').pop(); if (!m[1] && !/^(codigo|lote|cod)$/.test(ult)) continue; }
      const ant = ln.slice(Math.max(0, m.index - 40), m.index);
      if (/="\s*(['"]\s*\+\s*|\$\{)?$/.test(ant) || /="\s*['"]?\s*\+\s*$/.test(ant) || (/['"]\s*\+\s*$/.test(ant) && /="[^"]*$/.test(ant))) continue;   // atributo, não texto
      const jan = linhasJs.slice(Math.max(0, i - 2), i + 3).join('\n');
      sitios.push({ fn, trecho: m[2] ? 'esc(' + (m[1] ? 'codigoExibicao(' : '') : m[0].slice(0, 24), chip: /chipSub\(/.test(jan) });
    }
  });
  /* A LISTA DE EXCEÇÃO · `função|trecho` → o porquê. Exceção que já tem chip ou que sumiu do código falha (a lista não envelhece calada). */
  const EXC = {
    'rotuloLote|rotuloLote(':          'é a DEFINIÇÃO do rótulo em texto (`código · há N dias`); quem o desenha em cartão/linha (Abrir) leva o chip ao lado',
    'atualizarAbrir|(l.codigo || \'':   'rótulo da legenda do Balanço de Massa (texto da barra), não um cartão/linha de lote',
    'sobraGrandeDoAbrir_|(l.codigo || \'': 'rótulo que alimenta a frase da pergunta da sobra grande (texto corrido)',
    'rotuloOp|rotuloOp(':              'o código é o da OPERAÇÃO aberta (em processamento): subproduto só nasce no fechamento',
    'telaFechar|rotuloOp(':            'o código é o da OPERAÇÃO aberta (em processamento): subproduto só nasce no fechamento',
    'telaFechar|(op.codigo || \'':      'o código é o da OPERAÇÃO aberta (em processamento): subproduto só nasce no fechamento',
    'lerRetorno|it.codigos':           'guarda no item da fila o que o servidor devolveu (dado, não tela); quem o desenha é `linhaFila` (com chip)',
    'lerRetorno|res.codigos':          'guarda no item da fila o que o servidor devolveu (dado, não tela); quem o desenha é `linhaFila` (com chip)',
    'trocarRefs|i.codigos':            'procura o código gravado para trocar a referência de um lançamento que depende de outro (dado, não tela)',
    'telaFicha|esc(codigoExibicao(':   'o código fica na linha do topo da ficha; o chip e a borda roxa estão no cabeçalho do PRODUTO da mesma ficha (afirmado acima, ficha › chip ao lado do nome)'
  };
  ok(sitios.length >= 10, 'varredura · controle verde · achou ' + sitios.length + ' pontos que escrevem código de lote (esperava ≥ 10; instrumento cego acusaria 0)');
  ['telaEstoque', 'telaAbrir', 'telaFicha'].forEach(n => ok(sitios.some(s => s.fn === n), 'varredura · controle verde · enxerga `' + n + '` (um lugar já conhecido)'));
  const semChip = sitios.filter(s => !s.chip && !EXC[s.fn + '|' + s.trecho]);
  ok(semChip.length === 0, 'varredura · TODO ponto que escreve código de lote tem `chipSub(` por perto ou está na lista de exceção' + (semChip.length ? ' · SEM CHIP: ' + semChip.map(s => s.fn + ' «' + s.trecho + '»').join('; ') : ''));
  Object.keys(EXC).forEach(k => { const f2 = k.slice(0, k.indexOf('|')), tr = k.slice(k.indexOf('|') + 1); const s = sitios.filter(x => x.fn === f2 && x.trecho === tr);
    ok(s.length > 0 && s.every(x => !x.chip), 'varredura · a exceção `' + k.replace(/\n/g, ' ') + '` segue valendo (existe e não tem chip por perto) · ' + EXC[k]); });
  return { falhas, log };
}

const indexTxt = fs.readFileSync(process.argv[2] || path.join(REPO, 'unica/index.html'), 'utf8');   /* argv[2] = outro index.html (vermelho-antes sobre o commit velho) */
const base = roda(indexTxt);
console.log(base.log.join('\n'));
const M = [
  ['a casca perde o chip (Estoque)', "chipSub(l.sub) + '</b><span class=\"kg\">'", "'</b><span class=\"kg\">'"],
  ['a casca perde a borda roxa inline (Estoque, volta ao CSS)', "'\"' + bordaSub(l.sub) + ' data-lote=\"", "'\"' + ' data-lote=\""],
  ['o CSS `.lt.sub` volta ao cinza antigo e a borda inline some', ".lt.sub{border-left-color:#8E5FB0}", ".lt.sub{border-left-color:#9AA4B1}", [["'\"' + bordaSub(l.sub) + ' data-lote=\"", "'\"' + ' data-lote=\""]]],
  ['o chip do Estoque decide por prefixo `1SUB` (o `QUE-…` de subproduto fica sem chip)', "chipSub(l.sub) + '</b><span class=\"kg\">'", "chipSub(/^1SUB/.test(l.codigo || '')) + '</b><span class=\"kg\">'"],
  ['o chip escreve «subproduto» minúsculo', "data-chip-sub=\"1\">Subproduto</span>' : ''; }", "data-chip-sub=\"1\">subproduto</span>' : ''; }"],
  ['o chip pinta em todo lote (o principal vizinho ganha chip)', "function chipSub(sub){ return sub ? ", "function chipSub(sub){ return true ? "],
  ['o cartão da chave volta a dizer «Versão offline»', "<div><b>Galpão/Campo</b><span>", "<div><b>Versão offline</b><span>"],
  ['a frase de explicação do cartão sai', "Receber, abrir e fechar. O que você lança", "O que você lança"],
  // ── G2 · m2 · m3 · a varredura (continuação 12) ──
  ['Abrir › Disponíveis perde o chip da casca', "chipSub(l.sub) + '</b>' +\n           '<small'", "'</b>' +\n           '<small'"],
  ['Abrir › Disponíveis perde a borda roxa da casca', "data-pega=\"' + esc(l.chave) + '\"' + bordaSub(l.sub) + '>", "data-pega=\"' + esc(l.chave) + '\"' + '>"],
  ['Abrir › Na operação perde o chip da casca', "esc(l.produto) + chipSub(l.sub) + '<small' + (l.local", "esc(l.produto) + '<small' + (l.local"],
  ['Abrir › Na operação perde a borda roxa da casca', "'<div class=\"linha\"' + bordaSub(l.sub, 'margin-bottom:0;') + '>", "'<div class=\"linha\"' + ' style=\"margin-bottom:0\"' + '>"],
  ['a ficha do QR perde o chip ao lado do nome', "esc(fi[0]) + chipSub(subFicha) + '</h3>'", "esc(fi[0]) + '</h3>'"],
  ['a ficha do QR perde a borda roxa', "<div class=\"ficha\" id=\"ficha\"' + bordaSub(subFicha) + '>", "<div class=\"ficha\" id=\"ficha\"' + '>"],
  ['a ficha só reconhece o `1SUB` antigo (a casca `QUE-…`/`ARM-…` do pacote some)', "return !!((pl && pl.sub) || /^1SUB/i.test", "return !!((false) || /^1SUB/i.test"],
  ['o botão volta a dizer «Preparar o modo offline»', "Preparar o Galpão/Campo</button>", "Preparar o modo offline</button>"],
  ['o aviso volta a dizer «Modo offline preparado»', "'Galpão/Campo preparado · cadastros guardados no aparelho'", "'Modo offline preparado · cadastros guardados no aparelho'"],
  ['a ficha volta a dizer «O modo offline ainda não está liberado»', "O Galpão/Campo ainda não está liberado para ", "O modo offline ainda não está liberado para "],
  ['o cabeçalho volta a dizer «Versão Básica · neste aparelho»', "'Galpão/Campo · neste aparelho'", "'Versão Básica · neste aparelho'"],
  ['um render NOVO de lote sem chip (a varredura tem de acusá-lo)', "function codigoExibicao(cod){", "function linhaNovaSemChip(l){ return '<div class=\"nome\">' + esc(l.produto) + ' ' + esc(l.codigo) + '</div>'; }\nfunction codigoExibicao(cod){"],
  ['«Abrir com o lote vindo da ficha» perde o chip', "'</b>' + chipSub(pre.sub) + ' ('", "'</b>' + ' ('"],
  // ── c12 · H10-436 · sobra de um lote, linha da fila, ficha com saldo 0 ──
  ['a pergunta da sobra de UM lote perde o chip', "'</b>' + chipSub(lista[0].sub) + '. '", "'</b>' + '. '"],
  ['a pergunta da sobra de vários lotes perde o chip', "esc(codigoExibicao(x.rotulo)) + chipSub(x.sub) + ' · sobram <b>'", "esc(codigoExibicao(x.rotulo)) + ' · sobram <b>'"],
  ['`sobraGrandeDoAbrir_` esquece de levar o `sub` do lote', "resto:resto, sub:!!l.sub });", "resto:resto });"],
  ['a linha da fila perde o chip do lote', "esc(inf.produto) : '') + chipSub(inf.sub);", "esc(inf.produto) : '');"],
  ['a linha da fila perde o PRODUTO do lote', "(inf.produto ? ' · ' + esc(inf.produto) : '') + chipSub(inf.sub);", "'' + chipSub(inf.sub);"],
  ['a linha da fila só olha o pacote `lotes` (o lote que esgotou, só na ficha, perde o chip)', "  if (fi) return { produto: String(fi[0] || produtoPadrao || ''), sub: ehSubFicha(cod, fi) };\n", ""],
  ['a ficha do QR ignora o campo aditivo `fi[13]` (casca com saldo 0)', " || (fi && Number(fi[13]) === 1));", ");"],
  // ── c12-con · menor 4 · a linha da fila do Fechar ──
  ['a linha «na planilha · …» do Fechar perde o chip da casca', "return esc(c) + chipSub(infoLoteDaFila_(cad, c, '').sub); })", "return esc(c); })"],
  ['a linha «na planilha · …» do Fechar põe chip em todo código', "return esc(c) + chipSub(infoLoteDaFila_(cad, c, '').sub); })", "return esc(c) + chipSub(true); })"],
  ['a linha «na planilha · …» volta a ser só texto (stH some)', "'<div class=\"st\">' + (stH != null ? stH : esc(st)) + '</div>'", "'<div class=\"st\">' + esc(st) + '</div>'"]
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
