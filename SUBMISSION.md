# Submission Links

Replace each placeholder after pushing and deploying the project.

| Required deliverable | Link |
| --- | --- |
| GitHub repository link | `PASTE_GITHUB_REPOSITORY_URL_HERE` |
| Docker Hub backend image link | `PASTE_DOCKER_HUB_BACKEND_IMAGE_URL_HERE` |
| Live frontend deployment URL | `PASTE_LIVE_FRONTEND_URL_HERE` |
| Live backend API URL | `PASTE_LIVE_BACKEND_API_URL_HERE` |

## Pre-Submission Verification

- [ ] GitHub repository contains the full frontend and backend source code.
- [ ] Backend Docker image is pushed to Docker Hub.
- [ ] Frontend is deployed and publicly accessible.
- [ ] Backend API is deployed and publicly accessible.
- [ ] Backend `/health` returns `{"status":"ok","database":"ok"}`.
- [ ] Frontend `VITE_API_URL` points to the deployed backend URL.
- [ ] Backend `CORS_ORIGINS` includes the deployed frontend URL.
- [ ] Product create/list/update/delete works online.
- [ ] Customer create/list/delete works online.
- [ ] Order create/list/details/delete works online.
- [ ] Creating an order reduces stock.
- [ ] Insufficient inventory is rejected.
- [ ] Dashboard counts and low-stock products load online.
