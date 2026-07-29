# SIAGE POC com Playwright

Esta prova de conceito foi criada de forma isolada para investigar a leitura de dados do SIAGE sem integrar ainda com o módulo principal do Professor Sync e sem gravar nada no Supabase.

## Etapas disponíveis

### 1. Captura exploratória com navegador visível

Objetivos:

- abrir o SIAGE com Playwright em modo visível;
- permitir login manual;
- salvar a sessão local;
- observar páginas autenticadas, turmas e alunos;
- capturar requisições `fetch` e `xhr` disparadas manualmente;
- salvar resumo de rede e respostas JSON sanitizadas.

Comandos:

```bash
npm run siage:poc:install
npm run siage:poc -- --url "https://professor.see.pb.gov.br/auth"
```

Formatos aceitos para `--url`:

```bash
--url "https://professor.see.pb.gov.br/auth"
--url="https://professor.see.pb.gov.br/auth"
--url=https://professor.see.pb.gov.br/auth
```

Outras opções aceitas:

```bash
--fresh-session
--fresh-session=true
--fresh-session true
--max-pages=10
--max-pages 10
--save-html=false
--save-html false
```

Fluxo:

1. O navegador é aberto pelo Playwright.
2. O usuário faz login manualmente.
3. O script salva a sessão em `scripts/siage-poc/session/siage-session.json`.
4. O terminal pede `Enter` para iniciar a captura.
5. O usuário navega manualmente no SIAGE.
6. O terminal pede `Enter` novamente para encerrar e salvar o resumo.

Arquivos gerados:

- `scripts/siage-poc/output/network-summary.json`
- `scripts/siage-poc/output/network/`
- `scripts/siage-poc/output/screenshots/`
- `scripts/siage-poc/output/html/`

### 2. Leitura estruturada com sessão autenticada

Objetivos:

- reutilizar a sessão salva pelo Playwright;
- chamar apenas endpoints `GET` já usados pelo frontend do SIAGE;
- descobrir dinamicamente, sempre que possível, os IDs necessários;
- buscar dados profissionais, matrículas, turmas, componentes e alunos;
- tratar paginação;
- gerar saídas brutas sanitizadas e um preview normalizado.

Comando:

```bash
npm run siage:read -- --url "https://professor.see.pb.gov.br/auth"
```

Observações:

- `--url` é opcional quando a origem consegue ser inferida do `siage-session.json`.
- O script usa a sessão autenticada existente em `scripts/siage-poc/session/siage-session.json`.
- Não há `POST`, `PUT`, `PATCH` ou `DELETE`.
- Não há integração com Supabase.

Fluxo:

1. O script abre um contexto autenticado com o `storageState` salvo.
2. Acessa a listagem de turmas para descobrir automaticamente a base da API e parâmetros iniciais.
3. Lê:
   - `/api/profissional/minhas-matriculas`
   - `/api/profissional`
   - `/api/formacao-turma-aluno/curriculo-professor/turmas`
   - `/api/formacao-turma-aluno/professor/turmas/{turmaId}/alunos`
   - opcionalmente `/api/DiarioClasseFrequencia/get-cabecario-listagem`
4. Salva respostas brutas sanitizadas e gera um preview normalizado.

Arquivos gerados:

- `scripts/siage-poc/output/raw/`
- `scripts/siage-poc/output/normalized/siage-sync-preview.json`

## Estrutura de saída

O preview normalizado segue esta base:

```json
{
  "metadata": {
    "generatedAt": "",
    "source": "siage",
    "academicYearId": "",
    "professionalEnrollmentId": ""
  },
  "professional": {},
  "schools": [],
  "classes": [],
  "subjects": [],
  "students": [],
  "enrollments": []
}
```

## Cuidados com dados pessoais

- Não armazene usuário ou senha no código.
- Não versione o arquivo de sessão do Playwright.
- Não envie ao Git respostas JSON com dados reais.
- Não compartilhe screenshots, HTML ou previews sem revisão humana.
- As saídas do POC ficam sob `scripts/siage-poc/output/` e `scripts/siage-poc/session/`, ambos ignorados pelo Git.

## Limitações atuais

- A descoberta de IDs depende dos endpoints observados na sessão autenticada atual.
- A paginação é tratada com base nos metadados retornados pela API, quando disponíveis.
- A classificação e a normalização ainda são heurísticas e podem precisar de ajuste após novas inspeções.
- O POC não escreve frequência, notas, avaliações ou registros de aula.
