"use strict";
/* Estatística: distribuições, testes de independência, kappa. Portado da Mesa de leitura PSR sem mudança de método. */
const SEMENTE=20261118;
function kappa(pares){const n=pares.length;if(!n)return null;const cats=[...new Set(pares.flat())];
  let ag=0;const fa={},fb={};for(const [a,b] of pares){if(a===b)ag++;fa[a]=(fa[a]||0)+1;fb[b]=(fb[b]||0)+1}
  const po=ag/n;let pe=0;for(const k of cats)pe+=((fa[k]||0)/n)*((fb[k]||0)/n);
  return {n,po,k:pe===1?1:(po-pe)/(1-pe)}}
const fk=x=>x==null?"–":x.toFixed(2).replace(".",",");
const fp=x=>x==null?"–":Math.round(x*100)+"%";
const ST=(()=>{
  const LG=[76.18009172947146,-86.50532032941677,24.01409824083091,-1.231739572450155,0.1208650973866179e-2,-0.5395239384953e-5];
  function lgam(x){let y=x,t=x+5.5;t-=(x+.5)*Math.log(t);let s=1.000000000190015;for(const c of LG)s+=c/++y;return -t+Math.log(2.5066282746310005*s/x)}
  function gser(a,x){let ap=a,sum=1/a,del=sum;for(let n=0;n<1000;n++){ap++;del*=x/ap;sum+=del;if(Math.abs(del)<Math.abs(sum)*1e-15)break}return sum*Math.exp(-x+a*Math.log(x)-lgam(a))}
  function gcf(a,x){let b=x+1-a,c=1e300,d=1/b,h=d;for(let i=1;i<1000;i++){const an=-i*(i-a);b+=2;d=an*d+b;if(Math.abs(d)<1e-300)d=1e-300;c=b+an/c;if(Math.abs(c)<1e-300)c=1e-300;d=1/d;const del=d*c;h*=del;if(Math.abs(del-1)<1e-15)break}return Math.exp(-x+a*Math.log(x)-lgam(a))*h}
  function gammq(a,x){if(!(x>0))return 1;return x<a+1?1-gser(a,x):gcf(a,x)}
  const chi2p=(x,df)=>df>0?Math.min(1,Math.max(0,gammq(df/2,x/2))):1;
  const erfc=x=>x>=0?gammq(.5,x*x):2-gammq(.5,x*x);
  const pnorm=z=>.5*erfc(-z/Math.SQRT2);
  function qnorm(p){const a=[-39.69683028665376,220.9460984245205,-275.9285104469687,138.3577518672690,-30.66479806614716,2.506628277459239],b=[-54.47609879822406,161.5858368580409,-155.6989798598866,66.80131188771972,-13.28068155288572],c=[-7.784894002430293e-3,-0.3223964580411365,-2.400758277161838,-2.549732539343734,4.374664141464968,2.938163982698783],d=[7.784695709041462e-3,0.3224671290700398,2.445134137142996,3.754408661907416];const pl=.02425;let q,r;
    if(p<pl){q=Math.sqrt(-2*Math.log(p));return(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5])/((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1)}
    if(p>1-pl){q=Math.sqrt(-2*Math.log(1-p));return-(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5])/((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1)}
    q=p-.5;r=q*q;return(((((a[0]*r+a[1])*r+a[2])*r+a[3])*r+a[4])*r+a[5])*q/(((((b[0]*r+b[1])*r+b[2])*r+b[3])*r+b[4])*r+1)}
  const lf=n=>lgam(n+1),lC=(n,k)=>lf(n)-lf(k)-lf(n-k);
  function fisher2(a,b,c,d){const r1=a+b,r2=c+d,c1=a+c,n=r1+r2;const pr=x=>Math.exp(lC(r1,x)+lC(r2,c1-x)-lC(n,c1));const p0=pr(a);let p=0;for(let x=Math.max(0,c1-r2);x<=Math.min(r1,c1);x++){const q=pr(x);if(q<=p0*(1+1e-7))p+=q}return Math.min(1,p)}
  function rng(seed){let s=seed>>>0;return()=>{s=(s+0x6D2B79F5)>>>0;let t=s;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}
  function wilson(x,n,z=1.959964){if(!n)return[NaN,NaN,NaN];const p=x/n,d=1+z*z/n,c=(p+z*z/(2*n))/d,h=z*Math.sqrt(p*(1-p)/n+z*z/(4*n*n))/d;return[p,Math.max(0,c-h),Math.min(1,c+h)]}
  function holm(ps){const o=ps.map((p,i)=>[p,i]).sort((a,b)=>a[0]-b[0]);const m=ps.length,out=new Array(m);let run=0;o.forEach(([p,i],j)=>{run=Math.max(run,Math.min(1,(m-j)*p));out[i]=run});return out}
  return {lgam,chi2p,pnorm,qnorm,fisher2,rng,wilson,holm};
})();
const memoIndep=new Map();
function indep(O){
  const chave=JSON.stringify(O);if(memoIndep.has(chave))return memoIndep.get(chave);
  const r=O.length,k=O[0].length,R=O.map(l=>l.reduce((a,b)=>a+b,0)),C=O[0].map((_,j)=>O.reduce((a,l)=>a+l[j],0)),n=R.reduce((a,b)=>a+b,0);
  const E=O.map((l,i)=>l.map((_,j)=>R[i]*C[j]/n));let chi=0,baixo=0,minE=Infinity;
  O.forEach((l,i)=>l.forEach((o,j)=>{const e=E[i][j];chi+=(o-e)**2/e;if(e<5)baixo++;minE=Math.min(minE,e)}));
  const df=(r-1)*(k-1),p=ST.chi2p(chi,df),m=Math.min(r,k)-1,V=Math.sqrt(chi/(n*m));
  const phi2c=Math.max(0,chi/n-(k-1)*(r-1)/(n-1)),kc=k-(k-1)**2/(n-1),rc=r-(r-1)**2/(n-1),Vc=Math.sqrt(phi2c/Math.max(1e-12,Math.min(kc-1,rc-1)));
  const Z=O.map((l,i)=>l.map((o,j)=>{const e=E[i][j],v=e*(1-R[i]/n)*(1-C[j]/n);return v>0?(o-e)/Math.sqrt(v):0}));
  const cells=r*k,zc=ST.qnorm(1-.05/(2*cells));
  const res={O,E,R,C,n,r,k,chi,df,p,m,V,Vc,Z,zc,cells,baixo,pctBaixo:baixo/cells,minE};
  if(r===2&&k===2){const [[a,b],[c,d]]=O;res.fisher=ST.fisher2(a,b,c,d);const h=(a&&b&&c&&d)?0:.5,or=((a+h)*(d+h))/((b+h)*(c+h)),se=Math.sqrt(1/(a+h)+1/(b+h)+1/(c+h)+1/(d+h));res.or=[or,Math.exp(Math.log(or)-1.959964*se),Math.exp(Math.log(or)+1.959964*se)];res.haldane=!!h}
  else if(res.pctBaixo>.2||minE<1)res.mc=monteCarlo(R,C,n,chi);
  memoIndep.set(chave,res);return res}
function monteCarlo(R,C,n,obs,B=10000){
  const rl=new Int32Array(n),cl=new Int32Array(n);let t=0;R.forEach((x,i)=>{for(let q=0;q<x;q++)rl[t++]=i});t=0;C.forEach((x,j)=>{for(let q=0;q<x;q++)cl[t++]=j});
  const r=R.length,k=C.length,E=new Float64Array(r*k);for(let i=0;i<r;i++)for(let j=0;j<k;j++)E[i*k+j]=R[i]*C[j]/n;
  const g=ST.rng(SEMENTE),T=new Int32Array(r*k);let ge=0;
  for(let b=0;b<B;b++){for(let i=n-1;i>0;i--){const j=Math.floor(g()*(i+1)),x=cl[i];cl[i]=cl[j];cl[j]=x}T.fill(0);for(let i=0;i<n;i++)T[rl[i]*k+cl[i]]++;let s=0;for(let q=0;q<r*k;q++){const d=T[q]-E[q];s+=d*d/E[q]}if(s>=obs-1e-9)ge++}
  const p=(ge+1)/(B+1);return {p,B,se:Math.sqrt(p*(1-p)/B)}}
function kappaFull(pares,ordem){
  const n=pares.length;if(!n)return null;
  let cats=[...new Set(pares.flat())];if(ordem)cats.sort((a,b)=>(ordem.indexOf(a)+1||99)-(ordem.indexOf(b)+1||99)||String(a).localeCompare(b));
  const ix=new Map(cats.map((c,i)=>[c,i])),K=cats.length,M=cats.map(()=>new Array(K).fill(0));
  pares.forEach(([a,b])=>M[ix.get(a)][ix.get(b)]++);
  const P=M.map(l=>l.map(v=>v/n)),pr=P.map(l=>l.reduce((a,b)=>a+b,0)),pc=cats.map((_,j)=>P.reduce((a,l)=>a+l[j],0));
  let po=0,pe=0;for(let i=0;i<K;i++){po+=P[i][i];pe+=pr[i]*pc[i]}
  const k=pe>=1?1:(po-pe)/(1-pe);
  let A1=0,B1=0;for(let i=0;i<K;i++){A1+=P[i][i]*((1-pe)-(pr[i]+pc[i])*(1-po))**2;for(let j=0;j<K;j++)if(i!==j)B1+=P[i][j]*(pc[i]+pr[j])**2}
  const v=pe>=1?0:(A1+(1-po)**2*B1-(po*pe-2*pe+po)**2)/(n*(1-pe)**4),se=v>0?Math.sqrt(v):0;
  const nc=cats.map((_,i)=>(pr[i]+pc[i])*n),N2=2*n,De=(N2*N2-nc.reduce((a,x)=>a+x*x,0))/(N2*(N2-1)),alpha=De>0?1-(1-po)/De:NaN;
  const pabak=K>1?(K*po-1)/(K-1):NaN;
  const esp=cats.map((_,i)=>{const d=pr[i]*n+pc[i]*n;return d?2*M[i][i]/d:NaN});
  return {n,cats,M,po,pe,k,se,lo:k-1.959964*se,hi:k+1.959964*se,alpha,pabak,esp,rA:pr.map(x=>Math.round(x*n)),rB:pc.map(x=>Math.round(x*n))}}
/* formatação */
const fnum=(x,d=2)=>Number.isFinite(x)?x.toLocaleString("pt-BR",{minimumFractionDigits:d,maximumFractionDigits:d}):"–";
const fpv=p=>!Number.isFinite(p)?"–":p<.001?"< 0,001":"= "+fnum(p,3);
const fpc=p=>!Number.isFinite(p)?"–":p<.001?"< 0,001":fnum(p,3);
const fpct=(x,d=1)=>Number.isFinite(x)?fnum(100*x,d)+"%":"–";
const hojeBR=()=>{const d=new Date();return dataBR(d.toISOString().slice(0,10))+" às "+horaBR(d.getTime())};
const OUTRAS="outras categorias";
function hexRgb(h){h=h.replace("#","");if(h.length===3)h=h.split("").map(x=>x+x).join("");const n=parseInt(h,16);return [n>>16&255,n>>8&255,n&255]}
const rgbHex=a=>"#"+a.map(x=>Math.round(Math.max(0,Math.min(255,x))).toString(16).padStart(2,"0")).join("");
const mix=(a,b,t)=>{const x=hexRgb(a),y=hexRgb(b);return rgbHex(x.map((v,i)=>v+(y[i]-v)*t))};
function lum(h){const c=hexRgb(h).map(v=>{v/=255;return v<=.03928?v/12.92:((v+.055)/1.055)**2.4});return .2126*c[0]+.7152*c[1]+.0722*c[2]}
function paleta(){const cs=getComputedStyle(document.documentElement),v=n=>cs.getPropertyValue(n).trim(),th=document.documentElement.dataset.theme;
  const escuro=th==="dark"||(th!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches);
  return {escuro,papel:v("--papel"),sup:v("--superficie"),sup2:v("--superficie-2"),tinta:v("--tinta"),tinta2:v("--tinta-2"),tinta3:v("--tinta-3"),linha:v("--linha"),linhaF:v("--linha-forte"),caneta:v("--caneta"),
    pos:escuro?"#7ea2ff":"#2f5fc4",neg:escuro?"#ff8a7a":"#c0392b",neu:escuro?"#383835":"#f0efec",tintaClara:"#ffffff",tintaEscura:"#15181b"}}
const tintaSobre=(fill,P)=>lum(fill)>.42?P.tintaEscura:P.tintaClara;
function quebra(s,max,lin=3){const w=String(s).split(/\s+/);const L=[];let cur="";for(const x of w){if((cur+" "+x).trim().length>max&&cur){L.push(cur);cur=x}else cur=(cur+" "+x).trim()}if(cur)L.push(cur);if(L.length>lin){L.length=lin;L[lin-1]=L[lin-1].slice(0,max-1)+"…"}return L}
const numCSV=(x,d=4)=>Number.isFinite(x)?String(+x.toFixed(d)).replace(".",","):"";
async function svgPng(svg){const url=URL.createObjectURL(new Blob([svg],{type:"image/svg+xml"}));
  try{const img=new Image();await new Promise((ok,er)=>{img.onload=ok;img.onerror=()=>er(new Error("imagem"));img.src=url});
    const s=2,cv=document.createElement("canvas");cv.width=img.width*s;cv.height=img.height*s;const g=cv.getContext("2d");g.scale(s,s);g.drawImage(img,0,0);
    return await new Promise((ok,er)=>cv.toBlob(b=>b?ok(b):er(new Error("png")),"image/png"))}finally{URL.revokeObjectURL(url)}}
const magV=(V,m)=>{const s=Math.sqrt(Math.max(1,m));return V<.1/s?"desprezível":V<.3/s?"pequena":V<.5/s?"média":"grande"};
const landis=k=>k<0?"pior que o acaso":k<=.2?"leve":k<=.4?"razoável":k<=.6?"moderada":k<=.8?"substancial":"quase perfeita";
