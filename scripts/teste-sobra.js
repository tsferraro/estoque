/* PORTÃO DA LANÇADORA · O ABRIR PERGUNTA ANTES DE ENCERRAR LOTE COM SOBRA GRANDE (CON-c9-r2 · G3 · crítica c9 r2 · 19/10/2026).
 *
 *   node scripts/teste-sobra.js            (de dentro do repositório da lançadora; sai 0 se verde) · `node scripts/teste-sobra.js <outro-index.html>` roda sobre outro arquivo
 *
 * O app pergunta (AVI · H10-330 e CON-c9 · G2): um lote que «acaba» com sobra acima de 10 % do saldo só vira Quebra com o toque explícito. A lançadora era a
 * 4ª porta: o lote sobe CHEIO e com «Acabou» marcado, a pessoa usa 3.000 de 10.000 kg, guarda, e no envio o servidor (`abrirOperacao`) baixa 7.000 kg de Quebra.
 * Este portão EXECUTA a `unica/index.html` real num `vm` (a sonda `sonda-lancadora-abrir.js` da crítica, virada portão) e confere:
 *   1 · 70 % de sobra: «Guardar» NÃO põe nada na fila; a tela pergunta com os números do dado; as 3 respostas com os textos do app; «Guardar» desligado com a pergunta aberta
 *   2 · «Voltar e ajustar o peso» fecha a pergunta e não guarda · «Dar por perdidos» guarda 1× com `esgotou:true` · «Deixar no lote» guarda 1× com `esgotou:false`
 *   3 · peso mudado depois da pergunta: a resposta à pergunta velha não guarda · 5 % de sobra e «não acabou» guardam direto · 2 lotes: a pergunta soma e lista os dois
 *   4 · o código que se lê é `SUB-…` (nunca «1SUB»)
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
  run(`mudar(function(d){ d.cadastros['${org}'] = { etapas:[{id:'SEC', nome:'Secagem', tipo:'Transformação', cad:[]}], ord:{REC:1,SEC:2}, operadores:[['OP-1','Gilson']],
    lotes:[['REC-20261019-001','Tucumã','Tucumã',10000,'REC',false,3], ['REC-20261019-002','Tucumã','Tucumã',4000,'REC',false,2], ['1SUB-20261019-003','Casca','Tucumã',2000,'SEC',true,1]] }; d.orgOffline = '${org}'; })`);
  el('sel-op').value = 'OP-1';
  /* o gesto da tela: escolhe a etapa, traz os lotes (sobem CHEIOS e com «Acabou» marcado), digita o peso */
  const abrir = lotes => { run("TELA = { nome:'abrir', form:{ etapa:'SEC', lotes:{}, obs:'' } }; 0"); ctx.__l = lotes;
    run("Object.keys(__l).forEach(function(k){ TELA.form.lotes[k] = { kg: String(__l[k].kg), naoAcabou: !!__l[k].naoAcabou }; }); atualizarAbrir(); 0"); };
  const fila = () => { try { return JSON.parse(loja.estoque_offline_v1).fila || []; } catch (e) { return []; } };
  const tela = () => Object.values(els).map(e => e.innerHTML + ' ' + e.textContent).join(' ');
  const sig = () => { const m = (el('slot-sobra').innerHTML || '').match(/data-sig="([^"]*)"/); return m ? m[1].replace(/&#39;/g, "'").replace(/&amp;/g, '&') : ''; };
  return { run, el, fila, tela, sig, abrir, ctx };
}

function roda(indexTxt) {
  let falhas = 0; const log = [];
  const ok = (c, m) => { if (!c) falhas++; log.push((c ? '  ✅ ' : '  ❌ ') + m); };
  const eq = (m, g, e) => ok(JSON.stringify(g) === JSON.stringify(e), m + ' → ' + JSON.stringify(g) + (JSON.stringify(g) === JSON.stringify(e) ? '' : '  (esperado ' + JSON.stringify(e) + ')'));
  const js = [...indexTxt.matchAll(/<script(?![^>]*\ssrc)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]).sort((a, b) => b.length - a.length)[0];
  let P;
  const nova = () => { try { P = pagina(js); return true; } catch (e) { ok(false, 'a página carrega no vm: ' + e.message); return false; } };
  const lotesDaFila = () => P.fila().map(i => (i.payload.lotes || []).map(l => [l.codigo, l.kg, l.esgotou]));

  /* 1 · 70 % de sobra */
  if (!nova()) return { falhas, log };
  P.abrir({ 'REC-20261019-001': { kg: 3000 } });
  ok(P.el('btn-guardar').disabled === false, '«Guardar no aparelho» ligado antes do toque (o peso é válido)');
  P.run('guardarAbrir()');
  eq('70 % de sobra · tocar em «Guardar» NÃO põe nada na fila', P.fila().length, 0);
  const q = (P.el('slot-sobra').innerHTML || '');
  const qt = q.replace(/<[^>]*>/g, '');
  ok(/Sobraram 7\.000 kg de 10\.000 kg do lote REC-20261019-001\. Dar por perdidos \(quebra\) ou deixar no lote para a próxima operação\?/.test(qt), 'a tela pergunta com os números do dado · «' + (qt.slice(0, 130) || '(sem pergunta)') + '»');
  ok(/data-sobra="quebra"[^>]*>Dar por perdidos<small>vira Quebra de 7\.000 kg e o lote acaba<\/small>/.test(q), 'o botão 1 traz o efeito escrito: «Dar por perdidos · vira Quebra de 7.000 kg e o lote acaba»');
  ok(/data-sobra="ficar"[^>]*>Deixar no lote<small>7\.000 kg continuam no lote, para a próxima operação<\/small>/.test(q), 'o botão 2 traz o efeito escrito: «Deixar no lote · 7.000 kg continuam no lote, para a próxima operação»');
  ok(/data-sobra="voltar"[^>]*>Voltar e ajustar o peso</.test(q), 'o botão 3: «Voltar e ajustar o peso»');
  ok(P.el('btn-guardar').disabled === true, 'com a pergunta aberta, «Guardar no aparelho» fica desligado (responde-se na pergunta)');
  P.run('guardarAbrir()');
  eq('...e tocar de novo em «Guardar» (sem responder) continua sem guardar', P.fila().length, 0);

  /* 2 · as 3 respostas */
  P.run(`decidirSobraAbrir_('voltar', ${JSON.stringify(P.sig())})`);
  eq('«Voltar e ajustar o peso» · não guarda', P.fila().length, 0);
  ok(!/Sobraram/.test(P.el('slot-sobra').innerHTML), '...e fecha a pergunta');
  ok(P.el('btn-guardar').disabled === false, '...e «Guardar» volta a ligar');
  P.run('guardarAbrir()');
  ok(/Sobraram/.test(P.el('slot-sobra').innerHTML) && P.fila().length === 0, 'tocar em «Guardar» de novo · pergunta de novo, sem guardar');
  P.run(`decidirSobraAbrir_('quebra', ${JSON.stringify(P.sig())})`);
  eq('«Dar por perdidos» · guarda 1 item, o lote «acaba» (a sobra vira Quebra no envio, como sempre)', lotesDaFila(), [[['REC-20261019-001', 3000, true]]]);

  if (!nova()) return { falhas, log };
  P.abrir({ 'REC-20261019-001': { kg: 3000 } });
  P.run('guardarAbrir()');
  P.run(`decidirSobraAbrir_('ficar', ${JSON.stringify(P.sig())})`);
  eq('«Deixar no lote» · guarda 1 item, o lote NÃO acaba (os 7.000 kg ficam)', lotesDaFila(), [[['REC-20261019-001', 3000, false]]]);

  /* 3 · bordas */
  if (!nova()) return { falhas, log };
  P.abrir({ 'REC-20261019-001': { kg: 3000 } });
  P.run('guardarAbrir()');
  const velha = P.sig();
  P.run("TELA.form.lotes['REC-20261019-001'].kg = '2000'; 0");
  P.run(`decidirSobraAbrir_('quebra', ${JSON.stringify(velha)})`);
  eq('peso mudado depois da pergunta · a resposta à pergunta VELHA não guarda', P.fila().length, 0);
  ok(/Sobraram 8\.000 kg de 10\.000 kg/.test(P.el('slot-sobra').innerHTML.replace(/<[^>]*>/g, '')), '...e a tela refaz a pergunta com os números de agora (8.000 de 10.000)');

  if (!nova()) return { falhas, log };
  P.abrir({ 'REC-20261019-001': { kg: 9500 } });
  P.run('guardarAbrir()');
  eq('5 % de sobra · guarda direto, sem pergunta (o aviso amarelo da linha basta)', lotesDaFila(), [[['REC-20261019-001', 9500, true]]]);

  if (!nova()) return { falhas, log };
  P.abrir({ 'REC-20261019-001': { kg: 3000, naoAcabou: true } });
  P.run('guardarAbrir()');
  eq('«Acabou» desmarcado · guarda direto (a sobra fica no lote)', lotesDaFila(), [[['REC-20261019-001', 3000, false]]]);

  if (!nova()) return { falhas, log };
  P.abrir({ 'REC-20261019-001': { kg: 3000 }, 'REC-20261019-002': { kg: 1000 } });
  P.run('guardarAbrir()');
  const q2 = P.el('slot-sobra').innerHTML.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
  ok(P.fila().length === 0 && /Sobraram 10\.000 kg em 2 lotes/.test(q2) && /REC-20261019-001 · sobram 7\.000 kg de 10\.000 kg/.test(q2) && /REC-20261019-002 · sobram 3\.000 kg de 4\.000 kg/.test(q2),
    '2 lotes · a pergunta soma (10.000 kg) e lista os dois, sem guardar · «' + q2.trim().slice(0, 120) + '»');
  ok(/vira Quebra de 10\.000 kg e os lotes acabam/.test(q2), '...e o botão diz «os lotes acabam»');
  P.run(`decidirSobraAbrir_('ficar', ${JSON.stringify(P.sig())})`);
  eq('...«Deixar no lote» desmarca «Acabou» nos dois', lotesDaFila(), [[['REC-20261019-001', 3000, false], ['REC-20261019-002', 1000, false]]]);

  /* 4 · SUB- na tela */
  if (!nova()) return { falhas, log };
  P.abrir({ '1SUB-20261019-003': { kg: 500 } });
  P.run('guardarAbrir()');
  const q3 = P.el('slot-sobra').innerHTML.replace(/<[^>]*>/g, ' ');
  ok(/do lote\s+SUB-20261019-003/.test(q3) && !/1SU/.test(q3), 'lote de subproduto · a pergunta diz `SUB-20261019-003`, nunca «1SUB» · «' + (q3.match(/\S*SUB-20261019-003\S*/) || ['(sem o código)'])[0] + '»');
  const cru = String(P.run("sobraPerguntaHtml_([{ lote:'1SUB-20261019-003', rotulo:'1SUB-20261019-003', saldo:2000, kg:500, resto:1500 }])")).replace(/<[^>]*>/g, ' ');
  ok(/SUB-20261019-003/.test(cru) && !/1SU/.test(cru), '...e a própria `sobraPerguntaHtml_` (antes do `textoVisivel_` da faixa) já escreve `SUB-…` — duas camadas, uma não esconde a outra');
  return { falhas, log };
}

const indexTxt = fs.readFileSync(process.argv[2] || path.join(REPO, 'unica/index.html'), 'utf8');   /* argv[2] = outro index.html (vermelho-antes sobre o commit velho) */
const base = roda(indexTxt);
console.log(base.log.join('\n'));
const M = [
  ['o Abrir PULA a pergunta (o defeito da crítica r2: guarda direto na fila)', "  if (perguntarSobraSeGrandeAbrir_(f, proj)) return;", "  if (false) return;"],
  ['a regra dos 10 % vira 100 % (nunca pergunta)', "var SOBRA_PERGUNTA_PCT = 0.10;", "var SOBRA_PERGUNTA_PCT = 1;"],
  ['«Deixar no lote» não desmarca «Acabou» (a sobra viraria Quebra do mesmo jeito)', "lista.forEach(function(x){ f.lotes[x.lote].naoAcabou = true; });", "lista.forEach(function(x){ });"],
  ['a resposta vale para qualquer pergunta (peso mudado grava com a resposta velha)', "if (!lista.length || sobraAssinatura_(lista) !== String(sig)) { atualizarAbrir(); return; }", "if (!lista.length) { atualizarAbrir(); return; }"],
  ['«Guardar» fica ligado com a pergunta aberta', "if (bg) bg.disabled = !g.ok || aberta;", "if (bg) bg.disabled = !g.ok;"],
  ['«Voltar» guarda (como «Dar por perdidos»)', "if (escolha === 'voltar') { f.perguntaSobra = false; atualizarAbrir(); return; }", "if (escolha === 'voltar') escolha = 'quebra';"],
  ['a pergunta escreve o código cru (`1SUB-…`)', "esc(codigoExibicao(lista[0].rotulo))", "esc(lista[0].rotulo)"]
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
console.log('\n' + (total ? '🔴 ' + base.falhas + ' falha(s), ' + ruim + ' mutante(s) vivo(s)' : '🟢 lançadora pergunta a sobra no Abrir verde'));
process.exit(total ? 1 : 0);
