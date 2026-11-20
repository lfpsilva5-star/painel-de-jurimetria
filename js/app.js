"use strict";
/* Núcleo: estado do projeto aberto, gravação, filtros e rotas. */
const ROW=104,TROW=34;
const S={proj:null,cfg:null,casos:[],byId:new Map(),textos:new Map(),todos:null,
  view:"inicio",sel:null,lista:[],aba:"teor",mAtual:0,celAba:"fila",
  f:{q:"",sit:"todos",ordem:"ordem",ids:"",x:{}},
  eu:1,cego:true,rev:{1:{},2:{}},cons:{},rx:{termos:null,normas:null},
  tcols:null,tsort:["ordem",1],loteConf:false,ultimo:null,pend:false,erro:null,uw:false};

/* ---------- vocabulário do projeto ---------- */
const LIVRO=()=>S.cfg?.livro||[];
const CAMPOS=()=>S.cfg?.campos||[];
const rotCod=v=>{const x=LIVRO().find(c=>c.cod===v);return x?x.rot:""};
const descCod=v=>{const x=LIVRO().find(c=>c.cod===v);return x?(x.desc||x.rot):""};
const codRot=v=>v?(rotCod(v)&&rotCod(v)!==v?v+" · "+rotCod(v):v):"";
const nomeRev=s=>S.cfg?.revisores?.[s-1]||"Revisor "+s;
const nomeCurto=s=>nomeRev(s).split(" ")[0];
const outroSlot=()=>S.eu===1?2:1;
const temSug=()=>!!S.cfg?.cols?.sug;
const SECOES=/^\s*(EMENTA|AC[ÓO]RD[ÃA]O|RELAT[ÓO]RIO|VOTOS?|DECIS[ÃA]O|DISPOSITIVO|SENTEN[ÇC]A|FUNDAMENTA[ÇC][ÃA]O|V O T O|R E L A T [ÓO] R I O)\b.*$/gmu;

/* ---------- abrir projeto ---------- */
async function abreProjeto(id){
  const p=await Armazem.abre(id);if(!p)throw new Error("Projeto não encontrado neste navegador.");
  S.proj=p;S.cfg=p.config;S.casos=p.casos;S.byId=new Map(p.casos.map(c=>[c.id,c]));
  S.rev=p.rev||{1:{},2:{}};S.rev[1]??={};S.rev[2]??={};S.cons=p.cons||{};
  S.textos=new Map();S.todos=null;S.sel=null;S.f={q:"",sit:"todos",ordem:"ordem",ids:"",x:{}};
  const pref=lsGet("painel-pref-"+id,{});S.eu=pref.eu===2?2:1;S.cego=pref.cego!==false;
  S.tcols=null;S.ultimo=p.atualizado||null;
  aplicaTermos();lsSet("painel-ultimo",id);
  document.title=S.cfg.nome+" · Painel de Jurimetria";
}
function aplicaTermos(){S.rx.termos=rxTermos(S.cfg.termos);S.rx.normas=rxTermos(S.cfg.normas)}
function guardaPref(){if(S.proj)lsSet("painel-pref-"+S.proj.id,{eu:S.eu,cego:S.cego})}
function fechaProjeto(){S.proj=null;S.cfg=null;S.casos=[];S.byId=new Map();document.title="Painel de Jurimetria";location.hash="inicio"}

/* ---------- gravação ---------- */
let gravT=null;
function agendaGravar(){S.pend=true;estado();clearTimeout(gravT);gravT=setTimeout(gravaAgora,500)}
async function gravaAgora(){
  clearTimeout(gravT);if(!S.proj||!S.pend)return;
  try{S.proj.rev=S.rev;S.proj.cons=S.cons;await Armazem.gravaCodif(S.proj);S.pend=false;S.erro=null;S.ultimo=Date.now()}
  catch(e){S.erro="Não consegui gravar neste navegador ("+(e.message||e.name)+"). Baixe o arquivo de codificação para não perder o trabalho."}
  estado();
}
window.addEventListener("beforeunload",e=>{if(S.pend){gravaAgora();e.preventDefault();e.returnValue=""}});
document.addEventListener("visibilitychange",()=>{if(document.hidden)gravaAgora()});
const meu=id=>S.rev[S.eu][id];
function grava(id,patch){const atual=S.rev[S.eu][id]||{};S.rev[S.eu][id]={...atual,...patch,t:Date.now()};agendaGravar()}
function gravaCons(id,patch){S.cons[id]={...(S.cons[id]||{}),...patch,t:Date.now(),por:S.eu};agendaGravar()}
function estado(){
  const e=$("#estado");if(!e)return;
  if(!S.proj||["inicio","novo"].includes(S.view)){e.dataset.s="";e.textContent="Dados só neste navegador";return}
  if(S.erro){e.dataset.s="erro";e.textContent=S.erro;return}
  if(S.pend){e.dataset.s="salvando";e.textContent="Salvando…";return}
  e.dataset.s="ok";e.textContent=S.ultimo?"Salvo neste navegador às "+horaBR(S.ultimo):"Salvo neste navegador";
}
function aviso(t){const a=$("#aviso");if(!a)return;a.textContent=t;a.hidden=!t}

/* ---------- filtros ---------- */
function situacao(id){const a=S.rev[1][id]?.c,b=S.rev[2][id]?.c,k=S.cons[id]?.c;return {a,b,k,amb:!!(a&&b),dif:!!(a&&b&&a!==b)}}
/* filtros extras: definidos a partir do projeto */
function filtrosDef(){
  const F=[];const ops=campo=>[...new Set(S.casos.map(c=>campo(c)).filter(v=>v!==""&&v!=null))].sort((a,b)=>String(a).localeCompare(String(b),"pt-BR"));
  if(temSug())F.push({k:"sug",t:"Codificação prévia",ops:ops(c=>c.sug).map(v=>[v,codRot(v)||v]),ok:(c,v)=>c.sug===v});
  F.push({k:"meu",t:"Meu código",ops:[...LIVRO().map(c=>[c.cod,codRot(c.cod)]),["__nada","sem código"]],ok:(c,v)=>v==="__nada"?!meu(c.id)?.c:meu(c.id)?.c===v});
  if(S.cfg.cols.orgao)F.push({k:"orgao",t:"Órgão",ops:ops(c=>c.orgao).map(v=>[v,v]),ok:(c,v)=>c.orgao===v});
  if(S.cfg.cols.classe)F.push({k:"classe",t:"Classe",ops:ops(c=>c.classe).map(v=>[v,v]),ok:(c,v)=>c.classe===v});
  if(S.cfg.cols.data)F.push({k:"ano",t:"Ano",ops:ops(c=>c.data.slice(0,4)).map(v=>[v,v]),ok:(c,v)=>c.data.slice(0,4)===v});
  if(S.cfg.marcos?.length)F.push({k:"per",t:"Período",ops:periodosRot().map(v=>[v,v]),ok:(c,v)=>periodo(c)===v});
  (S.cfg.extras||[]).filter(e=>e.tipo==="cat").forEach(e=>F.push({k:"x:"+e.col,t:e.rot,ops:ops(c=>c.x[e.col]).map(v=>[v,v]),ok:(c,v)=>c.x[e.col]===v}));
  if(temSug())F.push({k:"div",t:"Revisão × codificação prévia",ops:[["meu","meu código diferente da prévia"],["r1",nomeCurto(1)+" diferente da prévia"],["r2",nomeCurto(2)+" diferente da prévia"]],
    ok:(c,v)=>{const r=v==="meu"?S.eu:v==="r1"?1:2;const m=S.rev[r][c.id]?.c;if(!m||m===c.sug)return false;if(S.cego&&r!==S.eu&&!meu(c.id)?.c)return false;return true}});
  F.push({k:"tx",t:"Texto",ops:[["sim","com texto"],["nao","sem texto"]],ok:(c,v)=>v==="sim"?c.tx:!c.tx});
  return F;
}
function filtra(){
  const f=S.f,q=f.q.trim().toLowerCase(),F=filtrosDef().filter(d=>f.x[d.k]);
  let l=S.casos.filter(c=>{
    for(const d of F)if(!d.ok(c,f.x[d.k]))return false;
    if(f.ids&&!f.ids.set.has(c.id))return false;
    if(f.sit!=="todos"){const s=situacao(c.id),m=meu(c.id)?.c;
      if(f.sit==="pendente"&&m)return false;if(f.sit==="meus"&&!m)return false;
      if(f.sit==="divergentes"&&!(s.dif&&!s.k))return false;if(f.sit==="consenso"&&!s.k)return false}
    if(q){const h=(c.id+" "+c.proc+" "+c.orgao+" "+c.classe+" "+Object.values(c.x).join(" ")).toLowerCase();if(!h.includes(q))return false}
    return true});
  const o=f.ordem;
  l.sort(o==="data"?(a,b)=>a.data.localeCompare(b.data)||a.ordem-b.ordem:o==="data_desc"?(a,b)=>b.data.localeCompare(a.data)||a.ordem-b.ordem:o==="id"?(a,b)=>a.id.localeCompare(b.id,"pt-BR",{numeric:true}):(a,b)=>a.ordem-b.ordem);
  S.lista=l.map(c=>c.id);
}
function limpaFiltros(){S.f.x={};S.f.q="";S.f.ids=""}

/* períodos derivados dos marcos temporais */
function periodosRot(){const M=S.cfg.marcos||[];if(!M.length)return [];return ["antes de "+M[0].rot,...M.map((m,i)=>i<M.length-1?m.rot+" até "+M[i+1].rot:"desde "+m.rot)]}
function periodo(c){const M=S.cfg.marcos||[];if(!M.length||!c.data)return null;let i=0;while(i<M.length&&c.data>=M[i].data)i++;return periodosRot()[i]}

/* ---------- rotas ---------- */
const VISTAS=["leitura","tabela","progresso","analises","projeto"];
function rota(){
  const h=decodeURIComponent(location.hash.slice(1));
  if(!S.proj){if(h==="novo")S.view="novo";else S.view="inicio"}
  else if(h.startsWith("a-")){S.view="leitura";S.sel=h.slice(2)}
  else if(VISTAS.includes(h))S.view=h;
  else if(h==="inicio"){S.view="inicio"}
  else if(h==="novo")S.view="novo";
  else S.view="leitura";
  document.querySelectorAll("nav.abas a").forEach(a=>a.setAttribute("aria-current",a.dataset.v===S.view?"page":"false"));
  barra();redesenha();
}
window.addEventListener("hashchange",rota);
function barra(){
  const ab=S.proj&&!["inicio","novo"].includes(S.view);
  $("#abas").hidden=!ab;$("#quem").hidden=!ab;$("#uw").hidden=!ab;
  $("#proj-nome").textContent=ab?S.cfg.nome:"pesquisa empírica com decisões judiciais";
  quemSou();estado();
}
function redesenha(){
  const m=$("#main");
  if(S.view==="inicio")return vistaInicio(m);
  if(S.view==="novo")return vistaNovo(m);
  if(!S.proj)return vistaInicio(m);
  filtra();
  if(S.view==="leitura")vistaLeitura(m);
  else if(S.view==="tabela")vistaTabela(m);
  else if(S.view==="analises")vistaAnalises(m);
  else if(S.view==="projeto")vistaProjeto(m);
  else vistaProgresso(m);
}
let leveT=null;
function redesenhaLeve(){clearTimeout(leveT);leveT=setTimeout(()=>{
  if(S.view==="leitura"){filtra();desenhaContagem();desenhaJanelaLista();if(!document.activeElement?.closest?.(".ficha"))desenhaFicha();else desenhaComparacao()}
  else if(S.view==="tabela"){if(!document.activeElement?.closest?.("#tg select")){janelaTabela();desenhaLote()}}
  else if(S.view==="analises")refazAnalise();
  else if(S.view==="progresso")redesenha()},200)}

/* ---------- quem sou ---------- */
function quemSou(){
  const n=S.proj?nomeRev(S.eu):"";$("#quem-n").textContent=S.proj?`${n.split(" ")[0]} · revisor ${S.eu}`:"";
  const av=$("#av");av.textContent=(n||"·").slice(0,2);av.style.background=S.eu===1?"#2145a6":"#7a4bb0";
}
$("#quem").onclick=()=>{const p=$("#pop");if(!p.hidden){p.hidden=true;$("#quem").setAttribute("aria-expanded","false");return}
  p.innerHTML=`<div><h4>Neste navegador, você codifica como</h4><div class="seg" id="pop-eu" style="margin-top:8px">${[1,2].map(s=>`<button data-s="${s}" aria-pressed="${S.eu===s}">${esc(nomeRev(s))} · revisor ${s}</button>`).join("")}</div>
     <p class="mini" style="margin-top:6px">Cada revisor grava numa coluna própria. Para juntar o trabalho dos dois, use Projeto › Dupla revisão.</p></div>
   <label style="display:flex;gap:8px;align-items:flex-start"><input type="checkbox" id="cego"${S.cego?" checked":""}><span><b>Codificação às cegas</b><br><span class="mini">Esconde o código do outro revisor até você registrar o seu. Mantém o kappa honesto.</span></span></label>
   <div><h4>Atalhos</h4><p><span class="dica"><kbd>→</kbd> ou <kbd>J</kbd> próxima decisão · <kbd>←</kbd> ou <kbd>K</kbd> anterior · <kbd>A</kbd> adotar a sugestão · <kbd>Shift</kbd><kbd>A</kbd> adotar e ir à próxima · <kbd>1</kbd>–<kbd>9</kbd> e <kbd>0</kbd> código · <kbd>N</kbd> próxima menção, <kbd>Shift</kbd><kbd>N</kbd> a anterior · <kbd>/</kbd> busca · <kbd>Esc</kbd> sai do campo de texto · <kbd>U</kbd> modo ultrawide</span></p></div>
   <div class="links"><a class="btn" href="#inicio" id="pop-troca">Trocar de projeto</a></div>`;
  p.hidden=false;$("#quem").setAttribute("aria-expanded","true");
  $("#pop-eu").onclick=e=>{const b=e.target.closest("button");if(!b)return;S.eu=+b.dataset.s;guardaPref();p.hidden=true;quemSou();redesenha()};
  $("#cego").onchange=e=>{S.cego=e.target.checked;guardaPref();redesenha()};
  $("#pop-troca").onclick=()=>{p.hidden=true;gravaAgora()};
};
document.addEventListener("click",e=>{if(!e.target.closest("#pop,#quem"))$("#pop").hidden=true});

/* ---------- textos ---------- */
function texto(c){
  if(S.todos)return S.todos.get(c.id)??"";
  if(S.textos.has(c.id)){const t=S.textos.get(c.id);return t instanceof Promise?null:t}
  const p=Armazem.texto(S.proj.id,c.id).then(t=>{S.textos.set(c.id,t||"");if(S.view==="leitura"){if(S.sel===c.id)desenhaFolha();clearTimeout(_listaT);_listaT=setTimeout(desenhaJanelaLista,60)}}).catch(e=>{S.textos.delete(c.id);aviso("Não consegui abrir o texto: "+e.message)});
  S.textos.set(c.id,p);return null;
}
async function todosTextos(prog=()=>{}){if(S.todos)return S.todos;prog("Abrindo os textos…");S.todos=await Armazem.textos(S.proj.id);return S.todos}

let _listaT=null;
/* primeira menção, com pouca margem, para a fila e o cabeçalho */
function primeiraMencao(t,r=170){const rx=S.rx.termos;if(!rx||!t)return "";rx.lastIndex=0;const m=rx.exec(t);if(!m)return "";
  const a=Math.max(0,m.index-r),z=Math.min(t.length,m.index+m[0].length+r);let s=t.slice(a,z).replace(/\s+/g," ").trim();
  if(a>0)s="…"+s.replace(/^\S*\s/,"");if(z<t.length)s=s.replace(/\s\S*$/,"")+"…";return s}
/* janelas de contexto em torno dos termos de busca, calculadas a partir do texto */
const JAN=320;
function janelas(t){
  const rx=S.rx.termos;if(!rx||!t)return [];
  const R=[];rx.lastIndex=0;let m;
  while((m=rx.exec(t))){if(!m[0].length){rx.lastIndex++;continue}
    const a=Math.max(0,m.index-JAN),z=Math.min(t.length,m.index+m[0].length+JAN);
    if(R.length&&a<=R[R.length-1][1])R[R.length-1][1]=z;else R.push([a,z])}
  return R.map(([a,z])=>{let s=t.slice(a,z).replace(/\s+/g," ").trim();if(a>0)s="…"+s.replace(/^\S*\s/,"");if(z<t.length)s=s.replace(/\s\S*$/,"")+"…";return s});
}
function realca(t){
  let h=esc(t);
  if(S.rx.termos)h=h.replace(S.rx.termos,m=>`<mark class="m">${m}</mark>`);
  if(S.rx.normas)h=h.replace(S.rx.normas,m=>`<mark class="n">${m}</mark>`);
  return h;
}
