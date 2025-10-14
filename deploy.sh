#!/bin/bash

# LaunchKit Deployment Script
# This script helps deploy LaunchKit to various platforms

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

print_step() {
    echo -e "\n${BLUE}🔄 $1${NC}"
}

# Check if required tools are installed
check_requirements() {
    print_header "Checking Requirements"
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed"
        exit 1
    fi
    print_success "Node.js is installed"
    
    # Check pnpm
    if ! command -v pnpm &> /dev/null; then
        print_info "Installing pnpm..."
        npm install -g pnpm
    fi
    print_success "pnpm is available"
    
    # Check if .env files exist
    if [ ! -f "app/.env.local" ]; then
        print_error "app/.env.local not found. Please create it with required environment variables."
        exit 1
    fi
    print_success "Environment files found"
}

# Deploy to Vercel
deploy_vercel() {
    print_header "Deploying to Vercel"
    
    # Check if Vercel CLI is installed
    if ! command -v vercel &> /dev/null; then
        print_info "Installing Vercel CLI..."
        npm install -g vercel
    fi
    
    print_step "Deploying frontend to Vercel..."
    cd app
    vercel --prod
    cd ..
    
    print_success "Frontend deployed to Vercel"
    print_info "Don't forget to set environment variables in Vercel dashboard"
}

# Deploy to Railway
deploy_railway() {
    print_header "Deploying to Railway"
    
    # Check if Railway CLI is installed
    if ! command -v railway &> /dev/null; then
        print_info "Installing Railway CLI..."
        npm install -g @railway/cli
    fi
    
    print_step "Deploying to Railway..."
    railway login
    railway init
    railway up
    
    print_success "Deployed to Railway"
}

# Deploy with Docker
deploy_docker() {
    print_header "Deploying with Docker"
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        exit 1
    fi
    
    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed"
        exit 1
    fi
    
    print_step "Building Docker images..."
    docker-compose -f docker-compose.prod.yml build
    
    print_step "Starting services..."
    docker-compose -f docker-compose.prod.yml up -d
    
    print_success "Services started with Docker"
    print_info "Frontend: http://localhost:3000"
    print_info "API: http://localhost:3001"
}

# Setup production environment
setup_production() {
    print_header "Setting up Production Environment"
    
    print_step "Installing dependencies..."
    pnpm install
    
    print_step "Building API..."
    cd api
    pnpm build
    cd ..
    
    print_step "Building frontend..."
    cd app
    pnpm build
    cd ..
    
    print_success "Production build completed"
}

# Run database migrations
run_migrations() {
    print_header "Running Database Migrations"
    
    print_step "Pushing database schema..."
    cd api
    pnpm prisma db push
    cd ..
    
    print_success "Database migrations completed"
}

# Health check
health_check() {
    print_header "Health Check"
    
    print_step "Checking API health..."
    if curl -f http://localhost:3001/health &> /dev/null; then
        print_success "API is healthy"
    else
        print_error "API health check failed"
    fi
    
    print_step "Checking frontend..."
    if curl -f http://localhost:3000 &> /dev/null; then
        print_success "Frontend is accessible"
    else
        print_error "Frontend health check failed"
    fi
}

# Main menu
show_menu() {
    echo -e "\n${BLUE}🚀 LaunchKit Deployment Options${NC}"
    echo -e "1. Deploy to Vercel (Frontend)"
    echo -e "2. Deploy to Railway (Full-stack)"
    echo -e "3. Deploy with Docker (Local/Server)"
    echo -e "4. Setup production build"
    echo -e "5. Run database migrations"
    echo -e "6. Health check"
    echo -e "7. Full deployment (Docker + Migrations + Health check)"
    echo -e "0. Exit"
    echo -ne "\nSelect an option: "
}

# Main execution
main() {
    print_header "LaunchKit Deployment Script"
    
    check_requirements
    
    while true; do
        show_menu
        read -r choice
        
        case $choice in
            1)
                deploy_vercel
                ;;
            2)
                deploy_railway
                ;;
            3)
                deploy_docker
                ;;
            4)
                setup_production
                ;;
            5)
                run_migrations
                ;;
            6)
                health_check
                ;;
            7)
                setup_production
                run_migrations
                deploy_docker
                sleep 10
                health_check
                ;;
            0)
                print_success "Goodbye!"
                exit 0
                ;;
            *)
                print_error "Invalid option. Please try again."
                ;;
        esac
        
        echo -e "\nPress Enter to continue..."
        read -r
    done
}

# Run main function
main "$@"
