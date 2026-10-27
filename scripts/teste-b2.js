/* PORTÃO DA LANÇADORA · B2 MESTRE-DETALHE NO TABLET (C3 · H10-510 · D75 = S «Aprovo B2 pro Tablet Paisagem!» · D94 · 22/10/2026).
 *
 *   node scripts/teste-b2.js            (de dentro do repositório da lançadora; sai 0 se verde) · `node scripts/teste-b2.js <outro-index.html>` roda sobre outro arquivo
 *
 * O desenho aprovado (`working/c15-lancadora-mockup/v2.1`, tela B2): em cima «O que fazer agora» em 4 peças iguais (Receber · Abrir · Fechar · Ler QR); embaixo, à ESQUERDA as etapas de «No galpão agora»
 * (cada barra é tocável) e à DIREITA o detalhe da etapa escolhida: os lotes (cada um com o botão «Abrir <próxima etapa> ›»), a ficha curta do lote tocado e, como último item da esquerda,
 * «Lançamentos deste aparelho». Tablet deitado (≥ 1000 px): duas colunas; tablet em pé (768–999 px): a mesma tela, empilhada (etapas em 3 colunas, detalhe embaixo); celular (< 768 px): NÃO muda.
 * Fora do escopo (decisão do Tobia, H10-577): a fusão Básico + Galpão/Campo. Aqui só a disposição da lançadora que já existe; nenhuma função nova.
 * Este portão EXECUTA a `unica/index.html` real num `vm` (largura/altura simuladas) e lê o DOM gerado, o CSS e a fiação:
 *   1 · tablet deitado e em pé: `#b2` com as etapas (`.b2-et`), o detalhe (`#b2-detalhe`), 4 peças de ação, sem a régua antiga nem o botão «Estoque por etapa»; celular igual ao de hoje
 *   2 · cada tipo de linha tem o detalhe certo: etapa (lotes + «Abrir …»), operação aberta («Fechar ›»), Subprodutos (chip + roxo), Lançamentos (a fila)
 *   3 · tocar num lote mostra a ficha curta (produto, saldo, origem) e o caminho para a ficha completa
 *   4 · alvos de toque ≥ 44 px (CSS), colunas por orientação (CSS), cartão largo, e girar o aparelho re-desenha (resize)
 * Os mutantes no fim provam que o portão fica vermelho quando o defeito volta. */
const fs = require('fs'), path = require('path');
const { pagina, jsDe, REPO } = require('./lib-pagina.js');
const visivel = h => String(h).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
const CHIP = /class="chip-sub"[^>]*>Subproduto<\/span>/, ROXO = /#8E5FB0/i;
const CAD = org => `mudar(function(d){ d.cadastros['${org}'] = { geradoEm:'2026-10-22T09:41:00-03:00', etapas:[{id:'SEC', nome:'Secagem', tipo:'Beneficiamento', cad:[]}, {id:'QUE', nome:'Quebra', tipo:'Beneficiamento', cad:[]}], ord:{REC:1,SEC:2,QUE:3}, operadores:[['OP-1','Gilson']],
  materias:[['Fruto de Tucumã','Tucumã'],['Fruto de Murumuru','Murumuru']],
  lotes:[['REC-20261016-002','Fruto de Tucumã','Tucumã',2400,'REC',0,4], ['REC-20261018-001','Fruto de Murumuru','Murumuru',2300,'REC',0,2], ['SEC-20261015-001','Amêndoa de Murumuru','Murumuru',1500,'SEC',0,5], ['QUE-20261019-003','Casca de Murumuru','Murumuru',640,'QUE',1,3]],
  abertas:[['SEC-20261017-009','SEC','Fruto de Tucumã','Tucumã',2700]],
  fichas:{ 'REC-20261016-002':['Fruto de Tucumã','REC','Disponível','2026-10-16',2400,2400,[['Comunidade de exemplo',2400]],[['Família A',1200]],3,0,0,0,1], 'QUE-20261019-003':['Casca de Murumuru','QUE','Disponível','2026-10-19',640,640,[['Comunidade de exemplo',640]],[],1,0,0,0,1] } }; d.modoOffline = true; d.orgOffline = '${org}'; })`;

function roda(indexTxt) {
  let falhas = 0; const log = [];
  const ok = (c, m) => { if (!c) falhas++; log.push((c ? '  ✅ ' : '  ❌ ') + m); };
  const js = jsDe(indexTxt);
  const novo = (opc, prep) => { const P = pagina(js, opc); P.run(CAD(P.org)); P.run("TELA = { nome:'inicio' }; " + (prep || '') + " render();"); P.html = () => P.el('app').innerHTML; return P; };

  /* 1 · as três larguras */
  const opcL = { largura: 1280, altura: 800 }, L = novo(opcL), hL = L.html();
  ok(/id="b2"/.test(hL) && /id="b2-detalhe"/.test(hL), '1 · tablet DEITADO (1280×800): `#b2` e `#b2-detalhe` na tela');
  const ets = (hL.match(/<button[^>]*class="b2-et[^"]*"[^>]*>/g) || []);
  ok(ets.length >= 4 && ets.every(e => /data-linha="/.test(e) && /data-b2="/.test(e)), '1 · as etapas são botões tocáveis (`.b2-et`, `data-b2`, `data-linha`): ' + ets.length);
  ok((hL.match(/aria-pressed="true"/g) || []).length === 1 && /class="b2-et on"/.test(hL), '1 · uma etapa começa escolhida (a 1ª), marcada `aria-pressed="true"`');
  ok(['btn-receber', 'btn-abrir', 'btn-fechar', 'btn-lerqr'].every(i => hL.indexOf('id="' + i + '"') > -1) && /id="acoes-b2"/.test(hL) && /id="n-abrir"/.test(hL) && /id="n-fechar"/.test(hL), '1 · «O que fazer agora» em 4 peças: Receber · Abrir · Fechar · Ler QR (com os números)');
  ok(!/id="regua"/.test(hL) && !/id="btn-estoque"/.test(hL), '1 · sem a régua antiga e sem o botão «Estoque por etapa» (cada etapa é a porta, como no desenho)');
  ok(/class="lbl">No galpão agora</.test(hL) && /Lançamentos deste aparelho/.test(visivel(hL)), '1 · «No galpão agora» e «Lançamentos deste aparelho» à esquerda');
  const opcP = { largura: 820, altura: 1180 }, Pp = novo(opcP), hP = Pp.html();
  ok(/id="b2"/.test(hP) && /id="b2-detalhe"/.test(hP), '1 · tablet EM PÉ (820×1180): a mesma tela (empilhada pelo CSS)');
  const C = novo({ largura: 390, altura: 800 }), hC = C.html();
  ok(!/id="b2"/.test(hC) && /id="regua"/.test(hC) && /id="btn-estoque"/.test(hC) && /id="acoes"/.test(hC), '1 · CELULAR (390): igual ao de hoje (régua, «Estoque por etapa», 3 ações) — o B2 não entra');

  /* 2 · o detalhe de cada linha */
  const det = h => (h.match(/<div class="sec b2-detalhe" id="b2-detalhe">[\s\S]*$/) || [''])[0];
  const dRec = det(hL);
  ok(/REC-20261016-002/.test(dRec) && /REC-20261018-001/.test(dRec) && !/SEC-20261015-001/.test(dRec), '2 · etapa «Recebido»: lista só os lotes dela (2 REC), o mais antigo primeiro');
  const abr = dRec.match(/<button class="mini"[^>]*data-abrir="[^"]*"[^>]*data-etapa-abrir="SEC"[^>]*>[^<]*Abrir Secagem[^<]*<\/button>/g) || [];
  ok(abr.length === 2, '2 · cada lote tem o botão «Abrir Secagem» (`data-abrir` + `data-etapa-abrir`, o mesmo do Estoque por etapa): ' + abr.length);
  const linhas = (hL.match(/data-b2="[^"]+"/g) || []).map(x => x.slice(9, -1));
  const sel = (chave, extra) => novo(opcL, "B2.sel = '" + chave + "'; B2.lote = '" + (extra || '') + "';");
  const dOp = det(sel('op:SEC').html());
  ok(linhas.indexOf('op:SEC') > -1 && /data-b2op="SEC-20261017-009"/.test(dOp) && /Fechar/.test(visivel(dOp)), '2 · operação aberta: o detalhe lista a operação com «Fechar ›» (`data-b2op`)');
  const dSub = det(sel('sub').html());
  ok(linhas.indexOf('sub') > -1 && CHIP.test(dSub) && ROXO.test(dSub.replace(/<span class="chip-sub"[\s\S]*?<\/span>/g, '')) && /Casca de Murumuru/.test(dSub), '2 · Subprodutos: o lote leva o chip «Subproduto», o roxo e o nome do produto');
  const dFila = det(sel('fila').html());
  ok(/Nada lançado neste aparelho ainda/.test(dFila), '2 · Lançamentos: sem fila, o detalhe diz «Nada lançado neste aparelho ainda»');
  const F = novo(opcL, "mudar(function(d){ d.fila = [{ token:'t1', org:'" + L.org + "', tipo:'abrir', estado:'guardado', quando:'2026-10-22T12:00:00Z', payload:{ etapa:'SEC', etapaNome:'Secagem', produto:'Fruto de Tucumã', lotes:[{ codigo:'REC-20261016-002', kg:900 }] } }]; }); B2.sel = 'fila';");
  ok(/class="fila"/.test(det(F.html())) && /guardado no aparelho/.test(visivel(det(F.html()))) && /1 guardado/.test(visivel(F.html())), '2 · Lançamentos: com fila, o detalhe mostra a lista dos guardados (a mesma `linhaFila`)');

  /* 3 · a ficha curta */
  const dF = det(sel('lote:REC', 'REC-20261016-002').html());
  ok(/id="b2-ficha"/.test(dF) && /Fruto de Tucumã/.test(dF) && /Comunidade de exemplo/.test(dF) && /2\.400/.test(visivel(dF)), '3 · tocar no lote mostra a ficha curta: produto, saldo e a comunidade de origem');
  ok(/id="b2-ficha-abrir"[^>]*data-ficha="REC-20261016-002"/.test(dF), '3 · e o botão «Ficha completa» leva à ficha de sempre (`data-ficha`)');
  const dFs = det(sel('sub', 'QUE-20261019-003').html());
  ok(CHIP.test((dFs.match(/<div class="b2-ficha"[\s\S]*$/) || [''])[0]), '3 · a ficha curta do subproduto também leva o chip «Subproduto»');
  ok(L.run("typeof b2Escolher === 'function' && typeof b2EscolherLote === 'function'"), '3 · `b2Escolher` e `b2EscolherLote` existem (a fiação dos toques)');
  L.run("b2Escolher('sub')"); ok(/class="b2-et on"[^>]*data-b2="sub"/.test(L.html()) || /data-b2="sub"[^>]*aria-pressed="true"/.test(L.html()), '3 · tocar numa etapa a escolhe e re-desenha');
  L.run("b2EscolherLote('QUE-20261019-003')"); ok(/id="b2-ficha"/.test(L.html()), '3 · tocar num lote abre a ficha curta');

  /* 4 · CSS, cartão largo e girar o aparelho */
  const css = (indexTxt.match(/<style>[\s\S]*?<\/style>/) || [''])[0];
  ok(/@media \(min-width:1000px\) and \(orientation:landscape\)\{[^@]*\.b2\{grid-template-columns:minmax\(300px,2fr\) 3fr/.test(css), '4 · CSS: a 2 colunas (etapas | detalhe) só no tablet deitado (≥ 1000 px e paisagem)');
  ok(/\.b2-mestre \.b2-lista\{display:grid;grid-template-columns:repeat\(3,1fr\)/.test(css), '4 · CSS: em pé as etapas ficam em 3 colunas (como o B2 de 820 px)');
  ['\\.b2-et', '\\.b2 \\.lt \\.mini', '\\.ac4 \\.ac', '\\.chip', '\\.b2 \\.card'].forEach(s => ok(new RegExp(s + '[^}]*min-height:(4[4-9]|[5-9]\\d)px').test(css), '4 · CSS: alvo de toque ≥ 44 px em `' + s.replace(/\\/g, '') + '`'));
  ok(/class="cartao lu-largo"/.test(L.html()) || L.run("classeDaTela('inicio')") === 'cartao lu-largo', '4 · o cartão ocupa a largura (`lu-largo`) no tablet; no celular segue estreito/normal: ' + C.run("classeDaTela('inicio')"));
  ok(/addEventListener\('resize'/.test(indexTxt) && L.run("typeof b2Resize_ === 'function'"), '4 · há ouvinte de `resize` (girar o aparelho re-desenha)');
  opcL.largura = 390; opcL.altura = 800; L.run('b2Resize_()');
  ok(!/id="b2"/.test(L.html()) && /id="regua"/.test(L.html()), '4 · girar/encolher para o tamanho de celular tira o B2 e volta à régua');
  opcL.largura = 1280; opcL.altura = 800; L.run('b2Resize_()');
  ok(/id="b2"/.test(L.html()), '4 · e voltar ao tablet deitado traz o B2 de volta (estado da etapa escolhida preservado: ' + L.run('B2.sel') + ')');

  /* 5 · H10-658 · item recusado no tablet: selo, abertura na etapa «Lançamentos», Sincronizar e «descartar» alcançáveis */
  const filaRec = org => "mudar(function(d){ d.fila = [" +
    "{ token:'tg1', org:'" + org + "', tipo:'abrir', estado:'guardado', quando:'2026-10-22T12:00:00Z', payload:{ etapa:'SEC', etapaNome:'Secagem', produto:'Fruto de Tucumã', lotes:[{ codigo:'REC-20261016-002', kg:900 }] } }," +
    "{ token:'tg2', org:'" + org + "', tipo:'abrir', estado:'guardado', quando:'2026-10-22T12:05:00Z', payload:{ etapa:'SEC', etapaNome:'Secagem', produto:'Fruto de Tucumã', lotes:[{ codigo:'REC-20261018-001', kg:500 }] } }," +
    "{ token:'tr1', org:'" + org + "', tipo:'abrir', estado:'recusado', erro:'lote já fechado na planilha', quando:'2026-10-22T11:00:00Z', payload:{ etapa:'SEC', etapaNome:'Secagem', produto:'Fruto de Tucumã', lotes:[{ codigo:'REC-20261016-002', kg:100 }] } }]; });";
  const R = novo(opcL, filaRec(L.org)), hR = R.html(), dR = det(hR);
  const botFila = (hR.match(/<button[^>]*class="b2-et b2-fila[^"]*"[\s\S]*?<\/button>/) || [''])[0];
  ok(/2 guardados/.test(visivel(botFila)) && /1 recusado/.test(visivel(botFila)) && /class="b2-badge rec"[^>]*>\s*1 recusado/.test(botFila), '5a · o selo de «Lançamentos deste aparelho» mostra «2 guardados» e «1 recusado» (o recusado na cor de erro `.rec`)');
  ok(/class="b2-et b2-fila on"/.test(hR) && /id="b2-detalhe"/.test(hR) && /class="fila"/.test(dR) && /recusado pela planilha: lote já fechado na planilha/.test(visivel(dR)), '5b · com recusado o tablet ABRE na etapa «Lançamentos» e já mostra o motivo do recusado');
  ok((hR.match(/aria-pressed="true"/g) || []).length === 1, '5b · só uma etapa fica escolhida (a de Lançamentos)');
  ok(/id="btn-enviar"/.test(hR) && /Sincronizar/.test(visivel(hR)), '5c · o botão «Sincronizar» (`#btn-enviar`) está na tela do tablet');
  ok(/data-descartar="tr1"/.test(dR), '5d · «descartar este lançamento» (`data-descartar`) do recusado está no detalhe do tablet');
  R.run("b2Escolher('lote:REC')");
  ok(!/class="b2-et b2-fila on"/.test(R.html()), '5b · o operador escolhe outra etapa e ela fica (a abertura em Lançamentos só vale na primeira vez)');
  const S = novo(opcL, filaRec(L.org).replace("estado:'recusado', erro:'lote já fechado na planilha', ", "estado:'enviado', "));
  ok(/class="b2-et on"/.test(S.html()) && !/class="b2-et b2-fila on"/.test(S.html()) && !/class="b2-badge rec"/.test(S.html()), '5 · sem recusado nada muda: abre na 1ª etapa e não há selo de recusado');
  const CR = novo({ largura: 390, altura: 800 }, filaRec(L.org)), hCR = CR.html();
  ok(!/id="b2"/.test(hCR) && /<ul class="fila">/.test(hCR) && /data-descartar="tr1"/.test(hCR) && /id="btn-enviar"/.test(hCR), '5 · CELULAR com recusado: igual a hoje (lista à vista, «descartar», «Sincronizar»; sem B2)');
  return { falhas, log };
}

const arg = process.argv[2];
const indexTxt = fs.readFileSync(arg ? path.resolve(arg) : path.join(REPO, 'unica/index.html'), 'utf8');
const base = roda(indexTxt);
console.log(base.log.join('\n'));
const M = [
  ['o B2 nunca liga (b2Ativo falso)', ["function b2Ativo(){", "function b2Ativo(){ return false;"]],
  ['o lote perde o botão «Abrir <próxima etapa>»', ['data-etapa-abrir="\' + esc(l.proximo.id) + \'">\' + esc(acaoDaEtapa(l.proximo)) + \' ›</button>', 'data-xx="\' + esc(l.proximo.id) + \'">\' + esc(acaoDaEtapa(l.proximo)) + \' ›</button>']],
  ['o detalhe do subproduto perde o chip', ['class="b2-prod">\' + esc(l.produto) + chipSub(l.sub)', 'class="b2-prod">\' + esc(l.produto) + \'\'']],
  ['a ficha curta perde o chip', ["<b class=\"cod\">' + esc(codigoExibicao(l.codigo)) + '</b>' + chipSub(sub)", "<b class=\"cod\">' + esc(codigoExibicao(l.codigo)) + '</b>'"]],
  ['o cartão não alarga no tablet', ["'cartao lu-largo' : 'cartao')", "'cartao' : 'cartao')"]],
  ['a regra de 2 colunas some do CSS', ['@media (min-width:1000px) and (orientation:landscape){', '@media (min-width:99999px) and (orientation:landscape){']],
  ['o alvo de toque da etapa cai para 36 px', ['.b2-et{min-height:64px;', '.b2-et{min-height:36px;']],
  ['o botão do lote cai para 30 px', ['.b2 .lt .mini{min-height:44px;', '.b2 .lt .mini{min-height:30px;']],
  ['girar o aparelho deixa de re-desenhar', ['function b2Resize_(){', 'function b2Resize_(){ return;']],
  ['o selo da etapa Lançamentos ignora o recusado', ["(rec.length ? '<span class=\"b2-badge rec\">'", "(false ? '<span class=\"b2-badge rec\">'"]],
  ['o selo do recusado perde a cor de erro', ['class="b2-badge rec"', 'class="b2-badge"']],
  ['com recusado o tablet volta a abrir na 1ª etapa', ["B2.sel = rec.length ? 'fila' : chaves[0];", "B2.sel = chaves[0];"]],
  ['a abertura em Lançamentos vale sempre (prende o operador)', ["if (chaves.indexOf(B2.sel) < 0) {", "if (rec.length || chaves.indexOf(B2.sel) < 0) {"]],
  ['o Sincronizar some do tablet', ['" id="btn-enviar">Sincronizar', '" id="btn-x">Sincronizar']],
  ['o «descartar» some da linha da fila', ['<button class="link" data-descartar="', '<button class="link" data-xx="']]
];
let ruim = 0;
console.log('\n── mutantes ──');
M.forEach(([nome, [de, para]]) => {
  const n = indexTxt.split(de).length - 1;
  if (n < 1 || para === null) { console.log('  ' + (n < 1 ? '🔴 NÃO aplicou' : '⏭  sem mutação própria') + ' · ' + nome + ' (' + n + ')'); if (n < 1) ruim++; return; }
  let r; try { r = roda(indexTxt.split(de).join(para)); } catch (e) { r = { falhas: 1 }; }
  const v = r.falhas > 0; if (!v) ruim++;
  console.log('  ' + (v ? '✅ vermelho ' : '❌ SOBREVIVEU') + ' · ' + nome + ' (' + r.falhas + ' ❌)');
});
const total = base.falhas + ruim;
console.log('\n' + (total ? '🔴 ' + base.falhas + ' falha(s), ' + ruim + ' mutante(s) vivo(s)' : '🟢 lançadora: B2 mestre-detalhe no tablet verde'));
process.exit(total ? 1 : 0);
