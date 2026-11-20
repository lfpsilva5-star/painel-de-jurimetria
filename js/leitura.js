"use strict";
/* Leitura: fila de decisões, folha com o texto (marca-texto nos termos de busca) e trechos. */
function vistaLeitura(m){
  if(!$(".leitura")){
    m.innerHTML=`<div class="celtabs so-celular" role="tablist"><button data-cel="fila">Fila</button><button data-cel="folha">Decisão</button><button data-cel="ficha">Ficha</button></div>
    <div class="vista leitura">
      <section class="col fila" aria-label="Fila de decisões">
        <div class="fila-topo">
          <div class="busca"><input id="q" type="search" placeholder="Buscar nº, processo, coluna…  ( / )" aria-label="Buscar"></div>
          <div class="seg" id="seg-sit" aria-label="Situação"></div>
          <div id="selan"></div>
          <details class="filtros" id="det-f"><summary>Mais filtros</summary><div class="grade-f" id="grade-f"></div></details>
          <div class="contagem"><span id="contagem"></span>
            <select id="ordem" aria-label="Ordem"><option value="ordem">na ordem da planilha</option><option value="data">por data (antigas primeiro)</option><option value="data_desc">por data (recentes primeiro)</option><option value="id">por identificador</option></select></div>
        </div>
        <div class="lista" id="lista" tabindex="0" aria-label="Decisões"><div id="lista-alto"></div></div>
      </section>
      <section class="col folha-col" id="folha-col" aria-label="Decisão"></section>
      <section class="col trechos-col" id="trechos-col" aria-label="Trechos com os termos"></section>
      <aside class="col ficha" id="ficha-col" aria-label="Ficha de codificação"></aside>
    </div>`;
    $("#q").value=S.f.q;$("#q").addEventListener("input",e=>{S.f.q=e.target.value;filtra();desenhaContagem();$("#lista").scrollTop=0;desenhaJanelaLista()});
    $("#ordem").value=S.f.ordem;$("#ordem").addEventListener("change",e=>{S.f.ordem=e.target.value;filtra();desenhaJanelaLista()});
    $("#lista").addEventListener("scroll",desenhaJanelaLista,{passive:true});
    $("#lista").addEventListener("click",e=>{const it=e.target.closest(".item");if(it)abre(it.dataset.id)});
    document.querySelectorAll("[data-cel]").forEach(b=>b.addEventListener("click",()=>{S.celAba=b.dataset.cel;celular()}));
    $("#folha-col").addEventListener("mouseup",selecao);
    $("#folha-col").addEventListener("keyup",selecao);
  }
  desenhaSegs();desenhaContagem();
  if(!S.sel||!S.byId.has(S.sel))S.sel=S.lista[0]||null;
  desenhaJanelaLista();desenhaFolha();desenhaFicha();celular();
  rolaParaSel();
}
function celular(){document.querySelectorAll("[data-cel]").forEach(b=>b.setAttribute("aria-pressed",b.dataset.cel===S.celAba));
  const map={fila:".fila",folha:"#folha-col",ficha:"#ficha-col"};document.querySelectorAll(".leitura .col").forEach(c=>c.classList.remove("ativa"));const c=$(map[S.celAba]);c&&c.classList.add("ativa")}
function desenhaSegs(){
  const el=$("#seg-sit");
  el.innerHTML=[["todos","Todas"],["pendente","A codificar"],["meus","Codificadas por mim"],["divergentes","Divergentes"],["consenso","Com consenso"]].map(([v,t])=>`<button data-v="${v}" aria-pressed="${S.f.sit===v}">${t}</button>`).join("");
  el.onclick=e=>{const b=e.target.closest("button");if(!b)return;S.f.sit=b.dataset.v;filtra();desenhaSegs();desenhaContagem();$("#lista").scrollTop=0;desenhaJanelaLista()};
  $("#grade-f").innerHTML=htmlFiltros();
  $("#grade-f").onchange=e=>{const k=e.target.dataset.k;if(!k)return;S.f.x[k]=e.target.value;filtra();desenhaContagem();$("#lista").scrollTop=0;desenhaJanelaLista();rotuloFiltros("#det-f")};
  $("#grade-f").onclick=e=>{if(e.target.id==="limpa-f"){limpaFiltros();vistaLeitura($("#main"))}};
  rotuloFiltros("#det-f");
  const sa=$("#selan");sa.innerHTML=S.f.ids?`<div class="selan"><span>Seleção das Análises: ${esc(S.f.ids.rot)} (${nfmt(S.f.ids.set.size)})</span><button id="selan-x">limpar</button></div>`:"";
  $("#selan-x")?.addEventListener("click",()=>{S.f.ids="";filtra();desenhaSegs();desenhaContagem();desenhaJanelaLista()});
}
function htmlFiltros(){
  return filtrosDef().map(d=>`<label>${esc(d.t)}<select data-k="${esc(d.k)}"><option value="">todos</option>${d.ops.map(([v,l])=>`<option value="${esc(v)}"${S.f.x[d.k]===String(v)?" selected":""}>${esc(l)}</option>`).join("")}</select></label>`).join("")+
    `<button class="btn sut" id="limpa-f" type="button" style="align-self:end;justify-content:center">Limpar filtros</button>`}
function rotuloFiltros(q){const n=Object.values(S.f.x).filter(Boolean).length;const s=document.querySelector(q+" summary");if(s)s.textContent=n?`Mais filtros (${n} ${n>1?"ativos":"ativo"})`:"Mais filtros"}
function desenhaContagem(){const n=S.lista.length;const feitos=S.lista.filter(id=>meu(id)?.c).length;
  const el=$("#contagem");if(el)el.textContent=`${nfmt(n)} ${n===1?"decisão":"decisões"} · ${nfmt(feitos)} codificadas por você`}
function chipsItem(c){
  const s=situacao(c.id),m=meu(c.id)?.c,o=S.rev[outroSlot()][c.id]?.c;
  const rot=v=>`<small>${esc(rotCod(v))}</small>`;let h="";
  if(c.sug)h+=`<span class="cod" title="Codificação prévia: ${esc(descCod(c.sug))}">${esc(c.sug)}${m?"":rot(c.sug)}</span>`;
  if(m)h+=`${c.sug?'<span class="seta">→</span>':""}<span class="cod meu" title="Seu código: ${esc(descCod(m))}">${esc(m)}${rot(m)}</span>`;
  if(o){h+=(S.cego&&!m)?`<span class="cod outro" title="${esc(nomeCurto(outroSlot()))} já codificou">✓</span>`:`<span class="cod outro ${m&&o!==m?"dif":""}" title="Código de ${esc(nomeCurto(outroSlot()))}: ${esc(descCod(o))}">${esc(o)}</span>`}
  if(s.k)h+=`<span class="cod cons" title="Consenso: ${esc(descCod(s.k))}">✓ ${esc(s.k)}</span>`;
  if(!h)h=`<span class="mini">sem código</span>`;
  return h}
function linhaResumo(c){const x=(S.cfg.extras||[]).filter(e=>e.tipo==="texto").map(e=>c.x[e.col]).find(v=>v&&v.length>20);return x||""}
function desenhaJanelaLista(){
  const L=$("#lista");if(!L)return;const alto=$("#lista-alto");alto.style.height=S.lista.length*ROW+"px";
  const i0=Math.max(0,Math.floor(L.scrollTop/ROW)-4),i1=Math.min(S.lista.length,Math.ceil((L.scrollTop+(L.clientHeight||800))/ROW)+4);
  let h="";for(let i=i0;i<i1;i++){const c=S.byId.get(S.lista[i]);const tt=c.tx?texto(c):null;const tr=tt?primeiraMencao(tt,110):"";
    const res=tr||linhaResumo(c);
    h+=`<div class="item" role="option" data-id="${esc(c.id)}" aria-selected="${c.id===S.sel}" style="top:${i*ROW}px">
      <div class="l1"><span class="mono">${esc(c.id)}</span>${c.data?`<span>${dataBR(c.data)}</span>`:""}${c.orgao?`<span>${esc(c.orgao)}</span>`:""}${c.tx?"":'<span class="prio" title="Sem TXT importado">sem texto</span>'}</div>
      <div class="l2">${chipsItem(c)}${c.classe?`<span class="mini">${esc(c.classe)}</span>`:""}</div>
      <div class="tr">${res?realca(res):c.proc?`<span class="mono">${esc(c.proc)}</span>`:""}</div></div>`}
  alto.innerHTML=h;
}
function rolaParaSel(){const i=S.lista.indexOf(S.sel),L=$("#lista");if(L&&i>=0){const y=i*ROW;if(y<L.scrollTop||y>L.scrollTop+L.clientHeight-ROW)L.scrollTop=Math.max(0,y-L.clientHeight/3);desenhaJanelaLista()}}
function abre(id,semRolar){S.sel=id;S.mAtual=0;
  history.replaceState(null,"","#a-"+encodeURIComponent(id));
  document.querySelectorAll(".item").forEach(e=>e.setAttribute("aria-selected",e.dataset.id===id));
  desenhaFolha();desenhaFicha();if(window.innerWidth<=760){S.celAba="folha";celular()}
  if(!semRolar)rolaParaSel()}
function anda(d){const i=S.lista.indexOf(S.sel);const n=S.lista[Math.min(S.lista.length-1,Math.max(0,i+d))];if(n!=null)abre(n)}

function linksDecisao(c){return c.link&&/^https?:\/\//i.test(c.link)?`<a class="btn pri" href="${esc(c.link)}" target="_blank" rel="noopener">Abrir no tribunal ↗</a>`:""}
function htmlCab(c){
  const meta=[c.classe&&`<span><b>${esc(c.classe)}</b></span>`,c.orgao&&`<span>${esc(c.orgao)}</span>`,c.data&&`<span>julgado em <b>${dataBR(c.data)}</b></span>`,periodo(c)&&`<span>${esc(periodo(c))}</span>`,
    ...(S.cfg.extras||[]).filter(e=>e.tipo==="cat"&&c.x[e.col]).slice(0,6).map(e=>`<span>${esc(e.rot)}: <b>${esc(c.x[e.col])}</b></span>`)].filter(Boolean).join("");
  const t=c.tx&&typeof S.textos.get(c.id)==="string"?primeiraMencao(S.textos.get(c.id)):"";
  return `<div class="folha-cab">
      <h1><span class="mono">${esc(c.id)}</span>${c.proc?`<span class="mono" style="font-size:13px;color:var(--tinta-2)">${esc(c.proc)}</span>`:""}</h1>
      ${meta?`<div class="meta">${meta}</div>`:""}
      ${t?`<div class="mencao"><span class="rot">Primeira menção aos termos de busca</span>${realca(t)}</div>`:""}
      ${linksDecisao(c)?`<div class="links">${linksDecisao(c)}</div>`:""}</div>`}
function htmlTrechos(c,t){const js=janelas(t);
  return `<div class="trechos">${js.length?js.map((x,i)=>`<div class="trecho"><div class="cab"><span class="tag">trecho ${i+1}</span></div><p>${realca(x)}</p><div><button class="btn sut" data-ir="${i}">Ver no texto</button></div></div>`).join(""):`<div class="carregando">${t?"Nenhum dos termos de busca aparece neste texto.":"Sem texto para esta decisão."}</div>`}</div>`}
function uwAtivo(){return S.uw&&window.innerWidth>=1700}
function aplicaUW(){
  if(S.uw)document.documentElement.dataset.uw="1";else delete document.documentElement.dataset.uw;
  const b=$("#uw");b.setAttribute("aria-pressed",S.uw?"true":"false");
  const estreita=S.uw&&window.innerWidth<1700;b.textContent=estreita?"Ultrawide · janela estreita":"Ultrawide";
  b.title=estreita?"O modo está ligado, mas esta janela tem menos de 1.700 px de largura.":S.uw?"Voltar ao arranjo em três colunas (atalho: U)":"Arranjo para monitor ultrawide: fila, texto, trechos e ficha lado a lado (atalho: U)"}
function alternaUW(){S.uw=!S.uw;lsSet("painel-uw",S.uw);aplicaUW();if(S.view==="leitura"&&$(".leitura")){desenhaFolha();desenhaFicha();desenhaJanelaLista()}}
function desenhaTrechosCol(c,t){
  const col=$("#trechos-col");if(!col)return;if(!c){col.innerHTML="";return}
  const n=t?janelas(t).length:0;
  col.innerHTML=`<div class="trechos-rolo com-cab">${htmlCab(c)}
    <div class="trechos-cab"><h3>Trechos com os termos</h3><span class="mini">${n} ${n===1?"trecho":"trechos"}</span></div>
    <div class="trechos-lista">${t==null&&c.tx?'<div class="carregando">Abrindo…</div>':htmlTrechos(c,t)}</div></div>`;
  col.querySelectorAll("[data-ir]").forEach(b=>b.onclick=()=>{S.aba="teor";S.mAtual=0;irPara(+b.dataset.ir,t)})}
function desenhaFolha(){
  const col=$("#folha-col");if(!col)return;const c=S.byId.get(S.sel);
  if(uwAtivo()&&S.aba==="trechos")S.aba="teor";
  if(!c){desenhaTrechosCol(null);col.innerHTML=`<div class="vazio"><div><b>Nenhuma decisão com esses filtros.</b><span>Limpe a busca ou escolha outra situação na fila.</span></div></div>`;return}
  const t=c.tx?texto(c):"";
  desenhaTrechosCol(c,t);
  const nT=t?janelas(t).length:0;
  col.innerHTML=`${uwAtivo()?"":htmlCab(c)}
    <div class="ferr"><div class="tabs"><button data-aba="teor" aria-pressed="${S.aba==="teor"}">Texto</button><button data-aba="trechos" aria-pressed="${S.aba==="trechos"}">Trechos (${nT})</button></div>
      <div class="secoes" id="secoes"></div><div class="nav-m" id="nav-m"></div></div>
    <div class="folha-rolo" id="rolo"></div>`;
  col.querySelectorAll("[data-aba]").forEach(b=>b.onclick=()=>{S.aba=b.dataset.aba;desenhaFolha()});
  const rolo=$("#rolo");
  if(t==null){rolo.innerHTML=`<div class="carregando">Abrindo o texto…</div>`;return}
  if(!c.tx){rolo.innerHTML=`<div class="vazio"><div><b>Sem texto importado para esta decisão.</b><span>Acrescente o arquivo <span class="mono">${esc(c.id)}.txt</span> em Projeto › Textos. A decisão continua na fila e pode ser codificada.</span></div></div>`;return}
  if(S.aba==="trechos"){rolo.innerHTML=htmlTrechos(c,t);rolo.querySelectorAll("[data-ir]").forEach(b=>b.onclick=()=>{S.aba="teor";desenhaFolha();irPara(+b.dataset.ir,t)});return}
  rolo.innerHTML=`<article class="folha" id="folha">${montaTexto(t,c)}</article>`;
  const ms=rolo.querySelectorAll("mark.m");
  $("#nav-m").innerHTML=ms.length?`<span>menção <b id="mi">${Math.min(S.mAtual+1,ms.length)}</b> de ${ms.length}</span><button id="mp" aria-label="Menção anterior" title="Menção anterior (Shift+N)">‹</button><button id="mn" aria-label="Próxima menção" title="Próxima menção (N)">›</button>`:'<span>nenhum termo de busca no texto</span>';
  if(ms.length){$("#mp").onclick=()=>menc(-1);$("#mn").onclick=()=>menc(1);menc(0,true)}
  const secs=[...rolo.querySelectorAll(".sec")];
  $("#secoes").innerHTML=secs.map((s,i)=>`<button data-s="${i}">${esc(s.textContent.trim().split(/\s/)[0].toLowerCase())}</button>`).join("");
  $("#secoes").onclick=e=>{const b=e.target.closest("button");if(b)secs[+b.dataset.s].scrollIntoView({block:"start",behavior:"smooth"})};
}
function menc(d,inicial){const ms=document.querySelectorAll("#folha mark.m");if(!ms.length)return;
  S.mAtual=inicial?Math.min(S.mAtual,ms.length-1):(S.mAtual+d+ms.length)%ms.length;
  ms.forEach(m=>m.classList.remove("atual"));const m=ms[S.mAtual];m.classList.add("atual");
  m.scrollIntoView({block:"center",behavior:inicial?"auto":"smooth"});
  const mi=$("#mi");if(mi)mi.textContent=S.mAtual+1}
/* vai à primeira menção dentro do i-ésimo trecho */
function irPara(i,t){
  const rx=S.rx.termos;if(!rx)return;rx.lastIndex=0;let m,k=0,ult=-Infinity,trecho=-1,alvo=0;
  while((m=rx.exec(t))){if(!m[0].length){rx.lastIndex++;continue}
    if(m.index-ult>2*JAN)trecho++;ult=m.index+m[0].length;if(trecho===i){alvo=k;break}k++}
  S.mAtual=alvo;if(!$("#folha"))desenhaFolha();menc(0,true)}
function rxFrase(s){const w=s.replace(/[“”"]/g,"").trim().split(/\s+/).filter(Boolean).slice(0,40);if(w.length<3)return null;
  return new RegExp(w.map(x=>x.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")).join("\\s+"),"iu")}
function montaTexto(t,c){
  const R=[];
  if(S.rx.termos)for(const m of t.matchAll(S.rx.termos))if(m[0])R.push([m.index,m.index+m[0].length,"m"]);
  if(S.rx.normas)for(const m of t.matchAll(S.rx.normas))if(m[0])R.push([m.index,m.index+m[0].length,"n"]);
  for(const m of t.matchAll(SECOES))R.push([m.index,m.index+m[0].length,"sec"]);
  const r=meu(c.id);if(r&&r.tk){const rx=rxFrase(r.tk);const m=rx&&t.match(rx);if(m)R.push([m.index,m.index+m[0].length,"tku"])}
  const b=new Set([0,t.length]);R.forEach(([a,z])=>{b.add(a);b.add(z)});const pts=[...b].sort((x,y)=>x-y);
  let h="";
  for(let i=0;i<pts.length-1;i++){const a=pts[i],z=pts[i+1];if(a===z)continue;
    const cl=R.filter(x=>x[0]<=a&&x[1]>=z).map(x=>x[2]);let s=esc(t.slice(a,z));
    if(cl.includes("tku"))s=`<span class="tku" title="Seu trecho-chave">${s}</span>`;
    if(cl.includes("m"))s=`<mark class="m">${s}</mark>`;
    if(cl.includes("n"))s=`<mark class="n">${s}</mark>`;
    if(cl.includes("sec"))s=`<span class="sec">${s}</span>`;
    h+=s}
  return h.replace(/<\/mark><mark class="m">/g,"")}

/* seleção no texto: trecho-chave e transcrições */
function selecao(e){
  if(e&&e.target.closest&&e.target.closest(".selbar"))return;
  document.querySelector(".selbar")?.remove();
  const sel=window.getSelection();if(!sel||sel.isCollapsed)return;
  const txt=sel.toString().replace(/\s+/g," ").trim();if(txt.length<4)return;
  const f=$("#folha")||$(".trechos");if(!f||!f.contains(sel.anchorNode))return;
  const rect=sel.getRangeAt(0).getBoundingClientRect(),col=$("#folha-col").getBoundingClientRect();
  const bar=document.createElement("div");bar.className="selbar";
  bar.innerHTML=`<button data-a="tk">Usar como trecho-chave</button><button data-a="tr">Guardar em transcrições</button>`;
  bar.style.top=(rect.top-col.top-40)+"px";bar.style.left=Math.max(8,Math.min(col.width-280,rect.left-col.left))+"px";
  $("#folha-col").appendChild(bar);
  bar.onmousedown=e=>e.preventDefault();
  bar.onclick=e=>{const a=e.target.dataset.a;if(!a)return;const id=S.sel;
    if(a==="tk")grava(id,{tk:txt.slice(0,600)});else grava(id,{trans:[...(meu(id)?.trans||[]),txt.slice(0,1200)].slice(-12)});
    bar.remove();sel.removeAllRanges();desenhaFicha();if(a==="tk"){const y=$("#rolo").scrollTop;desenhaFolha();$("#rolo").scrollTop=y}}}

/* teclado */
document.addEventListener("keydown",e=>{
  if(e.key.toLowerCase()==="u"&&!e.metaKey&&!e.ctrlKey&&!e.altKey&&S.view==="leitura"&&!e.target.matches("input,textarea,select")&&window.innerWidth>1180)alternaUW()});
let uwT=null;window.addEventListener("resize",()=>{clearTimeout(uwT);uwT=setTimeout(()=>{aplicaUW();if(S.uw&&S.view==="leitura"&&$(".leitura"))desenhaFolha()},200)});
document.addEventListener("keydown",e=>{
  if(S.view!=="leitura"||!S.proj||e.metaKey||e.ctrlKey||e.altKey)return;
  const t=e.target;
  if(t.matches("input,textarea,select")){if(e.key==="Escape")t.blur();return}
  const c=S.byId.get(S.sel),tecla=e.key.length===1?e.key.toLowerCase():e.key;
  if(tecla==="/"){e.preventDefault();$("#q")?.focus();return}
  if(tecla==="j"||tecla==="ArrowRight"&&!e.shiftKey||tecla==="ArrowDown"&&t.closest?.("#lista")){e.preventDefault();gravaAgora();anda(1);return}
  if(tecla==="k"||tecla==="ArrowLeft"&&!e.shiftKey||tecla==="ArrowUp"&&t.closest?.("#lista")){e.preventDefault();anda(-1);return}
  if(tecla==="n"){menc(e.shiftKey?-1:1);return}
  if(!c)return;
  if(/^[0-9]$/.test(tecla)&&LIVRO()[(+tecla+9)%10]){const v=LIVRO()[(+tecla+9)%10].cod;grava(c.id,{c:meu(c.id)?.c===v?null:v});desenhaFicha();redesenhaLeve();return}
  if(tecla==="a"&&temSugestao(c)){e.preventDefault();grava(c.id,adota(c));redesenhaLeve();if(e.shiftKey){gravaAgora();anda(1)}else desenhaFicha()}
});
