# Matriz de cobertura

## Como ler esta matriz

`Automatizado` indica cenário incluído em `regressao/api.test.js`; `Manual` indica interação ou consulta executada durante esta análise. `Falha` significa que a validação foi executada e reproduziu um defeito do RC, não que o teste foi ignorado. A suíte final teve 14 testes: 7 passaram e 7 falharam.

## Risco × cobertura

| # | Risco | Área | Como foi coberto | Automatizado? | Resultado | Problema aberto |
|---|---|---|---|---|---|---|
| 1 | Faixa errada nos limites de peso | Precificação | POST nos pesos 10, 50 e 100; comparação v1/v2 e seed | Sim | Falha v2; 20 seed afetadas, 14 não faturadas | `bugs/001-faixas-de-peso.md` |
| 2 | Percentuais incorretos nos limites do desconto | Precificação | Volumes 9, 10, 11, 19, 20, 21, 49, 50 e 51 | Sim | Falha em 20/50; 10 depende do PO | `bugs/002-limites-desconto.md` |
| 3 | Recalcular valor faturado | Não retroatividade | Comparação dos 60 IDs faturados entre v1 e v2 | Sim | Falha; 29 totais mudam | `bugs/005-nao-retroatividade.md` |
| 4 | Valor de lista não corresponde ao detalhe | API e tela | Comparação de API e seleção manual da cotação #20 | Sim e manual | Falha; 69 divergências nas seed não faturadas | `bugs/004-listagem-sem-desconto.md` |
| 5 | Desconto/imposto/arredondamento incorretos | Precificação | Cotação de 15 volumes, peso 9 kg, SP→BA | Sim e manual | Falha: R$ 50,53 vs R$ 50,54 | `bugs/003-calculo-e-arredondamento.md` |
| 6 | Fatura duplicada em corrida | Faturamento | Duas emissões simultâneas para o mesmo ID | Sim | Falha; duas respostas 201 e duas faturas | `bugs/006-faturamento-concorrente.md` |
| 7 | Valor histórico ausente | Faturas seed | GET `/api/faturas` e tela | Sim e manual | Falha em v1 e v2; 60 sem `valor` | `bugs/007-faturas-seed-sem-valor.md` |
| 8 | Regras estáveis da v1 | Faixas e rotas | Limites inclusivos e rotas same-region/cross-region | Sim | Passou | Nenhum para v1 |
| 9 | Paginação, filtro, validação e 404 | API | Página 2, limite 7, cliente exato, payload incompleto e IDs ausentes | Sim | Passou | Não cobre entradas não especificadas |
| 10 | Emissão sequencial | Faturamento | Primeira emissão e repetição posterior | Sim | Passou: 201, depois 409 | Concorrência continua defeituosa |

## Cobertura por regra de negócio

| Regra | Fonte | Cenários testados | Situação |
|---|---|---|---|
| Faixas de peso inclusivas | README | 10, 50 e 100 kg em v1 e v2 | v1 passa; v2 falha nos três limites |
| Multiplicador de rota | README | SP→SP, SP→RJ e SP→BA, sem desconto | Passou nas duas versões |
| Imposto de 12% | README / SPEC | Casos sem desconto e desconto pós-imposto | Sem desconto passa; cálculo descontado diverge |
| Arredondamento comercial | README | SP→BA, 15 volumes | Falha: R$ 50,53 em vez de R$ 50,54 |
| Fatura única por cotação | README | Repetição sequencial e concorrente | Sequencial passa; concorrente duplica |
| Desconto por volume | SPEC | 3, 15, 30, 80 e limites de faixa | Exemplos passam em rota same-state; limites 20/50 falham; 10 aguarda PO |
| Contrato das rotas da API | README / CHANGELOG | Versão, detalhe, listagem, filtro, paginação, POST e fatura | Parcial; lista v2 omite `valor_total`/`desconto` e retorna total sem desconto |
| Não retroatividade | SPEC | 60 cotações já faturadas comparadas com v1 | Falha; 29 totais mudaram |

## Lacunas conhecidas

- A regra de exatamente 10 volumes exige decisão do PO; a suíte usa a tabela inclusiva.
- O teste de não retroatividade compara totais da v1 porque as faturas seed não contêm o valor efetivamente emitido.
- Não há teste de carga, segurança, navegador cruzado, UFs inválidas ou limites máximos de entrada.
- Node 18 é a versão mínima declarada, mas a execução observada foi em Node 24.21.0.
