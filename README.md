# SMALL – Sistema de Gerenciamento de Inventário

## Visão Geral
Este repositório contém um sistema completo para gerenciamento de inventário, dividido em duas camadas principais:

- **backend/** – API **FastAPI** que reutiliza as regras de negócio existentes em Python e acessa o banco SQLite.
- **frontend/** – Aplicação **Next.js + TypeScript** que substitui a interface Streamlit original.
- **app.py** – Aplicação Streamlit legada mantida temporariamente como fallback durante a migração.

## Arquitetura Atual

### Backend
- **FastAPI**
- **Pydantic** para validação de dados
- Lógica de domínio reutilizada de `python_app/services.py`
- Banco SQLite em `data/inventory.db`
- Autenticação baseada em cookies, armazenada no mesmo banco compartilhado

### Frontend
- **Next.js** (React) + **TypeScript**
- CSS customizado (sem frameworks UI externos)
- Comunicação com a API via `NEXT_PUBLIC_API_BASE_URL`

## Tecnologias Utilizadas
- **Python 3.12**
- **FastAPI**, **Pydantic**, **uvicorn**
- **Node.js 20**
- **Next.js**, **React**, **TypeScript**
- **SQLite**
- **Streamlit** (legacy)

## Pré‑requisitos
- Python ≥ 3.10
- Node.js ≥ 18
- Git
- (Opcional) virtualenv ou conda para isolar dependências Python

## Instalação

### 1. Clonar o repositório
```bash
git clone https://github.com/renansqsz/SMALL.git
cd SMALL
```

### 2. Instalar dependências Python
```bash
pip install -r requirements.txt
```

### 3. Instalar dependências Node (frontend)
```bash
cd frontend
npm install
```

## Configuração de Variáveis de Ambiente

### Backend
Crie um arquivo `.env` na raiz (ou use `.env.local` se preferir) com as variáveis necessárias. Por padrão, não há variáveis obrigatórias além das que o FastAPI utiliza internamente.

### Frontend
Copie o exemplo e ajuste a URL da API:
```bash
cp .env.local.example .env.local
```
Edite `.env.local`:
```
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000/api/v1
```

## Execução

### Backend
```bash
uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
```
A API ficará disponível em `http://127.0.0.1:8000`.

#### Health check
```bash
curl http://127.0.0.1:8000/health
```

### Frontend
Em outro terminal:
```bash
cd frontend
npm run dev
```
A aplicação será servida em `http://127.0.0.1:3000`.

### Aplicação Legacy (Streamlit) – Opcional
```bash
streamlit run app.py
```
Acesse em `http://localhost:8501`.

## Credenciais de Login Legado
- **Usuário:** `admin`
- **Senha:** `admin`

## Páginas Migradas
- `/login`
- `/dashboard`
- `/equipments`
- `/notebooks`
- `/categories`
- `/employees`

## Contribuição
1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/minha-feature`)
3. Commit suas alterações (`git commit -m "feat: descrição"`)
4. Push (`git push origin feature/minha-feature`)
5. Abra um Pull Request

## Licença
Este projeto está sob licença MIT. Consulte o arquivo `LICENSE` para mais detalhes.
