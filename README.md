# 🛡️ EhFraude — Detector e Treinador de Golpes Digitais

![Python](https://img.shields.io/badge/Python-3.12-blue)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![Groq](https://img.shields.io/badge/Groq-AI-orange)
![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?logo=supabase)
![Status](https://img.shields.io/badge/status-em%20desenvolvimento-yellow)

---

## Sobre o projeto

O **EhFraude** é uma solução desenvolvida para auxiliar usuários na identificação e prevenção de golpes digitais utilizando Inteligência Artificial. O projeto combina um analisador de mensagens suspeitas com um modo de treinamento gamificado, promovendo educação em segurança digital de forma interativa.

O objetivo é reduzir o impacto de fraudes como phishing, golpes via Pix, falsas centrais bancárias, mensagens fraudulentas em redes sociais, SMS, e-mails maliciosos e outros ataques de engenharia social.

---

## Funcionalidades

### 🔍 Detector de Fraudes

- Análise de mensagens utilizando modelos de IA
- Classificação em **GOLPE**, **SUSPEITO** ou **SEGURO**
- Cálculo da probabilidade de fraude com critério matemático acumulativo
- Explicação dos principais indícios encontrados
- Recomendação de ações seguras ao usuário
- Sistema de fallback entre diferentes modelos de IA para maior disponibilidade

### 🎮 Modo Treino (Gamificado)

- Geração automática de desafios inéditos utilizando IA
- Questões de múltipla escolha com apenas uma resposta correta
- Explicações educativas após cada resposta
- Sistema de XP e progressão de níveis
- Ajuste automático de dificuldade conforme o desempenho do jogador
- Evita repetição de categorias e temas recentes
- Bonificação por velocidade de resposta
- Validação automática das respostas geradas pela IA

---

## Tecnologias utilizadas

### Back-end
| Tecnologia | Descrição |
|---|---|
| Python 3.12 | Linguagem principal |
| Groq API | Acesso aos modelos de IA |
| Llama 3.3 70B | Modelo principal de IA |
| Qwen 3 32B | Modelo de fallback primário |
| Qwen 3.6 27B | Modelo de fallback secundário |
| python-dotenv | Gerenciamento de variáveis de ambiente |

### Front-end
| Tecnologia | Descrição |
|---|---|
| React 18 | Interface do usuário |

### Banco de dados
| Tecnologia | Descrição |
|---|---|
| Supabase | Banco de dados e autenticação |

---

## Estrutura do projeto

```text
EhFraude/
├── Back-end/
│   ├── detector.py          # Detector de golpes
│   ├── modo_treino.py       # Modo gamificado
│   └── .env                 # Chaves de API (não commitado)
├── Front-end/
│   └── ...                  # Interface React
├── .gitignore
├── requirements.txt
└── README.md
```

---

## Configuração

Clone o repositório:

```bash
git clone https://github.com/seu-usuario/EhFraude.git
cd EhFraude
```

Instale as dependências Python:

```bash
pip install -r requirements.txt
```

Configure sua chave da API da Groq no arquivo `.env`:

```env
IA_EhFraude=SUA_CHAVE_GROQ
```

Execute o detector:

```bash
python Back-end/detector.py
```

Execute o modo treino:

```bash
python Back-end/modo_treino.py
```

---

## Objetivos

- Promover conscientização sobre golpes digitais
- Auxiliar usuários na identificação de fraudes em tempo real
- Utilizar Inteligência Artificial como ferramenta de apoio à educação em segurança cibernética
- Demonstrar a aplicação prática de IA em sistemas de apoio à decisão

---

## Autores

| Nome | GitHub |
|---|---|
| Caio Figueiredo Santos | [@Caio](https://github.com/Caioon9) |
| Erick da Rocha Soares | [@Erick](https://github.com/Erickhitman) |
| Nicolas Geovane Baptista de Jesus | [@Nicolas](https://github.com/NicolasJesus67) |
