# Estratégia de teste

## Contexto e objetivo da validação

A v2 altera preço e faturamento, portanto a prioridade é evitar cobrança incorreta, alteração de valores já faturados e faturas duplicadas. A decisão é NO-GO até que as falhas críticas sejam corrigidas e comprovadas pela suíte de regressão.

## Análise de risco

| Área | O que pode dar errado | Impacto se acontecer | Probabilidade | Prioridade |
|---|---|---|---|---|
| Preço por peso | Limites inclusivos migram para a faixa seguinte | 20 cotações seed com base incorreta; 14 ainda não faturadas | Alta, reproduzido | P0 |
| Preço por volume | Percentuais não respeitam os limites de 20 e 50 | 7 seed com 20 volumes; mais 36 com 10 volumes dependem de esclarecimento do PO | Alta, reproduzido | P0 |
| Cotações faturadas | O motor v2 recalcula o preço histórico | 29 de 60 valores exibidos diferem entre v1 e v2 | Alta, reproduzido | P0 |
| Emissão de fatura | Duas solicitações concorrentes emitem duas faturas | Duplicidade financeira para uma cotação | Alta, reproduzido | P0 |
| Listagem | O total listado ignora o desconto do detalhe | 69 cotações seed não faturadas divergem entre lista e detalhe | Alta, reproduzido | P1 |
| Cálculo monetário | Desconto antes do imposto e truncamento alteram centavos | 1 centavo no caso reproduzido; 87 diferenças aritméticas isoladas na carga completa | Média, reproduzido | P1 |
| Histórico de faturas | Registros seed não contêm o valor emitido | 60 faturas sem valor; não é possível auditar a não retroatividade | Alta, reproduzido em ambas as versões | P1 |

## Fontes de verdade usadas

- `README.md`: contrato da API, faixas de peso inclusivas, multiplicadores, imposto, arredondamento comercial e faturamento único.
- `SPEC-desconto-por-volume.md`: faixas de desconto, ordem do cálculo, precisão e não retroatividade.
- `CHANGELOG-v2.md`: alterações anunciadas, inclusive redução do payload da listagem.
- Comparação HTTP entre v1 e v2, leitura do caminho de precificação/faturamento e execução da interface.

A frase “acima de 10 volumes” conflita com a linha “10 a 19” da tabela. Os resultados principais mostram ambos os cenários; enquanto aguarda resposta, a suíte usa os limites inclusivos da tabela. A listagem reduzida foi anunciada, mas a resposta v2 omite o desconto e devolve um valor sem desconto, além de trocar `valor_total` por `total`; isso foi avaliado como divergência funcional e risco de compatibilidade.

## Abordagem por área

- Cálculo: casos determinísticos de faixas, rotas, volume, imposto e arredondamento via API; v1 serve de referência para regras sem mudança.
- Não retroatividade: comparação do total v2 com o total de produção para as 60 cotações já faturadas.
- Listagem e detalhe: comparação do mesmo ID pela API e inspeção manual da tela.
- Faturamento: emissão sequencial e duas emissões concorrentes; comparação da fatura com o total da cotação.
- Contrato: versões, paginação, filtro, validação, detalhes e rotas inexistentes.
- Carga inicial: leitura das 200 cotações e 60 faturas pelas APIs, com cálculo independente das expectativas.

## O que decidi NÃO testar

| Ficou de fora | Por quê | Risco que estou aceitando |
|---|---|---|
| Teste de carga e soak | Não há requisito de volume, SLO nem persistência externa; o defeito funcional já impede o release | Regressão de latência sob tráfego alto |
| Segurança, fuzzing e abuso de payload | Validação pontual de contrato não substitui uma avaliação de segurança | Vulnerabilidades fora do escopo funcional podem permanecer |
| Navegadores e dispositivos diferentes | Foi feita inspeção funcional em um navegador integrado, sem matriz de compatibilidade acordada | Diferenças de layout ou interação em outros navegadores |
| UFs inválidas e pesos extremos | A especificação não define domínio completo de UFs nem limites operacionais máximos | Respostas inconsistentes para entradas não especificadas |
| Execução em Node 18 | A suíte foi executada no Node 24.21.0; usa recursos disponíveis desde Node 18, mas essa versão mínima não foi instalada neste ambiente | Compatibilidade específica do patch mínimo não foi executada |

## Ambiente e dados

Windows, Node.js 24.21.0. Para exploração manual, v1 e v2 foram executadas em `localhost:3001` e `localhost:3002`, com a carga seed de 200 cotações e 60 faturas. Os dados foram restaurados com `POST /_reset`. A suíte automatizada sobe os dois servidores em portas efêmeras, restaura os dados entre cenários e não depende de processos externos.

## Limitações da minha análise

Não há valor nas 60 faturas seed, o que impede auditar diretamente o valor monetário histórico; a comparação de não retroatividade usa o total de produção v1 como referência disponível. A contagem financeira da carga seed considera a tabela de desconto inclusiva; com a interpretação estrita “>10”, o resultado muda e precisa ser recalculado após decisão do PO. Não foram testadas cargas, segurança ou navegadores adicionais.
