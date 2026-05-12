.PHONY: help cluster-up cluster-down build-images load-images deploy-ingress deploy-argocd all

CLUSTER_NAME=aegis-cloud

help:
	@echo "Comandos disponíveis:"
	@echo "  make cluster-up    - Cria o cluster kind"
	@echo "  make cluster-down  - Destrói o cluster kind"
	@echo "  make build-images  - Builda as imagens dos microserviços localmente"
	@echo "  make load-images   - Carrega as imagens no cluster kind"
	@echo "  make deploy-ingress - Instala o Nginx Ingress Controller no cluster"
	@echo "  make deploy-argocd - Instala o ArgoCD no cluster"
	@echo "  make all           - Roda todos os passos de setup"

cluster-up:
	@echo "Criando cluster Kind..."
	kind create cluster --name $(CLUSTER_NAME) --config infrastructure/kind/kind-config.yaml

cluster-down:
	@echo "Destruindo cluster Kind..."
	kind delete cluster --name $(CLUSTER_NAME)

build-images:
	@echo "Buildando imagem backend..."
	docker build -t backend:latest ./apps/backend
	@echo "Buildando imagem frontend..."
	docker build -t frontend:latest ./apps/frontend
	@echo "Buildando imagem worker (TypeScript)..."
	docker build -t worker:latest ./apps/worker

load-images: build-images
	@echo "Carregando imagens no Kind..."
	kind load docker-image backend:latest --name $(CLUSTER_NAME)
	kind load docker-image frontend:latest --name $(CLUSTER_NAME)
	kind load docker-image worker:latest --name $(CLUSTER_NAME)

deploy-ingress:
	@echo "Instalando Nginx Ingress..."
	kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml
	@echo "Aguardando Ingress Controller ficar pronto..."
	kubectl wait --namespace ingress-nginx \
	  --for=condition=ready pod \
	  --selector=app.kubernetes.io/component=controller \
	  --timeout=90s

deploy-argocd:
	@echo "Instalando ArgoCD..."
	kubectl create namespace argocd || true
	kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
	@echo "Aguardando ArgoCD Server..."
	kubectl wait --namespace argocd \
	  --for=condition=ready pod \
	  --selector=app.kubernetes.io/name=argocd-server \
	  --timeout=90s

all: cluster-up load-images deploy-ingress deploy-argocd
	@echo "=========================================="
	@echo "Setup concluído com sucesso!"
	@echo "Para pegar a senha inicial do ArgoCD:"
	@echo "kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath='{.data.password}' | base64 -d; echo"
	@echo "Para acessar o ArgoCD localmente:"
	@echo "kubectl port-forward svc/argocd-server -n argocd 8080:443"
	@echo "Acesse https://localhost:8080 no seu navegador."
	@echo "=========================================="
