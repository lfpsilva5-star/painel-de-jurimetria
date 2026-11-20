# Painel de Jurimetria

Mesa de leitura, codificação e análise para pesquisa empírica com decisões judiciais. O pesquisador sobe a planilha da própria coleta e os textos das decisões em TXT, informa os termos de busca que usou no levantamento, define o livro de códigos e os campos da ficha, e trabalha com fila de leitura, marca-texto, dupla revisão com consenso, tabela, progresso e análises estatísticas e de corpus.

Tudo roda no navegador. A planilha, os textos e as codificações ficam guardados no próprio computador (IndexedDB) e nada é enviado a servidor. As bibliotecas de leitura de XLSX e ZIP estão no repositório, sem dependência de CDN.

O painel nasceu da Mesa de leitura PSR, usada na pesquisa sobre a população em situação de rua nos acórdãos criminais do TJDFT, e foi generalizado para qualquer tema.

## Como usar

Abra o painel publicado (GitHub Pages) ou baixe o repositório e dê duplo clique em `index.html`. Na tela inicial, **Abrir o exemplo fictício** carrega dezoito decisões inventadas sobre o princípio da insignificância no furto, para conhecer o fluxo antes de subir os próprios dados.

### Preparar os dados

**Planilha** (CSV ou XLSX), com uma linha por decisão e uma coluna de identificador. As demais colunas são opcionais: processo, data do julgamento, órgão julgador, classe, link e uma coluna com codificação prévia (manual ou automática), que aparece na ficha como sugestão. O painel reconhece essas colunas pelo nome e deixa conferir. As outras colunas viram filtros na fila e variáveis nas análises. O CSV pode usar ponto e vírgula, vírgula ou tabulação.

**Textos em TXT**, um arquivo por decisão, com o nome igual ao identificador da planilha: a linha de identificador `12345` corresponde a `12345.txt`. Dá para selecionar vários arquivos, a pasta inteira ou um ZIP. Na criação do projeto, o painel informa quantas decisões ficaram sem texto e quais arquivos não casaram com nenhuma linha. Decisão sem texto continua na fila e pode ser codificada. PDF não é aceito: converta antes para TXT.

**Termos de busca**, um por linha, exatamente como usados no levantamento. São eles que o marca-texto destaca, que a navegação entre menções percorre e que delimitam os trechos usados nas análises de corpus. A busca ignora acento e maiúsculas, e `*` completa a palavra (`insignific*`).

**Livro de códigos**, um código por linha no formato `CÓDIGO | rótulo | descrição`. Num XLSX, uma aba chamada `codigos` com as colunas codigo, rotulo e descricao é lida automaticamente.

**Campos da ficha**, um por linha no formato `rótulo | tipo | opção; opção | coluna de sugestão`. Os tipos são única, múltipla, sim/não e texto. A coluna de sugestão, opcional, indica de qual coluna da planilha vem o valor sugerido. Num XLSX, a aba `campos` (colunas campo, tipo, opcoes, sugestao) é lida automaticamente.

**Marcos temporais**, opcionais, no formato `dd/mm/aaaa | rótulo`: uma lei, uma resolução, uma mudança de entendimento. Eles criam a variável Período e aparecem como linha tracejada na série no tempo.

A pasta [`exemplo/`](exemplo/) traz todos esses arquivos no formato esperado.

### Dupla revisão

Cada revisor trabalha no próprio navegador e grava numa coluna própria.

1. Quem cria o projeto baixa o **pacote do projeto** (.zip, em Projeto › Dupla revisão) e envia ao colega.
2. O colega abre o pacote na tela inicial e escolhe ser o revisor 2 no menu do canto superior direito.
3. Daí em diante, cada um baixa o próprio **arquivo de codificação** (.json, leve) e importa o do outro. A junção é feita por decisão e vale o registro mais recente; importar o mesmo arquivo duas vezes não duplica nada.

Com as duas codificações juntas, a ficha mostra a comparação e permite registrar o consenso, a fila filtra as divergências e o Progresso calcula o kappa. A codificação às cegas, ligada por padrão, esconde o código do colega até que você registre o seu.

O pacote também é a cópia de segurança: limpar os dados do navegador apaga os projetos guardados nele.

### Análises

Associação entre variáveis (qui-quadrado, Fisher, Monte Carlo, V de Cramér, resíduos ajustados), série no tempo com intervalos de Wilson e teste de Cochran-Armitage, concordância entre codificações (kappa de Cohen, alfa de Krippendorff, PABAK), palavras em contexto, vocabulário e palavras-chave (G² e Log Ratio), colocações, rede de colocações, pacotes lexicais, dicionários de modalização e padrões por expressão regular. Dicionários e padrões são editáveis e ficam guardados no projeto. Cada resultado traz uma nota metodológica e exporta tabela (.csv), figura (.svg e .png) e nota (.md).

## Publicar no GitHub Pages

Em Settings › Pages do repositório, escolha "Deploy from a branch", o branch principal e a pasta raiz (`/`). O painel fica disponível em `https://<usuário>.github.io/painel-de-jurimetria/`. Não há etapa de compilação.

## Estrutura

```
index.html            página única
css/                  estilos (painel.css vem da Mesa de leitura PSR; projeto.css cobre as telas novas)
js/util.js            formatação, datas, termos de busca, downloads
js/armazem.js         armazenamento local (IndexedDB)
js/importa.js         leitura de CSV, XLSX, TXT e ZIP; livro de códigos e campos
js/app.js             estado, gravação, filtros e rotas
js/leitura.js         fila, texto com marca-texto, trechos, teclado
js/ficha.js           ficha de codificação, comparação e consenso
js/tabela.js          tabela com colunas escolhidas e confirmação em lote
js/progresso.js       progresso, kappa e exportação da base revisada
js/troca.js           arquivo de codificação e pacote do projeto
js/projeto.js         telas de início, criação e configuração
js/estat.js           estatística
js/analises*.js       análises
js/exemplo.js         exemplo fictício embutido (gerado)
vendor/               SheetJS (Apache-2.0) e fflate (MIT)
exemplo/              exemplo fictício em arquivos
ferramentas/          gerador do exemplo
tests/navegador.mjs   testes de navegador (Playwright)
```

## Desenvolvimento

```bash
node ferramentas/gera-exemplo.mjs
```

```bash
node tests/navegador.mjs
```

Os testes abrem o `index.html` por `file://` no Chromium, conferem as funções de importação, datas, termos e junção de codificações, e percorrem o fluxo completo: exemplo, codificação pelo teclado, todas as análises, troca de arquivos entre dois revisores, criação de projeto pela interface e leitura em tela de celular.

## Licença

Código sob a [licença MIT](LICENSE): qualquer pessoa pode usar, modificar e redistribuir, desde que mantenha o aviso de autoria e de licença. As bibliotecas em `vendor/` seguem as próprias licenças, cujos textos estão na mesma pasta: SheetJS (Apache-2.0) e fflate (MIT). O exemplo fictício pode ser reutilizado livremente.
