/* Dano das magias — lido do próprio texto da descrição, sem campo extra nos dados.
   Usado por js/app.js para:
     · rubricar (destacar) cada trecho de dano dentro da descrição e das cartas impressas;
     · montar o bloco "Dano" da página da magia: dados, tipo, teste e escala.
   A redação do livro varia; o que não segue um padrão reconhecido fica fora do bloco
   (a rubrica no texto continua valendo). Depois de editar data/magias.json, confira o que
   foi extraído com: node tools/conferir-dano.js */
(function(root){
"use strict";

const TIPOS = ["Ácido","Contundente","Cortante","Elétrico","Energético","Gélido","Ígneo",
  "Necrótico","Perfurante","Psíquico","Radiante","Trovejante","Venenoso"];
const TIPO = "(?:" + TIPOS.join("|") + ")";
// "Ácido", "Ácido, Gélido, Ígneo, Elétrico ou Trovejante"
const LISTA = "(" + TIPO + "(?:(?:,\\s*|\\s+ou\\s+)" + TIPO + ")*)";
// 8d6 · 1d4 + 1 · 10d6 + 40 · 2d8 + 1d6
const DADOS = "\\d+d\\d+(?:\\s?\\+\\s?\\d+d\\d+)?(?:\\s?\\+\\s?\\d+(?![\\dd]))?";
const MOD = "(\\s+mais\\s+(?:o\\s+)?seu\\s+modificador\\s+de\\s+atributo\\s+de\\s+conjuração)?";
const ESCOLHA = "(\\s+(?:do\\s+tipo\\s+(?:escolhido|do\\s+espírito|rolado|desencadeado)|de\\s+um\\s+tipo\\s+à\\s+sua\\s+escolha))?";

const FRASE = new RegExp([
  // 1–6  "8d6 pontos de dano Ígneo", "2d8 pontos de dano Radiante adicionais", "1d8 pontos de dano de um tipo à sua escolha"
  "(" + DADOS + ")\\s+pontos?\\s+de\\s+dano(?:\\s+" + LISTA + ")?(\\s+adiciona(?:l|is))?(?:\\s+" + LISTA + ")?" + ESCOLHA + MOD,
  // 7–9  "14d6 de dano Necrótico"
  "(" + DADOS + ")\\s+de\\s+dano\\s+" + LISTA + MOD,
  // 10–11 "5 pontos de dano Gélido"
  "(\\d+)\\s+pontos\\s+de\\s+dano\\s+" + LISTA,
  // 12–14 "dano Psíquico igual a 3d12 mais o seu modificador de atributo de conjuração"
  "dano\\s+" + LISTA + "\\s+igual\\s+a\\s+(" + DADOS + ")" + MOD
].join("|"), "gi");

const UPCAST = "Usando um Espaço de Magia de Círculo Superior.";
const TRUQUE = "Aprimoramento de Truque.";

// dano que é efeito colateral, não o propósito da magia: rubricado no texto, mas sem bloco
const INCIDENTAL = new Set(["Alterar-se","Aumentar/Reduzir","Contato Extraplanar","Desejo",
  "Mesclar-se às Rochas","Porta Dimensional","Teleporte"]);
// magias cujo dano não aparece como "XdY pontos de dano" no texto
// (truques que usam a arma; o dano acumulado da Bola de Fogo Adiável)
const AJUSTES = {
  "Bola de Fogo Adiável": { partes:[{ dados:"12d6", tipo:"Ígneo" }], teste:"Salvaguarda de Destreza" },
  "Bordão Místico": { partes:[{ dados:"1d8", tipo:"Energético ou o da arma" }],
    teste:"Ataque corpo a corpo com a arma", legenda:"Dado de dano por nível de personagem" },
  "Golpe Certeiro": { partes:[{ dados:"", nota:"Dano da arma", tipo:"Radiante ou o da arma" }],
    teste:"Ataque com a arma", legenda:"Dano Radiante adicional por nível de personagem" }
};

function lista(t){
  if(!t) return "";
  return t.split(/(,\s*|\s+ou\s+)/).map(x=>{
    const k = x.toLowerCase();
    return TIPOS.find(y=>y.toLowerCase()===k) || x;
  }).join("");
}
function limpaDados(d){ return d.replace(/\s?\+\s?/g," + "); }

function partesDoTexto(desc){
  let corpo = desc || "", upcast = "", truque = "";
  const iu = corpo.indexOf(UPCAST);
  if(iu >= 0){ upcast = corpo.slice(iu + UPCAST.length).trim(); corpo = corpo.slice(0, iu); }
  const it = corpo.indexOf(TRUQUE);
  if(it >= 0){ truque = corpo.slice(it + TRUQUE.length).trim(); corpo = corpo.slice(0, it); }
  return { corpo, upcast, truque };
}

function ocorrencias(texto){
  const out = [];
  FRASE.lastIndex = 0;
  let g;
  while((g = FRASE.exec(texto))){
    let dados, tipo = "", extra = false, mod = false, escolha = "";
    if(g[1]){ dados = g[1]; tipo = g[2] || g[4] || ""; extra = !!g[3]; escolha = g[5] || ""; mod = !!g[6]; }
    else if(g[7]){ dados = g[7]; tipo = g[8]; mod = !!g[9]; }
    else if(g[10]){ dados = g[10]; tipo = g[11]; }
    else { tipo = g[12]; dados = g[13]; mod = !!g[14]; }
    const fim = g.index + g[0].length, depois = texto.slice(fim, fim + 120);
    if(!tipo && !escolha){
      // o tipo às vezes vem na frase seguinte: "…1d8 pontos de dano adicional… Esse dano é Radiante, Necrótico ou Gélido"
      const prox = new RegExp("^[^.]*\\.\\s+Esse dano é " + LISTA, "i").exec(depois);
      if(prox) tipo = prox[1];
      else if(/determina o tipo/.test(depois)) escolha = "rolado";
    }
    out.push({
      ini: g.index, fim,
      dados: limpaDados(dados), tipo: lista(tipo), extra, mod,
      escolha: /escolh/i.test(escolha) ? "à escolha" : /espírito/i.test(escolha) ? "do espírito" :
               /rolado/i.test(escolha) ? "rolado" : /desencadeado/i.test(escolha) ? "desencadeado" : "",
      menos: /^\s+a menos/.test(depois)
    });
  }
  return out;
}

// como o dano chega: a salvaguarda ou a jogada de ataque *sua* mais próxima antes do primeiro
// dano, no mesmo parágrafo (ou logo depois, na mesma frase). "Realize…" separa o seu ataque
// do ataque de um inimigo ("se uma criatura acertar você com um ataque…").
const SALVA = /salvaguarda de (Força|Destreza|Constituição|Inteligência|Sabedoria|Carisma)/gi;
const ATAQUE = /reali[zs]\w*\s+(?:\S+\s+){0,3}?(?:jogada\s+de\s+)?ataque\s+(mágico\s+)?(corpo a corpo|à distância)(\s+com\s+(?:a|uma|essa)\s+arma)?/gi;
function testeDe(corpo, primeira){
  const iniPar = corpo.lastIndexOf("\n", primeira.ini) + 1;
  const r = /[.:](?:\s|$)/g; r.lastIndex = primeira.fim;
  const x = r.exec(corpo), fimFrase = x ? x.index : corpo.length;
  const trecho = corpo.slice(iniPar, fimFrase);
  let melhor = null;
  [[SALVA,"salva"],[ATAQUE,"ataque"]].forEach(([re,k])=>{
    re.lastIndex = 0; let y;
    while((y = re.exec(trecho))){ if(!melhor || y.index > melhor.i) melhor = { i:y.index, k, y }; }
  });
  if(!melhor) return "";
  const y = melhor.y;
  if(melhor.k === "salva") return "Salvaguarda de " + y[1].charAt(0).toUpperCase() + y[1].slice(1).toLowerCase();
  return (y[1] ? "Ataque mágico " : "Ataque ") + y[2] + (y[3] ? " com arma" : "");
}

function somaDados(base, inc, n){
  const b = /^(\d+)d(\d+)$/.exec(base), i = /^(\d+)d(\d+)$/.exec(inc);
  return b && i && b[2] === i[2] ? (+b[1] + +i[1] * n) + "d" + b[2] : null;
}

// frases do parágrafo de escala que falam de dano (ou de mais dardos, raios, feixes…)
const FALA_DE_DANO = /dano|dardo|raio|feixe|meteoro/i;
function literal(par){
  const frases = par.split(/(?<=\.)\s+/);
  const out = frases.filter((f,i)=> i === 0 ? FALA_DE_DANO.test(f) : /dano/i.test(f));
  return out.join(" ");
}

function escalaCirculo(upcast, nivel, partes){
  const m = /^([^.]*?)\s(?:aumenta(?:m)?|é aumentado)\s+em\s+(\d+d\d+|\d+)(?:\s+pontos)?\s+para\s+cada\s+(dois\s+)?círculos?\s+de\s+espaço\s+de\s+magia\s+acima\s+de\s+(\d)\./i.exec(upcast);
  if(!m || /aumenta|,/.test(m[1])){
    const t = literal(upcast);
    return t ? { modo:"texto", texto:t } : null;
  }
  const sujeito = m[1].trim(), inc = m[2], passo = m[3] ? 2 : 1, de = +m[4];
  const geral = /^(?:O|Todo)\s+dano(?:\s+base)?$|^Ambos os tipos de dano$/i.test(sujeito);
  const tipos = partes.map(p=>p.tipo).filter(Boolean);
  const nomeiaTodos = tipos.length === partes.length && !/\sou\s/.test(sujeito) &&
    tipos.every(t=>sujeito.includes(t));
  const iguais = partes.every(p=>p.dados === partes[0].dados);
  const curto = "+" + inc + (passo === 2 ? " a cada dois círculos" : " por círculo") + " acima do " + de + "º";
  if((geral || nomeiaTodos) && iguais && de === nivel){
    const nucleo = /^(\d+d\d+)((?: \+ \d+)?)$/.exec(partes[0].dados);
    if(nucleo){
      const passos = [];
      for(let c = nivel; c <= 9; c += passo){
        const v = somaDados(nucleo[1], inc, (c - nivel) / passo);
        if(!v) return { modo:"texto", texto:curto };
        passos.push({ rotulo: c + "º", valor: v + nucleo[2].replace(/\s/g,"") });
      }
      if(passos.length > 1) return { modo:"circulo", passos };
    }
  }
  const quem = geral ? "" : sujeito.replace(/^O\s+/,"").replace(/^./,c=>c.toUpperCase()) + ": ";
  return { modo:"texto", texto: quem + curto };
}

// "níveis 5 (2d10), 11 (3d10) e 17 (4d10)"
function escalaTruque(truque, partes){
  const m = /níveis\s+5\s+\(([^)]+)\),\s+11\s+\(([^)]+)\)\s+e\s+17\s+\(([^)]+)\)/i.exec(truque);
  if(!m){ const t = literal(truque); return t ? { modo:"texto", texto:t } : null; }
  let base = partes.length ? partes[0].dados : "";
  if(/\sou\s/.test(m[1]) && partes.length > 1) base = partes.map(p=>p.dados).join(" ou ");
  if(/adicional/i.test(truque.slice(0, m.index))) base = "—";
  if(!base) return null;
  return { modo:"nivel", passos:[
    { rotulo:"1–4", valor:base }, { rotulo:"5–10", valor:m[1] },
    { rotulo:"11–16", valor:m[2] }, { rotulo:"17–20", valor:m[3] }
  ]};
}

function analisar(m){
  if(INCIDENTAL.has(m.nome)) return null;
  const { corpo, upcast, truque } = partesDoTexto(m.descricao);
  const occ = ocorrencias(corpo).filter(o=>!o.menos);
  const aj = AJUSTES[m.nome];
  const vistos = new Set();
  const partes = aj ? aj.partes.slice() : occ.filter(o=>{
    const k = [o.dados, o.tipo, o.extra, o.escolha].join("|");
    if(vistos.has(k)) return false; vistos.add(k); return true;
  }).map(o=>({ dados:o.dados, tipo:o.tipo, extra:o.extra, mod:o.mod, escolha:o.escolha }));
  if(!partes.length) return null;
  const teste = aj ? aj.teste : testeDe(corpo, occ[0]);
  const metade = /metade (?:desse|do) dano/i.test(corpo);
  let escala = null;
  if(m.nivel === 0) escala = truque ? escalaTruque(truque, partes) : null;
  else if(upcast) escala = escalaCirculo(upcast, m.nivel, partes);
  if(escala && aj && aj.legenda) escala.legenda = aj.legenda;
  return { partes, teste, metade, escala };
}

// envolve cada trecho de dano do HTML (já escapado) num <span class="dano">, com os dados
// em <b>: é a "rubrica" que o olho procura no meio do texto
const NUMERO = new RegExp(DADOS + "|^\\d+|\\d+(?=\\s+pontos)", "i");
function rubricar(html){
  return html.replace(FRASE, t=>'<span class="dano">' + t.replace(NUMERO, d=>"<b>" + d + "</b>") + "</span>");
}

const api = { analisar, rubricar, TIPOS };
if(typeof module !== "undefined" && module.exports) module.exports = api;
else root.GRIM_DANO = api;
})(typeof window !== "undefined" ? window : this);
