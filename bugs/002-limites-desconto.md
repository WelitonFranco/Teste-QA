# 002 — Percentuais incorretos nos limites de desconto

**Severidade:** Alta  
**Versão afetada:** v2  
**Ambiente:** `POST http://localhost:3002/api/cotacoes`

## Passos para reproduzir

1. Crie cotações com peso 9 kg, rota SP→SP e volumes 20 e 50.
2. Leia `desconto` na resposta de criação.

## Resultado esperado (SPEC)

20 volumes pertencem à faixa de 10% e 50 volumes à faixa de 15%.

## Resultado obtido

v2 retorna 5% para 20 volumes e 10% para 50 volumes. Volumes 21 e 51 recebem os percentuais maiores, respectivamente.

## Causa provável

`descontoPorVolume` em `src/pricing/v2.js` testa `qtd > 50`, `qtd > 20` e `qtd > 10`; os limites superiores das faixas inclusivas não entram na faixa correspondente.

## Impacto

Na carga seed há 7 cotações com 20 volumes, sendo 6 não faturadas. Não há seed com 50 volumes; o caso foi reproduzido sinteticamente. Há ainda 36 cotações com exatamente 10 volumes (25 não faturadas), mas o desconto delas está pendente de decisão do PO: a tabela inclui 10 e o texto diz “acima de 10”. Sob a leitura inclusiva, 31 cotações não faturadas recebem percentual diferente; sob a leitura estrita, são 6.

## Evidência

Os limites 20 e 50 falham em `v2 aplica os descontos nos limites especificados`. A divergência sobre 10 volumes está registrada em `PERGUNTAS_AO_PO.md`.