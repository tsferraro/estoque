/* PORTÃO DA LANÇADORA · SEM LISTA PÚBLICA (onda S · lote C · H10-759 · 27/10/2026).
 *
 *   node scripts/teste-sem-lista.js                       (de dentro do repositório da lançadora; sai 0 se verde)
 *   node scripts/teste-sem-lista.js <outro-index.html>    roda só a parte da PÁGINA sobre outro arquivo (o «antes», para ver vermelho)
 *
 * O repositório é PÚBLICO (GitHub Pages). O arquivo que listava as organizações (e a linha da Beta) saiu dele, e nada mais o lê:
 *   1 · nenhum arquivo rastreado tem esse nome, e nenhum arquivo rastreado o cita (`git grep` vazio);
 *   2 · o Service Worker não o guarda na casca (senão a instalação do modo sem rede cai com 404) e trocou a versão do cache;
 *   3 · o empacotador (`gerar-zip.sh`) monta a pasta sem ele;
 *   4 · a PÁGINA abre sem ele: não pede arquivo de lista à rede, não estoura sem lista e desenha as organizações quando a lista chega.
 * O nome do arquivo é montado em pedaços aqui dentro para este próprio teste não aparecer no `git grep`. */
const fs = require('fs'), path = require('path'), cp = require('child_process');
const { pagina, jsDe, REPO } = require('./lib-pagina.js');
const NOME = 'organizacoes' + '.json';

async function roda(indexTxt, soPagina) {
  let falhas = 0; const log = [];
  const ok = (c, m) => { if (!c) falhas++; log.push((c ? '  ✅ ' : '  ❌ ') + m); };
  if (!soPagina) {
    const arqs = cp.execFileSync('git', ['-C', REPO, 'ls-files'], { encoding: 'utf8' }).split('\n').filter(Boolean);
    ok(!arqs.some(f => f.endsWith(NOME)) && !fs.existsSync(path.join(REPO, 'unica', NOME)), '1 · o arquivo da lista não existe (nem rastreado, nem em `unica/`)');
    const g = cp.spawnSync('git', ['-C', REPO, 'grep', '-n', '-F', NOME], { encoding: 'utf8' });
    ok(g.status === 1 && !g.stdout.trim(), '1 · `git grep` do nome do arquivo está vazio' + (g.stdout.trim() ? ' · achou: ' + g.stdout.trim().split('\n').slice(0, 3).map(l => l.slice(0, 70)).join(' | ') : ''));
    const sw = fs.readFileSync(path.join(REPO, 'unica/sw.js'), 'utf8');
    ok(sw.indexOf(NOME) < 0, '2 · o `sw.js` não guarda o arquivo na casca');
    const v = /const CACHE = 'mandu-unica-v(\d+)'/.exec(sw);
    ok(v && +v[1] >= 11, '2 · o cache mudou de versão (v' + (v && v[1]) + ' ≥ 11): o `activate` apaga a casca antiga que ainda tinha o arquivo');
    const tmp = fs.mkdtempSync(path.join(process.env.TMPDIR || '/tmp', 'sem-lista-'));
    const z = cp.spawnSync('zsh', [path.join(REPO, 'scripts/gerar-zip.sh'), '--stage', path.join(tmp, 'pasta')], { encoding: 'utf8' });
    ok(z.status === 0 && fs.existsSync(path.join(tmp, 'pasta', 'index.html')) && !fs.existsSync(path.join(tmp, 'pasta', NOME)), '3 · `gerar-zip.sh --stage` monta a pasta sem o arquivo' + (z.status === 0 ? '' : ' · saiu ' + z.status + ': ' + (z.stderr || z.stdout).trim().split('\n').slice(-1)[0].slice(0, 120)));
    fs.rmSync(tmp, { recursive: true, force: true });
  }
  const js = jsDe(indexTxt);
  const pedidos = [];
  const spy = u => { pedidos.push(String(u)); const p = Promise.reject(new Error('sem rede')); p.catch(() => {}); return p; };
  const P = pagina(js, { semLista: true, fetch: spy, onLine: true });
  await P.pronto();
  ok(!pedidos.some(u => u.indexOf(NOME) >= 0), '4 · a página não pede o arquivo da lista à rede' + (pedidos.length ? ' · pediu: ' + pedidos.join(', ') : ''));
  const rr = String(P.run('render()'));
  ok(P.run('ORGS.length') === 0 && !/ESTOUROU/.test(rr) && String(P.el('app').innerHTML).length > 50, '4 · sem lista a página abre e desenha uma tela, sem estourar · ORGS=' + P.run('ORGS.length') + (/ESTOUROU/.test(rr) ? ' · ' + rr : ''));
  const Q = pagina(js, {});     /* a lista de teste entregue a `montarLista` (como o Porteiro fará) */
  const html = String(Q.run('telaGeral(ler(), "")'));
  ok(/id="sel-geral"/.test(html) && Q.run('ORGS.length') === 6, '4 · com a lista entregue, o Início desenha o seletor de organizações (' + Q.run('ORGS.length') + ' linhas)');
  return { falhas, log };
}

(async () => {
  const arg = process.argv[2];
  const indexTxt = fs.readFileSync(arg ? path.resolve(arg) : path.join(REPO, 'unica/index.html'), 'utf8');
  const base = await roda(indexTxt, !!arg);
  console.log(base.log.join('\n'));
  const M = [
    ['a página volta a pedir o arquivo da lista à rede', indexTxt, 'function carregarOrgs(){', "function carregarOrgs(){ fetch('" + NOME + "');"]
  ];
  let ruim = 0;
  console.log('\n── mutantes ──');
  for (const [nome, txt, de, para] of M) {
    const n = txt.split(de).length - 1;
    if (n !== 1) { console.log('  🔴 o mutante «' + nome + '» NÃO aplicou (' + n + ' ocorrências)'); ruim++; continue; }
    let r; try { r = await roda(txt.replace(de, () => para), true); } catch (e) { r = { falhas: 1 }; }
    const v = r.falhas > 0; if (!v) ruim++;
    console.log('  ' + (v ? '✅ vermelho ' : '❌ SOBREVIVEU') + ' · ' + nome + ' (' + r.falhas + ' ❌)');
  }
  const total = base.falhas + ruim;
  console.log('\n' + (total ? '🔴 ' + base.falhas + ' falha(s), ' + ruim + ' mutante(s) vivo(s)' : '🟢 lançadora sem lista pública verde'));
  process.exit(total ? 1 : 0);
})();
