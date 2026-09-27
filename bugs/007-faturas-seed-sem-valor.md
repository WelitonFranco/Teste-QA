# 007 — Faturas iniciais não expõem o valor emitido

**Severidade:** Média  
**Versão afetada:** v1 e v2 (problema preexistente)  
**Ambiente:** `GET http://localhost:3001/api/faturas` e `GET http://localhost:3002/api/faturas`

## Passos para reproduzir

1. Consulte `GET /api/faturas` nas duas versões.
2. Inspecione o campo `valor` das 60 faturas iniciais e a seção Faturas da interface.

## Resultado esperado (README)

Cada fatura contém o valor cobrado. A interface deve permitir consultar esse valor e a carga inicial deve preservar o histórico para auditoria.

## Resultado obtido

As 60 faturas retornam sem `valor`; a tela exibe “—” para cada uma. O problema ocorre em v1 e v2.

## Causa provável

`seedFaturas` em `src/seed.js` cria objetos com ID, cotação, cliente e data, mas não popula `valor`.

## Impacto

60/60 registros históricos não permitem verificar o valor faturado nem confirmar diretamente a regra de não retroatividade. O valor de produção da cotação pode ser usado como referência provisória, mas não substitui o dado de fatura persistido.

## Evidência

Validado por GET nas duas APIs e pela seção Faturas da tela v2; teste automatizado `cotações faturadas na carga seed incluem o valor cobrado` falha para ambas.