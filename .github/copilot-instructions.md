# 🤖 Copilot Instructions — Padrão de Projetos AWS com Terraform

> **Este documento é vivo.** Ele evolui conforme o projeto cresce. O agente deve consultá-lo sempre
> que receber uma solicitação e propor atualizações quando novos padrões forem estabelecidos.

---

## 📌 Visão Geral

Eu trabalho com projetos que usam **infraestrutura AWS gerenciada por Terraform**, com **ambientes separados (dev/prod)** e **repositórios independentes por recurso AWS**. Todos os repos são reunidos em um único **VS Code Workspace** para facilitar o desenvolvimento.

### Filosofia Central

1. **1 recurso AWS = 1 repositório Terraform** (isolamento total)
2. **dev e prod sempre separados** com `terraform.tfvars` próprios
3. **Deploy e Destroy devem funcionar perfeitamente** — sem lixo na AWS
4. **State remoto no S3** com lock no DynamoDB para segurança
5. **Frontend separado** com deploy na Vercel (ou similar)
6. **Tudo deve ser destruível** — `terraform destroy` precisa limpar 100% dos recursos

---

## 🏗️ Arquitetura do Workspace

```
📁 C:\GIT\PagueBem\                            ← Frontend + workspace config
📁 C:\GIT\PagueBem-terraform\                   ← Todos os repos Terraform
    ├── 📁 dynamodb\                            ← Tabelas DynamoDB
    ├── 📁 lambda\                              ← Lambda Functions + ECR + código fonte
    └── 📁 apigateway\                          ← API Gateway HTTP
```

### Workspace File (.code-workspace)

O arquivo `.code-workspace` fica no repositório do **frontend** e referencia todos os repos:

```json
{
  "folders": [
    { "path": "." },
    { "path": "../PagueBem-terraform/apigateway" },
    { "path": "../PagueBem-terraform/dynamodb" },
    { "path": "../PagueBem-terraform/lambda" }
  ]
}
```

---

## 📐 Estrutura Padrão de Cada Repositório Terraform

Todo repositório de recurso AWS **DEVE** seguir esta estrutura:

```
{recurso}/
├── main.tf                     ← Recursos Terraform
├── variables.tf                ← Variáveis com validação
├── outputs.tf                  ← Outputs para outros módulos consumirem
├── README.md                   ← Documentação com deploy, destroy e dependências
├── .gitignore                  ← Ignorar .terraform/, *.tfstate, *.tfplan, etc.
├── dev/
│   ├── terraform.tfvars        ← Valores reais de dev (⚠️ NÃO versionar)
│   └── terraform.tfvars.example ← Template de exemplo (versionado)
├── prod/
│   ├── terraform.tfvars        ← Valores reais de prod (⚠️ NÃO versionar)
│   └── terraform.tfvars.example ← Template de exemplo (versionado)
```

### Lambda (especial — inclui código-fonte + ECR):

```
lambda/
├── main.tf
├── variables.tf
├── outputs.tf
├── README.md
├── dev/ e prod/                ← tfvars
└── lambda/                     ← Código-fonte da aplicação
    ├── main.py                 ← Handler principal
    ├── Dockerfile              ← Build da imagem Docker
    ├── requirements.txt        ← Dependências Python
    ├── controller/             ← Controllers (routing/parsing)
    ├── services/               ← Lógica de negócio
    ├── repository/             ← Acesso a dados (DynamoDB)
    ├── models/                 ← Modelos de domínio
    ├── dtos/                   ← Validação com Pydantic
    └── utils/                  ← Helpers (response builder, etc.)
```

---

## 🔧 Padrão do main.tf

Todo `main.tf` **DEVE** conter:

```hcl
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket         = "paguebem-terraform-state"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-locks"
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Environment = var.environment
      Project     = var.project_name
      ManagedBy   = "Terraform"
      Repository  = "PagueBem-terraform-{recurso}"
    }
  }
}
```

### Regras obrigatórias:

- **Backend S3**: Bucket `paguebem-terraform-state` com DynamoDB `terraform-locks`
- **State separado por ambiente**: key segue padrão `{recurso}/{env}/terraform.tfstate`
- **Default Tags**: SEMPRE incluir `Environment`, `Project`, `ManagedBy`, `Repository`
- **Nomes de recursos**: padrão `paguebem-{descritivo}-{environment}`

---

## 🔧 Padrão do variables.tf

Toda `variables.tf` **DEVE** conter ao menos:

```hcl
variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment (dev, prod)"
  type        = string
  validation {
    condition     = contains(["dev", "prod"], var.environment)
    error_message = "Environment must be 'dev' or 'prod'."
  }
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "paguebem"
}
```

---

## 🚀 Comandos de Deploy e Destroy

### Ordem de Deploy

```
1️⃣  dynamodb     → Sem dependências (criar primeiro)
2️⃣  lambda       → Depende de: dynamodb (ARNs nos tfvars)
3️⃣  apigateway   → Depende de: lambda (ARN e invoke_arn nos tfvars)
4️⃣  frontend     → Depende de: apigateway (endpoint URL no .env)
```

### Ordem de Destroy (INVERSA)

```
4️⃣  frontend     → Remover deploy da Vercel
3️⃣  apigateway   → terraform destroy -var-file="{env}/terraform.tfvars"
2️⃣  lambda       → terraform destroy -var-file="{env}/terraform.tfvars"
1️⃣  dynamodb     → terraform destroy -var-file="{env}/terraform.tfvars"
```

### Comandos para cada recurso:

```powershell
# INIT (primeira vez ou troca de ambiente)
terraform init -backend-config="key={recurso}/{env}/terraform.tfstate"

# PLAN
terraform plan -var-file="{env}/terraform.tfvars"

# APPLY
terraform apply -var-file="{env}/terraform.tfvars"

# DESTROY
terraform destroy -var-file="{env}/terraform.tfvars"
```

---

## 🔗 Como Conectar Recursos Entre Repositórios

```
┌─────────────┐    outputs.tf     ┌─────────────┐
│  DynamoDB    │ ──── ARNs ─────► │   Lambda     │
│  repo        │    table names   │   repo       │
└─────────────┘                   └─────────────┘
                                       │
                                  function_arn
                                  invoke_arn
                                       │
                                       ▼
                                  ┌─────────────┐
                                  │ API Gateway  │
                                  │ repo         │
                                  └─────────────┘
                                       │
                                  api_endpoint
                                       │
                                       ▼
                                  ┌─────────────┐
                                  │  Frontend    │
                                  │  (.env)      │
                                  └─────────────┘
```

### Fluxo:

1. `terraform apply` no DynamoDB → copiar ARNs/nomes do output
2. Colar nos `terraform.tfvars` do Lambda
3. `terraform apply` no Lambda → copiar function_name e invoke_arn do output
4. Colar nos `terraform.tfvars` do API Gateway
5. `terraform apply` no API Gateway → copiar api_endpoint do output
6. Colar no `.env` do Frontend (`VITE_API_URL=...`)

---

## 🌐 Frontend

### Padrão:

- **Framework**: React + Vite + TypeScript
- **Styling**: Tailwind CSS
- **Deploy**: Vercel
- **Variável de ambiente**: `VITE_API_URL` com endpoint do API Gateway

### Estrutura:

```
PagueBem/
├── .github/
│   └── copilot-instructions.md
├── .gitignore
├── PagueBem.code-workspace
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
├── index.html
├── .env                     ← VITE_API_URL (NÃO versionar)
├── .env.example             ← Template (versionar)
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── vite-env.d.ts
    ├── components/
    │   └── ImageUpload.tsx
    ├── lib/
    │   └── api.ts
    └── styles/
        └── globals.css
```

---

## 📊 Projeto: PagueBem

| Recurso     | Repo GitHub                         | Pasta Local                           | Status |
|-------------|-------------------------------------|---------------------------------------|--------|
| DynamoDB    | PagueBem-terraform-dynamodb         | C:\GIT\PagueBem-terraform\dynamodb    | ✅ Criado |
| Lambda      | PagueBem-terraform-lambda           | C:\GIT\PagueBem-terraform\lambda      | ✅ Criado |
| API Gateway | PagueBem-terraform-apigateway       | C:\GIT\PagueBem-terraform\apigateway  | ✅ Criado |
| Frontend    | PagueBem                            | C:\GIT\PagueBem                       | ✅ Criado |

### Tabelas DynamoDB:
- `Usuarios-{env}` (hash: `usuario_id`)
- `QrCodeItens-{env}` (hash: `item_id`, GSI: `qrcode_id-index`)

### Lambda:
- Função: `paguebem-api-{env}`
- ECR: `paguebem-api-{env}`
- Runtime: Python 3.11 (Docker)
- Camadas: controller → service → repository → DynamoDB

### API Gateway:
- HTTP API v2: `paguebem-api-{env}`
- Stage: `{env}` (auto-deploy)
- Route: `$default` (catch-all)
- CORS: configurado

### Region: `us-east-1`
### State Bucket: `paguebem-terraform-state`
### DynamoDB Locks: `terraform-locks`

---

## 🧠 Regras para o Agente

### SEMPRE:

1. **Seguir a estrutura de pastas** descrita neste documento
2. **Usar backend S3** com DynamoDB locks
3. **Separar dev e prod** com tfvars independentes
4. **Incluir `force_delete`/`force_destroy`** em recursos que suportam
5. **Criar README.md** com instruções de deploy E destroy
6. **Criar `.tfvars.example`** para dev e prod (sem secrets reais)
7. **Nomear recursos** com padrão: `paguebem-{descritivo}-{env}`
8. **Tagear tudo** com: Environment, Project, ManagedBy, Repository
9. **Validar variáveis** com `validation {}` blocks
10. **Documentar outputs** com descriptions claras
11. **Respeitar ordem de deploy** (dependências entre repos)

### NUNCA:

1. ❌ Criar recursos sem tags
2. ❌ Hardcodar account IDs, ARNs ou secrets no código
3. ❌ Misturar recursos de diferentes serviços AWS no mesmo repo (exceto ECR dentro do Lambda)
4. ❌ Versionar `terraform.tfvars` com secrets reais
5. ❌ Esquecer o `force_delete`/`force_destroy` em ECR, S3, etc.
6. ❌ Criar recursos manualmente no console AWS
7. ❌ Ignorar a ordem de destroy

---

## 📝 Histórico de Decisões

| Data       | Decisão                                                      |
|------------|--------------------------------------------------------------|
| 2026-02-12 | Reestruturação completa do projeto PagueBem                  |
| 2026-02-12 | Migração de monorepo para multi-repo por recurso AWS         |
| 2026-02-12 | Frontend migrado de Next.js para React + Vite + TypeScript   |
| 2026-02-12 | Lambda reestruturado em camadas (controller/service/etc.)    |
| 2026-02-12 | Backend S3 + DynamoDB locks padronizado                      |
| 2026-02-12 | ECR integrado dentro do repo Lambda                          |
| 2026-02-12 | API Gateway com catch-all route ($default)                   |
| 2026-02-12 | Dockerfile migrado para base `public.ecr.aws/lambda/python:3.11` |
