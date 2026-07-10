/* Talentos que alteram truques conhecidos ou magias sempre preparadas — Livro do Jogador D&D 2024 (cap. 5).
   Só entram aqui talentos que mudam QUANTIDADES da ficha; talentos que apenas mudam o modo de
   conjurar (Conjurador Bélico, Atirador Arcano, Adepto Elemental, Dádivas Épicas etc.) ficam de fora.
   Nenhum talento de 2024 concede espaços de magia — os usos extras são conjurações grátis por Descanso Longo.
   efeito: truques/preparadas = bônus fixo; preparadasProf = soma o Bônus de Proficiência (escala com o nível). */
window.TALENTOS_DATA = [
  { id:"iniciado", nome:"Iniciado em Magia", categoria:"Origem", repetivel:3,
    resumo:"2 truques + 1 magia de 1º círculo sempre preparada (lista de Clérigo, Druida ou Mago; uma lista diferente a cada aquisição). A magia tem 1 conjuração grátis por Descanso Longo.",
    efeito:{ truques:2, preparadas:1 } },
  { id:"ritualista", nome:"Conjurador Ritualista", categoria:"Geral", prereq:"Nível 4+, INT/SAB/CAR 13+",
    resumo:"Magias de 1º círculo com marcador Ritual sempre preparadas, em número igual ao seu Bônus de Proficiência (cresce junto). Ritual Rápido 1×/Descanso Longo.",
    efeito:{ preparadasProf:true } },
  { id:"telecinetico", nome:"Telecinético", categoria:"Geral", prereq:"Nível 4+",
    resumo:"Aprende o truque Mãos Mágicas (aprimorado) e ganha o Empurrão Telecinético como Ação Bônus.",
    efeito:{ truques:1 } },
  { id:"telepatico", nome:"Telepático", categoria:"Geral", prereq:"Nível 4+",
    resumo:"Detectar Pensamentos sempre preparada; 1 conjuração grátis por Descanso Longo. Fala telepática a 18 m.",
    efeito:{ preparadas:1 } },
  { id:"sombras", nome:"Tocado Pelas Sombras", categoria:"Geral", prereq:"Nível 4+",
    resumo:"Invisibilidade + 1 magia de 1º círculo (Ilusão ou Necromancia) sempre preparadas; 1 conjuração grátis de cada por Descanso Longo.",
    efeito:{ preparadas:2 } },
  { id:"fadas", nome:"Tocado Por Fadas", categoria:"Geral", prereq:"Nível 4+",
    resumo:"Passo Nebuloso + 1 magia de 1º círculo (Adivinhação ou Encantamento) sempre preparadas; 1 conjuração grátis de cada por Descanso Longo.",
    efeito:{ preparadas:2 } }
];
