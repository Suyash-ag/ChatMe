#!/bin/bash

# Check Kubernetes Pod Status
# Usage: ./scripts/check-k8s-pods.sh

echo "🔍 Checking Kubernetes Pod Status"
echo "=================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}❌ kubectl is not installed or not in PATH${NC}"
    exit 1
fi

# Check if connected to cluster
if ! kubectl cluster-info &> /dev/null; then
    echo -e "${RED}❌ Not connected to Kubernetes cluster${NC}"
    exit 1
fi

echo "📊 Pod Status:"
echo "--------------"
kubectl get pods -o wide

echo ""
echo "📋 Pod Details:"
echo "--------------"

# Check each deployment
for app in auth chat frontend mongo redis; do
    echo ""
    echo -e "${YELLOW}Checking $app pods:${NC}"
    pods=$(kubectl get pods -l app=$app -o name 2>/dev/null)
    
    if [ -z "$pods" ]; then
        echo -e "${RED}  ❌ No pods found for $app${NC}"
    else
        for pod in $pods; do
            pod_name=$(echo $pod | cut -d'/' -f2)
            status=$(kubectl get pod $pod_name -o jsonpath='{.status.phase}' 2>/dev/null)
            ready=$(kubectl get pod $pod_name -o jsonpath='{.status.containerStatuses[0].ready}' 2>/dev/null)
            
            if [ "$status" == "Running" ] && [ "$ready" == "true" ]; then
                echo -e "${GREEN}  ✅ $pod_name: $status (Ready: $ready)${NC}"
            elif [ "$status" == "Pending" ]; then
                echo -e "${YELLOW}  ⏳ $pod_name: $status${NC}"
                reason=$(kubectl get pod $pod_name -o jsonpath='{.status.conditions[?(@.type=="PodScheduled")].reason}' 2>/dev/null)
                echo "     Reason: $reason"
            elif [ "$status" == "CrashLoopBackOff" ] || [ "$status" == "Error" ]; then
                echo -e "${RED}  ❌ $pod_name: $status${NC}"
                echo "     Check logs: kubectl logs $pod_name"
            else
                echo -e "${YELLOW}  ⚠️  $pod_name: $status (Ready: $ready)${NC}"
            fi
        done
    fi
done

echo ""
echo "📝 Recent Events:"
echo "----------------"
kubectl get events --sort-by='.lastTimestamp' | tail -10

echo ""
echo "🔧 Troubleshooting Commands:"
echo "----------------------------"
echo "  # Check pod logs:"
echo "  kubectl logs <pod-name>"
echo ""
echo "  # Describe pod:"
echo "  kubectl describe pod <pod-name>"
echo ""
echo "  # Check all resources:"
echo "  kubectl get all"
echo ""
echo "  # Check services:"
echo "  kubectl get svc"
echo ""
echo "  # Check configmaps and secrets:"
echo "  kubectl get configmap,secret"

