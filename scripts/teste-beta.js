/* PORTÃO DA LANÇADORA · A BETA COMO 6ª CÓPIA (C3 · H10-510 · H10-567 · D77 = S · 22/10/2026).
 *
 *   node scripts/teste-beta.js            (de dentro do repositório da lançadora; sai 0 se verde) · `node scripts/teste-beta.js <outro-index.html>` roda sobre outro arquivo
 *
 * A Beta é a 6ª cópia do MESMO código (projeto Apps Script próprio, planilha própria, organização fixa `beta`). Quem é da equipe testa pela lançadora; produção nunca se mistura.
 * Este portão EXECUTA a `unica/index.html` e lê a `scripts/fixtures/orgs-teste.json` reais:
 *   1 · a lista tem a Beta: id `beta`, nome com «Beta», ambiente `beta`, grupo `beta`, NÃO listada para todo mundo (`listada:false`);
 *   2 · o endereço é o /exec da Beta em forma LONGA (`/a/macros/mandusocial.org/s/<id>/exec`), sem `/<org>` (a Beta tem organização fixa) e SEM `deploymentUnico`/`orgApp`
 *       (nada a ver com o projeto único); o id é DIFERENTE de todo id de produção da lista (o id REAL da Beta, em `BETA_DEP` do index.html, é conferido em `teste-porteiro.js` contra `copias/beta/DEPLOYMENT_ID`);
 *   3 · `achaOrg('beta')` resolve (H10-567: «Organização não encontrada (beta)») e a sub-lançadora `?org=beta` abre a Beta com o selo «Beta» visível;
 *   4 · a Beta NÃO aparece para um aparelho comum; aparece para o administrador (modo equipe) e para o aparelho que recebeu o link; no Painel tem cartão com a etiqueta «Beta»;
 *   5 · o Início do Galpão/Campo da Beta leva o selo «Beta» e o da produção não;
 *   6 · o envio offline da Beta vai para o /exec da Beta, com `org:'beta'` no pacote, e nenhum id de produção aparece no endereço;
 *   7 · as 5 organizações que já existiam não mudaram de endereço.
 * Os mutantes no fim provam que o portão fica vermelho quando o defeito volta. */
const fs = require('fs'), path = require('path');
const { pagina, jsDe, REPO } = require('./lib-pagina.js');
const BETA_ID = 'AKfycbTESTEbeta';   /* o código de /exec da Beta NA FIXTURE (sintético); o código real mora só em `BETA_DEP` do index.html e é conferido em `teste-porteiro.js` */
const UNICO = 'AKfycbyw9syhEIyuaMaYT-ej95koauzv4hXlLJEyAXY6OMwL4Ba6socaChpIapRx9ekWcVve';
const exec = dep => 'https://script.google.com/a/macros/mandusocial.org/s/' + dep + '/exec';
const visivel = h => String(h).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');

function roda(indexTxt, jsonTxt) {
  let falhas = 0; const log = [];
  const ok = (c, m) => { if (!c) falhas++; log.push((c ? '  ✅ ' : '  ❌ ') + m); };
  const eq = (m, g, e) => ok(JSON.stringify(g) === JSON.stringify(e), m + ' → ' + JSON.stringify(g) + (JSON.stringify(g) === JSON.stringify(e) ? '' : '  (esperado ' + JSON.stringify(e) + ')'));
  const js = jsDe(indexTxt);
  const J = JSON.parse(jsonTxt);
  const b = J.organizacoes.find(o => o.id === 'beta');

  /* 1 · a linha da Beta no arquivo */
  ok(!!b, '1 · a lista de teste tem a organização `beta`');
  if (!b) return { falhas, log };
  ok(/beta/i.test(b.nome) && /beta/i.test(b.nomeAdmin), '1 · o nome (e o nome do administrador) diz «Beta»: «' + b.nome + '» / «' + b.nomeAdmin + '»');
  eq('1 · ambiente e grupo', [b.ambiente, b.grupo], ['beta', 'beta']);
  eq('1 · `listada:false` (não aparece para todo aparelho) e não é histórico', [b.listada, b.historico], [false, false]);

  /* 2 · o endereço */
  eq('2 · `deployment` é o /exec da Beta', b.deployment, BETA_ID);
  ok(b.deploymentUnico === undefined && b.orgApp === undefined, '2 · a Beta NÃO tem `deploymentUnico` nem `orgApp` (organização fixa no projeto dela, fora do projeto único)');
  const prods = []; J.organizacoes.filter(o => o.id !== 'beta').forEach(o => { prods.push(o.deployment, o.deploymentUnico); });
  ok(prods.filter(Boolean).length >= 5 && prods.filter(Boolean).indexOf(b.deployment) < 0, '2 · o id da Beta é diferente de todo `deployment`/`deploymentUnico` das outras organizações');

  const novo = (opc, prep) => { const P = pagina(js, opc); P.ctx.__orgs = JSON.parse(jsonTxt); P.run('montarLista(__orgs)'); if (prep) P.run(prep); return P; };
  const P0 = novo();
  const L = P0.run("ORGS.filter(function(o){ return o.id === 'beta'; })[0]");
  ok(L && typeof L === 'object', '2 · `montarLista` aceita a Beta');
  if (!L || typeof L !== 'object') return { falhas, log };
  eq('2 · o endereço do app é o /exec LONGO da Beta, sem `/<org>` e sem `?`', L.url, exec(BETA_ID));
  eq('2 · o endereço do envio offline é o mesmo', L.offline, exec(BETA_ID));
  ok(!L.pendente && !L.unico && L.grupo === 'beta' && L.ambiente === 'beta', '2 · não é «aguardando o app», não é projeto único, grupo/ambiente `beta`');
  ok(/\/a\/macros\/mandusocial\.org\/s\//.test(L.url), '2 · forma longa `/a/macros/mandusocial.org/s/…`');

  /* 7 · as 5 que já existiam não mudaram */
  const esperado = { 'camtaua-oficial': 'camtaua-oficial', 'camtaua-demo': 'demo', 'teste-felipe': 'felipe', 'demo-rodrigo': 'rodrigo', 'camtaua': 'camtaua' };
  Object.keys(esperado).forEach(id => eq('7 · ' + id + ' segue no projeto único', P0.run("achaOrg('" + id + "').url"), exec(UNICO) + '/' + esperado[id]));

  /* 3 · achaOrg e a sub-lançadora */
  ok(P0.run("achaOrg('beta') && achaOrg('beta').id") === 'beta', '3 · `achaOrg(\'beta\')` resolve (H10-567)');
  const P1 = novo({}, "TELA = { nome:'sub', org:'beta' }; render();");
  const sub = P1.el('app').innerHTML;
  ok(!/sub-desconhecida/.test(sub) && !/Organização não encontrada/.test(sub), '3 · `?org=beta` NÃO cai em «Organização não encontrada»');
  ok(/id="pill-beta"/.test(sub) && /Beta/.test(visivel(sub)), '3 · a sub-lançadora da Beta mostra o selo «Beta» (`pill-beta`)');
  const P1b = novo({}, "TELA = { nome:'sub', org:'camtaua-oficial' }; render();");
  ok(!/pill-beta/.test(P1b.el('app').innerHTML), '3 · a sub-lançadora da Camtauá NÃO leva o selo «Beta»');

  /* 4 · quem vê a Beta */
  const ids = P => P.run("disponiveis().map(function(o){ return o.id; })");
  ok(ids(novo()).indexOf('beta') < 0, '4 · aparelho comum NÃO vê a Beta na lista (' + ids(novo()).join(',') + ')');
  const adm = novo({}, "entrarAdmin(); aplicarNomes();");
  ok(ids(adm).indexOf('beta') >= 0, '4 · o administrador (modo equipe) vê a Beta');
  const rec = novo({}, "mudar(function(d){ d.recebidas = ['beta']; });");
  ok(ids(rec).indexOf('beta') >= 0, '4 · o aparelho que recebeu o link da Beta vê a Beta');
  rec.run("TELA = { nome:'inicio' }; render();");
  const geral = rec.el('app').innerHTML;
  ok(/<optgroup label="[^"]*Beta[^"]*">/.test(geral) && /<option value="beta"[^>]*>[^<]*Beta/.test(geral), '4 · a lista põe a Beta em seção própria, rotulada «Beta», fora de «Organizações» e de «Demonstrações e testes»');
  const og = (geral.match(/<optgroup label="Organizações">[\s\S]*?<\/optgroup>/) || [''])[0] + (geral.match(/<optgroup label="Demonstrações e testes">[\s\S]*?<\/optgroup>/) || [''])[0];
  ok(og.indexOf('value="beta"') < 0, '4 · a Beta não está dentro das seções de produção e demonstração');
  const pn = novo({}, "entrarAdmin(); aplicarNomes(); TELA = { nome:'painel' }; render();").el('app').innerHTML;
  const cartao = (pn.match(/<article class="lu-card" data-id="beta"[\s\S]*?<\/article>/) || [''])[0];
  ok(!!cartao && />Beta<\/span>/.test(cartao) && cartao.indexOf('?org=beta') > -1, '4 · o Painel tem o cartão da Beta, com a etiqueta «Beta» e o link `?org=beta`');

  /* 5 · o Início do Galpão/Campo */
  const inicio = org => { const P = novo({ largura: 390 }, `mudar(function(d){ d.modoOffline = true; d.orgOffline = '${org}'; d.recebidas = ['${org}']; d.cadastros['${org}'] = { etapas:[{id:'QUE', nome:'Quebra', tipo:'Beneficiamento', cad:[]}], ord:{REC:1,QUE:3}, operadores:[['OP-1','Gilson']], lotes:[] }; }); TELA = { nome:'inicio' }; render();`); return P.el('app').innerHTML; };
  const iB = inicio('beta'), iP = inicio('camtaua-oficial');
  ok(/id="pill-beta"/.test(iB) && /Beta/.test(visivel(iB)), '5 · o Início da Beta leva o selo «Beta»');
  ok(!/pill-beta/.test(iP), '5 · o Início da Camtauá (produção) não leva o selo «Beta»');

  /* 6 · o envio offline */
  const nav = { href: '' };
  const PE = novo({}, "mudar(function(d){ d.modoOffline = true; d.orgOffline = 'beta'; d.recebidas = ['beta']; });");
  PE.ctx.navigator.onLine = true;
  Object.defineProperty(PE.ctx.location, 'href', { get() { return nav.href; }, set(v) { nav.href = v; }, configurable: true });
  PE.run("enviar(false)");
  const m = /^(.*)#f=(.*)$/.exec(nav.href);
  eq('6 · o envio offline da Beta navega ao /exec da Beta (`?modo=sincronizar`)', m && m[1], exec(BETA_ID) + '?modo=sincronizar');
  let pac = null; try { pac = JSON.parse(Buffer.from(m[2], 'base64url').toString('utf8')); } catch (e) {}
  ok(pac && pac.org === 'beta', '6 · o pacote leva `org:\'beta\'` (' + JSON.stringify(pac && pac.org) + ')');
  ok(!nav.href.includes(UNICO) && !prods.filter(Boolean).some(p => nav.href.includes(p)), '6 · nenhum id de produção aparece no endereço do envio da Beta');
  return { falhas, log };
}

const arg = process.argv[2];
const indexTxt = fs.readFileSync(arg ? path.resolve(arg) : path.join(REPO, 'unica/index.html'), 'utf8'), jsonTxt = fs.readFileSync(path.join(REPO, 'scripts/fixtures/orgs-teste.json'), 'utf8');
const base = roda(indexTxt, jsonTxt);
console.log(base.log.join('\n'));
const jb = JSON.parse(jsonTxt), prod0 = jb.organizacoes.find(o => o.id === 'camtaua-oficial');
const trocaJson = fn => { const j = JSON.parse(jsonTxt); const o = j.organizacoes.find(x => x.id === 'beta'); if (o) fn(j, o); return JSON.stringify(j); };
const M = [
  ['a Beta aponta para o /exec da produção (id de produção no `deployment`)', indexTxt, jsonTxt.replace(BETA_ID, prod0.deployment)],
  ['a Beta vira listada para todo aparelho', indexTxt, trocaJson((j, o) => { o.listada = true; })],
  ['a Beta ganha `deploymentUnico` (caiu no projeto único)', indexTxt, trocaJson((j, o) => { o.deploymentUnico = UNICO; o.orgApp = 'camtaua'; })],
  ['o ambiente da Beta volta a «teste» (sem o rótulo «Beta»)', indexTxt, trocaJson((j, o) => { o.ambiente = 'teste'; })],
  ['o aparelho comum passa a ver a Beta (sem a guarda do grupo)', indexTxt.replace("o.listada || (adm && o.grupo === 'beta')", "o.listada || o.grupo === 'beta'"), jsonTxt],
  ['a sub-lançadora e o Início perdem o selo «Beta»', indexTxt.replace(/function seloBeta\(o\)\{[^\n]*\n/, "function seloBeta(o){ return ''; }\n"), jsonTxt],
  ['o grupo `beta` some do `montarLista` (a Beta cai em «Organizações»)', indexTxt.replace("r.grupo === 'beta' ? 'beta'", "false ? 'beta'"), jsonTxt]
];
let ruim = 0;
console.log('\n── mutantes ──');
M.forEach(([nome, txt, js2]) => {
  if (txt === indexTxt && js2 === jsonTxt) { console.log('  🔴 o mutante «' + nome + '» NÃO aplicou'); ruim++; return; }
  let r; try { r = roda(txt, js2); } catch (e) { r = { falhas: 1 }; }
  const v = r.falhas > 0; if (!v) ruim++;
  console.log('  ' + (v ? '✅ vermelho ' : '❌ SOBREVIVEU') + ' · ' + nome + ' (' + r.falhas + ' ❌)');
});
const total = base.falhas + ruim;
console.log('\n' + (total ? '🔴 ' + base.falhas + ' falha(s), ' + ruim + ' mutante(s) vivo(s)' : '🟢 lançadora: a Beta como 6ª cópia verde'));
process.exit(total ? 1 : 0);
