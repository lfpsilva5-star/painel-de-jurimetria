"use strict";
/* Ficha de codificação: código do livro, campos configurados no projeto, trecho-chave, transcrições, observação; comparação e consenso. */
const SN_OPS=[["sim","sim"],["não","não"]];
/* valor sugerido de um campo: vem da coluna indicada no projeto */
function sugCampo(c,f){
  if(!f.sug)return null;const v=String(c.x[f.sug]??"").trim();if(!v)return null;
  if(f.tipo==="multipla"){const L=v.split(/\s*[;|]\s*/).filter(Boolean);return L.length?L:null}
  if(f.tipo==="simnao"){const k=semAcento(v.toLowerCase());return /^(s|sim|1|true|verdadeiro|x)$/.test(k)?"sim":/^(n|nao|0|false|falso)$/.test(k)?"não":null}
  return v;
}
function temSugestao(c){return !!(c.sug||CAMPOS().some(f=>sugCampo(c,f)!=null))}
function adota(c){
  const p={};if(c.sug&&LIVRO().some(x=>x.cod===c.sug))p.c=c.sug;
  for(const f of CAMPOS()){const v=sugCampo(c,f);if(v!=null)p[f.id]=Array.isArray(v)?[...v]:v}
  return p}
function chips(k,ops,val,multi,sug){
  return `<div class="chips" role="group">${ops.map(o=>{const [v,l]=Array.isArray(o)?o:[o,o];
    const on=multi?(val||[]).includes(v):val===v;const sg=multi?(sug||[]).includes(v):sug===v;
    return `<button class="chip${sg?" sugerido":""}" data-k="${esc(k)}" data-v="${esc(v)}" data-multi="${multi?1:""}" aria-pressed="${on}"${sg?' title="Sugestão da planilha"':""}>${esc(l)}</button>`}).join("")}</div>`}
function htmlCampo(f,r,c){
  const sg=sugCampo(c,f);
  if(f.tipo==="texto")return `<div class="campo"><label for="f-${esc(f.id)}">${esc(f.rot)}</label><textarea id="f-${esc(f.id)}" data-t="${esc(f.id)}" rows="2"${sg?` placeholder="Sugestão: ${esc(sg)}"`:""}>${esc(r[f.id]||"")}</textarea></div>`;
  if(f.tipo==="simnao")return `<div class="campo"><span class="lab">${esc(f.rot)}</span>${chips(f.id,SN_OPS,r[f.id]??null,false,sg)}</div>`;
  const ops=[...f.opcoes];const extra=f.tipo==="multipla"?(r[f.id]||[]):[r[f.id]].filter(Boolean);extra.forEach(v=>{if(!ops.includes(v))ops.push(v)});
  return `<div class="campo"><span class="lab">${esc(f.rot)}${f.tipo==="multipla"?' <span class="mini">mais de uma resposta</span>':""}</span>${ops.length?chips(f.id,ops,r[f.id],f.tipo==="multipla",sg):'<span class="dica">Sem opções definidas. Acrescente em Projeto › Ficha.</span>'}</div>`}
function desenhaFicha(){
  const col=$("#ficha-col");if(!col)return;const c=S.byId.get(S.sel);
  if(!c){col.innerHTML="";return}
  const r=meu(c.id)||{};
  const rolAnt=S._fichaId===c.id?($("#ficha-rolo")?.scrollTop||0):0;S._fichaId=c.id;
  const sugs=CAMPOS().map(f=>[f,sugCampo(c,f)]).filter(([,v])=>v!=null);
  const temS=c.sug||sugs.length;
  col.innerHTML=`<div class="ficha-rolo" id="ficha-rolo"><div class="fcol">
   ${temS?`<div class="bloco">
     <div class="bloco-t"><h3>Sugestão da planilha</h3><span class="mini">codificação prévia</span></div>
     <div class="sug"><dl>
       ${c.sug?`<dt>Código</dt><dd><span class="cod">${esc(c.sug)}</span> ${esc(descCod(c.sug)||"fora do livro de códigos")}</dd>`:""}
       ${sugs.map(([f,v])=>`<dt>${esc(f.rot)}</dt><dd>${esc(Array.isArray(v)?v.join("; "):v)}</dd>`).join("")}
     </dl>
     <div class="links"><button class="btn" id="adota">Adotar a sugestão <kbd>A</kbd></button><button class="btn sut" id="adota-prox" title="Adota a sugestão e abre a próxima decisão da fila">Adotar e ir à próxima <kbd>Shift</kbd><kbd>A</kbd></button></div></div>
   </div>`:""}
   <div class="bloco">
     <div class="bloco-t"><h3>Minha codificação</h3><span class="mini">${r.t?"registrado às "+horaBR(r.t)+(r.lote?" · em lote":""):"ainda não codificada"}</span></div>
     <div class="campo"><span class="lab">Código</span>
       ${LIVRO().length?`<div class="cods" role="group" aria-label="Código">${LIVRO().map((x,i)=>`<button class="chip c lin${x.cod===c.sug?" sugerido":""}" data-k="c" data-v="${esc(x.cod)}" aria-pressed="${r.c===x.cod}" title="${esc(x.desc||x.rot)}"><b>${esc(x.cod)}</b><span>${esc(x.rot!==x.cod?x.rot:x.desc)}</span>${i<10?`<kbd>${(i+1)%10}</kbd>`:"<kbd></kbd>"}</button>`).join("")}</div>
       <div class="desc-cod">${c.sug?"A faixa amarela marca a sugestão. ":""}O número à direita é o atalho de teclado.</div>`:'<span class="dica">O livro de códigos está vazio. Defina os códigos em Projeto › Livro de códigos.</span>'}</div>
     ${CAMPOS().map(f=>htmlCampo(f,r,c)).join("")}
   </div></div><div class="fcol">
   <div class="bloco">
     <div class="campo"><label for="f-tk">Trecho-chave <span class="mini">selecione no texto para preencher</span></label><textarea id="f-tk" data-t="tk" rows="2">${esc(r.tk||"")}</textarea></div>
     <div class="campo"><span class="lab">Transcrições <span class="mini">selecione no texto</span></span><div class="trans">${(r.trans||[]).map((t,i)=>`<div><span>“${esc(t)}”</span><button data-rm="${i}" aria-label="Remover">✕</button></div>`).join("")||'<span class="dica">Nenhuma ainda.</span>'}</div></div>
     <div class="campo"><label for="f-obs">Observação</label><textarea id="f-obs" data-t="obs" rows="2" placeholder="Dúvida, motivo de exclusão, ponto para a reunião">${esc(r.obs||"")}</textarea></div>
   </div>
   <div class="bloco" id="comparacao"></div>
  </div></div>
  <div class="rodape-f"><span class="dica"><kbd>N</kbd> menção</span><button class="btn" id="ant" title="Atalhos: seta para a esquerda ou K">‹ Anterior <kbd>←</kbd></button><button class="btn pri" id="prox" title="Atalhos: seta para a direita ou J">Próxima <kbd>→</kbd></button></div>`;
  desenhaComparacao();$("#ficha-rolo").scrollTop=rolAnt;
  col.querySelector("#adota")?.addEventListener("click",()=>{grava(c.id,adota(c));desenhaFicha();redesenhaLeve()});
  col.querySelector("#adota-prox")?.addEventListener("click",()=>{grava(c.id,adota(c));gravaAgora();redesenhaLeve();anda(1)});
  $("#ant").onclick=()=>anda(-1);$("#prox").onclick=()=>{gravaAgora();anda(1)};
  col.onclick=e=>{const b=e.target.closest(".chip");if(!b||!b.dataset.k)return;const k=b.dataset.k,v=b.dataset.v;
    const cur=meu(c.id)||{};let nv;
    if(b.dataset.multi){const a=new Set(cur[k]||[]);a.has(v)?a.delete(v):a.add(v);nv=[...a]}else nv=cur[k]===v?null:v;
    grava(c.id,{[k]:nv});const y=$("#ficha-rolo").scrollTop;desenhaFicha();$("#ficha-rolo").scrollTop=y;
    if(k==="c")redesenhaLeve()};
  col.querySelectorAll("textarea[data-t],input[data-t]").forEach(el=>el.addEventListener("input",()=>grava(c.id,{[el.dataset.t]:el.value})));
  col.querySelectorAll("[data-rm]").forEach(b=>b.addEventListener("click",e=>{e.stopPropagation();const a=[...(meu(c.id)?.trans||[])];a.splice(+b.dataset.rm,1);grava(c.id,{trans:a});desenhaFicha()}));
}
const valTxt=v=>Array.isArray(v)?v.join("; "):v??"";
function desenhaComparacao(){
  const el=$("#comparacao");if(!el)return;const c=S.byId.get(S.sel);if(!c)return;
  const a=S.rev[1][c.id]||{},b=S.rev[2][c.id]||{},k=S.cons[c.id]||{};
  const m=meu(c.id),o=S.rev[outroSlot()][c.id];
  const tit=`<div class="bloco-t"><h3>Comparação e consenso</h3>${k.c?`<span class="cod cons" title="${esc(descCod(k.c))}">✓ consenso ${esc(k.c)}</span>`:a.c&&b.c&&a.c!==b.c?'<span class="cod dif">divergente</span>':""}</div>`;
  if(!a.c&&!b.c){el.innerHTML=tit+`<span class="dica">Nenhum dos dois revisores registrou código para esta decisão. A codificação do outro revisor entra pelo arquivo que ele exporta (Projeto › Dupla revisão).</span>`;return}
  if(S.cego&&o&&o.c&&!(m&&m.c)){el.innerHTML=tit+`<div class="oculto">${esc(nomeCurto(outroSlot()))} já codificou esta decisão. O código aparece aqui depois que você registrar o seu, para manter a codificação independente.</div>`;return}
  const lin=(t,x,y)=>`<tr class="${x&&y&&x!==y?"dif":""}"><th>${esc(t)}</th><td>${esc(x||"–")}</td><td>${esc(y||"–")}</td></tr>`;
  el.innerHTML=tit+`<table class="comp"><tr><th></th><th>${esc(nomeCurto(1))}</th><th>${esc(nomeCurto(2))}</th></tr>
   ${lin("Código",codRot(a.c),codRot(b.c))}${CAMPOS().filter(f=>f.tipo!=="texto").map(f=>(a[f.id]!=null||b[f.id]!=null)?lin(f.rot,valTxt(a[f.id]),valTxt(b[f.id])):"").join("")}
   ${(a.obs||b.obs)?lin("Observação",a.obs,b.obs):""}</table>
   ${a.c&&b.c?`<div class="campo"><span class="lab">Código de consenso</span><div class="chips">${LIVRO().map(x=>`<button class="chip c curto" data-cons="${esc(x.cod)}" aria-pressed="${k.c===x.cod}" title="${esc(x.desc||x.rot)}"><b>${esc(x.cod)}</b>${x.rot!==x.cod?esc(x.rot):""}</button>`).join("")}</div></div>
   <div class="campo"><label for="f-cn">Nota do consenso</label><input class="txt" id="f-cn" value="${esc(k.nota||"")}" placeholder="Como a divergência foi resolvida"></div>`:""}`;
  el.querySelectorAll("[data-cons]").forEach(x=>x.onclick=e=>{e.stopPropagation();gravaCons(c.id,{c:k.c===x.dataset.cons?null:x.dataset.cons});desenhaComparacao();redesenhaLeve()});
  el.querySelector("#f-cn")?.addEventListener("input",e=>gravaCons(c.id,{nota:e.target.value}));
}
