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

Todos **RGBA com fundo transparente**, gerados a partir do glifo oficial `icone-mandu-05`
(razão 182/246 ≈ 0,7398), que é o mesmo que a barra de cima do app desenha.
