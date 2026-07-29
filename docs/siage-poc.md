# SIAGE POC com Playwright

Esta prova de conceito foi criada de forma isolada para investigar a leitura manual de dados do SIAGE sem integrar ainda com o módulo principal do Professor Sync e sem gravar nada no Supabase.

## Objetivo

- abrir o SIAGE em navegador visível com Playwright;
- permitir login manual pelo próprio usuário;
- salvar o estado de sessão localmente para reaproveitar testes;
- navegar pelas áreas disponíveis e localizar páginas relacionadas a turmas e disciplinas;
- extrair turmas visíveis e, quando possível, a lista de alunos;
- salvar os resultados apenas em arquivos locais ignorados pelo Git.

## Instalação

1. Instale as dependências do projeto:

```bash
npm install
```

2. Instale o navegador usado pelo Playwright:

```bash
npm run siage:poc:install
```

## Execução

Execute informando a URL inicial do SIAGE.

### PowerShell

```powershell
npm run siage:poc -- --url "https://professor.see.pb.gov.br/auth"
npm run siage:poc -- --url="https://professor.see.pb.gov.br/auth"
npm run siage:poc -- --url=https://professor.see.pb.gov.br/auth
```

### CMD

```bat
npm run siage:poc -- --url "https://professor.see.pb.gov.br/auth"
npm run siage:poc -- --url="https://professor.see.pb.gov.br/auth"
npm run siage:poc -- --url=https://professor.see.pb.gov.br/auth
```

### Bash

```bash
npm run siage:poc -- --url "https://professor.see.pb.gov.br/auth"
npm run siage:poc -- --url="https://professor.see.pb.gov.br/auth"
npm run siage:poc -- --url=https://professor.see.pb.gov.br/auth
```

Também é possível usar a variável de ambiente `SIAGE_POC_URL`.

### Outras opções

Os formatos abaixo são aceitos tanto com `=` quanto com espaço:

- `--fresh-session`
- `--fresh-session=true`
- `--fresh-session true`
- `--max-pages=10`
- `--max-pages 10`
- `--save-html=false`
- `--save-html false`
- `--save-html`

```bash
npm run siage:poc -- --url "https://professor.see.pb.gov.br/auth" --fresh-session
npm run siage:poc -- --url "https://professor.see.pb.gov.br/auth" --max-pages 10
npm run siage:poc -- --url "https://professor.see.pb.gov.br/auth" --save-html false
```

Fluxo esperado:

1. O Playwright abre um navegador visível.
2. O usuário faz login manualmente no SIAGE.
3. Depois do carregamento da área autenticada, o usuário volta ao terminal e pressiona `Enter`.
4. O script salva a sessão local, captura telas, tenta identificar páginas úteis e grava os JSONs locais.

## Arquivos gerados

Os artefatos ficam em `scripts/siage-poc/` e estão protegidos no `.gitignore`.

- `session/siage-session.json`: sessão local do navegador.
- `output/siage-classes.json`: turmas encontradas na inspeção.
- `output/siage-students.json`: alunos encontrados por turma.
- `output/screenshots/`: capturas das páginas relevantes.
- `output/html/`: HTML salvo para análise local, quando `--save-html` não for desativado.

## Logs no terminal

Durante a execução, o script registra:

- opções reconhecidas no início, com origem `cli`, `env` ou `default`;
- página atual;
- título da página;
- menus encontrados;
- links encontrados;
- quantidade de turmas por página;
- quantidade de alunos por turma;
- erros de navegação;
- chamadas de rede potencialmente relevantes para turmas e disciplinas.

As URLs registradas passam por sanitização básica para evitar exibir parâmetros sensíveis comuns, mas isso não substitui revisão manual antes de compartilhar qualquer saída.

## Cuidados com dados pessoais

- Não armazene usuário ou senha no código.
- Não versione o arquivo de sessão do Playwright.
- Não envie para o Git os JSONs de alunos, capturas de tela ou HTML com dados pessoais.
- Revise manualmente qualquer artefato antes de compartilhar fora do ambiente local.
- Não tente contornar CAPTCHA, autenticação adicional ou bloqueios do SIAGE.

## Limitações atuais

- A detecção de login autenticado é heurística e pode precisar de ajuste conforme a instalação real do SIAGE.
- A descoberta de turmas e alunos depende da estrutura HTML disponível após o login.
- O script não interage com frequência, notas, lançamento de aulas ou escrita de dados.
- O mapeamento de menus e páginas ainda é exploratório e pode exigir inspeção manual complementar.
- Se o SIAGE usar iframes, modais complexos ou paginação interna, pode ser necessário adaptar a navegação.
