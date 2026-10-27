/* PORTÃO DA LANÇADORA · «SAIR DESTE APARELHO» SEM PERDER A FILA (onda S · lote C · 27/10/2026).
 *
 *   node scripts/teste-sair.js                       (de dentro do repositório da lançadora; sai 0 se verde)
 *   node scripts/teste-sair.js <outro-index.html>    roda sobre outro arquivo (o «antes», para ver vermelho)
 *
 * Regra escolhida (levantamento de 27/10, seção f.3):
 *   · sem lançamento esperando → confirma e apaga tudo (conta, lista, cadastros, operador, recebidas, última organização, modo administrador);
 *   · com lançamento esperando e COM sinal → oferece ENVIAR AGORA antes de sair (a fila vai ao /exec; nada é apagado);
 *   · com lançamento esperando e sem sinal (ou quem recusa enviar) → AVISA A CONTAGEM e pede confirmação; confirmado, a fila fica
 *     (não enviados + enviados que um pendente ainda aponta por `ref`) com o mínimo para enviar; cancelado, nada muda.
 * Lançamento esperando NUNCA some em silêncio. Os mutantes no fim provam que o portão fica vermelho quando o defeito volta. */
const fs = require('fs'), path = require('path');
const { pagina, jsDe, REPO } = require('./lib-pagina.js');
const UNICO = 'AKfycbyw9syhEIyuaMaYT-ej95koauzv4hXlLJEyAXY6OMwL4Ba6socaChpIapRx9ekWcVve';
const exec = dep => 'https://script.google.com/a/macros/mandusocial.org/s/' + dep + '/exec';
const agora = () => new Date().toISOString();
const ORGS_PORTEIRO = [{ id: 'camtaua-oficial', nome: 'Org Oficial', grupo: 'producao' }, { id: 'demo', nome: 'Demo A', grupo: 'demonstracao' }];
const it = (org, estado, tok, extra) => Object.assign({ token: tok, tipo: 'receber', org, estado, quando: agora(), payload: { operador: 'Fulano', kg: 1 } }, extra || {});
const FILA = [
  it('camtaua-demo', 'guardado', 'a'), it('camtaua-demo', 'guardado', 'b'),
  it('camtaua-demo', 'enviado', 'c', { codigo: 'LOTE-C', enviadoEm: agora() }),                       /* enviado e solto: pode sair */
  it('camtaua-demo', 'enviado', 'd', { codigo: 'LOTE-D', enviadoEm: agora() }),                       /* enviado, mas o pendente `f` ainda aponta para ele */
  it('camtaua-demo', 'recusado', 'e', { erro: 'x' }),
  it('camtaua-demo', 'guardado', 'f', { tipo: 'abrir', payload: { operador: 'Fulano', lotes: [{ ref: 'd', kg: 2 }] } })];
const dbCheio = () => JSON.stringify({ fila: FILA, cadastros: { 'camtaua-demo': { fuso: 'America/Sao_Paulo', familias: ['Nome de Família'] } }, operador: { 'camtaua-demo': 'Fulano' },
  recebidas: ['camtaua-demo'], ultimaEm: agora(), cadVelho: {} });
const aparelho = (extra) => Object.assign({ lu_lista_porteiro_v1: JSON.stringify({ orgs: ORGS_PORTEIRO, em: agora(), quem: 'org' }), estoque_offline_v1: dbCheio(),
  estoque_org: 'camtaua-demo', estoque_auto_off: '1' }, extra || {});
const dbDe = P => { try { return JSON.parse(P.loja['estoque_offline_v1']); } catch (e) { return null; } };
const toks = db => ((db && db.fila) || []).map(i => i.token);

async function roda(indexTxt) {
  let falhas = 0; const log = [];
  const ok = (c, m) => { if (!c) falhas++; log.push((c ? '  ✅ ' : '  ❌ ') + m); };
  const eq = (m, g, e) => ok(JSON.stringify(g) === JSON.stringify(e), m + ' → ' + JSON.stringify(g) + (JSON.stringify(g) === JSON.stringify(e) ? '' : '  (esperado ' + JSON.stringify(e) + ')'));
  const js = jsDe(indexTxt);
  /* o modo administrador e o Galpão/Campo são marcados DEPOIS de abrir (aberta já assim, a página desenha o Painel/Início completo, que o DOM de mentira não sustenta) */
  const abre = async opc => { const P = pagina(js, Object.assign({ semLista: true }, opc)); await P.pronto(); P.loja['lu_admin_aparelho'] = '1';
    try { const d = JSON.parse(P.loja['estoque_offline_v1']); d.modoOffline = true; d.orgOffline = 'camtaua-demo'; P.loja['estoque_offline_v1'] = JSON.stringify(d); } catch (e) {}   /* também marcado depois: o Início do Galpão/Campo precisa de DOM de verdade */
    return P; };
  const sai = async P => { const r = P.run('sairDoAparelho()'); return (r && typeof r.then === 'function') ? await r : r; };

  /* a) sem lançamento esperando */
  { const P = await abre({ onLine: false, loja: aparelho({ estoque_offline_v1: JSON.stringify({ fila: [FILA[2]], cadastros: { x: {} } }) }) });
    ok(/link-sair-aparelho/.test(String(P.run('sairHtml_()'))), 'a · o botão «Sair deste aparelho» aparece quando há algo guardado');
    const r = await sai(P);
    ok(r === true && P.confirmas.length === 1, 'a · sem lançamento esperando: UMA confirmação e sai');
    ok(['lu_lista_porteiro_v1', 'estoque_offline_v1', 'estoque_org', 'lu_admin_aparelho', 'estoque_auto_off'].every(k => !(k in P.loja)), 'a · apagou a lista, o banco do aparelho, a última organização e o modo administrador');
    ok(/saia também da conta Google/.test(String(P.run('telaGeral(ler(), "")'))), 'a · a tela lembra de sair também da conta Google'); }
  { const P = await abre({ onLine: false, loja: aparelho({ estoque_offline_v1: JSON.stringify({ fila: [], cadastros: { x: {} } }) }), confirm: () => false });
    const antes = JSON.stringify(P.loja); const r = await sai(P);
    ok(r === false && JSON.stringify(P.loja) === antes, 'a · cancelou: nada muda'); }
  { const P = await abre({ onLine: true });
    ok(!/link-sair-aparelho/.test(String(P.run('sairHtml_()'))), 'a · aparelho limpo: sem botão «Sair»'); }

  /* b) com lançamento esperando, SEM rede, confirma: a fila fica */
  { const P = await abre({ onLine: false, loja: aparelho() });
    eq('b · antes de sair: 3 esperando', P.run('resumoFila_().n'), 3);
    const r = await sai(P);
    ok(r === true && P.confirmas.length === 1 && /Sair e manter 3 lançamento/.test(P.confirmas[0]), 'b · sem rede: AVISA A CONTAGEM e pede confirmação («Sair e manter 3 lançamento(s)…»)');
    const db = dbDe(P);
    eq('b · ficam os 3 esperando + o recusado + o enviado que o pendente aponta (`d`); sai o enviado solto (`c`)', toks(db), ['a', 'b', 'd', 'e', 'f']);
    ok(db && Object.keys(db.cadastros).length === 0 && Object.keys(db.operador).length === 0 && !db.modoOffline && !db.orgOffline, 'b · cadastros (nomes de família), operador e modo Galpão/Campo saem');
    ok(!P.loja['lu_lista_porteiro_v1'] && !P.loja['estoque_org'] && !P.loja['lu_admin_aparelho'] && !P.loja['estoque_auto_off'], 'b · lista, última organização e modo administrador saem');
    eq('b · fica o mínimo para enviar: `{id do Registro, nome, grupo}` da organização com lançamento', JSON.parse(P.loja['lu_fila_orgs_v1'] || 'null'), [{ id: 'demo', nome: 'Demo A', grupo: 'demonstracao' }]);
    eq('b · depois de sair a organização da fila continua à vista (sem lista nova)', [P.run('LISTA_ORIGEM'), P.run("ORGS.filter(function(o){ return o.grupo !== 'beta'; }).map(function(o){ return o.id; })")], ['vencida', ['camtaua-demo']]);
    const h = String(P.run('telaGeral(ler(), "")'));
    ok(/3 lançamentos esperando envio/.test(h) && /data-enviar-fila="camtaua-demo"/.test(h) && /continuam aqui/.test(h), 'b · a tela mostra «3 lançamentos esperando envio», o botão de enviar e o aviso de que continuam aqui');
    P.ctx.navigator.onLine = true; P.run("enviarFila_('camtaua-demo')");
    const m = /^(.*)#f=(.*)$/.exec(P.nav[0] || ''); let pac = null; try { pac = JSON.parse(Buffer.from(m[2], 'base64url').toString('utf8')); } catch (e) {}
    eq('b · e dá para ENVIAR depois do «Sair»: a fila vai ao `…/exec/demo` com o `org` antigo', m && [m[1], pac && pac.org, pac && pac.fila.map(f => f.token)], [exec(UNICO) + '/demo?modo=sincronizar', 'camtaua-demo', ['a', 'b', 'f']]); }

  /* c) com lançamento esperando, sem rede, CANCELA: nada muda */
  { const P = await abre({ onLine: false, loja: aparelho(), confirm: () => false });
    const antes = JSON.stringify(P.loja); const r = await sai(P);
    ok(r === false && JSON.stringify(P.loja) === antes, 'c · cancelou: nada muda (nem a fila, nem a lista)'); }

  /* d) com rede: oferece ENVIAR AGORA primeiro */
  { const P = await abre({ onLine: true, loja: aparelho() });   /* confirm padrão = true: aceita o 1º (enviar agora) */
    const antes = JSON.stringify(P.loja); const r = await sai(P);
    ok(r === false && /Enviar agora/.test(P.confirmas[0] || '') && P.confirmas.length === 1, 'd · com sinal: a 1ª pergunta é «Enviar agora, antes de sair?»');
    const m = /^(.*)#f=(.*)$/.exec(P.nav[0] || '');
    ok(!!m && m[1] === exec(UNICO) + '/demo?modo=sincronizar', 'd · aceitou: a fila vai ao /exec da organização');
    ok(JSON.stringify(P.loja) === antes, 'd · e NADA foi apagado (o retorno `#r=` é que marca como enviado)'); }
  { const P = await abre({ onLine: true, loja: aparelho(), confirm: (m, n) => n === 2 });   /* recusa enviar, aceita sair e manter */
    const r = await sai(P);
    ok(r === true && P.confirmas.length === 2 && /Sair e manter 3/.test(P.confirmas[1]), 'd · com sinal, recusou enviar: cai no aviso da contagem («Sair e manter 3…»)');
    eq('d · e a fila fica', toks(dbDe(P)), ['a', 'b', 'd', 'e', 'f']); }

  /* e) nunca em silêncio: em todos os caminhos com pendente, os pendentes não somem */
  for (const [nome, opc] of [['sem rede + confirma', { onLine: false }], ['com sinal + recusa enviar + confirma', { onLine: true, confirm: (m, n) => n === 2 }]]) {
    const P = await abre(Object.assign({ loja: aparelho() }, opc)); await sai(P);
    const t = toks(dbDe(P)); ok(['a', 'b', 'f'].every(x => t.indexOf(x) >= 0), 'e · ' + nome + ': os 3 lançamentos esperando continuam no aparelho');
  }
  return { falhas, log };
}

(async () => {
  const arg = process.argv[2];
  const indexTxt = fs.readFileSync(arg ? path.resolve(arg) : path.join(REPO, 'unica/index.html'), 'utf8');
  const base = await roda(indexTxt);
  console.log(base.log.join('\n'));
  const M = [
    ['«Sair» apaga a fila junto (o `manter` é ignorado)', "var keep = manter ? filaParaManter_(db) : [],", "var keep = [],"],
    ['«Sair» com lançamento esperando não pede confirmação', "if (!confirm('Sair e manter '", "if (false && !confirm('Sair e manter '"],
    ['os cadastros (nomes de família) ficam no aparelho', "gravar({ fila:keep, cadastros:{},", "gravar({ fila:keep, cadastros:db.cadastros,"],
    ['o enviado que um pendente aponta (`ref`) é apagado', "return fila.filter(function(i){ return i.estado !== 'enviado' || refs[i.token]; });", "return fila.filter(function(i){ return i.estado !== 'enviado'; });"]
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
  console.log('\n' + (total ? '🔴 ' + base.falhas + ' falha(s), ' + ruim + ' mutante(s) vivo(s)' : '🟢 lançadora: sair do aparelho sem perder a fila verde'));
  process.exit(total ? 1 : 0);
})();
