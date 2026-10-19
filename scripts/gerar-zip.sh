#!/bin/zsh
# Gera o ZIP da LANÇADORA ÚNICA (SGO Mandū) para a plataforma Mandū. SÓ LOCAL: não envia nada a lugar nenhum (o upload é gesto do Tobia).
#
#   lancadora/scripts/gerar-zip.sh                 → gera <checkout principal>/lancadora-zip/gestao-operacional-AAAAMMDD-HHMM.zip
#   lancadora/scripts/gerar-zip.sh --stage <pasta> → só monta a pasta pronta para servir (gate de realidade em localhost), sem ZIP
#
# FONTE ÚNICA: lancadora/unica/ (este repositório) + os ícones PNG e a imagem de prévia (og-sgo-mandu.png, 1200x630) de lancadora/icones/, que vão SOLTOS na raiz do ZIP (o desenho evita
# subpasta para o ícone). Endereço no ar, SEMPRE com a barra: https://mandu-apps.lp.agentesamanda.com/gestao-operacional/
# Falha alto se faltar index.html, sw.js, manifest.webmanifest ou organizacoes.json, se o JSON não abrir, se faltar meta tag/nome do app (H10-290),
# ou se o sw.js, o index.html ou o manifesto citarem arquivo que não está na pasta (R1A-2). Organização com /exec «PREENCHER_…» é aviso, não erro.
set -euo pipefail
AQUI=${0:A:h}
REPO=${AQUI:h}
FONTE="$REPO/unica"
PRINCIPAL=${REPO:h}
SAIDA_DIR="$PRINCIPAL/lancadora-zip"
ICONES=(u-mandu-32.png u-mandu-180.png u-mandu-192.png u-mandu-512.png u-mandu-glifo.png og-sgo-mandu.png)
OBRIGATORIOS=(index.html sw.js manifest.webmanifest organizacoes.json)

STAGE_ARG=""
if [[ "${1:-}" == "--stage" ]]; then STAGE_ARG="${2:?uso: --stage <pasta>}"; fi

for f in $OBRIGATORIOS; do
  [[ -s "$FONTE/$f" ]] || { echo "🔴 falta $FONTE/$f (obrigatório no ZIP)"; exit 1; }
done
node -e 'JSON.parse(require("fs").readFileSync(process.argv[1],"utf8"))' "$FONTE/organizacoes.json" || { echo "🔴 organizacoes.json não é JSON válido"; exit 1; }

FONTE_ICONES="$REPO/icones"
[[ -d "$FONTE_ICONES" ]] || { echo "🔴 não achei $FONTE_ICONES (de onde vêm os ícones PNG e a imagem de prévia (og-sgo-mandu.png, 1200x630))"; exit 1; }

if [[ -n "$STAGE_ARG" ]]; then PASTA="$STAGE_ARG"; mkdir -p "$PASTA"; else PASTA="$(mktemp -d "${TMPDIR:-/tmp}/lancadora-unica.XXXXXX")"; trap 'rm -rf "${PASTA:?}"' EXIT; fi
rsync -a --exclude '.DS_Store' "$FONTE/" "$PASTA/"
for i in $ICONES; do
  [[ -s "$FONTE_ICONES/$i" ]] || { echo "🔴 falta o ícone $FONTE_ICONES/$i"; exit 1; }
  cp "$FONTE_ICONES/$i" "$PASTA/$i"
done

# o sw.js não pode pedir arquivo que não está na pasta (o addAll é atômico: a instalação do offline falharia em silêncio)
node -e '
  const fs = require("fs"), path = require("path"), dir = process.argv[1];
  const sw = fs.readFileSync(path.join(dir, "sw.js"), "utf8");
  const bloco = sw.slice(sw.indexOf("const CASCA"), sw.indexOf("const ARQUIVOS_DA_CASCA"));
  const lista = [...bloco.matchAll(/["\x27](\.\/[^"\x27]*)["\x27]/g)].map(m => m[1]).filter(f => f !== "./");
  const falta = lista.filter(f => !fs.existsSync(path.join(dir, f)));
  if (falta.length) { console.error("🔴 o sw.js pede arquivos que não estão na pasta: " + falta.join(", ")); process.exit(1); }
  if (!/const CACHE = .mandu-unica-v\d+./.test(sw)) { console.error("🔴 o sw.js não usa o cache mandu-unica-v*"); process.exit(1); }
  /* R1A-2 · todo arquivo LOCAL que o index.html (fora de <script>/<style>) e o manifesto citam tem de estar na pasta: o ícone em `icones/`
     deu 404 no ZIP porque o empacotador só conferia o que o sw.js pede */
  const html = fs.readFileSync(path.join(dir, "index.html"), "utf8").replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "");
  const citados = [...html.matchAll(/\b(?:href|src)\s*=\s*["\x27]([^"\x27]+)["\x27]/gi)].map(m => m[1].trim());
  const man = JSON.parse(fs.readFileSync(path.join(dir, "manifest.webmanifest"), "utf8"));
  for (const i of (man.icons || [])) citados.push(i.src);
  if (man.start_url && !/^(\.\/?)?$/.test(man.start_url)) citados.push(man.start_url);
  const locais = [...new Set(citados.filter(u => u && !/^(https?:|data:|blob:|mailto:|tel:|#|javascript:|\/\/)/i.test(u)).map(u => u.split(/[?#]/)[0]).filter(u => u && u !== "./"))];
  const semArq = locais.filter(u => !fs.existsSync(path.join(dir, u.replace(/^\.\//, ""))));
  if (semArq.length) { console.error("🔴 o index.html/manifesto citam arquivos que NÃO estão no ZIP: " + semArq.join(", ")); process.exit(1); }
  console.log("✓ " + locais.length + " arquivos citados no index.html/manifesto presentes: " + locais.join(", "));
  const org = JSON.parse(fs.readFileSync(path.join(dir, "organizacoes.json"), "utf8"));
  const pend = org.organizacoes.filter(o => /^PREENCHER/.test(o.deployment)).map(o => o.id);
  console.log("✓ " + lista.length + " arquivos da instalação do Service Worker presentes · " + org.organizacoes.length + " organizações");
  if (pend.length) console.log("🟡 /exec ainda por preencher em: " + pend.join(", ") + " (a lançadora mostra essas organizações como «aguardando o app»)");
' "$PASTA"

# H10-290 · nome do app e meta tags presentes no index.html e no manifesto (o ZIP não sai sem eles)
node -e '
  const fs = require("fs"), path = require("path"), dir = process.argv[1];
  const html = fs.readFileSync(path.join(dir, "index.html"), "utf8"), man = JSON.parse(fs.readFileSync(path.join(dir, "manifest.webmanifest"), "utf8"));
  const falta = [];
  const exige = (nome, ok) => { if (!ok) falta.push(nome); };
  exige("<title> com «Sistema de Gestão Operacional» e «SGO Mandū»", /<title>[^<]*Sistema de Gestão Operacional[^<]*SGO Mandū[^<]*<\/title>/.test(html));
  for (const k of ["description", "apple-mobile-web-app-title", "theme-color", "application-name"]) exige("meta " + k, new RegExp("<meta name=\"" + k + "\" content=\"[^\"]+\"").test(html));
  for (const k of ["og:title", "og:description", "og:image", "og:url", "og:type"]) exige("meta " + k, new RegExp("<meta property=\"" + k + "\" content=\"[^\"]+\"").test(html));
  exige("og:image absoluto (og-sgo-mandu.png, 1200x630)", /property="og:image" content="https:\/\/mandu-apps\.lp\.agentesamanda\.com\/gestao-operacional\/og-sgo-mandu\.png"/.test(html) && /property="og:image:width" content="1200"/.test(html) && /property="og:image:height" content="630"/.test(html));
  exige("manifest name = Sistema de Gestão Operacional", man.name === "Sistema de Gestão Operacional");
  exige("manifest short_name = SGO Mandū", man.short_name === "SGO Mandū");
  if (falta.length) { console.error("🔴 faltam nome/meta tags: " + falta.join("; ")); process.exit(1); }
  console.log("✓ nome do app e meta tags (title, description, og:*, apple-mobile-web-app-title, theme-color, manifest name/short_name) presentes");
' "$PASTA"

if [[ -n "$STAGE_ARG" ]]; then echo "✅ pasta montada em $PASTA (sem ZIP)"; exit 0; fi

SAIDA="$SAIDA_DIR/gestao-operacional-$(date +%Y%m%d-%H%M).zip"
mkdir -p "$SAIDA_DIR"
rm -f "$SAIDA"
( cd "$PASTA" && zip -q -r -X "$SAIDA" . -x '.DS_Store' )
[[ -s "$SAIDA" ]] || { echo "🔴 o ZIP não foi gerado"; exit 1; }
# conferência de dentro do ZIP
for f in $OBRIGATORIOS $ICONES; do
  unzip -l "$SAIDA" | awk '{print $4}' | grep -qx "$f" || { echo "🔴 o ZIP não tem $f na raiz"; exit 1; }
done
unzip -l "$SAIDA"
echo "✅ $SAIDA ($(du -h "$SAIDA" | cut -f1)) — suba na plataforma; endereço: https://mandu-apps.lp.agentesamanda.com/gestao-operacional/"
