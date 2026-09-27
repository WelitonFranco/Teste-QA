# Suíte de regressão

## Como rodar

Requer Node.js 18 ou superior. Não instala dependências nem exige que as APIs estejam em execução.

```bash
node --test regressao/api.test.js
```

## Pré-condições

Execute o comando na raiz do repositório. A suíte inicia v1 e v2 em portas efêmeras dentro do próprio processo, restaura a carga seed antes de cada cenário e fecha os servidores ao terminar. Não modifica arquivos nem exige serviço externo.

## Ferramenta escolhida e por quê

Foi usado `node:test` e `fetch`, incluídos no Node 18+. Isso mantém a suíte sem dependências e reproduz o contrato HTTP real, inclusive chamadas concorrentes, com um comando.

## Cenários cobertos

| # | Cenário | O que protege | v1 esperado | v2 esperado |
|---|---|---|---|---|
| 1 | Versão e carga seed | Bootstrap, versão e 200 cotações | Passa | Passa |
| 2 | Limites de peso 10/50/100 | Faixas inclusivas de produção | Passa | Falha: sobe para a faixa seguinte |
| 3 | Multiplicadores | Mesma UF, mesma região e regiões diferentes | Passa | Passa sem desconto |
| 4 | Desconto 3/15/30/80 | Critérios de aceite da SPEC | Não aplicável | Passa nesses exemplos; pressupõe peso abaixo do limite e mesma UF |
| 5 | Limites de volume 9/10/11/19/20/21/49/50/51 | Transições de faixa | Não aplicável | Falha em 20/50; o caso 10 usa a tabela até esclarecimento do PO |
| 6 | Não retroatividade | Totais das 60 cotações faturadas | Referência | Falha: 29 totais diferem |
| 7 | Imposto e centavos | Desconto sobre total com imposto e arredondamento | Referência | Falha: R$ 50,53 vs R$ 50,54 |
| 8 | Lista e detalhe | Campos e total consistentes | Referência | Falha: desconto ausente e total sem desconto |
| 9 | Filtro, paginação e validação | Contrato funcional das rotas | Passa | Passa nos casos exercitados |
| 10 | Faturamento sequencial | Valor, 201 e repetição 409 | Passa | Passa |
| 11 | Faturas seed | Valor das 60 faturas existentes | Falha: dados seed sem valor | Falha: dados seed sem valor |
| 12 | Faturamento concorrente | Uma fatura por cotação | Regra esperada | Falha: duas requisições retornam 201 |

## Como a suíte compara v1 e v2

Casos sem mudança comparam resultados das duas versões ou usam a v1 como referência. Regras novas usam expectativas fixas derivadas da tabela e dos exemplos aprovados na SPEC. Limites de peso vêm do README, que declara as faixas inclusivas. A tabela de desconto é interpretada inclusivamente; a frase “acima de 10” conflita com a primeira faixa “10 a 19” e está registrada para decisão do PO.

## O que esta suíte NÃO cobre

Não cobre carga, segurança, UFs fora da lista documentada, compatibilidade entre navegadores nem execução específica no Node 18. A validação visual foi manual, não Playwright; o teste automatizado cobre as APIs usadas pela tela.

## Saída esperada no RC analisado

Executado em Node.js 24.21.0: 14 testes, 7 aprovados e 7 reprovados. As falhas são intencionais como resultado de QA: demonstram defeitos do RC e fazem o processo retornar código diferente de zero até correção. Após correção, os 14 devem passar.
