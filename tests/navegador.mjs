// Testes de navegador do painel. Uso: node tests/navegador.mjs
// Abre index.html por file://, roda verificações das funções puras e o fluxo com o exemplo e com dados enviados pela interface.
import {createRequire} from "node:module";
const {chromium}=createRequire(import.meta.url)("playwright");
import {fileURLToPath,pathToFileURL} from "node:url";
import {dirname,join} from "node:path";
import {readdirSync,mkdirSync} from "node:fs";
const raiz=join(dirname(fileURLToPath(import.meta.url)),"..");
const url=pathToFileURL(join(raiz,"index.html")).href;
const saida=process.env.SAIDA||join(raiz,"tests","saida");mkdirSync(saida,{recursive:true});
let falhas=0,ok=0;
const t=async(nome,fn)=>{try{await fn();ok++;console.log("  ok  "+nome)}catch(e){falhas++;console.log("FALHA "+nome+"\n      "+(e.stack||e).split("\n").slice(0,3).join("\n      "))}};
const ord=o=>o&&typeof o==="object"&&!Array.isArray(o)?Object.fromEntries(Object.keys(o).sort().map(k=>[k,ord(o[k])])):Array.isArray(o)?o.map(ord):o;
const igual=(a,b,m="")=>{if(JSON.stringify(ord(a))!==JSON.stringify(ord(b)))throw new Error(`${m} esperado ${JSON.stringify(b)}, veio ${JSON.stringify(a)}`)};
const verd=(v,m)=>{if(!v)throw new Error(m||"esperado verdadeiro")};

const browser=await chromium.launch();
const ctx=await browser.newContext({viewport:{width:1440,height:900},acceptDownloads:true});
const page=await ctx.newPage();
const erros=[];page.on("pageerror",e=>erros.push(e.message));page.on("console",m=>{if(m.type()==="error")erros.push(m.text())});
await page.goto(url);await page.waitForSelector(".inicio");

console.log("funções puras");
await t("normaliza datas",async()=>igual(await page.evaluate(()=>[normData("10/11/2026"),normData("2026-11-10"),normData(46336),normData("31/02/2026"),normData("x"),normData("1/2/21")]),["2026-11-10","2026-11-10","2026-11-10","","","2021-02-01"]));
await t("realça termos sem acento",async()=>igual(await page.evaluate(()=>{const r=rxTermos(["insignific*","valor ínfimo"]);return ["Insignificância","INSIGNIFICANCIA","valor infimo","valor   ínfimo","insignificante"].map(s=>{r.lastIndex=0;return r.test(s)})}),[true,true,true,true,true]));
await t("termo não casa dentro de outra palavra",async()=>igual(await page.evaluate(()=>{const r=rxTermos(["bagatela"]);return ["bagatelas","abagatela","bagatela."].map(s=>{r.lastIndex=0;return r.test(s)})}),[false,false,true]));
await t("importa CSV com ponto e vírgula e BOM",async()=>igual(await page.evaluate(()=>{const M=parseCSV('﻿Id;Órgão Julgador;Texto\n1;"1ª Turma; Cível";"linha ""a""\nb"\n\n2;2ª;x');const r=matrizParaLinhas(M);return [r.cab,r.linhas.length,r.linhas[0]["Órgão Julgador"],r.linhas[0].Texto]}),[["Id","Órgão Julgador","Texto"],2,"1ª Turma; Cível",'linha "a"\nb']));
await t("CSV com vírgula",async()=>igual(await page.evaluate(()=>parseCSV("a,b\n1,2").length),2));
await t("adivinha colunas",async()=>igual(await page.evaluate(()=>{const cab=["Nº do acórdão","Processo","Data de julgamento","Órgão julgador","Classe","Código prévio","Obs"];const L=[{"Nº do acórdão":"1","Data de julgamento":"01/02/2020"},{"Nº do acórdão":"2","Data de julgamento":"03/02/2020"}];return adivinhaColunas(cab,L)}),{id:"Nº do acórdão",proc:"Processo",data:"Data de julgamento",orgao:"Órgão julgador",classe:"Classe",sug:"Código prévio"}));
await t("livro e campos de texto",async()=>igual(await page.evaluate(()=>{const L=livroDeTexto("A | Aplica | desc\n# comentário\nB");const C=camposDeTexto("Resultado | única | fav; desf\nTem | sim/não\nFund | múltipla | x; y | col");return [L,C.map(c=>[c.tipo,c.opcoes,c.sug])]}),[[{cod:"A",rot:"Aplica",desc:"desc"},{cod:"B",rot:"B",desc:""}],[["unica",["fav","desf"],""],["simnao",[],""],["multipla",["x","y"],"col"]]]));
await t("casa TXT pelo identificador",async()=>igual(await page.evaluate(()=>{const r=casaTextos([{id:"0701/2020"},{id:"A-1"},{id:"9"}],new Map([["07012020","t1"],["a-1","t2"],["zzz","t3"]]));return [[...r.casados.keys()],r.semTexto,r.sobrando]}),[["0701/2020","A-1"],["9"],["zzz"]]));
await t("junta codificações por carimbo",async()=>igual(await page.evaluate(()=>{
  const p={rev:{1:{a:{c:"X",t:5},b:{c:"Y",t:9}},2:{}},cons:{}};
  const arq={formato:"painel-decisoes-codificacao",rev:{1:{a:{c:"Z",t:7},b:{c:"W",t:3},c:{c:"Q",t:1}},2:{a:{c:"K",t:2}}},cons:{a:{c:"X",t:4}}};
  const r1=juntaCodificacoes(p,arq);const r2=juntaCodificacoes(p,arq);
  return [p.rev[1].a.c,p.rev[1].b.c,p.rev[1].c.c,p.rev[2].a.c,p.cons.a.c,r1.r1,r2.r1,r2.r2,r2.cons]}),["Z","Y","Q","K","X",{novos:1,atual:1},{novos:0,atual:0},{novos:0,atual:0},{novos:0,atual:0}]));
await t("kappa e qui-quadrado",async()=>{const r=await page.evaluate(()=>{const k=kappaFull([["a","a"],["a","b"],["b","b"],["b","b"]]);const i=indep([[10,20],[30,5]]);return [k.k,i.chi,i.fisher]});verd(Math.abs(r[0]-0.5)<1e-9,"kappa "+r[0]);verd(r[1]>15&&r[2]<0.001,"chi "+r[1])});

console.log("exemplo");
await page.click("#abre-exemplo");await page.waitForSelector(".leitura .item");
await t("fila com 18 decisões",async()=>verd((await page.textContent("#contagem")).startsWith("18 decisões")));
await page.waitForSelector("#folha mark.m");
await t("marca-texto nos termos",async()=>verd(await page.locator("#folha mark.m").count()>=2));
await t("destaque das normas",async()=>verd(await page.locator("#folha mark.n").count()>=1));
await t("ficha com livro e campos",async()=>{verd(await page.locator("#ficha-col .chip.c.lin").count()===4,"4 códigos");verd((await page.textContent("#ficha-col")).includes("Resultado para o réu"))});
await page.screenshot({path:join(saida,"leitura.png")});
await page.keyboard.press("1");
await t("atalho 1 grava o primeiro código",async()=>{await page.waitForFunction(()=>meu(S.sel)?.c==="APL");});
await page.keyboard.press("j");await page.waitForTimeout(150);
await t("J vai à próxima",async()=>igual(await page.evaluate(()=>S.sel),"1002"));
await page.keyboard.press("Shift+A");await page.waitForTimeout(150);
await t("Shift+A adota sugestão e avança",async()=>igual(await page.evaluate(()=>[S.rev[1]["1002"].c,S.rev[1]["1002"][CAMPOS()[0].id],S.sel]),["AFA",["reincidência"],"1003"]));
await t("decisão sem texto aparece na fila",async()=>{await page.evaluate(()=>{location.hash="a-1014"});await page.waitForTimeout(200);verd((await page.textContent("#folha-col")).includes("Sem texto importado"))});
await t("gravação persiste após recarregar",async()=>{await page.evaluate(()=>gravaAgora());await page.reload();await page.waitForSelector(".leitura .item");igual(await page.evaluate(()=>[S.rev[1]["1001"]?.c,S.cfg.nome.startsWith("Exemplo")]),["APL",true])});

console.log("vistas");
for(const v of ["tabela","progresso","projeto"]){await t("abre "+v,async()=>{await page.evaluate(v=>location.hash=v,v);await page.waitForTimeout(250);verd((await page.textContent("#main")).length>100);await page.screenshot({path:join(saida,v+".png"),fullPage:false})})}
console.log("análises");
await page.evaluate(()=>location.hash="analises");await page.waitForSelector("#an-nav button");
const subs=await page.evaluate(()=>AN_SUBS.map(x=>x[0]));
for(const s of subs){await t("análise "+s,async()=>{
  await page.click(`#an-nav [data-s="${s}"]`);await page.waitForTimeout(200);
  const f=await page.$("#an-corpo form button[type=submit]");if(f){await f.click()}
  await page.waitForFunction(()=>!document.querySelector("#an-out .carregando"),null,{timeout:15000});
  const tx=await page.textContent("#an-corpo");verd(tx.length>80,"vazio");verd(!/undefined|NaN%|\[object/.test(tx),"lixo no texto: "+tx.match(/.{40}(undefined|NaN%|\[object).{20}/)?.[0]);
  await page.screenshot({path:join(saida,"an-"+s+".png")})})}
await t("associação devolve qui-quadrado",async()=>{await page.click('#an-nav [data-s="assoc"]');await page.selectOption("#a-l","cod");await page.selectOption("#a-c","x:reincidente");await page.waitForTimeout(200);verd(await page.evaluate(()=>Number.isFinite(AR.assoc?.chi)))});
await t("KWIC encontra bagatela",async()=>{await page.click('#an-nav [data-s="kwic"]');await page.fill("#k-q","bagatela");await page.click("#k-f button[type=submit]");await page.waitForTimeout(400);verd(await page.evaluate(()=>AR.kwic.total)>=3)});

console.log("dupla revisão");
let pacote,cod;
await t("baixa arquivo de codificação e pacote",async()=>{await page.evaluate(()=>location.hash="projeto");await page.waitForSelector("#p-exp-cod");
  const d1=page.waitForEvent("download");await page.click("#p-exp-cod");const a=await d1;cod=join(saida,a.suggestedFilename());await a.saveAs(cod);
  const d2=page.waitForEvent("download");await page.click("#p-exp-pac");const b=await d2;pacote=join(saida,b.suggestedFilename());await b.saveAs(pacote);verd(/\.zip$/.test(pacote))});
/* segundo revisor: outro navegador, abre o pacote, vira revisor 2, codifica e devolve o arquivo */
const ctx2=await browser.newContext({acceptDownloads:true});const p2=await ctx2.newPage();p2.on("pageerror",e=>erros.push("[rev2] "+e.message));
await p2.goto(url);await p2.waitForSelector(".inicio");
let cod2;
await t("revisor 2 abre o pacote",async()=>{await p2.setInputFiles("#abre-pacote",pacote);await p2.waitForSelector(".leitura .item");igual(await p2.evaluate(()=>[S.casos.length,S.casos.filter(c=>c.tx).length,S.rev[1]["1001"]?.c]),[18,17,"APL"])});
await t("revisor 2 codifica e exporta",async()=>{await p2.evaluate(()=>{S.eu=2;guardaPref();S.sel="1001";grava("1001",{c:"NAO"});grava("1002",{c:"AFA"});return gravaAgora()});
  await p2.evaluate(()=>location.hash="projeto");await p2.waitForSelector("#p-exp-cod");const d=p2.waitForEvent("download");await p2.click("#p-exp-cod");const a=await d;cod2=join(saida,"rev2_"+a.suggestedFilename());await a.saveAs(cod2)});
await t("revisor 1 importa e vê divergência e kappa",async()=>{await page.setInputFiles("#p-imp-cod",cod2);await page.waitForFunction(()=>/importada/.test(document.querySelector("#p-msg").textContent));
  igual(await page.evaluate(()=>[S.rev[2]["1001"]?.c,situacao("1001").dif]),["NAO",true]);
  await page.evaluate(()=>location.hash="progresso");await page.waitForTimeout(250);verd((await page.textContent("#main")).includes("1 divergências")||(await page.textContent("#main")).includes("divergências ainda sem consenso"))});
await t("reimportar não muda nada",async()=>{await page.evaluate(()=>location.hash="projeto");await page.waitForSelector("#p-imp-cod",{state:"attached"});await page.setInputFiles("#p-imp-cod",cod2);await page.waitForFunction(()=>/Nada mudou/.test(document.querySelector("#p-msg").textContent))});

console.log("projeto novo pela interface");
await t("cria projeto com CSV, TXT e editores",async()=>{
  await page.evaluate(()=>location.hash="novo");await page.waitForSelector("#n-plan",{state:"attached"});
  await page.click("#n-cria");verd((await page.textContent("#err-cria")).includes("corrigir"),"validação");
  await page.setInputFiles("#n-plan",join(raiz,"exemplo","decisoes.csv"));await page.waitForSelector("#n-mapa select",{state:"attached"});
  const txts=readdirSync(join(raiz,"exemplo","textos")).map(f=>join(raiz,"exemplo","textos",f));
  await page.setInputFiles("#n-tx",txts);await page.waitForFunction(()=>/17<\/b> de 18/.test(document.querySelector("#n-tx-rel").innerHTML));
  await page.fill("#n-nome","Teste pela interface");await page.fill("#e-termos","insignific*\nbagatela");
  await page.click("#e-livro-sug");verd((await page.inputValue("#e-livro")).includes("APL"),"livro gerado");
  await page.fill("#e-campos","Resultado | única | favorável; desfavorável");
  await page.screenshot({path:join(saida,"novo.png"),fullPage:true});
  await page.click("#n-cria");await page.waitForSelector(".leitura .item");
  igual(await page.evaluate(()=>[S.cfg.nome,S.casos.length,S.casos.filter(c=>c.tx).length,S.cfg.cols.id,S.cfg.cols.sug,LIVRO().length]),["Teste pela interface",18,17,"id","codigo_previo",4])});
await t("lista de projetos no início",async()=>{await page.evaluate(()=>location.hash="inicio");await page.waitForSelector("[data-abre]");verd(await page.locator("[data-abre]").count()===2)});

console.log("celular");
await t("leitura em 375 px sem rolagem horizontal",async()=>{const m=await browser.newContext({viewport:{width:375,height:740},deviceScaleFactor:1});const pm=await m.newPage();pm.on("pageerror",e=>erros.push("[cel] "+e.message));
  await pm.goto(url);await pm.waitForSelector(".inicio");await pm.click("#abre-exemplo");await pm.waitForSelector(".leitura .item");
  const w=await pm.evaluate(()=>document.documentElement.scrollWidth);await pm.screenshot({path:join(saida,"celular.png")});verd(w<=376,"largura "+w);await m.close()});

await t("nenhum erro no console",async()=>igual(erros,[]));
await browser.close();
console.log(`\n${ok} ok, ${falhas} falhas`);process.exit(falhas?1:0);
