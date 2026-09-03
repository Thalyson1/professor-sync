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

---

# Atualização de Escopo — Sprint de Planejamento Semestral

Estado atual validado em 6 de agosto de 2026:

- sincronização de leitura do SIAGE concluída;
- dados reais persistidos no Supabase;
- 7 turmas escolares reais;
- 13 atribuições professor + turma + disciplina;
- 6 disciplinas reais;
- módulo de Turmas consumindo dados reais.

Escopo implementado nesta sprint:

- listagem de atribuições reais em `/planejamento`;
- criação de planejamento semestral em rascunho vinculado a `teacher_assignments`;
- editor de planejamento em `/planejamento/[planoId]`;
- criação e edição de unidades;
- criação e edição de aulas planejadas;
- ordenação manual de unidades e aulas por posição;
- suporte às bases `technical` e `bncc`;
- metodologias compatíveis com o SIAGE.

Fora de escopo nesta sprint:

- geração por IA;
- importação de PDF ou Word;
- envio ao SIAGE;
- calendário automático;
- frequência;
- avaliações.

---

# Atualização de Escopo — IA Assistida no Planejamento

Estado atual validado em 11 de agosto de 2026:

- planejamento semestral já utiliza atribuições reais do SIAGE importadas para o Supabase;
- criação e edição manual de planejamento já estão disponíveis;
- a IA foi adicionada apenas como apoio para gerar rascunhos revisáveis.

Escopo implementado nesta sprint:

- botão `Gerar com IA` no fluxo de criação e edição de planejamento;
- rotas `/planejamento/novo/ia` e `/planejamento/[planoId]/ia`;
- geração server-side de rascunho estruturado em JSON;
- preview editável antes de salvar;
- confirmação explícita do professor antes de persistir no banco;
- uso apenas de metodologias compatíveis com o SIAGE;
- camada isolada para provider, prompt, schema, parser e validação;
- provider atual baseado em OpenAI com possibilidade futura de troca.

Regras desta fase:

- a IA gera somente um rascunho para revisão;
- nada é salvo automaticamente no banco;
- nada é enviado ao SIAGE;
- nenhuma informação pessoal desnecessária de estudantes ou do professor é enviada ao provedor de IA;
- no modo BNCC, a IA não deve inventar códigos ou habilidades não fornecidos.

Fora de escopo nesta sprint:

- escrita no SIAGE;
- frequência;
- avaliações;
- geração de provas;
- importação de PDF ou Word;
- embeddings;
- RAG.

---

# Atualização de Escopo — Cronograma e Execução Inicial

Estado atual validado em 11 de agosto de 2026:

- o planejamento semestral já possui planos, unidades e aulas persistidos no Supabase;
- a geração assistida por IA já funciona como rascunho revisável;
- o cronograma agora passa a organizar as aulas em sequência temporal utilizável pelo professor.

Escopo implementado nesta sprint:

- rota `/planejamento/[planoId]/cronograma`;
- rota `/planejamento/hoje`;
- listagem cronológica das aulas por data prevista, posição e número;
- filtros por status, unidade e intervalo de datas;
- edição da data prevista;
- distribuição automática de aulas por dias da semana e quantidade de tempos por encontro;
- ações de marcar como realizada, adiar e cancelar;
- preservação da diferença entre planejado e realizado;
- preparação da estrutura para futuro registro de aula e envio ao SIAGE.

Regras desta fase:

- aulas concluídas não são redistribuídas automaticamente;
- datas existentes só são sobrescritas com confirmação explícita;
- o professor pode registrar que seguiu o planejamento ou que executou conteúdo diferente;
- o conteúdo realizado não substitui automaticamente o planejamento original;
- ainda não existe escrita no SIAGE.

Fora de escopo nesta sprint:

- frequência;
- avaliações;
- calendário visual complexo;
- envio do registro de aula ao SIAGE;
- automação de frequência;
- automação de notas.
