# Decisão de release — v2

## Decisão: GO / NO-GO

**Decisão:** NO-GO

**Data da análise:** 2026-09-27

**Versões comparadas:** v1 (produção) × v2 (release candidate)

## Justificativa

Não liberar. O RC altera preços nas faixas inclusivas de peso, recalcula valores de cotações faturadas e pode emitir duas faturas para a mesma cotação em solicitações simultâneas. A listagem também exibe valores divergentes do detalhe. São falhas financeiras reproduzidas por API, interface e suíte automatizada, sem mitigação operacional suficiente.

Na carga seed, 14 das 140 cotações ainda não faturadas estão em limites de peso e recebem faixa errada. Sob a leitura inclusiva da tabela de desconto, 90/140 totais não faturados diferem da expectativa, com sobrepreço bruto estimado em R$ 1.705,23 e subpreço de R$ 0,62; sob a leitura estrita “>10”, são 71/140, R$ 1.427,10 de sobrepreço bruto e R$ 0,70 de subpreço. Esses valores são uma comparação de expectativa para a carga atual, não perda já realizada. A diferença líquida inclui cobranças a maior e a menor e não substitui análise por fatura.

## Resumo dos problemas encontrados

| # | Problema | Severidade | Versão | Impacto medido | Bloqueia? |
|---|---|---|---|---|---|
| 001 | Limites de peso exclusivos na v2 | Crítica | v2 | 20 seed; 14 não faturadas; base errada | Sim |
| 002 | Limites de desconto em 20 e 50 volumes | Alta | v2 | 7 seed em 20 volumes; 6 não faturadas; volume 50 reproduzido sinteticamente | Sim |
| 003 | Ordem do desconto e truncamento | Alta | v2 | Exemplo resulta R$ 50,53 em vez de R$ 50,54; 87 diferenças aritméticas isoladas na carga | Sim |
| 004 | Listagem sem desconto e incompatível com detalhe | Alta | v2 | 69 não faturadas têm diferença lista/detalhe; exemplo #20: R$ 234,08 vs R$ 210,67 | Sim |
| 005 | Total recalculado após faturamento | Crítica | v2 | 29/60 totais seed mudaram vs v1; soma exibida difere R$ 333,02 | Sim |
| 006 | Duplo faturamento concorrente | Crítica | ambas, reproduzido em v2 | Duas solicitações simultâneas retornam 201 e criam duas faturas | Sim |
| 007 | Faturas seed sem valor | Média | ambas, preexistente | 60/60 sem `valor`; histórico não auditável pela API/tela | Sim, para auditabilidade |

Os 36 registros seed com exatamente 10 volumes são um subconjunto condicional: a tabela lhes dá 5%, mas o texto “acima de 10” pode excluí-los. Confirmar a interpretação antes de fechar a expectativa financeira.

## Condições para liberar

1. Corrigir as fronteiras inclusivas de peso e desconto; definir o comportamento de 10 volumes com o PO; garantir imposto antes do desconto e arredondamento comercial. Executar os casos de 3, 10, 15, 20, 30, 50 e 80 volumes e pesos 10, 50 e 100 kg na suíte.
2. Preservar valores históricos de cotações faturadas e preencher/expor o valor das faturas existentes. Comprovar que os 60 IDs seed mantêm o valor da v1.
3. Tornar a emissão atômica/idempotente. Com duas requisições concorrentes para o mesmo ID, deve haver uma resposta 201, uma 409 e exatamente uma fatura.
4. Corrigir a listagem para expor o desconto e o mesmo valor final do detalhe, ou documentar/versionar formalmente uma mudança de contrato sem perder consistência monetária.
5. Reexecutar `node --test regressao/api.test.js`: todos os 14 cenários devem passar, incluindo os que hoje falham.

## Riscos aceitos

| Risco | Por que é aceitável | Como detectaríamos em produção |
|---|---|---|
| Carga, segurança e outros navegadores não avaliados | Fora do escopo desta rodada e não reduz o bloqueio funcional já observado | Monitoramento de latência/erros e plano de testes não funcionais antes de ampliar o uso |
| Interpretação de 10 volumes | Não é risco aceitável para liberar; exige decisão documentada do PO | Teste de fronteira e auditoria de cotações com exatamente 10 volumes |

## Recomendação de acompanhamento

Após todas as condições e aprovação da suíte, liberar primeiro com monitoramento de valor da cotação versus valor faturado, contagem de faturas por `id_cotacao` e distribuição de descontos por faixa. Interromper/rollback se houver duplicidade, divergência entre lista e detalhe ou qualquer valor fora das expectativas aprovadas.
