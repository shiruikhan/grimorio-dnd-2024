# Grimório D&D 2024

Construtor de grimório pessoal baseado no **Livro do Jogador (D&D 2024)**, em português.
Inspirado no site *magias5e*, recriado com as **390 magias atualizadas de 2024**.

> 🔗 **Acesse online:** https://shiruikhan.github.io/grimorio-dnd-2024/
> 📱 Funciona bem no celular — ótimo como consulta rápida durante o jogo.

## Como usar
Use a **versão online** no link acima, ou baixe e abra `index.html` no navegador (duplo clique).
**Não precisa de internet nem servidor** — funciona offline depois de carregado.

## Funcionalidades
- **8 classes conjuradoras**: Bardo, Bruxo, Clérigo, Druida, Feiticeiro, Guardião, Mago, Paladino.
- **Filtros**: por círculo (truque a 9º), escola, ritual, concentração e "só do grimório".
- **Busca** por nome.
- **Grimório pessoal**: clique na estrela (☆/★) para marcar as magias conhecidas. Salvo automaticamente no navegador (um grimório por classe).
- **Detalhes completos** de cada magia: conjuração, alcance, componentes, duração e descrição integral.
- **Ficha simplificada** (botão 🧙 Ficha): nome, nível e atributos do personagem. Calcula automaticamente (regras 2024) proficiência, CD de magia, ataque mágico, truques e magias preparadas permitidos e espaços de magia por círculo — com caixinhas de uso e botão de descanso longo. Tem exportação própria em folha A4 imprimível.
- **Imprimir / PDF**: gera uma folha limpa só com as magias do seu grimório (botão Imprimir → "Salvar como PDF").
- **Exportar / Importar** o grimório em `.json` para backup ou levar para outro computador.

## Estrutura
```
grimorio/
├── index.html          página principal
├── css/style.css       estilos
├── js/app.js           lógica do grimório
├── js/ficha.js         ficha de personagem simplificada
└── data/
    ├── magias.js       dados carregados pela página
    ├── magias.json     mesmos dados em JSON puro (backup/portável)
    └── classes.js      tabelas de conjuração por classe (D&D 2024)
```

## Observações
- Os dados foram transcritos do Livro do Jogador (2024) para uso pessoal.
- O grimório fica salvo no navegador (localStorage). Use **Backup** antes de limpar o histórico do navegador.
- O `localStorage` é por navegador/dispositivo: use **Backup** / **Restaurar** (`.json`) para levar suas magias de um lugar para outro.
- Para editar/adicionar magias, ajuste `data/magias.json` e regenere `data/magias.js` (formato: `window.MAGIAS = [...]`).

## Aviso legal e conteúdo
Este é um **projeto pessoal**, mas qualquer pessoa é livre para usar, baixar e imprimir. 🙂

As magias aqui reunidas referem-se ao **Livro do Jogador de _Dungeons & Dragons_ (edição 2024)**. O **conteúdo das magias** (nomes, descrições e regras) provavelmente pertence à **Wizards of the Coast** — eu apenas o reorganizei e o distribuo de uma forma agradável para leitura e impressão. Este projeto **não é oficial** e não é afiliado nem endossado pela Wizards of the Coast, e **não tem fins comerciais**.

*Dungeons & Dragons*, *D&D* e os nomes relacionados são marcas da Wizards of the Coast. Se você detém os direitos e deseja a remoção de algo, basta abrir uma *issue* neste repositório.

O **código** deste site (HTML/CSS/JS) é open-source sob a licença **MIT** (veja o arquivo [`LICENSE`](LICENSE)) — fique à vontade para copiar, adaptar e reutilizar. _A licença MIT cobre apenas o código, **não** o conteúdo das magias._
