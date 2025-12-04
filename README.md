# 💰 Controle de Gastos

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Status](https://img.shields.io/badge/status-active-success.svg)

**Sistema completo de controle financeiro pessoal com banco de dados real**

[Demo ao Vivo](#) • [Documentação](#funcionalidades) • [Instalação](#instalação) • [Suporte](#suporte)

![Screenshot](https://via.placeholder.com/800x400/667eea/ffffff?text=Controle+de+Gastos)

</div>

---

## 📋 Sobre o Projeto

Sistema web profissional para controle e gestão de gastos pessoais, desenvolvido com tecnologias modernas e banco de dados real. Oferece uma experiência completa de gerenciamento financeiro com múltiplas visualizações, análises detalhadas e planejamento de orçamento.

### ✨ Destaques

- 🔐 **Sistema de autenticação** completo e seguro
- 💾 **Banco de dados real** (PostgreSQL via Supabase)
- 📊 **Múltiplos gráficos** e análises visuais
- 📅 **Calendário interativo** para visualização mensal
- 💰 **Gestão de orçamento** com alertas inteligentes
- 🌙 **Dark mode** em todas as telas
- 📱 **Totalmente responsivo** (mobile, tablet, desktop)
- 🔍 **Filtros avançados** e busca em tempo real
- 📤 **Exportação para CSV/Excel**
- 🎨 **Interface moderna** com TailwindCSS

---

## 🚀 Funcionalidades

### 🏠 Dashboard Principal
- Painel de orçamento mensal com barra de progresso
- Formulário rápido de adicionar gastos
- Resumo financeiro (total, mês, hoje)
- Gráficos de categorias e gastos diários
- Calendário mini interativo
- Lista de gastos recentes

### 📝 Gerenciamento de Gastos
- CRUD completo (Criar, Ler, Atualizar, Deletar)
- Busca em tempo real por descrição
- Filtros por categoria e período
- Ordenação múltipla (data, valor, categoria)
- Edição inline com modal
- Paginação inteligente
- Exportação para CSV
- Estatísticas detalhadas

### 📊 Análises e Gráficos
- Gráfico de pizza com percentuais por categoria
- Evolução mensal em linha
- Gastos diários dos últimos 30 dias
- Comparativo semanal
- Top 5 maiores gastos
- Cards de estatísticas avançadas

### 📅 Calendário Expandido
- Visualização mensal completa
- Adicionar gastos clicando no dia
- Dias coloridos por valor de gasto
- Estatísticas do mês selecionado
- Lista detalhada de gastos por dia
- Navegação entre meses

### 💰 Gestão de Orçamento
- Definir orçamento mensal total
- Orçamento sugerido por categoria
- Barras de progresso visuais
- Gráfico de consumo (gasto vs disponível)
- Histórico de orçamentos (12 meses)
- Alertas de limite excedido
- Comparativo mês a mês

---

## 🛠️ Tecnologias Utilizadas

### Frontend
- **HTML5** - Estrutura semântica
- **TailwindCSS** - Estilização moderna e responsiva
- **JavaScript (Vanilla)** - Lógica e interatividade
- **Chart.js** - Gráficos interativos

### Backend/Database
- **Supabase** - Backend as a Service
- **PostgreSQL** - Banco de dados relacional
- **Row Level Security** - Segurança de dados por usuário

### Arquitetura
- **SPA (Single Page Application)** - Experiência fluida
- **Client-side rendering** - Performance otimizada
- **RESTful API** - Comunicação com banco de dados

---

## 📦 Instalação

### Pré-requisitos
- Conta no [Supabase](https://supabase.com) (gratuito)
- Navegador web moderno
- Editor de código (VS Code recomendado)

### Passo 1: Clone o repositório
```bash
git clone https://github.com/seu-usuario/controle-gastos.git
cd controle-gastos
```

### Passo 2: Configure o Supabase

1. Crie uma conta em [supabase.com](https://supabase.com)
2. Crie um novo projeto
3. No SQL Editor, execute o seguinte código:

```sql
-- Criar tabela de usuários
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Criar tabela de gastos
CREATE TABLE expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  category TEXT NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Criar tabela de orçamento
CREATE TABLE budgets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  UNIQUE(user_id, month, year)
);

-- Criar índices para melhor performance
CREATE INDEX idx_expenses_user_id ON expenses(user_id);
CREATE INDEX idx_expenses_date ON expenses(date);
CREATE INDEX idx_budgets_user_id ON budgets(user_id);
```

4. Copie a **URL do projeto** e a **anon key** em Settings > API

### Passo 3: Configure as credenciais

Atualize as credenciais do Supabase em **TODOS** os arquivos `.js`:

```javascript
const SUPABASE_URL = 'SUA_URL_AQUI';
const SUPABASE_KEY = 'SUA_CHAVE_AQUI';
```

Arquivos que precisam ser atualizados:
- `gastos.js`
- `graficos.js`
- `calendario.js`
- `orcamento.js`

### Passo 4: Execute o projeto

#### Opção 1: Live Server (VS Code)
```bash
# Instale a extensão Live Server no VS Code
# Clique com botão direito em index.html
# Selecione "Open with Live Server"
```

#### Opção 2: Python
```bash
python -m http.server 8000
# Acesse: http://localhost:8000
```

#### Opção 3: Node.js
```bash
npx serve
# Acesse o link fornecido
```

---

## 📱 Estrutura do Projeto

```
controle-gastos/
├── index.html          # Login e cadastro
├── prog.html           # Dashboard principal
├── gastos.html         # Gerenciamento de gastos
├── gastos.js           # Lógica dos gastos
├── graficos.html       # Análises e gráficos
├── graficos.js         # Lógica dos gráficos
├── calendario.html     # Calendário expandido
├── calendario.js       # Lógica do calendário
├── orcamento.html      # Gestão de orçamento
├── orcamento.js        # Lógica do orçamento
└── README.md           # Este arquivo
```

---

## 🎯 Como Usar

### 1. Primeiro Acesso
1. Abra `index.html` no navegador
2. Clique em "Cadastre-se"
3. Preencha seus dados
4. Faça login com o email e senha cadastrados

### 2. Adicionar Gastos
1. No Dashboard, preencha o formulário
2. Ou navegue até "Meus Gastos" para adicionar com mais detalhes
3. Ou clique em um dia no Calendário para adicionar rapidamente

### 3. Definir Orçamento
1. Acesse "Orçamento" no menu
2. Digite o valor do seu orçamento mensal
3. Clique em "Definir"
4. Acompanhe o progresso em tempo real

### 4. Visualizar Análises
1. Acesse "Gráficos" para ver análises detalhadas
2. Use "Calendário" para visualização mensal
3. Aplique filtros em "Meus Gastos" para buscas específicas

---

## 🎨 Capturas de Tela

<details>
<summary>🔐 Login e Cadastro</summary>

![Login](https://via.placeholder.com/600x400/667eea/ffffff?text=Tela+de+Login)

</details>

<details>
<summary>🏠 Dashboard</summary>

![Dashboard](https://via.placeholder.com/600x400/667eea/ffffff?text=Dashboard)

</details>

<details>
<summary>📊 Gráficos</summary>

![Graficos](https://via.placeholder.com/600x400/667eea/ffffff?text=Graficos)

</details>

<details>
<summary>📅 Calendário</summary>

![Calendario](https://via.placeholder.com/600x400/667eea/ffffff?text=Calendario)

</details>

---

## 🔐 Segurança

- ✅ Senhas criptografadas com **SHA-256**
- ✅ Isolamento de dados por usuário
- ✅ Validação de campos no frontend e backend
- ✅ Proteção contra SQL Injection (via Supabase)
- ✅ HTTPS obrigatório (via Supabase)
- ✅ Row Level Security no banco de dados

---

## 🌟 Funcionalidades Premium

- [x] Sistema multi-usuário
- [x] CRUD completo de gastos
- [x] 5 tipos de gráficos
- [x] Filtros avançados
- [x] Exportação CSV
- [x] Dark mode persistente
- [x] Responsivo para mobile
- [x] Paginação inteligente
- [x] Histórico de orçamentos
- [ ] Notificações push (em breve)
- [ ] Relatórios PDF (em breve)
- [ ] App mobile (em breve)

---

## 🤝 Contribuindo

Contribuições são sempre bem-vindas! Siga os passos:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

---

## 📝 Roadmap

### Versão 1.1
- [ ] Recuperação de senha por email
- [ ] Autenticação social (Google, Facebook)
- [ ] Gráfico de tendências com IA
- [ ] Categorias customizáveis

### Versão 2.0
- [ ] App mobile (React Native)
- [ ] Integração com Open Banking
- [ ] Notificações de limite de gastos
- [ ] Relatórios em PDF
- [ ] Metas de economia
- [ ] Comparação com meses anteriores

---

## 📄 Licença

Distribuído sob a licença MIT. Veja `LICENSE` para mais informações.

---

## 👤 Autor

**Seu Nome**

- GitHub: [MauricioDev3126](https://github.com/MauricioDev3216)
- LinkedIn: [Mauricio de Campos](https://linkedin.com/in/maurício-de-campos-148005323)
- Email: mauriciodecamposhihi@gmail.com

---

## 🙏 Agradecimentos

- [Supabase](https://supabase.com) - Backend e banco de dados
- [TailwindCSS](https://tailwindcss.com) - Framework CSS
- [Chart.js](https://www.chartjs.org) - Biblioteca de gráficos
- [Heroicons](https://heroicons.com) - Ícones SVG

---

## 📊 Estatísticas do Projeto

- **Linhas de código:** ~5.000+
- **Arquivos:** 10
- **Telas:** 6
- **Funcionalidades:** 50+
- **Gráficos:** 5 tipos
- **Tempo de desenvolvimento:** 40-60h

---

<div align="center">

**⭐ Se este projeto foi útil, considere dar uma estrela!**

Feito com ❤️ por [Seu Nome](https://github.com/seu-usuario)

</div>
