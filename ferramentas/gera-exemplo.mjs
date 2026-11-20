// Gera o exemplo fictício: exemplo/decisoes.csv, exemplo/livro-de-codigos.csv, exemplo/campos.csv,
// exemplo/textos/*.txt e js/exemplo.js (o mesmo conteúdo embutido, para abrir sem servidor).
// Todas as decisões, nomes e números são inventados. Uso: node ferramentas/gera-exemplo.mjs
import {writeFileSync,mkdirSync,rmSync} from "node:fs";
import {dirname,join} from "node:path";
import {fileURLToPath} from "node:url";
const raiz=join(dirname(fileURLToPath(import.meta.url)),"..");

const ORGAOS=["1ª Turma Criminal","2ª Turma Criminal","3ª Turma Criminal"];
const CASOS=[
 // id, data, órgão, classe, valor, reincidente, resultado, prévia, fundamentos prévios, cenário
 ["1001","2021-02-11",0,"Apelação Criminal",42.9,"não","Provido","APL","","aplica"],
 ["1002","2021-04-22",1,"Apelação Criminal",310,"sim","Desprovido","AFA","reincidência","afasta_reinc"],
 ["1003","2021-06-17",2,"Habeas Corpus",18.5,"não","Concedida a ordem","APL","","aplica"],
 ["1004","2021-09-02",0,"Apelação Criminal",1250,"não","Desprovido","AFA","valor não ínfimo","afasta_valor"],
 ["1005","2021-11-25",1,"Apelação Criminal",65,"sim","Parcialmente provido","AFA","reincidência; habitualidade","parcial"],
 ["1006","2022-02-10",2,"Apelação Criminal",27,"não","Provido","APL","","aplica"],
 ["1007","2022-03-31",0,"Recurso em Sentido Estrito",90,"não","Desprovido","NAO","","menciona"],
 ["1008","2022-05-19",1,"Apelação Criminal",480,"sim","Desprovido","AFA","reincidência; qualificadora","afasta_qualif"],
 ["1009","2022-08-04",2,"Apelação Criminal",12,"não","Provido","APL","","aplica"],
 ["1010","2022-09-29",0,"Habeas Corpus",150,"sim","Denegada a ordem","AFA","habitualidade","afasta_reinc"],
 ["1011","2022-12-15",1,"Apelação Criminal",33.4,"não","Provido","APL","","aplica"],
 ["1012","2023-03-09",2,"Apelação Criminal",2100,"não","Desprovido","AFA","valor não ínfimo","afasta_valor"],
 ["1013","2023-05-25",0,"Apelação Criminal",58,"sim","Provido","APL","","aplica_reinc"],
 ["1014","2023-08-17",1,"Agravo em Execução Penal",0,"não","Desprovido","EXC","","fora"],
 ["1015","2023-10-26",2,"Apelação Criminal",76,"não","Parcialmente provido","NAO","","menciona"],
 ["1016","2024-02-08",0,"Apelação Criminal",22,"sim","Desprovido","AFA","reincidência","afasta_reinc"],
 ["1017","2024-04-18",1,"Apelação Criminal",640,"não","Desprovido","AFA","valor não ínfimo; qualificadora","afasta_qualif"],
 ["1018","2024-06-27",2,"Habeas Corpus",19.9,"não","Concedida a ordem","APL","","aplica"]];
const OBJ=["dois desodorantes","uma peça de picanha","três barras de chocolate","um aparelho de barbear","um pacote de fraldas","duas latas de leite em pó","um par de chinelos","uma garrafa de azeite","um carregador de celular","quatro sabonetes","um botijão de gás","uma bicicleta usada","uma furadeira","um relógio de pulso"];
const fmt=v=>v.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const br=d=>d.slice(8,10)+"/"+d.slice(5,7)+"/"+d.slice(0,4);
function texto(c,i){
  const [id,data,o,classe,valor,reinc,res,,fund,cen]=c;
  const obj=OBJ[i%OBJ.length],proc=`0700${id}-${10+i}.${data.slice(0,4)}.8.99.0001`;
  const cab=`DECISÃO FICTÍCIA, CRIADA PARA DEMONSTRAR O PAINEL. NÃO CORRESPONDE A PROCESSO REAL.

TRIBUNAL DE JUSTIÇA DO ESTADO IMAGINÁRIO
${ORGAOS[o]}
${classe} nº ${proc}
Relator: Desembargador Fictício ${String.fromCharCode(65+o)}
Julgado em ${br(data)}

EMENTA
`;
  const ementas={
    aplica:`PENAL. FURTO SIMPLES. PRINCÍPIO DA INSIGNIFICÂNCIA. VALOR ÍNFIMO. RÉU PRIMÁRIO. ATIPICIDADE MATERIAL. ABSOLVIÇÃO. 1. Presentes a mínima ofensividade da conduta, a ausência de periculosidade social da ação, o reduzido grau de reprovabilidade do comportamento e a inexpressividade da lesão jurídica, aplica-se o princípio da insignificância (HC 84.412, STF). 2. Recurso provido.`,
    aplica_reinc:`PENAL. FURTO. PRINCÍPIO DA INSIGNIFICÂNCIA. REINCIDÊNCIA QUE, POR SI SÓ, NÃO AFASTA A BAGATELA. VALOR ÍNFIMO. ABSOLVIÇÃO. Recurso provido.`,
    afasta_reinc:`PENAL. FURTO. PRINCÍPIO DA INSIGNIFICÂNCIA. INAPLICABILIDADE. REINCIDÊNCIA ESPECÍFICA. HABITUALIDADE DELITIVA. Recurso desprovido.`,
    afasta_valor:`PENAL. FURTO. PRINCÍPIO DA INSIGNIFICÂNCIA. VALOR DA RES FURTIVA SUPERIOR A DEZ POR CENTO DO SALÁRIO MÍNIMO. LESÃO RELEVANTE. Recurso desprovido.`,
    afasta_qualif:`PENAL. FURTO QUALIFICADO. ROMPIMENTO DE OBSTÁCULO. PRINCÍPIO DA INSIGNIFICÂNCIA AFASTADO. MAIOR REPROVABILIDADE. Recurso desprovido.`,
    parcial:`PENAL. FURTO. BAGATELA AFASTADA EM RAZÃO DA REITERAÇÃO. DOSIMETRIA. REDUÇÃO DA PENA-BASE. Recurso parcialmente provido.`,
    menciona:`PROCESSO PENAL. ${classe.toUpperCase()}. NULIDADE NÃO DEMONSTRADA. TESE DE INSIGNIFICÂNCIA NÃO CONHECIDA POR SUPRESSÃO DE INSTÂNCIA. Recurso desprovido.`,
    fora:`EXECUÇÃO PENAL. PROGRESSÃO DE REGIME. REQUISITO SUBJETIVO. FALTA GRAVE RECENTE. Agravo desprovido.`};
  const corpo={
    aplica:`O réu foi condenado pela subtração de ${obj}, avaliados em ${fmt(valor)}, restituídos à vítima logo após o fato. A defesa pede a absolvição com base no princípio da insignificância.

O pedido procede. O valor dos bens é ínfimo, inferior a dez por cento do salário mínimo vigente, e não houve prejuízo, pois os objetos foram devolvidos. O réu é primário e não registra outros procedimentos. A conduta não revela periculosidade social nem grau de reprovabilidade que justifique a intervenção penal, que deve ser a ultima ratio.

Conforme assentado pelo Supremo Tribunal Federal no HC 84.412, a aplicação da bagatela exige a mínima ofensividade da conduta, a nenhuma periculosidade social da ação, o reduzidíssimo grau de reprovabilidade do comportamento e a inexpressividade da lesão jurídica provocada. Todos os vetores estão presentes. A lesão ao patrimônio é irrelevante para o direito penal, de modo que o fato é materialmente atípico.`,
    aplica_reinc:`O apelante subtraiu ${obj}, avaliados em ${fmt(valor)}. Consta reincidência por crime de natureza diversa.

A reincidência, por si só, não impede o reconhecimento da insignificância, devendo ser examinadas as circunstâncias do caso concreto. Aqui, o valor é ínfimo, o bem foi restituído e a condenação anterior não guarda relação com o patrimônio. Aplica-se, assim, o princípio da bagatela, na linha do que decidiu o Supremo Tribunal Federal no HC 84.412, reconhecendo-se a atipicidade material.`,
    afasta_reinc:`O apelante foi surpreendido com ${obj}, avaliados em ${fmt(valor)}. A defesa sustenta a aplicação do princípio da insignificância.

A tese não prospera. Embora o valor seja reduzido, o réu é reincidente específico e responde a outras ações por furto, o que evidencia habitualidade delitiva. A reiteração afasta o reduzido grau de reprovabilidade exigido para a bagatela, sob pena de se estimular a prática de pequenos delitos. Mantém-se a condenação, com regime e pena fixados na sentença.`,
    afasta_valor:`O réu subtraiu ${obj}, avaliados em ${fmt(valor)}. A defesa invoca a insignificância.

O valor supera em muito o parâmetro de dez por cento do salário mínimo adotado como referência, o que demonstra lesão relevante ao patrimônio da vítima. Não se trata de valor ínfimo, e a mínima ofensividade não está presente. Rejeita-se o pedido de absolvição. Incide o art. 155 do Código Penal, mantida a condenação.`,
    afasta_qualif:`Os réus subtraíram ${obj}, avaliados em ${fmt(valor)}, mediante rompimento de obstáculo. Pede-se o reconhecimento da insignificância.

A qualificadora revela maior reprovabilidade da conduta e periculosidade incompatível com o princípio da insignificância. O modo de execução afasta a mínima ofensividade, ainda que o valor não seja expressivo. Mantém-se a condenação pelo furto qualificado.`,
    parcial:`O apelante subtraiu ${obj}, avaliados em ${fmt(valor)}. Responde a outros dois processos por fatos semelhantes.

A reiteração delitiva impede o reconhecimento da bagatela. O pedido subsidiário, porém, merece acolhida: a pena-base foi exasperada com fundamento genérico, que deve ser decotado. Recurso parcialmente provido para reduzir a pena.`,
    menciona:`O recorrente alega nulidade da instrução e, em memoriais, a aplicação do princípio da insignificância.

A nulidade não foi demonstrada, pois não houve prejuízo à defesa. Quanto à insignificância, a matéria não foi examinada na origem, e o seu enfrentamento aqui configuraria supressão de instância. Nego provimento.`,
    fora:`O agravante pede a progressão ao regime semiaberto. O juízo da execução indeferiu o pedido em razão de falta grave cometida há menos de um ano.

A decisão está fundamentada e não merece reparo. O requisito subjetivo não foi preenchido. Agravo desprovido.`};
  return `${cab}${ementas[cen]}

ACÓRDÃO
Acordam os integrantes da ${ORGAOS[o]}, ${classe==="Habeas Corpus"?(res.startsWith("Denegada")?"em denegar a ordem":"em conceder a ordem"):res==="Desprovido"?"em negar provimento ao recurso":res==="Parcialmente provido"?"em dar parcial provimento ao recurso":"em dar provimento ao recurso"}, nos termos do voto do relator, à unanimidade.

RELATÓRIO
Trata-se de ${classe.toLowerCase()} ${classe==="Habeas Corpus"?"impetrado contra ato do juízo de primeiro grau":"contra decisão de primeiro grau"}. ${corpo[cen].split("\n\n")[0]}

VOTO
${corpo[cen].split("\n\n").slice(1).join("\n\n")}

DISPOSITIVO
${res}.
`;
}
const q=v=>{v=String(v??"");return /[;"\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v};
const cab=["id","processo","data_julgamento","orgao_julgador","classe","valor_res","reincidente","resultado","codigo_previo","fundamentos_previos"];
const linhas=CASOS.map((c,i)=>[c[0],`0700${c[0]}-${10+i}.${c[1].slice(0,4)}.8.99.0001`,br(c[1]),ORGAOS[c[2]],c[3],String(c[4]).replace(".",","),c[5],c[6],c[7],c[8]]);
const planilha=[cab,...linhas].map(l=>l.map(q).join(";")).join("\n")+"\n";
const textos={};CASOS.forEach((c,i)=>{if(c[0]!=="1014")textos[c[0]]=texto(c,i)});/* a 1014 fica sem TXT, para mostrar o aviso */
const livro=`APL | Aplica a insignificância | A decisão reconhece a bagatela e absolve ou tranca a ação
AFA | Afasta a insignificância | A decisão enfrenta a tese e a rejeita
NAO | Menciona sem decidir | O tema aparece, mas não é decidido (supressão de instância, não conhecimento)
EXC | Fora do tema | A busca recuperou a decisão, mas ela não trata de insignificância`;
const campos=`Fundamentos para afastar | múltipla | reincidência; habitualidade; valor não ínfimo; qualificadora; outro | fundamentos_previos
Resultado para o réu | única | favorável; desfavorável; parcial
Cita o HC 84.412 | sim/não
Síntese | texto`;
const E={nome:"Exemplo fictício: insignificância no furto",descricao:"Dezoito decisões inventadas de um tribunal imaginário, para conhecer o painel. Nenhum dado é real.",
  planilha,textos,termos:["insignificância","bagatela","valor ínfimo","mínima ofensividade"],normas:["HC 84.412","art. 155","Súmula 599"],
  livro,campos,marcos:"01/07/2022 | marco fictício",revisores:["Ana","Bruno"]};

rmSync(join(raiz,"exemplo"),{recursive:true,force:true});
mkdirSync(join(raiz,"exemplo","textos"),{recursive:true});
writeFileSync(join(raiz,"exemplo","decisoes.csv"),"﻿"+planilha);
writeFileSync(join(raiz,"exemplo","livro-de-codigos.csv"),"﻿codigo;rotulo;descricao\n"+livro.split("\n").map(l=>l.split(" | ").map(q).join(";")).join("\n")+"\n");
writeFileSync(join(raiz,"exemplo","campos.csv"),"﻿campo;tipo;opcoes;sugestao\n"+campos.split("\n").map(l=>{const p=l.split(" | ");while(p.length<4)p.push("");return p.map(q).join(";")}).join("\n")+"\n");
writeFileSync(join(raiz,"exemplo","termos-de-busca.txt"),E.termos.join("\n")+"\n");
for(const [id,t] of Object.entries(textos))writeFileSync(join(raiz,"exemplo","textos",id+".txt"),t);
writeFileSync(join(raiz,"js","exemplo.js"),"\"use strict\";\n/* Gerado por ferramentas/gera-exemplo.mjs. Dados inventados. */\nwindow.EXEMPLO="+JSON.stringify(E)+";\n");
console.log(`exemplo: ${CASOS.length} decisões, ${Object.keys(textos).length} textos`);
