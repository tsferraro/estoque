# estoque · lançadora e ícones

Página pública da **Gestão de Estoque** (Camtauá · Mandū). Existe por dois motivos:

1. **O ícone da aba do app.** O web app roda dentro de um iframe em `script.google.com`,
   então `<link rel=icon>` do `index.html` **não alcança** a página de fora — quem muda o
   ícone é o `setFaviconUrl()` do Apps Script, e ele **só aceita URL pública**. Um `data:`
   URI falha em silêncio dentro do `try/catch` (medido em 17/09, R-354/R-364).
2. **O atalho na tela de início.** No iOS, abrir o `/exec` em modo standalone dá 403
   (cofre de cookies separado). A lançadora com `apple-touch-icon` resolve o ícone e abre
   o app em aba.

## Ícones

| Arquivo | Para quê |
|---|---|
| `icones/u-mandu-32.png` | favicon da aba (`setFaviconUrl`) |
| `icones/u-mandu-180.png` | `apple-touch-icon` e a marca da página |
| `icones/u-mandu-glifo.png` | o glifo puro, 62×84, sem margem |
| `icones/u-mandu-192.png`, `u-mandu-512.png` | ícones do manifesto para o Chrome do Android oferecer «Instalar» (fundo branco opaco; ampliados do glifo de 62×84, sem vetor à mão) |
| `icones/og-sgo-mandu.png` | prévia de compartilhamento (`og:image`/`twitter:image`), 1200×630 |

Todos **RGBA com fundo transparente**, gerados a partir do glifo oficial `icone-mandu-05`
(razão 182/246 ≈ 0,7398), que é o mesmo que a barra de cima do app desenha.

## Uma lançadora só (19/10/2026)

**Fonte única:** `unica/` (a página, o Service Worker, o manifesto, o leitor de QR em `vendor/`).
Endereço único: `https://mandu-apps.lp.agentesamanda.com/gestao-operacional/` (plataforma Mandū; sempre com a barra no fim).

| O quê | Onde |
|---|---|
| Gerar o ZIP para a plataforma | `scripts/gerar-zip.sh` → `<camtaua>/lancadora-zip/gestao-operacional-AAAAMMDD-HHMM.zip` (binário, fora do git) |
| Acrescentar uma organização | **Sem ZIP novo.** A lançadora não guarda lista de organizações (o repositório é público; H10-759, 27/10): a organização entra no Registro do SGO e o Porteiro a entrega a quem é dela |
| Projeto único do app (D35, c9) | cada organização tem `deploymentUnico` (o `/exec` do projeto único) + `orgApp` (o id dela no registro do projeto único) → a lançadora abre `…/exec/<orgApp>`; o `deployment` antigo fica como **reserva**. Só suba o ZIP depois que o projeto único estiver publicado. Teste: `node scripts/teste-unico.js` |
| «1SUB» nunca na tela (CON-c9 · M7) | a CHAVE do subproduto segue `1SUB-…` (planilha, QR, fila); a tela da lançadora escreve `SUB-…` (`codigoExibicao`/`textoVisivel_`, na saída de `render`, do `toast` e das faixas). Teste: `node scripts/teste-sub.js` |
| Sobra grande no Abrir pergunta (CON-c9-r2 · G3) | lote que «acaba» com sobra acima de 10 % do saldo: a tela pergunta, com os textos do app («Dar por perdidos» · «Deixar no lote» · «Voltar e ajustar o peso»), e nada vai à fila sem o toque (`sobraGrandeDoAbrir_`, `perguntarSobraSeGrandeAbrir_`, `decidirSobraAbrir_`). Teste: `node scripts/teste-sobra.js` |
| A Beta como 6ª cópia (C3 · H10-510, D77) | projeto Apps Script próprio com a organização FIXA `beta`, então o endereço é o `/exec` longo dela, SEM `deploymentUnico`/`orgApp` (constante `BETA_DEP` do `index.html`; grupo `beta`, `listada:false`). Só o modo administrador («Sou da equipe Mandū») e o aparelho que recebeu `?org=beta` (o botão Galpão/Campo da Beta) a veem, numa seção «Beta · só para a equipe testar»; o selo «Beta» fica à vista na sub-lançadora, no «Abrindo» e no Início. Teste: `node scripts/teste-beta.js` |
| Mostrar a lista em vez de entrar sozinho | `…/gestao-operacional/?lista=1` («Trocar de organização») |
| Painel do administrador | `…/gestao-operacional/?painel=administrador` (ou `?admin=1`) |
| Raiz do GitHub, `felipe/`, `offline-teste/`, `unica/` no GitHub | só levam ao endereço da Mandū (link e QR antigos não dão 404) |
| `videos/` | os vídeos do «Como usar» tocam daqui |
