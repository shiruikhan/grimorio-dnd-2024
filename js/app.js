(function(){
"use strict";
const MAGIAS = window.MAGIAS || [];
const CLASSES = ["Bardo","Bruxo","Clérigo","Druida","Feiticeiro","Guardião","Mago","Paladino"];
const SCHOOL_VAR = {"Abjuração":"--abj","Adivinhação":"--adv","Encantamento":"--enc","Evocação":"--evo","Ilusão":"--ilu","Invocação":"--inv","Necromancia":"--nec","Transmutação":"--tra"};
const SCHOOL_HEX = {"Abjuração":"#2f5d8a","Adivinhação":"#6b4e9e","Encantamento":"#a83b7a","Evocação":"#9e2b25","Ilusão":"#5b3f93","Invocação":"#b5651d","Necromancia":"#3f6b3a","Transmutação":"#1f7a7a"};
function schoolHex(s){ return SCHOOL_HEX[s]||"#7a1f2b"; }

const state = {
  classe: localStorage.getItem("grim_classe") || "Mago",
  levels: new Set(), school:"", ritual:false, conc:false, known:false,
  search:"", selected:null, grimorio:{}
};

// ---- persistence ----
function loadGrim(){
  CLASSES.forEach(c=>{ try{ state.grimorio[c]=new Set(JSON.parse(localStorage.getItem("grim_"+c)||"[]")); }
    catch(e){ state.grimorio[c]=new Set(); } });
}
function saveGrim(c){ localStorage.setItem("grim_"+c, JSON.stringify([...state.grimorio[c]])); }
function known(c){ return state.grimorio[c] || (state.grimorio[c]=new Set()); }

// ---- helpers ----
function schoolColor(s){ return "var("+(SCHOOL_VAR[s]||"--muted")+")"; }
function circleName(n){ return n===0?"Truques":n+"º Círculo"; }
function el(tag,cls,html){ const e=document.createElement(tag); if(cls)e.className=cls; if(html!=null)e.innerHTML=html; return e; }
function esc(s){ return (s||"").replace(/[&<>]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[m])); }
function fmtDesc(t){ return esc(t).replace(/(Usando um Espaço de Magia de Círculo Superior\.|Aprimoramento de Truque\.)/g,"<strong>$1</strong>"); }

// ---- top UI ----
function buildClasses(){
  const nav=document.getElementById("classes"); nav.innerHTML="";
  CLASSES.forEach(c=>{
    const b=el("button",c===state.classe?"active":"",c);
    b.onclick=()=>{ state.classe=c; state.selected=null; localStorage.setItem("grim_classe",c);
      closeDetail(); buildClasses(); render(); document.getElementById("detailPane").innerHTML=emptyHTML(); };
    nav.appendChild(b);
  });
}
function buildLevelFilter(){
  const box=document.getElementById("levelFilter"); box.innerHTML="";
  const tk=el("button","tk","Truques"); tk.dataset.lv="0"; box.appendChild(tk);
  for(let i=1;i<=9;i++){ const b=el("button",null,i+"º"); b.dataset.lv=i; box.appendChild(b); }
  box.querySelectorAll("button").forEach(b=>{ b.onclick=()=>{ const lv=+b.dataset.lv;
    if(state.levels.has(lv)) state.levels.delete(lv); else state.levels.add(lv);
    b.classList.toggle("active"); render(); }; });
}
function buildSchoolFilter(){
  const sel=document.getElementById("schoolFilter");
  Object.keys(SCHOOL_VAR).forEach(s=>{ const o=el("option",null,s); o.value=s; sel.appendChild(o); });
  sel.onchange=()=>{ state.school=sel.value; render(); };
}

// ---- filtering ----
function classSpells(){ return MAGIAS.filter(m=>m.classes.includes(state.classe)); }
function filtered(){
  const q=state.search.trim().toLowerCase();
  return classSpells().filter(m=>{
    if(state.levels.size && !state.levels.has(m.nivel)) return false;
    if(state.school && m.escola!==state.school) return false;
    if(state.ritual && !m.ritual) return false;
    if(state.conc && !m.concentracao) return false;
    if(state.known && !known(state.classe).has(m.nome)) return false;
    if(q && !m.nome.toLowerCase().includes(q)) return false;
    return true;
  });
}

// ---- render list ----
function render(){
  updateCount();
  const pane=document.getElementById("listPane"); pane.innerHTML="";
  const list=filtered();
  if(!list.length){ pane.appendChild(el("div","empty-list","Nenhuma magia encontrada com esses filtros.")); return; }
  const byLv={}; list.forEach(m=>{ (byLv[m.nivel]=byLv[m.nivel]||[]).push(m); });
  Object.keys(byLv).map(Number).sort((a,b)=>a-b).forEach(lv=>{
    const arr=byLv[lv].sort((a,b)=>a.nome.localeCompare(b.nome,"pt"));
    const g=el("div","circle-group");
    const kc=arr.filter(m=>known(state.classe).has(m.nome)).length;
    g.appendChild(el("div","circle-head","<span>"+circleName(lv)+"</span><span class='n'>"+kc+"/"+arr.length+"</span>"));
    arr.forEach(m=>{
      const row=el("div","spell-row"+(state.selected===m.nome?" sel":""));
      const on=known(state.classe).has(m.nome);
      const star=el("span","star"+(on?" on":""),on?"★":"☆"); star.title="Adicionar/remover do grimório";
      star.onclick=(e)=>{ e.stopPropagation(); toggleKnown(m.nome); };
      const main=el("div","row-main");
      main.appendChild(el("span","nm",esc(m.nome)));
      main.appendChild(el("span","row-meta",esc(m.tempo+" · "+m.alcance+(m.concentracao?" · Concentração":""))));
      const tags=el("span","tags");
      const dot=el("span","sch-dot"); dot.style.background=schoolColor(m.escola); dot.title=m.escola; tags.appendChild(dot);
      if(m.ritual) tags.appendChild(el("span","mini","R"));
      if(m.concentracao) tags.appendChild(el("span","mini","C"));
      row.append(star,main,tags);
      row.onclick=()=>{ state.selected=m.nome; showDetail(m);
        document.querySelectorAll(".spell-row").forEach(r=>r.classList.remove("sel")); row.classList.add("sel"); };
      g.appendChild(row);
    });
    pane.appendChild(g);
  });
}
function toggleKnown(nome){
  const k=known(state.classe);
  if(k.has(nome)) k.delete(nome); else k.add(nome);
  saveGrim(state.classe); render();
  if(state.selected){ const m=MAGIAS.find(x=>x.nome===state.selected); if(m)showDetail(m); }
}
function updateCount(){ document.getElementById("knownCount").textContent = known(state.classe).size+" no grimório"; }

// ---- detail ----
function emptyHTML(){ return '<div class="empty"><span class="logo big">✶</span><p>Selecione uma magia para ver os detalhes.</p></div>'; }
function closeDetail(){ document.body.classList.remove("detail-open"); }
function showDetail(m){
  const pane=document.getElementById("detailPane");
  document.body.classList.add("detail-open");
  const on=known(state.classe).has(m.nome);
  const lvlTxt = m.nivel===0 ? "Truque de "+m.escola : m.nivel+"º Círculo · "+m.escola;
  let badges="";
  if(m.ritual) badges+='<span class="badge rit">Ritual</span>';
  if(m.concentracao) badges+='<span class="badge con">Concentração</span>';
  badges+='<span class="badge" style="border-color:'+schoolColor(m.escola)+'">'+esc(m.escola)+'</span>';
  pane.innerHTML =
    '<button class="detail-back" id="dback">‹ Voltar à lista</button>'+
    '<div class="detail"><h2>'+esc(m.nome)+'</h2>'+
    '<div class="lvl-school">'+esc(lvlTxt)+'</div>'+
    '<div class="badges">'+badges+'</div>'+
    '<dl class="props">'+
      '<dt>Conjuração</dt><dd>'+esc(m.tempo)+'</dd>'+
      '<dt>Alcance</dt><dd>'+esc(m.alcance)+'</dd>'+
      '<dt>Componentes</dt><dd>'+esc(m.componentes)+'</dd>'+
      '<dt>Duração</dt><dd>'+esc(m.duracao)+'</dd>'+
    '</dl>'+
    '<div class="desc">'+fmtDesc(m.descricao)+'</div>'+
    '<div class="classlist">Classes: '+esc(m.classes.join(", "))+'</div>'+
    '<button class="detailbtn'+(on?" on":"")+'" id="dbtn">'+(on?"★ No grimório — remover":"☆ Adicionar ao grimório")+'</button></div>';
  document.getElementById("dbtn").onclick=()=>toggleKnown(m.nome);
  const bk=document.getElementById("dback"); if(bk) bk.onclick=closeDetail;
}

// ---- EXPORTAR PDF (somente magias selecionadas da classe atual) ----
const PRINT_CSS = `
*{box-sizing:border-box}
html,body{margin:0;padding:0;background:#fff}
body{font-family:"Georgia","Times New Roman",serif;color:#241c10;
  -webkit-print-color-adjust:exact;print-color-adjust:exact}
.page{position:relative;width:210mm;height:297mm;overflow:hidden;break-after:page;page-break-after:always}
.page:last-child{break-after:auto;page-break-after:auto}
.grid{position:absolute;left:8mm;top:8mm;width:194mm;height:281mm;
  display:grid;grid-template-columns:repeat(2,1fr);grid-template-rows:repeat(2,1fr)}
.slot{position:relative;padding:0}
.cmark{position:absolute;background:#000}
.card{display:flex;flex-direction:column;width:100%;height:100%;overflow:hidden;
  border:1.1px solid var(--c);border-radius:5px;background:#f7f1e1}
.card .ttl{flex:0 0 auto;background:var(--c);color:#f6eed8;display:flex;justify-content:space-between;
  align-items:center;padding:3px 9px}
.card .ttl .nm{font-weight:bold;font-size:12px;text-transform:uppercase;letter-spacing:.3px;line-height:1.15}
.card .ttl .lv{flex:0 0 auto;margin-left:6px;width:17px;height:17px;border-radius:50%;background:#f6eed8;
  color:var(--c);font-size:10px;font-weight:bold;text-align:center;line-height:17px}
.card .grid2{flex:0 0 auto;display:grid;grid-template-columns:1fr 1fr}
.card .cell{padding:2px 9px;border-top:1px solid #d9cba5;border-right:1px solid #d9cba5}
.card .cell:nth-child(2n){border-right:none}
.card .cell .lbl{display:block;font-size:7.5px;text-transform:uppercase;letter-spacing:.4px;color:var(--c);font-weight:bold}
.card .cell .val{display:block;font-size:9.5px;color:#241c10;line-height:1.2}
.card .d{flex:1 1 auto;overflow:hidden;font-size:10.5px;line-height:1.4;white-space:pre-wrap;
  text-align:justify;padding:5px 9px;border-top:1px solid #d9cba5;margin:0}
.card .d strong{color:#6b4f1d}
.card .foot{flex:0 0 auto;display:flex;justify-content:space-between;font-size:8px;color:#7a6a45;
  padding:2px 9px 3px;border-top:1px solid #d9cba5;font-style:italic}
@page{size:A4;margin:0}
`;
function cropMarks(){
  const L=4, t=0.25, M=8, W=210, H=297, CX=105, CY=148.5;
  const xs=[M,CX,W-M], ys=[M,CY,H-M];
  let h="";
  xs.forEach(x=>{
    h+='<div class="cmark" style="left:'+(x-t/2)+'mm;top:'+(M-L)+'mm;width:'+t+'mm;height:'+L+'mm"></div>';
    h+='<div class="cmark" style="left:'+(x-t/2)+'mm;top:'+(H-M)+'mm;width:'+t+'mm;height:'+L+'mm"></div>';
  });
  ys.forEach(y=>{
    h+='<div class="cmark" style="top:'+(y-t/2)+'mm;left:'+(M-L)+'mm;height:'+t+'mm;width:'+L+'mm"></div>';
    h+='<div class="cmark" style="top:'+(y-t/2)+'mm;left:'+(W-M)+'mm;height:'+t+'mm;width:'+L+'mm"></div>';
  });
  return h;
}
function cardHTML(m,cls){
  const c=schoolHex(m.escola);
  const lvBadge=m.nivel===0?"T":m.nivel;
  const foot=(m.nivel===0?"Truque":m.nivel+"º Círculo")+" · "+m.escola+
    (m.ritual?" · Ritual":"")+(m.concentracao?" · Concentração":"");
  return '<div class="card" style="--c:'+c+'">'+
    '<div class="ttl"><span class="nm">'+esc(m.nome)+'</span><span class="lv">'+lvBadge+'</span></div>'+
    '<div class="grid2">'+
      '<div class="cell"><span class="lbl">Tempo de Conjuração</span><span class="val">'+esc(m.tempo)+'</span></div>'+
      '<div class="cell"><span class="lbl">Alcance</span><span class="val">'+esc(m.alcance)+'</span></div>'+
      '<div class="cell"><span class="lbl">Componentes</span><span class="val">'+esc(m.componentes)+'</span></div>'+
      '<div class="cell"><span class="lbl">Duração</span><span class="val">'+esc(m.duracao)+'</span></div>'+
    '</div>'+
    '<div class="d">'+fmtDesc(m.descricao)+'</div>'+
    '<div class="foot"><span>'+esc(cls)+'</span><span>'+esc(foot)+'</span></div>'+
  '</div>';
}
function buildExportDoc(cls){
  const k=known(cls);
  const spells=MAGIAS.filter(m=>m.classes.includes(cls)&&k.has(m.nome))
    .sort((a,b)=> a.nivel-b.nivel || a.nome.localeCompare(b.nome,"pt"));
  if(!spells.length) return null;
  const PER=4; let pages="";
  for(let i=0;i<spells.length;i+=PER){
    const chunk=spells.slice(i,i+PER);
    let slots="";
    for(let j=0;j<PER;j++){
      slots+='<div class="slot">'+(chunk[j]?cardHTML(chunk[j],cls):"")+'</div>';
    }
    pages+='<div class="page">'+cropMarks()+'<div class="grid">'+slots+'</div></div>';
  }
  const fit='document.querySelectorAll(".card .d").forEach(function(d){var fs=parseFloat(getComputedStyle(d).fontSize);var g=0;while(d.scrollHeight>d.clientHeight+0.5&&fs>6&&g<80){fs-=0.4;d.style.fontSize=fs+"px";d.style.lineHeight="1.3";g++;}});';
  return '<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8">'+
    '<title>Cartas de '+esc(cls)+' — D&D 2024</title><style>'+PRINT_CSS+'</style></head><body>'+
    pages+
    '<scr'+'ipt>window.onload=function(){'+fit+'setTimeout(function(){window.focus();window.print();},400);};</scr'+'ipt>'+
    '</body></html>';
}
function exportPDF(){
  const cls=state.classe;
  const doc=buildExportDoc(cls);
  if(!doc){ alert("O grimório de "+cls+" está vazio.\nMarque magias com a estrela (★) antes de exportar."); return; }
  const w=window.open("","_blank");
  if(!w){ alert("Não foi possível abrir a janela de exportação.\nPermita pop-ups para este arquivo e tente de novo."); return; }
  w.document.open(); w.document.write(doc); w.document.close();
  // Na janela que abrir, escolha a impressora \"Salvar como PDF\".
}

// ---- export / import grimório (.json) ----
function exportGrim(){
  const data={versao:1,classe:state.classe,gerado:new Date().toISOString(),
    grimorio:Object.fromEntries(CLASSES.map(c=>[c,[...known(c)]]))};
  const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
  const a=document.createElement("a"); a.href=URL.createObjectURL(blob);
  a.download="grimorio-dnd-backup.json"; a.click(); URL.revokeObjectURL(a.href);
}
function importGrim(file){
  const r=new FileReader();
  r.onload=()=>{ try{ const d=JSON.parse(r.result);
      if(d.grimorio){ CLASSES.forEach(c=>{ if(d.grimorio[c]){ state.grimorio[c]=new Set(d.grimorio[c]); saveGrim(c);} }); }
      render(); alert("Grimório restaurado com sucesso.");
    }catch(e){ alert("Arquivo inválido."); } };
  r.readAsText(file);
}

// ---- init ----
function init(){
  loadGrim();
  buildClasses(); buildLevelFilter(); buildSchoolFilter();
  document.getElementById("search").oninput=e=>{ state.search=e.target.value; render(); };
  document.getElementById("fRitual").onchange=e=>{ state.ritual=e.target.checked; render(); };
  document.getElementById("fConc").onchange=e=>{ state.conc=e.target.checked; render(); };
  document.getElementById("fKnown").onchange=e=>{ state.known=e.target.checked;
    document.body.classList.toggle("grim-mode",e.target.checked); render(); };
  document.getElementById("btnPrint").onclick=exportPDF;
  document.getElementById("btnExport").onclick=exportGrim;
  document.getElementById("btnImport").onclick=()=>document.getElementById("importFile").click();
  document.getElementById("importFile").onchange=e=>{ if(e.target.files[0]) importGrim(e.target.files[0]); e.target.value=""; };
  document.getElementById("btnClear").onclick=()=>{
    if(confirm("Limpar todas as magias do grimório de "+state.classe+"?")){
      state.grimorio[state.classe]=new Set(); saveGrim(state.classe); closeDetail(); render();
      document.getElementById("detailPane").innerHTML=emptyHTML(); } };
  document.getElementById("detailPane").innerHTML=emptyHTML();
  render();
}
document.addEventListener("DOMContentLoaded",init);
})();
