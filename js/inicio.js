"use strict";
/* Inicialização: dica flutuante das figuras, preferências e abertura do último projeto. */
const TIP=document.createElement("div");TIP.className="tip";TIP.hidden=true;document.body.appendChild(TIP);
document.addEventListener("mouseover",e=>{const t=e.target.closest?.("[data-tip]");if(!t){TIP.hidden=true;return}TIP.textContent=t.getAttribute("data-tip");TIP.hidden=false});
document.addEventListener("mousemove",e=>{if(TIP.hidden)return;const w=TIP.offsetWidth,h=TIP.offsetHeight;TIP.style.left=Math.max(8,Math.min(e.clientX+14,innerWidth-w-8))+"px";TIP.style.top=(e.clientY+18+h>innerHeight?e.clientY-h-10:e.clientY+18)+"px"});
matchMedia("(prefers-color-scheme: dark)").addEventListener?.("change",()=>{if(S.view==="analises"&&$(".an"))desenhaSub()});
$("#uw").onclick=alternaUW;
(async()=>{
  S.uw=lsGet("painel-uw",false);aplicaUW();
  try{await Armazem.abreDB()}
  catch(e){$("#main").innerHTML=`<div class="vazio"><div><b>Este navegador não deixa o painel guardar dados.</b><span>${esc(e.message)} Em janela anônima, alguns navegadores bloqueiam o armazenamento local; abra numa janela comum.</span></div></div>`;return}
  const h=decodeURIComponent(location.hash.slice(1));
  const ult=lsGet("painel-ultimo",null);
  if(ult&&h!=="inicio"&&h!=="novo"){try{await abreProjeto(ult)}catch(e){try{localStorage.removeItem("painel-ultimo")}catch(e2){}}}
  if(!location.hash)history.replaceState(null,"",S.proj?"#leitura":"#inicio");
  rota();
})();
