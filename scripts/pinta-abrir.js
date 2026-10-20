/* BANCADA da lançadora (CON-c10-r2 · G2): escreve UM html autônomo do Abrir › Armazenamento (casca em «Na operação» e em «Disponíveis», com o principal ao lado)
 * para o Chrome fotografar (390 e 1280 px). Fora de qualquer portão.
 *   node scripts/pinta-abrir.js <pasta-destino>        → <pasta>/tela-lancadora-abrir-arm-disponiveis.html e …-na-operacao.html  (depois: app/testes/foto-cr5.sh <pasta>) */
const fs = require('fs'), path = require('path'), vm = require('vm');
const REPO = path.resolve(__dirname, '..');
const destino = process.argv[2]; if (!destino) { console.log('uso: node scripts/pinta-abrir.js <pasta-destino>'); process.exit(1); }
fs.mkdirSync(destino, { recursive: true });
const teste = fs.readFileSync(path.join(__dirname, 'teste-chip.js'), 'utf8');
const pagina = new Function('fs', 'path', 'vm', 'REPO', 'Buffer', teste.slice(teste.indexOf('function pagina(js)'), teste.indexOf('const ROXO')) + '\nreturn pagina;')(fs, path, vm, REPO, Buffer);
const indexTxt = fs.readFileSync(path.join(REPO, 'unica/index.html'), 'utf8');
const js = [...indexTxt.matchAll(/<script(?![^>]*\ssrc)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]).sort((a, b) => b.length - a.length)[0];
const P = pagina(js);
P.run(`mudar(function(d){ d.cadastros['${P.org}'] = { etapas:[{id:'QUE', nome:'Quebra', tipo:'Beneficiamento', cad:[]}, {id:'ARM', nome:'Armazenamento', tipo:'Movimentação', cad:[]}], ord:{REC:1,QUE:3,ARM:4}, operadores:[['OP-1','Gilson']],
  lotes:[['QUE-20261019-003','Casca de Murumuru','Murumuru',334,'QUE',1,95], ['QUE-20261019-001','Amêndoa de Murumuru','Murumuru',1500,'QUE',0,2], ['QUE-20261019-002','Amêndoa de Murumuru','Murumuru',900,'QUE',0,5], ['1SUB-20260630-001','Casca de Tucumã','Tucumã',800,'QUE',1,20]] }; d.orgOffline = '${P.org}'; d.modoOffline = true; })`);
const grava = (nome, corpo) => {
  const pag = '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' + (indexTxt.match(/<style[\s\S]*?<\/style>/) || [''])[0] + '<body><div id="app" class="cartao">' + corpo + '</div></body>';
  fs.writeFileSync(path.join(destino, 'tela-lancadora-abrir-arm-' + nome + '.html'), pag);
  console.log('✅ ' + path.join(destino, 'tela-lancadora-abrir-arm-' + nome + '.html') + ' (' + corpo.length + ' chars; chips: ' + (corpo.match(/data-chip-sub/g) || []).length + ')');
};
P.run("TELA = { nome:'abrir', form:{ etapa:'ARM', lotes:{}, obs:'' } }; render();");
grava('disponiveis', P.el('app').innerHTML);                                   // nada escolhido: tudo em «Disponíveis»
P.run("TELA.form.lotes['QUE-20261019-003'] = { kg:'334', naoAcabou:false }; TELA.form.lotes['QUE-20261019-001'] = { kg:'500', naoAcabou:true }; render();");
grava('na-operacao', P.el('app').innerHTML);                                   // a casca e o principal trazidos para «Na operação»
