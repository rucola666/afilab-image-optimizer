# How to Deploy to GitHub Pages

Since this is a modern web application built with **Vite**, the best way to host it is using **GitHub Pages**.

## Prerequisites
1.  A GitHub account.
2.  Git installed on your computer.

## Step 1: Initialize Git
Run these commands in your project terminal:
```bash
# Initialize a new git repository
git init

# Create a .gitignore file (to exclude heavy folder)
echo "node_modules" > .gitignore
echo ".DS_Store" >> .gitignore
echo "dist" >> .gitignore

# Stage all your files
git add .

# Commit your changes
git commit -m "Initial commit of Image Optimizer"
```

## Step 2: Create a GitHub Repository
1.  Go to [github.com/new](https://github.com/new).
2.  Name it `image-optimizer` (or whatever you like).
3.  **Public** is usually easier (and free).
4.  Do **NOT** initialize with README or license (you have local files).
5.  Click **Create repository**.

## Step 3: Push Your Code
Copy the commands GitHub gives you under "…or push an existing repository from the command line". They will look like this:
```bash
git remote add origin https://github.com/YOUR_USERNAME/image-optimizer.git
git branch -M main
git push -u origin main
```

## Step 4: Configure GitHub Pages (The Easy Way)
Since this is a Vite app, we need to build it. We can set up a simplified workflow.

1.  In your project, create a new file: `.github/workflows/deploy.yml`
2.  Paste this content into it:

```yaml
name: Deploy static content to Pages

on:
  push:
    branches: ['main']
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: 'pages'
  cancel-in-progress: true

jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      - name: Set up Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - name: Install dependencies
        run: npm ci
      - name: Build
        run: npm run build
      - name: Setup Pages
        uses: actions/configure-pages@v4
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './dist'
      - name: Deploy to GitHub Pages
        uses: actions/deploy-pages@v4
```

3.  **Commit and Push** this new file:
```bash
git add .github/workflows/deploy.yml
git commit -m "Add deployment workflow"
git push
```

## Step 5: Activate
1.  Go to your Repository **Settings** > **Pages**.
2.  Under **Build and deployment** > **Source**, select **GitHub Actions**.
3.  The workflow should run automatically. In a few minutes, you will see your live URL!
