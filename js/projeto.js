"use strict";
/* Telas de início, criação e configuração do projeto. */
const PAPEL_ROT=Object.fromEntries(PAPEIS_COL.map(([k,t])=>[k,t]));
const TIPO_EXTRA={cat:"categoria (vira filtro e variável)",num:"número",texto:"texto livre",ign:"ignorar"};

/* ---------- início ---------- */
async function vistaInicio(m){
  m.innerHTML=`<div class="pagina"><div class="pagina-in inicio">
    <div class="sec-t"><div><h2>Painel de decisões judiciais</h2>
      <p class="lead">Mesa de leitura e codificação para pesquisa empírica com decisões judiciais. Suba a planilha da sua coleta e os textos em TXT, informe os termos de busca e o livro de códigos, e trabalhe com leitura, dupla revisão e análises. Os dados ficam só neste navegador: nada é enviado a servidor.</p></div></div>
    <div class="links"><a class="btn pri" href="#novo">Criar projeto</a><label class="btn" for="abre-pacote">Abrir pacote de projeto (.zip)</label><input type="file" id="abre-pacote" accept=".zip" hidden><button class="btn" id="abre-exemplo">Abrir o exemplo fictício</button></div>
    <p class="mini" id="ini-msg" role="status"></p>
    <div><h2 style="font-size:16px">Projetos neste navegador</h2><div class="cards" id="ini-lista" style="margin-top:10px"><div class="carregando">Procurando…</div></div></div>
    <div class="duas ajuda">
      <div class="card"><span class="rot">Como preparar os dados</span>
        <p>Uma planilha (CSV ou XLSX) com uma linha por decisão e uma coluna de identificador. Opcionalmente: processo, data, órgão, classe, link e uma coluna com codificação prévia, que aparece como sugestão.</p>
        <p>Um arquivo TXT por decisão, com o nome igual ao identificador (<span class="mono">12345.txt</span> para a linha 12345). Pode selecionar vários arquivos, uma pasta ou um ZIP.</p>
        <p>No XLSX, abas chamadas <span class="mono">codigos</span> e <span class="mono">campos</span> já trazem o livro de códigos e a ficha.</p></div>
      <div class="card"><span class="rot">Dupla revisão</span>
        <p>Quem cria o projeto baixa o pacote (.zip) e passa ao segundo revisor, que o abre aqui e escolhe ser o revisor 2. Daí em diante, cada um baixa o próprio arquivo de codificação e importa o do colega; o painel junta os dois, mostra as divergências e calcula o kappa.</p>
        <p>Guarde cópias do pacote: limpar os dados do navegador apaga os projetos.</p></div>
    </div></div></div>`;
  $("#abre-exemplo").onclick=async()=>{const b=$("#abre-exemplo");b.disabled=true;$("#ini-msg").textContent="Montando o exemplo…";
    try{const id=await criaExemplo();await abreProjeto(id);location.hash="leitura"}catch(e){$("#ini-msg").textContent="Não consegui montar o exemplo: "+e.message;b.disabled=false}};
  $("#abre-pacote").onchange=async e=>{const f=e.target.files[0];if(!f)return;$("#ini-msg").textContent="Abrindo o pacote…";
    try{const r=await importaPacote(f);await abreProjeto(r.id);
      if(r.junto)aviso(`Este projeto já estava neste navegador; as codificações do pacote foram juntadas (${r.r.r1.novos+r.r.r2.novos} novas, ${r.r.r1.atual+r.r.r2.atual} atualizadas).`);
      else aviso("Pacote aberto. Se você é o segundo revisor, escolha “revisor 2” no menu do canto superior direito antes de codificar.");
      location.hash="leitura"}
    catch(er){$("#ini-msg").textContent="Não consegui abrir o pacote: "+er.message}};
  let L=[];try{L=await Armazem.lista()}catch(e){$("#ini-lista").innerHTML=`<div class="pressup alerta">${esc(e.message)}</div>`;return}
  $("#ini-lista").innerHTML=L.length?L.map(p=>`<div class="card"><span class="rot">${esc(p.nome)}</span><span class="v">${nfmt(p.n)}<small> decisões</small></span><span class="mini">atualizado em ${p.atualizado?dataBR(new Date(p.atualizado).toISOString().slice(0,10)):"–"}</span><div class="links"><button class="btn pri" data-abre="${esc(p.id)}">Abrir</button></div></div>`).join("")
    :`<div class="pressup">Nenhum projeto ainda. Crie um com os seus dados ou abra o exemplo para conhecer o painel.</div>`;
  m.querySelectorAll("[data-abre]").forEach(b=>b.onclick=async()=>{await abreProjeto(b.dataset.abre);location.hash="leitura"});
}

/* ---------- formulário comum ---------- */
function htmlEditores(v){
  return `
  <section class="form-sec"><h3>Termos de busca da coleta</h3>
    <p class="mini">Um por linha, exatamente como usados no levantamento. O marca-texto amarelo, a navegação entre menções, os trechos e as análises de corpus usam estes termos. A busca ignora acento e maiúsculas; <span class="mono">*</span> completa a palavra (<span class="mono">insignific*</span>).</p>
    <textarea id="e-termos" rows="4" class="txt mono-in" placeholder="princípio da insignificância&#10;bagatela">${esc((v.termos||[]).join("\n"))}</textarea><div class="erro" id="err-termos" role="alert"></div></section>
  <section class="form-sec"><h3>Normas e precedentes de interesse <span class="mini">opcional</span></h3>
    <p class="mini">Aparecem em destaque verde no texto. Um por linha, com a mesma regra dos termos.</p>
    <textarea id="e-normas" rows="3" class="txt mono-in" placeholder="Súmula 599&#10;HC 84.412">${esc((v.normas||[]).join("\n"))}</textarea></section>
  <section class="form-sec"><h3>Livro de códigos</h3>
    <p class="mini">Um código por linha: <span class="mono">CÓDIGO | rótulo | descrição</span>. Os dez primeiros ganham atalho de teclado (1 a 0). Também pode carregar de um CSV com as colunas codigo, rotulo, descricao.</p>
    <textarea id="e-livro" rows="6" class="txt mono-in" placeholder="INC | Incluída | A decisão enfrenta o tema&#10;EXC | Excluída | Menção sem relação com o caso">${esc(livroParaTexto(v.livro))}</textarea>
    <div class="links"><label class="btn sut" for="e-livro-arq">Carregar CSV</label><input type="file" id="e-livro-arq" accept=".csv,.txt" hidden>${v.podeGerar?'<button class="btn sut" type="button" id="e-livro-sug">Gerar a partir da codificação prévia</button>':""}</div>
    <div class="erro" id="err-livro" role="alert"></div></section>
  <section class="form-sec"><h3>Campos da ficha <span class="mini">opcional</span></h3>
    <p class="mini">Um campo por linha: <span class="mono">rótulo | tipo | opção; opção | coluna de sugestão</span>. Tipos: única, múltipla, sim/não, texto. A coluna de sugestão (opcional) é uma coluna da planilha cujo valor aparece como sugestão.</p>
    <textarea id="e-campos" rows="5" class="txt mono-in" placeholder="Resultado para o réu | única | favorável; desfavorável; parcial&#10;Fundamentos | múltipla | reincidência; valor; habitualidade&#10;Cita precedente do STF | sim/não">${esc(camposParaTexto(v.campos))}</textarea>
    <div class="erro" id="err-campos" role="alert"></div></section>
  <section class="form-sec"><h3>Marcos temporais <span class="mini">opcional</span></h3>
    <p class="mini">Datas que dividem o período estudado (uma lei, uma resolução, uma mudança de entendimento): <span class="mono">dd/mm/aaaa | rótulo</span>. Viram a variável Período e aparecem na série no tempo.</p>
    <textarea id="e-marcos" rows="2" class="txt mono-in" placeholder="01/07/2020 | Lei nova">${esc(marcosParaTexto(v.marcos))}</textarea></section>
  <section class="form-sec"><h3>Revisores</h3>
    <div class="grade2"><label>Revisor 1<input class="txt" id="e-r1" value="${esc(v.revisores?.[0]||"Revisor 1")}"></label><label>Revisor 2<input class="txt" id="e-r2" value="${esc(v.revisores?.[1]||"Revisor 2")}"></label></div>
    ${v.comEu?`<label class="chk-l">Neste navegador, eu sou <select id="e-eu" class="txt" style="width:auto"><option value="1">revisor 1</option><option value="2">revisor 2</option></select></label>`:""}</section>`;
}
function leEditores(){
  const v={termos:linhas($("#e-termos").value),normas:linhas($("#e-normas").value),livro:livroDeTexto($("#e-livro").value),campos:camposDeTexto($("#e-campos").value),
    marcos:marcosDeTexto($("#e-marcos").value),revisores:[$("#e-r1").value.trim()||"Revisor 1",$("#e-r2").value.trim()||"Revisor 2"]};
  const erros={};
  if(!v.termos.length)erros.termos="Informe pelo menos um termo de busca.";
  else{const ruim=v.termos.find(t=>{try{rxTermos([t]);return false}catch(e){return true}});if(ruim)erros.termos=`Não consegui usar o termo “${ruim}”. Tire caracteres especiais além de *.`}
  const dup=v.livro.map(x=>x.cod).find((c,i,a)=>a.indexOf(c)!==i);if(dup)erros.livro=`O código ${dup} aparece duas vezes no livro.`;
  const semOp=v.campos.find(f=>(f.tipo==="unica"||f.tipo==="multipla")&&!f.opcoes.length);if(semOp)erros.campos=`O campo “${semOp.rot}” é de escolha e está sem opções. Liste-as separadas por ponto e vírgula.`;
  ["termos","livro","campos"].forEach(k=>{const e=$("#err-"+k);if(e)e.textContent=erros[k]||""});
  return {v,erros};
}
function ligaEditores(sugs){
  $("#e-livro-arq").onchange=async e=>{const f=e.target.files[0];if(!f)return;
    try{const p=await lePlanilha(f);const L=livroDeAba(p);$("#e-livro").value=livroParaTexto(L);$("#err-livro").textContent=L.length?"":"Não encontrei códigos no arquivo."}catch(er){$("#err-livro").textContent=er.message}};
  $("#e-livro-sug")?.addEventListener("click",()=>{const vs=sugs();if(!vs.length){$("#err-livro").textContent="A coluna de codificação prévia está vazia ou não foi indicada.";return}
    const atual=livroDeTexto($("#e-livro").value);const tem=new Set(atual.map(x=>x.cod));
    $("#e-livro").value=livroParaTexto([...atual,...vs.filter(x=>!tem.has(x)).map(x=>({cod:x,rot:x,desc:""}))]);$("#err-livro").textContent=""});
  for(const id of ["e-termos","e-livro","e-campos"])$("#"+id).addEventListener("blur",()=>leEditores());
}

/* ---------- novo projeto ---------- */
const N={plan:null,mapa:{},extras:[],textos:null,ignorados:[]};
function vistaNovo(m){
  N.plan=null;N.mapa={};N.extras=[];N.textos=null;N.ignorados=[];
  m.innerHTML=`<div class="pagina"><div class="pagina-in form-proj">
    <div class="sec-t"><div><h2>Criar projeto</h2><p class="lead">Tudo o que você carregar aqui fica neste navegador. Depois de criado, termos, códigos e campos continuam editáveis em Projeto.</p></div><a class="btn" href="#inicio">Voltar</a></div>
    <section class="form-sec"><h3>Nome do projeto</h3><input class="txt" id="n-nome" placeholder="ex.: Insignificância no furto, TJXX 2018-2024"><div class="erro" id="err-nome" role="alert"></div>
      <label class="lab-s">Descrição <span class="mini">opcional</span><textarea class="txt" id="n-desc" rows="2" placeholder="Recorte, tribunal, período, fonte da coleta"></textarea></label></section>
    <section class="form-sec"><h3>Planilha das decisões</h3>
      <p class="mini">CSV (separado por ponto e vírgula, vírgula ou tabulação) ou XLSX, com uma linha por decisão.</p>
      <label class="btn" for="n-plan">Escolher planilha</label><input type="file" id="n-plan" accept=".csv,.tsv,.txt,.xlsx,.xls,.xlsm,.ods" hidden> <span class="mini" id="n-plan-nome"></span>
      <div class="erro" id="err-plan" role="alert"></div><div id="n-mapa"></div></section>
    <section class="form-sec"><h3>Textos das decisões (TXT)</h3>
      <p class="mini">Um arquivo .txt por decisão, com o nome igual ao identificador da planilha. Selecione os arquivos, a pasta inteira ou um .zip. Decisões sem texto continuam na fila.</p>
      <div class="links"><label class="btn" for="n-tx">Escolher arquivos ou ZIP</label><input type="file" id="n-tx" accept=".txt,.zip" multiple hidden><label class="btn" for="n-txd">Escolher pasta</label><input type="file" id="n-txd" webkitdirectory multiple hidden></div>
      <div id="n-tx-rel" class="mini" role="status"></div></section>
    ${htmlEditores({comEu:true,podeGerar:true})}
    <div class="exp"><button class="btn pri" id="n-cria">Criar projeto</button><span class="erro" id="err-cria" role="alert"></span></div>
  </div></div>`;
  ligaEditores(()=>N.plan&&N.mapa.sug?[...new Set(N.plan.linhas.map(l=>String(l[N.mapa.sug]??"").trim()).filter(Boolean))]:[]);
  $("#n-plan").onchange=async e=>{const f=e.target.files[0];if(!f)return;$("#n-plan-nome").textContent="Lendo "+f.name+"…";$("#err-plan").textContent="";
    try{N.plan=await lePlanilha(f);$("#n-plan-nome").textContent=`${f.name}: ${nfmt(N.plan.linhas.length)} linhas, ${N.plan.cab.length} colunas`;
      N.mapa=adivinhaColunas(N.plan.cab,N.plan.linhas);N.extras=tiposExtras(N.plan.cab,N.plan.linhas,N.mapa);desenhaMapa();
      if(N.plan.abas.codigos&&!$("#e-livro").value.trim())$("#e-livro").value=livroParaTexto(livroDeAba(N.plan.abas.codigos));
      if(N.plan.abas.campos&&!$("#e-campos").value.trim())$("#e-campos").value=camposParaTexto(camposDeAba(N.plan.abas.campos));
      if(!$("#n-nome").value.trim())$("#n-nome").value=f.name.replace(/\.[^.]+$/,"").replace(/[_-]+/g," ");
      relTextos()}
    catch(er){N.plan=null;$("#n-plan-nome").textContent="";$("#err-plan").textContent="Não consegui ler a planilha: "+er.message;$("#n-mapa").innerHTML=""}};
  const carregaTx=async e=>{const fs=[...e.target.files];if(!fs.length)return;$("#n-tx-rel").textContent="Lendo os textos…";
    try{const r=await leTextos(fs,t=>$("#n-tx-rel").textContent=t);N.textos=N.textos||new Map();r.mapa.forEach((t,k)=>N.textos.set(k,t));N.ignorados=r.ignorados;relTextos()}
    catch(er){$("#n-tx-rel").textContent="Não consegui ler os textos: "+er.message}};
  $("#n-tx").onchange=carregaTx;$("#n-txd").onchange=carregaTx;
  $("#n-cria").onclick=criaDoFormulario;
}
function desenhaMapa(){
  const P=N.plan;const op=(k,sel)=>`<select class="txt" data-mapa="${k}"><option value="">${k==="id"?"escolha a coluna":"não tem"}</option>${P.cab.map(h=>`<option${h===sel?" selected":""}>${esc(h)}</option>`).join("")}</select>`;
  const prev=P.linhas.slice(0,4);
  $("#n-mapa").innerHTML=`<div class="quadro" style="margin:10px 0"><table class="tabela-s prev"><tr>${P.cab.map(h=>`<th>${esc(h)}</th>`).join("")}</tr>${prev.map(l=>`<tr>${P.cab.map(h=>`<td>${esc(String(l[h] instanceof Date?normData(l[h]):l[h]??"").slice(0,80))}</td>`).join("")}</tr>`).join("")}</table></div>
    <h4 class="sub-h">O que é cada coluna</h4>
    <div class="grade2">${PAPEIS_COL.map(([k,t])=>`<label>${esc(t)}${op(k,N.mapa[k])}</label>`).join("")}</div>
    <div class="erro" id="err-mapa" role="alert"></div>
    ${N.extras.length?`<h4 class="sub-h" style="margin-top:14px">Demais colunas</h4><p class="mini">Categorias viram filtros na fila e variáveis nas análises; textos livres aparecem na tabela.</p>
    <div class="grade2">${N.extras.map((e,i)=>`<label>${esc(e.col)}<select class="txt" data-extra="${i}">${Object.entries(TIPO_EXTRA).map(([k,t])=>`<option value="${k}"${e.tipo===k?" selected":""}>${t}</option>`).join("")}</select></label>`).join("")}</div>`:""}`;
  $("#n-mapa").onchange=e=>{const k=e.target.dataset.mapa;
    if(k){Object.keys(N.mapa).forEach(x=>{if(x!==k&&N.mapa[x]===e.target.value)delete N.mapa[x]});if(e.target.value)N.mapa[k]=e.target.value;else delete N.mapa[k];
      const tipos=Object.fromEntries(N.extras.map(x=>[x.col,x.tipo]));N.extras=tiposExtras(P.cab,P.linhas,N.mapa).map(x=>({...x,tipo:tipos[x.col]||x.tipo}));desenhaMapa();relTextos();return}
    const i=e.target.dataset.extra;if(i!=null)N.extras[+i].tipo=e.target.value};
  validaMapa();
}
function validaMapa(){
  const e=$("#err-mapa");if(!e||!N.plan)return true;
  if(!N.mapa.id){e.textContent="Indique a coluna do identificador: é por ela que cada TXT encontra a sua linha.";return false}
  const ids=N.plan.linhas.map(l=>String(l[N.mapa.id]??"").trim());const vazios=ids.filter(x=>!x).length;const rep=ids.length-new Set(ids.filter(Boolean)).size-vazios;
  e.textContent=vazios||rep?`Na coluna ${N.mapa.id}: ${vazios?vazios+" linhas sem identificador (ficarão de fora)":""}${vazios&&rep?"; ":""}${rep?rep+" identificadores repetidos (vale a primeira linha)":""}.`:"";
  return true;
}
function relTextos(){
  const el=$("#n-tx-rel");if(!el)return;
  if(!N.textos){el.textContent="";return}
  if(!N.plan||!N.mapa.id){el.textContent=`${nfmt(N.textos.size)} arquivos TXT lidos. Indique a planilha e a coluna do identificador para casar os arquivos.`;return}
  const casos=N.plan.linhas.map(l=>({id:String(l[N.mapa.id]??"").trim()})).filter(c=>c.id);
  const r=casaTextos(casos,N.textos);
  el.innerHTML=`<b>${nfmt(r.casados.size)}</b> de ${nfmt(casos.length)} decisões com texto.${r.semTexto.length?` ${nfmt(r.semTexto.length)} sem TXT (ex.: ${r.semTexto.slice(0,3).map(esc).join(", ")}).`:""}${r.sobrando.length?` ${nfmt(r.sobrando.length)} arquivos não casaram com nenhuma linha (ex.: ${r.sobrando.slice(0,3).map(esc).join(", ")}).`:""}${N.ignorados.length?` ${nfmt(N.ignorados.length)} arquivos que não são TXT foram ignorados.`:""}`;
}
async function criaDoFormulario(){
  const btn=$("#n-cria"),err=$("#err-cria");err.textContent="";
  const nome=$("#n-nome").value.trim();$("#err-nome").textContent=nome?"":"Dê um nome ao projeto.";
  if(!N.plan)$("#err-plan").textContent="Escolha a planilha das decisões.";
  const {v,erros}=leEditores();
  const okMapa=N.plan?validaMapa()&&!!N.mapa.id:false;
  if(!nome||!N.plan||!okMapa||Object.keys(erros).length){err.textContent="Há campos a corrigir acima.";const p=document.querySelector(".form-proj .erro:not(:empty)");p?.scrollIntoView({block:"center",behavior:"smooth"});return}
  btn.disabled=true;err.textContent="Gravando…";
  try{
    const id=await criaProjeto({nome,descricao:$("#n-desc").value.trim(),linhas:N.plan.linhas,mapa:N.mapa,extras:N.extras,textos:N.textos||new Map(),...v,eu:+$("#e-eu").value});
    await abreProjeto(id);location.hash="leitura";
  }catch(e){err.textContent="Não consegui criar o projeto: "+e.message;btn.disabled=false}
}
async function criaProjeto(o){
  const extras=o.extras.filter(e=>e.tipo!=="ign");
  const todasX=o.extras.map(e=>({col:e.col}));/* guarda todas as colunas em x, inclusive as ignoradas que servem de sugestão de campo */
  const {casos}=montaCasos(o.linhas,o.mapa,todasX);
  const r=casaTextos(casos,o.textos);casos.forEach(c=>c.tx=r.casados.has(c.id));
  const config={nome:o.nome,descricao:o.descricao||"",termos:o.termos,normas:o.normas||[],marcos:o.marcos||[],cols:{...o.mapa},extras,livro:o.livro||[],campos:o.campos||[],revisores:o.revisores||["Revisor 1","Revisor 2"],formato:1};
  const p={id:novoId(),config,casos,criado:Date.now(),rev:{1:{},2:{}},cons:{}};
  await Armazem.grava(p);if(r.casados.size)await Armazem.gravaTextos(p.id,r.casados);
  lsSet("painel-pref-"+p.id,{eu:o.eu===2?2:1,cego:true});
  return p.id;
}

/* ---------- configuração do projeto aberto ---------- */
function vistaProjeto(m){
  const c=S.cfg;
  m.innerHTML=`<div class="pagina"><div class="pagina-in form-proj">
    <div class="sec-t"><div><h2>${esc(c.nome)}</h2><p class="lead">${esc(c.descricao||"")} ${nfmt(S.casos.length)} decisões, ${nfmt(S.casos.filter(x=>x.tx).length)} com texto. Criado em ${dataBR(new Date(S.proj.criado).toISOString().slice(0,10))}.</p></div></div>
    <section class="form-sec" id="dupla"><h3>Dupla revisão</h3>
      <p class="mini">Você codifica como <b>${esc(nomeRev(S.eu))}</b> (revisor ${S.eu}) neste navegador; troque no menu do canto superior direito. Para juntar o trabalho do colega, importe o arquivo de codificação que ele baixou. A junção é por decisão e vale o registro mais recente; importar o mesmo arquivo duas vezes não duplica nada.</p>
      <div class="links"><button class="btn pri" id="p-exp-cod">Baixar meu arquivo de codificação (.json)</button><label class="btn" for="p-imp-cod">Importar codificação do colega</label><input type="file" id="p-imp-cod" accept=".json" hidden></div>
      <p class="mini" style="margin-top:10px">Para o colega começar, baixe o pacote do projeto (planilha, textos e codificações) e envie a ele. O pacote também é a cópia de segurança.</p>
      <div class="links"><button class="btn" id="p-exp-pac">Baixar pacote do projeto (.zip)</button></div>
      <p class="mini" id="p-msg" role="status"></p></section>
    <section class="form-sec"><h3>Textos</h3><p class="mini">Acrescente ou substitua TXT. Arquivos com o mesmo identificador substituem o texto anterior.</p>
      <div class="links"><label class="btn" for="p-tx">Acrescentar arquivos ou ZIP</label><input type="file" id="p-tx" accept=".txt,.zip" multiple hidden><label class="btn" for="p-txd">Acrescentar pasta</label><input type="file" id="p-txd" webkitdirectory multiple hidden></div>
      <p class="mini" id="p-tx-msg" role="status"></p></section>
    <section class="form-sec"><h3>Nome e descrição</h3><input class="txt" id="p-nome" value="${esc(c.nome)}"><textarea class="txt" id="p-desc" rows="2" style="margin-top:6px">${esc(c.descricao||"")}</textarea></section>
    <section class="form-sec"><h3>Colunas da planilha</h3><p class="mini">Tipo das colunas que não têm papel fixo.</p>
      <div class="grade2">${(c.extras||[]).map((e,i)=>`<label>${esc(e.col)}<select class="txt" data-extra="${i}">${Object.entries(TIPO_EXTRA).filter(([k])=>k!=="ign").map(([k,t])=>`<option value="${k}"${e.tipo===k?" selected":""}>${t}</option>`).join("")}</select></label>`).join("")||'<span class="mini">Nenhuma.</span>'}</div>
      <p class="mini">Papéis: ${Object.entries(c.cols).filter(([,v])=>v).map(([k,v])=>`${esc(PAPEL_ROT[k]||k)}: <b>${esc(v)}</b>`).join(" · ")}</p></section>
    ${htmlEditores({...c,podeGerar:temSug()})}
    <div class="exp"><button class="btn pri" id="p-salva">Salvar alterações</button><span class="mini" id="p-salva-msg" role="status"></span></div>
    <section class="form-sec perigo"><h3>Apagar projeto</h3><p class="mini">Apaga o projeto, os textos e as codificações deste navegador. Baixe o pacote antes se quiser guardar. Para confirmar, digite o nome do projeto.</p>
      <div class="links"><input class="txt" id="p-apaga-nome" placeholder="${esc(c.nome)}" style="max-width:320px"><button class="btn" id="p-apaga" disabled>Apagar “${esc(c.nome)}”</button></div></section>
  </div></div>`;
  ligaEditores(()=>[...new Set(S.casos.map(x=>x.sug).filter(Boolean))]);
  $("#p-exp-cod").onclick=()=>exportaCodificacao("#p-msg");
  $("#p-exp-pac").onclick=()=>{$("#p-msg").textContent="Montando o pacote…";exportaPacote("#p-msg")};
  $("#p-imp-cod").onchange=async e=>{const f=e.target.files[0];if(!f)return;
    try{const r=await importaCodificacao(f);
      const t=s=>r["r"+s].novos+r["r"+s].atual;
      $("#p-msg").textContent=`Codificação importada${r.outro?` (arquivo do projeto “${r.nome}”)`:""}: ${nomeCurto(1)} ${t(1)} registros novos ou atualizados, ${nomeCurto(2)} ${t(2)}, consenso ${r.cons.novos+r.cons.atual}.${t(1)+t(2)+r.cons.novos+r.cons.atual===0?" Nada mudou: o arquivo não trazia registros mais recentes.":""}`;
    }catch(er){$("#p-msg").textContent="Não consegui importar: "+er.message}e.target.value=""};
  const acrescenta=async e=>{const fs=[...e.target.files];if(!fs.length)return;$("#p-tx-msg").textContent="Lendo…";
    try{const r=await leTextos(fs,t=>$("#p-tx-msg").textContent=t);const k=casaTextos(S.casos,r.mapa);
      await Armazem.gravaTextos(S.proj.id,k.casados);k.casados.forEach((t,id)=>{const c=S.byId.get(id);c.tx=true;S.textos.set(id,t)});S.todos=null;
      await Armazem.gravaProjeto(S.proj);
      $("#p-tx-msg").textContent=`${nfmt(k.casados.size)} textos gravados.${k.sobrando.length?` ${nfmt(k.sobrando.length)} arquivos não casaram com nenhuma decisão (ex.: ${k.sobrando.slice(0,3).join(", ")}).`:""} Agora ${nfmt(S.casos.filter(x=>x.tx).length)} de ${nfmt(S.casos.length)} decisões têm texto.`}
    catch(er){$("#p-tx-msg").textContent="Não consegui ler os textos: "+er.message}e.target.value=""};
  $("#p-tx").onchange=acrescenta;$("#p-txd").onchange=acrescenta;
  m.querySelector(".grade2").onchange=e=>{const i=e.target.dataset.extra;if(i!=null)c.extras[+i].tipo=e.target.value};
  $("#p-salva").onclick=async()=>{const {v,erros}=leEditores();if(Object.keys(erros).length){$("#p-salva-msg").textContent="Há campos a corrigir acima.";return}
    Object.assign(c,v,{nome:$("#p-nome").value.trim()||c.nome,descricao:$("#p-desc").value.trim()});
    try{await Armazem.gravaProjeto(S.proj);aplicaTermos();S.tcols=null;barra();$("#p-salva-msg").textContent="Alterações salvas às "+horaBR(Date.now())+"."}catch(er){$("#p-salva-msg").textContent="Não consegui salvar: "+er.message}};
  $("#p-apaga-nome").oninput=e=>{$("#p-apaga").disabled=e.target.value.trim()!==c.nome};
  $("#p-apaga").onclick=async()=>{await Armazem.apaga(S.proj.id);try{localStorage.removeItem("painel-pref-"+S.proj.id)}catch(e){}fechaProjeto()};
}

/* ---------- exemplo fictício ---------- */
async function criaExemplo(){
  const E=window.EXEMPLO;if(!E)throw new Error("os dados do exemplo não carregaram");
  const {cab,linhas:L}=matrizParaLinhas(parseCSV(E.planilha));
  const mapa=adivinhaColunas(cab,L);const extras=tiposExtras(cab,L,mapa);
  return criaProjeto({nome:E.nome,descricao:E.descricao,linhas:L,mapa,extras,textos:new Map(Object.entries(E.textos)),termos:E.termos,normas:E.normas,
    livro:livroDeTexto(E.livro),campos:camposDeTexto(E.campos),marcos:marcosDeTexto(E.marcos),revisores:E.revisores,eu:1});
}
