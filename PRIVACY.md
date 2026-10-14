# Política de Privacidade — Professor Sync (Assistente SIAGE)

**Última atualização:** Outubro de 2026

O **Professor Sync** é uma extensão de navegador desenvolvida para auxiliar professores da Rede Estadual de Educação da Paraíba na gestão e preenchimento ágil do diário de classe no sistema oficial SIAGE (`professor.see.pb.gov.br`).

A sua privacidade e a segurança dos seus dados pedagógicos são nossas prioridades fundamentais.

---

### 1. Coleta e Armazenamento de Dados
* **Armazenamento 100% Local:** O Professor Sync opera de forma estritamente descentralizada. Todos os dados manipulados (planilhas de aulas importadas, contagens de presenças, preferências de horários e senhas opcionais) são armazenados **exclusivamente na memória local do seu navegador** através da API nativa `chrome.storage.local`.
* **Nenhum Servidor Externo:** A extensão **NÃO** possui servidores externos próprios para coleta de dados. Nenhuma informação pedagógica, lista de chamada de alunos ou notas é enviada, vendida ou transferida para terceiros.

---

### 2. Uso das Permissões do Navegador
As permissões solicitadas pela extensão têm propósitos exclusivamente operacionais:
* **`storage`:** Permite salvar localmente no navegador do professor o plano de aulas importado via planilha Excel (.xlsx) e suas configurações personalizadas.
* **`activeTab`:** Permite que a extensão se comunique com a aba ativa do navegador para identificar a turma atual e preencher os registros quando acionada pelo professor.
* **Acesso aos Hosts (`professor.see.pb.gov.br` e `api.esaber-professor.see.pb.gov.br`):** Permite ler as informações da turma selecionada e salvar os registros diretamente no sistema oficial da Secretaria de Educação da Paraíba.

---

### 3. Compartilhamento e Venda de Dados
* O Professor Sync **NÃO vende, não aluga e não compartilha** nenhum dado de usuário com anunciantes, parceiros comerciais ou empresas de análise de dados.
* A extensão está em total conformidade com a Política do Programa de Desenvolvedores da Chrome Web Store e com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).

---

### 4. Segurança
Toda a comunicação com o sistema SIAGE ocorre exclusivamente através de conexões seguras criptografadas (HTTPS/TLS) diretamente entre o navegador do professor e os servidores oficiais do Governo do Estado da Paraíba.

---

### 5. Contato
Para esclarecimento de dúvidas ou sugestões sobre esta Política de Privacidade, entre em contato através da página de desenvolvedor no GitHub:
[https://github.com/Thalyson1/professor-sync](https://github.com/Thalyson1/professor-sync)
