"use strict";
/* Armazenamento local em IndexedDB. Três repositórios:
   projetos  { id, config, casos, criado, atualizado }
   codif     { id, rev:{1:{},2:{}}, cons:{}, atualizado }
   textos    { k: projetoId + "|" + idDecisao, p: projetoId, t: texto }
   Fica isolado aqui para que outra forma de guardar (base em nuvem, base do Claude) entre depois sem mexer no resto. */
const Armazem=(()=>{
  let dbp=null;
  function abreDB(){
    if(dbp)return dbp;
    dbp=new Promise((ok,er)=>{
      if(!window.indexedDB){er(new Error("Este navegador não oferece armazenamento local (IndexedDB)."));return}
      const r=indexedDB.open("painel-decisoes",1);
      r.onupgradeneeded=()=>{const db=r.result;
        if(!db.objectStoreNames.contains("projetos"))db.createObjectStore("projetos",{keyPath:"id"});
        if(!db.objectStoreNames.contains("codif"))db.createObjectStore("codif",{keyPath:"id"});
        if(!db.objectStoreNames.contains("textos")){const s=db.createObjectStore("textos",{keyPath:"k"});s.createIndex("p","p")}};
      r.onsuccess=()=>ok(r.result);
      r.onerror=()=>er(r.error||new Error("Não consegui abrir o armazenamento local."));
    });
    return dbp;
  }
  const req=r=>new Promise((ok,er)=>{r.onsuccess=()=>ok(r.result);r.onerror=()=>er(r.error)});
  const fim=tx=>new Promise((ok,er)=>{tx.oncomplete=()=>ok();tx.onerror=()=>er(tx.error);tx.onabort=()=>er(tx.error||new Error("transação abortada"))});
  async function loja(nome,modo="readonly"){const db=await abreDB();const tx=db.transaction(nome,modo);return {s:tx.objectStore(nome),tx}}

  async function lista(){
    const {s}=await loja("projetos");const L=await req(s.getAll());
    return L.map(p=>({id:p.id,nome:p.config.nome,n:p.casos.length,atualizado:p.atualizado||p.criado})).sort((a,b)=>(b.atualizado||0)-(a.atualizado||0));
  }
  async function abre(id){
    const {s}=await loja("projetos");const p=await req(s.get(id));if(!p)return null;
    const c=await loja("codif");const k=await req(c.s.get(id));
    p.rev=k?.rev||{1:{},2:{}};p.cons=k?.cons||{};
    return p;
  }
  async function gravaProjeto(p){
    const {s,tx}=await loja("projetos","readwrite");
    s.put({id:p.id,config:p.config,casos:p.casos,criado:p.criado,atualizado:Date.now()});await fim(tx);
  }
  async function gravaCodif(p){
    const {s,tx}=await loja("codif","readwrite");
    s.put({id:p.id,rev:p.rev,cons:p.cons,atualizado:Date.now()});await fim(tx);
  }
  async function grava(p){await gravaProjeto(p);await gravaCodif(p)}
  async function gravaTextos(pid,mapa){
    const db=await abreDB();const ents=[...mapa];
    for(let i=0;i<ents.length;i+=400){
      const tx=db.transaction("textos","readwrite"),s=tx.objectStore("textos");
      for(const [id,t] of ents.slice(i,i+400))s.put({k:pid+"|"+id,p:pid,t});
      await fim(tx);
    }
  }
  async function texto(pid,id){const {s}=await loja("textos");const r=await req(s.get(pid+"|"+id));return r?r.t:null}
  async function textos(pid){
    const {s}=await loja("textos");const L=await req(s.index("p").getAll(pid));
    const m=new Map();const n=pid.length+1;L.forEach(r=>m.set(r.k.slice(n),r.t));return m;
  }
  async function apaga(pid){
    const db=await abreDB();
    const tx=db.transaction(["projetos","codif","textos"],"readwrite");
    tx.objectStore("projetos").delete(pid);tx.objectStore("codif").delete(pid);
    const idx=tx.objectStore("textos").index("p");
    const cur=idx.openKeyCursor(IDBKeyRange.only(pid));
    cur.onsuccess=()=>{const c=cur.result;if(c){tx.objectStore("textos").delete(c.primaryKey);c.continue()}};
    await fim(tx);
  }
  return {abreDB,lista,abre,grava,gravaProjeto,gravaCodif,gravaTextos,texto,textos,apaga};
})();
