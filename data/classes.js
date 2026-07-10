/* Tabelas de progressão de conjuração — Livro do Jogador D&D 2024.
   Números conferidos contra as tabelas de classe do livro (capítulo 3).
   Índice dos arrays = nível do personagem - 1 (níveis 1 a 20). */
window.CLASSES_DATA = (function(){
  // Espaços de magia por círculo (índice 0 = 1º círculo)
  const SLOTS_COMPLETO = [
    [2],[3],[4,2],[4,3],[4,3,2],[4,3,3],[4,3,3,1],[4,3,3,2],
    [4,3,3,3,1],[4,3,3,3,2],[4,3,3,3,2,1],[4,3,3,3,2,1],
    [4,3,3,3,2,1,1],[4,3,3,3,2,1,1],[4,3,3,3,2,1,1,1],[4,3,3,3,2,1,1,1],
    [4,3,3,3,2,1,1,1,1],[4,3,3,3,3,1,1,1,1],[4,3,3,3,3,2,1,1,1],[4,3,3,3,3,2,2,1,1]
  ];
  const SLOTS_MEIO = [
    [2],[2],[3],[3],[4,2],[4,2],[4,3],[4,3],[4,3,2],[4,3,2],
    [4,3,3],[4,3,3],[4,3,3,1],[4,3,3,1],[4,3,3,2],[4,3,3,2],
    [4,3,3,3,1],[4,3,3,3,1],[4,3,3,3,2],[4,3,3,3,2]
  ];
  // Magia de Pacto do Bruxo: n = espaços, c = círculo (todos os espaços são do mesmo círculo)
  const PACTO = [
    {n:1,c:1},{n:2,c:1},{n:2,c:2},{n:2,c:2},{n:2,c:3},{n:2,c:3},{n:2,c:4},{n:2,c:4},
    {n:2,c:5},{n:2,c:5},{n:3,c:5},{n:3,c:5},{n:3,c:5},{n:3,c:5},{n:3,c:5},{n:3,c:5},
    {n:4,c:5},{n:4,c:5},{n:4,c:5},{n:4,c:5}
  ];
  // Truques conhecidos (progressões compartilhadas: sobe no nível 4 e no 10)
  const T_235 = [2,2,2,3,3,3,3,3,3,4,4,4,4,4,4,4,4,4,4,4];
  const T_345 = [3,3,3,4,4,4,4,4,4,5,5,5,5,5,5,5,5,5,5,5];
  const T_456 = [4,4,4,5,5,5,5,5,5,6,6,6,6,6,6,6,6,6,6,6];
  // Magias preparadas
  const PREP_COMPLETO = [4,5,6,7,9,10,11,12,14,15,16,16,17,17,18,18,19,20,21,22];
  const PREP_MEIO     = [2,3,4,5,6,6,7,7,9,9,10,10,11,11,12,12,14,14,15,15];

  return {
    slots: { completo: SLOTS_COMPLETO, meio: SLOTS_MEIO, pacto: PACTO },
    classes: {
      "Bardo":      { atributo:"Carisma",      chave:"CAR", conjurador:"completo", truques:T_235, preparadas:PREP_COMPLETO },
      "Bruxo":      { atributo:"Carisma",      chave:"CAR", conjurador:"pacto",    truques:T_235, preparadas:[2,3,4,5,6,7,8,9,10,10,11,11,12,12,13,13,14,14,15,15] },
      "Clérigo":    { atributo:"Sabedoria",    chave:"SAB", conjurador:"completo", truques:T_345, preparadas:PREP_COMPLETO },
      "Druida":     { atributo:"Sabedoria",    chave:"SAB", conjurador:"completo", truques:T_235, preparadas:PREP_COMPLETO },
      "Feiticeiro": { atributo:"Carisma",      chave:"CAR", conjurador:"completo", truques:T_456, preparadas:[2,4,6,7,9,10,11,12,14,15,16,16,17,17,18,18,19,20,21,22] },
      "Guardião":   { atributo:"Sabedoria",    chave:"SAB", conjurador:"meio",     truques:null,  preparadas:PREP_MEIO },
      "Mago":       { atributo:"Inteligência", chave:"INT", conjurador:"completo", truques:T_345, preparadas:[4,5,6,7,9,10,11,12,14,15,16,16,17,18,19,21,22,23,24,25] },
      "Paladino":   { atributo:"Carisma",      chave:"CAR", conjurador:"meio",     truques:null,  preparadas:PREP_MEIO }
    }
  };
})();
