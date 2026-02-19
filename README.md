# Strapi + Docker + AWS ECS (Fargate)

This folder is a starter scaffold to run Strapi locally with Docker and deploy the same app image to ECS.

Current workspace status: the Strapi app is already initialized in `cms/`.

## 1) Prerequisites (from Strapi Quick Start)

- Node.js LTS only (`v20`, `v22`, or `v24`)
- npm/yarn/pnpm
- Docker Desktop (for local container flow)

## 2) Create a Strapi app (if you need a fresh one)

Official quick-start command from docs:

```bash
npx create-strapi@latest my-strapi-project
```

For this workspace (create directly in current `strapi` folder):

From inside this `strapi` directory:

```bash
npx create-strapi@latest . --use-npm --dbclient=postgres --dbhost=db --dbport=5432 --dbname=strapi --dbusername=strapi --dbpassword=strapi --no-run
```

For this workspace's current layout (already done), app path is `cms/`.

Copy env file:

```bash
cp .env.example .env
```

> On PowerShell, use: `Copy-Item .env.example .env`

## 3) Bring Strapi up locally (Docker)

```bash
docker compose up -d
```

Follow logs:

```bash
docker compose logs -f strapi
```

Open:
- App: http://localhost:1337
- Admin setup: http://localhost:1337/admin

Stop local stack:

```bash
docker compose down
```

## 3.1) Bring Strapi up locally in Git Bash (recommended)

One command from `c:/Code/strapi`:

```bash
./start-strapi-local.sh
```

Stop command:

```bash
./stop-strapi-local.sh
```

Direct command (without helper script):

```bash
cd ./cms
npm run develop
```

Admin login URL:
- http://localhost:1337/admin
- First login creates the admin email/password (no default credentials)

## 3.2) S3 publish-event hook (now included)

When an entry is published, Strapi uploads a JSON event to S3.

Where it is implemented:
- `cms/src/index.ts` (global lifecycle subscription)
- `cms/src/utils/publish-event-s3.ts` (S3 upload logic)

Set these variables in `cms/.env`:

```bash
AWS_REGION=us-east-1
S3_PUBLISH_EVENTS_BUCKET=your-bucket-name
S3_PUBLISH_EVENTS_PREFIX=strapi-publish-events
```

AWS credentials are resolved by the AWS SDK default chain (environment variables, shared credentials file, IAM role, etc.).

Event object key format:

```text
<prefix>/<content-type-uid>/<entry-id>-<timestamp>.json
```

Example start + publish flow:

```bash
./start-strapi-local.sh
# publish an entry in Strapi admin
# check S3 bucket for new JSON event object
```

## 4) Build production image locally

```bash
docker build -t strapi:latest .
```

Run local production container (optional):

```bash
docker run --rm -p 1337:1337 --env-file .env strapi:latest
```

## 5) Push image to ECR

Set variables:

```bash
export AWS_REGION=<REGION>
export AWS_ACCOUNT_ID=<ACCOUNT_ID>
export ECR_REPO=strapi
export IMAGE_TAG=latest
```

PowerShell equivalent:

```powershell
$env:AWS_REGION="<REGION>"
$env:AWS_ACCOUNT_ID="<ACCOUNT_ID>"
$env:ECR_REPO="strapi"
$env:IMAGE_TAG="latest"
```

Create ECR repo (one time):

```bash
aws ecr create-repository --repository-name $ECR_REPO --region $AWS_REGION
```

Login and push:

```bash
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com
docker tag strapi:$IMAGE_TAG $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO:$IMAGE_TAG
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO:$IMAGE_TAG
```

## 6) Bring Strapi up on ECS (Fargate)

### 5.1 Prerequisites
- Existing VPC + 2 private subnets
- Security groups for ECS task and RDS
- PostgreSQL RDS instance reachable from ECS
- `ecsTaskExecutionRole` IAM role

### 5.2 Create CloudWatch log group

```bash
aws logs create-log-group --log-group-name /ecs/strapi --region <REGION>
```

### 5.3 Register task definition

1. Edit `ecs/task-definition.template.json` placeholders (`<ACCOUNT_ID>`, `<REGION>`, `<RDS_ENDPOINT>`, secrets).
2. Register:

```bash
aws ecs register-task-definition --cli-input-json file://ecs/task-definition.template.json --region <REGION>
```

### 5.4 Create cluster (one time)

```bash
aws ecs create-cluster --cluster-name strapi-cluster --region <REGION>
```

### 5.5 Create service

```bash
aws ecs create-service \
  --cluster strapi-cluster \
  --service-name strapi-service \
  --task-definition strapi-task \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-aaa,subnet-bbb],securityGroups=[sg-aaa],assignPublicIp=DISABLED}" \
  --region <REGION>
```

### 5.6 Update service with new image

After pushing a new image, register a new task definition revision and force deploy:

```bash
aws ecs update-service --cluster strapi-cluster --service strapi-service --force-new-deployment --region <REGION>
```

---

## Strapi Cloud vs ECS

- **Strapi Cloud (official quick-start path):** easiest managed hosting from Strapi docs.
  - Create project: `npx create-strapi@latest my-strapi-project`
  - Deploy: `npm run strapi deploy` (or `yarn strapi deploy`)
- **AWS ECS (this repo path):** self-hosted on your AWS account with your own networking, RDS, IAM, and scaling.
  - Local run first: `docker compose up -d`
  - Deploy flow: build image -> push to ECR -> register ECS task -> create/update ECS service

Use **Strapi Cloud** for fastest setup, or **ECS** when you need full AWS control/compliance/network integration.

---

## Quick command summary

Git Bash local start (current setup):

```bash
./start-strapi-local.sh
```

Git Bash local stop:

```bash
./stop-strapi-local.sh
```

Local up:

```bash
docker compose up -d
```

Local down:

```bash
docker compose down
```

ECS up (minimum flow):

```bash
docker build -t strapi:latest .
# tag + push to ECR
aws ecs register-task-definition --cli-input-json file://ecs/task-definition.template.json --region <REGION>
aws ecs create-service --cluster strapi-cluster --service-name strapi-service --task-definition strapi-task --desired-count 1 --launch-type FARGATE --network-configuration "awsvpcConfiguration={subnets=[subnet-aaa,subnet-bbb],securityGroups=[sg-aaa],assignPublicIp=DISABLED}" --region <REGION>
```
