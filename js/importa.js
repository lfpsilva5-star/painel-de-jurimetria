"use strict";
/* Importação: planilha (CSV ou XLSX), textos em TXT (arquivos soltos, pasta ou ZIP), livro de códigos e campos da ficha. */

/* CSV: detecta o separador (; , tab) pela primeira linha e respeita aspas */
function parseCSV(txt){
  txt=String(txt).replace(/^﻿/,"");
  const prim=txt.slice(0,txt.search(/\r?\n/)>0?txt.search(/\r?\n/):txt.length);
  const conta=ch=>{let n=0,q=false;for(const c of prim){if(c==='"')q=!q;else if(c===ch&&!q)n++}return n};
  const sep=[";",",","\t"].map(c=>[c,conta(c)]).sort((a,b)=>b[1]-a[1])[0][0];
  const L=[];let lin=[],cel="",q=false;
  for(let i=0;i<txt.length;i++){const c=txt[i];
    if(q){if(c==='"'){if(txt[i+1]==='"'){cel+='"';i++}else q=false}else cel+=c;continue}
    if(c==='"'){q=true;continue}
    if(c===sep){lin.push(cel);cel="";continue}
    if(c==="\n"||c==="\r"){if(c==="\r"&&txt[i+1]==="\n")i++;lin.push(cel);cel="";if(lin.some(x=>x.trim()!==""))L.push(lin);lin=[];continue}
    cel+=c}
  lin.push(cel);if(lin.some(x=>x.trim()!==""))L.push(lin);
  return L;
}
/* tabela (matriz) -> {cab, linhas:[{col:valor}]} */
function matrizParaLinhas(M){
  if(!M.length)return {cab:[],linhas:[]};
  const vistos=new Map();
  const cab=M[0].map((h,i)=>{let n=String(h??"").trim()||"coluna "+(i+1);const k=vistos.get(n)||0;vistos.set(n,k+1);return k?n+" ("+(k+1)+")":n});
  const linhas=M.slice(1).map(l=>{const o={};cab.forEach((h,i)=>{const v=l[i];o[h]=v instanceof Date?v:v==null?"":typeof v==="number"?v:String(v).trim()});return o});
  return {cab,linhas};
}
const nomeAba=s=>semAcento(String(s).toLowerCase()).replace(/[^a-z]/g,"");
/* lê a planilha: CSV ou XLSX/XLS/ODS. Abas chamadas "codigos"/"livro" e "campos" alimentam o livro de códigos e a ficha. */
async function lePlanilha(arq){
  const nome=arq.name||"planilha";
  if(/\.(csv|txt|tsv)$/i.test(nome)){
    const buf=await leArquivo(arq,"bin");return {...matrizParaLinhas(parseCSV(decodifica(buf))),abas:{},nome};
  }
  if(!window.XLSX)throw new Error("O leitor de XLSX não carregou. Salve a planilha como CSV.");
  const buf=await leArquivo(arq,"bin");
  const wb=XLSX.read(buf,{type:"array",cellDates:true});
  const abas={};let principal=null;
  for(const sn of wb.SheetNames){
    const M=XLSX.utils.sheet_to_json(wb.Sheets[sn],{header:1,raw:true,defval:""});
    const k=nomeAba(sn);
    if(["codigos","livro","livrodecodigos","codigo"].includes(k))abas.codigos=matrizParaLinhas(M);
    else if(["campos","ficha","variaveis"].includes(k))abas.campos=matrizParaLinhas(M);
    else if(!principal)principal=M;
  }
  if(!principal)throw new Error("A planilha não tem uma aba com as decisões.");
  return {...matrizParaLinhas(principal),abas,nome};
}

/* sugere o papel de cada coluna pelo nome */
const PAPEIS_COL=[
  ["id","Identificador da decisão (nome do arquivo TXT)",/^(id|identificador|n|no|numero|codigo|cod|chave|acordao|decisao|sequencial)$|^(id|identificador)[_ ]|numero.*(acordao|decisao)/],
  ["proc","Número do processo",/processo|cnj|autos/],
  ["data","Data do julgamento",/data|julgamento|julgado|dt/],
  ["orgao","Órgão julgador",/orgao|turma|camara|relator|vara|colegiado/],
  ["classe","Classe processual",/classe|tipo.?de.?acao|recurso/],
  ["link","Link para a decisão",/link|url|endereco|inteiro.?teor/],
  ["sug","Codificação prévia (aparece como sugestão)",/sugest|previ|pre.?codif|automatic|codigo.?(final|auto)|classific|categoria/]];
function adivinhaColunas(cab,linhas){
  const m={};const usada=new Set();
  const n=c=>semAcento(String(c).toLowerCase()).replace(/[^a-z0-9]+/g," ").trim();
  for(const [k,,rx] of PAPEIS_COL){
    const c=cab.find(h=>!usada.has(h)&&rx.test(n(h).replace(/ /g,"")))||cab.find(h=>!usada.has(h)&&rx.test(n(h)));
    if(c){m[k]=c;usada.add(c)}
  }
  if(!m.id){const c=cab.find(h=>{const vs=linhas.map(l=>String(l[h]??"").trim()).filter(Boolean);return vs.length===linhas.length&&new Set(vs).size===vs.length});if(c)m.id=c}
  if(m.data){const ok=linhas.slice(0,50).filter(l=>normData(l[m.data])).length;if(!ok)delete m.data}
  return m;
}
/* colunas restantes: tipo sugerido para as análises */
function tiposExtras(cab,linhas,mapa){
  const usadas=new Set(Object.values(mapa).filter(Boolean));
  return cab.filter(h=>!usadas.has(h)).map(h=>{
    const vs=linhas.map(l=>l[h]).filter(v=>v!==""&&v!=null);const dist=new Set(vs.map(String));
    const num=vs.length&&vs.every(v=>typeof v==="number"||/^-?\d+([.,]\d+)?$/.test(String(v).trim()));
    const longo=vs.some(v=>String(v).length>120);
    let tipo="texto";if(num&&dist.size>12)tipo="num";else if(dist.size>=2&&dist.size<=60&&!longo)tipo="cat";else if(num)tipo="num";
    return {col:h,rot:h,tipo};
  });
}

/* livro de códigos: linhas "COD | rótulo | descrição" ou aba com colunas codigo, rotulo, descricao */
function livroDeTexto(t){return linhas(t).map(partes).filter(p=>p[0]).map(p=>({cod:p[0],rot:p[1]||p[0],desc:p[2]||p[1]||""}))}
function livroParaTexto(L){return (L||[]).map(x=>(x.desc?[x.cod,x.rot,x.desc]:x.rot&&x.rot!==x.cod?[x.cod,x.rot]:[x.cod]).join(" | ")).join("\n")}
function livroDeAba(a){
  const col=re=>a.cab.find(h=>re.test(nomeAba(h)));
  const c=col(/^cod/)||a.cab[0],r=col(/^rot|^nome|^categoria/),d=col(/^desc|^defin|^criterio/);
  return a.linhas.map(l=>({cod:String(l[c]??"").trim(),rot:String(l[r]??l[c]??"").trim(),desc:String(l[d]??"").trim()})).filter(x=>x.cod);
}
/* campos: "rótulo | tipo | opção; opção | coluna de sugestão" */
const TIPOS_CAMPO={unica:"única",multipla:"múltipla",simnao:"sim/não",texto:"texto"};
function tipoCampo(s){const k=semAcento(String(s||"").toLowerCase()).replace(/[^a-z]/g,"");
  if(/^(multipla|varias|multi|multiplaescolha)/.test(k))return "multipla";if(/^(simnao|sn|booleano|binario)/.test(k))return "simnao";
  if(/^(texto|livre|aberto|nota)/.test(k))return "texto";return "unica"}
const idCampo=(rot,i)=>"f_"+(nomeArq(rot).toLowerCase().slice(0,24)||i);
function camposDeTexto(t){const vistos=new Set();return linhas(t).map(partes).filter(p=>p[0]).map((p,i)=>{let id=idCampo(p[0],i);while(vistos.has(id))id+="_";vistos.add(id);
  const tipo=tipoCampo(p[1]);return {id,rot:p[0],tipo,opcoes:tipo==="unica"||tipo==="multipla"?String(p[2]||"").split(";").map(s=>s.trim()).filter(Boolean):[],sug:p[3]||""}})}
function camposParaTexto(C){return (C||[]).map(c=>[c.rot,TIPOS_CAMPO[c.tipo],c.opcoes.join("; "),c.sug||""].join(" | ").replace(/( \| )+$/,"")).join("\n")}
function camposDeAba(a){
  const col=re=>a.cab.find(h=>re.test(nomeAba(h)));
  const r=col(/^(campo|rot|nome|variavel)/)||a.cab[0],t=col(/^tipo/),o=col(/^(opc|valor|categ)/),s=col(/^(sug|coluna)/);
  return camposDeTexto(a.linhas.map(l=>[l[r],l[t]||"",l[o]||"",l[s]||""].map(v=>String(v??"").replace(/\|/g,"/")).join(" | ")).join("\n"));
}
function marcosDeTexto(t){return linhas(t).map(partes).map(p=>({data:normData(p[0]),rot:p[1]||dataBR(normData(p[0]))})).filter(m=>m.data).sort((a,b)=>a.data.localeCompare(b.data))}
const marcosParaTexto=M=>(M||[]).map(m=>dataBR(m.data)+" | "+m.rot).join("\n");

/* textos: arquivos .txt soltos, de uma pasta, ou dentro de .zip */
async function leTextos(arquivos,prog=()=>{}){
  const m=new Map();const ignorados=[];let i=0;
  for(const f of arquivos){
    i++;if(i%200===0){prog(`Lendo ${nfmt(i)} de ${nfmt(arquivos.length)} arquivos…`);await pausa(0)}
    const nome=(f.webkitRelativePath||f.name||"").split("/").pop();
    if(/\.zip$/i.test(nome)){
      if(!window.fflate)throw new Error("O leitor de ZIP não carregou.");
      const z=fflate.unzipSync(new Uint8Array(await leArquivo(f,"bin")));
      for(const [caminho,dados] of Object.entries(z)){const n=caminho.split("/").pop();if(!n||n.startsWith("."))continue;
        if(/\.txt$/i.test(n))m.set(n.replace(/\.txt$/i,""),decodifica(dados));else if(!caminho.endsWith("/"))ignorados.push(n)}
    }else if(/\.txt$/i.test(nome))m.set(nome.replace(/\.txt$/i,""),decodifica(await leArquivo(f,"bin")));
    else if(nome&&!nome.startsWith("."))ignorados.push(nome);
  }
  return {mapa:m,ignorados};
}
/* casa os nomes dos arquivos com os identificadores; devolve Map<id da planilha, texto> e o relatório */
function casaTextos(casos,mapaArq){
  const porChave=new Map(casos.map(c=>[chaveId(c.id),c.id]));
  const casados=new Map(),sobrando=[];
  for(const [nome,t] of mapaArq){const id=porChave.get(chaveId(nome));if(id!=null)casados.set(id,t.normalize("NFC"));else sobrando.push(nome)}
  const semTexto=casos.filter(c=>!casados.has(c.id)).map(c=>c.id);
  return {casados,sobrando,semTexto};
}

/* monta o projeto a partir da planilha lida e das escolhas do formulário */
function montaCasos(linhas,mapa,extras){
  const vistos=new Set(),repetidos=[],semId=[];
  const casos=[];
  linhas.forEach((l,i)=>{
    const id=String(l[mapa.id]??"").trim();
    if(!id){semId.push(i+2);return}
    if(vistos.has(id)){repetidos.push(id);return}
    vistos.add(id);
    const x={};extras.forEach(e=>{let v=l[e.col];if(v instanceof Date)v=normData(v);x[e.col]=v==null?"":String(v).trim()});
    const val=k=>mapa[k]?String(l[mapa[k]]??"").trim():"";
    casos.push({id,proc:val("proc"),data:mapa.data?normData(l[mapa.data]):"",orgao:val("orgao"),classe:val("classe"),link:val("link"),sug:val("sug"),x,ordem:casos.length,tx:false});
  });
  return {casos,repetidos,semId};
}
