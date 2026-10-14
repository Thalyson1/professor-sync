import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'Professor Sync — Assistente SIAGE',
    version: '1.0.0',
    description: 'Central de planejamento, registro de aulas, frequência rápida e assistente de IA para professores do SIAGE PB.',
    permissions: ['storage', 'activeTab'],
    host_permissions: [
      'https://professor.see.pb.gov.br/*',
      'https://api.esaber-professor.see.pb.gov.br/*',
    ],
    action: {
      default_title: 'Abrir Professor Sync',
    },
  },
});

