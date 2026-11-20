"use strict";
/* Tabela: todas as decisões filtradas, colunas escolhidas pela pessoa, código editável e confirmação em lote da sugestão. */
function colunasTC(){
  const T={id:{t:"Identificador",w:130,v:c=>c.id,cl:"mono"},ordem:{t:"Linha",w:60,v:c=>c.ordem+2,cl:"mono"}};
  if(S.cfg.cols.proc)T.proc={t:"Processo",w:200,v:c=>c.proc,cl:"mono"};
  if(S.cfg.cols.data)T.data={t:"Data",w:96,v:c=>c.data,f:c=>dataBR(c.data),cl:"mono"};
  if(S.cfg.marcos?.length)T.per={t:"Período",w:170,v:c=>periodo(c)||""};
  if(S.cfg.cols.orgao)T.orgao={t:"Órgão",w:150,v:c=>c.orgao};
  if(S.cfg.cols.classe)T.classe={t:"Classe",w:150,v:c=>c.classe};
  T.tx={t:"Texto",w:60,v:c=>c.tx?"sim":"não"};
  if(temSug())T.sug={t:"Codificação prévia",w:160,v:c=>c.sug,f:c=>codRot(c.sug)};
  T.meu={t:"Meu código",w:176,v:c=>meu(c.id)?.c||"",f:c=>codRot(meu(c.id)?.c),edit:1};
  T.r1={t:"Revisor 1",w:150,v:c=>S.rev[1][c.id]?.c||"",f:c=>codRot(S.rev[1][c.id]?.c),cego:1};
  T.r2={t:"Revisor 2",w:150,v:c=>S.rev[2][c.id]?.c||"",f:c=>codRot(S.rev[2][c.id]?.c),cego:2};
  T.cons={t:"Consenso",w:150,v:c=>S.cons[c.id]?.c||"",f:c=>codRot(S.cons[c.id]?.c)};
  CAMPOS().forEach(f=>T["m:"+f.id]={t:"Meu: "+f.rot,w:170,v:c=>valTxt(meu(c.id)?.[f.id])});
  T.obs={t:"Minha observação",w:260,v:c=>meu(c.id)?.obs||""};
  (S.cfg.extras||[]).forEach(e=>T["x:"+e.col]={t:e.rot,w:e.tipo==="texto"?320:150,v:c=>c.x[e.col]??""});
  return T;
}
let TC={},TL=[];
function valorTC(k,c){const d=TC[k];if(d.cego&&d.cego!==S.eu&&S.cego&&!meu(c.id)?.c&&d.v(c))return "✓";return d.f?d.f(c):d.v(c)}
function vistaTabela(m){
  TC=colunasTC();
  if(!S.tcols)S.tcols=lsGet("painel-cols-"+S.proj.id,null)?.filter(k=>TC[k])||["id","data","orgao","classe","sug","meu","r1","r2","cons",...(S.cfg.extras||[]).filter(e=>e.tipo==="cat").slice(0,4).map(e=>"x:"+e.col)].filter(k=>TC[k]);
  m.innerHTML=`<div class="vista tabela-v">
   <div class="tabela-topo">
     <div class="busca"><input id="tq" type="search" placeholder="Buscar nº, processo, coluna…" aria-label="Buscar"></div>
     <div class="seg" id="tseg"></div><span class="mini" id="tcont"></span>
     <details class="filtros" id="tdet" style="margin-left:auto"${S._tdet?" open":""}><summary>Mais filtros</summary><div class="grade-f" id="tgrade" style="grid-template-columns:repeat(auto-fill,minmax(150px,1fr))">${htmlFiltros()}</div></details>
     <details class="filtros" id="tcolunas"><summary>Colunas</summary><div class="colsel" id="colsel"></div></details>
     <div class="lote" id="lote" style="flex-basis:100%"></div>
   </div>
   <div class="tabela-rolo" id="trolo"><div class="tg" id="tg"></div></div></div>`;
  $("#tq").value=S.f.q;$("#tq").oninput=e=>{S.f.q=e.target.value;filtra();desenhaTabela()};
  $("#tseg").innerHTML=[["todos","Todas"],["pendente","A codificar"],["meus","Minhas"],["divergentes","Divergentes"]].map(([v,t])=>`<button data-s="${v}" aria-pressed="${S.f.sit===v}">${t}</button>`).join("");
  $("#tseg").onclick=e=>{const b=e.target.closest("button");if(!b)return;S.f.sit=b.dataset.s;S.loteConf=false;vistaTabela(m)};
  $("#colsel").innerHTML=Object.entries(TC).map(([k,d])=>`<label><input type="checkbox" data-c="${esc(k)}"${S.tcols.includes(k)?" checked":""}> ${esc(d.t)}</label>`).join("");
  $("#colsel").onchange=e=>{const k=e.target.dataset.c;S.tcols=e.target.checked?Object.keys(TC).filter(x=>x===k||S.tcols.includes(x)):S.tcols.filter(x=>x!==k);lsSet("painel-cols-"+S.proj.id,S.tcols);desenhaTabela()};
  rotuloFiltros("#tdet");
  $("#tdet").ontoggle=e=>{S._tdet=e.target.open};
  $("#tgrade").onchange=e=>{const k=e.target.dataset.k;if(!k)return;S.f.x[k]=e.target.value;S.loteConf=false;filtra();desenhaTabela();rotuloFiltros("#tdet")};
  $("#tgrade").onclick=e=>{if(e.target.id==="limpa-f"){limpaFiltros();vistaTabela(m)}};
  $("#trolo").addEventListener("scroll",janelaTabela,{passive:true});
  $("#tg").addEventListener("change",e=>{const sl=e.target.closest("select[data-meu]");if(sl){grava(sl.dataset.meu,{c:sl.value||null});desenhaLote()}});
  $("#tg").addEventListener("click",e=>{const h=e.target.closest("[data-sort]");if(h){const k=h.dataset.sort;S.tsort=[k,S.tsort[0]===k?-S.tsort[1]:1];desenhaTabela();return}
    if(e.target.closest("select"))return;
    const r=e.target.closest(".tr-l");if(r){S.sel=r.dataset.id;location.hash="a-"+encodeURIComponent(r.dataset.id)}});
  filtra();desenhaTabela();
}
function desenhaTabela(){
  const [k,d]=S.tsort;const def=TC[k]||TC.ordem;
  TL=S.lista.map(id=>S.byId.get(id));TL.sort((a,b)=>{const x=def.v(a),y=def.v(b);return (typeof x==="number"&&typeof y==="number"?x-y:String(x).localeCompare(String(y),"pt-BR",{numeric:true}))*d||a.ordem-b.ordem});
  const W=S.tcols.reduce((s,k)=>s+TC[k].w,0);
  $("#tg").style.width=W+"px";$("#tg").style.height=(TL.length*TROW+34)+"px";
  $("#tcont").textContent=`${nfmt(TL.length)} decisões`;
  $("#tg").innerHTML=`<div class="th" style="width:${W}px">${S.tcols.map(k=>`<button data-sort="${esc(k)}" style="width:${TC[k].w}px" title="Ordenar">${esc(k==="r1"||k==="r2"?nomeCurto(+k[1]):TC[k].t)}${S.tsort[0]===k?(S.tsort[1]>0?" ↑":" ↓"):""}</button>`).join("")}</div><div id="tcorpo"></div>`;
  janelaTabela();desenhaLote();
}
function janelaTabela(){
  const R=$("#trolo"),C=$("#tcorpo");if(!R||!C)return;
  const i0=Math.max(0,Math.floor(R.scrollTop/TROW)-6),i1=Math.min(TL.length,Math.ceil((R.scrollTop+(R.clientHeight||800))/TROW)+6);
  let h="";for(let i=i0;i<i1;i++){const c=TL[i];h+=`<div class="tr-l" data-id="${esc(c.id)}" style="top:${34+i*TROW}px">${S.tcols.map(k=>TC[k].edit?`<div class="td" style="width:${TC[k].w}px"><select data-meu="${esc(c.id)}" aria-label="Meu código para ${esc(c.id)}"><option value="">—</option>${LIVRO().map(x=>`<option value="${esc(x.cod)}"${meu(c.id)?.c===x.cod?" selected":""}>${esc(codRot(x.cod))}</option>`).join("")}</select></div>`:`<div class="td ${TC[k].cl||""}" style="width:${TC[k].w}px" title="${esc(valorTC(k,c))}">${esc(valorTC(k,c))}</div>`).join("")}</div>`}
  C.innerHTML=h}
function desenhaLote(){
  const el=$("#lote");if(!el)return;
  if(!temSug()){el.innerHTML="";return}
  const alvo=TL.filter(c=>!meu(c.id)?.c&&c.sug&&LIVRO().some(x=>x.cod===c.sug));
  if(!alvo.length){el.innerHTML=`<span class="mini">Todas as decisões filtradas com sugestão já têm o seu código.</span>`;return}
  el.innerHTML=S.loteConf?`<div class="confirma"><span>Confirmar a sugestão da planilha em <b>${nfmt(alvo.length)}</b> decisões que você ainda não codificou? Elas ficam marcadas como “confirmadas em lote”, e você pode mudar qualquer uma depois.</span><button class="btn pri" id="lote-ok">Confirmar ${nfmt(alvo.length)}</button><button class="btn" id="lote-no">Cancelar</button></div>`
    :`<button class="btn" id="lote-ir">Confirmar a sugestão nas ${nfmt(alvo.length)} filtradas ainda sem o seu código</button><span class="mini">Pensado para conferência por amostra. Filtre antes pela codificação prévia ou por outra coluna.</span>`;
  $("#lote-ir")?.addEventListener("click",()=>{S.loteConf=true;desenhaLote()});
  $("#lote-no")?.addEventListener("click",()=>{S.loteConf=false;desenhaLote()});
  $("#lote-ok")?.addEventListener("click",()=>{alvo.forEach(c=>grava(c.id,{...adota(c),lote:1}));gravaAgora();S.loteConf=false;filtra();desenhaTabela()});
}
