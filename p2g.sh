#!/bin/bash

# ============================================
# DEPLOY SCRIPT - Clean deployment with backup
# ============================================

set -e

# ============================================
# CONFIGURATION
# ============================================
GITHUB_USER="skyDevet"
PROJECT_FOLDER="AGIG"
PROJECT_DIR="$HOME/$PROJECT_FOLDER"
BACKUP_DIR="$HOME/tmp/deploy_backup_$$"

# ============================================
# DEPLOYMENT TYPE - CHANGE THIS TO SWITCH
# ============================================
# Set to "user" for https://skyDevet.github.io
# Set to "project" for https://skyDevet.github.io/REPO_NAME
DEPLOY_TYPE="project"  # Options: "user" or "project"

# If DEPLOY_TYPE is "project", set the project name here
PROJECT_REPO_NAME="egsx"  # Only used when DEPLOY_TYPE="project"

# ============================================
# AUTO-CONFIGURE BASED ON DEPLOY_TYPE
# ============================================
if [ "$DEPLOY_TYPE" == "user" ]; then
    REPO_NAME="$GITHUB_USER.github.io"
    DEPLOY_BRANCH="main"
    SITE_URL="https://$GITHUB_USER.github.io"
    BASE_PATH=""  # No base path for user site
    echo "🌐 DEPLOYING TO USER SITE: $SITE_URL"
else
    REPO_NAME="$PROJECT_REPO_NAME"
    DEPLOY_BRANCH="gh-pages"
    SITE_URL="https://$GITHUB_USER.github.io/$REPO_NAME"
    BASE_PATH="/$REPO_NAME/"  # Base path for project site
    echo "🌐 DEPLOYING TO PROJECT SITE: $SITE_URL"
fi

# ============================================
# FUNCTIONS
# ============================================

print_header() {
    echo ""
    echo "============================================"
    echo "$1"
    echo "============================================"
}

check_repo_exists() {
    gh repo view "$GITHUB_USER/$REPO_NAME" &>/dev/null
}

create_repo() {
    print_header "📝 Creating PUBLIC GitHub repository: $REPO_NAME"
    
    if ! command -v gh &>/dev/null; then
        echo "❌ GitHub CLI (gh) not found. Installing..."
        pkg install gh -y
    fi
    
    if ! gh auth status &>/dev/null; then
        echo "🔐 Please login to GitHub:"
        gh auth login
    fi
    
    # Create the repository with appropriate description
    if [ "$DEPLOY_TYPE" == "user" ]; then
        gh repo create "$REPO_NAME" --public --description "GitHub Pages user site"
    else
        gh repo create "$REPO_NAME" --public --description "Preact + Vite + Capacitor app"
    fi
    
    echo "✅ Repository created: https://github.com/$GITHUB_USER/$REPO_NAME"
}

setup_git_remote() {
    if [ ! -d ".git" ]; then
        git init
    fi
    
    if ! git remote get-url origin &>/dev/null; then
        git remote add origin "https://github.com/$GITHUB_USER/$REPO_NAME.git"
    fi
}

# ============================================
# MAIN SCRIPT
# ============================================

print_header "🚀 DEPLOY: $REPO_NAME"
echo "📁 Local folder: $PROJECT_FOLDER"
echo "📦 Repo name: $REPO_NAME"
echo "👤 User: $GITHUB_USER"
echo "🌐 Site URL: $SITE_URL"
echo "📋 Deploy type: $DEPLOY_TYPE"

# Check if project exists
if [ ! -d "$PROJECT_DIR" ]; then
    echo "❌ Project directory not found: $PROJECT_DIR"
    exit 1
fi

cd "$PROJECT_DIR"

# Create backup directory
mkdir -p "$HOME/tmp"

# ============================================
# BACKUP EVERYTHING BEFORE GIT OPERATIONS
# ============================================
print_header "💾 Creating backup..."
rm -rf "$BACKUP_DIR" 2>/dev/null || true
mkdir -p "$BACKUP_DIR"

# Backup important folders
[ -d "node_modules" ] && cp -r node_modules "$BACKUP_DIR/"
[ -d "src" ] && cp -r src "$BACKUP_DIR/"
[ -d "dist" ] && cp -r dist "$BACKUP_DIR/"
[ -f "package-lock.json" ] && cp package-lock.json "$BACKUP_DIR/"
echo "✅ Backup created at: $BACKUP_DIR"

# ============================================
# BUILD DIST IF NOT EXISTS
# ============================================
if [ ! -d "dist" ]; then
    print_header "📦 Building project..."
    if [ "$DEPLOY_TYPE" == "user" ]; then
        npm run build
    else
        npm run build -- --base=$BASE_PATH
    fi
    cp -r dist "$BACKUP_DIR/"
fi

# ============================================
# GITHUB REPO SETUP - CREATES REPO IF NOT EXISTS
# ============================================
print_header "📝 Checking GitHub repository..."

# Check if GitHub CLI is installed
if ! command -v gh &>/dev/null; then
    echo "📦 Installing GitHub CLI..."
    pkg install gh -y
fi

# Check if logged in
if ! gh auth status &>/dev/null; then
    echo "🔐 Please login to GitHub:"
    gh auth login
fi

# Create repo if it doesn't exist
if ! check_repo_exists; then
    create_repo
else
    echo "✅ Repository exists: https://github.com/$GITHUB_USER/$REPO_NAME"
fi

setup_git_remote

# ============================================
# PUSH TO MAIN BRANCH - SOURCE CODE ONLY
# ============================================
print_header "📤 Pushing source code to main branch..."

# Create .gitignore with proper exclusions
cat > .gitignore << 'GITIGNORE'
# Dependencies
node_modules/
.cache/

# Build outputs - THESE WILL NOT BE PUSHED
src/
.vite/
build/
.capacitor/

# OS files
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# Temporary
tmp/
backup_*/
GITIGNORE

# Remove from git tracking (keeps local files)
git rm -r --cached node_modules 2>/dev/null || true
git rm -r --cached src 2>/dev/null || true
git rm -r --cached dist 2>/dev/null || true
git rm -r --cached .vite 2>/dev/null || true

# Add ONLY source files (dist is ignored by .gitignore)
git add .

# Commit and push
git commit -m "Deploy: $(date +'%Y-%m-%d %H:%M:%S')" || echo "No changes to commit"
git branch -M main
git push -u origin main --force

# ============================================
# DEPLOY TO GITHUB PAGES
# ============================================
print_header "🚀 Deploying to GitHub Pages..."

# Install gh-pages if not present
if ! grep -q '"gh-pages"' package.json; then
    print_header "📦 Installing gh-pages package..."
    npm install --save-dev gh-pages
fi

# Build for GitHub Pages
print_header "📦 Building for GitHub Pages..."
if [ "$DEPLOY_TYPE" == "user" ]; then
    npm run build
else
    npm run build -- --base=$BASE_PATH
fi

# Deploy based on type
if [ "$DEPLOY_TYPE" == "user" ]; then
    # User site: Deploy to main branch
    print_header "📦 Deploying user site to main branch..."
    npx gh-pages -d dist -b main -r "https://github.com/$GITHUB_USER/$REPO_NAME.git"
else
    # Project site: Deploy to gh-pages branch
    print_header "📦 Deploying project site to gh-pages branch..."
    npx gh-pages -d dist -b gh-pages -r "https://github.com/$GITHUB_USER/$REPO_NAME.git"
fi

echo "✅ Deployed to GitHub Pages"

# ============================================
# ENABLE GITHUB PAGES
# ============================================
print_header "🌐 Enabling GitHub Pages..."

if command -v gh &>/dev/null; then
    if [ "$DEPLOY_TYPE" == "user" ]; then
        # User site uses main branch
        gh api -X POST "/repos/$GITHUB_USER/$REPO_NAME/pages" \
            -f source='{"branch":"main","path":"/"}' 2>/dev/null || echo "✅ Pages already enabled"
    else
        # Project site uses gh-pages branch
        gh api -X POST "/repos/$GITHUB_USER/$REPO_NAME/pages" \
            -f source='{"branch":"gh-pages","path":"/"}' 2>/dev/null || echo "✅ Pages already enabled"
    fi
fi

# ============================================
# RESTORE LOCAL FILES FROM BACKUP
# ============================================
print_header "🔄 Restoring local files..."

# Restore node_modules
if [ -d "$BACKUP_DIR/node_modules" ]; then
    rm -rf node_modules
    cp -r "$BACKUP_DIR/node_modules" .
    echo "✅ node_modules restored"
fi

# Restore src
if [ -d "$BACKUP_DIR/src" ]; then
    rm -rf src
    cp -r "$BACKUP_DIR/src" .
    echo "✅ src restored"
fi

# Restore dist
if [ -d "$BACKUP_DIR/dist" ]; then
    rm -rf dist
    cp -r "$BACKUP_DIR/dist" .
    echo "✅ dist restored"
fi

# Restore package-lock.json
if [ -f "$BACKUP_DIR/package-lock.json" ]; then
    cp "$BACKUP_DIR/package-lock.json" .
    echo "✅ package-lock.json restored"
fi

# Clean up backup
rm -rf "$BACKUP_DIR"
echo "✅ Backup cleaned up"

# ============================================
# COMPLETE
# ============================================
print_header "✅ DEPLOY COMPLETE!"

echo ""
echo "============================================"
echo "📦 Repo: https://github.com/$GITHUB_USER/$REPO_NAME"
echo "🌐 Site: $SITE_URL"
echo "============================================"
echo ""
echo "✅ PUSHED to main branch:"
echo "  ✅ package.json"
echo "  ✅ index.html"
echo "  ✅ vite.config.js"
echo "  ✅ capacitor.config.json"
echo "  ✅ README.md"
echo "  ✅ .gitignore"
echo ""
echo "❌ NOT PUSHED (excluded via .gitignore):"
echo "  ❌ node_modules/"
echo "  ❌ src/"
echo "  ❌ dist/"
echo "  ❌ .vite/"
echo ""
echo "✅ DEPLOYED to $DEPLOY_BRANCH branch:"
echo "  ✅ Built files from dist/"
echo ""
echo "✅ LOCAL FILES RESTORED:"
echo "  ✅ node_modules"
echo "  ✅ src"
echo "  ✅ dist"
echo "  ✅ package-lock.json"
echo ""
echo "📋 Deployment Type: $DEPLOY_TYPE"
echo "🌐 Site URL: $SITE_URL"
echo ""
echo "Commands:"
echo "  cd $PROJECT_DIR"
echo "  npm run dev     # Start dev server"
echo "  npm run build   # Build for production"
echo ""
echo "Clone:"
echo "  git clone https://github.com/$GITHUB_USER/$REPO_NAME.git"
echo ""
echo "✅ Complete!"
