# 🚀 PagueBem — Deploy & Destroy

> Documento com todos os comandos para deploy e destroy da infraestrutura AWS.
> **Sempre respeitar a ordem de dependências entre os recursos.**

---

## 📍 Pré-requisitos

- AWS CLI configurado (`aws configure`)
- Terraform >= 1.0 instalado
- Docker Desktop rodando
- Repositórios clonados em `C:\GIT\PagueBem-terraform\`

---

## 🏗️ Recursos do Projeto

| Recurso | Diretório | Tabelas/Recursos |
|---------|-----------|------------------|
| DynamoDB | `C:\GIT\PagueBem-terraform\dynamodb` | PagueBem-Usuarios-{env}, PagueBem-Produtos-{env} |
| Lambda | `C:\GIT\PagueBem-terraform\lambda` | paguebem-api-{env} (ECR + Lambda + IAM + CloudWatch) |
| API Gateway | `C:\GIT\PagueBem-terraform\apigateway` | paguebem-api-{env} (HTTP API v2) |

---

## 🟢 DEPLOY — Ambiente DEV

> **Ordem: DynamoDB → Lambda → API Gateway**

### 1️⃣ DynamoDB

```powershell
cd C:\GIT\PagueBem-terraform\dynamodb
terraform init -backend-config="key=dynamodb/dev/terraform.tfstate"
terraform plan -var-file="dev/terraform.tfvars"
terraform apply -var-file="dev/terraform.tfvars"
```

> 📋 Após o apply, copiar os outputs (`usuarios_table_name`, `usuarios_table_arn`, `produtos_table_name`, `produtos_table_arn`) para o arquivo `lambda/dev/terraform.tfvars`.

### 2️⃣ Lambda

```powershell
cd C:\GIT\PagueBem-terraform\lambda
terraform init -backend-config="key=lambda/dev/terraform.tfstate"
terraform plan -var-file="dev/terraform.tfvars"
terraform apply -var-file="dev/terraform.tfvars"
```

> ⚠️ O primeiro apply demora ~3 minutos (build Docker com compilação do zbar).
> 📋 Após o apply, copiar os outputs (`function_name`, `invoke_arn`) para o arquivo `apigateway/dev/terraform.tfvars`.

### 3️⃣ API Gateway

```powershell
cd C:\GIT\PagueBem-terraform\apigateway
terraform init -backend-config="key=apigateway/dev/terraform.tfstate"
terraform plan -var-file="dev/terraform.tfvars"
terraform apply -var-file="dev/terraform.tfvars"
```

> 📋 Após o apply, o output `api_endpoint` é a URL da API (ex: `https://xxx.execute-api.us-east-1.amazonaws.com/dev`).

---

## 🟢 DEPLOY — Ambiente PROD

> **Mesma ordem: DynamoDB → Lambda → API Gateway**
> ⚠️ Antes de fazer deploy em prod, testar em dev primeiro!

### 1️⃣ DynamoDB

```powershell
cd C:\GIT\PagueBem-terraform\dynamodb
terraform init -backend-config="key=dynamodb/prod/terraform.tfstate" -reconfigure
terraform plan -var-file="prod/terraform.tfvars"
terraform apply -var-file="prod/terraform.tfvars"
```

### 2️⃣ Lambda

```powershell
cd C:\GIT\PagueBem-terraform\lambda
terraform init -backend-config="key=lambda/prod/terraform.tfstate" -reconfigure
terraform plan -var-file="prod/terraform.tfvars"
terraform apply -var-file="prod/terraform.tfvars"
```

### 3️⃣ API Gateway

```powershell
cd C:\GIT\PagueBem-terraform\apigateway
terraform init -backend-config="key=apigateway/prod/terraform.tfstate" -reconfigure
terraform plan -var-file="prod/terraform.tfvars"
terraform apply -var-file="prod/terraform.tfvars"
```

---

## 🔴 DESTROY — Ambiente DEV

> **Ordem INVERSA: API Gateway → Lambda → DynamoDB**

### 1️⃣ API Gateway

```powershell
cd C:\GIT\PagueBem-terraform\apigateway
terraform init -backend-config="key=apigateway/dev/terraform.tfstate"
terraform destroy -var-file="dev/terraform.tfvars"
```

### 2️⃣ Lambda

```powershell
cd C:\GIT\PagueBem-terraform\lambda
terraform init -backend-config="key=lambda/dev/terraform.tfstate"
terraform destroy -var-file="dev/terraform.tfvars"
```

### 3️⃣ DynamoDB

```powershell
cd C:\GIT\PagueBem-terraform\dynamodb
terraform init -backend-config="key=dynamodb/dev/terraform.tfstate"
terraform destroy -var-file="dev/terraform.tfvars"
```

---

## 🔴 DESTROY — Ambiente PROD

> **Ordem INVERSA: API Gateway → Lambda → DynamoDB**
> ⚠️ CUIDADO: Isso vai remover TUDO do ambiente de produção!

### 1️⃣ API Gateway

```powershell
cd C:\GIT\PagueBem-terraform\apigateway
terraform init -backend-config="key=apigateway/prod/terraform.tfstate" -reconfigure
terraform destroy -var-file="prod/terraform.tfvars"
```

### 2️⃣ Lambda

```powershell
cd C:\GIT\PagueBem-terraform\lambda
terraform init -backend-config="key=lambda/prod/terraform.tfstate" -reconfigure
terraform destroy -var-file="prod/terraform.tfvars"
```

### 3️⃣ DynamoDB

```powershell
cd C:\GIT\PagueBem-terraform\dynamodb
terraform init -backend-config="key=dynamodb/prod/terraform.tfstate" -reconfigure
terraform destroy -var-file="prod/terraform.tfvars"
```

---

## 🔄 Troca entre ambientes (dev ↔ prod)

Ao trocar de ambiente no mesmo terminal, use `-reconfigure` no init:

```powershell
terraform init -backend-config="key={recurso}/{env}/terraform.tfstate" -reconfigure
```

Isso é necessário porque o backend S3 usa keys diferentes por ambiente.

---

## 🧪 Teste rápido (após deploy dev)

```powershell
# Testar QR code decode
$bytes = [System.IO.File]::ReadAllBytes("CAMINHO\DO\QRCODE.jpeg")
$base64 = [Convert]::ToBase64String($bytes)
$body = @{image = "data:image/jpeg;base64,$base64"} | ConvertTo-Json
$response = Invoke-RestMethod -Uri "https://SEU_ENDPOINT/dev/decode" -Method POST -ContentType "application/json" -Body $body
$response | ConvertTo-Json -Depth 5
```

---

## 📊 Verificar o que existe na AWS

```powershell
# Tabelas DynamoDB
aws dynamodb list-tables --region us-east-1

# Funções Lambda
aws lambda list-functions --region us-east-1 --query "Functions[?starts_with(FunctionName, 'paguebem')].FunctionName"

# APIs Gateway
aws apigatewayv2 get-apis --region us-east-1 --query "Items[?starts_with(Name, 'paguebem')].{Name:Name, Endpoint:ApiEndpoint}"

# ECR Repositories
aws ecr describe-repositories --region us-east-1 --query "repositories[?starts_with(repositoryName, 'paguebem')].repositoryName"
```

---

## 📝 Notas

- O **State remoto** fica no S3 bucket `paguebem-terraform-state` com lock no DynamoDB `terraform-locks`
- Os `terraform.tfvars` contêm ARNs e secrets — **NÃO versionar** (já estão no .gitignore)
- Os `.tfvars.example` são templates seguros para versionar
- O ECR usa `force_delete = true` — destroy limpa tudo
- O primeiro build do Lambda demora ~3 min (compilação do zbar do source)
- Builds subsequentes usam cache Docker e são rápidos (~30s)
