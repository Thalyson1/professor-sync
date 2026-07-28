# Professor Sync

Professor Sync é uma plataforma web pensada para professores da Rede Estadual da Paraíba que utilizam o SIAGE. O objetivo do produto é centralizar planejamento, execução e registros acadêmicos em um ambiente de trabalho mais organizado, deixando o SIAGE como camada oficial de sincronização.

Nesta etapa, o projeto contém apenas a fundação técnica inicial da aplicação frontend.

## Tecnologias utilizadas

- Next.js 16 com App Router
- React 19
- TypeScript
- Tailwind CSS 4
- ESLint 9

## Como instalar e executar

1. Instale as dependências:

```bash
npm install
```

2. Inicie o ambiente de desenvolvimento:

```bash
npm run dev
```

3. Execute o lint:

```bash
npm run lint
```

4. Gere a build de produção:

```bash
npm run build
```

## Scripts disponíveis

- `npm run dev`: inicia o servidor local
- `npm run build`: gera a build de produção
- `npm run start`: inicia a aplicação já compilada
- `npm run lint`: executa o ESLint

## Estrutura inicial

```text
src/
├── app/
├── components/
│   ├── layout/
│   └── ui/
├── features/
├── hooks/
├── lib/
├── services/
└── types/
```

## Arquivos principais

- `src/app/layout.tsx`: layout raiz da aplicação
- `src/app/page.tsx`: página inicial provisória
- `src/app/globals.css`: estilos globais com Tailwind CSS
- `eslint.config.mjs`: configuração do ESLint para Next.js 16
- `postcss.config.mjs`: integração do Tailwind com PostCSS
- `tsconfig.json`: configuração TypeScript com alias `@/*`
- `.env.example`: exemplo de variáveis de ambiente

## Status atual

- Base do Next.js criada
- Estrutura inicial de pastas preparada para crescimento
- Página inicial provisória implementada
- Sem autenticação, banco de dados, IA ou integrações externas nesta fase

## Referência de produto

A visão geral do produto está documentada em [docs/PRD.md](C:/Users/Thalyson%20Rian/Documents/GitHub/professor-sync/docs/PRD.md).
