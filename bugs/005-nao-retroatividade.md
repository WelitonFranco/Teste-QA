# 005 — v2 recalcula o total de cotações já faturadas

**Severidade:** Crítica  
**Versão afetada:** v2  
**Ambiente:** detalhe das cotações seed em `localhost:3001` e `localhost:3002`

## Passos para reproduzir

1. Consulte `GET /api/cotacoes/10` na v1 e na v2.
2. Repita para os IDs de 1 a 60, marcados como faturados na carga inicial.

## Resultado esperado (SPEC)

Cotações já faturadas preservam o valor pelo qual foram faturadas; não devem receber desconto retroativo nem recálculo de preço.

## Resultado obtido

Para o ID 10, a v1 retorna R$ 127,68 e a v2 retorna R$ 121,29. No conjunto seed, 29 de 60 totais exibidos mudam: 23 com a mesma base (desconto/cálculo) e 6 por mudança de faixa de peso.

## Causa provável

`comValores` em `src/cotacoes.js` executa o motor atual sem considerar `faturada`; o motor v2 não recupera um total histórico persistido. `src/seed.js` também cria faturas sem o campo `valor`, impossibilitando usar esse valor como fonte histórica.

## Impacto

29/60 cotações marcadas como faturadas apresentam total diferente da v1. A soma dos totais exibidos na v2 supera a soma da v1 em R$ 333,02; isso é uma comparação de exibição, não uma afirmação sobre valores cobrados, pois os registros seed de fatura não guardam o valor emitido.

## Evidência

Comparação direta das APIs e teste `v2 preserva o total das cotações já faturadas`.