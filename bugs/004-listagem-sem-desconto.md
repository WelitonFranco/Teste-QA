# 004 — Listagem exibe total sem desconto e diverge do detalhe

**Severidade:** Alta  
**Versão afetada:** v2  
**Ambiente:** `GET http://localhost:3002/api/cotacoes` e tela v2

## Passos para reproduzir

1. Consulte `GET /api/cotacoes?page=1&limit=200` e escolha uma cotação com mais de 10 volumes.
2. Compare o item da lista com `GET /api/cotacoes/{id}` e selecione a mesma linha na tela.

## Resultado esperado (SPEC e contrato API)

A listagem deve mostrar o valor final e o desconto da cotação, coerentes com o detalhe e com o valor faturado.

## Resultado obtido

O item v2 não contém `valor_total` nem `desconto`; contém `total`, calculado com uma cotação temporária de 1 volume. A tela apresenta esse valor sem desconto e mostra “—” no desconto. Para a cotação #20, a tabela mostra R$ 234,08 e o detalhe R$ 210,67 (10% de desconto).

## Causa provável

`itemDeLista` em `src/cotacoes.js` recalcula o preço com `volumes: 1` e retorna `total`, omitindo o percentual e o campo `valor_total` documentado. A interface aceita o nome alternativo `total`, então o erro não fica visível como campo vazio.

## Impacto

95 de 200 cotações seed têm mais de 10 volumes e divergem entre lista e detalhe; 69 dessas ainda não estão faturadas. Sob a interpretação inclusiva, 131 linhas deveriam expor desconto, incluindo as 36 de 10 volumes; a coluna atual não mostra percentual em nenhuma linha. A alteração do nome do campo também pode quebrar consumidores externos.

## Evidência

Validado na API e na interface: #20, volumes 21, lista R$ 234,08; detalhe R$ 210,67. Teste automatizado: `listagem v2 mantém desconto e valor consistentes com o detalhe`.