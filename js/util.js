"use strict";
/* Utilidades gerais: escape, formatação brasileira, armazenamento leve do navegador, datas, termos de busca e downloads. */
const $=s=>document.querySelector(s);
const esc=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const dataBR=d=>d?d.slice(8,10)+"/"+d.slice(5,7)+"/"+d.slice(0,4):"";
const horaBR=t=>{const d=new Date(t);return String(d.getHours()).padStart(2,"0")+"h"+String(d.getMinutes()).padStart(2,"0")};
const pct=(a,b)=>b?Math.round(100*a/b):0;
const nfmt=n=>Number(n||0).toLocaleString("pt-BR");
const pausa=ms=>new Promise(r=>setTimeout(r,ms));
function lsGet(k,d){try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(e){return d}}
function lsSet(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
const hojeISO=()=>new Date().toISOString().slice(0,10);
const novoId=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);

/* chave para casar o nome de um arquivo TXT com o identificador da planilha */
const chaveId=s=>String(s??"").normalize("NFC").trim().toLowerCase().replace(/\.txt$/i,"").replace(/[^\p{L}\p{N}]+/gu,"");

/* sem acento e em minúsculas, preservando o comprimento (para casar posições no texto original) */
const NC=new Map();
function normTxt(t){return String(t).replace(/[^\x00-\x7f]/g,ch=>{let v=NC.get(ch);if(v===undefined){v=(ch.normalize("NFD")[0]||ch).toLowerCase();if(v.length!==1)v=ch;NC.set(ch,v)}return v}).toLowerCase()}
const semAcento=s=>String(s).normalize("NFD").replace(/\p{M}/gu,"");

/* datas: aceita AAAA-MM-DD, DD/MM/AAAA, DD-MM-AAAA, DD.MM.AAAA, número serial do Excel e objetos Date */
function normData(v){
  if(v==null||v==="")return "";
  const iso=(y,m,d)=>{y=+y;m=+m;d=+d;if(y<100)y+=y<50?2000:1900;if(!(y>1800&&y<2200&&m>=1&&m<=12&&d>=1&&d<=31))return "";
    const dt=new Date(Date.UTC(y,m-1,d));if(dt.getUTCMonth()!==m-1)return "";return dt.toISOString().slice(0,10)};
  if(v instanceof Date&&!isNaN(v))return iso(v.getFullYear(),v.getMonth()+1,v.getDate());
  if(typeof v==="number"&&v>20000&&v<80000){const d=new Date(Date.UTC(1899,11,30)+Math.round(v)*864e5);return d.toISOString().slice(0,10)}
  const s=String(v).trim();let m;
  if((m=s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)))return iso(m[1],m[2],m[3]);
  if((m=s.match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})/)))return iso(m[3],m[2],m[1]);
  if(/^\d{5}(\.\d+)?$/.test(s))return normData(+s);
  return "";
}

/* termos de busca: cada termo pode ter * (completa a palavra); a busca ignora acento e caixa e respeita limite de palavra */
const ACENTOS={a:"aáàâãä",e:"eéèêë",i:"iíìîï",o:"oóòôõö",u:"uúùûü",c:"cç",n:"nñ"};
function termoFonte(t){
  const ws=semAcento(String(t).trim().toLowerCase()).split(/\s+/).filter(Boolean);
  if(!ws.length)return null;
  const palavra=w=>w.split("*").map(p=>[...p].map(ch=>ACENTOS[ch]?`[${ACENTOS[ch]}${ACENTOS[ch].toUpperCase()}]`:ch.replace(/[.+?^${}()|[\]\\]/g,"\\$&")).join("")).join("[\\p{L}\\p{N}-]*");
  return ws.map(palavra).join("[\\s\\p{P}]+");
}
function rxTermos(lista){
  const fs=(lista||[]).map(termoFonte).filter(Boolean);
  if(!fs.length)return null;
  fs.sort((a,b)=>b.length-a.length);
  return new RegExp("(?<![\\p{L}\\p{N}])(?:"+fs.join("|")+")(?![\\p{L}\\p{N}])","giu");
}
/* versão para texto já normalizado (sem acento, minúsculo) */
function rxTermosNorm(lista){
  const fs=(lista||[]).map(t=>{const ws=normTxt(String(t).trim()).split(/\s+/).filter(Boolean);if(!ws.length)return null;
    return ws.map(w=>w.split("*").map(s=>s.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")).join("[\\p{L}\\p{N}-]*")).join("[\\s\\p{P}]+")}).filter(Boolean);
  if(!fs.length)return null;
  return new RegExp("(?<![\\p{L}\\p{N}])(?:"+fs.join("|")+")(?![\\p{L}\\p{N}])","giu");
}

/* linhas de texto do tipo "a | b | c" */
const linhas=t=>String(t||"").split(/\r?\n/).map(l=>l.trim()).filter(l=>l&&!l.startsWith("#"));
const partes=l=>l.split("|").map(s=>s.trim());

/* CSV com ; para abrir direto no Excel em português */
function csv(L){const q=v=>{v=v==null?"":String(v);return /[;"\n\r]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v};return "﻿"+L.map(l=>l.map(q).join(";")).join("\r\n")}
const nomeArq=s=>String(s).normalize("NFD").replace(/\p{M}/gu,"").replace(/[^A-Za-z0-9]+/g,"_").replace(/^_|_$/g,"").slice(0,60)||"arquivo";

/* download: Blob e link; dentro de um artefato do Claude, usa a capacidade de downloads quando existe */
let _dl;
async function salvaArq(nome,dados,msgSel="#an-msg"){
  const msg=document.querySelector(msgSel);const diz=t=>{if(msg)msg.textContent=t};
  try{
    if(dados&&dados.then)dados=await dados;
    if(_dl===undefined){try{_dl=await window.claude?.use?.("downloads")||null}catch(e){_dl=null}}
    if(_dl){await _dl.save({filename:nome,data:dados});diz(nome+" enviado para download.");return}
    const tipo=/\.csv$/.test(nome)?"text/csv;charset=utf-8":/\.json$/.test(nome)?"application/json":/\.svg$/.test(nome)?"image/svg+xml":/\.md$/.test(nome)?"text/markdown;charset=utf-8":/\.zip$/.test(nome)?"application/zip":"application/octet-stream";
    const blob=dados instanceof Blob?dados:new Blob([dados],{type:tipo});
    const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=nome;document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),4000);diz(nome+" baixado.");
  }catch(e){diz(e&&e.code==="declined"?"Download cancelado.":"O download não saiu ("+(e&&(e.code||e.message))+").")}
}
function leArquivo(f,como="texto"){return new Promise((ok,er)=>{const r=new FileReader();r.onload=()=>ok(r.result);r.onerror=()=>er(r.error||new Error("leitura"));como==="bin"?r.readAsArrayBuffer(f):r.readAsText(f)})}
/* texto de TXT: UTF-8; se aparecerem caracteres inválidos, tenta Windows-1252 */
function decodifica(buf){
  const u=new Uint8Array(buf);
  try{return new TextDecoder("utf-8",{fatal:true}).decode(u).replace(/^﻿/,"")}
  catch(e){try{return new TextDecoder("windows-1252").decode(u)}catch(e2){return new TextDecoder("utf-8").decode(u)}}
}
