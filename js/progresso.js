"use strict";
/* Progresso: quanto cada revisor codificou, concordância, consenso, codificação prévia × leitura humana e exportação. */
function vistaProgresso(m){
  const U=S.casos,cods=LIVRO().map(x=>x.cod);
  const n1=U.filter(c=>S.rev[1][c.id]?.c).length,n2=U.filter(c=>S.rev[2][c.id]?.c).length;
  const amb=U.filter(c=>S.rev[1][c.id]?.c&&S.rev[2][c.id]?.c);
  const k12=kappa(amb.map(c=>[S.rev[1][c.id].c,S.rev[2][c.id].c]));
  const div=amb.filter(c=>S.rev[1][c.id].c!==S.rev[2][c.id].c&&!S.cons[c.id]?.c);
  const ncons=U.filter(c=>S.cons[c.id]?.c).length;
  const hum=c=>S.cons[c.id]?.c||meu(c.id)?.c||null;
  const hv=U.filter(c=>hum(c)&&c.sug);const kSug=kappa(hv.map(c=>[c.sug,hum(c)]));
  const lote=U.filter(c=>meu(c.id)?.lote).length;
  const sugs=[...new Set(U.map(c=>c.sug).filter(Boolean))];const linhasM=[...cods.filter(x=>sugs.includes(x)),...sugs.filter(x=>!cods.includes(x))];
  const mat={};hv.forEach(c=>{const k=c.sug+"|"+hum(c);mat[k]=(mat[k]||0)+1});
  const dist=cods.map(cd=>[cd,U.filter(c=>S.rev[1][c.id]?.c===cd).length,U.filter(c=>S.rev[2][c.id]?.c===cd).length,U.filter(c=>S.cons[c.id]?.c===cd).length]);
  const semTx=U.filter(c=>!c.tx).length;
  m.innerHTML=`<div class="pagina"><div class="pagina-in">
   <div class="sec-t"><div><h2>Progresso da revisão</h2><p class="lead">${nfmt(U.length)} decisões no projeto${semTx?`, ${nfmt(semTx)} sem texto importado`:""}. Os códigos de cada revisor ficam separados; o consenso é registrado à parte, na ficha.</p></div></div>
   <div class="cards">
    ${[1,2].map(s=>{const n=s===1?n1:n2;return `<div class="card"><span class="rot">${esc(nomeRev(s))}${S.eu===s?" · você":""}</span><span class="v">${nfmt(n)}<small> / ${nfmt(U.length)}</small></span><div class="prog"><i class="a" style="width:${pct(n,U.length)}%;background:${s===1?"var(--caneta)":"var(--verde)"}"></i></div><span class="mini">${pct(n,U.length)}% codificadas${S.eu!==s&&!n?" · importe o arquivo deste revisor em Projeto › Dupla revisão":""}</span></div>`}).join("")}
    <div class="card"><span class="rot">Concordância entre revisores</span><span class="v">${fk(k12?.k)}<small> kappa</small></span><span class="mini">${amb.length} decisões codificadas pelos dois · ${fp(k12?.po)} de acordo</span></div>
    <div class="card"><span class="rot">Consenso</span><span class="v">${nfmt(ncons)}<small> registrados</small></span><span class="mini">${div.length} divergências ainda sem consenso</span>${div.length?'<button class="btn" id="ir-div">Abrir as divergências</button>':""}</div>
   </div>
   <div class="duas">
    <div><h2 style="font-size:16px">Distribuição dos códigos</h2><p class="lead">Quantas decisões cada revisor pôs em cada código.</p>
     <div class="quadro"><table class="tabela-s"><tr><th>Código</th><th class="num">${esc(nomeCurto(1))}</th><th class="num">${esc(nomeCurto(2))}</th><th class="num">Consenso</th></tr>
     ${dist.map(([cd,a,b,k])=>`<tr><td><b class="mono">${esc(cd)}</b> ${esc(rotCod(cd)!==cd?rotCod(cd):"")}</td><td class="num">${nfmt(a)}</td><td class="num">${nfmt(b)}</td><td class="num">${nfmt(k)}</td></tr>`).join("")||'<tr><td colspan="4" class="mini">Livro de códigos vazio.</td></tr>'}</table></div></div>
    ${temSug()?`<div><h2 style="font-size:16px">Codificação prévia × leitura humana</h2><p class="lead">Linhas: codificação prévia da planilha. Colunas: consenso, ou o seu código onde ainda não há consenso. ${hv.length} decisões; ${fp(kSug?.po)} iguais; kappa ${fk(kSug?.k)}.${lote?` ${lote} dos seus códigos foram confirmados em lote e entram nessa conta.`:""}</p>
     ${hv.length?`<div class="quadro"><table class="tabela-s mat"><tr><th></th>${cods.map(c=>`<th title="${esc(descCod(c))}">${esc(c)}</th>`).join("")}</tr>${linhasM.map(a=>`<tr><th title="${esc(descCod(a))}">${esc(a)}</th>${cods.map(b=>{const v=mat[a+"|"+b]||0;return `<td class="${a===b?"d":""}" style="${v&&a!==b?"color:var(--vermelho)":""}">${v||"·"}</td>`}).join("")}</tr>`).join("")}</table></div>`:'<div class="pressup">Nenhuma decisão com codificação prévia foi codificada ainda.</div>'}</div>`:""}
   </div>
   <div class="sec-t"><div><h2 style="font-size:16px">Exportar</h2><p class="lead">A planilha traz as colunas originais e, para cada revisor, o código, os campos da ficha, o trecho-chave e a observação, além do consenso. Separador ponto e vírgula, para abrir direto no Excel.</p></div>
    <div class="links"><button class="btn pri" id="exp-csv">Baixar base revisada (.csv)</button><a class="btn" href="#projeto">Dupla revisão e cópias de segurança</a></div></div>
   <p class="mini" id="exp-msg" role="status"></p>
  </div></div>`;
  $("#ir-div")?.addEventListener("click",()=>{limpaFiltros();S.f.sit="divergentes";location.hash="leitura"});
  $("#exp-csv").onclick=()=>salvaArq(`${nomeArq(S.cfg.nome)}_base_revisada_${hojeISO()}.csv`,csvRevisada(),"#exp-msg");
}
function csvRevisada(){
  const j=v=>Array.isArray(v)?v.join("; "):v==null?"":String(v);
  const extras=(S.cfg.extras||[]).map(e=>e.col);
  const cab=["identificador",...(S.cfg.cols.proc?["processo"]:[]),...(S.cfg.cols.data?["data"]:[]),...(S.cfg.marcos?.length?["periodo"]:[]),...(S.cfg.cols.orgao?["orgao"]:[]),...(S.cfg.cols.classe?["classe"]:[]),...(S.cfg.cols.link?["link"]:[]),...(temSug()?["codificacao_previa"]:[]),"tem_texto",...extras];
  const rev=s=>{const p="_r"+s;return ["codigo"+p,...CAMPOS().map(f=>nomeArq(f.rot).toLowerCase()+p),"trecho_chave"+p,"transcricoes"+p,"observacao"+p,"confirmado_em_lote"+p,"registrado_em"+p]};
  cab.push(...rev(1),...rev(2),"codigo_consenso","nota_consenso");
  const L=[cab];
  for(const c of S.casos){
    const l=[c.id,...(S.cfg.cols.proc?[c.proc]:[]),...(S.cfg.cols.data?[dataBR(c.data)]:[]),...(S.cfg.marcos?.length?[periodo(c)||""]:[]),...(S.cfg.cols.orgao?[c.orgao]:[]),...(S.cfg.cols.classe?[c.classe]:[]),...(S.cfg.cols.link?[c.link]:[]),...(temSug()?[c.sug]:[]),c.tx?"sim":"não",...extras.map(e=>c.x[e])];
    for(const s of [1,2]){const r=S.rev[s][c.id]||{};l.push(j(r.c),...CAMPOS().map(f=>j(r[f.id])),j(r.tk),(r.trans||[]).join(" || "),j(r.obs),r.lote?"sim":"",r.t?new Date(r.t).toISOString():"")}
    const k=S.cons[c.id]||{};l.push(j(k.c),j(k.nota));L.push(l)}
  return csv(L);
}
