# Perguntas ao Product Owner

## Perguntas em aberto

### 1. Exatamente 10 volumes recebe desconto?

**Onde apareceu:** `SPEC-desconto-por-volume.md`, seções 2 e 4.

**O que está ambíguo:** A tabela define “10 a 19” com 5%; o texto diz “pedidos acima de 10 volumes”, que pode significar 11 ou mais. O critério de aceite testa 3 e 15 volumes, não o limite 10.

**O que a v1 faz hoje:** Nenhum desconto.

**O que a v2 faz:** Nenhum desconto para exatamente 10.

**Por que isso importa:** Há 36 cotações seed com exatamente 10 volumes, 25 ainda não faturadas. Considerando a tabela como inclusiva, elas estão sem o desconto de 5%; considerando “acima de 10” literalmente, o comportamento da v2 nesse ponto está correto. Na carga não faturada, a diferença entre as interpretações altera a contagem de totais divergentes de 90 para 71 e a diferença líquida estimada de R$ 1.704,61 para R$ 1.426,40.

**Interpretação que adotei enquanto não há resposta:** A suíte usa a tabela inclusiva por ser a definição tabular de faixas. Se a regra for estritamente acima de 10, atualizar a expectativa e os valores da exposição financeira.

**Bloqueia o go/no-go?** Sim — a faixa é comercial e afeta valores; precisa de uma definição antes de aprovar preço.

### 2. A mudança do contrato da listagem v2 é intencional e compatível com consumidores?

**Onde apareceu:** `CHANGELOG-v2.md`, “Ajustes de performance na listagem”; contrato de `GET /api/cotacoes` no `README.md`.

**O que está ambíguo:** O changelog anuncia payload mais enxuto, mas não documenta remoção/renomeação de `valor_total` para `total` nem omissão de `desconto`. A interface nova aceita `total`, mas o novo campo é calculado sem aplicar o desconto do detalhe.

**O que a v1 faz hoje:** Lista `valor_total` com preço final e sem desconto por volume.

**O que a v2 faz:** Lista `total` sem desconto e omite `desconto`; o detalhe retorna valor com desconto. Em 69 cotações seed não faturadas, o valor visto na lista diverge do detalhe.

**Por que isso importa:** Consumidores da API podem depender do nome e significado documentados; operadores veem preço divergente na tela.

**Interpretação que adotei enquanto não há resposta:** A redução do payload pode ser intencional, mas não autoriza divergência monetária. Tratei a inconsistência como defeito e a mudança de campo como risco de compatibilidade.

**Bloqueia o go/no-go?** Sim — a lista precisa apresentar o mesmo preço que será faturado e a quebra de contrato deve ser explícita.

## Decisões que tomei sem perguntar

- Apliquei o arredondamento comercial half-up descrito no README também ao total com desconto; a SPEC determina duas casas decimais, sem substituir essa regra vigente.
- Considerei os limites de peso inclusivos, conforme a tabela e os exemplos do README.
- Considerei que a regra de faturamento único vale também para solicitações concorrentes; o contrato não restringe a garantia a chamadas sequenciais.
