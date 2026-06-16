# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
e este projeto segue [Versionamento Semântico](https://semver.org/pt-BR/).

## [Unreleased]

### Alterado
- Repo convertido para a app independente **Orenji Focus**.
- Métodos de foco passaram a ser guardados localmente no Focus.
- Tarefas do Focus deixaram de usar storage partilhado.

### Removido
- Interligação direta com o **Orenji Habit**.
- Dependência ativa do módulo **Orenji Shared** nas páginas do Focus.

## [1.0.0] - 2026-06-14

### Adicionado
- Aplicação **Orenji Focus** com dashboard, timer e sessões concluídas.
- Métodos de foco com suporte a Pomodoro e ritmos personalizados.
- Páginas de índice, tarefas e configurações.
- Logos e assets visuais.
- Estilos responsivos com CSS customizado.
- Scripts JavaScript para funcionalidades interativas.

### Melhorado
- Estrutura de headers com branding consistente.
- Implementação de UI para seleção de métodos de foco.
- Paths atualizados para estilos partilhados.

### Corrigido
- Comportamento responsivo de elementos header.

---

## Como Contribuir

Ao fazer alterações, atualize este changelog:
- Use o formato já estabelecido.
- Agrupe mudanças por tipo: `Adicionado`, `Alterado`, `Corrigido`, `Removido`.
- Sempre mantenha a data ISO (YYYY-MM-DD).

## Versionamento

Este projeto segue **Versionamento Semântico**:
- **MAJOR**: mudanças incompatíveis com versões anteriores.
- **MINOR**: novas funcionalidades compatíveis.
- **PATCH**: correções de bugs.
