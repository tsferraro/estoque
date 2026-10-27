/* PORTÃO DA LANÇADORA · A LISTA VEM DO PORTEIRO (onda S · lote C · 27/10/2026).
 *
 *   node scripts/teste-porteiro.js                       (de dentro do repositório da lançadora; sai 0 se verde)
 *   node scripts/teste-porteiro.js <outro-index.html>    roda sobre outro arquivo (o «antes», para ver vermelho)
 *
 * Executa o JavaScript REAL de `unica/index.html` (vm + DOM de mentira, `lib-pagina.js`). A lista de organizações NÃO é mais um arquivo público:
 * a página vai ao Porteiro (o `/exec` do projeto único, que já decide quem entra) e volta com `?via=porteiro&quem=…&state=…#hub=…`.
 *   1 · a ida: endereço do Porteiro com `volta` exato e `state` de 32 hex; sem rede não navega; a intenção do QR (`org`,`lote`) volta junto;
 *   2 · a volta: só vale com o `state` certo, de uso único, com menos de 10 min; `#hub` malformado não entra; lista grande é cortada em 200;
 *   3 · a lista guardada vale 24 h (D26): com sinal ou sem; vencida NÃO é inventada de novo — só ficam as organizações com lançamento esperando envio;
 *   4 · os 3 ids de demonstração do Registro (`demo`, `felipe`, `rodrigo`) continuam chaveando a fila pelo id antigo: a fila antiga não some;
 *   5 · `quem=recusa|vazio` não apaga a lista boa; a cópia antiga do aparelho vira lista provisória só da fila e some quando a nova chega;
 *   6 · o código de /exec da Beta (`BETA_DEP`) é o de `copias/beta/DEPLOYMENT_ID` (quando a pasta está ao lado) e diferente do projeto único.
 * Os mutantes no fim provam que o portão fica vermelho quando o defeito volta. */
const fs = require('fs'), path = require('path');
const { pagina, jsDe, REPO } = require('./lib-pagina.js');
const UNICO = 'AKfycbyw9syhEIyuaMaYT-ej95koauzv4hXlLJEyAXY6OMwL4Ba6socaChpIapRx9ekWcVve';
const exec = dep => 'https://script.google.com/a/macros/mandusocial.org/s/' + dep + '/exec';
const H = 3600e3;
const hex = c => c.repeat(32);
const agora = () => new Date().toISOString();
const faz = ms => new Date(Date.now() - ms).toISOString();
const ORGS_PORTEIRO = [
  { id: 'camtaua-oficial', nome: 'Org Oficial', grupo: 'producao' }, { id: 'demo', nome: 'Demo A', grupo: 'demonstracao' },
  { id: 'felipe', nome: 'Demo B', grupo: 'demonstracao' }, { id: 'rodrigo', nome: 'Demo C', grupo: 'demonstracao' }];
const hashDe = (orgs, v) => '#hub=' + encodeURIComponent(JSON.stringify({ v: v === undefined ? 1 : v, orgs }));
const dbCom = fila => JSON.stringify({ fila, cadastros: {}, operador: {} });
const item = (org, estado, tok) => ({ token: tok || ('t-' + org + '-' + estado), tipo: 'receber', org, estado, quando: agora(), payload: { operador: 'x', kg: 1 } });

async function roda(indexTxt) {
  let falhas = 0; const log = [];
  const ok = (c, m) => { if (!c) falhas++; log.push((c ? '  ✅ ' : '  ❌ ') + m); };
  const eq = (m, g, e) => ok(JSON.stringify(g) === JSON.stringify(e), m + ' → ' + JSON.stringify(g) + (JSON.stringify(g) === JSON.stringify(e) ? '' : '  (esperado ' + JSON.stringify(e) + ')'));
  const js = jsDe(indexTxt);
  const abre = async opc => { const pedidos = []; const spy = u => { pedidos.push(String(u)); const p = Promise.reject(new Error('sem rede')); p.catch(() => {}); return p; };
    const P = pagina(js, Object.assign({ semLista: true, fetch: spy }, opc)); await P.pronto(); P.pedidos = pedidos; return P; };
  const ids = P => P.run("ORGS.map(function(o){ return o.id; })");
  const naoBeta = P => P.run("ORGS.filter(function(o){ return o.grupo !== 'beta'; }).map(function(o){ return o.id; })");
  const lista = P => { try { return JSON.parse(P.loja['lu_lista_porteiro_v1']); } catch (e) { return null; } };
  const voltaDe = (st, q, orgs, extra) => Object.assign({ onLine: true, search: '?via=porteiro&quem=' + q + '&state=' + st, hash: hashDe(orgs || ORGS_PORTEIRO), loja: { lu_state_v1: JSON.stringify({ s: hex('a'), em: agora() }) } }, extra || {});

  /* 1 · a ida ao Porteiro */
  { const P = await abre({ onLine: true, search: '?org=felipe&lote=ABC-1' });
    P.run('irAoPorteiro()');
    const u = P.nav[0] || '';
    const m = /^https:\/\/script\.google\.com\/macros\/s\/([^/]+)\/exec\?quem=1&volta=([^&]+)&state=([0-9a-f]{32})$/.exec(u);
    ok(!!m && m[1] === UNICO && decodeURIComponent(m[2]) === 'https://x/gestao-operacional/', '1 · online: navega ao Porteiro do projeto único (forma curta) com `volta` exato (barra final) e `state` de 32 hex' + (m ? '' : ' · foi para: ' + u.slice(0, 90)));
    const st = JSON.parse(P.loja['lu_state_v1'] || 'null');
    ok(st && m && st.s === m[3] && Math.abs(Date.now() - Date.parse(st.em)) < 5000, '1 · o `state` fica guardado no aparelho (com a hora) para conferir na volta');
    eq('1 · a intenção do QR (`org`,`lote`) fica guardada para depois da volta', JSON.parse(P.loja['lu_intencao_v1'] || 'null'), { org: 'felipe', lote: 'ABC-1' }); }
  { const P = await abre({ onLine: false }); P.run('irAoPorteiro()');
    ok(P.nav.length === 0 && !P.loja['lu_state_v1'], '1 · sem rede NÃO navega (a página fica; nada de laço)'); }
  { const P = await abre({ onLine: true }); P.run('ehAdmin = function(){ return true; }; irAoPorteiro()');
    ok(/^https:\/\/script\.google\.com\/a\/macros\/mandusocial\.org\/s\/[^/]+\/exec\?quem=1&volta=/.test(P.nav[0] || ''), '1 · a equipe (modo administrador) vai pela forma LONGA do Porteiro (a curta cai em «Page introuvable» com 2 contas Google)'); }

  /* 2 · a volta */
  { const P = await abre(voltaDe(hex('a'), 'org', null, { loja: { lu_state_v1: JSON.stringify({ s: hex('a'), em: agora() }), lu_intencao_v1: JSON.stringify({ org: 'felipe', lote: 'ABC-1' }) } }));
    eq('2 · volta certa: a lista monta (ids da lançadora; os 3 demos com o id antigo) + a Beta fixa', ids(P), ['camtaua-oficial', 'camtaua-demo', 'teste-felipe', 'demo-rodrigo', 'beta']);
    const L = lista(P);
    ok(L && L.orgs.length === 4 && Math.abs(Date.now() - Date.parse(L.em)) < 5000, '2 · a lista fica guardada com a hora (só id, nome e grupo do Porteiro)');
    ok(!P.loja['lu_state_v1'] && !P.loja['lu_intencao_v1'], '2 · o `state` e a intenção são de uso único (apagados)');
    const ult = P.hist[P.hist.length - 1] || '';
    eq('2 · o endereço é limpo (sem `via`, `quem`, `state`, `#hub`) e a intenção do QR volta', ult, '/gestao-operacional/?org=felipe&lote=ABC-1');
    eq('2 · origem da lista', P.run('LISTA_ORIGEM'), 'aparelho');
    eq('2 · o endereço do app: projeto único em `/<id do Registro>`', P.run("achaOrg('camtaua-demo').url"), exec(UNICO) + '/demo'); }
  { const P = await abre(voltaDe(hex('b'), 'org'));
    ok(!lista(P) && naoBeta(P).length === 0 && !P.loja['lu_state_v1'], '2 · `state` forjado (diferente do guardado): nada é gravado e o `state` é descartado');
    ok(/confirmar a sua conta/.test(String(P.run('AVISO_PORTEIRO'))), '2 · e a tela diz por quê'); }
  { const P = await abre(voltaDe(hex('a'), 'org', null, { loja: { lu_state_v1: JSON.stringify({ s: hex('a'), em: faz(11 * 60e3) }) } }));
    ok(!lista(P) && naoBeta(P).length === 0, '2 · `state` com mais de 10 min: não vale'); }
  { const P = await abre({ onLine: true, search: '?via=porteiro&quem=org&state=' + hex('a'), hash: hashDe(ORGS_PORTEIRO) });
    ok(!lista(P), '2 · volta sem `state` guardado (link forjado, ou 2ª vez): não grava'); }
  { const P = await abre(voltaDe(hex('a'), 'org', null, { hash: hashDe(ORGS_PORTEIRO, 2) }));
    ok(!lista(P), '2 · `#hub` de outra versão (v:2) não entra'); }
  { const ruins = [{ id: 'ABC', nome: 'x' }, { id: 'a b', nome: 'x' }, { id: '../x', nome: 'x' }, { id: 'ok-1', nome: 'n'.repeat(200) }];
    const muitas = []; for (let i = 0; i < 250; i++) muitas.push({ id: 'o' + i, nome: 'N', grupo: 'teste' });
    const P = await abre(voltaDe(hex('a'), 'org', ruins));
    const L = lista(P);
    ok(L && L.orgs.length === 1 && L.orgs[0].id === 'ok-1' && L.orgs[0].nome.length <= 80, '2 · ids fora do formato são descartados e o nome é cortado em 80 (' + JSON.stringify(L && L.orgs.map(o => o.id)) + ')');
    const Q = await abre(voltaDe(hex('a'), 'org', muitas));
    ok(lista(Q) && lista(Q).orgs.length === 200, '2 · lista de 250 é cortada em 200 (' + (lista(Q) && lista(Q).orgs.length) + ')'); }

  /* 3 · validade de 24 h (D26) */
  const guardada = (orgs, ms, extra) => Object.assign({ lu_lista_porteiro_v1: JSON.stringify({ orgs, em: faz(ms), quem: 'org' }) }, extra || {});
  { const P = await abre({ onLine: false, loja: guardada(ORGS_PORTEIRO, 23 * H) });
    eq('3 · 23 h, SEM rede: a lista segue valendo', [P.run('LISTA_ORIGEM'), naoBeta(P).length], ['aparelho', 4]); }
  { const P = await abre({ onLine: false, loja: guardada(ORGS_PORTEIRO, 25 * H) });
    eq('3 · 25 h: venceu — nenhuma organização é mostrada (a lista não é inventada)', [P.run('LISTA_ORIGEM'), naoBeta(P)], ['vencida', []]);
    const h = String(P.run('telaGeral(ler(), "")'));
    ok(/venceu/i.test(h) && !/sel-geral/.test(h), '3 · e a tela diz que a lista venceu, sem seletor'); }
  { const P = await abre({ onLine: false, loja: guardada(ORGS_PORTEIRO, 25 * H, { estoque_offline_v1: dbCom([item('camtaua-demo', 'guardado')]) }) });
    eq('3 · 25 h COM lançamento esperando envio: só a organização desse lançamento continua à vista', naoBeta(P), ['camtaua-demo']); }
  { const P = await abre({ onLine: false });
    const h = String(P.run('telaGeral(ler(), "")'));
    eq('3 · sem lista nenhuma: origem «nenhuma», zero organizações, mensagem clara com o gesto «Entrar»', [P.run('LISTA_ORIGEM'), naoBeta(P).length, /Entre com a sua conta Google/.test(h) && !/sel-geral/.test(h)], ['nenhuma', 0, true]);
    ok(/Sem sinal/.test(h) && !/btn-entrar-porteiro/.test(h), '3 · e, sem sinal, não oferece o botão que não funcionaria'); }
  { const P = await abre({ onLine: true });
    ok(/btn-entrar-porteiro/.test(String(P.run('telaGeral(ler(), "")'))), '3 · com sinal e sem lista: oferece «Entrar com o Google»');
    ok(!P.pedidos.some(u => /organiza/i.test(u)), '3 · a página não pede lista a nenhum arquivo'); }

  /* 4 · alias dos 3 demos: a fila antiga não some */
  { const fila = [item('camtaua-demo', 'guardado', 'tok-demo'), item('teste-felipe', 'guardado', 'tok-fel')];
    const P = await abre({ onLine: true, loja: guardada(ORGS_PORTEIRO, 1 * H, { estoque_offline_v1: dbCom(fila) }) });
    eq('4 · `demo` (Registro) e o id antigo `camtaua-demo` são a mesma organização', P.run("[achaOrg('demo').id, achaOrg('camtaua-demo').orgApp, achaOrg('demo-tobia').id]"), ['camtaua-demo', 'demo', 'camtaua-demo']);
    P.run("mudar(function(d){ d.orgOffline = 'camtaua-demo'; })");
    P.run('enviar(false)');
    const m = /^(.*)#f=(.*)$/.exec(P.nav[0] || ''); let pac = null; try { pac = JSON.parse(Buffer.from(m[2], 'base64url').toString('utf8')); } catch (e) {}
    eq('4 · o envio leva a fila antiga da demo ao `…/exec/demo` com o `org` antigo', m && [m[1], pac && pac.org, pac && pac.orgApp, pac && pac.fila.map(f => f.token)], [exec(UNICO) + '/demo?modo=sincronizar', 'camtaua-demo', 'demo', ['tok-demo']]); }

  /* 5 · recusa não apaga; cópia antiga vira provisória */
  { const P = await abre(voltaDe(hex('a'), 'recusa', [], { loja: Object.assign(guardada(ORGS_PORTEIRO, 2 * H), { lu_state_v1: JSON.stringify({ s: hex('a'), em: agora() }) }) }));
    eq('5 · `quem=recusa` com a lista boa já guardada: a lista continua (não apaga)', [lista(P) && lista(P).orgs.length, naoBeta(P).length], [4, 4]);
    ok(/recus|não.*organiza|conta/i.test(String(P.run('AVISO_PORTEIRO'))), '5 · e a tela explica o aviso'); }
  { const P = await abre(voltaDe(hex('a'), 'vazio', [], { loja: Object.assign(guardada(ORGS_PORTEIRO, 2 * H), { lu_state_v1: JSON.stringify({ s: hex('a'), em: agora() }) }) }));
    eq('5 · `quem=vazio`: idem', lista(P) && lista(P).orgs.length, 4); }
  { const velho = JSON.stringify({ organizacoes: [{ id: 'camtaua-demo', orgApp: 'demo', nome: 'x', grupo: 'testes', ambiente: 'demonstracao', deploymentUnico: UNICO, listada: true }, { id: 'camtaua-oficial', orgApp: 'camtaua-oficial', nome: 'y', grupo: 'organizacoes', ambiente: 'producao', deploymentUnico: UNICO, listada: true }] });
    const P = await abre({ onLine: false, loja: { lu_organizacoes_v1: velho, estoque_offline_v1: dbCom([item('camtaua-demo', 'guardado')]) } });
    eq('5 · cópia antiga do aparelho (sem lista nova): vira provisória SÓ da fila', [P.run('LISTA_ORIGEM'), naoBeta(P)], ['vencida', ['camtaua-demo']]);
    const Q = await abre(voltaDe(hex('a'), 'org', null, { loja: { lu_organizacoes_v1: velho, lu_state_v1: JSON.stringify({ s: hex('a'), em: agora() }) } }));
    ok(!Q.loja['lu_organizacoes_v1'] && !!lista(Q), '5 · quando a lista do Porteiro chega, a cópia antiga é apagada'); }

  /* 6 · a Beta */
  { const P = await abre({ onLine: true });
    const dep = P.run('BETA_DEP'), un = P.run('DEP_UNICO');
    ok(typeof dep === 'string' && /^AKfycb[\w-]{20,}$/.test(dep) && dep !== un && un === UNICO, '6 · `BETA_DEP` existe, é diferente do projeto único, e `DEP_UNICO` é o do projeto único');
    const arq = path.join(REPO, '..', 'copias', 'beta', 'DEPLOYMENT_ID');
    if (fs.existsSync(arq)) eq('6 · `BETA_DEP` é o de `copias/beta/DEPLOYMENT_ID`', dep, fs.readFileSync(arq, 'utf8').trim());
    const Q = await abre(voltaDe(hex('a'), 'org'));
    eq('6 · com a lista do Porteiro a Beta continua fixa, forma longa, só para a equipe', Q.run("(function(){ var b = achaOrg('beta'); return [b.url, b.grupo, b.listada, b.unico]; })()"), [exec(Q.run('BETA_DEP')), 'beta', false, false]); }
  return { falhas, log };
}

(async () => {
  const arg = process.argv[2];
  const indexTxt = fs.readFileSync(arg ? path.resolve(arg) : path.join(REPO, 'unica/index.html'), 'utf8');
  const base = await roda(indexTxt);
  console.log(base.log.join('\n'));
  const M = [
    ['a volta aceita qualquer `state` (sem conferir o guardado)', "paramDaUrl(location.search, 'state') === st.s", "true"],
    ['a lista nunca vence (a validade de 24 h some)', 'i < LISTA_VALIDADE_H * 3600e3', 'true'],
    ['os 3 demos perdem o alias (a fila antiga some)', 'var al = ALIAS_REGISTRO[p.id], id = al ? al.id : p.id;', 'var al = null, id = p.id;'],
    ['o `#hub` deixa de cortar em 200', '.slice(0, 200)', '']
  ];
  let ruim = 0;
  console.log('\n── mutantes ──');
  for (const [nome, de, para] of M) {
    const n = indexTxt.split(de).length - 1;
    if (n !== 1) { console.log('  🔴 o mutante «' + nome + '» NÃO aplicou (' + n + ' ocorrências)'); ruim++; continue; }
    let r; try { r = await roda(indexTxt.replace(de, () => para)); } catch (e) { r = { falhas: 1 }; }
    const v = r.falhas > 0; if (!v) ruim++;
    console.log('  ' + (v ? '✅ vermelho ' : '❌ SOBREVIVEU') + ' · ' + nome + ' (' + r.falhas + ' ❌)');
  }
  const total = base.falhas + ruim;
  console.log('\n' + (total ? '🔴 ' + base.falhas + ' falha(s), ' + ruim + ' mutante(s) vivo(s)' : '🟢 lançadora: a lista vem do Porteiro verde'));
  process.exit(total ? 1 : 0);
})();
