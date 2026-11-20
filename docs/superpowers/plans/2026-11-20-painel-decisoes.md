# Painel de Jurimetria: plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Painel estático, aberto no GitHub, que leva a mesa de leitura PSR para qualquer pesquisa com decisões judiciais, com dados só no navegador.

**Architecture:** Scripts clássicos sobre um estado global `S`, divididos por responsabilidade; IndexedDB para projetos e textos; importação por SheetJS e fflate vendorizados; testes de navegador com Playwright sobre o exemplo fictício.

**Tech Stack:** HTML, CSS, JavaScript sem compilação; SheetJS 0.18.5; fflate 0.8.2; Playwright (já instalado) para testes.

**Spec:** `docs/superpowers/specs/2026-11-20-painel-decisoes-design.md`

## Global Constraints

- Nenhuma requisição de rede além dos arquivos do próprio site (sem CDN, sem fontes externas obrigatórias).
- Abrir por `file://` e por GitHub Pages: nada de `type="module"` nem `fetch` obrigatório de arquivos locais.
- Textos só em `.txt` (UTF-8; tentar Windows-1252 quando o UTF-8 trouxer caracteres de substituição), nome do arquivo = identificador.
- Interface em português do Brasil; datas 10/11/2026; números 1.500,75.

## Review Focus

- Planilha com separador `;` e BOM, cabeçalhos com acento e espaços: detecção automática do separador e colunas reconhecidas pelo nome. Teste: `importa CSV com ponto e vírgula e BOM`.
- Datas em formatos variados (`10/11/2026`, `2026-11-10`, número serial do Excel): normalizar para ISO; data inválida vira vazio, sem quebrar a série. Teste: `normaliza datas`.
- TXT sem linha correspondente e linha sem TXT: contagem no relatório de importação, decisão marcada "sem texto". Teste no fluxo de importação do exemplo com um arquivo a mais.
- Termos de busca com acento ou curinga (`insignific*`, `bagatela`): marca-texto ignora acento e caixa. Teste: `realça termos sem acento`.
- Junção de arquivos de codificação com registros mais novos dos dois lados: vence o `t` maior por caso; importar duas vezes não duplica nada. Teste: `junta codificações por carimbo`.

---

### Task 1: Base do site, armazenamento e utilidades

**Files:** Create `index.html`, `css/painel.css` (CSS da mesa original, sem a parte de Grupos), `js/util.js`, `js/armazem.js`, `vendor/xlsx.full.min.js`, `vendor/fflate.min.js`, `tests/navegador.mjs`, `package.json`.

**Interfaces — Produces:** `esc, dataBR, nfmt, lsGet, lsSet, normData(v) -> "AAAA-MM-DD"|"", rxTermos(lista) -> RegExp|null, salvaArq(nome, dados)`; `Armazem.lista() -> [{id,nome,n,atualizado}]`, `Armazem.abre(id) -> projeto`, `Armazem.grava(projeto)`, `Armazem.textos(id) -> Map`, `Armazem.gravaTextos(id, Map)`, `Armazem.apaga(id)`.

- [ ] Teste `normaliza datas`: `normData("10/11/2026")==="2026-11-10"`, `normData(46336)` vira ISO, `normData("x")===""`.
- [ ] Teste `realça termos sem acento`: `rxTermos(["insignific*"])` casa "insignificância" e "INSIGNIFICANCIA".
- [ ] Implementar e rodar `node tests/navegador.mjs`.

### Task 2: Importação e configuração do projeto

**Files:** Create `js/importa.js`, `js/projeto.js` (telas Início, Novo projeto, Configuração).

**Interfaces — Produces:** `lePlanilha(File) -> {linhas, abas}`, `adivinhaColunas(cabecalho) -> mapa`, `montaProjeto({linhas, mapa, livro, campos, termos, ...}) -> projeto`, `leTextos(FileList|zip) -> Map<id,texto>`, `relatorioTextos(casos, textos) -> {casados, semTexto, sobrando}`.

- [ ] Teste `importa CSV com ponto e vírgula e BOM`.
- [ ] Teste: abas `codigos` e `campos` de XLSX viram livro e campos.
- [ ] Implementar telas e rodar os testes.

### Task 3: Leitura, ficha, tabela, progresso (porte da mesa)

**Files:** Create `js/leitura.js`, `js/ficha.js`, `js/tabela.js`, `js/progresso.js`, `js/app.js` (rotas, estado, teclado).

- [ ] Teste: abrir o exemplo, ver a primeira decisão com termos realçados, marcar código pelo teclado `1`, avançar com `J`, ver contagem no Progresso.

### Task 4: Dupla revisão por arquivos

**Files:** Create `js/troca.js`.

**Interfaces — Produces:** `juntaCodificacoes(proj, arquivo) -> {novos, atualizados}`, `exportaCodificacao(proj)`, `exportaPacote(proj)`, `importaPacote(zip)`.

- [ ] Teste `junta codificações por carimbo` (dois lados mais novos; repetição idempotente).

### Task 5: Análises

**Files:** Create `js/estat.js` (ST, indep, monteCarlo, kappaFull), `js/analises.js` (associação, série, concordância, KWIC, vocabulário, colocações), `js/analises-discurso.js` (rede, pacotes, dicionários, padrões).

- [ ] Teste: associação de duas variáveis do exemplo devolve qui-quadrado finito; KWIC de "bagatela" encontra ocorrências.

### Task 6: Exemplo fictício, README e publicação

**Files:** Create `exemplo/decisoes.csv`, `exemplo/textos/*.txt`, `exemplo/livro.csv`, `js/exemplo.js` (gerado), `ferramentas/gera-exemplo.mjs`, `README.md`, `.github/workflows/pages.yml`, `LICENSE`.

- [ ] Rodar o gerador, os testes de navegador e conferir telas em 1280 px e 375 px.
