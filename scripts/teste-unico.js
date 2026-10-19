/* PORTÃO DA LANÇADORA NO PROJETO ÚNICO (c9 · UNI-T · 19/10/2026 · D35).
 *
 *   node scripts/teste-unico.js            (de dentro do repositório da lançadora; sai 0 se verde)
 *
 * Executa o texto de `unica/index.html` e de `unica/organizacoes.json`:
 *   · cada uma das 5 organizações aponta para o /exec do PROJETO ÚNICO com `?org=<orgApp>` (o id do registro do projeto único), e o endereço ANTIGO
 *     fica como reserva (`urlReserva`) — igual ao `deployment` que já estava no arquivo no `main`;
 *   · o arquivo ANTIGO (sem deploymentUnico/orgApp, como um aparelho que guardou a cópia velha) continua dando o endereço antigo, sem `?org=`;
 *   · o envio offline navega para `…/exec?org=<orgApp>&modo=sincronizar#f=…` (um `?` só — dois perderiam a organização) e o pacote leva `org` e `orgApp`.
 * Os 3 mutantes no fim provam que o teste fica vermelho quando o defeito volta. */
const fs = require('fs'), path = require('path'), vm = require('vm'), cp = require('child_process');
const REPO = path.resolve(__dirname, '..');
const UNICO = 'AKfycbyw9syhEIyuaMaYT-ej95koauzv4hXlLJEyAXY6OMwL4Ba6socaChpIapRx9ekWcVve';
const REGISTRO = ['camtaua', 'demo', 'felipe', 'rodrigo', 'camtaua-oficial'];      /* REGISTRO_ORGS_ do contrato do projeto único (COMUM-c9) */
const ESPERADO = { 'camtaua-oficial': 'camtaua-oficial', 'camtaua-demo': 'demo', 'teste-felipe': 'felipe', 'demo-rodrigo': 'rodrigo', 'camtaua': 'camtaua' };

function corpo(src, nome) {
  const i = src.indexOf('function ' + nome + '('); if (i < 0) return '';
  const k = src.indexOf('{', i); let dep = 0, e = k;
  for (; e < src.length; e++) { if (src[e] === '{') dep++; else if (src[e] === '}') { dep--; if (dep === 0) break; } }
  return src.slice(i, e + 1);
}
function roda(indexTxt, jsonTxt, jsonAntigoTxt) {
  let falhas = 0; const log = [];
  const ok = (c, m) => { if (!c) falhas++; log.push((c ? '  ✅ ' : '  ❌ ') + m); };
  const eq = (m, g, e) => ok(JSON.stringify(g) === JSON.stringify(e), m + ' → ' + JSON.stringify(g) + (JSON.stringify(g) === JSON.stringify(e) ? '' : '  (esperado ' + JSON.stringify(e) + ')'));
  const J = JSON.parse(jsonTxt), ANT = JSON.parse(jsonAntigoTxt);
  const exec = dep => 'https://script.google.com/a/macros/mandusocial.org/s/' + dep + '/exec';

  const FONTE = [corpo(indexTxt, 'execDe'), corpo(indexTxt, 'juntaParam'), corpo(indexTxt, 'montarLista'), corpo(indexTxt, 'b64url'), corpo(indexTxt, 'enviar')].join('\n');
  function monta(json) {
    const ctx = { ORGS: [], CFG: { enderecoBase: '', execModelo: 'https://script.google.com/a/macros/mandusocial.org/s/{deployment}/exec', administradores: [] }, console };
    vm.createContext(ctx); vm.runInContext(FONTE, ctx);
    const bom = vm.runInContext('montarLista', ctx)(json);
    return { bom, ORGS: vm.runInContext('ORGS', ctx), ctx };
  }
  const N = monta(J), A = monta(ANT);
  ok(N.bom && N.ORGS.length === 5, 'o arquivo novo monta as 5 organizações');
  J.organizacoes.forEach(o => {
    const L = N.ORGS.find(x => x.id === o.id), antigo = ANT.organizacoes.find(x => x.id === o.id);
    const app = ESPERADO[o.id];
    ok(!!L && REGISTRO.indexOf(app) >= 0, o.id + ' → orgApp `' + app + '` é um id do REGISTRO do projeto único');
    eq('   ' + o.id + ': o app abre no ÚNICO com `?org=`', L && L.url, exec(UNICO) + '?org=' + app);
    eq('   ' + o.id + ': o envio offline usa o mesmo endereço', L && L.offline, exec(UNICO) + '?org=' + app);
    eq('   ' + o.id + ': o endereço ANTIGO fica como reserva (o mesmo `deployment` do arquivo anterior)', L && L.urlReserva, exec(antigo.deployment));
    ok(o.deployment === antigo.deployment, '   ' + o.id + ': o campo `deployment` antigo não foi tocado');
    const La = A.ORGS.find(x => x.id === o.id);
    eq('   ' + o.id + ': o arquivo ANTIGO (cópia velha num aparelho) continua dando o endereço antigo, sem `?org=`', La && [La.url, La.unico], [exec(antigo.deployment), false]);
  });
  eq('as 5 versões usam 5 organizações DIFERENTES do registro', [...new Set(J.organizacoes.map(o => o.orgApp))].length, 5);

  /* o envio offline: a mesma função do arquivo, com o mundo de mentira */
  J.organizacoes.filter(o => o.id === 'camtaua-demo' || o.id === 'camtaua-oficial').forEach(o => {
    const org = N.ORGS.find(x => x.id === o.id);
    const nav = { href: '' };
    const ctx = { orgAtual: () => org, ler: () => ({ fila: [], cadastros: {} }), navigator: { onLine: true }, location: { origin: 'https://x', pathname: '/gestao-operacional/', get href() { return nav.href; }, set href(v) { nav.href = v; } },
      voltaDaFicha: () => '', FUSO_PADRAO: 'America/Sao_Paulo', toast: () => {}, btoa: s => Buffer.from(s, 'binary').toString('base64'), unescape, encodeURIComponent, JSON, console };
    vm.createContext(ctx); vm.runInContext(FONTE, ctx);
    vm.runInContext('enviar(false)', ctx);
    const m = /^(.*)#f=(.*)$/.exec(nav.href);
    eq(o.id + ': navega para `…/exec?org=<orgApp>&modo=sincronizar` (um `?` só)', m && m[1], exec(UNICO) + '?org=' + ESPERADO[o.id] + '&modo=sincronizar');
    let pac = null; try { pac = JSON.parse(Buffer.from(m[2], 'base64url').toString('utf8')); } catch (e) {}
    eq(o.id + ': o pacote leva `org` (id da lançadora) e `orgApp` (id do registro)', pac && [pac.org, pac.orgApp], [o.id, ESPERADO[o.id]]);
  });
  const antes = A.ORGS.find(x => x.id === 'camtaua-demo');
  { const nav = { href: '' }, ctx = { orgAtual: () => antes, ler: () => ({ fila: [], cadastros: {} }), navigator: { onLine: true }, location: { origin: 'https://x', pathname: '/g/', set href(v) { nav.href = v; }, get href() { return nav.href; } },
      voltaDaFicha: () => '', FUSO_PADRAO: 'x', toast: () => {}, btoa: s => Buffer.from(s, 'binary').toString('base64'), unescape, encodeURIComponent, JSON, console };
    vm.createContext(ctx); vm.runInContext(FONTE, ctx); vm.runInContext('enviar(false)', ctx);
    eq('arquivo ANTIGO: o envio continua `…/exec?modo=sincronizar` (como antes)', nav.href.split('#')[0], exec(ANT.organizacoes.find(x => x.id === 'camtaua-demo').deployment) + '?modo=sincronizar'); }
  return { falhas, log };
}

const indexTxt = fs.readFileSync(path.join(REPO, 'unica/index.html'), 'utf8'), jsonTxt = fs.readFileSync(path.join(REPO, 'unica/organizacoes.json'), 'utf8');
let antigo = null;
try { antigo = cp.execFileSync('git', ['-C', REPO, 'show', 'main:unica/organizacoes.json'], { encoding: 'utf8' }); } catch (e) { console.log('🔴 não li o organizacoes.json do main (git show): ' + e.message); process.exit(1); }
const base = roda(indexTxt, jsonTxt, antigo);
console.log(base.log.join('\n'));
const M = [
  ['o link do app perde o `?org=` (cai na produção)', indexTxt, "var exec = unico ? juntaParam(depU, 'org=' + encodeURIComponent(app)) : reserva;", "var exec = unico ? depU : reserva;"],
  ['o envio offline volta a emendar `?modo=` (dois `?` perdem a organização)', indexTxt, "location.href = juntaParam(org.offline, 'modo=sincronizar') + '#f='", "location.href = org.offline + '?modo=sincronizar' + '#f='"],
  ['o pacote deixa de levar `orgApp`', indexTxt, "org: org.id, orgApp: org.orgApp || '', fuso:", "org: org.id, fuso:"]
];
let ruim = 0;
console.log('\n── mutantes ──');
M.forEach(([nome, txt, de, para]) => {
  const n = txt.split(de).length - 1;
  if (n !== 1) { console.log('  🔴 o mutante «' + nome + '» NÃO aplicou (' + n + ' ocorrências)'); ruim++; return; }
  const r = roda(txt.replace(de, () => para), jsonTxt, antigo);
  const v = r.falhas > 0; if (!v) ruim++;
  console.log('  ' + (v ? '✅ vermelho ' : '❌ SOBREVIVEU') + ' · ' + nome + ' (' + r.falhas + ' ❌)');
});
const total = base.falhas + ruim;
console.log('\n' + (total ? '🔴 ' + base.falhas + ' falha(s), ' + ruim + ' mutante(s) vivo(s)' : '🟢 lançadora no projeto único verde'));
process.exit(total ? 1 : 0);
