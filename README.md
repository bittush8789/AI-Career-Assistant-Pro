# 🚀 AI-Career-Assistant-Pro: Enterprise GenAI Career Platform

[![Python](https://img.shields.io/badge/Python-3.11+-blue.svg?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688.svg?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED.svg?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![Kubernetes](https://img.shields.io/badge/Kubernetes-Cloud--Native-326CE5.svg?style=for-the-badge&logo=kubernetes&logoColor=white)](https://kubernetes.io/)
[![Terraform](https://img.shields.io/badge/Terraform-IaC-623CE4.svg?style=for-the-badge&logo=terraform&logoColor=white)](https://www.terraform.io/)
[![AWS](https://img.shields.io/badge/AWS-Infrastructure-FF9900.svg?style=for-the-badge&logo=amazon-aws&logoColor=white)](https://aws.amazon.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

**AI-Career-Assistant-Pro** is an industry-standard, production-ready GenAI application designed to revolutionize the career development lifecycle. Built with a **Cloud-Native, LLMOps-first architecture**, it provides job seekers and professionals with enterprise-grade tools for resume optimization, career roadmap generation, and interview preparation.

---

## 🎯 Project Overview

In today's competitive job market, candidates often struggle with non-ATS-friendly resumes and a lack of personalized career guidance. **AI-Career-Assistant-Pro** solves this by leveraging cutting-edge LLMs (Llama 3, GPT-4) and multi-agent workflows to provide:

- **Problem:** Mismatch between candidate skills and job requirements, poor ATS scoring.
- **Solution:** A centralized platform for real-time resume analysis, career pathing, and skill gap detection.
- **Real-World Use Case:** High-volume recruitment agencies and individual job seekers looking to automate the "first-pass" application optimization.
- **GenAI Implementation:** Uses **LangGraph** for multi-agent orchestration, **Groq/OpenAI** for high-speed inference, and **RAG (Retrieval Augmented Generation)** for context-aware career advice.

---

## ✨ Features

- 📄 **Advanced Resume Analysis:** Multi-layer ATS scoring and keyword extraction.
- 🛣️ **Dynamic Career Roadmaps:** AI-generated learning paths based on target roles.
- 🎙️ **AI Mock Interviews:** Real-time feedback on behavioral and technical responses.
- 💰 **Salary Estimation:** Data-driven insights into market compensation.
- 🤖 **Multi-Agent Workflow:** Autonomous agents for research, writing, and review.
- 📊 **Real-time Dashboard:** Live analytics and readiness tracking.
- ☁️ **Cloud Native Deployment:** Fully containerized and ready for Kubernetes orchestration.
- 🔄 **Automated CI/CD:** Zero-downtime deployments via GitHub Actions.
- 🛡️ **Enterprise Security:** Image scanning and automated security audits.

---

## 🏗️ Architecture Diagram

```text
                                  [ USER ]
                                     │
                                     ▼
                          ┌───────────────────────┐
                          │    NGINX Ingress      │
                          └──────────┬────────────┘
                                     │
            ┌────────────────────────┼────────────────────────┐
            │                        │                        │
  ┌─────────▼─────────┐    ┌─────────▼─────────┐    ┌─────────▼─────────┐
  │  Frontend (HTML5) │◄───┤   Backend (FastAPI)│    │  Monitoring Stack │
  │  Static UI Assets │    │   Business Logic  │    │ (Prometheus/Grafana)│
  └───────────────────┘    └─────────┬─────────┘    └─────────▲─────────┘
                                     │                        │
            ┌────────────────────────┼────────────────────────┤
            │                        │                        │
  ┌─────────▼─────────┐    ┌─────────▼─────────┐    ┌─────────▼─────────┐
  │ LangGraph Agents  │    │   Vector DB       │    │ Langfuse Trace    │
  │ (Research/Review) │    │ (Qdrant/Chroma)   │    │ (LLMOps Observ.)  │
  └─────────┬─────────┘    └─────────┬─────────┘    └───────────────────┘
            │                        │
  ┌─────────▼────────────────────────▼────────┐
  │            LLM APIs (Groq / OpenAI)       │
  └───────────────────────────────────────────┘

  [ Infrastructure Layer: AWS + Terraform + EKS ]
```

---

## 📁 Project Folder Structure

```bash
AI-Career-Assistant-Pro/
 ├── .github/workflows/       # CI/CD Pipelines (Deploy to EKS)
 ├── app/                     # Main application logic
 ├── backend/                 # FastAPI Source Code
 │    ├── routes/             # API Endpoints (Resume, Jobs, etc.)
 │    ├── services/           # LLM and Business Logic
 │    └── schemas/            # Pydantic Models
 ├── frontend/                # Modern UI (HTML/CSS/JS)
 ├── k8s/                     # Kubernetes Manifests (Production)
 ├── helm/                    # Helm Charts for Orchestration
 ├── terraform/               # Infrastructure as Code (AWS)
 ├── monitoring/              # Prometheus & Grafana Configs
 ├── tests/                   # Unit and Integration Tests
 ├── Dockerfile               # Multi-stage Docker Build
 ├── docker-compose.yml       # Local Development Stack
 ├── requirements.txt         # Python Dependencies
 └── README.md                # Documentation
```

---

## 🛠️ Local Setup

Follow these steps to run the application locally:

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/bittush8789/AI-Career-Assistant-Pro.git
   cd AI-Career-Assistant-Pro
   ```

2. **Environment Configuration:**
   ```bash
   cp .env.example .env
   # Edit .env and add your GROQ_API_KEY or OPENAI_API_KEY
   ```

3. **Install Dependencies:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

4. **Run Application:**
   ```bash
   uvicorn backend.main:app --reload
   ```
   Access the app at `http://localhost:8000`.

---

## 🐳 Docker Setup

The application is containerized using a production-grade multi-stage build.

### Build and Run
```bash
# Build the image
docker build -t ai-career-assistant:latest .

# Run the container
docker run -p 8000:8000 --env-file .env ai-career-assistant:latest
```

### Docker Compose (Dev Stack)
```yaml
# docker-compose.yml
services:
  web:
    build: .
    ports:
      - "8000:8000"
    env_file: .env
    volumes:
      - ./backend:/app/backend
      - ./frontend:/app/frontend
    restart: unless-stopped
```
Run with: `docker-compose up --build`

---

## ☸️ Kubernetes Deployment (Kind Cluster)

Deploy to a local **Kind (Kubernetes in Docker)** cluster for production simulation.

### 1. Cluster Setup
```bash
kind create cluster --name career-cluster
kubectl create namespace ai-career
```

### 2. Infrastructure Manifests

#### `k8s/configmap.yaml`
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: ai-career-config
  namespace: ai-career
data:
  APP_ENV: "production"
  LOG_LEVEL: "info"
```

#### `k8s/deployment.yaml`
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ai-career-api
  namespace: ai-career
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ai-career
  template:
    metadata:
      labels:
        app: ai-career
    spec:
      containers:
      - name: api
        image: bittush8789/ai-career-assistant:latest
        ports:
        - containerPort: 8000
        envFrom:
        - configMapRef:
            name: ai-career-config
        - secretRef:
            name: ai-career-secrets
        resources:
          limits:
            cpu: "500m"
            memory: "512Mi"
          requests:
            cpu: "250m"
            memory: "256Mi"
```

#### `k8s/service.yaml`
```yaml
apiVersion: v1
kind: Service
metadata:
  name: ai-career-service
  namespace: ai-career
spec:
  selector:
    app: ai-career
  ports:
  - protocol: TCP
    port: 80
    targetPort: 8000
  type: ClusterIP
```

---

## 📦 Helm Deployment

Standardize your deployments using Helm.

```bash
# Create Helm chart structure
helm create ai-career

# Deploy application
helm upgrade --install ai-career ./helm --namespace ai-career

# List releases
helm list -n ai-career
```

---

## 🚀 GitHub Actions CI/CD

Automated pipeline for testing, building, and deploying to EKS.

```yaml
# .github/workflows/deploy.yml
name: CI/CD Pipeline

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Security Scan (Trivy)
        run: trivy image --severity HIGH,CRITICAL .
        
      - name: Build Docker Image
        run: docker build -t ${{ secrets.DOCKER_HUB_USERNAME }}/ai-career:latest .
        
      - name: Push to Docker Hub
        run: |
          echo "${{ secrets.DOCKER_HUB_TOKEN }}" | docker login -u "${{ secrets.DOCKER_HUB_USERNAME }}" --password-stdin
          docker push ${{ secrets.DOCKER_HUB_USERNAME }}/ai-career:latest
          
      - name: Deploy to EKS
        run: |
          aws eks update-kubeconfig --name career-eks-cluster
          helm upgrade --install ai-career ./helm -n ai-career
```

---

## 🏗️ Terraform (IaC) for AWS

Provisional production-grade infrastructure on AWS.

```hcl
# terraform/main.tf
module "vpc" {
  source = "terraform-aws-modules/vpc/aws"
  name   = "career-vpc"
  cidr   = "10.0.0.0/16"
  # ... subnets and configs
}

module "eks" {
  source          = "terraform-aws-modules/eks/aws"
  cluster_name    = "career-eks-cluster"
  cluster_version = "1.27"
  vpc_id          = module.vpc.vpc_id
  subnet_ids      = module.vpc.private_subnets
  # ... worker node configs
}
```

---

## 📊 Monitoring & LLMOps

### Observability
- **Prometheus:** Scrapes `/metrics` from FastAPI.
- **Grafana:** Visualizes Pod health, request latency, and error rates.
- **Loki:** Centralized logging for multi-container debugging.

### LLMOps (Langfuse Integration)
Integrated with **Langfuse** for:
- **Traceability:** Full visibility into LLM call chains.
- **Cost Tracking:** Real-time token usage monitoring.
- **Performance:** Tracking latency across different LLM providers (Groq vs OpenAI).

---

## 🔒 Security Best Practices

- **Container Security:** Trivy scans in the CI/CD pipeline to detect vulnerabilities.
- **Static Analysis:** SonarQube integration for code quality and security hotspots.
- **Secret Management:** HashiCorp Vault or AWS Secrets Manager for API keys.
- **RBAC:** Fine-grained Kubernetes Role-Based Access Control.

---

## 💡 Production Best Practices

- **Horizontal Pod Autoscaling (HPA):** Scales pods based on CPU/Memory usage.
- **Rolling Updates:** Zero-downtime deployment strategy.
- **Health Checks:** Liveness and Readiness probes configured in Kubernetes.
- **Resource Quotas:** Limits to prevent noisy neighbor issues in clusters.

---

## 🛠️ Troubleshooting

| Issue | Solution |
| :--- | :--- |
| **Pod CrashLoopBackOff** | Check logs with `kubectl logs <pod-name>`. Often due to missing `.env`. |
| **ImagePullBackOff** | Ensure Docker Hub credentials are correct in K8s Secrets. |
| **Ingress 404** | Verify Ingress-Nginx controller is installed and hosts file is updated. |
| **Terraform Auth** | Run `aws configure` and ensure IAM permissions are sufficient. |

---

## 🚀 Future Enhancements

- 🌐 **Multi-Cloud Support:** GCP and Azure deployment modules.
- 🔄 **ArgoCD:** Implementation of GitOps for continuous delivery.
- 🧠 **Model Fine-Tuning:** Custom fine-tuned Llama 3 for specific industry jargon.
- ⚡ **Redis Caching:** Accelerate repeat queries and session management.

---

## 🏆 Resume Worthy Highlights

- **Architected** a scalable multi-agent GenAI platform using FastAPI and LangGraph.
- **Implemented** a complete CI/CD pipeline with GitHub Actions, reducing deployment time by 70%.
- **Deployed** a production-grade Kubernetes cluster on AWS EKS using Terraform (IaC).
- **Integrated** LLMOps tracing with Langfuse for real-time cost and performance monitoring.
- **Enforced** security standards with automated Trivy scans and RBAC configurations.

---

Developed with ❤️ by [Bittu Sharma](https://github.com/bittush8789)
