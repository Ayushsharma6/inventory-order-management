# Deployment Guide

This guide explains how to publish the final project and complete the assessment submission links.

## 1. Push to GitHub

```bash
git init
git add .
git commit -m "Complete inventory order management system"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/inventory-order-management.git
git push -u origin main
```

Copy the repository URL into `SUBMISSION.md`.

## 2. Push Backend Image to Docker Hub

```bash
docker login
docker build -t YOUR_DOCKERHUB_USERNAME/inventory-backend:latest ./backend
docker push YOUR_DOCKERHUB_USERNAME/inventory-backend:latest
```

Copy the Docker Hub image URL into `SUBMISSION.md`.

## 3. Deploy Backend

Use one of the accepted platforms: Render, Railway, or Fly.io.

### Backend environment variables

Set these variables on the backend hosting platform:

```env
DATABASE_URL=your-hosted-postgresql-url
CORS_ORIGINS=https://your-live-frontend-url
ENVIRONMENT=production
PORT=8000
```

Some platforms provide a dynamic `PORT`. If they do, use the platform's recommended port variable and keep the backend command equivalent to:

```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

### Backend health check

After deployment, verify:

```text
https://your-backend-url/health
```

Expected response:

```json
{"status":"ok","database":"ok"}
```

Copy the live backend URL into `SUBMISSION.md`.

## 4. Deploy Frontend

Use one of the accepted platforms: Vercel or Netlify.

### Frontend environment variable

Set this variable on the frontend hosting platform:

```env
VITE_API_URL=https://your-live-backend-url
```

### Vercel settings

Use these project settings:

```text
Root directory: frontend
Build command: npm run build
Output directory: dist
```

The included `frontend/vercel.json` supports single-page app routing.

### Netlify settings

Use these project settings:

```text
Base directory: frontend
Build command: npm run build
Publish directory: dist
```

The included `frontend/netlify.toml` supports single-page app routing.

Copy the live frontend URL into `SUBMISSION.md`.

## 5. Final Connectivity Check

After both deployments are live:

1. Open the frontend URL.
2. Create a product.
3. Create a customer.
4. Create an order.
5. Confirm product stock decreases.
6. Try ordering more than available stock and confirm the backend rejects it.
7. Open the dashboard and confirm counts/low-stock data display.
8. Delete/cancel the order and confirm stock is restored.

## 6. Final Submission

Update `SUBMISSION.md` with:

- GitHub repository link
- Docker Hub backend image link
- Live frontend deployment URL
- Live backend API URL

Then submit those four links as required by the assessment.
