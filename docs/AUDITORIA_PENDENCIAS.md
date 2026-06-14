# Auditoria de Pendencias do Lucro do Leite

Data: 2026-06-14

## Corrigido nesta etapa

- Shell visual reconstruido com sidebar fixa no desktop e barra inferior no mobile.
- Header reorganizado em dois grupos: filtros operacionais a esquerda e status/conta a direita.
- Botao `Aplicar` mantido ao lado do seletor de mes.
- Logout agrupado no canto direito, junto de avatar, notificacoes e status do banco.
- Faixa rural do topo reduzida para apoio visual, sem competir com os controles.
- Painel ajustado para grade deterministica de KPIs, evitando card isolado.
- Acoes rapidas alinhadas abaixo dos KPIs.
- Indicadores, grafico e comparativo de racoes reorganizados em paineis alinhados.
- Telas de cadastro exibem faixa explicita de modo `Editando`, resumo do registro e acao `Cancelar edicao`.
- Botoes `Editar` e `Excluir` padronizados nas listas.
- Barra inferior mobile reorganizada com atalhos principais e menu `Mais`.
- Tela de despesas com filtros por categoria, fornecedor, marca de racao e faixa de valor.

## Pendencias funcionais para backlog

- Filtros avancados de despesas: falta adicionar periodo livre fora do ciclo atual e persistencia desses filtros nas exportacoes.
- Vinculo de producao com teste de racao: hoje o teste calcula medias informadas; falta opcao de associar producoes reais diretamente ao teste.
- Permissoes por papel: `owner`, administrador e operador ainda precisam de telas de convite, troca de papel e remocao de membros.
- Relatorios avancados: anual, comparativo entre periodos, backup completo e anexos da fazenda.
- Reabertura formal de fechamento: falta fluxo separado para reabrir competencia fechada, com motivo e historico.
- Modos avancados de teste de racao: antes/depois automatico, marca contra marca, lote contra lote e periodo de adaptacao.
- Auditoria de alteracoes: falta trilha visivel de quem criou, editou, recalculou ou excluiu registros criticos.

## Criterio para proximas fases

- Cada pendencia deve entrar como uma etapa isolada, com migracao, API, testes e validacao visual propria.
- Funcionalidades que alterem calculos financeiros devem ter teste unitario antes de mudanca de UI.
- Recursos mobile devem manter compatibilidade com a API `/api/v1`, sem depender de cookie de sessao web.
