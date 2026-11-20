"use strict";
/* Análises: variáveis do projeto, universo, fonte da codificação e utilidades das notas metodológicas.
   Os testes e as figuras vêm da Mesa de leitura PSR; as variáveis agora saem da planilha e da ficha de cada projeto. */
let A={},AR={},VARS={},_aProj=null;
const A_PADRAO=()=>({sub:"assoc",univ:"",fonte:temSug()?"sug":"hum",soCod:"",linha:"cod",coluna:"",minCat:5,pctEm:"col",sVar:"cod",sVal:"",grao:"ano",ca:"r1",cb:"r2",campo:"c",semLote:true,
  kq:S.cfg.termos?.[0]||"",kre:false,kcorp:"jan",kw:8,kord:"ordem",kf:"",vvar:"",va:"",vb:"",vng:1,vmin:5,vdesc:true,cq:(S.cfg.termos?.[0]||"").split(/\s+/)[0]||"",cw:5,cmin:3,cord:"logdice",cstop:true,
  rq:S.cfg.termos?.[0]||"",rw:5,rmin:3,rk:10,r2:4,rk2:4,bn:4,bmin:5,bnd:3,bdesc:false,bord:"f",mterm:""});
function iniciaA(){
  montaVars();
  if(_aProj!==S.proj.id){_aProj=S.proj.id;A=Object.assign(A_PADRAO(),lsGet("painel-an-"+S.proj.id,{}));AR={}}
  if(!VARS[A.linha])A.linha="cod";
  if(!A.coluna||!VARS[A.coluna]||A.coluna===A.linha)A.coluna=Object.keys(VARS).find(k=>k!==A.linha&&!VARS[k].multi)||"";
  if(!VARS[A.sVar]||VARS[A.sVar].multi)A.sVar="cod";
  if(A.vvar&&!VARS[A.vvar])A.vvar="";
  if(!fontes().some(f=>f[0]===A.fonte))A.fonte=temSug()?"sug":"hum";
  if(A.soCod&&!LIVRO().some(x=>x.cod===A.soCod))A.soCod="";
  const cf=cFontes().map(x=>x[0]);if(!cf.includes(A.ca))A.ca="r1";if(!cf.includes(A.cb))A.cb="r2";
  if(!cCampos().some(x=>x[0]===A.campo))A.campo="c";
}
function guardaA(){const o={};for(const [k,v] of Object.entries(A))if(k[0]!=="_")o[k]=v;lsSet("painel-an-"+S.proj.id,o)}
const fontes=()=>[["hum","leitura humana: consenso, senão revisor 1, senão revisor 2"],["r1",nomeRev(1)+" (revisor 1)"],["r2",nomeRev(2)+" (revisor 2)"],["cons","só consenso"],...(temSug()?[["sug","codificação prévia da planilha"]]:[])];
const fonteTxt=f=>(fontes().find(x=>x[0]===f)||[,f])[1];
function regH(c,f){const a=S.rev[1][c.id],b=S.rev[2][c.id],k=S.cons[c.id];
  if(f==="r1")return a&&a.c?a:null;if(f==="r2")return b&&b.c?b:null;
  if(f==="cons")return k&&k.c?{...(a||{}),...k}:null;
  if(k&&k.c)return {...(a&&a.c?a:b||{}),...k};return a&&a.c?a:b&&b.c?b:null}
const codigo=(c,f=A.fonte)=>f==="sug"?(c.sug||null):(regH(c,f)?.c||null);
function valorCampo(c,fl,f=A.fonte){
  let v=f==="sug"?sugCampo(c,fl):regH(c,f)?.[fl.id];
  if(Array.isArray(v))return v.length?v:null;return v==null||v===""?null:String(v)}
function montaVars(){
  const V={};
  if(S.cfg.cols.data)V.ano={t:"Ano da decisão",num:1,g:c=>c.data?c.data.slice(0,4):null,gr:"proc"};
  if(S.cfg.marcos?.length)V.per={k:"per",t:"Período (marcos temporais)",ord:periodosRot(),g:c=>periodo(c),gr:"proc"};
  if(S.cfg.cols.orgao)V.orgao={t:"Órgão julgador",g:c=>c.orgao||null,gr:"proc"};
  if(S.cfg.cols.classe)V.classe={t:"Classe processual",g:c=>c.classe||null,gr:"proc"};
  (S.cfg.extras||[]).filter(e=>e.tipo==="cat").forEach(e=>V["x:"+e.col]={t:e.rot,g:c=>c.x[e.col]||null,gr:"plan"});
  V.cod={t:"Código",fonte:1,ord:LIVRO().map(x=>x.cod),g:c=>codigo(c),rot:v=>codRot(v),gr:"tri"};
  CAMPOS().filter(f=>f.tipo!=="texto").forEach(f=>V["f:"+f.id]={t:f.rot,fonte:1,multi:f.tipo==="multipla"?1:0,ord:f.tipo==="simnao"?["sim","não"]:f.opcoes,g:c=>valorCampo(c,f),gr:"tri"});
  VARS=V;
}
const GRUPOS_VAR=[["proc","Processo e julgamento"],["plan","Colunas da planilha"],["tri","Codificação (segue a fonte escolhida)"]];
const rotV=(v,x)=>x===OUTRAS?x:v.rot?v.rot(x):x;
function selVar(id,val,{semMulti,vazio}={}){return `<select id="${id}">${vazio?`<option value="">${vazio}</option>`:""}${GRUPOS_VAR.map(([g,t])=>`<optgroup label="${t}">${Object.entries(VARS).filter(([k,v])=>v.gr===g&&!(semMulti&&v.multi)).map(([k,v])=>`<option value="${esc(k)}"${k===val?" selected":""}>${esc(v.t)}</option>`).join("")}</optgroup>`).join("")}</select>`}
function universo(){let U=A.univ==="fila"?S.lista.map(id=>S.byId.get(id)):S.casos.filter(c=>!A.univ||c.camada===A.univ);if(A.soInc)U=U.filter(c=>codigo(c)==="INC");return U}
function descUniv(U){const b=A.univ==="P"?"o recorte 2020-2024":A.univ==="S"?"a camada 2025-2026":A.univ==="fila"?"a fila da Leitura com os filtros em uso":"toda a base (2020-2026)";
  return `${b}${A.soInc?`, só os acórdãos codificados como INC pela fonte "${FONTE_TXT[A.fonte]}"`:""} (${nfmt(U.length)} acórdãos)`}
function ordenaCats(cats,v,cnt){const ord=v.ord||(cats.every(x=>x==="sim"||x==="não")?["sim","não"]:null);
  if(ord)return cats.sort((a,b)=>(ord.indexOf(a)+1||99)-(ord.indexOf(b)+1||99)||String(a).localeCompare(b));
  if(v.num)return cats.sort();return cats.sort((a,b)=>cnt.get(b)-cnt.get(a)||String(a).localeCompare(b))}
function categorias(vals,v,minCat){const cnt=new Map();vals.forEach(x=>cnt.set(x,(cnt.get(x)||0)+1));let cats=ordenaCats([...cnt.keys()],v,cnt);
  let outras=[];if(minCat>0&&!v.num&&cats.length>2)outras=cats.filter(x=>cnt.get(x)<minCat);
  if(outras.length>=2&&cats.length-outras.length>=1){cats=cats.filter(x=>!outras.includes(x));cats.push(OUTRAS)}else outras=[];
  const map=new Map(cats.map(x=>[x,x]));outras.forEach(x=>map.set(x,OUTRAS));return {cats,map,outras,cnt}}
function universo(){let U=A.univ==="fila"?S.lista.map(id=>S.byId.get(id)):S.casos;if(A.soCod)U=U.filter(c=>codigo(c)===A.soCod);return U}
function descUniv(U){const b=A.univ==="fila"?"a fila da Leitura com os filtros em uso":`todas as decisões do projeto “${S.cfg.nome}”`;
  return `${b}${A.soCod?`, só as codificadas como ${codRot(A.soCod)} pela fonte "${fonteTxt(A.fonte)}"`:""} (${nfmt(U.length)} decisões)`}
function rodapeNota(){const n1=Object.values(S.rev[1]).filter(r=>r&&r.c).length,n2=Object.values(S.rev[2]).filter(r=>r&&r.c).length,nk=Object.values(S.cons).filter(r=>r&&r.c).length;
  return `Análise gerada no Painel de decisões em ${hojeBR()}, sobre o projeto “${S.cfg.nome}” e a codificação gravada naquele momento (revisor 1: ${nfmt(n1)} códigos; revisor 2: ${nfmt(n2)}; consensos: ${nfmt(nk)}).`}
const REFS={
  agresti:"AGRESTI, Alan. An introduction to categorical data analysis. 2. ed. Hoboken: Wiley, 2007.",
  haberman:"HABERMAN, Shelby J. The analysis of residuals in cross-classified tables. Biometrics, v. 29, n. 1, p. 205-220, 1973.",
  bergsma:"BERGSMA, Wicher. A bias-correction for Cramér's V and Tschuprow's T. Journal of the Korean Statistical Society, v. 42, n. 3, p. 323-328, 2013.",
  cohen88:"COHEN, Jacob. Statistical power analysis for the behavioral sciences. 2. ed. Hillsdale: Lawrence Erlbaum, 1988.",
  hope:"HOPE, A. C. A. A simplified Monte Carlo significance test procedure. Journal of the Royal Statistical Society: Series B, v. 30, n. 3, p. 582-598, 1968.",
  holm:"HOLM, Sture. A simple sequentially rejective multiple test procedure. Scandinavian Journal of Statistics, v. 6, n. 2, p. 65-70, 1979.",
  wilson:"WILSON, Edwin B. Probable inference, the law of succession, and statistical inference. Journal of the American Statistical Association, v. 22, n. 158, p. 209-212, 1927.",
  newcombe:"NEWCOMBE, Robert G. Interval estimation for the difference between independent proportions: comparison of eleven methods. Statistics in Medicine, v. 17, n. 8, p. 873-890, 1998.",
  armitage:"ARMITAGE, P. Tests for linear trends in proportions and frequencies. Biometrics, v. 11, n. 3, p. 375-386, 1955.",
  cohen60:"COHEN, Jacob. A coefficient of agreement for nominal scales. Educational and Psychological Measurement, v. 20, n. 1, p. 37-46, 1960.",
  fleiss:"FLEISS, Joseph L.; COHEN, Jacob; EVERITT, B. S. Large sample standard errors of kappa and weighted kappa. Psychological Bulletin, v. 72, n. 5, p. 323-327, 1969.",
  kripp:"KRIPPENDORFF, Klaus. Content analysis: an introduction to its methodology. 2. ed. Thousand Oaks: Sage, 2004.",
  byrt:"BYRT, Ted; BISHOP, Janet; CARLIN, John B. Bias, prevalence and kappa. Journal of Clinical Epidemiology, v. 46, n. 5, p. 423-429, 1993.",
  landis:"LANDIS, J. Richard; KOCH, Gary G. The measurement of observer agreement for categorical data. Biometrics, v. 33, n. 1, p. 159-174, 1977.",
  dunning:"DUNNING, Ted. Accurate methods for the statistics of surprise and coincidence. Computational Linguistics, v. 19, n. 1, p. 61-74, 1993.",
  rayson:"RAYSON, Paul; GARSIDE, Roger. Comparing corpora using frequency profiling. In: WORKSHOP ON COMPARING CORPORA, 2000, Hong Kong. Proceedings [...]. Stroudsburg: ACL, 2000. p. 1-6.",
  hardie:"HARDIE, Andrew. Log Ratio: an informal introduction. Lancaster: ESRC Centre for Corpus Approaches to Social Science, 2014.",
  evert:"EVERT, Stefan. Corpora and collocations. In: LÜDELING, Anke; KYTÖ, Merja (ed.). Corpus linguistics: an international handbook. Berlin: De Gruyter, 2008. v. 2, p. 1212-1248.",
  rychly:"RYCHLÝ, Pavel. A lexicographer-friendly association score. In: RECENT ADVANCES IN SLAVONIC NATURAL LANGUAGE PROCESSING (RASLAN), 2., 2008, Brno. Proceedings [...]. Brno: Masaryk University, 2008. p. 6-9."};
function htmlNota(ps){return `<div class="nota" id="an-nota"><span class="rot">Nota metodológica</span>${ps.map(p=>`<p>${esc(p)}</p>`).join("")}</div>`}
function mdNota(titulo,ps,refs){return `# ${titulo}\n\n${ps.join("\n\n")}\n\n${rodapeNota()}\n\n## Referências de método\n\nDados bibliográficos registrados de memória, sem cotejo com os originais; conferir antes de citar.\n\n${refs.map(k=>"- "+REFS[k]).join("\n")}\n`}
function botoesExp(b){return `<div class="exp">${b.map(([id,t,pri])=>`<button class="btn${pri?" pri":""}" id="${id}">${t}</button>`).join("")}<span class="mini" id="an-msg" role="status"></span></div>`}
function abreNaLeitura(ids,rot,sel){if(!ids.length)return;limpaFiltros();Object.assign(S.f,{sit:"todos",ids:{rot,set:new Set(ids)}});S.sel=sel||ids[0];location.hash="a-"+encodeURIComponent(S.sel)}
"use strict";
/* ---------- análises: figuras em SVG ---------- */
function svgMatriz(o){
  const P=paleta(),cw=o.cw||Math.min(150,Math.max(86,...[...o.cl,o.extraCol?.t||""].map(s=>Math.min(String(s).length,20)*6.4+18)));
  const lw=Math.min(250,Math.max(110,...o.rl.map(s=>Math.min(String(s).length,34)*6.6+22)));
  const heads=[...o.cl,...(o.extraCol?[o.extraCol.t]:[])].map(s=>quebra(s,Math.max(8,Math.floor((cw-10)/6.4))));
  const hh=Math.max(...heads.map(l=>l.length))*14+30,rh=46,nr=o.rl.length+(o.extraRow?1:0),nc=heads.length;
  const W=Math.max(lw+cw*nc+12,o.leg?(o.legW||820):0),Hm=hh+rh*nr,H=Hm+(o.leg?64:12);
  const t=(x,y,s,a={})=>`<text x="${x}" y="${y}"${Object.entries(a).map(([k,v])=>` ${k}="${v}"`).join("")}>${esc(s)}</text>`;
  let s=`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="IBM Plex Sans, Helvetica, Arial, sans-serif"><rect width="${W}" height="${H}" fill="${P.papel}"/>`;
  s+=t(8,16,o.tl.toUpperCase(),{"font-size":10.5,"font-weight":600,"letter-spacing":".05em",fill:P.tinta3});
  s+=t(lw,16,o.tc.toUpperCase(),{"font-size":10.5,"font-weight":600,"letter-spacing":".05em",fill:P.tinta3});
  heads.forEach((L,j)=>L.forEach((ln,q)=>{s+=t(lw+j*cw+cw/2,hh-10-(L.length-1-q)*14,ln,{"font-size":12,"text-anchor":"middle",fill:P.tinta2})}));
  const rl=[...o.rl,...(o.extraRow?[o.extraRow.t]:[])];
  rl.forEach((lab,i)=>{const L=quebra(lab,Math.floor((lw-20)/6.6),2),y=hh+i*rh+rh/2;L.forEach((ln,q)=>{s+=t(lw-10,y+4+(q-(L.length-1)/2)*14,ln,{"font-size":12,"text-anchor":"end",fill:P.tinta})})});
  const cel=(x,y,c,tot)=>{const fill=tot?P.sup:c.fill;const ink=tot?P.tinta:tintaSobre(fill,P);
    return `<g${c.data?` data-cell="${c.data}"`:""}${c.tip?` data-tip="${esc(c.tip)}"`:""}><rect x="${x+1}" y="${y+1}" width="${cw-2}" height="${rh-2}" rx="2" fill="${fill}"${c.forte?` stroke="${P.tinta}" stroke-width="2"`:""}/>`+
      t(x+cw/2,y+(c.b?20:27),c.a,{"font-size":14,"font-weight":600,"text-anchor":"middle",fill:ink,"font-family":"IBM Plex Mono, Menlo, monospace"})+
      (c.b?t(x+cw/2,y+36,c.b,{"font-size":11,"text-anchor":"middle",fill:ink}):"")+`</g>`};
  o.rl.forEach((_,i)=>{o.cl.forEach((_,j)=>{s+=cel(lw+j*cw,hh+i*rh,o.cell(i,j))});if(o.extraCol)s+=cel(lw+o.cl.length*cw,hh+i*rh,o.extraCol.cell(i),1)});
  if(o.extraRow){o.cl.forEach((_,j)=>{s+=cel(lw+j*cw,hh+o.rl.length*rh,o.extraRow.cell(j),1)});if(o.extraCol&&o.extraRow.canto)s+=cel(lw+o.cl.length*cw,hh+o.rl.length*rh,o.extraRow.canto,1)}
  if(o.leg)s+=o.leg(Hm+18,W,P);
  return s+"</svg>"}
function legDiv(zc){return (y,W,P)=>{const x0=12,w=26;let s="";[-4,-3,-2,-1,0,1,2,3,4].forEach((z,i)=>{s+=`<rect x="${x0+i*w}" y="${y}" width="${w-2}" height="12" rx="1" fill="${corZ(z,P)}"/>`;if(z%2===0)s+=`<text x="${x0+i*w+(w-2)/2}" y="${y+26}" font-size="10.5" text-anchor="middle" fill="${P.tinta3}">${z>0?"+":""}${z}</text>`});
  const tx=x0+9*w+14;return s+`<text x="${tx}" y="${y+10}" font-size="11.5" fill="${P.tinta2}">Resíduo padronizado ajustado: azul acima do esperado sob independência, vermelho abaixo.</text><text x="${tx}" y="${y+26}" font-size="11.5" fill="${P.tinta2}">* |z| &gt; 1,96 sem correção · ** |z| &gt; ${fnum(zc,2)} com Bonferroni (célula contornada)</text>`}}
function corZ(z,P){const t=Math.min(1,Math.abs(z)/4);return mix(P.neu,z>=0?P.pos:P.neg,Math.sqrt(t)*.92)}
function svgSerie(r){
  const P=paleta(),W=Math.max(640,90*r.bins.length+80),H=330,ml=58,mr=24,mt=30,mb=74,iw=W-ml-mr,ih=H-mt-mb,nb=r.bins.length,stp=iw/nb;
  const top=Math.max(.05,...r.bins.filter(b=>b.n).map(b=>b.hi));const passos=[.01,.02,.05,.1,.2,.25];const st=passos.find(p=>top/p<=6)||.25;const ymax=Math.min(1,Math.ceil(top/st)*st);
  const X=i=>ml+(i+.5)*stp,Y=v=>mt+ih-(v/ymax)*ih;
  let s=`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="IBM Plex Sans, Helvetica, Arial, sans-serif"><rect width="${W}" height="${H}" fill="${P.papel}"/>`;
  for(let v=0;v<=ymax+1e-9;v+=st){s+=`<line x1="${ml}" x2="${W-mr}" y1="${Y(v)}" y2="${Y(v)}" stroke="${P.linha}" stroke-width="1"/><text x="${ml-8}" y="${Y(v)+4}" font-size="11" text-anchor="end" fill="${P.tinta3}">${fnum(100*v,Math.round(v*1000)%10?1:0)}%</text>`}
  (S.cfg.marcos||[]).forEach((mc,q)=>{const tm=Date.parse(mc.data+"T00:00:00Z");const bi=r.bins.findIndex(b=>tm>=b.t0&&tm<b.t1);
    if(bi>=0){const b=r.bins[bi],xm=X(bi)-stp/2+stp*(tm-b.t0)/(b.t1-b.t0);s+=`<line x1="${xm}" x2="${xm}" y1="${mt-6}" y2="${mt+ih}" stroke="${P.tinta2}" stroke-width="1.5" stroke-dasharray="4 4"/><text x="${xm+6}" y="${mt-12+(q%2)*12}" font-size="11" fill="${P.tinta2}">${esc(mc.rot)} (${dataBR(mc.data)})</text>`}});
  const pts=r.bins.map((b,i)=>b.n?[X(i),Y(b.p)]:null);
  let d="";pts.forEach((p,i)=>{if(p)d+=(d&&pts[i-1]?"L":"M")+p[0].toFixed(1)+" "+p[1].toFixed(1)});
  s+=`<path d="${d}" fill="none" stroke="${P.caneta}" stroke-width="2"/>`;
  r.bins.forEach((b,i)=>{const x=X(i);if(b.n){s+=`<g data-tip="${esc(`${b.lab}: ${fpct(b.p)} (${b.x} de ${b.n}); IC 95% de Wilson ${fpct(b.lo)} a ${fpct(b.hi)}`)}"><rect x="${x-stp/2}" y="${mt}" width="${stp}" height="${ih}" fill="transparent"/><line x1="${x}" x2="${x}" y1="${Y(b.lo)}" y2="${Y(b.hi)}" stroke="${P.caneta}" stroke-width="1.5" opacity=".55"/><line x1="${x-5}" x2="${x+5}" y1="${Y(b.lo)}" y2="${Y(b.lo)}" stroke="${P.caneta}" stroke-width="1.5" opacity=".55"/><line x1="${x-5}" x2="${x+5}" y1="${Y(b.hi)}" y2="${Y(b.hi)}" stroke="${P.caneta}" stroke-width="1.5" opacity=".55"/><circle cx="${x}" cy="${Y(b.p)}" r="5" fill="${b.n<30?P.papel:P.caneta}" stroke="${P.caneta}" stroke-width="2"/></g>`}
    s+=`<text x="${x}" y="${mt+ih+20}" font-size="11.5" text-anchor="middle" fill="${P.tinta2}">${esc(b.lab)}</text><text x="${x}" y="${mt+ih+36}" font-size="10.5" text-anchor="middle" fill="${P.tinta3}">n = ${nfmt(b.n)}</text>`});
  s+=`<text x="${ml}" y="${H-12}" font-size="11" fill="${P.tinta3}">Ponto vazado: menos de 30 decisões no intervalo. Barras: intervalo de confiança de 95% (Wilson).</text>`;
  return s+"</svg>"}
/* ---------- análises: vista ---------- */
const AN_SUBS=[["assoc","Associação"],["serie","Série no tempo"],["conc","Concordância"],["kwic","Palavras em contexto"],["vocab","Vocabulário"],["coloc","Colocações"],["rede","Rede de colocações"],["pacotes","Pacotes lexicais"],["marcas","Modalização e avaliação"],["padroes","Padrões sintáticos"]];
function vistaAnalises(m){
  iniciaA();
  if(!$(".an")){m.innerHTML=`<div class="pagina an"><div class="pagina-in">
    <div class="sec-t"><div><h2>Análises</h2><p class="lead">Testes de associação, séries no tempo, concordância entre codificações e leitura de corpus sobre as decisões do projeto e a codificação gravada neste navegador. Cada resultado traz o n, os pressupostos do teste e uma nota metodológica que se pode adaptar no texto; nada nesta aba altera a codificação.</p></div></div>
    <div class="seg an-nav" id="an-nav" role="tablist"></div>
    <div class="an-univ" id="an-univ"></div>
    <div id="an-corpo" class="an-res"></div></div></div>`;
    $("#an-nav").onclick=e=>{const b=e.target.closest("button");if(!b)return;A.sub=b.dataset.s;guardaA();desenhaAnNav();desenhaSub()};
    $("#an-corpo").addEventListener("click",e=>{const g=e.target.closest("[data-cell]");if(g&&AR._clique){AR._clique(g.dataset.cell)}});}
  desenhaAnNav();desenhaUniv();desenhaSub()}
function desenhaAnNav(){$("#an-nav").innerHTML=AN_SUBS.map(([k,t])=>`<button data-s="${k}" role="tab" aria-pressed="${A.sub===k}">${t}</button>`).join("")}
function desenhaUniv(){
  const el=$("#an-univ");const U=universo();
  el.innerHTML=`<label for="an-u">Universo<select id="an-u">${[["","Todas as decisões do projeto"],["fila",`Fila atual da Leitura (${nfmt(S.lista.length)})`]].map(([v,t])=>`<option value="${v}"${A.univ===v?" selected":""}>${t}</option>`).join("")}</select></label>
    <label for="an-f">Fonte da codificação<select id="an-f">${fontes().map(([v,t])=>`<option value="${v}"${A.fonte===v?" selected":""}>${esc(t)}</option>`).join("")}</select></label>
    <label for="an-sc">Só com o código<select id="an-sc"><option value="">qualquer código</option>${LIVRO().map(x=>`<option value="${esc(x.cod)}"${A.soCod===x.cod?" selected":""}>${esc(codRot(x.cod))}</option>`).join("")}</select></label>
    <span class="mini" style="margin-left:auto">${nfmt(U.length)} decisões no universo · ${nfmt(U.filter(c=>codigo(c)).length)} com código da fonte</span>`;
  el.onchange=e=>{const id=e.target.id;if(id==="an-u")A.univ=e.target.value;else if(id==="an-f")A.fonte=e.target.value;else if(id==="an-sc")A.soCod=e.target.value;else return;AR.kwic=AR.vocab=AR.coloc=AR.rede=AR.pac=AR.mar=AR.pad=null;guardaA();desenhaUniv();desenhaSub()}}
function desenhaSub(){AR._clique=null;const f={assoc:subAssoc,serie:subSerie,conc:subConc,kwic:subKwic,vocab:subVocab,coloc:subColoc,rede:subRede,pacotes:subPacotes,marcas:subMarcas,padroes:subPadroes}[A.sub]||subAssoc;f($("#an-corpo"))}
function refazAnalise(){if(S.view!=="analises"||!$(".an"))return;if(["assoc","serie","conc"].includes(A.sub)){desenhaUniv();desenhaSub()}}

/* associação */
function calcAssoc(U){
  const vr=VARS[A.linha],vc=VARS[A.coluna];
  if(A.linha===A.coluna)return {erro:"Escolha duas variáveis diferentes para linhas e colunas."};
  if(vr.multi&&vc.multi)return {erro:"As duas variáveis admitem mais de uma resposta por decisão. Escolha uma delas com resposta única."};
  if(vr.multi||vc.multi)return calcMulti(U,vr.multi?A.linha:A.coluna,vr.multi?A.coluna:A.linha);
  const pares=[];U.forEach(c=>{const a=vr.g(c),b=vc.g(c);if(a!=null&&b!=null)pares.push([a,b,c.id])});
  const cr=categorias(pares.map(p=>p[0]),vr,A.minCat),cc=categorias(pares.map(p=>p[1]),vc,A.minCat);
  if(cr.cats.length<2||cc.cats.length<2)return {erro:`Nesse universo, ${cr.cats.length<2?vr.t:vc.t} tem uma só categoria com valor (${pares.length} decisões com as duas variáveis preenchidas). Amplie o universo ou troque a variável.`};
  const O=cr.cats.map(()=>cc.cats.map(()=>0)),ids=cr.cats.map(()=>cc.cats.map(()=>[]));
  pares.forEach(([a,b,id])=>{const i=cr.cats.indexOf(cr.map.get(a)),j=cc.cats.indexOf(cc.map.get(b));O[i][j]++;ids[i][j].push(id)});
  return {tipo:"tab",n:pares.length,miss:U.length-pares.length,vr,vc,cr,cc,ids,...indep(O)}}
function calcMulti(U,km,ko){
  const vm=VARS[km],vo=VARS[ko],un=[];U.forEach(c=>{const a=vm.g(c),b=vo.g(c);if(a&&b!=null)un.push([a,b,c.id])});
  const cc=categorias(un.map(u=>u[1]),vo,A.minCat);if(cc.cats.length<2)return {erro:`${vo.t} tem uma só categoria entre as ${un.length} decisões com ${vm.t} preenchido.`};
  const cntM=new Map();un.forEach(u=>u[0].forEach(x=>cntM.set(x,(cntM.get(x)||0)+1)));const cats=ordenaCats([...cntM.keys()],vm,cntM);
  const C=cc.cats.map(x=>un.filter(u=>cc.map.get(u[1])===x).length);
  const linhas=cats.map(mc=>{const com=cc.cats.map(x=>un.filter(u=>cc.map.get(u[1])===x&&u[0].includes(mc)).length);const O=[com,com.map((v,j)=>C[j]-v)];
    const ids=cc.cats.map(x=>un.filter(u=>cc.map.get(u[1])===x&&u[0].includes(mc)).map(u=>u[2]));
    const t=O[1].every(v=>v===0)||O[0].every(v=>v===0)?null:indep(O);return {mc,com,n:com.reduce((a,b)=>a+b,0),t,ids,p:t?(t.fisher??t.mc?.p??t.p):NaN}});
  const ph=ST.holm(linhas.map(l=>Number.isFinite(l.p)?l.p:1));linhas.forEach((l,i)=>l.pH=ph[i]);
  return {tipo:"multi",vm,vo,cc,C,linhas,n:un.length,miss:U.length-un.length}}
function subAssoc(el){
  const U=universo();
  el.innerHTML=`<div class="an-ctl"><label for="a-l">Linhas${selVar("a-l",A.linha)}</label><button class="btn sut" id="a-tr" title="Trocar linhas e colunas" style="align-self:end">⇄</button><label for="a-c">Colunas${selVar("a-c",A.coluna)}</label>
    <label for="a-p">Percentual<select id="a-p"><option value="col"${A.pctEm==="col"?" selected":""}>na coluna</option><option value="lin"${A.pctEm==="lin"?" selected":""}>na linha</option></select></label>
    <label for="a-m">Agrupar categorias com menos de<input type="number" id="a-m" min="0" max="50" value="${A.minCat}" style="width:80px"></label></div><div id="an-out" class="an-res"></div>`;
  el.querySelector(".an-ctl").onchange=e=>{const id=e.target.id;if(id==="a-l")A.linha=e.target.value;else if(id==="a-c")A.coluna=e.target.value;else if(id==="a-p")A.pctEm=e.target.value;else if(id==="a-m")A.minCat=Math.max(0,Math.min(50,+e.target.value||0));guardaA();desenhaAssoc(U)};
  $("#a-tr").onclick=()=>{[A.linha,A.coluna]=[A.coluna,A.linha];guardaA();subAssoc(el)};
  desenhaAssoc(U)}
function desenhaAssoc(U){
  const out=$("#an-out");const r=calcAssoc(U);AR.assoc=r;
  if(r.erro){out.innerHTML=`<div class="pressup alerta">${esc(r.erro)}</div>`;return}
  if(r.tipo==="multi")return desenhaMulti(out,r,U);
  const P=paleta(),{O,E,R,C,n,Z,zc}=r,rl=r.cr.cats.map(x=>rotV(r.vr,x)),cl=r.cc.cats.map(x=>rotV(r.vc,x));
  const pc=(i,j)=>A.pctEm==="col"?O[i][j]/C[j]:O[i][j]/R[i];
  const svg=svgMatriz({tl:r.vr.t,tc:r.vc.t,rl,cl,
    cell:(i,j)=>{const z=Z[i][j],ast=Math.abs(z)>zc?"**":Math.abs(z)>1.96?"*":"";return {a:nfmt(O[i][j]),b:fpct(pc(i,j))+ast,fill:corZ(z,P),forte:Math.abs(z)>zc,data:i+","+j,
      tip:`${rl[i]} × ${cl[j]}: ${O[i][j]} decisões (esperado ${fnum(E[i][j],1)}); ${fpct(O[i][j]/R[i])} da linha, ${fpct(O[i][j]/C[j])} da coluna; resíduo ajustado ${fnum(z,2)}. Clique para abrir na Leitura.`}},
    extraCol:{t:"Total",cell:i=>({a:nfmt(R[i]),b:A.pctEm==="col"?fpct(R[i]/n):"100%"})},
    extraRow:{t:"Total",cell:j=>({a:nfmt(C[j]),b:A.pctEm==="col"?"100%":fpct(C[j]/n)}),canto:{a:nfmt(n),b:""}},leg:legDiv(zc)});
  AR._svg=svg;AR._clique=k=>{const [i,j]=k.split(",").map(Number);abreNaLeitura(r.ids[i][j],`${r.vr.t}: ${rl[i]} · ${r.vc.t}: ${cl[j]}`)};
  const viol=r.pctBaixo>.2||r.minE<1;
  const pPrinc=r.fisher!=null?r.fisher:r.mc?r.mc.p:r.p,rotP=r.fisher!=null?"Fisher, bilateral":r.mc?"Monte Carlo":"qui-quadrado";
  const ps=notaAssoc(r,U);AR._nota=ps;
  out.innerHTML=`<div class="an-cards">
      <div class="card"><span class="rot">Decisões na tabela</span><span class="v">${nfmt(n)}</span><span class="mini">${nfmt(r.miss)} fora por falta de valor${r.cr.outras.length||r.cc.outras.length?` · categorias raras agrupadas`:""}</span></div>
      <div class="card"><span class="rot">Qui-quadrado de Pearson</span><span class="v">${fnum(r.chi,2)}</span><span class="mini">${r.df} graus de liberdade · p ${fpv(r.p)}</span></div>
      <div class="card"><span class="rot">p (${rotP})</span><span class="v">${fpc(pPrinc)}</span><span class="mini">${r.mc?`${nfmt(r.mc.B)} tabelas simuladas, erro-padrão ${fnum(r.mc.se,4)}`:r.fisher!=null?`razão de chances ${fnum(r.or[0],2)} (IC 95% ${fnum(r.or[1],2)} a ${fnum(r.or[2],2)})`:"aproximação assintótica"}</span></div>
      <div class="card"><span class="rot">V de Cramér</span><span class="v">${fnum(r.V,3)}</span><span class="mini">corrigido ${fnum(r.Vc,3)} · magnitude ${magV(r.V,r.m)}</span></div></div>
    <div class="pressup${viol?" alerta":""}">${viol?`Pressuposto do qui-quadrado não atendido: ${r.baixo} de ${r.cells} células (${fpct(r.pctBaixo,0)}) têm frequência esperada abaixo de 5 e a menor é ${fnum(r.minE,2)}. ${r.fisher!=null?"Vale o teste exato de Fisher.":"Vale o p de Monte Carlo; agrupar categorias raras também ajuda."}`:`Frequências esperadas adequadas: ${r.baixo} de ${r.cells} células abaixo de 5 (limite usual de 20%); menor esperada ${fnum(r.minE,2)}.`} Os percentuais são ${A.pctEm==="col"?"da coluna":"da linha"}. Clique numa célula para abrir as decisões na Leitura.</div>
    <div class="graf">${svg}</div>${htmlNota(ps)}
    ${botoesExp([["x-csv","Tabela (.csv)",1],["x-png","Figura (.png)"],["x-svg","Figura (.svg)"],["x-md","Nota (.md)"]])}`;
  const base=`Associacao_${nomeArq(r.vr.t)}_x_${nomeArq(r.vc.t)}`;
  $("#x-csv").onclick=()=>{const L=[["linha","coluna","observado","esperado","pct_linha","pct_coluna","residuo_ajustado"]];r.cr.cats.forEach((x,i)=>r.cc.cats.forEach((y,j)=>L.push([rl[i],cl[j],O[i][j],numCSV(E[i][j],3),numCSV(100*O[i][j]/R[i],2),numCSV(100*O[i][j]/C[j],2),numCSV(Z[i][j],3)])));salvaArq(base+".csv",csv(L))};
  $("#x-png").onclick=()=>salvaArq(base+".png",svgPng(svg));$("#x-svg").onclick=()=>salvaArq(base+".svg",svg);
  $("#x-md").onclick=()=>salvaArq(base+".md",mdNota(`Associação entre ${r.vr.t} e ${r.vc.t}`,ps,["agresti","haberman","bergsma","cohen88",...(r.mc?["hope"]:[])]))}
function txtFonte(...vs){return vs.some(v=>v.fonte)?` O código e os campos da ficha vêm da fonte "${fonteTxt(A.fonte)}".${A.fonte==="cons"||A.fonte==="hum"?" Nos campos que o consenso não registra, vale o registro do revisor 1, ou do revisor 2 na falta dele.":""}`:""}
function limitesTxt(vs){let s="Limites: as decisões não formam amostra aleatória, e sim o universo recuperado pelos termos de busca da coleta; o p-valor diz quão improvável seria a distribuição observada se as variáveis fossem independentes e não autoriza generalização para além desse universo. Associação não estabelece causa.";
  if(vs.some(v=>v.k==="per"))s+=" Quando o período entra na tabela, a diferença entre períodos pode refletir a composição da pauta, dos órgãos julgadores e da própria coleta, além do marco temporal.";
  if(vs.some(v=>v.fonte)){if(A.fonte==="sug")s+=" A codificação prévia da planilha não passou, por si, por revisão humana.";else s+=" A leitura humana cobre só as decisões já codificadas; se a ordem de revisão se relaciona com as variáveis, o resultado parcial carrega viés de seleção."}
  return s}
function notaAssoc(r,U){
  const rl=r.cr.cats.map(x=>rotV(r.vr,x)),cl=r.cc.cats.map(x=>rotV(r.vc,x)),ps=[];
  const outras=[...r.cr.outras.map(x=>rotV(r.vr,x)),...r.cc.outras.map(x=>rotV(r.vc,x))];
  ps.push(`Universo: ${descUniv(U)}. A tabela cruza ${r.vr.t} (linhas) e ${r.vc.t} (colunas) em ${nfmt(r.n)} decisões; ${nfmt(r.miss)} ficaram de fora por não terem valor em uma das variáveis.${outras.length?` Categorias com menos de ${A.minCat} decisões foram reunidas em "outras categorias" (${outras.join("; ")}).`:""}${txtFonte(r.vr,r.vc)}`);
  let t=`Teste qui-quadrado de Pearson para independência: χ²(${r.df}) = ${fnum(r.chi,2)}, p ${fpv(r.p)}. V de Cramér = ${fnum(r.V,3)} (${fnum(r.Vc,3)} com a correção de viés de Bergsma), magnitude ${magV(r.V,r.m)} pelas convenções de Cohen ajustadas a ${r.m} ${r.m>1?"graus":"grau"} de liberdade da menor dimensão.`;
  if(r.fisher!=null)t+=` Teste exato de Fisher, bilateral: p ${fpv(r.fisher)}. Razão de chances de "${rl[0]}" em "${cl[0]}" em relação a "${cl[1]}": ${fnum(r.or[0],2)}, com intervalo de confiança de 95% de ${fnum(r.or[1],2)} a ${fnum(r.or[2],2)} (Woolf${r.haldane?", com correção de Haldane por haver célula zero":""}).`;
  if(r.pctBaixo>.2||r.minE<1)t+=` Como ${r.baixo} das ${r.cells} células (${fpct(r.pctBaixo,0)}) têm frequência esperada abaixo de 5${r.minE<1?` e a menor esperada é ${fnum(r.minE,2)}`:""}, o p assintótico não é confiável${r.mc?`; o p exato aproximado por Monte Carlo, com ${nfmt(r.mc.B)} tabelas de margens fixas e semente 20261118, é ${fpc(r.mc.p)} (erro-padrão ${fnum(r.mc.se,4)})`:r.fisher!=null?" e prevalece o teste de Fisher":""}.`;
  else t+=` O pressuposto das frequências esperadas foi atendido: ${r.baixo} de ${r.cells} células abaixo de 5, menor esperada ${fnum(r.minE,2)}.`;
  ps.push(t);
  const fortes=[],fracas=[];r.Z.forEach((l,i)=>l.forEach((z,j)=>{const d={i,j,z};if(Math.abs(z)>r.zc)fortes.push(d);else if(Math.abs(z)>1.96)fracas.push(d)}));
  fortes.sort((a,b)=>Math.abs(b.z)-Math.abs(a.z));
  const cel=d=>`${rl[d.i]} em ${cl[d.j]} (${r.O[d.i][d.j]} observados contra ${fnum(r.E[d.i][d.j],1)} esperados, z = ${fnum(d.z,2)}, ${d.z>0?"acima":"abaixo"} do esperado)`;
  ps.push(fortes.length?`Pelos resíduos padronizados ajustados de Haberman, com o limiar de Bonferroni de |${fnum(r.zc,2)}| para ${r.cells} células, afastam-se da independência: ${fortes.slice(0,8).map(cel).join("; ")}${fortes.length>8?`; e outras ${fortes.length-8} células`:""}.${fracas.length?` Outras ${fracas.length} células passam só o limiar sem correção de |1,96| e não devem ser lidas como achado isolado.`:""}`
    :`Nenhuma célula passa o limiar de Bonferroni de |${fnum(r.zc,2)}| para os resíduos padronizados ajustados de Haberman.${fracas.length?` ${fracas.length} ${fracas.length>1?"células passam":"célula passa"} o limiar sem correção de |1,96|, o que não basta para apontar onde está a associação.`:""}`);
  ps.push(limitesTxt([r.vr,r.vc]));return ps}
function desenhaMulti(out,r,U){
  const P=paleta(),cl=r.cc.cats.map(x=>rotV(r.vo,x));
  const svg=svgMatriz({tl:r.vm.t,tc:r.vo.t,rl:r.linhas.map(l=>rotV(r.vm,l.mc)),cl,
    cell:(i,j)=>{const l=r.linhas[i],z=l.t?l.t.Z[0][j]:0;return {a:nfmt(l.com[j]),b:fpct(l.com[j]/r.C[j]),fill:corZ(z,P),forte:l.pH<.05&&Math.abs(z)>1.96,data:i+","+j,tip:`${rotV(r.vm,l.mc)} em ${cl[j]}: ${l.com[j]} de ${r.C[j]} decisões (${fpct(l.com[j]/r.C[j])}); resíduo ajustado ${fnum(z,2)}. Clique para abrir na Leitura.`}},
    extraCol:{t:"p de Holm",cell:i=>({a:fpc(r.linhas[i].pH),b:"V "+fnum(r.linhas[i].t?.V,3)})},
    extraRow:{t:"Decisões na coluna",cell:j=>({a:nfmt(r.C[j]),b:""})},
    leg:(y,W,P)=>legDiv(1.96)(y,W,P).replace(/\* \|z\|.*?<\/text>/,`Percentual: decisões da coluna que têm a categoria. Contorno: p de Holm &lt; 0,05 e |z| &gt; 1,96.</text>`)});
  AR._svg=svg;AR._clique=k=>{const [i,j]=k.split(",").map(Number);abreNaLeitura(r.linhas[i].ids[j],`${r.vm.t}: ${r.linhas[i].mc} · ${r.vo.t}: ${cl[j]}`)};
  const sig=r.linhas.filter(l=>l.pH<.05);
  const ps=[`Universo: ${descUniv(U)}. ${r.vm.t} admite mais de uma categoria por decisão, de modo que cada categoria foi testada em separado, presença contra ausência, em relação a ${r.vo.t}, nos ${nfmt(r.n)} decisões com as duas variáveis preenchidas (${nfmt(r.miss)} sem valor ficaram de fora).${txtFonte(r.vm,r.vo)}`,
    `Em cada tabela de 2 × ${r.cc.cats.length} usou-se o qui-quadrado de Pearson, o teste exato de Fisher quando a tabela é 2 × 2 e o p de Monte Carlo quando mais de 20% das frequências esperadas ficam abaixo de 5. Os p-valores foram corrigidos pelo método de Holm para ${r.linhas.length} comparações. ${sig.length?`Mantêm associação após a correção: ${sig.map(l=>`${rotV(r.vm,l.mc)} (p de Holm ${fpv(l.pH)}, V = ${fnum(l.t.V,3)})`).join("; ")}.`:"Nenhuma categoria mantém associação após a correção."}`,
    limitesTxt([r.vm,r.vo])];AR._nota=ps;
  out.innerHTML=`<div class="pressup">Resposta múltipla: uma decisão pode somar em mais de uma linha, por isso não há teste único da tabela inteira. Clique numa célula para abrir as decisões na Leitura.</div><div class="graf">${svg}</div>${htmlNota(ps)}${botoesExp([["x-csv","Tabela (.csv)",1],["x-png","Figura (.png)"],["x-svg","Figura (.svg)"],["x-md","Nota (.md)"]])}`;
  const base=`Associacao_${nomeArq(r.vm.t)}_x_${nomeArq(r.vo.t)}`;
  $("#x-csv").onclick=()=>{const L=[["categoria",...cl.flatMap(c=>[c+" (n)",c+" (%)"]),"qui_quadrado","gl","p","p_fisher_ou_mc","p_holm","v_cramer"]];r.linhas.forEach(l=>L.push([rotV(r.vm,l.mc),...l.com.flatMap((v,j)=>[v,numCSV(100*v/r.C[j],2)]),numCSV(l.t?.chi,3),l.t?.df??"",numCSV(l.t?.p,5),numCSV(l.t?.fisher??l.t?.mc?.p,5),numCSV(l.pH,5),numCSV(l.t?.V,4)]));salvaArq(base+".csv",csv(L))};
  $("#x-png").onclick=()=>salvaArq(base+".png",svgPng(svg));$("#x-svg").onclick=()=>salvaArq(base+".svg",svg);
  $("#x-md").onclick=()=>salvaArq(base+".md",mdNota(`Associação entre ${r.vm.t} e ${r.vo.t}`,ps,["agresti","haberman","holm","hope"]))}

/* série no tempo */
function subSerie(el){
  const U=universo(),v=VARS[A.sVar]||VARS.inc;
  const vals=[...new Set(U.map(c=>v.g(c)).filter(x=>x!=null))];ordenaCats(vals,v,new Map(vals.map(x=>[x,U.filter(c=>v.g(c)===x).length])));
  if(!vals.includes(A.sVal))A.sVal=vals[0]||"";
  el.innerHTML=`<div class="an-ctl"><label for="s-v">Variável${selVar("s-v",A.sVar,{semMulti:1})}</label>
    <label for="s-c">Proporção de<select id="s-c">${vals.map(x=>`<option value="${esc(x)}"${x===A.sVal?" selected":""}>${esc(rotV(v,x))}</option>`).join("")}</select></label>
    <label for="s-g">Intervalo<select id="s-g"><option value="ano"${A.grao==="ano"?" selected":""}>ano</option><option value="sem"${A.grao==="sem"?" selected":""}>semestre</option></select></label></div><div id="an-out" class="an-res"></div>`;
  el.querySelector(".an-ctl").onchange=e=>{const id=e.target.id;if(id==="s-v"){A.sVar=e.target.value;A.sVal="";guardaA();subSerie(el);return}if(id==="s-c")A.sVal=e.target.value;if(id==="s-g")A.grao=e.target.value;guardaA();desenhaSerie(U)};
  desenhaSerie(U)}
function calcSerie(U){
  const v=VARS[A.sVar],bins=new Map();let nTot=0;
  U.forEach(c=>{if(!c.data)return;const x=v.g(c);if(x==null)return;nTot++;const y=+c.data.slice(0,4),mo=+c.data.slice(5,7),s=mo<=6?1:2;const k=A.grao==="ano"?String(y):y+"/"+s;
    let b=bins.get(k);if(!b){b={k,lab:k,n:0,x:0,ids:[],t0:A.grao==="ano"?Date.UTC(y,0,1):Date.UTC(y,s===1?0:6,1),t1:A.grao==="ano"?Date.UTC(y+1,0,1):Date.UTC(s===1?y:y+1,s===1?6:0,1)};bins.set(k,b)}
    b.n++;if(x===A.sVal){b.x++;b.ids.push(c.id)}});
  const L=[...bins.values()].sort((a,b)=>a.t0-b.t0);L.forEach(b=>{[b.p,b.lo,b.hi]=ST.wilson(b.x,b.n)});
  let ca=null;if(L.length>=3){const N=L.reduce((a,b)=>a+b.n,0),X=L.reduce((a,b)=>a+b.x,0),pb=X/N;let T=0,s1=0,s2=0;L.forEach((b,i)=>{T+=i*(b.x-b.n*pb);s1+=b.n*i*i;s2+=b.n*i});const V=pb*(1-pb)*(s1-s2*s2/N);if(V>0){const z=T/Math.sqrt(V);ca={z,p:2*(1-ST.pnorm(Math.abs(z)))}}}
  const PR=periodosRot();const g=per=>{const cs=U.filter(c=>periodo(c)===per&&v.g(c)!=null);return {n:cs.length,x:cs.filter(c=>v.g(c)===A.sVal).length}};
  let pp=null;const a=PR.length?g(PR[0]):{n:0},b=PR.length?g(PR[1]):{n:0};if(a.n&&b.n){const [p1,l1,u1]=ST.wilson(a.x,a.n),[p2,l2,u2]=ST.wilson(b.x,b.n),d=p2-p1;
    pp={a,b,p1,p2,d,lo:d-Math.sqrt((p2-l2)**2+(u1-p1)**2),hi:d+Math.sqrt((u2-p2)**2+(p1-l1)**2),t:indep([[a.x,a.n-a.x],[b.x,b.n-b.x]])}}
  return {v,bins:L,ca,pp,n:nTot}}
function desenhaSerie(U){
  const out=$("#an-out"),r=calcSerie(U);
  if(!r.bins.length||!A.sVal){out.innerHTML=`<div class="pressup alerta">Não há decisões com ${esc(r.v.t)} preenchido nesse universo.</div>`;return}
  const svg=svgSerie(r);AR._svg=svg;const rot=rotV(r.v,A.sVal);
  const ps=[`Universo: ${descUniv(U)}. A série mostra, por ${A.grao==="ano"?"ano":"semestre"} de julgamento, a proporção de decisões com ${r.v.t} igual a "${rot}" entre os ${nfmt(r.n)} que têm a variável preenchida, com intervalo de confiança de 95% pelo método de Wilson.${txtFonte(r.v)}${U.some(c=>!c.data)?` ${nfmt(U.filter(c=>!c.data).length)} decisões sem data ficaram de fora.`:""} Se a coleta terminou no meio de um ano, o último intervalo está incompleto.`];
  if(r.pp)ps.push(`Entre o período ${periodosRot()[0]} e o período ${periodosRot()[1]}, a proporção passou de ${fpct(r.pp.p1)} (${r.pp.a.x} de ${r.pp.a.n}) para ${fpct(r.pp.p2)} (${r.pp.b.x} de ${r.pp.b.n}), diferença de ${fnum(100*r.pp.d,1)} pontos percentuais com intervalo de 95% de ${fnum(100*r.pp.lo,1)} a ${fnum(100*r.pp.hi,1)} (método híbrido de Newcombe, a partir dos intervalos de Wilson). Teste exato de Fisher, bilateral: p ${fpv(r.pp.t.fisher)}.`);
  if(r.ca)ps.push(`Teste de tendência linear de Cochran-Armitage sobre os ${r.bins.length} intervalos, com escores igualmente espaçados: z = ${fnum(r.ca.z,2)}, p ${fpv(r.ca.p)}. O teste só capta tendência monotônica; uma mudança de nível em torno de um marco temporal sem tendência, ou uma oscilação, pode passar despercebida, e a leitura do gráfico deve acompanhar o número.`);
  ps.push(limitesTxt([r.v])+(r.bins.some(b=>b.n<30)?` Há intervalos com menos de 30 decisões (pontos vazados), em que a proporção oscila muito.`:""));AR._nota=ps;
  out.innerHTML=`<div class="an-cards">
     <div class="card"><span class="rot">Decisões com a variável</span><span class="v">${nfmt(r.n)}</span><span class="mini">${r.bins.length} intervalos</span></div>
     ${r.pp?`<div class="card"><span class="rot">${esc(periodosRot()[0])} → ${esc(periodosRot()[1])}</span><span class="v">${fpct(r.pp.p1)} → ${fpct(r.pp.p2)}</span><span class="mini">diferença ${fnum(100*r.pp.d,1)} p.p. (IC 95% ${fnum(100*r.pp.lo,1)} a ${fnum(100*r.pp.hi,1)}) · Fisher p ${fpv(r.pp.t.fisher)}</span></div>`:""}
     ${r.ca?`<div class="card"><span class="rot">Tendência (Cochran-Armitage)</span><span class="v">z = ${fnum(r.ca.z,2)}</span><span class="mini">p ${fpv(r.ca.p)}</span></div>`:""}</div>
   <div class="graf">${svg}</div>
   <div class="quadro"><table class="tabela-s"><tr><th>Intervalo</th><th class="num">n</th><th class="num">${esc(rot)}</th><th class="num">%</th><th class="num">IC 95% (Wilson)</th><th></th></tr>${r.bins.map((b,i)=>`<tr><td>${esc(b.lab)}</td><td class="num">${nfmt(b.n)}</td><td class="num">${nfmt(b.x)}</td><td class="num">${fpct(b.p)}</td><td class="num">${fpct(b.lo)} a ${fpct(b.hi)}</td><td>${b.x?`<button class="btn sut" data-bin="${i}">abrir na Leitura</button>`:""}</td></tr>`).join("")}</table></div>
   ${htmlNota(ps)}${botoesExp([["x-csv","Série (.csv)",1],["x-png","Figura (.png)"],["x-svg","Figura (.svg)"],["x-md","Nota (.md)"]])}`;
  out.querySelectorAll("[data-bin]").forEach(b=>b.onclick=()=>{const x=r.bins[+b.dataset.bin];abreNaLeitura(x.ids,`${r.v.t}: ${rot} · ${x.lab}`)});
  const base=`Serie_${nomeArq(r.v.t)}_${nomeArq(rot)}_${A.grao}`;
  $("#x-csv").onclick=()=>salvaArq(base+".csv",csv([["intervalo","n","casos","proporcao","ic95_inf","ic95_sup"],...r.bins.map(b=>[b.lab,b.n,b.x,numCSV(b.p,4),numCSV(b.lo,4),numCSV(b.hi,4)])]));
  $("#x-png").onclick=()=>salvaArq(base+".png",svgPng(svg));$("#x-svg").onclick=()=>salvaArq(base+".svg",svg);
  $("#x-md").onclick=()=>salvaArq(base+".md",mdNota(`Série de ${r.v.t}: ${rot}`,ps,["wilson","newcombe","armitage"]))}

/* concordância */
const cFontes=()=>[["r1",nomeRev(1)],["r2",nomeRev(2)],["cons","Consenso"],...(temSug()?[["sug","Codificação prévia"]]:[])];
const cCampos=()=>[["c","Código"],...CAMPOS().filter(f=>f.tipo!=="texto").map(f=>[f.id,f.rot])];
function valConc(c,src,k){
  let v;
  if(src==="sug"){if(k==="c")v=c.sug;else{const f=CAMPOS().find(x=>x.id===k);v=f?sugCampo(c,f):null}}
  else{const r=src==="r1"?S.rev[1][c.id]:src==="r2"?S.rev[2][c.id]:S.cons[c.id];if(!r||(k!=="c"&&!r.c&&src==="cons"))return null;v=r?.[k]}
  if(Array.isArray(v))v=v.length?[...v].sort().join("; "):null;
  return v==null||v===""?null:String(v)}
const rotConc=(k,v)=>k==="c"?codRot(v):v;
function subConc(el){
  const opt=(id,val,L)=>`<select id="${id}">${L.map(([v,t])=>`<option value="${v}"${v===val?" selected":""}>${t}</option>`).join("")}</select>`;
  el.innerHTML=`<div class="an-ctl"><label for="c-a">Codificação A (linhas)${opt("c-a",A.ca,cFontes())}</label><label for="c-b">Codificação B (colunas)${opt("c-b",A.cb,cFontes())}</label><label for="c-k">Campo${opt("c-k",A.campo,cCampos())}</label>
    <label class="chk"><input type="checkbox" id="c-l"${A.semLote?" checked":""}> excluir códigos confirmados em lote</label></div><div id="an-out" class="an-res"></div>`;
  el.querySelector(".an-ctl").onchange=e=>{const id=e.target.id;if(id==="c-a")A.ca=e.target.value;if(id==="c-b")A.cb=e.target.value;if(id==="c-k")A.campo=e.target.value;if(id==="c-l")A.semLote=e.target.checked;guardaA();desenhaConc()};
  desenhaConc()}
function desenhaConc(){
  const out=$("#an-out"),U=universo(),ra=A.ca,rb=A.cb,k=A.campo;
  if(ra===rb){out.innerHTML=`<div class="pressup alerta">Escolha duas codificações diferentes.</div>`;return}
  const lote=c=>[ra,rb].some(s=>(s==="r1"&&S.rev[1][c.id]?.lote)||(s==="r2"&&S.rev[2][c.id]?.lote));
  let exL=0;const pares=[],ids=new Map();
  U.forEach(c=>{const a=valConc(c,ra,k),b=valConc(c,rb,k);if(a==null||b==null)return;if(A.semLote&&lote(c)){exL++;return}pares.push([a,b]);const key=a+"\u0001"+b;(ids.get(key)||ids.set(key,[]).get(key)).push(c.id)});
  const nomeA=cFontes().find(x=>x[0]===ra)[1],nomeB=cFontes().find(x=>x[0]===rb)[1],nomeK=cCampos().find(x=>x[0]===k)[1];
  if(pares.length<2){out.innerHTML=`<div class="pressup alerta">Só ${pares.length} ${pares.length===1?"decisão tem":"decisões têm"} o campo ${esc(nomeK)} preenchido nas duas codificações dentro do universo${exL?` (${exL} excluídos por confirmação em lote)`:""}. A concordância aparece quando houver pelo menos algumas decisões codificadas pelas duas.</div>`;return}
  const ordem=k==="c"?LIVRO().map(x=>x.cod):(CAMPOS().find(f=>f.id===k)?.opcoes||(["sim","não"]));const r=kappaFull(pares,ordem);AR.conc=r;
  const P=paleta(),mx=Math.max(...r.M.flat());const rl=r.cats.map(x=>rotConc(k,x));
  const svg=svgMatriz({tl:nomeA,tc:nomeB,rl,cl:rl,cw:k==="c"?96:undefined,
    cell:(i,j)=>{const v=r.M[i][j];const fill=v?mix(P.sup,i===j?P.caneta:P.neg,.12+.8*Math.sqrt(v/mx)):P.papel;return {a:v?nfmt(v):"·",fill,forte:false,data:i+","+j,tip:`${nomeA}: ${rl[i]} · ${nomeB}: ${rl[j]}: ${v} decisões. Clique para abrir na Leitura.`}},
    extraCol:{t:"Total A",cell:i=>({a:nfmt(r.rA[i])})},extraRow:{t:"Total B",cell:j=>({a:nfmt(r.rB[j])}),canto:{a:nfmt(r.n)}},
    leg:(y,W,P)=>`<text x="12" y="${y+10}" font-size="11.5" fill="${P.tinta2}">Diagonal em azul: acordo. Fora dela, em vermelho: desacordo. A intensidade acompanha a contagem.</text>`});
  AR._svg=svg;AR._clique=key=>{const [i,j]=key.split(",").map(Number);abreNaLeitura(ids.get(r.cats[i]+"\u0001"+r.cats[j])||[],`${nomeA} ${rl[i]} × ${nomeB} ${rl[j]}`)};
  const des=[];r.M.forEach((l,i)=>l.forEach((v,j)=>{if(i!==j&&v)des.push([i,j,v])}));des.sort((a,b)=>b[2]-a[2]);
  const ps=[`Universo: ${descUniv(U)}. Comparam-se as codificações "${nomeA}" e "${nomeB}" no campo ${nomeK}, nos ${nfmt(r.n)} decisões em que as duas registraram valor${exL?`; ${nfmt(exL)} decisões com código confirmado em lote ficaram de fora, porque a confirmação em lote copia o código automático e inflaria o acordo`:""}.`,
    `Concordância observada de ${fpct(r.po)}, contra ${fpct(r.pe)} esperada pelo acaso a partir das margens. Kappa de Cohen = ${fnum(r.k,3)}, com intervalo de confiança de 95% de ${fnum(r.lo,3)} a ${fnum(r.hi,3)} (erro-padrão assintótico de Fleiss, Cohen e Everitt). Alfa de Krippendorff para dados nominais = ${fnum(r.alpha,3)}. Kappa ajustado por prevalência e viés (PABAK) = ${fnum(r.pabak,3)}, com ${r.cats.length} categorias observadas. Na escala de Landis e Koch, convencional e sem fundamento estatístico próprio, o kappa corresponde a concordância ${landis(r.k)}; Krippendorff recomenda alfa de pelo menos 0,800 para conclusões e aceita 0,667 só para conclusões provisórias.`,
    des.length?`Os desacordos mais frequentes são ${des.slice(0,5).map(([i,j,v])=>`${rl[i]} em A e ${rl[j]} em B (${v})`).join("; ")}. A concordância específica por categoria, na tabela abaixo, mostra onde o acordo se concentra.`:"Não há desacordos entre as duas codificações nesse universo.",
    `Limites: o kappa depende da prevalência das categorias e cai quando uma delas domina, o que o PABAK ajuda a dimensionar. ${[ra,rb].some(s=>s==="sug")?"Na comparação com a codificação prévia, o resultado mede a validade do classificador em relação à leitura humana, e não a confiabilidade entre codificadores. ":""}${[ra,rb].some(s=>s==="r1"||s==="r2"||s==="cons")?"Se as decisões codificadas até agora não foram sorteadas, o acordo sobre elas pode diferir do acordo sobre a base inteira.":""}`];AR._nota=ps;
  out.innerHTML=`<div class="an-cards">
     <div class="card"><span class="rot">Decisões comparados</span><span class="v">${nfmt(r.n)}</span><span class="mini">${fpct(r.po)} de acordo · acaso ${fpct(r.pe)}</span></div>
     <div class="card"><span class="rot">Kappa de Cohen</span><span class="v">${fnum(r.k,3)}</span><span class="mini">IC 95% ${fnum(r.lo,3)} a ${fnum(r.hi,3)} · ${landis(r.k)}</span></div>
     <div class="card"><span class="rot">Alfa de Krippendorff</span><span class="v">${fnum(r.alpha,3)}</span><span class="mini">nominal, dois codificadores</span></div>
     <div class="card"><span class="rot">PABAK</span><span class="v">${fnum(r.pabak,3)}</span><span class="mini">${r.cats.length} categorias observadas</span></div></div>
   <div class="graf">${svg}</div>
   <div class="quadro"><table class="tabela-s"><tr><th>Categoria</th><th class="num">${esc(nomeA)}</th><th class="num">${esc(nomeB)}</th><th class="num">Acordo</th><th class="num">Concordância específica</th></tr>${r.cats.map((x,i)=>`<tr><td>${esc(rl[i])}</td><td class="num">${nfmt(r.rA[i])}</td><td class="num">${nfmt(r.rB[i])}</td><td class="num">${nfmt(r.M[i][i])}</td><td class="num">${fpct(r.esp[i])}</td></tr>`).join("")}</table></div>
   ${htmlNota(ps)}${botoesExp([["x-csv","Matriz (.csv)",1],["x-png","Figura (.png)"],["x-svg","Figura (.svg)"],["x-md","Nota (.md)"]])}`;
  const base=`Concordancia_${nomeArq(nomeA)}_x_${nomeArq(nomeB)}_${nomeArq(nomeK)}`;
  $("#x-csv").onclick=()=>salvaArq(base+".csv",csv([[`${nomeA} \\ ${nomeB}`,...rl],...r.cats.map((_,i)=>[rl[i],...r.M[i]])]));
  $("#x-png").onclick=()=>salvaArq(base+".png",svgPng(svg));$("#x-svg").onclick=()=>salvaArq(base+".svg",svg);
  $("#x-md").onclick=()=>salvaArq(base+".md",mdNota(`Concordância entre ${nomeA} e ${nomeB}: ${nomeK}`,ps,["cohen60","fleiss","kripp","byrt","landis"]))}
/* corpus: textos, busca e tokens */
const STOP=new Set("são pode podem deve devem sendo sido a à ao aos as às até após com como contra da das de dela dele delas deles demais depois do dos e é ela elas ele eles em entre era eram essa essas esse esses esta está estão estas este estes estar eu foi foram fosse há isso isto já lhe lhes mais mas me mesma mesmo mesmos meu minha muito na nas nem no nos nós não o os ou para pela pelas pelo pelos por pois porque qual quais quando que quem se sem ser seu seus sua suas também tem têm ter tendo teve tinha um uma umas uns vez sido sendo seja sejam será serão houve assim ainda bem cada onde sob sobre tal tais todo toda todos todas outro outra outros outras qualquer quanto lo la los las art arts fls fl nº n inc ii iii iv vi vii i v".split(" "));
/* palavras dos termos de busca, para poder ignorá-las nas contagens */
let _descTok=null,_descChave="";
function ehDesc(w){const ch=(S.cfg.termos||[]).join("|");if(ch!==_descChave){_descChave=ch;const ws=(S.cfg.termos||[]).flatMap(t=>normTxt(t).split(/\s+/)).filter(w=>w&&!STOP.has(w));
  _descTok=ws.length?new RegExp("^(?:"+ws.map(w=>w.split("*").map(x=>x.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")).join("[\\p{L}\\p{N}-]*")+(w.includes("*")?"":"s?")).join("|")+")$","u"):null}
  return _descTok?_descTok.test(normTxt(w)):false}
/* corpus: janelas em torno dos termos de busca ou texto integral */
async function corpus(U,corp,prog){
  const T=await todosTextos(prog);const D=[];let sem=0;
  for(const c of U){const t=T.get(c.id);if(!t){sem++;continue}
    if(corp==="teor")D.push({id:c.id,t:t.normalize("NFC")});
    else{const vistos=new Set();janelas(t).forEach(x=>{if(!vistos.has(x)){vistos.add(x);D.push({id:c.id,t:x})}})}}
  D.sem=sem;return D}
function rxBusca(q,re){q=String(q||"").trim();if(!q)return null;
  if(re){try{return new RegExp(q,"giu")}catch(e){return {erro:"Expressão regular inválida: "+e.message}}}
  const ws=normTxt(q).split(/\s+/).filter(Boolean).map(w=>w.split("*").map(s=>s.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")).join("[\\p{L}\\p{N}-]*"));
  return new RegExp("(?<![\\p{L}\\p{N}])"+ws.join("[\\s\\p{P}]+")+"(?![\\p{L}\\p{N}])","giu")}
function tokens(t){return t.toLowerCase().match(/\p{L}[\p{L}\p{N}-]*/gu)||[]}
function ngramas(tk,n,descOk){if(n===1)return tk.filter(w=>!STOP.has(w)&&w.length>1&&(descOk||!ehDesc(w)));
  const o=[];for(let i=0;i+n<=tk.length;i++){const g=tk.slice(i,i+n);if(STOP.has(g[0])||STOP.has(g[n-1]))continue;if(!descOk&&g.every(w=>STOP.has(w)||ehDesc(w)))continue;o.push(g.join(" "))}return o}
function ctlCorpus(id,val){return `<label for="${id}">Corpus<select id="${id}"><option value="jan"${val==="jan"?" selected":""}>trechos com os termos de busca</option><option value="teor"${val==="teor"?" selected":""}>texto integral</option></select></label>`}
const descCorpus=(corp,D,U)=>(corp==="teor"?`o texto integral das decisões do universo (${nfmt(new Set(D.map(d=>d.id)).size)} textos)`:`as janelas de ${JAN} caracteres de cada lado dos termos de busca (${nfmt(D.length)} trechos de ${nfmt(new Set(D.map(d=>d.id)).size)} decisões; menções próximas formam um só trecho)`)+(D.sem?`; ${nfmt(D.sem)} decisões sem texto ficaram de fora`:"");

/* palavras em contexto */
function subKwic(el){
  el.innerHTML=`<form class="an-ctl" id="k-f"><label for="k-q" style="flex:1 1 220px">Busca<input type="search" id="k-q" value="${esc(A.kq)}" placeholder="ex.: morador* de rua, periculosidade" style="width:100%"></label>
    <label class="chk"><input type="checkbox" id="k-re"${A.kre?" checked":""}> expressão regular</label>
    ${ctlCorpus("k-c",A.kcorp)}<label for="k-w">Palavras de contexto<input type="number" id="k-w" min="3" max="25" value="${A.kw}" style="width:70px"></label>
    <label for="k-x">Com no contexto (opcional)<input type="search" id="k-x" value="${esc(A.kf)}" placeholder="ex.: perigo*" style="width:150px"></label>
    <button class="btn pri" type="submit">Buscar</button></form>
    <p class="mini" style="margin:0">A busca ignora acentos e maiúsculas; * completa a palavra. Em expressão regular, escreva sem acento. Clique numa linha para abrir a decisão.</p><div id="an-out" class="an-res"></div>`;
  $("#k-f").onsubmit=async e=>{e.preventDefault();A.kq=$("#k-q").value;A.kre=$("#k-re").checked;A.kcorp=$("#k-c").value;A.kw=Math.max(3,Math.min(25,+$("#k-w").value||8));A.kf=$("#k-x").value;guardaA();await rodaKwic()};
  if(AR.kwic)desenhaKwic();else rodaKwic()}
async function rodaKwic(){
  const out=$("#an-out"),U=universo(),rx=rxBusca(A.kq,A.kre);
  if(!rx){out.innerHTML=`<div class="pressup">Digite uma palavra ou expressão.</div>`;return}if(rx.erro){out.innerHTML=`<div class="pressup alerta">${esc(rx.erro)}</div>`;return}
  const fx=A.kf.trim()?rxBusca(A.kf,false):null;
  const prog=t=>{out.innerHTML=`<div class="carregando">${esc(t)}</div>`};prog("Buscando…");
  const D=await corpus(U,A.kcorp,prog);const L=[];let total=0;const W=A.kw;
  for(const d of D){const nt=normTxt(d.t);rx.lastIndex=0;let m;while((m=rx.exec(nt))){if(!m[0].length){rx.lastIndex++;continue}
    const i=m.index,j=i+m[0].length,esq=d.t.slice(Math.max(0,i-500),i).split(/\s+/),dir=d.t.slice(j,j+500).split(/\s+/);
    const l=esq.slice(-W).join(" ").trim(),r=dir.slice(0,W).join(" ").trim();
    if(fx){fx.lastIndex=0;if(!fx.test(normTxt(l+" "+r)))continue}
    total++;if(L.length<20000)L.push({id:d.id,l,n:d.t.slice(i,j),r})}}
  AR.kwic={L,total,D,U,q:A.kq,corp:A.kcorp,fx:A.kf,mostra:300};desenhaKwic()}
function desenhaKwic(){
  const out=$("#an-out"),K=AR.kwic;if(!K)return;const {L,U,D}=K;
  const chaveO={ordem:x=>S.byId.get(x.id).data+String(x.id).padStart(9,"0"),l1:x=>normTxt(x.l.split(" ").pop()||""),r1:x=>normTxt(x.r.split(" ")[0]||""),no:x=>normTxt(x.n),cod:x=>codigo(S.byId.get(x.id))||"~",per:x=>(periodo(S.byId.get(x.id))||"")+S.byId.get(x.id).data}[A.kord]||(x=>x.id);
  L.sort((a,b)=>{const x=chaveO(a),y=chaveO(b);return x<y?-1:x>y?1:0});
  const comHit=new Set(L.map(x=>x.id));const temPer=!!S.cfg.marcos?.length,perDe=c=>temPer?(periodo(c)||"sem data"):"todas",pers=temPer?[...periodosRot(),...(U.some(c=>!c.data)?["sem data"]:[])]:["todas"];
  const tabP=pers.map(p=>{const u=U.filter(c=>perDe(c)===p),h=u.filter(c=>comHit.has(c.id)),oc=L.filter(x=>perDe(S.byId.get(x.id))===p).length;return {p,u:u.length,h:h.length,oc}}).filter(x=>x.u);
  const ps=[`Universo: ${descUniv(U)}. Busca por "${K.q}"${K.fx?`, mantidas só as ocorrências com "${K.fx}" nas ${A.kw} palavras de cada lado`:""}, em ${descCorpus(K.corp,D,U)}. A busca ignora acentos e maiúsculas e respeita limites de palavra.`,
    `Foram encontradas ${nfmt(K.total)} ocorrências em ${nfmt(comHit.size)} decisões. ${tabP.map(x=>`${temPer?`No período ${x.p}`:"No universo"}, ${nfmt(x.h)} de ${nfmt(x.u)} decisões (${fpct(x.u?x.h/x.u:NaN)}) têm ao menos uma ocorrência`).join("; ")}.`,
    `Limites: a concordância é instrumento de leitura e não substitui a análise do trecho na decisão; a contagem de ocorrências pesa mais as decisões longas ou repetitivas, por isso a proporção de decisões com ocorrência é a medida mais estável para comparar períodos.${K.corp==="jan"?" Nas janelas de contexto, uma mesma passagem pode aparecer em duas janelas quando as menções estão próximas.":""}`];AR._nota=ps;
  out.innerHTML=`<div class="duas"><div class="quadro"><table class="tabela-s"><tr><th>${temPer?"Período":"Universo"}</th><th class="num">Decisões</th><th class="num">Com ocorrência</th><th class="num">%</th><th class="num">Ocorrências</th></tr>${tabP.map(x=>`<tr><td>${esc(x.p)}</td><td class="num">${nfmt(x.u)}</td><td class="num">${nfmt(x.h)}</td><td class="num">${fpct(x.u?x.h/x.u:NaN)}</td><td class="num">${nfmt(x.oc)}</td></tr>`).join("")}</table></div>
    <div class="card"><span class="rot">Ocorrências</span><span class="v">${nfmt(K.total)}</span><span class="mini">em ${nfmt(comHit.size)} decisões${K.total>L.length?` · listadas as primeiras ${nfmt(L.length)}`:""}</span>
      <div class="links"><button class="btn" id="k-abre"${comHit.size?"":" disabled"}>Abrir as ${nfmt(comHit.size)} decisões na Leitura</button></div></div></div>
    <div class="an-ctl"><label for="k-o">Ordenar por<select id="k-o">${[["ordem","data do julgamento"],["l1","palavra à esquerda"],["r1","palavra à direita"],["no","termo encontrado"],["cod","código da fonte"],["per","período"]].map(([v,t])=>`<option value="${v}"${A.kord===v?" selected":""}>${t}</option>`).join("")}</select></label></div>
    <div class="quadro kwic" id="k-lin">${L.slice(0,K.mostra).map(x=>{const c=S.byId.get(x.id);return `<div class="kl" data-id="${x.id}"><span class="km">${x.id} · ${dataBR(c.data)} · ${esc(codigo(c)||"–")}</span><span class="ke"><bdi>${esc(x.l)}</bdi></span><span class="kn">${esc(x.n)}</span><span class="kd">${esc(x.r)}</span></div>`}).join("")||'<div class="carregando">Nenhuma ocorrência.</div>'}</div>
    ${L.length>K.mostra?`<button class="btn" id="k-mais">Mostrar mais ${nfmt(Math.min(300,L.length-K.mostra))}</button>`:""}
    ${htmlNota(ps)}${botoesExp([["x-csv","Concordância (.csv)",1],["x-md","Nota (.md)"]])}`;
  $("#k-o").onchange=e=>{A.kord=e.target.value;guardaA();desenhaKwic()};
  $("#k-mais")?.addEventListener("click",()=>{K.mostra+=300;desenhaKwic()});
  $("#k-lin").onclick=e=>{const l=e.target.closest(".kl");if(l)abreNaLeitura([...comHit],`busca "${K.q}"`,+l.dataset.id)};
  $("#k-abre").onclick=()=>abreNaLeitura([...comHit],`busca "${K.q}"`);
  const base=`KWIC_${nomeArq(K.q)}`;
  $("#x-csv").onclick=()=>salvaArq(base+".csv",csv([["decisao","data","periodo","codigo_fonte","esquerda","termo","direita"],...L.map(x=>{const c=S.byId.get(x.id);return [x.id,dataBR(c.data),periodo(c)||"",codigo(c)||"",x.l,x.n,x.r]})]));
  $("#x-md").onclick=()=>salvaArq(base+".md",mdNota(`Palavras em contexto: ${K.q}`,ps,[]))}

/* vocabulário: frequências e palavras-chave */
function subVocab(el){
  const U=universo(),v=VARS[A.vvar];const vals=v?[...new Set(U.map(c=>v.g(c)).filter(x=>x!=null))]:[];if(v)ordenaCats(vals,v,new Map(vals.map(x=>[x,U.filter(c=>v.g(c)===x).length])));
  if(v&&!vals.includes(A.va))A.va=vals[0]||"";if(A.vb&&!vals.includes(A.vb))A.vb="";
  el.innerHTML=`<form class="an-ctl" id="v-f">${ctlCorpus("v-c",A.kcorp)}
    <label for="v-v">Comparar por${selVar("v-v",A.vvar,{semMulti:1,vazio:"sem comparação (só frequências)"})}</label>
    ${v?`<label for="v-a">Grupo A<select id="v-a">${vals.map(x=>`<option value="${esc(x)}"${x===A.va?" selected":""}>${esc(rotV(v,x))}</option>`).join("")}</select></label>
    <label for="v-b">Grupo B<select id="v-b"><option value="">todos os demais</option>${vals.map(x=>`<option value="${esc(x)}"${x===A.vb?" selected":""}>${esc(rotV(v,x))}</option>`).join("")}</select></label>`:""}
    <label for="v-n">Unidade<select id="v-n">${[[1,"palavra"],[2,"bigrama"],[3,"trigrama"]].map(([n,t])=>`<option value="${n}"${+A.vng===n?" selected":""}>${t}</option>`).join("")}</select></label>
    <label for="v-m">Frequência mínima<input type="number" id="v-m" min="2" max="100" value="${A.vmin}" style="width:70px"></label>
    <label class="chk"><input type="checkbox" id="v-d"${A.vdesc?" checked":""}> ignorar os termos de busca</label>
    <button class="btn pri" type="submit">Calcular</button></form><div id="an-out" class="an-res"></div>`;
  $("#v-v").onchange=e=>{A.vvar=e.target.value;A.va="";A.vb="";guardaA();subVocab(el)};
  $("#v-f").onsubmit=async e=>{e.preventDefault();A.kcorp=$("#v-c").value;if($("#v-a"))A.va=$("#v-a").value;if($("#v-b"))A.vb=$("#v-b").value;A.vng=+$("#v-n").value;A.vmin=Math.max(2,+$("#v-m").value||5);A.vdesc=$("#v-d").checked;guardaA();await rodaVocab()};
  if(AR.vocab)desenhaVocab();else $("#an-out").innerHTML=`<div class="pressup">Escolha o corpus e a comparação e clique em Calcular. Sem comparação, a página lista as palavras mais frequentes; com comparação, aponta as que distinguem um grupo do outro pela razão de verossimilhança.</div>`}
async function rodaVocab(){
  const out=$("#an-out"),U=universo(),v=VARS[A.vvar],prog=t=>{out.innerHTML=`<div class="carregando">${esc(t)}</div>`};prog("Contando…");
  const D=await corpus(U,A.kcorp,prog);const grupo=c=>{if(!v)return "A";const x=v.g(c);if(x==null)return null;if(x===A.va)return "A";if(!A.vb||x===A.vb)return "B";return null};
  const F={A:new Map(),B:new Map()},DF={A:new Map(),B:new Map()},T={A:0,B:0},ND={A:new Set(),B:new Set()};
  const porDoc=new Map();D.forEach(d=>{(porDoc.get(d.id)||porDoc.set(d.id,[]).get(d.id)).push(d.t)});
  for(const [id,ts] of porDoc){const g=grupo(S.byId.get(id));if(!g)continue;ND[g].add(id);const vistos=new Set();
    for(const t of ts){const tk=tokens(t);T[g]+=tk.length;for(const w of ngramas(tk,A.vng,!A.vdesc)){F[g].set(w,(F[g].get(w)||0)+1);if(!vistos.has(w)){vistos.add(w);DF[g].set(w,(DF[g].get(w)||0)+1)}}}}
  const ws=new Set([...F.A.keys(),...F.B.keys()]),R=[];
  for(const w of ws){const a=F.A.get(w)||0,b=F.B.get(w)||0;if(a+b<A.vmin||(DF.A.get(w)||0)+(DF.B.get(w)||0)<3)continue;let g2=null,lr=null,p=null;
    if(v&&T.A&&T.B){const e1=T.A*(a+b)/(T.A+T.B),e2=T.B*(a+b)/(T.A+T.B);g2=2*((a?a*Math.log(a/e1):0)+(b?b*Math.log(b/e2):0));lr=Math.log2(((a||.5)/T.A)/((b||.5)/T.B));p=ST.chi2p(g2,1)}
    R.push({w,a,b,da:DF.A.get(w)||0,db:DF.B.get(w)||0,g2,lr,p})}
  AR.vocab={R,T,ND,v,va:A.va,vb:A.vb,corp:A.kcorp,D,U,ng:A.vng,min:A.vmin,desc:A.vdesc};desenhaVocab()}
function desenhaVocab(){
  const out=$("#an-out"),V=AR.vocab;if(!V)return;const {R,T,ND,v,U,D}=V;const per10=(x,t)=>t?fnum(1e4*x/t,1):"–";
  const unid=["palavra","bigrama","trigrama"][V.ng-1],nomeA=v?rotV(v,V.va):"universo",nomeB=v?(V.vb?rotV(v,V.vb):"demais categorias"):"";
  const bonf=.05/Math.max(1,R.length);
  const fr=[...R].sort((x,y)=>(y.a+y.b)-(x.a+x.b)).slice(0,60);
  let corpoKey="";const ps=[`Universo: ${descUniv(U)}. Corpus: ${descCorpus(V.corp,D,U)}. Unidade de contagem: ${unid}, em minúsculas; ${V.ng===1?"palavras gramaticais foram descartadas":"descartaram-se sequências que começam ou terminam em palavra gramatical"}${V.desc?" e as palavras dos próprios termos de busca foram ignoradas, porque estão em todos os trechos por construção":""}. Entram na lista os itens com pelo menos ${V.min} ocorrências, espalhadas por pelo menos 3 decisões, para que nomes próprios e fórmulas de um único processo não dominem a lista.`];
  if(v){const sa=R.filter(x=>x.lr>0&&x.p<.05).sort((x,y)=>y.g2-x.g2).slice(0,40),sb=R.filter(x=>x.lr<0&&x.p<.05).sort((x,y)=>y.g2-x.g2).slice(0,40);
    const mx=Math.max(1,...[...sa,...sb].map(x=>Math.abs(x.lr)));
    const tab=(L,nome)=>`<div><h3 class="sub-h">Mais característicos de ${esc(nome)}</h3><div class="quadro"><table class="tabela-s"><tr><th>${unid}</th><th class="num">A por 10 mil</th><th class="num">B por 10 mil</th><th class="num">Decisões A/B</th><th class="num">G²</th><th>Log Ratio</th></tr>${L.map(x=>`<tr${x.p<bonf?"":' class="fraco"'}><td>${esc(x.w)}</td><td class="num">${per10(x.a,T.A)}</td><td class="num">${per10(x.b,T.B)}</td><td class="num">${x.da}/${x.db}</td><td class="num">${fnum(x.g2,1)}</td><td><span class="barra-in" style="width:${(60*Math.abs(x.lr)/mx).toFixed(0)}px"></span> <span class="mini">${fnum(x.lr,2)}</span></td></tr>`).join("")||'<tr><td colspan="6" class="mini">Nenhum item com p &lt; 0,05.</td></tr>'}</table></div></div>`;
    corpoKey=`<div class="duas">${tab(sa,nomeA)}${tab(sb,nomeB)}</div><p class="mini" style="margin:0">Itens em cinza não passam o limiar de Bonferroni (p &lt; ${fnum(bonf,6)} para ${nfmt(R.length)} itens testados). G²: razão de verossimilhança; Log Ratio: log₂ da razão entre as frequências relativas (1 = o dobro).</p>`;
    ps.push(`Comparação entre o grupo A (${v.t} = ${nomeA}: ${nfmt(ND.A.size)} decisões, ${nfmt(T.A)} palavras) e o grupo B (${nomeB}: ${nfmt(ND.B.size)} decisões, ${nfmt(T.B)} palavras). Para cada item calculou-se a razão de verossimilhança G² de Dunning, na forma de Rayson e Garside, como medida de evidência, e o Log Ratio de Hardie como medida de tamanho do efeito. Com ${nfmt(R.length)} itens testados, o limiar de Bonferroni é p < ${fnum(bonf,6)}; ${nfmt(R.filter(x=>x.p<bonf).length)} itens o atingem.`);
    ps.push(`Limites: a frequência de um item pode vir de poucas decisões que o repetem, por isso a coluna de decisões A/B deve ser lida junto com G². Palavra-chave estatística aponta onde olhar, e o sentido só se estabelece na leitura das ocorrências, na aba Palavras em contexto.`+(V.corp==="jan"?" Nas janelas de contexto, o vocabulário reflete só a vizinhança das menções.":""))}
  else ps.push(`Lista de frequência sobre ${nfmt(ND.A.size)} decisões e ${nfmt(T.A)} palavras. A frequência por 10 mil palavras permite comparar com outros recortes; a contagem de decisões mostra a dispersão de cada item.`);
  AR._nota=ps;
  out.innerHTML=`${corpoKey}<details${v?"":" open"}><summary class="sub-h">Lista de frequência (60 mais frequentes)</summary><div class="quadro" style="margin-top:8px"><table class="tabela-s"><tr><th>${unid}</th><th class="num">Ocorrências</th><th class="num">por 10 mil</th><th class="num">Decisões</th>${v?`<th class="num">A</th><th class="num">B</th>`:""}</tr>${fr.map(x=>`<tr><td>${esc(x.w)}</td><td class="num">${nfmt(x.a+x.b)}</td><td class="num">${per10(x.a+x.b,T.A+T.B)}</td><td class="num">${nfmt(x.da+x.db)}</td>${v?`<td class="num">${nfmt(x.a)}</td><td class="num">${nfmt(x.b)}</td>`:""}</tr>`).join("")}</table></div></details>
   ${htmlNota(ps)}${botoesExp([["x-csv","Lista completa (.csv)",1],["x-md","Nota (.md)"]])}`;
  out.querySelectorAll("td:first-child").forEach(td=>{td.style.cursor="pointer";td.title="Ver em contexto";td.onclick=()=>{if(!td.closest("table")||td.colSpan>1)return;A.kq=td.textContent;A.kre=false;A.kf="";A.sub="kwic";AR.kwic=null;guardaA();desenhaAnNav();desenhaSub()}});
  const base=`Vocabulario_${v?nomeArq(nomeA)+"_x_"+nomeArq(nomeB):"frequencias"}`;
  $("#x-csv").onclick=()=>salvaArq(base+".csv",csv([[unid,"freq_A","freq_B","por10mil_A","por10mil_B","decisoes_A","decisoes_B","G2","log_ratio","p"],...[...R].sort((x,y)=>(y.g2??y.a)-(x.g2??x.a)).map(x=>[x.w,x.a,x.b,numCSV(T.A?1e4*x.a/T.A:NaN,2),numCSV(T.B?1e4*x.b/T.B:NaN,2),x.da,x.db,numCSV(x.g2,3),numCSV(x.lr,3),numCSV(x.p,6)])]));
  $("#x-md").onclick=()=>salvaArq(base+".md",mdNota(v?`Vocabulário: ${nomeA} × ${nomeB}`:"Vocabulário: lista de frequência",ps,v?["dunning","rayson","hardie"]:[]))}

/* colocações */
function subColoc(el){
  el.innerHTML=`<form class="an-ctl" id="o-f"><label for="o-q">Nó (palavra ou expressão)<input type="search" id="o-q" value="${esc(A.cq)}" placeholder="ex.: rua, morador*" style="width:180px"></label>
    ${ctlCorpus("o-c",A.kcorp)}<label for="o-w">Janela (palavras de cada lado)<input type="number" id="o-w" min="1" max="10" value="${A.cw}" style="width:70px"></label>
    <label for="o-m">Coocorrência mínima<input type="number" id="o-m" min="2" max="50" value="${A.cmin}" style="width:70px"></label>
    <label for="o-o">Ordenar por<select id="o-o">${[["logdice","logDice"],["mi","informação mútua (MI)"],["t","t-score"],["g2","log-verossimilhança (G²)"],["o","coocorrência"]].map(([v,t])=>`<option value="${v}"${A.cord===v?" selected":""}>${t}</option>`).join("")}</select></label>
    <label class="chk"><input type="checkbox" id="o-s"${A.cstop?" checked":""}> ignorar palavras gramaticais</label>
    <button class="btn pri" type="submit">Calcular</button></form><div id="an-out" class="an-res"></div>`;
  $("#o-f").onsubmit=async e=>{e.preventDefault();A.cq=$("#o-q").value;A.kcorp=$("#o-c").value;A.cw=Math.max(1,Math.min(10,+$("#o-w").value||5));A.cmin=Math.max(2,+$("#o-m").value||3);A.cord=$("#o-o").value;A.cstop=$("#o-s").checked;guardaA();await rodaColoc()};
  $("#o-o").onchange=e=>{A.cord=e.target.value;guardaA();if(AR.coloc)desenhaColoc()};
  if(AR.coloc)desenhaColoc();else rodaColoc()}
async function rodaColoc(){
  const out=$("#an-out"),U=universo(),prog=t=>{out.innerHTML=`<div class="carregando">${esc(t)}</div>`};
  const nos=normTxt(A.cq.trim()).split(/\s+/).filter(Boolean).map(w=>new RegExp("^"+w.split("*").map(s=>s.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")).join("[\\p{L}\\p{N}-]*")+"$","u"));
  if(!nos.length){out.innerHTML=`<div class="pressup">Digite a palavra ou expressão que serve de nó.</div>`;return}
  prog("Calculando…");const D=await corpus(U,A.kcorp,prog);
  let N=0,fn=0;const fc=new Map(),O=new Map(),Le=new Map(),Ri=new Map(),forma=new Map(),docs=new Map(),W=A.cw;
  for(const d of D){const raw=tokens(d.t),nt=raw.map(normTxt);N+=nt.length;nt.forEach((w,i)=>{fc.set(w,(fc.get(w)||0)+1);if(!forma.has(w))forma.set(w,raw[i])});
    for(let i=0;i+nos.length<=nt.length;i++){if(!nos.every((r,q)=>r.test(nt[i+q])))continue;fn++;const e=i+nos.length;
      for(let q=Math.max(0,i-W);q<Math.min(nt.length,e+W);q++){if(q>=i&&q<e)continue;const w=nt[q];if(A.cstop&&(STOP.has(raw[q])||w.length<2))continue;
        O.set(w,(O.get(w)||0)+1);(q<i?Le:Ri).set(w,((q<i?Le:Ri).get(w)||0)+1);(docs.get(w)||docs.set(w,new Set()).get(w)).add(d.id)}}}
  const span=2*W,R=[];
  for(const [w,o] of O){if(o<A.cmin)continue;const f=fc.get(w),E=fn*f*span/N;const o12=Math.max(0,fn*span-o),o21=Math.max(0,f-o),o22=Math.max(0,N-fn*span-f+o);
    const ll=(x,e)=>x>0&&e>0?x*Math.log(x/e):0;const n=o+o12+o21+o22,r1=o+o12,r2=o21+o22,c1=o+o21,c2=o12+o22;
    const g2=2*(ll(o,r1*c1/n)+ll(o12,r1*c2/n)+ll(o21,r2*c1/n)+ll(o22,r2*c2/n));
    R.push({w,forma:forma.get(w),o,f,l:Le.get(w)||0,r:Ri.get(w)||0,nd:docs.get(w).size,mi:Math.log2(o/E),t:(o-E)/Math.sqrt(o),logdice:14+Math.log2(2*o/(fn+f)),g2})}
  AR.coloc={R,N,fn,U,D,q:A.cq,corp:A.kcorp,W,min:A.cmin,stop:A.cstop};desenhaColoc()}
function desenhaColoc(){
  const out=$("#an-out"),C=AR.coloc;if(!C)return;const {R,U,D}=C;const k=A.cord;const L=[...R].sort((a,b)=>b[k]-a[k]).slice(0,60);const mx=Math.max(1e-9,...L.map(x=>Math.abs(x[k])));
  const ps=[`Universo: ${descUniv(U)}. Corpus: ${descCorpus(C.corp,D,U)}, com ${nfmt(C.N)} palavras. Nó: "${C.q}", com ${nfmt(C.fn)} ocorrências. Colocados contados numa janela de ${C.W} palavras de cada lado${C.stop?", sem palavras gramaticais":""}, com coocorrência mínima de ${C.min}.`,
    `Medidas: coocorrência observada; informação mútua, log₂ de O/E com E = f(nó) × f(colocado) × ${2*C.W} / N; t-score, (O − E)/√O; logDice de Rychlý, 14 + log₂(2O / (f(nó) + f(colocado))); e log-verossimilhança G² sobre a tabela 2 × 2 de coocorrência. A informação mútua favorece itens raros e o t-score favorece itens frequentes; o logDice independe do tamanho do corpus e serve para comparar recortes. A ordenação usada foi ${({logdice:"logDice",mi:"informação mútua",t:"t-score",g2:"G²",o:"coocorrência"})[k]}.`,
    `Limites: janelas que se sobrepõem, quando o nó aparece duas vezes perto, contam o mesmo colocado mais de uma vez; a coluna de decisões mostra a dispersão.${C.corp==="jan"?" Nas janelas de contexto, o corpus já é recortado em torno dos descritores, o que eleva a frequência dos próprios descritores e afeta o valor esperado.":""} As medidas apontam padrões a examinar na concordância, sem dizer por si o sentido do uso.`];AR._nota=ps;
  out.innerHTML=`<div class="an-cards"><div class="card"><span class="rot">Ocorrências do nó</span><span class="v">${nfmt(C.fn)}</span><span class="mini">${nfmt(C.N)} palavras no corpus</span></div><div class="card"><span class="rot">Colocados listados</span><span class="v">${nfmt(R.length)}</span><span class="mini">coocorrência ≥ ${C.min}, janela ±${C.W}</span></div></div>
    <div class="quadro"><table class="tabela-s"><tr><th>Colocado</th><th class="num">O</th><th class="num">esq./dir.</th><th class="num">f</th><th class="num">Decisões</th><th class="num">MI</th><th class="num">t</th><th class="num">logDice</th><th class="num">G²</th><th></th></tr>
    ${L.map(x=>`<tr><td><button class="btn sut" data-w="${esc(x.forma)}" title="Ver em contexto">${esc(x.forma)}</button></td><td class="num">${nfmt(x.o)}</td><td class="num">${x.l}/${x.r}</td><td class="num">${nfmt(x.f)}</td><td class="num">${x.nd}</td><td class="num">${fnum(x.mi,2)}</td><td class="num">${fnum(x.t,2)}</td><td class="num">${fnum(x.logdice,2)}</td><td class="num">${fnum(x.g2,1)}</td><td><span class="barra-in" style="width:${Math.max(1,70*Math.abs(x[k])/mx).toFixed(0)}px"></span></td></tr>`).join("")||'<tr><td colspan="10" class="mini">Nenhum colocado com essa coocorrência mínima.</td></tr>'}</table></div>
    ${htmlNota(ps)}${botoesExp([["x-csv","Colocados (.csv)",1],["x-md","Nota (.md)"]])}`;
  out.querySelectorAll("[data-w]").forEach(b=>b.onclick=()=>{A.kq=C.q;A.kf=b.dataset.w;A.kre=false;A.kw=C.W;A.sub="kwic";AR.kwic=null;guardaA();desenhaAnNav();desenhaSub()});
  const base=`Colocacoes_${nomeArq(C.q)}`;
  $("#x-csv").onclick=()=>salvaArq(base+".csv",csv([["colocado","coocorrencia","esquerda","direita","freq_corpus","decisoes","MI","t_score","logDice","G2"],...[...R].sort((a,b)=>b[k]-a[k]).map(x=>[x.forma,x.o,x.l,x.r,x.f,x.nd,numCSV(x.mi,3),numCSV(x.t,3),numCSV(x.logdice,3),numCSV(x.g2,3)])]));
  $("#x-md").onclick=()=>salvaArq(base+".md",mdNota(`Colocações de ${C.q}`,ps,["evert","rychly","dunning"]))}

