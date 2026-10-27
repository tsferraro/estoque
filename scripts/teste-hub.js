/* PORTÃO DA LANÇADORA · «HUB MANDŪ» NO GALPÃO/CAMPO (H10-612, parte da lançadora · Tobia 22/10: «botão pra voltar ao Hub em todas as páginas»).
 *
 *   node scripts/teste-hub.js            (de dentro do repositório da lançadora; sai 0 se verde) · `node scripts/teste-hub.js <outro-index.html>` roda sobre outro arquivo
 *
 * Espelha o SGO (`hubDestino_`): a EQUIPE Mandū (o critério do «Sou da equipe Mandū» e da Beta = `ehAdmin()`) abre o Hub na visão da equipe, `…/hub/?equipe=1&hub=1`;
 * o cooperado comum abre a visão da organização dele, `…/hub/?org=<orgApp>&hub=1` (sem `orgApp`, `?hub=1`: nunca a organização errada). O Hub é fixo, com a barra final.
 *   1 · o Início do Galpão/Campo tem o link «Hub Mandū» (`#link-hub`), na mesma aba;
 *   2 · aparelho comum → `?org=camtaua-oficial&hub=1`, sem `equipe=1`;
 *   3 · equipe (modo administrador) → `?equipe=1&hub=1`, sem `org=`;
 *   4 · organização sem id no app (Beta, sem `orgApp`) e comum → `?hub=1`;
 *   5 · o destino é sempre o Hub da Mandū com a barra final (nunca outro host). */
const fs = require('fs'), path = require('path');
const { pagina, jsDe, REPO } = require('./lib-pagina.js');
const HUB = 'https://mandu-apps.lp.agentesamanda.com/hub/';

function roda(indexTxt) {
  let falhas = 0; const log = [];
  const ok = (c, m) => { if (!c) falhas++; log.push((c ? '  ✅ ' : '  ❌ ') + m); };
  const eq = (m, g, e) => ok(JSON.stringify(g) === JSON.stringify(e), m + ' → ' + JSON.stringify(g) + (JSON.stringify(g) === JSON.stringify(e) ? '' : '  (esperado ' + JSON.stringify(e) + ')'));
  const js = jsDe(indexTxt);
  const inicio = (org, adm) => {
    const P = pagina(js, { largura: 390 });
    P.run("mudar(function(d){ d.modoOffline = true; d.orgOffline = '" + org + "'; d.recebidas = ['" + org + "']; d.cadastros['" + org + "'] = { etapas:[{id:'QUE', nome:'Quebra', tipo:'Beneficiamento', cad:[]}], ord:{REC:1,QUE:3}, operadores:[['OP-1','Gilson']], lotes:[] }; });" + (adm ? " entrarAdmin(); aplicarNomes();" : "") + " TELA = { nome:'inicio' }; render();");
    return P.el('app').innerHTML;
  };
  const href = h => { const m = /<a [^>]*id="link-hub"[^>]*>/.exec(h); const n = m && /href="([^"]*)"/.exec(m[0]); return n ? n[1].replace(/&amp;/g, '&') : null; };
  const com = inicio('camtaua-oficial', false), eqp = inicio('camtaua-oficial', true), bet = inicio('beta', false);
  ok(/<a [^>]*id="link-hub"[^>]*>[^<]*Hub Mandū/.test(com), '1 · o Início do Galpão/Campo tem o link «Hub Mandū» (`#link-hub`)');
  ok(!/target=/.test((/<a [^>]*id="link-hub"[^>]*>/.exec(com) || [''])[0]), '1 · o link abre na mesma aba (sem `target`)');
  eq('2 · cooperado comum → Hub da organização dele', href(com), HUB + '?org=camtaua-oficial&hub=1');
  ok(!/equipe=1/.test(href(com) || ''), '2 · cooperado comum NÃO recebe `equipe=1`');
  eq('3 · equipe Mandū (modo administrador) → Hub da equipe', href(eqp), HUB + '?equipe=1&hub=1');
  ok(!/org=/.test(href(eqp) || ''), '3 · a equipe NÃO leva `org=`');
  eq('4 · organização sem id no app (Beta) e aparelho comum → `?hub=1`', href(bet), HUB + '?hub=1');
  [com, eqp, bet].forEach((h, i) => ok(String(href(h)).indexOf(HUB) === 0, '5 · destino #' + (i + 1) + ' é o Hub da Mandū com a barra final'));
  return { falhas, log };
}

const arg = process.argv[2];
const indexTxt = fs.readFileSync(arg ? path.resolve(arg) : path.join(REPO, 'unica/index.html'), 'utf8');
const base = roda(indexTxt);
console.log(base.log.join('\n'));
const M = [
  ['a equipe deixa de ser reconhecida (cai na visão da organização)', indexTxt.replace("if (ehAdmin()) return HUB_MANDU", "if (false) return HUB_MANDU")],
  ['o cooperado passa a receber a visão da equipe', indexTxt.replace("var id = org && org.orgApp ? String(org.orgApp) : '';", "return HUB_MANDU + '?equipe=1&hub=1';")],
  ['o Hub perde a barra final', indexTxt.replace("var HUB_MANDU = 'https://mandu-apps.lp.agentesamanda.com/hub/'", "var HUB_MANDU = 'https://mandu-apps.lp.agentesamanda.com/hub'")],
  ['o link some do Início', indexTxt.replace("h += hubHtml(org);", "")]
];
let ruim = 0;
console.log('\n── mutantes ──');
M.forEach(([nome, txt]) => {
  if (txt === indexTxt) { console.log('  🔴 o mutante «' + nome + '» NÃO aplicou'); ruim++; return; }
  let r; try { r = roda(txt); } catch (e) { r = { falhas: 1 }; }
  const v = r.falhas > 0; if (!v) ruim++;
  console.log('  ' + (v ? '✅ vermelho ' : '❌ SOBREVIVEU') + ' · ' + nome + ' (' + r.falhas + ' ❌)');
});
const total = base.falhas + ruim;
console.log('\n' + (total ? '🔴 ' + base.falhas + ' falha(s), ' + ruim + ' mutante(s) vivo(s)' : '🟢 lançadora: Hub Mandū no Galpão/Campo verde'));
process.exit(total ? 1 : 0);
