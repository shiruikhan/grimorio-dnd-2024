/* Verificador dos dados das magias — rode na raiz do projeto:
     node tools/verificar-dados.js            (só verifica)
     node tools/verificar-dados.js --gerar    (regera data/magias.js a partir de data/magias.json)

   data/magias.json é a fonte da verdade; data/magias.js é a mesma lista embrulhada em
   `window.MAGIAS` para a página carregar sem servidor. Como os dois são editados à mão,
   este script existe para garantir que não divirjam em silêncio. */
"use strict";
const fs = require("fs");
const path = require("path");

const DIR = path.join(__dirname, "..", "data");
const CABECALHO = "// Dados das magias extraidos do Livro do Jogador 2024 (uso pessoal)\n";
const ESCOLAS = ["Abjuração","Adivinhação","Encantamento","Evocação","Ilusão","Invocação","Necromancia","Transmutação"];
const CLASSES = ["Bardo","Bruxo","Clérigo","Druida","Feiticeiro","Guardião","Mago","Paladino"];
const OBRIGATORIOS = ["nome","nivel","escola","classes","tempo","alcance","componentes","duracao","descricao"];

function conteudoJs(arr){ return CABECALHO + "window.MAGIAS = " + JSON.stringify(arr) + ";"; }
function conteudoJson(arr){ return JSON.stringify(arr, null, 1) + "\n"; }

function lerJs(){
  const src = fs.readFileSync(path.join(DIR, "magias.js"), "utf8");
  const global_ = { window: {} };
  new Function("window", src)(global_.window);
  return global_.window.MAGIAS;
}

const erros = [];
const magias = JSON.parse(fs.readFileSync(path.join(DIR, "magias.json"), "utf8"));

if (process.argv.includes("--gerar")) {
  fs.writeFileSync(path.join(DIR, "magias.js"), conteudoJs(magias), "utf8");
  fs.writeFileSync(path.join(DIR, "magias.json"), conteudoJson(magias), "utf8");
  console.log("data/magias.js regerado a partir de data/magias.json (" + magias.length + " magias).");
}

// 1. os dois arquivos precisam conter exatamente a mesma lista
if (JSON.stringify(lerJs()) !== JSON.stringify(magias)) {
  erros.push("data/magias.js e data/magias.json divergem — rode: node tools/verificar-dados.js --gerar");
}

// 2. campos obrigatórios preenchidos
magias.forEach(m => {
  const faltando = OBRIGATORIOS.filter(k =>
    m[k] === undefined || m[k] === "" || (Array.isArray(m[k]) && !m[k].length));
  if (faltando.length) erros.push(m.nome + ": campo vazio/ausente → " + faltando.join(", "));
});

// 3. nenhum campo pode conter rótulo do livro ("Alcance:", "Componente:"…) — sinal de que a
//    extração do PDF juntou duas linhas. Note o singular: o livro escreve "Componente:" quando
//    a magia tem poucos componentes, e foi exatamente isso que furou a extração original.
const ROTULO = /(Tempo de Conjuração:|Alcance:|Componentes?:|Duração:)/;
magias.forEach(m => {
  ["tempo","alcance","componentes","duracao"].forEach(k => {
    if (ROTULO.test(m[k] || "")) erros.push(m.nome + ": campo " + k + " contém rótulo do livro → " + JSON.stringify(m[k]));
  });
});

// 4. escolas, classes e círculos válidos
magias.forEach(m => {
  if (!ESCOLAS.includes(m.escola)) erros.push(m.nome + ": escola desconhecida → " + m.escola);
  (m.classes || []).forEach(c => {
    if (!CLASSES.includes(c)) erros.push(m.nome + ": classe desconhecida → " + c);
  });
  if (!Number.isInteger(m.nivel) || m.nivel < 0 || m.nivel > 9) erros.push(m.nome + ": círculo inválido → " + m.nivel);
});

// 5. nomes únicos (o grimório é salvo por nome no localStorage)
const vistos = new Set();
magias.forEach(m => {
  if (vistos.has(m.nome)) erros.push("nome duplicado → " + m.nome);
  vistos.add(m.nome);
});

// 6. comp_v/comp_s/comp_m/material coerentes com a string `componentes`
//    (é dela que o app deriva o filtro e o marcador "M" — ver materialDesc() em js/app.js)
magias.forEach(m => {
  const mt = /(?:^|,)\s*M(?:\s*\(([^)]*)\))?/.exec(m.componentes || "");
  const esperado = {
    comp_v: /(?:^|,)\s*V\b/.test(m.componentes || ""),
    comp_s: /(?:^|,)\s*S\b/.test(m.componentes || ""),
    comp_m: mt !== null,
    material: mt ? (mt[1] || "") : ""
  };
  Object.keys(esperado).forEach(k => {
    if (JSON.stringify(m[k]) !== JSON.stringify(esperado[k])) {
      erros.push(m.nome + ": " + k + " = " + JSON.stringify(m[k]) +
        ", esperado " + JSON.stringify(esperado[k]) + " para componentes " + JSON.stringify(m.componentes));
    }
  });
});

if (erros.length) {
  console.error("\n" + erros.length + " problema(s):\n");
  erros.forEach(e => console.error("  ✗ " + e));
  process.exit(1);
}

const homebrew = magias.filter(m => m.homebrew).length;
console.log("OK — " + magias.length + " magias (" + (magias.length - homebrew) +
  " do Livro do Jogador + " + homebrew + " homebrew), arquivos sincronizados.");
