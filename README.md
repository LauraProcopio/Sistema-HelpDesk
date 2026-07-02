# Agaemetec Intelligence — Central de HelpDesk & Faturamento v2.0

O **Agaemetec HelpDesk** é um ecossistema corporativo completo para gerenciamento de chamados técnicos, métricas operacionais e controle analítico de faturamento. 

Esta aplicação representa uma **evolução arquitetural completa** do primeiro projeto de helpdesk que construí em Python com Django. O sistema foi totalmente reestruturado do zero com uma arquitetura desacoplada em **React (TypeScript)** e **Node.js (Express)**, utilizando uma nova modelagem de banco de dados no **PostgreSQL** e uma interface visual minimalista totalmente remodelada.

---

## O Que De Fato Foi Desenvolvido e Implementado

### 1. Engenharia de Dados & Segurança (Multitenancy)
* **Isolamento de Dados Estrito:** Implementação de segurança a nível de banco de dados através da tabela intermediária `user_companies`. 
* **Filtro Dinâmico de Unidades (Front e Back):** Correção de vazamento de dados onde utilizadores com o perfil **Client** agora só visualizam na barra lateral esquerda e na listagem principal as empresas e os chamados aos quais estão explicitamente vinculados no PostgreSQL, impedindo o acesso a unidades órfãs.
* **Integridade Referencial Absoluta:** Modelagem de chaves estrangeiras com regras rígidas de integridade referencial (`ON DELETE CASCADE` e `ON DELETE SET NULL`) para garantir a estabilidade do histórico de mensagens e ações dos chamados.

### 2. Autenticação & Roteamento Dinâmico (Front + Back)
* **Fluxo de Login Criptografado:** Autenticação robusta no back-end utilizando `bcrypt` para comparação de hashes de senha e geração de tokens **JWT** com tempo de expiração de 1 dia.
* **Normalização de Perfis (Roles):** Tratamento e blindagem na `LoginPage` para ler, normalizar (`toLowerCase()`) e validar as permissões de acesso (`Admin` ou `Client`), resolvendo travamentos na tela de login.
* **Mapeamento de Rotas Protegidas:** Configuração do React Router no front-end separando os caminhos administrativos (`/admin/*`) das rotas de cliente (`/client/*`), garantindo que o roteador direcione cada perfil para a sua respectiva área de chamados de forma transparente.

### 3. Funcionalidades Operacionais & Finanças
* **Cálculo Analítico de Faturamento:** Módulo financeiro integrado na barra lateral do chamado, permitindo calcular o valor do atendimento em tempo real baseado na multiplicação de `horas estimadas` × `valor por hora`, com suporte nativo a marcações de cortesia (`no_cost`).
* **Chat Técnico Estruturado:** Sistema de comunicação bidirecional com renderização espelhada condicional (direita/esquerda) baseada na autoria da mensagem (Você vs. Outro usuário).
* **Robustez no Envio de Notificações:** Integração de serviços de e-mail via `Nodemailer`. O fluxo de atualização de status foi blindado com blocos `try/catch` isolados para garantir que erros de SMTP (como caixas de e-mail inexistentes com erro `550 No Such User Here`) não quebrem a requisição principal do usuário nem causem instabilidade no banco de dados.

---

## Tecnologias e Ecossistema Técnico

* **Front-end:** React.js, TypeScript, Tailwind CSS, Lucide React (Ícones de interface), Sonner (Notificações Toast ricas e em tempo real).
* **Back-end:** Node.js, Express, TypeScript, JWT (Controle de sessões), Bcrypt (Segurança de credenciais), Nodemailer (Mensageria/SMTP).
* **Banco de Dados:** PostgreSQL (Pool centralizado com `pg-pool`, chaves estrangeiras estruturadas e constraints de validação).

---

## Instalação e Execução Local

### 1. Inicializando as tabelas do Banco de Dados (PostgreSQL)
Acesse a ferramenta de query do seu gerenciador (DBeaver / pgAdmin) e execute a estrutura de mensagens que desenvolvemos para o chat:
```sql
CREATE TABLE IF NOT EXISTS ticket_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
    body TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
