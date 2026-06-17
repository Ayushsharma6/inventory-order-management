# Inventory & Order Management System

Production-ready full-stack Inventory & Order Management System for managing products, customers, orders, and inventory stock levels.

The project is built with React, FastAPI, PostgreSQL, Docker, and Docker Compose. It includes a responsive frontend, validated backend APIs, stock-safe order creation, production-style containers, environment-based configuration, and deployment instructions for free hosting platforms.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React, Vite, JavaScript, Axios |
| Backend | Python 3.12, FastAPI, SQLAlchemy, Pydantic |
| Database | PostgreSQL 16 |
| Containers | Docker |
| Orchestration | Docker Compose |
| Version Control | Git / GitHub |

## Features

### Dashboard

- Total products
- Total customers
- Total orders
- Low-stock products

### Product Management

- Create products
- View product list
- View one product by ID through API
- Update product details
- Delete products
- Unique SKU enforcement
- Positive price validation
- Non-negative stock validation

### Customer Management

- Create customers
- View customer list
- View one customer by ID through API
- Delete customers
- Unique email enforcement
- Email validation and normalization

### Order Management

- Create orders for one customer
- Add one or more product line items
- Backend calculates total amount automatically
- Backend validates inventory before creating an order
- Stock is reduced automatically after successful order creation
- Delete/cancel an order and restore product stock
- View order list and order details

## Business Rules Implemented

- Product SKU/code must be unique.
- Customer email must be unique.
- Product quantity cannot be negative.
- Product price must be greater than zero.
- Orders cannot be placed when inventory is insufficient.
- Creating an order automatically reduces available stock.
- Deleting/canceling an order restores stock.
- Order totals are calculated by the backend only.
- All request bodies are validated before processing.
- APIs return clear errors with appropriate HTTP status codes.
- Order creation uses a database transaction and row locking where supported by the database.

## API Endpoints

### Health

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/` | API metadata |
| GET | `/health` | API and database health check |

### Products

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/products` | Create a product |
| GET | `/products` | Retrieve all products |
| GET | `/products/{id}` | Retrieve one product by ID |
| PUT | `/products/{id}` | Update product details |
| DELETE | `/products/{id}` | Delete a product |

### Customers

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/customers` | Create a customer |
| GET | `/customers` | Retrieve all customers |
| GET | `/customers/{id}` | Retrieve one customer by ID |
| DELETE | `/customers/{id}` | Delete a customer |

### Orders

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/orders` | Create an order |
| GET | `/orders` | Retrieve all orders |
| GET | `/orders/{id}` | Retrieve order details by ID |
| DELETE | `/orders/{id}` | Cancel/delete an order and restore stock |

### Dashboard

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/dashboard` | Retrieve dashboard summary data |

## Project Structure

```text
inventory-order-management/
├── backend/
│   ├── app/
│   │   ├── config.py
│   │   ├── crud.py
│   │   ├── database.py
│   │   ├── main.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   └── routers/
│   │       ├── customers.py
│   │       ├── dashboard.py
│   │       ├── orders.py
│   │       └── products.py
│   ├── tests/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── requirements-dev.txt
│   └── .dockerignore
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── styles.css
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── netlify.toml
│   ├── vercel.json
│   ├── package.json
│   └── .dockerignore
├── docs/
│   ├── ASSESSMENT_CHECKLIST.md
│   └── DEPLOYMENT.md
├── .github/workflows/ci.yml
├── .dockerignore
├── .env.example
├── docker-compose.yml
├── docker-compose.prod.yml
├── render.yaml
├── SUBMISSION.md
└── README.md
```

## Local Docker Compose Setup

### 1. Create environment file

```bash
cp .env.example .env
```

Edit `.env` and replace `replace-with-a-strong-password` with a real strong local password.

### 2. Build and run the full system

```bash
docker compose up --build
```

### 3. Open the app

- Frontend: <http://localhost:8080>
- Backend API: <http://localhost:8000>
- API docs: <http://localhost:8000/docs>
- Health check: <http://localhost:8000/health>

### 4. Stop the app

```bash
docker compose down
```

### 5. Stop and remove database volume

```bash
docker compose down -v
```

## Local Development Without Docker

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements-dev.txt
cp .env.example .env
# Edit backend/.env so DATABASE_URL points to your local PostgreSQL database.
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev -- --host 0.0.0.0 --port 5173
```

## Environment Variables

Root `.env` for Docker Compose:

```env
POSTGRES_DB=inventory_db
POSTGRES_USER=inventory_app
POSTGRES_PASSWORD=replace-with-a-strong-password
DATABASE_URL=postgresql://inventory_app:replace-with-a-strong-password@postgres:5432/inventory_db
VITE_API_URL=http://localhost:8000
CORS_ORIGINS=http://localhost:8080,http://localhost:5173
```

For deployed environments:

- `DATABASE_URL`: hosted PostgreSQL connection string.
- `CORS_ORIGINS`: deployed frontend origin, for example `https://your-frontend.vercel.app`.
- `VITE_API_URL`: deployed backend API URL, for example `https://your-backend.onrender.com`.
- `PORT`: backend port if required by the hosting provider.

## Production Docker Details

### Backend image

- Uses `python:3.12-slim`.
- Runs as a non-root user.
- Uses environment variables instead of hardcoded credentials.
- Includes a `/health` healthcheck that verifies database connectivity.
- Exposes port `8000`.

### Frontend image

- Uses a Node build stage.
- Runs the compiled React app through Nginx.
- Does not use the Vite development server in production.
- Includes SPA fallback routing.
- Exposes port `80`.

## Docker Hub Build and Push

Replace `your-dockerhub-username` with your Docker Hub username.

```bash
docker build -t your-dockerhub-username/inventory-backend:latest ./backend
docker push your-dockerhub-username/inventory-backend:latest
```

Optional frontend image:

```bash
docker build \
  --build-arg VITE_API_URL=https://your-backend-url.example.com \
  -t your-dockerhub-username/inventory-frontend:latest \
  ./frontend

docker push your-dockerhub-username/inventory-frontend:latest
```

## Tests

Backend tests cover the core assessment business flow.

```bash
cd backend
pip install -r requirements-dev.txt
pytest -q
```

The included GitHub Actions workflow runs backend tests and frontend build checks on pushes and pull requests.

## Deployment

Detailed deployment steps are in [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

Included deployment helper files:

- `render.yaml` for Render-style backend deployment setup.
- `frontend/vercel.json` for Vercel frontend deployment.
- `frontend/netlify.toml` for Netlify frontend deployment.

After deployment, update [`SUBMISSION.md`](SUBMISSION.md) with:

- GitHub repository link
- Docker Hub backend image link
- Live frontend deployment URL
- Live backend API URL

## Assessment Compliance

See [`docs/ASSESSMENT_CHECKLIST.md`](docs/ASSESSMENT_CHECKLIST.md) for the requirement-by-requirement checklist.

## Submission Note

The source code and container/deployment configuration are ready for submission. The final assessment still requires public URLs, which must be created from your own GitHub, Docker Hub, and hosting accounts and then pasted into `SUBMISSION.md`.
