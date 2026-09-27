# 006 — Emissões concorrentes criam faturas duplicadas

**Severidade:** Crítica  
**Versão afetada:** v1 e v2 (reproduzido no endpoint v2)  
**Ambiente:** `POST /api/cotacoes/{id}/faturar`

## Passos para reproduzir

1. Crie uma cotação não faturada na v2.
2. Envie duas solicitações POST para `/api/cotacoes/{id}/faturar` simultaneamente.
3. Consulte `GET /api/faturas?id_cotacao={id}`.

## Resultado esperado (README)

Uma única fatura é emitida. Uma das solicitações retorna 201 e a outra é recusada com 409.

## Resultado obtido

As duas solicitações retornam 201 e são gravadas como faturas distintas para a mesma cotação.

## Causa provável

`faturar` em `src/faturas.js` verifica `cotacao.faturada`, aguarda 15 ms e só depois grava a fatura e atualiza o estado. Duas chamadas podem passar a verificação antes de qualquer uma atualizar `faturada`.

## Impacto

Uma corrida pode duplicar cobrança para cada cotação concorrida. A repetição sequencial é recusada corretamente; isso não protege contra chamadas sobrepostas.

## Evidência

Reproduzido pela suíte: `faturamento concorrente emite uma única fatura por cotação`. Resultado real: `[201, 201]`; esperado: `[201, 409]` e uma fatura.