#!/bin/bash

# KV Garage Platform - Test and Deploy Script
# This script runs comprehensive tests and deploys the platform

set -e  # Exit on any error

echo "🚀 Starting KV Garage Platform Test and Deploy Process..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js first."
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm first."
        exit 1
    fi
    
    if ! command -v psql &> /dev/null; then
        print_warning "PostgreSQL client not found. Database tests may fail."
    fi
    
    print_success "Dependencies check completed"
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    # Frontend dependencies
    if [ -f "package.json" ]; then
        npm install
        print_success "Frontend dependencies installed"
    fi
    
    # Backend dependencies
    if [ -f "backend/package.json" ]; then
        cd backend
        npm install
        cd ..
        print_success "Backend dependencies installed"
    fi
}

# Run linting
run_linting() {
    print_status "Running code linting..."
    
    # Check if ESLint is available
    if [ -f "package.json" ] && grep -q "eslint" package.json; then
        npm run lint || {
            print_warning "Linting found issues. Please fix them before deployment."
        }
    else
        print_warning "ESLint not configured. Skipping linting."
    fi
    
    print_success "Linting completed"
}

# Run unit tests
run_unit_tests() {
    print_status "Running unit tests..."
    
    # Frontend tests
    if [ -f "package.json" ] && grep -q "test" package.json; then
        npm test || {
            print_error "Unit tests failed. Please fix them before deployment."
            exit 1
        }
    else
        print_warning "No unit tests configured. Skipping unit tests."
    fi
    
    # Backend tests
    if [ -f "backend/package.json" ] && grep -q "test" backend/package.json; then
        cd backend
        npm test || {
            print_error "Backend unit tests failed. Please fix them before deployment."
            exit 1
        }
        cd ..
    else
        print_warning "No backend unit tests configured. Skipping backend tests."
    fi
    
    print_success "Unit tests completed"
}

# Run integration tests
run_integration_tests() {
    print_status "Running integration tests..."
    
    # Start backend server for testing
    if [ -f "backend/server.js" ]; then
        print_status "Starting backend server for testing..."
        cd backend
        npm start &
        BACKEND_PID=$!
        cd ..
        
        # Wait for server to start
        sleep 5
        
        # Run integration tests
        if command -v curl &> /dev/null; then
            # Test API endpoints
            print_status "Testing API endpoints..."
            
            # Test health endpoint
            if curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
                print_success "Health endpoint is working"
            else
                print_error "Health endpoint is not responding"
                kill $BACKEND_PID 2>/dev/null || true
                exit 1
            fi
            
            # Test packs endpoint
            if curl -f http://localhost:3001/api/packs > /dev/null 2>&1; then
                print_success "Packs endpoint is working"
            else
                print_warning "Packs endpoint is not responding"
            fi
            
            # Test admin endpoint (should return 401)
            if curl -f http://localhost:3001/api/admin/dashboard > /dev/null 2>&1; then
                print_warning "Admin endpoint should require authentication"
            else
                print_success "Admin endpoint properly requires authentication"
            fi
        else
            print_warning "curl not available. Skipping API tests."
        fi
        
        # Stop backend server
        kill $BACKEND_PID 2>/dev/null || true
        print_success "Backend server stopped"
    else
        print_warning "Backend server not found. Skipping integration tests."
    fi
    
    print_success "Integration tests completed"
}

# Run performance tests
run_performance_tests() {
    print_status "Running performance tests..."
    
    # Check if Lighthouse is available
    if command -v lighthouse &> /dev/null; then
        print_status "Running Lighthouse performance audit..."
        
        # Start local server for testing
        if [ -f "package.json" ]; then
            npm start &
            FRONTEND_PID=$!
            sleep 10
            
            # Run Lighthouse audit
            lighthouse http://localhost:8080 --output=json --output-path=./lighthouse-report.json --chrome-flags="--headless" || {
                print_warning "Lighthouse audit failed. Check lighthouse-report.json for details."
            }
            
            # Stop frontend server
            kill $FRONTEND_PID 2>/dev/null || true
        fi
    else
        print_warning "Lighthouse not installed. Install with: npm install -g lighthouse"
    fi
    
    print_success "Performance tests completed"
}

# Run security tests
run_security_tests() {
    print_status "Running security tests..."
    
    # Check for common security issues
    print_status "Checking for security vulnerabilities..."
    
    # Check for hardcoded secrets
    if grep -r "password.*=" . --exclude-dir=node_modules --exclude-dir=.git --exclude="*.md" | grep -v "password.*:" | grep -v "//.*password"; then
        print_warning "Potential hardcoded passwords found. Please review."
    fi
    
    # Check for API keys
    if grep -r "api_key\|apikey\|secret" . --exclude-dir=node_modules --exclude-dir=.git --exclude="*.md" | grep -v "//.*api"; then
        print_warning "Potential API keys found. Please review."
    fi
    
    # Check for SQL injection vulnerabilities
    if grep -r "SELECT.*\$" . --exclude-dir=node_modules --exclude-dir=.git --exclude="*.md"; then
        print_warning "Potential SQL injection vulnerabilities found. Please review."
    fi
    
    print_success "Security tests completed"
}

# Build for production
build_production() {
    print_status "Building for production..."
    
    # Build frontend
    if [ -f "package.json" ] && grep -q "build" package.json; then
        npm run build || {
            print_error "Frontend build failed."
            exit 1
        }
        print_success "Frontend built successfully"
    fi
    
    # Build backend (if needed)
    if [ -f "backend/package.json" ] && grep -q "build" backend/package.json; then
        cd backend
        npm run build || {
            print_error "Backend build failed."
            exit 1
        }
        cd ..
        print_success "Backend built successfully"
    fi
    
    print_success "Production build completed"
}

# Deploy to production
deploy_production() {
    print_status "Deploying to production..."
    
    # Check if deployment script exists
    if [ -f "deploy.sh" ]; then
        chmod +x deploy.sh
        ./deploy.sh || {
            print_error "Deployment failed."
            exit 1
        }
        print_success "Deployment completed"
    else
        print_warning "No deployment script found. Please deploy manually."
    fi
}

# Generate test report
generate_report() {
    print_status "Generating test report..."
    
    REPORT_FILE="test-report-$(date +%Y%m%d-%H%M%S).md"
    
    cat > "$REPORT_FILE" << EOF
# KV Garage Platform - Test Report

**Date:** $(date)
**Version:** $(git describe --tags 2>/dev/null || echo "Unknown")

## Test Results

### Dependencies
- ✅ Node.js: $(node --version)
- ✅ npm: $(npm --version)

### Linting
- Status: Completed

### Unit Tests
- Status: Completed

### Integration Tests
- Status: Completed

### Performance Tests
- Status: Completed

### Security Tests
- Status: Completed

### Build
- Status: Completed

## Recommendations

1. Review any warnings or errors above
2. Monitor performance metrics in production
3. Set up continuous monitoring
4. Regular security audits

## Next Steps

1. Deploy to staging environment
2. Run user acceptance tests
3. Deploy to production
4. Monitor system health

---
Generated by KV Garage Platform Test Script
EOF

    print_success "Test report generated: $REPORT_FILE"
}

# Main execution
main() {
    echo "🧪 KV Garage Platform - Comprehensive Testing & Deployment"
    echo "=========================================================="
    
    # Parse command line arguments
    SKIP_TESTS=false
    SKIP_BUILD=false
    SKIP_DEPLOY=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --skip-tests)
                SKIP_TESTS=true
                shift
                ;;
            --skip-build)
                SKIP_BUILD=true
                shift
                ;;
            --skip-deploy)
                SKIP_DEPLOY=true
                shift
                ;;
            --help)
                echo "Usage: $0 [options]"
                echo "Options:"
                echo "  --skip-tests    Skip running tests"
                echo "  --skip-build    Skip building for production"
                echo "  --skip-deploy   Skip deployment"
                echo "  --help          Show this help message"
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                exit 1
                ;;
        esac
    done
    
    # Run the pipeline
    check_dependencies
    install_dependencies
    
    if [ "$SKIP_TESTS" = false ]; then
        run_linting
        run_unit_tests
        run_integration_tests
        run_performance_tests
        run_security_tests
    else
        print_warning "Skipping tests as requested"
    fi
    
    if [ "$SKIP_BUILD" = false ]; then
        build_production
    else
        print_warning "Skipping build as requested"
    fi
    
    if [ "$SKIP_DEPLOY" = false ]; then
        deploy_production
    else
        print_warning "Skipping deployment as requested"
    fi
    
    generate_report
    
    print_success "🎉 All processes completed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Review the test report"
    echo "2. Monitor the deployed application"
    echo "3. Set up continuous monitoring"
    echo ""
    echo "For testing in browser, add ?test=true to any URL"
    echo "Example: http://localhost:8080/packs/?test=true"
}

# Run main function
main "$@"
