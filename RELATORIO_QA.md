# Relatório de QA — Release Candidate v2

**Data:** 2026-09-27  
**Decisão:** NO-GO  
**Escopo:** comparação da v1 com a v2, regressão de precificação e faturamento, API, carga inicial e fluxo principal da interface.

## Resumo executivo

O release não deve ser publicado. Foram reproduzidas sete falhas: limites de peso incorretos, limites de desconto e aritmética monetária divergentes, preço diferente entre listagem e detalhe, recálculo de cotações já faturadas, duplicidade de faturas concorrentes e faturas seed sem valor. As cinco primeiras e a emissão duplicada afetam diretamente preço, cobrança ou auditabilidade.

Na carga seed há 140 cotações não faturadas. Sob a tabela inclusiva da SPEC, 90 totais divergem do esperado; comparando as somas, há R$ 1.705,23 de divergência acima e R$ 0,62 abaixo. Se “acima de 10” for interpretado estritamente, 71 totais divergem, com R$ 1.427,10 acima e R$ 0,70 abaixo. São estimativas comparativas para a carga corrente, não perdas realizadas; 60 cotações já faturadas foram excluídas desses cálculos. A decisão sobre exatamente 10 volumes muda o resultado e está pendente do PO.

## Achados prioritários

| ID | Achado | Impacto observado | Referência |
|---|---|---|---|
| 001 | Faixas de peso usam limite exclusivo | 20/200 seed no limite; 14 não faturadas; exemplos em 10, 50 e 100 kg cobram bases maiores | [bug 001](bugs/001-faixas-de-peso.md) |
| 002 | Fronteiras de desconto erradas | 20 volumes recebe 5% em vez de 10%; 50 recebe 10% em vez de 15%; 6 seed não faturadas em 20 volumes | [bug 002](bugs/002-limites-desconto.md) |
| 003 | Desconto antes do imposto e truncamento | Cotação de 15 volumes SP→BA: R$ 50,53 em vez de R$ 50,54; fatura reproduz o total incorreto | [bug 003](bugs/003-calculo-e-arredondamento.md) |
| 004 | Listagem não aplica desconto | 69 seed não faturadas divergem entre lista e detalhe; cotação #20 mostra R$ 234,08 vs R$ 210,67 | [bug 004](bugs/004-listagem-sem-desconto.md) |
| 005 | Recalcula cotações faturadas | 29/60 totais exibidos diferem da v1; faturas seed sem valor impedem confirmar o valor realmente cobrado | [bug 005](bugs/005-nao-retroatividade.md) |
| 006 | Corrida duplica fatura | Duas chamadas simultâneas retornam 201 e criam duas faturas para o mesmo ID | [bug 006](bugs/006-faturamento-concorrente.md) |
| 007 | Histórico seed sem valor | 60/60 faturas iniciais sem `valor`, em ambas as versões | [bug 007](bugs/007-faturas-seed-sem-valor.md) |

## Testes manuais e funcionais

- Subi v1 em `localhost:3001` e v2 em `localhost:3002`; ambas responderam com o identificador correto e 200 cotações seed.
- Comparei os limites de peso por POST. A v1 respeita 10/50/100 kg; a v2 sobe cada limite à faixa seguinte.
- Exercitei criação para 9, 10, 11, 15, 19, 20, 21, 30, 49, 50, 51 e 80 volumes. A v2 erra as transições de 20 e 50; o comportamento em 10 depende de resposta do PO.
- Na interface v2, a lista carregou 200 linhas. Selecionar a cotação #20 mostrou R$ 234,08 na lista e R$ 210,67 no detalhe; o desconto só aparece no detalhe.
- Pela interface criei cotação de 9 kg, 15 volumes, SP→BA. O detalhe mostrou 5% e R$ 50,53; faturar gravou uma fatura de R$ 50,53, enquanto a expectativa é R$ 50,54.
- A emissão sequencial funcionou: primeira chamada 201 e repetição 409. Duas chamadas simultâneas emitiram duas faturas, ambas 201.
- Listagem, filtro por cliente, paginação, validação de campo obrigatório e respostas 404 passaram nos cenários exercitados.
- As 60 faturas seed não têm valor na API e aparecem sem valor na tela.

## Automação

A suíte foi implementada em `regressao/api.test.js` com `node:test` e `fetch`, sem pacotes externos. Roda com `node --test regressao/api.test.js`; inicia as versões em portas efêmeras, reinicializa os dados entre testes e não depende de servidores previamente iniciados.

Resultado executado no Node.js 24.21.0: **14 testes, 7 aprovados e 7 reprovados**. As falhas reproduzem os defeitos listados. A suíte cobre versão e carga seed, faixas e rotas, critérios do desconto, não retroatividade, listagem/detalhe, contrato de API, fatura seed e faturamento sequencial/concorrente. O comando retorna código diferente de zero no RC, como esperado para uma suíte que detecta regressões ainda abertas.

## Ambiguidades e limitações

- A tabela diz 10–19 volumes; o texto diz “acima de 10”. Foi adotada a tabela na automação, com impacto alternativo descrito acima. Confirmar com o PO.
- O changelog anuncia listagem mais enxuta sem documentar a remoção de `valor_total` ou `desconto`; confirmar compatibilidade esperada com consumidores externos.
- Não há valores nas faturas seed. A comparação de histórico usa a cotação v1 como proxy, não como evidência do campo de fatura.
- Executado no Windows e Node 24.21.0. Node 18, carga, segurança e outros navegadores não foram executados.

## Próximos passos para mudar a decisão

Resolver a fronteira de 10 volumes, corrigir cálculo e faixas, garantir não retroatividade e emissão atômica, persistir/expor valores das faturas e tornar lista/detalhe coerentes. Depois, exigir 14/14 testes passando e repetir a validação manual dos fluxos de criação, detalhe e faturamento.