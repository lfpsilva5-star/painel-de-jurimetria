"use strict";
Object.assign(REFS,{
  brezina:"BREZINA, Vaclav; McENERY, Tony; WATTAM, Stephen. Collocations in context: a new perspective on collocation networks. International Journal of Corpus Linguistics, v. 20, n. 2, p. 139-173, 2015.",
  biber:"BIBER, Douglas et al. Longman grammar of spoken and written English. Harlow: Longman, 1999.",
  biber04:"BIBER, Douglas; CONRAD, Susan; CORTES, Viviana. If you look at...: lexical bundles in university teaching and textbooks. Applied Linguistics, v. 25, n. 3, p. 371-405, 2004.",
  gries:"GRIES, Stefan Th. Dispersions and adjusted frequencies in corpora. International Journal of Corpus Linguistics, v. 13, n. 4, p. 403-437, 2008.",
  hyland:"HYLAND, Ken. Metadiscourse: exploring interaction in writing. London: Continuum, 2005.",
  vandijk:"VAN DIJK, Teun A. Discurso e poder. Organização de Judith Hoffnagel e Karina Falcone. 2. ed. São Paulo: Contexto, [ano a conferir].",
  vanleeuwen:"VAN LEEUWEN, Theo. Discourse and practice: new tools for critical discourse analysis. Oxford: Oxford University Press, 2008.",
  fairclough:"FAIRCLOUGH, Norman. Discurso e mudança social. Coordenação da tradução de Izabel Magalhães. Brasília: Editora UnB, 2001.",
  kilgarriff:"KILGARRIFF, Adam et al. The Sketch Engine. In: EURALEX INTERNATIONAL CONGRESS, 11., 2004, Lorient. Proceedings [...]. Lorient: Université de Bretagne-Sud, 2004. p. 105-116.",
  ud:"DE MARNEFFE, Marie-Catherine et al. Universal Dependencies. Computational Linguistics, v. 47, n. 2, p. 255-308, 2021.",
  spacy:"HONNIBAL, Matthew et al. spaCy: industrial-strength natural language processing in Python. Versão 3.8. [S. l.]: Explosion, 2020. Disponível em: https://spacy.io."});

/* comparação entre grupos, comum às seções novas */
function grupoFn(){const v=VARS[A.vvar];return c=>{if(!v)return "A";const x=v.g(c);if(x==null)return null;if(x===A.va)return "A";if(!A.vb||x===A.vb)return "B";return null}}
function nomesAB(){const v=VARS[A.vvar];if(!v)return ["universo",""];if(A.vb)return [rotV(v,A.va),rotV(v,A.vb)];const outros=[...new Set(universo().map(c=>v.g(c)).filter(x=>x!=null&&x!==A.va))];return [rotV(v,A.va),outros.length===1?rotV(v,outros[0]):"demais categorias"]}
function ctlComp(p,U){const v=VARS[A.vvar];const vals=v?[...new Set(U.map(c=>v.g(c)).filter(x=>x!=null))]:[];if(v)ordenaCats(vals,v,new Map(vals.map(x=>[x,U.filter(c=>v.g(c)===x).length])));
  if(v&&!vals.includes(A.va))A.va=vals[0]||"";if(A.vb&&!vals.includes(A.vb))A.vb="";
  return `<label for="${p}-v">Comparar por${selVar(p+"-v",A.vvar,{semMulti:1,vazio:"sem comparação"})}</label>
    ${v?`<label for="${p}-a">Grupo A<select id="${p}-a">${vals.map(x=>`<option value="${esc(x)}"${x===A.va?" selected":""}>${esc(rotV(v,x))}</option>`).join("")}</select></label>
    <label for="${p}-b">Grupo B<select id="${p}-b"><option value="">todos os demais</option>${vals.map(x=>`<option value="${esc(x)}"${x===A.vb?" selected":""}>${esc(rotV(v,x))}</option>`).join("")}</select></label>`:""}`}
function leComp(p){if($(`#${p}-a`))A.va=$(`#${p}-a`).value;if($(`#${p}-b`))A.vb=$(`#${p}-b`).value}
function ligaComp(p,el,sub){$(`#${p}-v`).onchange=e=>{A.vvar=e.target.value;A.va="";A.vb="";guardaA();sub(el)}}
/* G² e Log Ratio entre duas frequências em corpora de tamanhos TA e TB */
function g2ab(a,b,TA,TB){if(!TA||!TB)return {g2:NaN,lr:NaN,p:NaN};const e1=TA*(a+b)/(TA+TB),e2=TB*(a+b)/(TA+TB);const g2=2*((a?a*Math.log(a/e1):0)+(b?b*Math.log(b/e2):0));return {g2,lr:Math.log2(((a||.5)/TA)/((b||.5)/TB)),p:ST.chi2p(g2,1)}}
const p10=(x,t)=>t?fnum(1e4*x/t,1):"–";
function irKwic(q,{re=false,f="",w}={}){A.kq=q;A.kre=re;A.kf=f;if(w)A.kw=w;A.sub="kwic";AR.kwic=null;guardaA();desenhaAnNav();desenhaSub()}
function porDocDe(D){const m=new Map();D.forEach(d=>{(m.get(d.id)||m.set(d.id,[]).get(d.id)).push(d.t)});return m}
const progEm=out=>t=>{out.innerHTML=`<div class="carregando">${esc(t)}</div>`};
function termoSrc(t){const ws=normTxt(String(t).trim()).split(/\s+/).filter(Boolean).map(w=>w.split("*").map(s=>s.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")).join("[\\p{L}\\p{N}-]*"));return "(?<![\\p{L}\\p{N}])"+ws.join("[\\s\\p{P}]+")+"(?![\\p{L}\\p{N}])"}

/* 1. rede de colocações (modelo GraphColl) */
async function tokCorpus(U,corp,prog){const D=await corpus(U,corp,prog);const chave=corp+"|"+U.map(c=>c.id).join(",");if(AR._tok&&AR._tok.chave===chave)return AR._tok;
  prog("Separando as palavras…");const T=D.map(d=>{const raw=tokens(d.t);return {id:d.id,raw,nt:raw.map(normTxt)}});
  const fc=new Map(),forma=new Map();let N=0;T.forEach(d=>{N+=d.nt.length;d.nt.forEach((w,i)=>{fc.set(w,(fc.get(w)||0)+1);if(!forma.has(w))forma.set(w,d.raw[i])})});
  AR._tok={chave,D,T,fc,forma,N};return AR._tok}
const rxNo=q=>normTxt(String(q).trim()).split(/\s+/).filter(Boolean).map(w=>new RegExp("^"+w.split("*").map(s=>s.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")).join("[\\p{L}\\p{N}-]*")+"$","u"));
function colocados(TK,nos,W,gf){const {T,fc,forma,N}=TK;let fn=0;const fnG={A:0,B:0},O=new Map(),OG={A:new Map(),B:new Map()},docs=new Map(),noTok=new Set();
  for(const d of T){const g=gf?gf(S.byId.get(d.id)):null;const nt=d.nt;
    for(let i=0;i+nos.length<=nt.length;i++){if(!nos.every((r,q)=>r.test(nt[i+q])))continue;fn++;if(g)fnG[g]++;const e=i+nos.length;for(let q=i;q<e;q++)noTok.add(nt[q]);
      for(let q=Math.max(0,i-W);q<Math.min(nt.length,e+W);q++){if(q>=i&&q<e)continue;const w=nt[q];if(STOP.has(d.raw[q])||w.length<2||/^\d/.test(w))continue;
        O.set(w,(O.get(w)||0)+1);if(g)OG[g].set(w,(OG[g].get(w)||0)+1);(docs.get(w)||docs.set(w,new Set()).get(w)).add(d.id)}}}
  const R=[];for(const [w,o] of O){if(noTok.has(w))continue;const f=fc.get(w);R.push({w,forma:forma.get(w),o,f,nd:docs.get(w).size,ld:14+Math.log2(2*o/(fn+f)),mi:Math.log2(o/(fn*f*2*W/N)),oA:OG.A.get(w)||0,oB:OG.B.get(w)||0})}
  return {fn,fnG,R}}
function subRede(el){const U=universo();
  el.innerHTML=`<form class="an-ctl" id="r-f"><label for="r-q">Nó central<input type="search" id="r-q" value="${esc(A.rq)}" placeholder="ex.: situação de rua" style="width:180px"></label>
    ${ctlCorpus("r-c",A.kcorp)}<label for="r-w">Janela<input type="number" id="r-w" min="1" max="10" value="${A.rw}" style="width:60px"></label>
    <label for="r-m">Coocorrência mínima<input type="number" id="r-m" min="2" max="50" value="${A.rmin}" style="width:60px"></label>
    <label for="r-k">Colocados do nó<input type="number" id="r-k" min="3" max="20" value="${A.rk}" style="width:60px"></label>
    <label for="r-2">Expandir os primeiros<input type="number" id="r-2" min="0" max="8" value="${A.r2}" style="width:60px"></label>
    <label for="r-k2">Colocados de cada um<input type="number" id="r-k2" min="2" max="8" value="${A.rk2}" style="width:60px"></label>
    ${ctlComp("r",U)}<button class="btn pri" type="submit">Desenhar</button></form>
    <p class="mini" style="margin:0">A rede liga o nó aos colocados de maior logDice e, em seguida, cada um dos primeiros colocados aos seus próprios colocados (segunda ordem). Quanto mais perto do centro, mais forte a associação. Com uma comparação escolhida, a cor dos colocados diretos mostra em que grupo a coocorrência é mais frequente. Clique num nó para ver as ocorrências.</p><div id="an-out" class="an-res"></div>`;
  ligaComp("r",el,subRede);
  $("#r-f").onsubmit=async e=>{e.preventDefault();A.rq=$("#r-q").value;A.kcorp=$("#r-c").value;A.rw=Math.max(1,Math.min(10,+$("#r-w").value||5));A.rmin=Math.max(2,+$("#r-m").value||5);A.rk=Math.max(3,Math.min(20,+$("#r-k").value||10));A.r2=Math.max(0,Math.min(8,+$("#r-2").value||0));A.rk2=Math.max(2,Math.min(8,+$("#r-k2").value||4));leComp("r");guardaA();await rodaRede()};
  if(AR.rede)desenhaRede();else rodaRede()}
async function rodaRede(){const out=$("#an-out"),U=universo(),prog=progEm(out);const nos=rxNo(A.rq);
  if(!nos.length){out.innerHTML=`<div class="pressup">Digite a palavra ou expressão do centro da rede.</div>`;return}
  prog("Calculando…");const TK=await tokCorpus(U,A.kcorp,prog);const gf=VARS[A.vvar]?grupoFn():null;
  const r0=colocados(TK,nos,A.rw,gf);const L1=r0.R.filter(x=>x.o>=A.rmin).sort((a,b)=>b.ld-a.ld).slice(0,A.rk);
  const sl={A:r0.fnG.A*2*A.rw,B:r0.fnG.B*2*A.rw};
  L1.forEach(x=>{if(gf&&sl.A&&sl.B){const t=indep([[x.oA,Math.max(0,sl.A-x.oA)],[x.oB,Math.max(0,sl.B-x.oB)]]);x.lr=Math.log2(((x.oA||.5)/r0.fnG.A)/((x.oB||.5)/r0.fnG.B));x.p=t.r===2&&t.k===2?t.fisher:t.p}});
  if(gf){const ph=ST.holm(L1.map(x=>Number.isFinite(x.p)?x.p:1));L1.forEach((x,i)=>x.ph=ph[i])}
  const seg=[];for(const pai of L1.slice(0,A.r2)){prog(`Segunda ordem: ${pai.forma}…`);await pausa(0);
    const r=colocados(TK,[new RegExp("^"+pai.w.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")+"$","u")],A.rw,null);
    const L=r.R.filter(x=>x.o>=A.rmin&&!nos.some(rx=>rx.test(x.w))).sort((a,b)=>b.ld-a.ld).slice(0,A.rk2);seg.push({pai,fn:r.fn,L})}
  AR.rede={U,D:TK.D,N:TK.N,q:A.rq,corp:A.kcorp,W:A.rw,min:A.rmin,fn:r0.fn,fnG:r0.fnG,L1,seg,comp:!!gf,nomes:nomesAB(),vt:VARS[A.vvar]?.t};desenhaRede()}
function svgRede(R){const P=paleta();const W=900,H=660,cx=W/2,cy=H/2;const L1=R.L1;if(!L1.length)return "";
  const lds=L1.map(x=>x.ld),mx=Math.max(...lds),mn=Math.min(...lds);const rad=x=>mx===mn?190:120+(mx-x.ld)/(mx-mn)*130;
  const fmx=Math.max(...L1.map(x=>x.o));const nos=new Map();const k=L1.length;
  L1.forEach((x,i)=>{const a=-Math.PI/2+i*2*Math.PI/k,r=rad(x);nos.set(x.w,{x:cx+r*Math.cos(a),y:cy+r*Math.sin(a)*.86,a,rot:x.forma,o:x.o,ord:1,d:x})});
  const arestas=L1.map(x=>({de:"__no",para:x.w,ld:x.ld,o:x.o,ord:1}));
  R.seg.forEach(s=>{const p=nos.get(s.pai.w);const n=s.L.length;s.L.forEach((y,j)=>{if(!nos.has(y.w)){const a=p.a+(j-(n-1)/2)*(Math.PI/k)*.85/Math.max(1,(n-1)/2||1),r=Math.hypot(p.x-cx,(p.y-cy)/.86)+95+(j%2)*28;
      nos.set(y.w,{x:cx+r*Math.cos(a),y:cy+r*Math.sin(a)*.86,a,rot:y.forma,o:y.o,ord:2,d:y,pai:s.pai.forma})}else nos.get(y.w).comp=(nos.get(y.w).comp||0)+1;
    arestas.push({de:s.pai.w,para:y.w,ld:y.ld,o:y.o,ord:2})})});
  const pos=w=>w==="__no"?{x:cx,y:cy}:nos.get(w);const xs=[...nos.values()];
  const x0=Math.min(cx-60,...xs.map(n=>n.x-70)),x1=Math.max(cx+60,...xs.map(n=>n.x+70)),y0=Math.min(cy-30,...xs.map(n=>n.y-26)),y1=Math.max(cy+30,...xs.map(n=>n.y+26));
  const cor=n=>n.ord!==1||!R.comp||!Number.isFinite(n.d.lr)?(n.ord===1?P.caneta:P.tinta3):corZ(Math.max(-4,Math.min(4,n.d.lr*2)),P);
  let s=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x0} ${y0} ${x1-x0} ${y1-y0+(R.comp?44:0)}" width="${x1-x0}" style="max-width:100%;height:auto;font-family:system-ui,sans-serif" role="img" aria-label="Rede de colocações de ${esc(R.q)}"><rect x="${x0}" y="${y0}" width="${x1-x0}" height="${y1-y0+(R.comp?44:0)}" fill="${P.papel}"/>`;
  arestas.forEach(e=>{const a=pos(e.de),b=pos(e.para);s+=`<line x1="${a.x.toFixed(1)}" y1="${a.y.toFixed(1)}" x2="${b.x.toFixed(1)}" y2="${b.y.toFixed(1)}" stroke="${e.ord===1?P.linhaF:P.linha}" stroke-width="${(e.ord===1?1:.6)+Math.max(0,e.ld-6)*.35}"/>`});
  s+=`<g data-no="__no" style="cursor:pointer"><circle cx="${cx}" cy="${cy}" r="40" fill="${P.tinta}"/>${(L=>L.map((t,i)=>`<text x="${cx}" y="${(cy+4+(i-(L.length-1)/2)*14).toFixed(1)}" text-anchor="middle" font-size="12" font-weight="600" fill="${P.papel}">${esc(t)}</text>`).join(""))(quebra(R.q,11,3))}</g>`;
  for(const [w,n] of nos){const r=n.ord===1?5+9*Math.sqrt(n.o/fmx):3.5+3*Math.sqrt(n.o/fmx);const c=cor(n);
    const tip=n.ord===1?`${n.rot}: ${nfmt(n.o)} coocorrências com o nó, em ${nfmt(n.d.nd)} decisões; logDice ${fnum(n.d.ld,2)}${R.comp&&Number.isFinite(n.d.lr)?`; Log Ratio ${R.nomes[0]} × ${R.nomes[1]} = ${fnum(n.d.lr,2)}`:""}`:`${n.rot}: colocado de "${n.pai}" (${nfmt(n.o)} coocorrências, logDice ${fnum(n.d.ld,2)})${n.comp?`; ligado também a outros ${n.comp} colocados`:""}`;
    s+=`<g data-no="${esc(w)}" data-tip="${esc(tip)}" style="cursor:pointer"><circle cx="${n.x.toFixed(1)}" cy="${n.y.toFixed(1)}" r="${r.toFixed(1)}" fill="${c}" stroke="${P.papel}" stroke-width="1.5"${n.comp?` stroke-dasharray="2 2"`:""}/><text x="${n.x.toFixed(1)}" y="${(n.y-r-4).toFixed(1)}" text-anchor="middle" font-size="${n.ord===1?12.5:11}" font-weight="${n.ord===1?600:400}" fill="${n.ord===1?P.tinta:P.tinta2}" stroke="${P.papel}" stroke-width="3" paint-order="stroke">${esc(n.rot)}</text></g>`}
  if(R.comp){const ly=y1+14;s+=`<text x="${x0+12}" y="${ly-2}" font-size="11" fill="${P.tinta2}">Cor dos colocados diretos: Log Ratio da coocorrência por ocorrência do nó (${esc(R.nomes[0])} à direita, em azul; ${esc(R.nomes[1])} em vermelho)</text>`;
    [-2,-1.5,-1,-.5,0,.5,1,1.5,2].forEach((v,i)=>{s+=`<rect x="${x0+12+i*28}" y="${ly+6}" width="26" height="10" fill="${corZ(v*2,P)}"/>`;if(i%2===0)s+=`<text x="${x0+25+i*28}" y="${ly+28}" font-size="10" text-anchor="middle" fill="${P.tinta3}">${v>0?"+":""}${fnum(v,v%1?1:0)}</text>`})}
  return s+"</svg>"}
function desenhaRede(){const out=$("#an-out"),R=AR.rede;if(!R)return;const {L1,U,D}=R;
  if(!L1.length){out.innerHTML=`<div class="pressup">Nenhum colocado atinge a coocorrência mínima de ${R.min} com "${esc(R.q)}" (${nfmt(R.fn)} ocorrências do nó).</div>`;return}
  const svg=svgRede(R);const [nA,nB]=R.nomes;
  const ps=[`Universo: ${descUniv(U)}. Corpus: ${descCorpus(R.corp,D,U)}, com ${nfmt(R.N)} palavras. Nó central: "${R.q}", com ${nfmt(R.fn)} ocorrências. Colocados contados numa janela de ${R.W} palavras de cada lado, sem palavras gramaticais nem números, com coocorrência mínima de ${R.min}; a rede mostra os ${L1.length} colocados de maior logDice e, para os ${R.seg.length} primeiros, os seus próprios colocados mais fortes, à maneira do GraphColl de Brezina, McEnery e Wattam (2015).`,
    `A distância ao centro é proporcional ao logDice (mais perto, associação mais forte), e o tamanho do círculo, à coocorrência. Nós de segunda ordem com contorno tracejado estão ligados a mais de um colocado direto, o que indica um campo semântico compartilhado.`+(R.comp?` A cor compara a frequência de cada colocado por ocorrência do nó entre ${nA} (${nfmt(R.fnG.A)} ocorrências do nó) e ${nB} (${nfmt(R.fnG.B)}), em Log Ratio; a tabela traz o p do teste exato de Fisher sobre as posições da janela, com correção de Holm para os ${L1.length} colocados.`:""),
    `Limites: a rede é exploratória e depende dos parâmetros (janela, mínimo, número de nós); vale reproduzir com outra janela antes de afirmar um padrão. As posições da janela não são independentes entre si, o que torna o teste por colocado otimista. O sentido de cada ligação só se estabelece na leitura das ocorrências.${R.corp==="jan"?" Nas janelas de contexto, o corpus já é recortado em torno dos descritores.":""}`];AR._nota=ps;
  out.innerHTML=`<div class="quadro rede" id="r-svg" style="padding:8px">${svg}</div>
    <div class="quadro"><table class="tabela-s"><tr><th>Colocado direto</th><th class="num">O</th><th class="num">Decisões</th><th class="num">logDice</th><th class="num">MI</th>${R.comp?`<th class="num">por 100 nós: ${esc(nA)}</th><th class="num">${esc(nB)}</th><th class="num">Log Ratio</th><th class="num">p (Holm)</th>`:""}</tr>
    ${L1.map(x=>`<tr${R.comp&&!(x.ph<.05)?' class="fraco"':""}><td><button class="btn sut" data-w="${esc(x.forma)}">${esc(x.forma)}</button></td><td class="num">${nfmt(x.o)}</td><td class="num">${nfmt(x.nd)}</td><td class="num">${fnum(x.ld,2)}</td><td class="num">${fnum(x.mi,2)}</td>${R.comp?`<td class="num">${fnum(R.fnG.A?100*x.oA/R.fnG.A:NaN,1)}</td><td class="num">${fnum(R.fnG.B?100*x.oB/R.fnG.B:NaN,1)}</td><td class="num">${fnum(x.lr,2)}</td><td class="num">${fpc(x.ph)}</td>`:""}</tr>`).join("")}</table></div>
    ${R.seg.length?`<details><summary class="sub-h">Colocados de segunda ordem</summary><div class="quadro" style="margin-top:8px"><table class="tabela-s"><tr><th>Colocado direto</th><th>Seus colocados (logDice; coocorrência)</th></tr>${R.seg.map(s=>`<tr><td>${esc(s.pai.forma)}</td><td>${s.L.map(y=>`<button class="btn sut" data-w="${esc(y.forma)}" data-pai="${esc(s.pai.forma)}">${esc(y.forma)}</button> <span class="mini">${fnum(y.ld,1)}; ${y.o}</span>`).join(" ")}</td></tr>`).join("")}</table></div></details>`:""}
    ${htmlNota(ps)}${botoesExp([["x-svg","Rede (.svg)",1],["x-png","Rede (.png)"],["x-csv","Arestas (.csv)"],["x-md","Nota (.md)"]])}`;
  const vaiNo=(w,pai)=>pai?irKwic(pai,{f:w,w:R.W}):irKwic(R.q,{f:w,w:R.W});
  out.querySelectorAll("[data-w]").forEach(b=>b.onclick=()=>vaiNo(b.dataset.w,b.dataset.pai));
  $("#r-svg").onclick=e=>{const g=e.target.closest("[data-no]");if(!g)return;const w=g.dataset.no;if(w==="__no"){irKwic(R.q);return}
    const d=R.L1.find(x=>x.w===w);if(d){vaiNo(d.forma);return}for(const s of R.seg){const y=s.L.find(x=>x.w===w);if(y){vaiNo(y.forma,s.pai.forma);return}}};
  const base=`Rede_${nomeArq(R.q)}`;
  $("#x-svg").onclick=()=>salvaArq(base+".svg",svg);$("#x-png").onclick=()=>salvaArq(base+".png",svgPng(svg));
  $("#x-csv").onclick=()=>salvaArq(base+".csv",csv([["origem","destino","ordem","coocorrencia","decisoes","logDice","MI","log_ratio","p_holm"],...L1.map(x=>[R.q,x.forma,1,x.o,x.nd,numCSV(x.ld,3),numCSV(x.mi,3),numCSV(x.lr,3),numCSV(x.ph,6)]),...R.seg.flatMap(s=>s.L.map(y=>[s.pai.forma,y.forma,2,y.o,y.nd,numCSV(y.ld,3),numCSV(y.mi,3),"",""]))]));
  $("#x-md").onclick=()=>salvaArq(base+".md",mdNota(`Rede de colocações de ${R.q}`,ps,["brezina","rychly","evert"]))}

/* 2. pacotes lexicais */
const RX_SEG=/[.;:!?()[\]"“”«»\n\r]+|\s[–-]\s/;
function subPacotes(el){const U=universo();
  el.innerHTML=`<form class="an-ctl" id="b-f">${ctlCorpus("b-c",A.kcorp)}
    <label for="b-n">Tamanho<select id="b-n">${[3,4,5].map(n=>`<option value="${n}"${+A.bn===n?" selected":""}>${n} palavras</option>`).join("")}</select></label>
    <label for="b-m">Frequência mínima<input type="number" id="b-m" min="3" max="200" value="${A.bmin}" style="width:66px"></label>
    <label for="b-d">Em pelo menos (decisões)<input type="number" id="b-d" min="2" max="200" value="${A.bnd}" style="width:66px"></label>
    <label class="chk"><input type="checkbox" id="b-x"${A.bdesc?" checked":""}> excluir os que contêm os termos de busca</label>
    ${ctlComp("b",U)}<button class="btn pri" type="submit">Calcular</button></form>
    <p class="mini" style="margin:0">Pacotes lexicais são sequências de palavras que se repetem em muitos textos, como "garantia da ordem pública" ou "nos termos do voto do relator": são as fórmulas do gênero e costumam carregar o estereótipo. A contagem não atravessa pontuação. No texto integral, o cálculo vale para universos de até 400 decisões.</p><div id="an-out" class="an-res"></div>`;
  ligaComp("b",el,subPacotes);
  $("#b-f").onsubmit=async e=>{e.preventDefault();A.kcorp=$("#b-c").value;A.bn=+$("#b-n").value;A.bmin=Math.max(3,+$("#b-m").value||8);A.bnd=Math.max(2,+$("#b-d").value||5);A.bdesc=$("#b-x").checked;leComp("b");guardaA();await rodaPacotes()};
  if(AR.pac)desenhaPacotes();else $("#an-out").innerHTML=`<div class="pressup">Escolha o tamanho e os limiares e clique em Calcular.</div>`}
async function rodaPacotes(){const out=$("#an-out"),U=universo(),prog=progEm(out);
  if(A.kcorp==="teor"&&U.length>400){out.innerHTML=`<div class="pressup alerta">No texto integral, os pacotes lexicais ficam pesados demais para o navegador com ${nfmt(U.length)} decisões. Use as janelas de contexto ou reduza o universo a até 400 decisões (escolha um código no universo ou filtre a fila da Leitura).</div>`;return}
  prog("Contando…");const D=await corpus(U,A.kcorp,prog);const gf=grupoFn(),n=A.bn,porDoc=porDocDe(D);
  const F=new Map(),T={A:0,B:0},ND={A:new Set(),B:new Set()},tam=new Map();let Ntot=0,nd=0;
  const grams=ts=>{const o=[];for(const t of ts)for(const sg of normTxt(t).split(RX_SEG)){const tk=sg.match(/\p{L}[\p{L}\p{N}-]*/gu);if(!tk||tk.length<n)continue;for(let i=0;i+n<=tk.length;i++)o.push(tk.slice(i,i+n).join(" "))}return o};
  let i=0;for(const [id,ts] of porDoc){if(++i%300===0){prog(`Contando: ${nfmt(i)} de ${nfmt(porDoc.size)} decisões…`);await pausa(0)}
    const g=gf(S.byId.get(id));const nw=ts.reduce((a,t)=>a+tokens(t).length,0);tam.set(id,nw);Ntot+=nw;if(g){T[g]+=nw;ND[g].add(id)}
    const vistos=new Set();for(const b of grams(ts)){let r=F.get(b);if(!r){r=[0,0,0,0];F.set(b,r)}r[0]++;if(g==="A")r[2]++;else if(g==="B")r[3]++;if(!vistos.has(b)){vistos.add(b);r[1]++}}}
  const desc={test:b=>b.split(" ").some(w=>ehDesc(w))};
  const K=new Map();for(const [b,r] of F){if(r[0]<A.bmin||r[1]<A.bnd)continue;const tk=b.split(" ");if(STOP.has(tk[0])&&STOP.has(tk[tk.length-1])&&tk.every(w=>STOP.has(w)))continue;if(A.bdesc&&desc.test(b))continue;K.set(b,{b,f:r[0],nd:r[1],a:r[2],bb:r[3],dp:0,sv:0})}
  F.clear();prog("Calculando a dispersão…");await pausa(0);
  for(const [id,ts] of porDoc){const loc=new Map();for(const b of grams(ts))if(K.has(b))loc.set(b,(loc.get(b)||0)+1);const s=tam.get(id)/Ntot;for(const [b,c] of loc){const k=K.get(b);k.dp+=Math.abs(c/k.f-s);k.sv+=s}}
  const R=[...K.values()];R.forEach(x=>{x.dp=.5*(x.dp+(1-x.sv));Object.assign(x,VARS[A.vvar]?g2ab(x.a,x.bb,T.A,T.B):{})});
  AR.pac={R,T,ND,U,D,N:Ntot,nDocs:porDoc.size,n,min:A.bmin,nd:A.bnd,desc:A.bdesc,corp:A.kcorp,comp:!!VARS[A.vvar],nomes:nomesAB(),vt:VARS[A.vvar]?.t};desenhaPacotes()}
function desenhaPacotes(){const out=$("#an-out"),P_=AR.pac;if(!P_)return;const {R,T,ND,U,D}=P_;const [nA,nB]=P_.nomes;
  const ordem=A.bord==="g2"&&P_.comp?(a,b)=>(b.lr>0)-(a.lr>0)||b.g2-a.g2:A.bord==="dp"?(a,b)=>a.dp-b.dp:(a,b)=>b.f-a.f;const L=[...R].sort(ordem).slice(0,120);
  const bonf=.05/Math.max(1,R.length);
  const ps=[`Universo: ${descUniv(U)}. Corpus: ${descCorpus(P_.corp,D,U)}, com ${nfmt(P_.N)} palavras. Pacotes lexicais de ${P_.n} palavras, contados em minúsculas e sem acento, sem atravessar pontuação, com pelo menos ${P_.min} ocorrências em pelo menos ${P_.nd} decisões (critério de frequência e de alcance de Biber, Conrad e Cortes, 2004)${P_.desc?"; excluídos os que contêm palavras dos próprios termos de busca":""}. Foram encontrados ${nfmt(R.length)} pacotes.`,
    `A dispersão é medida pelo DP de Gries (2008): 0 quando o pacote se distribui na proporção do tamanho das decisões e perto de 1 quando se concentra em poucos. DP baixo indica fórmula do gênero; DP alto, repetição de um mesmo processo ou de uma mesma turma.`+(P_.comp?` A comparação entre ${nA} (${nfmt(ND.A.size)} decisões, ${nfmt(T.A)} palavras) e ${nB} (${nfmt(ND.B.size)} decisões, ${nfmt(T.B)} palavras) usa G² e Log Ratio, com limiar de Bonferroni p < ${fnum(bonf,6)} para ${nfmt(R.length)} pacotes.`:""),
    `Limites: pacotes se sobrepõem (um pacote de 4 palavras contém dois de 3), e a lista de 5 palavras costuma repetir a de 4 com uma palavra a mais. A contagem não separa ementa, relatório e voto, e trechos transcritos de outras decisões entram como texto da decisão que os transcreve. O pacote indica uma fórmula; a função discursiva dela se decide na leitura das ocorrências.`];AR._nota=ps;
  out.innerHTML=`<div class="an-cards"><div class="card"><span class="rot">Pacotes</span><span class="v">${nfmt(R.length)}</span><span class="mini">${P_.n} palavras, f ≥ ${P_.min}, em ≥ ${P_.nd} decisões</span></div><div class="card"><span class="rot">Decisões no corpus</span><span class="v">${nfmt(P_.nDocs)}</span><span class="mini">${nfmt(P_.N)} palavras</span></div></div>
    <div class="an-ctl"><label for="b-o">Ordenar por<select id="b-o">${[["f","frequência"],["dp","dispersão (mais espalhados primeiro)"],...(P_.comp?[["g2",`G², característicos de ${nA} primeiro`]]:[])].map(([v,t])=>`<option value="${v}"${A.bord===v?" selected":""}>${esc(t)}</option>`).join("")}</select></label><span class="mini">mostrando ${nfmt(L.length)} de ${nfmt(R.length)}; a lista completa vai no .csv</span></div>
    <div class="quadro" style="max-height:620px"><table class="tabela-s"><tr><th>Pacote</th><th class="num">f</th><th class="num">por 10 mil</th><th class="num">Decisões</th><th class="num">DP</th>${P_.comp?`<th class="num">${esc(nA)} /10 mil</th><th class="num">${esc(nB)} /10 mil</th><th class="num">Log Ratio</th><th class="num">G²</th>`:""}</tr>
    ${L.map(x=>`<tr${P_.comp&&!(x.p<bonf)?' class="fraco"':""}><td><button class="btn sut" data-b="${esc(x.b)}">${esc(x.b)}</button></td><td class="num">${nfmt(x.f)}</td><td class="num">${p10(x.f,P_.N)}</td><td class="num">${nfmt(x.nd)}</td><td class="num">${fnum(x.dp,2)}</td>${P_.comp?`<td class="num">${p10(x.a,T.A)}</td><td class="num">${p10(x.bb,T.B)}</td><td class="num">${fnum(x.lr,2)}</td><td class="num">${fnum(x.g2,1)}</td>`:""}</tr>`).join("")||`<tr><td colspan="9" class="mini">Nenhum pacote com esses limiares.</td></tr>`}</table></div>
    ${P_.comp?`<p class="mini" style="margin:0">Em cinza, os pacotes que não passam o limiar de Bonferroni na comparação.</p>`:""}
    ${htmlNota(ps)}${botoesExp([["x-csv","Pacotes (.csv)",1],["x-md","Nota (.md)"]])}`;
  $("#b-o").onchange=e=>{A.bord=e.target.value;guardaA();desenhaPacotes()};
  out.querySelectorAll("[data-b]").forEach(b=>b.onclick=()=>irKwic(b.dataset.b));
  const base=`Pacotes_${P_.n}`;
  $("#x-csv").onclick=()=>salvaArq(base+".csv",csv([["pacote","freq","por10mil","decisoes","DP_Gries","freq_A","freq_B","por10mil_A","por10mil_B","log_ratio","G2","p"],...[...R].sort((a,b)=>b.f-a.f).map(x=>[x.b,x.f,numCSV(1e4*x.f/P_.N,2),x.nd,numCSV(x.dp,3),x.a,x.bb,numCSV(T.A?1e4*x.a/T.A:NaN,2),numCSV(T.B?1e4*x.bb/T.B:NaN,2),numCSV(x.lr,3),numCSV(x.g2,3),numCSV(x.p,6)])]));
  $("#x-md").onclick=()=>salvaArq(base+".md",mdNota(`Pacotes lexicais de ${P_.n} palavras`,ps,["biber","biber04","gries","dunning","hardie"]))}

/* 3 e 4. marcadores por dicionário e padrões por expressão regular: motor comum */
const DIC_PADRAO=[
  {id:"aten",rot:"Atenuadores (modalização epistêmica fraca)",ref:"Hyland: hedges; Fairclough: modalidade",termos:["possivelmente","provavelmente","aparentemente","supostamente","presumivelmente","em tese","em princípio","ao que parece","ao que tudo indica","parece","parecem","parecia","aparentava","aparenta","indícios","indício","eventual","suposto","suposta"]},
  {id:"inte",rot:"Intensificadores (modalização epistêmica forte)",ref:"Hyland: boosters",termos:["evidentemente","claramente","certamente","indubitavelmente","inequivocamente","inequívoc*","cabalmente","incontestavelmente","inconteste","induvidos*","irrefutáve*","sem dúvida","sem sombra de dúvida","cristalin*","patente","notóri*","robust*","farto","farta","fartamente","seguro","segura","firme","firmes","incontroverso","incontroversa"]},
  {id:"deon",rot:"Deônticos (obrigação e permissão)",ref:"Fairclough: modalidade deôntica",termos:["deve","devem","deverá","deverão","deveria","impõe-se","impõe","de rigor","mister","necessário","necessária","imprescindível","cumpre","há que","há de","não se pode","não há como","inviável","inviabiliza","impossibilidade","admite-se","vedado","vedada"]},
  {id:"conc",rot:"Concessão e negação (\"por si só\", \"embora\")",ref:"van Dijk: concessão e negação aparentes",termos:["por si só","por si sós","de per si","isoladamente","não basta","não é suficiente","não são suficientes","não se desconhece","não se ignora","não se olvida","embora","ainda que","não obstante","nada obstante","conquanto","malgrado","apesar de","a despeito de","mesmo que","muito embora"]}];
const PAD_PADRAO=[
  {id:"pv",rot:"Passiva analítica sem agente expresso",ref:"Fairclough e van Leeuwen: apagamento do agente",src:"\\b(?:foi|foram|fora|foras|sido|sendo|seja|sejam|fosse|fossem|sera|serao)\\s+(?:\\p{L}+mente\\s+)?\\p{L}+(?:ad|id)[oa]s?\\b(?![^.;]{0,25}?\\bpel[oa]s?\\b)"},
  {id:"se",rot:"Impessoalização com \"se\" (\"verifica-se\", \"constata-se\")",ref:"van Leeuwen: impersonalização",src:"\\b(?:verifica|constata|observa|percebe|nota|depreende|infere|extrai|conclui|ve|tem|sabe|reconhece|evidencia)-se\\b"}];
/* dicionários e padrões ficam na configuração do projeto; sem edição, valem os genéricos acima */
function itensDic(){const d=S.cfg.dic;return Array.isArray(d)&&d.length?d:DIC_PADRAO}
function itensPad(){const d=S.cfg.pad;return Array.isArray(d)?d:PAD_PADRAO}
function dicParaTexto(D){return D.map(c=>"# "+c.rot+(c.ref?" | "+c.ref:"")+"\n"+c.termos.join("\n")).join("\n\n")}
function dicDeTexto(t){const D=[];let cur=null;String(t).split(/\r?\n/).forEach(l=>{l=l.trim();if(!l)return;
  if(l.startsWith("#")){const [rot,ref]=l.slice(1).split("|").map(x=>x.trim());cur={id:"d"+D.length,rot:rot||"Categoria "+(D.length+1),ref:ref||"",termos:[]};D.push(cur)}
  else{if(!cur){cur={id:"d0",rot:"Categoria 1",ref:"",termos:[]};D.push(cur)}cur.termos.push(l)}});return D.filter(c=>c.termos.length)}
const padParaTexto=P=>P.map(x=>x.rot+" | "+x.src).join("\n");
function padDeTexto(t){return String(t).split(/\r?\n/).map(l=>l.split("|")).filter(x=>x.length>=2&&x[0].trim()&&x.slice(1).join("|").trim()).map((x,i)=>({id:"p"+i,rot:x[0].trim(),src:x.slice(1).join("|").trim(),ref:""}))}
/* conta, por decisão e grupo, as ocorrências de cada item; nos dicionários, também por termo */
async function contaItens(D,itens,gf,prog){const porDoc=porDocDe(D);const T={A:0,B:0},ND={A:new Set(),B:new Set()};
  const R=itens.map(it=>{let rx,termos=null;try{if(it.termos){termos=it.termos.map(t=>String(t).trim()).filter(Boolean);rx=new RegExp(termos.map(t=>"("+termoSrc(t)+")").join("|"),"gu")}else rx=new RegExp(it.src,"giu")}catch(e){return {...it,erro:e.message}}
    return {...it,rx,termos,f:{A:0,B:0},d:{A:0,B:0},porTermo:termos?termos.map(()=>({A:0,B:0,d:new Set()})):null,ids:new Set()}});
  let i=0;for(const [id,ts] of porDoc){if(++i%250===0){prog(`Contando: ${nfmt(i)} de ${nfmt(porDoc.size)} decisões…`);await pausa(0)}
    const g=gf(S.byId.get(id));if(!g)continue;const nt=ts.map(normTxt);T[g]+=ts.reduce((a,t)=>a+tokens(t).length,0);ND[g].add(id);
    for(const it of R){if(it.erro)continue;let n=0;for(const t of nt){it.rx.lastIndex=0;let m;while((m=it.rx.exec(t))){if(!m[0].length){it.rx.lastIndex++;continue}n++;
      if(it.porTermo){const k=m.findIndex((x,j)=>j>0&&x!==undefined)-1;if(k>=0){it.porTermo[k][g]++;it.porTermo[k].d.add(id)}}}}
      if(n){it.f[g]+=n;it.d[g]++;it.ids.add(id)}}}
  const comp=!!VARS[A.vvar];
  R.forEach(it=>{if(it.erro||!comp)return;Object.assign(it,g2ab(it.f.A,it.f.B,T.A,T.B));const a=it.d.A,b=ND.A.size-a,c=it.d.B,d=ND.B.size-c;it.pd=ST.fisher2(a,b,c,d)});
  if(comp){const ok=R.filter(it=>!it.erro);const h1=ST.holm(ok.map(it=>it.p)),h2=ST.holm(ok.map(it=>it.pd));ok.forEach((it,j)=>{it.ph=h1[j];it.pdh=h2[j]})}
  return {R,T,ND,porDoc}}
function svgHalteres(R,T,ND,nomes){const P=paleta();const ok=R.filter(it=>!it.erro);if(!ok.length)return "";
  const v=it=>[T.A?it.d.A/ND.A.size:0,T.B?it.d.B/ND.B.size:0];const mx=Math.max(.05,...ok.flatMap(v));const lw=310,cw=430,lh=30,W=lw+cw+60,H=ok.length*lh+70;const X=x=>lw+cw*x/mx;
  let s=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" style="max-width:100%;height:auto;font-family:system-ui,sans-serif" role="img" aria-label="Proporção de decisões com cada item"><rect width="${W}" height="${H}" fill="${P.papel}"/>`;
  for(let t=0;t<=4;t++){const x=X(mx*t/4);s+=`<line x1="${x}" y1="22" x2="${x}" y2="${H-40}" stroke="${P.linha}"/><text x="${x}" y="${H-24}" font-size="10.5" text-anchor="middle" fill="${P.tinta3}">${fnum(100*mx*t/4,0)}%</text>`}
  ok.forEach((it,i)=>{const y=34+i*lh,[a,b]=v(it);s+=`<text x="${lw-10}" y="${y+4}" font-size="12" text-anchor="end" fill="${P.tinta}">${esc(quebra(it.rot,46,1)[0])}</text><line x1="${X(Math.min(a,b))}" y1="${y}" x2="${X(Math.max(a,b))}" y2="${y}" stroke="${P.linhaF}" stroke-width="3"/><circle cx="${X(b)}" cy="${y}" r="5.5" fill="${P.neg}"/><circle cx="${X(a)}" cy="${y}" r="5.5" fill="${P.pos}"/>${it.pdh<.05?`<text x="${X(Math.max(a,b))+10}" y="${y+4}" font-size="11" fill="${P.tinta2}">p ${fpv(it.pdh)}</text>`:""}`});
  s+=`<circle cx="${lw}" cy="10" r="5" fill="${P.pos}"/><text x="${lw+9}" y="14" font-size="11.5" fill="${P.tinta2}">${esc(nomes[0])}</text><circle cx="${lw+160}" cy="10" r="5" fill="${P.neg}"/><text x="${lw+169}" y="14" font-size="11.5" fill="${P.tinta2}">${esc(nomes[1])}</text><text x="${lw+cw/2}" y="${H-6}" font-size="11" text-anchor="middle" fill="${P.tinta3}">decisões com ao menos uma ocorrência</text>`;
  return s+"</svg>"}
function tabItens(K,tipo){const {R,T,ND}=K;const comp=K.comp;const [nA,nB]=K.nomes;
  return `<div class="quadro"><table class="tabela-s"><tr><th>${tipo==="dic"?"Categoria":"Padrão"}</th>${comp?`<th class="num">${esc(nA)}: /10 mil</th><th class="num">${esc(nB)}: /10 mil</th><th class="num">Log Ratio</th><th class="num">p ocorr. (Holm)</th><th class="num">${esc(nA)}: % decisões</th><th class="num">${esc(nB)}: % decisões</th><th class="num">p decisões (Holm)</th>`:`<th class="num">Ocorrências</th><th class="num">por 10 mil</th><th class="num">Decisões</th><th class="num">%</th>`}</tr>
  ${R.map(it=>it.erro?`<tr><td>${esc(it.rot)}</td><td colspan="7" class="mini">expressão inválida: ${esc(it.erro)}</td></tr>`:`<tr${comp&&!(it.pdh<.05)&&!(it.ph<.05)?' class="fraco"':""}><td><button class="btn sut" data-it="${esc(it.id)}" title="${esc(it.ref||"")}">${esc(it.rot)}</button></td>${comp?`<td class="num">${p10(it.f.A,T.A)}</td><td class="num">${p10(it.f.B,T.B)}</td><td class="num">${fnum(it.lr,2)}</td><td class="num">${fpc(it.ph)}</td><td class="num">${fpct(ND.A.size?it.d.A/ND.A.size:NaN)}</td><td class="num">${fpct(ND.B.size?it.d.B/ND.B.size:NaN)}</td><td class="num">${fpc(it.pdh)}</td>`:`<td class="num">${nfmt(it.f.A)}</td><td class="num">${p10(it.f.A,T.A)}</td><td class="num">${nfmt(it.d.A)}</td><td class="num">${fpct(ND.A.size?it.d.A/ND.A.size:NaN)}</td>`}</tr>`).join("")}</table></div>`}
function notaItens(K,tipo){const {R,T,ND,U,D}=K;const [nA,nB]=K.nomes;const ps=[`Universo: ${descUniv(U)}. Corpus: ${descCorpus(K.corp,D,U)}. `+(tipo==="dic"
  ?`Cada categoria é uma lista de termos (palavras e locuções, com * para completar a palavra), procurados sem acento e sem distinção de maiúsculas, com limite de palavra. As listas partem das categorias de metadiscurso de Hyland (2005) e da modalidade em Fairclough (2001), e das estratégias de autorrepresentação positiva e de representação negativa do outro em van Dijk, adaptadas ao vocabulário das decisões judiciais${K.editado?"; as listas usadas aqui foram editadas no painel e vão no .csv":""}.`
  :`Cada padrão é uma expressão regular sobre o texto sem acento, que aproxima uma estrutura de interesse para a análise crítica do discurso (por exemplo, apagamento do agente e impessoalização; os padrões genéricos podem ser substituídos por outros, próprios da pesquisa), na linha de van Leeuwen (2008), Fairclough (2001) e van Dijk.`)];
  if(K.comp)ps.push(`Comparação entre ${nA} (${nfmt(ND.A.size)} decisões, ${nfmt(T.A)} palavras) e ${nB} (${nfmt(ND.B.size)} decisões, ${nfmt(T.B)} palavras). Para as ocorrências, G² com Log Ratio como tamanho do efeito; para a proporção de decisões com ao menos uma ocorrência, teste exato de Fisher. Os dois conjuntos de p-valores têm correção de Holm para ${tipo==="dic"?"as":"os"} ${R.filter(x=>!x.erro).length} ${tipo==="dic"?"categorias":"padrões"}. ${R.filter(x=>x.pdh<.05).map(x=>`${x.rot}: ${fpct(x.d.A/ND.A.size)} × ${fpct(x.d.B/ND.B.size)} das decisões (p ${fpv(x.pdh)})`).join("; ")||"Nenhuma diferença na proporção de decisões resiste à correção"}.`);
  else ps.push(`Lista descritiva sobre ${nfmt(ND.A.size)} decisões e ${nfmt(T.A)} palavras; escolha uma comparação para testar diferenças entre grupos.`);
  ps.push(tipo==="dic"?`Limites: dicionário conta formas, não sentidos. "Deve" pode ser deôntico ou epistêmico, "seguro" pode ser adjetivo ou substantivo, e um termo de vulnerabilidade pode aparecer para ser recusado ("não há falar em estado de necessidade"). A contagem aponta onde ler; a classificação de cada ocorrência cabe à leitura, a partir da aba Palavras em contexto. As ocorrências em ementas transcritas de outros julgados também entram.`
    :`Limites: expressões regulares têm falsos positivos e falsos negativos (a passiva sem agente, por exemplo, inclui particípios que funcionam como adjetivo,). Antes de usar um número no texto, convém conferir uma amostra das ocorrências e registrar a taxa de acerto. Os padrões ficam guardados no projeto e vão no pacote.`);
  return ps}
function subItens(el,tipo){const U=universo();const p=tipo==="dic"?"m":"p";const itens=tipo==="dic"?itensDic():itensPad();
  el.innerHTML=`<form class="an-ctl" id="${p}-f">${ctlCorpus(p+"-c",A.kcorp)}${ctlComp(p,U)}<button class="btn pri" type="submit">Calcular</button></form>
    <details class="quadro" style="padding:10px 14px"><summary class="sub-h">${tipo==="dic"?"Ver e editar as categorias e os termos":"Ver e editar os padrões"}</summary>
    ${tipo==="dic"?`<p class="mini">Cada categoria começa com uma linha <span class="mono"># Nome da categoria | referência (opcional)</span>, seguida de um termo por linha; * completa a palavra; locuções são aceitas. Pode criar categorias próprias da sua pesquisa. Fica guardado no projeto.</p>`
      :`<p class="mini">Um padrão por linha: <span class="mono">rótulo | expressão regular</span>, escrita sem acento e em minúsculas, porque o texto é comparado sem acento. Fica guardado no projeto.</p>`}
    <textarea id="d-ed" rows="12" class="txt mono-in" style="width:100%">${esc(tipo==="dic"?dicParaTexto(itens):padParaTexto(itens))}</textarea>
    <div class="exp"><button class="btn" type="button" id="d-ok">Guardar</button><button class="btn sut" type="button" id="d-rs">Voltar aos ${tipo==="dic"?"dicionários":"padrões"} genéricos</button><span class="mini" id="d-msg" role="status"></span></div></details>
    <div id="an-out" class="an-res"></div>`;
  ligaComp(p,el,e=>subItens(e,tipo));
  $(`#${p}-f`).onsubmit=async e=>{e.preventDefault();A.kcorp=$(`#${p}-c`).value;leComp(p);guardaA();await rodaItens(tipo)};
  const guarda=async v=>{if(tipo==="dic")S.cfg.dic=v;else S.cfg.pad=v;try{await Armazem.gravaProjeto(S.proj)}catch(e){}if(tipo==="dic")AR.mar=null;else AR.pad=null};
  $("#d-ok").onclick=async()=>{const t=$("#d-ed").value;
    if(tipo==="dic"){const D=dicDeTexto(t);if(!D.length){$("#d-msg").textContent="Nenhuma categoria com termos.";return}await guarda(D)}
    else{const P=padDeTexto(t);const ruim=P.find(x=>{try{new RegExp(x.src,"giu");return false}catch(e){return true}});if(ruim){$("#d-msg").textContent=`Expressão inválida em "${ruim.rot}".`;return}await guarda(P)}
    $("#d-msg").textContent="Guardado no projeto. Clique em Calcular."};
  $("#d-rs").onclick=async()=>{await guarda(null);subItens(el,tipo)};
  const K=tipo==="dic"?AR.mar:AR.pad;if(K)desenhaItens(tipo);else $("#an-out").innerHTML=`<div class="pressup">${tipo==="dic"?"Os dicionários contam marcas de modalização e de avaliação; escolha o corpus e a comparação e clique em Calcular.":"Os padrões procuram estruturas sintáticas e argumentativas por expressão regular; escolha o corpus e a comparação e clique em Calcular."}</div>`}
async function rodaItens(tipo){const out=$("#an-out"),U=universo(),prog=progEm(out);prog("Contando…");const D=await corpus(U,A.kcorp,prog);
  const itens=tipo==="dic"?itensDic():itensPad();const r=await contaItens(D,itens,grupoFn(),prog);
  const K={...r,U,D,corp:A.kcorp,comp:!!VARS[A.vvar],nomes:nomesAB(),editado:tipo==="dic"&&!!S.cfg.dic};if(tipo==="dic")AR.mar=K;else AR.pad=K;desenhaItens(tipo)}
function desenhaItens(tipo){const out=$("#an-out"),K=tipo==="dic"?AR.mar:AR.pad;if(!K)return;const ps=notaItens(K,tipo);AR._nota=ps;const svg=K.comp?svgHalteres(K.R,K.T,K.ND,K.nomes):"";
  const term=tipo==="dic"?K.R.find(it=>it.id===A.mterm):null;
  out.innerHTML=`${tabItens(K,tipo)}${svg?`<div class="quadro" id="h-svg" style="padding:8px">${svg}</div>`:""}
    ${term&&term.porTermo?`<div><h3 class="sub-h">Termos de "${esc(term.rot)}"</h3><div class="quadro"><table class="tabela-s"><tr><th>Termo</th><th class="num">${K.comp?esc(K.nomes[0]):"Ocorrências"}</th>${K.comp?`<th class="num">${esc(K.nomes[1])}</th>`:""}<th class="num">Decisões</th></tr>${term.termos.map((t,j)=>[t,term.porTermo[j]]).filter(x=>x[1].A+x[1].B).sort((a,b)=>(b[1].A+b[1].B)-(a[1].A+a[1].B)).map(([t,c])=>`<tr><td><button class="btn sut" data-t="${esc(t)}">${esc(t)}</button></td><td class="num">${nfmt(c.A)}</td>${K.comp?`<td class="num">${nfmt(c.B)}</td>`:""}<td class="num">${nfmt(c.d.size)}</td></tr>`).join("")||'<tr><td colspan="4" class="mini">Nenhum termo encontrado.</td></tr>'}</table></div><p class="mini">Clique num termo para ler as ocorrências.</p></div>`:""}
    <p class="mini" style="margin:0">${tipo==="dic"?"Clique numa categoria para ver os termos que a compõem.":"Clique num padrão para ler as ocorrências na aba Palavras em contexto."} ${K.comp?"Em cinza, as linhas sem diferença que resista à correção de Holm.":""}</p>
    ${htmlNota(ps)}${botoesExp([["x-csv",(tipo==="dic"?"Categorias e termos":"Padrões")+" (.csv)",1],["x-ids","Decisões por item (.csv)"],...(svg?[["x-svg","Gráfico (.svg)"],["x-png","Gráfico (.png)"]]:[]),["x-md","Nota (.md)"]])}`;
  out.querySelectorAll("[data-it]").forEach(b=>b.onclick=()=>{const it=K.R.find(x=>x.id===b.dataset.it);if(tipo==="dic"){A.mterm=it.id;guardaA();desenhaItens(tipo)}else irKwic(it.src,{re:true})});
  out.querySelectorAll("[data-t]").forEach(b=>b.onclick=()=>irKwic(b.dataset.t));
  const base=tipo==="dic"?"Marcadores_modalizacao_avaliacao":"Padroes_sintaticos";
  $("#x-csv").onclick=()=>salvaArq(base+".csv",csv(tipo==="dic"?[["categoria","termo","ocorr_A","ocorr_B","decisoes"],...K.R.flatMap(it=>it.erro?[]:[[it.rot,"(categoria)",it.f.A,it.f.B,it.ids.size],...it.termos.map((t,j)=>[it.rot,t,it.porTermo[j].A,it.porTermo[j].B,it.porTermo[j].d.size])])]
    :[["padrao","expressao","base","ocorr_A","ocorr_B","por10mil_A","por10mil_B","decisoes_A","decisoes_B","log_ratio","p_ocorr_holm","p_acordaos_holm"],...K.R.filter(it=>!it.erro).map(it=>[it.rot,it.src,it.ref,it.f.A,it.f.B,numCSV(K.T.A?1e4*it.f.A/K.T.A:NaN,2),numCSV(K.T.B?1e4*it.f.B/K.T.B:NaN,2),it.d.A,it.d.B,numCSV(it.lr,3),numCSV(it.ph,6),numCSV(it.pdh,6)])]));
  $("#x-ids").onclick=()=>salvaArq(base+"_decisoes.csv",csv([["item","decisao","data","periodo","codigo_fonte"],...K.R.flatMap(it=>it.erro?[]:[...it.ids].map(id=>{const c=S.byId.get(id);return [it.rot,id,dataBR(c.data),periodo(c)||"",codigo(c)||""]}))]));
  if(svg){$("#x-svg").onclick=()=>salvaArq(base+".svg",svg);$("#x-png").onclick=()=>salvaArq(base+".png",svgPng(svg))}
  $("#x-md").onclick=()=>salvaArq(base+".md",mdNota(tipo==="dic"?"Marcadores de modalização e avaliação":"Padrões sintáticos e argumentativos",ps,tipo==="dic"?["hyland","fairclough","vandijk","dunning","hardie","holm"]:["vanleeuwen","fairclough","vandijk","dunning","hardie","holm"]))}
const subMarcas=el=>subItens(el,"dic"),subPadroes=el=>subItens(el,"pad");
