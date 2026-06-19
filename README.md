# Grimório D&D 2024

Construtor de grimório pessoal baseado no **Livro do Jogador (D&D 2024)**, em português.
Inspirado no site *magias5e*, recriado com as **390 magias atualizadas de 2024**.

## Como usar
Abra `index.html` no navegador (duplo clique). **Não precisa de internet nem servidor** — funciona offline.

## Funcionalidades
- **8 classes conjuradoras**: Bardo, Bruxo, Clérigo, Druida, Feiticeiro, Guardião, Mago, Paladino.
- **Filtros**: por círculo (truque a 9º), escola, ritual, concentração e "só do grimório".
- **Busca** por nome.
- **Grimório pessoal**: clique na estrela (☆/★) para marcar as magias conhecidas. Salvo automaticamente no navegador (um grimório por classe).
- **Detalhes completos** de cada magia: conjuração, alcance, componentes, duração e descrição integral.
- **Imprimir / PDF**: gera uma folha limpa só com as magias do seu grimório (botão Imprimir → "Salvar como PDF").
- **Exportar / Importar** o grimório em `.json` para backup ou levar para outro computador.

## Estrutura
```
grimorio/
├── index.html          página principal
├── css/style.css       estilos
├── js/app.js           lógica
└── data/
    ├── magias.js       dados carregados pela página
    └── magias.json     mesmos dados em JSON puro (backup/portável)
```

## Observações
- Os dados foram extraídos do seu próprio PDF do Livro do Jogador para uso pessoal.
- O grimório fica salvo no navegador (localStorage). Use **Exportar** antes de limpar o histórico do navegador.
- Para editar/adicionar magias, ajuste `data/magias.json` e regenere `data/magias.js` (formato: `window.MAGIAS = [...]`).
