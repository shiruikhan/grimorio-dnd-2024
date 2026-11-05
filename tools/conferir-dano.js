/* Mostra o que js/dano.js extrai de cada magia — rode na raiz do projeto:
     node tools/conferir-dano.js              (todas as magias com dano)
     node tools/conferir-dano.js "Bola de Fogo"   (só as que contêm esse trecho no nome)
     node tools/conferir-dano.js --sem         (magias que citam dano mas ficaram sem bloco)

   Use depois de adicionar ou editar magias em data/magias.json: o bloco "Dano" da página
   é montado a partir do texto, então uma redação fora do padrão aparece aqui como ausente
   ou estranha. */
"use strict";
const fs = require("fs");
const path = require("path");
const dano = require(path.join(__dirname, "..", "js", "dano.js"));

const magias = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "data", "magias.json"), "utf8"));
const args = process.argv.slice(2);
const sem = args.includes("--sem");
const filtro = args.find(a => !a.startsWith("--"));

function parte(p){
  return (p.nota || p.dados) + (p.mod ? " + mod" : "") + " " + (p.tipo || (p.escolha ? "tipo " + p.escolha : "?")) + (p.extra ? " (adicional)" : "");
}

let n = 0;
magias.forEach(m => {
  if (filtro && !m.nome.toLowerCase().includes(filtro.toLowerCase())) return;
  const r = dano.analisar(m);
  if (sem) {
    if (!r && /\d+d\d+[^.]*dano|dano[^.]*\d+d\d+/.test(m.descricao)) { console.log("· " + m.nome); n++; }
    return;
  }
  if (!r) return;
  n++;
  let linha = (m.nivel === 0 ? "T" : m.nivel) + "  " + m.nome.padEnd(34) + r.partes.map(parte).join(" | ");
  if (r.teste) linha += "  ⟶ " + r.teste + (r.metade ? ", metade" : "");
  else if (r.metade) linha += "  ⟶ metade";
  if (r.escala) linha += "\n      " + (r.escala.modo === "texto" ? r.escala.texto :
    r.escala.passos.map(p => p.rotulo + " " + p.valor).join("  "));
  console.log(linha);
});
console.log("\n" + n + " magia(s).");
