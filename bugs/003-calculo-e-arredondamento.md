# 003 — Desconto calculado antes do imposto e centavos truncados

**Severidade:** Alta  
**Versão afetada:** v2  
**Ambiente:** `POST http://localhost:3002/api/cotacoes`

## Passos para reproduzir

1. Crie uma cotação com peso 9 kg, 15 volumes, origem SP e destino BA.
2. Compare o `valor_total` com o cálculo da SPEC e do arredondamento comercial do README.

## Resultado esperado (SPEC e README)

Rota: R$ 25,00 × 1,9 = R$ 47,50. Com imposto: R$ 53,20. Aplicando 5% e arredondamento comercial: R$ 50,54.

## Resultado obtido

v2 retorna R$ 50,53. A tela de detalhe e a fatura recém-emitida também mostram R$ 50,53.

## Causa provável

`src/pricing/v2.js` desconta antes do imposto e usa `Math.trunc` tanto no valor descontado intermediário quanto no final, em vez de aplicar o desconto ao total com imposto e arredondar centavos pela regra vigente.

## Impacto

O caso reproduzido subcobra R$ 0,01. Isolando a base, multiplicador e percentual escolhidos atualmente pela v2, 87 totais seed diferem do cálculo pós-imposto com arredondamento half-up; a diferença agregada é R$ 1,19 abaixo na carga completa. Esse número não é perda realizada e inclui cotações já faturadas.

## Evidência

Reproduzido via API e interface. Teste automatizado: `v2 calcula desconto sobre o valor já acrescido do imposto e arredonda centavos`.