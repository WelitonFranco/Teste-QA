# 001 — Limites de peso avançam para a faixa seguinte

**Severidade:** Crítica  
**Versão afetada:** v2  
**Ambiente:** `POST http://localhost:3002/api/cotacoes`

## Passos para reproduzir

1. Envie `{"cliente":"QA","peso_kg":10,"volumes":1,"uf_origem":"SP","uf_destino":"SP"}` para `POST /api/cotacoes`.
2. Repita com `peso_kg` igual a 50 e 100.

## Resultado esperado (README)

As faixas incluem o limite: 10 kg usa base R$ 25,00; 50 kg usa R$ 60,00; 100 kg usa R$ 110,00. Para SP→SP, os totais esperados são, respectivamente, R$ 28,00, R$ 67,20 e R$ 123,20.

## Resultado obtido

v2 usa as bases R$ 60,00, R$ 110,00 e R$ 180,00, resultando em R$ 67,20, R$ 123,20 e R$ 201,60. A v1 retorna os valores esperados.

## Causa provável

`src/pricing/v2.js` seleciona a faixa com `peso_kg < ate`, enquanto a v1 usa `<=` e o README define limites inclusivos.

## Impacto

20 de 200 cotações seed estão exatamente nos limites: 7 com 10 kg, 6 com 50 kg e 7 com 100 kg. Destas, 14 ainda não estão faturadas. No conjunto não faturado, 14 totais recebem base incorreta.

## Evidência

Reproduzido por POST nas duas versões e coberto pelo teste `v2 mantém as faixas de peso inclusivas da v1` em `regressao/api.test.js`.