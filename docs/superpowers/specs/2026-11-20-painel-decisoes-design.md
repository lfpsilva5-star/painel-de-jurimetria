# Painel de Jurimetria: desenho

## Intenção

Transformar a "Mesa de leitura PSR" (artefato do Claude, corpus fixo de acórdãos do TJDFT sobre população em situação de rua) numa ferramenta aberta para quem pesquisa decisões judiciais. Cada pesquisador sobe a planilha da própria coleta e os textos das decisões, configura as variáveis da pesquisa e opera o painel como a mesa original: fila de leitura, folha com marca-texto, ficha de codificação, dupla revisão com consenso, tabela, progresso e análises.

O código fica público no repositório `painel-de-jurimetria`.

## Objetivos

- Projeto configurável: termos de busca da coleta (marca-texto), normas e precedentes de interesse (destaque verde), livro de códigos, campos da ficha, colunas da planilha, nomes dos revisores, marcos temporais.
- Entrada: planilha CSV ou XLSX; textos obrigatoriamente em TXT, um arquivo por decisão, com o nome igual ao identificador da linha (`12345.txt`). Seleção de vários arquivos, de uma pasta ou de um ZIP.
- Livro de códigos e campos podem vir de abas da própria planilha (`codigos`, `campos`) ou de um editor no painel.
- Uma coluna da planilha com codificação prévia (manual ou automática) aparece como sugestão na ficha.
- Dupla revisão sem servidor: cada revisor trabalha no próprio navegador, exporta um arquivo de codificação e importa o do colega; o painel junta, aponta divergências, calcula kappa e registra consenso.
- Análises portadas da mesa original: associação, série no tempo, concordância, palavras em contexto, vocabulário, colocações, rede de colocações, pacotes lexicais, dicionários e padrões por expressão regular.
- Exemplo pequeno e fictício para quem chega ver o fluxo.

## Não objetivos

- Servidor, contas ou gravação em tempo real entre revisores (caminho B, fica para depois).
- Extração de texto de PDF ou OCR.
- Perfil sintático (dependia de análise com spaCy fora do navegador) e aba Grupos (específica da pesquisa PSR).

## Antiobjetivos

- Dados da pesquisa saindo da máquina do pesquisador. Nada é enviado a servidor; bibliotecas ficam no repositório, sem CDN.
- Publicar o corpus PSR ou as codificações da equipe original.
- Exigir etapa de compilação para usar ou publicar: a página precisa abrir pelo GitHub Pages e também com duplo clique no `index.html`.

## Abordagens consideradas

- **A. Tudo no navegador, com arquivo de projeto** (escolhida). Sem custo nem cadastro, dados locais; dupla revisão por troca de arquivos.
- **B. Navegador mais base em nuvem do grupo** (Supabase ou Firebase). Tempo real, mas exige configuração técnica e põe dados em terceiros.
- **C. Repositório como modelo de artefato do Claude.** Restringe o uso a quem tem conta no Claude.

O pesquisador escolheu A "por enquanto". A camada de armazenamento fica isolada (`js/armazem.js`) para que B, ou a base compartilhada do Claude, possa entrar depois.

## Arquitetura (decisões do construtor)

- Site estático na raiz do repositório: `index.html`, `css/painel.css`, `js/*.js` como scripts clássicos (não módulos, para funcionar em `file://`), `vendor/` com SheetJS (xlsx, Apache-2.0) e fflate (ZIP, MIT).
- Armazenamento em IndexedDB: um registro por projeto (configuração, linhas, codificações) e um repositório separado para os textos.
- Modelo do projeto:
  - `config`: nome, descrição, termos, normas, marcos `[{data, rotulo}]`, mapeamento de colunas (`id`, `processo`, `data`, `orgao`, `classe`, `link`, `sugestao`), variáveis extras com tipo, livro `[{cod, rotulo, descricao}]`, campos `[{id, rotulo, tipo: unica|multipla|simnao|texto, opcoes, colSugestao}]`, revisores `[nome1, nome2]`.
  - `casos`: linhas normalizadas, com as colunas extras preservadas.
  - `rev`: `{1: {id: registro}, 2: {...}}`; `cons`: `{id: registro}`; cada registro com carimbo `t`.
  - Preferências do navegador: qual revisor sou neste navegador, codificação às cegas.
- Junção de codificações: por caso e por revisor, vence o registro com `t` mais recente; o consenso segue a mesma regra.
- Pacote do projeto (`.zip`): `projeto.json` (config, casos, codificações) e `textos/*.txt`. Serve para passar o projeto ao segundo revisor e como cópia de segurança.
- Arquivo de codificação (`.json`): só `rev` e `cons`, leve, para a troca frequente.
- Janelas de contexto (aba Trechos e corpus "trechos com os termos" nas análises) calculadas no navegador a partir dos termos.
- Período: derivado dos marcos temporais (antes e depois de cada marco); sem marco, a série no tempo não traz comparação antes/depois.
- Downloads por `Blob` e link; quando aberto como artefato do Claude, usa a capacidade de downloads se existir.

## Deixado ao construtor

Layout das telas de importação e configuração, textos de ajuda, limites de desempenho, detalhes do exemplo fictício.
