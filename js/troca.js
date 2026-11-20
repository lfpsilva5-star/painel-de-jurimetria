"use strict";
/* Dupla revisão sem servidor: arquivo de codificação (leve, para a troca frequente) e pacote do projeto (.zip com tudo). */
const FORMATO_COD="painel-decisoes-codificacao",FORMATO_PROJ="painel-decisoes-projeto";

/* junta registros por decisão: vence o carimbo t mais recente; devolve quantos entraram */
function juntaRegistros(dest,orig,ids){
  let novos=0,atual=0;
  for(const [id,r] of Object.entries(orig||{})){
    if(!r||typeof r!=="object"||(ids&&!ids.has(id)))continue;
    const d=dest[id];
    if(!d){dest[id]=r;novos++}
    else if((r.t||0)>(d.t||0)){dest[id]=r;atual++}
  }
  return {novos,atual};
}
/* proj: {rev:{1,2}, cons}; arq: conteúdo do arquivo de codificação. Pura: não toca no estado global. */
function juntaCodificacoes(proj,arq,ids){
  if(!arq||arq.formato!==FORMATO_COD)throw new Error("Este arquivo não é um arquivo de codificação do painel.");
  const res={};
  for(const s of [1,2]){proj.rev[s]??={};res["r"+s]=juntaRegistros(proj.rev[s],arq.rev?.[s],ids)}
  res.cons=juntaRegistros(proj.cons,arq.cons,ids);
  return res;
}
function arquivoCodificacao(){
  return {formato:FORMATO_COD,versao:1,gerado:new Date().toISOString(),projeto:{id:S.proj.id,nome:S.cfg.nome},de:S.eu,revisores:S.cfg.revisores,rev:S.rev,cons:S.cons};
}
function exportaCodificacao(msg){
  return salvaArq(`${nomeArq(S.cfg.nome)}_codificacao_${nomeArq(nomeCurto(S.eu))}_${hojeISO()}.json`,JSON.stringify(arquivoCodificacao()),msg);
}
async function importaCodificacao(arq){
  const j=JSON.parse(await leArquivo(arq));
  if(j.formato===FORMATO_PROJ)throw new Error("Este é um pacote de projeto, não um arquivo de codificação. Para abri-lo, use Início › Abrir pacote.");
  const ids=new Set(S.casos.map(c=>c.id));
  const outro=j.projeto&&j.projeto.id!==S.proj.id;
  if(outro){const comuns=[...Object.keys(j.rev?.[1]||{}),...Object.keys(j.rev?.[2]||{})].filter(id=>ids.has(id)).length;
    if(!comuns)throw new Error(`O arquivo é de outro projeto (“${j.projeto.nome}”) e nenhuma decisão coincide com as deste.`);}
  const r=juntaCodificacoes(S,j,ids);
  await gravaAgoraForcado();
  return {...r,outro,nome:j.projeto?.nome,de:j.de};
}
async function gravaAgoraForcado(){S.pend=true;await gravaAgora()}

/* pacote: projeto.json + textos/<id>.txt */
async function montaPacote(p,comTextos=true){
  const arqs={"projeto.json":fflate.strToU8(JSON.stringify({formato:FORMATO_PROJ,versao:1,gerado:new Date().toISOString(),id:p.id,config:p.config,casos:p.casos,rev:p.rev,cons:p.cons}))};
  if(comTextos){const T=await Armazem.textos(p.id);for(const [id,t] of T)arqs["textos/"+encodeURIComponent(id)+".txt"]=fflate.strToU8(t)}
  return new Blob([fflate.zipSync(arqs,{level:6})],{type:"application/zip"});
}
function exportaPacote(msg){return salvaArq(`${nomeArq(S.cfg.nome)}_pacote_${hojeISO()}.zip`,(async()=>{S.proj.rev=S.rev;S.proj.cons=S.cons;return montaPacote(S.proj)})(),msg)}
/* abre um pacote; se o projeto já existe neste navegador, junta as codificações em vez de duplicar */
async function importaPacote(arq){
  const z=fflate.unzipSync(new Uint8Array(await leArquivo(arq,"bin")));
  const pj=Object.keys(z).find(k=>k.split("/").pop()==="projeto.json");
  if(!pj)throw new Error("O ZIP não tem projeto.json. Para importar textos soltos, crie um projeto novo.");
  const j=JSON.parse(fflate.strFromU8(z[pj]));
  if(j.formato!==FORMATO_PROJ)throw new Error("O projeto.json não é de um pacote do painel.");
  const T=new Map();
  for(const [k,v] of Object.entries(z)){const m=k.match(/(?:^|\/)textos\/(.+)\.txt$/i);if(m){let id;try{id=decodeURIComponent(m[1])}catch(e){id=m[1]}T.set(id,decodifica(v))}}
  const existe=await Armazem.abre(j.id);
  if(existe){
    const r=juntaCodificacoes(existe,{formato:FORMATO_COD,rev:j.rev,cons:j.cons});
    await Armazem.gravaCodif(existe);
    if(T.size)await Armazem.gravaTextos(j.id,T);
    return {id:j.id,junto:true,r};
  }
  const casos=j.casos.map(c=>({...c,tx:T.has(c.id)}));
  const p={id:j.id||novoId(),config:j.config,casos,criado:Date.now(),rev:j.rev||{1:{},2:{}},cons:j.cons||{}};
  await Armazem.grava(p);if(T.size)await Armazem.gravaTextos(p.id,T);
  return {id:p.id,junto:false};
}
