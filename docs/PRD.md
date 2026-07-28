# 

# PROFESSOR SYNC

## Product Requirements Document (PRD) v1.0

**Versão:** 1.0

**Status:** Planejamento

**Autor:** Thalyson Rian Mendes da Silva

---

# 📌 Visão do Produto

O Professor Sync é uma plataforma web desenvolvida para professores da Rede Estadual da Paraíba que utilizam o SIAGE.

Seu objetivo é centralizar todo o fluxo de trabalho do professor, desde o planejamento das aulas até o envio das informações para o SIAGE, reduzindo drasticamente o tempo gasto com tarefas repetitivas.

O SIAGE deixa de ser o ambiente principal de trabalho e passa a ser apenas o sistema oficial para sincronização das informações.

---

# 🎯 Problema

Hoje o professor precisa:

- Criar Plano de Ensino
- Criar Plano de Aula
- Organizar Cronograma
- Registrar Aula
- Registrar Frequência
- Registrar Avaliações
- Preencher SIAGE manualmente

Além disso:

- O SIAGE pode atrasar a liberação das disciplinas.
- O professor frequentemente registra várias aulas acumuladas.
- Boa parte das informações são repetitivas.
- Não existe histórico organizado dos planejamentos.
- Não existe auxílio inteligente durante o semestre.

---

# 💡 Solução

Criar uma plataforma onde o professor trabalha diariamente.

Todo o planejamento é realizado dentro do Professor Sync.

Quando desejar, basta sincronizar com o SIAGE.

---

# 👤 Público-alvo

MVP

- Professores da Rede Estadual da Paraíba
- Usuários do SIAGE
- Ensino Médio Integral
- Ensino Técnico Integrado

Versões futuras

- Escolas privadas
- IFs
- EJA
- Outras redes estaduais

---

# 🎯 Objetivos

## Objetivo Principal

Reduzir o tempo gasto pelo professor em tarefas burocráticas.

---

## Objetivos Secundários

- Organizar planejamentos
- Acompanhar cronogramas
- Automatizar registros
- Gerar conteúdo utilizando IA
- Integrar com SIAGE
- Criar histórico permanente do professor

---

# 🏗 Arquitetura

Frontend

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- shadcn/ui

Backend

- Supabase

Banco

- PostgreSQL (Supabase)

IA

- OpenAI
- Gemini (futuro)

Automação

- Playwright

Hospedagem

- Vercel

---

# 📚 Módulos

## Dashboard

Responsável por mostrar:

- Próximas aulas
- Pendências
- Turmas
- Cronograma
- Frequências pendentes
- Avaliações pendentes

---

## Planejamento

Permite criar:

Plano Anual

Plano Semestral

Plano de Ensino

Plano de Aula

Cronograma

---

## IA

Responsável por gerar:

Plano de Ensino

Plano de Aula

Objetivos

Objetos de Conhecimento

Observações

Avaliações

Recuperações

---

## Execução

Mostra ao professor:

Hoje estava previsto:

✔ Aula

✔ Conteúdo

✔ Objetivos

Permite:

Confirmar

Editar

Adiar

Cancelar

---

## Registro de Aula

Gerar automaticamente:

Objetos de Conhecimento

Observações

Selecionar metodologia

Enviar ao SIAGE

---

## Frequência

Marcar apenas faltosos.

Enviar ao SIAGE.

---

## Avaliações

Cadastrar avaliações.

Gerar avaliações utilizando IA.

Lançar notas.

Enviar ao SIAGE.

---

## Relatórios

Carga horária cumprida.

Conteúdos ministrados.

Pendências.

Cronograma.

---

## Sincronização

Importar:

Turmas

Disciplinas

Calendário

Plano de Ensino

Enviar:

Registro de Aula

Frequência

Avaliações

---

# 🤖 Inteligência Artificial

A IA deve auxiliar o professor durante todo o semestre.

Ela deve:

Gerar planejamentos.

Gerar aulas.

Gerar avaliações.

Gerar observações.

Sugerir metodologias.

Acompanhar cronograma.

Reorganizar planejamento quando houver alterações.

---

# 📅 Fluxo do Professor

Login

↓

Sincronizar SIAGE

↓

Planejamento

↓

Cronograma

↓

Executar Aula

↓

Registrar Aula

↓

Registrar Frequência

↓

Registrar Avaliação

↓

Sincronizar SIAGE

---

# 🗄 Banco de Dados

## users

Professor

---

## schools

Escolas

---

## semesters

Semestres

---

## classes

Turmas

---

## subjects

Disciplinas

---

## lesson_plans

Planejamento

---

## lessons

Aulas

---

## attendances

Frequências

---

## assessments

Avaliações

---

## sync_logs

Histórico de sincronização

---

# 🎨 Design

Objetivo

Interface moderna.

Inspirada em:

- Notion
- Linear
- Vercel
- Framer

Características

Modo Claro

Modo Escuro

Componentes reutilizáveis

Interface limpa

Responsiva

---

# 🚀 MVP

## Sprint 1

Projeto

Login

Dashboard

Sidebar

Tema

---

## Sprint 2

Planejamento

Cronograma

Calendário

---

## Sprint 3

Registro de Aula

IA

---

## Sprint 4

Frequência

---

## Sprint 5

Avaliações

---

## Sprint 6

Integração SIAGE

---

# 📌 Roadmap

## v1

Planejamento

Registro

Frequência

IA

SIAGE

---

## v2

Banco de Questões

Gerador de Provas

Relatórios

Importação de documentos

---

## v3

Comunidade

Compartilhamento de planejamentos

Marketplace

Aplicativo Mobile

Google Classroom

Moodle

---

# 📖 Regras de Negócio

- O professor normalmente pertence a uma única escola estadual.
- O sistema deve suportar múltiplas matrículas futuramente, mas isso não é prioridade do MVP.
- As disciplinas mudam a cada semestre e devem ser sincronizadas com o SIAGE.
- O professor pode criar planejamentos mesmo que o SIAGE ainda não tenha liberado as disciplinas.
- O planejamento é o centro do sistema.
- O registro de aula é derivado do planejamento.
- A frequência deve priorizar o registro apenas dos alunos faltosos.
- Toda sincronização com o SIAGE deve gerar um log para auditoria.
- O sistema nunca deve impedir o trabalho do professor caso o SIAGE esteja indisponível.

---

# 🎯 Visão de Longo Prazo

O Professor Sync não será apenas uma ferramenta para preencher o SIAGE.

Será o ambiente completo de trabalho do professor da Rede Estadual da Paraíba.

Todo o planejamento, organização pedagógica, execução das aulas e registros administrativos serão realizados na plataforma, utilizando Inteligência Artificial para reduzir tarefas repetitivas e melhorar a produtividade docente.

O SIAGE será apenas o sistema oficial onde as informações serão sincronizadas.