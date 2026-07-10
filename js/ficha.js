/* Ficha de personagem simplificada — D&D 2024.
   Depende de data/classes.js (window.CLASSES_DATA) e da API exposta por js/app.js (window.GRIMORIO_API). */
(function(){
"use strict";
const DATA = window.CLASSES_DATA;
const ATRS = ["FOR","DES","CON","INT","SAB","CAR"];
const ATR_NOMES = {FOR:"Força",DES:"Destreza",CON:"Constituição",INT:"Inteligência",SAB:"Sabedoria",CAR:"Carisma"};

let ficha = null;      // dados da ficha da classe atual
let fichaClasse = null;// classe à qual `ficha` pertence
let aberta = false;

// ---- persistência (chave própria; não toca nas chaves do grimório) ----
function defaultFicha(cls){
  // salvaguardas da classe já vêm marcadas (o jogador pode alterar)
  const sv = {};
  ((DATA.classes[cls]||{}).salvaguardas||[]).forEach(a=>{ sv[a]=1; });
  return { nome:"", nivel:1, atr:{FOR:10,DES:10,CON:10,INT:10,SAB:10,CAR:10},
    usos:{}, talentos:{}, pericias:{}, salvaguardas:sv };
}
function loadFicha(cls){
  try{
    const d = JSON.parse(localStorage.getItem("grim_ficha_"+cls) || "null");
    if(d && d.atr) return Object.assign(defaultFicha(cls), d, {atr:Object.assign(defaultFicha(cls).atr, d.atr)});
  }catch(e){}
  return defaultFicha(cls);
}
function saveFicha(){ if(fichaClasse) localStorage.setItem("grim_ficha_"+fichaClasse, JSON.stringify(ficha)); }

// ---- regras ----
function mod(v){ return Math.floor((v-10)/2); }
function fmtMod(m){ return (m>=0?"+":"")+m; }
function profBonus(n){ return 2+Math.floor((n-1)/4); }
function slotsInfo(cls,nivel){
  const c = DATA.classes[cls];
  if(!c) return [];
  if(c.conjurador==="pacto"){
    const p = DATA.slots.pacto[nivel-1];
    return [{circulo:p.c, qtd:p.n, pacto:true}];
  }
  return DATA.slots[c.conjurador][nivel-1].map((q,i)=>({circulo:i+1, qtd:q}));
}
function talentosBonus(nivel){
  let truques=0, preparadas=0;
  (window.TALENTOS_DATA||[]).forEach(f=>{
    const q = ficha.talentos[f.id]||0;
    if(!q) return;
    if(f.efeito.truques) truques += f.efeito.truques*q;
    if(f.efeito.preparadas) preparadas += f.efeito.preparadas*q;
    if(f.efeito.preparadasProf) preparadas += profBonus(nivel)*q;
  });
  return { truques, preparadas };
}
function calc(cls){
  const c = DATA.classes[cls];
  const n = ficha.nivel;
  const m = mod(ficha.atr[c.chave]);
  const p = profBonus(n);
  const slots = slotsInfo(cls,n);
  const tb = talentosBonus(n);
  const truquesClasse = c.truques ? c.truques[n-1] : 0;
  return { c, n, m, p, cd:8+p+m, atk:p+m,
    truquesClasse, preparadasClasse: c.preparadas[n-1], talentos: tb,
    truques: truquesClasse + tb.truques,
    preparadas: c.preparadas[n-1] + tb.preparadas,
    slots, maxCirculo: slots.length ? slots[slots.length-1].circulo : 0 };
}

// ---- helpers de DOM ----
function el(tag,cls,html){ const e=document.createElement(tag); if(cls)e.className=cls; if(html!=null)e.innerHTML=html; return e; }
function esc(s){ return (s||"").replace(/[&<>]/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[ch])); }

// ---- painel ----
function abrir(){
  const cls = window.GRIMORIO_API.classe();
  if(!DATA.classes[cls]){ alert("Classe sem tabela de conjuração."); return; }
  fichaClasse = cls;
  ficha = loadFicha(cls);
  aberta = true;
  document.getElementById("fichaOverlay").hidden = false;
  document.body.classList.add("ficha-open");
  renderPanel();
}
function fechar(){
  aberta = false;
  document.getElementById("fichaOverlay").hidden = true;
  document.body.classList.remove("ficha-open");
}
function renderPanel(){
  const ov = document.getElementById("fichaOverlay");
  ov.innerHTML = "";
  const panel = el("div","ficha-panel");

  const head = el("div","ficha-head",
    '<h2>🧙 Ficha — '+esc(fichaClasse)+'</h2>'+
    '<button id="fichaClose" title="Fechar a ficha">✕</button>');
  panel.appendChild(head);

  const body = el("div","ficha-body");

  // identificação
  const ident = el("div","ficha-ident");
  const lblNome = el("label",null,"Nome do personagem");
  const inNome = document.createElement("input");
  inNome.type="text"; inNome.id="fichaNome"; inNome.maxLength=60; inNome.placeholder="Ex.: Elminster";
  inNome.value = ficha.nome;
  inNome.oninput = ()=>{ ficha.nome = inNome.value; saveFicha(); };
  lblNome.appendChild(inNome);
  const lblNivel = el("label",null,"Nível");
  const selNivel = document.createElement("select"); selNivel.id="fichaNivel";
  for(let i=1;i<=20;i++){ const o=el("option",null,String(i)); o.value=i; if(i===ficha.nivel)o.selected=true; selNivel.appendChild(o); }
  selNivel.onchange = ()=>{ ficha.nivel = +selNivel.value; saveFicha(); updateComputed(); };
  lblNivel.appendChild(selNivel);
  ident.append(lblNome, lblNivel);
  body.appendChild(ident);

  // atributos
  const atrs = el("div","ficha-atrs");
  ATRS.forEach(a=>{
    const box = el("div","atr"+(DATA.classes[fichaClasse].chave===a?" key":""));
    box.appendChild(el("span","atr-nm",a));
    const inp = document.createElement("input");
    inp.type="number"; inp.min=1; inp.max=30; inp.value=ficha.atr[a];
    inp.title = ATR_NOMES[a];
    inp.onchange = ()=>{
      let v = Math.max(1, Math.min(30, +inp.value||10));
      inp.value = v; ficha.atr[a]=v; saveFicha(); updateComputed();
    };
    box.appendChild(inp);
    const md = el("span","atr-mod",fmtMod(mod(ficha.atr[a])));
    md.dataset.atr = a;
    box.appendChild(md);
    atrs.appendChild(box);
  });
  body.appendChild(atrs);

  // seções calculadas (preenchidas por updateComputed)
  body.appendChild(el("div","ficha-saves"));
  body.appendChild(el("div","ficha-skills"));
  body.appendChild(el("div","ficha-stats"));
  body.appendChild(el("div","ficha-limits"));
  body.appendChild(buildTalentos());
  body.appendChild(el("div","ficha-slots"));
  body.appendChild(el("div","ficha-spells"));
  panel.appendChild(body);

  const actions = el("div","ficha-actions",
    '<button id="fichaExport" title="Gerar folha imprimível da ficha (escolha \'Salvar como PDF\' no diálogo)">🖨 Exportar Ficha</button>');
  panel.appendChild(actions);

  ov.appendChild(panel);
  document.getElementById("fichaClose").onclick = fechar;
  document.getElementById("fichaExport").onclick = exportFicha;
  ov.onclick = e=>{ if(e.target===ov) fechar(); };
  updateComputed();
}

// seção de talentos que alteram truques/magias preparadas (data/talentos.js)
function buildTalentos(){
  const box = el("div","ficha-talentos");
  box.appendChild(el("div","slots-title","Talentos de Conjuração"));
  (window.TALENTOS_DATA||[]).forEach(f=>{
    const q = ficha.talentos[f.id]||0;
    const row = el("div","tal-row"+(q?" on":""));
    const info = el("div","tal-info");
    info.appendChild(el("span","tal-nm",esc(f.nome)+(f.prereq?' <span class="tal-pre">('+esc(f.prereq)+')</span>':"")));
    info.appendChild(el("span","tal-desc",esc(f.resumo)));
    row.appendChild(info);
    const ctrl = el("div","tal-ctrl");
    if(f.repetivel){
      const menos=el("button",null,"−"), qt=el("span","tal-q",String(q)), mais=el("button",null,"+");
      menos.title="Remover uma aquisição"; mais.title="Adquirir (repetível até "+f.repetivel+"×, uma lista diferente a cada vez)";
      const set=(v)=>{ v=Math.max(0,Math.min(f.repetivel,v));
        if(v) ficha.talentos[f.id]=v; else delete ficha.talentos[f.id];
        qt.textContent=v; row.classList.toggle("on",v>0); saveFicha(); updateComputed(); };
      menos.onclick=()=>set((ficha.talentos[f.id]||0)-1);
      mais.onclick=()=>set((ficha.talentos[f.id]||0)+1);
      ctrl.append(menos,qt,mais);
    }else{
      const cb=document.createElement("input"); cb.type="checkbox"; cb.checked=q>0;
      cb.onchange=()=>{ if(cb.checked) ficha.talentos[f.id]=1; else delete ficha.talentos[f.id];
        row.classList.toggle("on",cb.checked); saveFicha(); updateComputed(); };
      ctrl.appendChild(cb);
    }
    row.appendChild(ctrl);
    box.appendChild(row);
  });
  return box;
}

function updateComputed(){
  if(!aberta) return;
  const r = calc(fichaClasse);
  const panel = document.querySelector("#fichaOverlay .ficha-panel");
  if(!panel) return;

  // modificadores ao lado dos atributos
  panel.querySelectorAll(".atr-mod").forEach(s=>{ s.textContent = fmtMod(mod(ficha.atr[s.dataset.atr])); });

  // salvaguardas (clique alterna proficiência)
  const svBox = panel.querySelector(".ficha-saves");
  svBox.innerHTML = "";
  svBox.appendChild(el("div","slots-title","Salvaguardas"));
  const svWrap = el("div","saves-wrap");
  ATRS.forEach(a=>{
    const on = !!ficha.salvaguardas[a];
    const bonus = mod(ficha.atr[a]) + (on?r.p:0);
    const chip = el("button","save-chip"+(on?" on":""),(on?"● ":"○ ")+a+" <b>"+fmtMod(bonus)+"</b>");
    chip.title = ATR_NOMES[a]+" — clique para "+(on?"remover":"marcar")+" a proficiência";
    chip.onclick = ()=>{ if(on) delete ficha.salvaguardas[a]; else ficha.salvaguardas[a]=1;
      saveFicha(); updateComputed(); };
    svWrap.appendChild(chip);
  });
  svBox.appendChild(svWrap);

  // perícias (clique cicla: sem proficiência → proficiente → especialização)
  const skBox = panel.querySelector(".ficha-skills");
  skBox.innerHTML = "";
  const pp = 10 + mod(ficha.atr.SAB) + (ficha.pericias["Percepção"]||0)*r.p;
  skBox.appendChild(el("div","slots-title",'<span>Perícias</span><span class="pp">Percepção Passiva '+pp+'</span>'));
  const grid = el("div","skills-grid");
  (DATA.pericias||[]).forEach(([nm,atr])=>{
    const st = ficha.pericias[nm]||0;
    const bonus = mod(ficha.atr[atr]) + st*r.p;
    const row = el("button","skill-row"+(st===1?" prof":st===2?" exp":""),
      '<span class="sk-ic">'+(st===2?"★":st===1?"●":"○")+'</span>'+
      '<span class="sk-bn">'+fmtMod(bonus)+'</span>'+
      '<span class="sk-nm">'+esc(nm)+'</span><span class="sk-atr">'+atr+'</span>');
    row.title = st===0?"Sem proficiência — clique para marcar proficiência"
      : st===1?"Proficiente — clique para marcar especialização (dobro da proficiência)"
      : "Especialização — clique para limpar";
    row.onclick = ()=>{ const nx=(st+1)%3;
      if(nx) ficha.pericias[nm]=nx; else delete ficha.pericias[nm];
      saveFicha(); updateComputed(); };
    grid.appendChild(row);
  });
  skBox.appendChild(grid);
  skBox.appendChild(el("div","sk-legend","○ sem proficiência · ● proficiente · ★ especialização"));

  // stats de conjuração
  panel.querySelector(".ficha-stats").innerHTML =
    '<span class="chip">Proficiência <b>'+fmtMod(r.p)+'</b></span>'+
    '<span class="chip">Conjuração: <b>'+esc(r.c.atributo)+'</b></span>'+
    '<span class="chip">CD de Magia <b>'+r.cd+'</b></span>'+
    '<span class="chip">Ataque Mágico <b>'+fmtMod(r.atk)+'</b></span>';

  // contadores grimório × limites da classe/nível
  const spells = window.GRIMORIO_API.magiasDoGrimorio(fichaClasse)
    .sort((a,b)=> a.nivel-b.nivel || a.nome.localeCompare(b.nome,"pt"));
  const nTruques = spells.filter(m=>m.nivel===0).length;
  const nMagias  = spells.filter(m=>m.nivel>0).length;
  const brk = (base,bonus)=> bonus?' title="'+base+' da classe + '+bonus+' de talentos"':"";
  let lim = "";
  if(r.truques>0){
    lim += '<span class="lim'+(nTruques>r.truques?" over":nTruques===r.truques?" full":"")+'"'+brk(r.truquesClasse,r.talentos.truques)+'>Truques <b>'+nTruques+'/'+r.truques+'</b>'+(r.talentos.truques?" ✦":"")+'</span>';
  }else{
    lim += '<span class="lim muted">Sem truques de classe</span>';
  }
  lim += '<span class="lim'+(nMagias>r.preparadas?" over":nMagias===r.preparadas?" full":"")+'"'+brk(r.preparadasClasse,r.talentos.preparadas)+'>Magias preparadas <b>'+nMagias+'/'+r.preparadas+'</b>'+(r.talentos.preparadas?" ✦":"")+'</span>';
  lim += '<span class="lim muted">Círculo máximo: <b>'+r.maxCirculo+'º</b></span>';
  panel.querySelector(".ficha-limits").innerHTML = lim;

  // espaços de magia com caixinhas de uso
  const slotsBox = panel.querySelector(".ficha-slots");
  slotsBox.innerHTML = "";
  slotsBox.appendChild(el("div","slots-title",r.c.conjurador==="pacto"?"Espaços de Pacto":"Espaços de Magia"));
  const wrap = el("div","slots-wrap");
  r.slots.forEach(s=>{
    const key = String(s.circulo);
    let usados = Math.min(ficha.usos[key]||0, s.qtd);
    if((ficha.usos[key]||0)!==usados){ ficha.usos[key]=usados; saveFicha(); }
    const g = el("div","slot-group");
    g.appendChild(el("span","slot-lb",(s.pacto?s.qtd+" × ":"")+s.circulo+"º"));
    for(let i=0;i<s.qtd;i++){
      const cb = document.createElement("input");
      cb.type="checkbox"; cb.checked = i<usados; cb.title="Espaço de "+s.circulo+"º círculo (marque ao gastar)";
      cb.onchange = ()=>{
        const boxes=[...g.querySelectorAll("input")];
        ficha.usos[key] = boxes.filter(b=>b.checked).length;
        saveFicha();
      };
      g.appendChild(cb);
    }
    wrap.appendChild(g);
  });
  const rest = el("button","slots-rest","🌙 Descanso longo");
  rest.title = "Recupera todos os espaços de magia";
  rest.onclick = ()=>{ ficha.usos={}; saveFicha(); updateComputed(); };
  wrap.appendChild(rest);
  slotsBox.appendChild(wrap);

  // lista simplificada das magias do grimório
  const spBox = panel.querySelector(".ficha-spells");
  spBox.innerHTML = "";
  spBox.appendChild(el("div","slots-title","Magias do Grimório"));
  if(!spells.length){
    spBox.appendChild(el("div","ficha-empty","Nenhuma magia marcada (★) no grimório de "+esc(fichaClasse)+". Feche a ficha e marque as magias na lista."));
  }else{
    const byLv={}; spells.forEach(m=>{ (byLv[m.nivel]=byLv[m.nivel]||[]).push(m); });
    Object.keys(byLv).map(Number).sort((a,b)=>a-b).forEach(lv=>{
      const grp = el("div","fs-group");
      grp.appendChild(el("div","fs-head",lv===0?"Truques":lv+"º Círculo"));
      byLv[lv].forEach(m=>{
        const over = m.nivel>0 && m.nivel>r.maxCirculo;
        const row = el("div","fs-row"+(over?" over":""),
          '<span class="fs-nm">'+esc(m.nome)+'</span>'+
          '<span class="fs-meta">'+esc(m.tempo+" · "+m.alcance)+
            (m.concentracao?' · <b title="Concentração">C</b>':"")+(m.ritual?' · <b title="Ritual">R</b>':"")+'</span>'+
          (over?'<span class="fs-warn" title="Este círculo é maior que o alcançável no nível '+r.n+'">⚠ acima do '+r.maxCirculo+'º</span>':""));
        grp.appendChild(row);
      });
      spBox.appendChild(grp);
    });
  }
}

// ---- exportação da ficha (folha A4 imprimível; não altera a exportação existente) ----
const FICHA_PRINT_CSS = `
*{box-sizing:border-box}
html,body{margin:0;padding:0;background:#fff}
body{font-family:"Georgia","Times New Roman",serif;color:#241c10;
  -webkit-print-color-adjust:exact;print-color-adjust:exact}
.sheet{width:210mm;min-height:297mm;padding:14mm 15mm;background:#fff}
.hd{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:2.5px solid #7a1f2b;padding-bottom:6px;margin-bottom:10px}
.hd h1{margin:0;font-size:26px;letter-spacing:.4px}
.hd .cl{font-size:14px;font-style:italic;color:#5a4a30;text-align:right}
.atrs{display:grid;grid-template-columns:repeat(6,1fr);gap:6px;margin-bottom:10px}
.atrs .a{border:1.2px solid #b09a6a;border-radius:6px;text-align:center;padding:5px 2px;background:#f7f1e1}
.atrs .a.key{border-color:#7a1f2b;border-width:2px}
.atrs .a .n{display:block;font-size:9px;letter-spacing:1px;font-weight:bold;color:#7a1f2b;text-transform:uppercase}
.atrs .a .v{display:block;font-size:17px;font-weight:bold}
.atrs .a .m{display:block;font-size:11px;color:#5a4a30}
.stats{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px}
.stats .s{flex:1;border:1.2px solid #b09a6a;border-radius:6px;text-align:center;padding:5px;background:#f7f1e1}
.stats .s .n{display:block;font-size:8.5px;letter-spacing:.8px;font-weight:bold;color:#7a1f2b;text-transform:uppercase}
.stats .s .v{display:block;font-size:15px;font-weight:bold}
.slots{border:1.2px solid #b09a6a;border-radius:6px;padding:7px 10px;background:#f7f1e1;margin-bottom:12px}
.slots .t{font-size:9px;letter-spacing:1px;font-weight:bold;color:#7a1f2b;text-transform:uppercase;margin-bottom:4px}
.slots .row{display:flex;gap:16px;flex-wrap:wrap}
.slots .g{font-size:12px;white-space:nowrap}
.slots .g b{margin-right:4px}
.slots .o{font-size:13px;letter-spacing:2px}
.svrow{display:flex;gap:8px;flex-wrap:wrap;font-size:11px;margin-bottom:4px}
.sv{border:1px solid #b09a6a;border-radius:5px;padding:2px 8px;color:#5a4a30}
.sv.on{background:#f7f1e1;color:#241c10;font-weight:bold}
.skcols{columns:2;column-gap:26px;font-size:10.5px}
.ski{break-inside:avoid;padding:1.5px 0;color:#5a4a30;border-bottom:1px dotted #e2d5b3}
.ski.on{color:#241c10;font-weight:bold}
.ski i{font-style:italic;color:#7a6a45;font-weight:normal;font-size:9px}
h3 .ppx{float:right;font-size:9px;color:#5a4a30;text-transform:none;letter-spacing:0}
h3{font-size:12px;letter-spacing:1.2px;text-transform:uppercase;color:#7a1f2b;
  border-bottom:1px solid #b09a6a;margin:12px 0 4px;padding-bottom:2px}
table{width:100%;border-collapse:collapse;font-size:11px}
td{padding:2.5px 6px;border-bottom:1px solid #e2d5b3;vertical-align:top}
td.nm{font-weight:bold;width:38%}
td.tag{width:12%;text-align:right;color:#5a4a30;font-style:italic}
.notes{margin-top:14px;border-top:1px solid #b09a6a;padding-top:6px}
.notes .l{border-bottom:1px solid #d9cba5;height:18px}
.ft{margin-top:10px;font-size:9px;color:#7a6a45;font-style:italic;text-align:center}
@page{size:A4;margin:0}
`;
function buildFichaDoc(){
  const r = calc(fichaClasse);
  const spells = window.GRIMORIO_API.magiasDoGrimorio(fichaClasse)
    .sort((a,b)=> a.nivel-b.nivel || a.nome.localeCompare(b.nome,"pt"));
  const nome = ficha.nome.trim() || "________________________";

  let atrs = "";
  ATRS.forEach(a=>{
    atrs += '<div class="a'+(r.c.chave===a?" key":"")+'"><span class="n">'+ATR_NOMES[a]+'</span>'+
      '<span class="v">'+ficha.atr[a]+'</span><span class="m">'+fmtMod(mod(ficha.atr[a]))+'</span></div>';
  });
  let stats =
    '<div class="s"><span class="n">Nível</span><span class="v">'+r.n+'</span></div>'+
    '<div class="s"><span class="n">Proficiência</span><span class="v">'+fmtMod(r.p)+'</span></div>'+
    '<div class="s"><span class="n">Conjuração</span><span class="v">'+esc(r.c.atributo)+'</span></div>'+
    '<div class="s"><span class="n">CD de Magia</span><span class="v">'+r.cd+'</span></div>'+
    '<div class="s"><span class="n">Ataque Mágico</span><span class="v">'+fmtMod(r.atk)+'</span></div>'+
    (r.truques>0?'<div class="s"><span class="n">Truques</span><span class="v">'+r.truques+'</span></div>':"")+
    '<div class="s"><span class="n">Preparadas</span><span class="v">'+r.preparadas+'</span></div>';
  let saves = '<h3>Salvaguardas</h3><div class="svrow">';
  ATRS.forEach(a=>{
    const on = !!ficha.salvaguardas[a];
    const b = mod(ficha.atr[a]) + (on?r.p:0);
    saves += '<span class="sv'+(on?" on":"")+'">'+(on?"●":"○")+" "+a+" "+fmtMod(b)+'</span>';
  });
  saves += '</div>';
  const pp = 10 + mod(ficha.atr.SAB) + (ficha.pericias["Percepção"]||0)*r.p;
  let skills = '<h3>Perícias <span class="ppx">Percepção Passiva '+pp+'</span></h3><div class="skcols">';
  (DATA.pericias||[]).forEach(([nm,atr])=>{
    const st = ficha.pericias[nm]||0;
    const b = mod(ficha.atr[atr]) + st*r.p;
    skills += '<div class="ski'+(st?" on":"")+'">'+(st===2?"★":st===1?"●":"○")+' <b>'+fmtMod(b)+'</b> '+esc(nm)+' <i>('+atr+')</i></div>';
  });
  skills += '</div>';

  let slotRow = "";
  r.slots.forEach(s=>{ slotRow += '<span class="g"><b>'+s.circulo+'º</b><span class="o">'+"○".repeat(s.qtd)+'</span></span>'; });
  const slots = '<div class="slots"><div class="t">'+(r.c.conjurador==="pacto"?"Espaços de Pacto (mesmo círculo)":"Espaços de Magia")+
    '</div><div class="row">'+slotRow+'</div></div>';

  let lists = "";
  const byLv={}; spells.forEach(m=>{ (byLv[m.nivel]=byLv[m.nivel]||[]).push(m); });
  Object.keys(byLv).map(Number).sort((a,b)=>a-b).forEach(lv=>{
    lists += '<h3>'+(lv===0?"Truques":lv+"º Círculo")+'</h3><table>';
    byLv[lv].forEach(m=>{
      lists += '<tr><td class="nm">'+esc(m.nome)+'</td><td>'+esc(m.tempo+" · "+m.alcance)+'</td>'+
        '<td class="tag">'+[(m.concentracao?"Conc.":""),(m.ritual?"Ritual":"")].filter(Boolean).join(" · ")+'</td></tr>';
    });
    lists += '</table>';
  });
  if(!spells.length) lists = '<h3>Magias</h3><p style="font-size:11px;font-style:italic">Nenhuma magia marcada no grimório.</p>';

  let talentos = "";
  const escolhidos = (window.TALENTOS_DATA||[]).filter(f=>ficha.talentos[f.id]);
  if(escolhidos.length){
    talentos = '<h3>Talentos</h3><table>';
    escolhidos.forEach(f=>{
      const q = ficha.talentos[f.id];
      talentos += '<tr><td class="nm">'+esc(f.nome)+(q>1?" ×"+q:"")+'</td><td colspan="2">'+esc(f.resumo)+'</td></tr>';
    });
    talentos += '</table>';
  }

  let notes = '<div class="notes"><h3 style="border:none;margin:0 0 4px">Anotações</h3>';
  for(let i=0;i<4;i++) notes += '<div class="l"></div>';
  notes += '</div>';

  return '<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8">'+
    '<title>Ficha — '+esc(ficha.nome||fichaClasse)+' — D&D 2024</title><style>'+FICHA_PRINT_CSS+'</style></head><body>'+
    '<div class="sheet">'+
      '<div class="hd"><h1>'+esc(nome)+'</h1><div class="cl">'+esc(fichaClasse)+' · Nível '+r.n+'<br>D&amp;D 2024</div></div>'+
      '<div class="atrs">'+atrs+'</div>'+
      '<div class="stats">'+stats+'</div>'+
      saves+skills+slots+talentos+lists+notes+
      '<div class="ft">Grimório D&D 2024 — ficha simplificada de conjurador</div>'+
    '</div>'+
    '<scr'+'ipt>window.onload=function(){setTimeout(function(){window.focus();window.print();},300);};</scr'+'ipt>'+
    '</body></html>';
}
function exportFicha(){
  const doc = buildFichaDoc();
  const w = window.open("","_blank");
  if(!w){ alert("Não foi possível abrir a janela de exportação.\nPermita pop-ups para este site e tente de novo."); return; }
  w.document.open(); w.document.write(doc); w.document.close();
}

// ---- init ----
document.addEventListener("DOMContentLoaded",()=>{
  document.getElementById("btnFicha").onclick = abrir;
  document.addEventListener("keydown",e=>{ if(e.key==="Escape"&&aberta) fechar(); });
  // grimório mudou (estrela, troca de classe, importação, limpar) → ressincroniza
  document.addEventListener("grim:change",()=>{
    if(!aberta) return;
    const cls = window.GRIMORIO_API.classe();
    if(cls!==fichaClasse){ fichaClasse=cls; ficha=loadFicha(cls); renderPanel(); }
    else updateComputed();
  });
});
})();
