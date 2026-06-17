import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

os.environ.setdefault("DATABASE_URL", f"sqlite:///{Path(__file__).parent / 'test_inventory.db'}")
os.environ.setdefault("CORS_ORIGINS", "http://localhost:5173,http://localhost:8080")

from fastapi.testclient import TestClient

from app.database import Base, engine
from app.main import app


def setup_function():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)


def teardown_function():
    Base.metadata.drop_all(bind=engine)


def test_complete_inventory_order_flow():
    with TestClient(app) as client:
        product_response = client.post(
            "/products",
            json={
                "name": "Wireless Mouse",
                "sku": "mouse-001",
                "price": "25.50",
                "quantity_in_stock": 10,
            },
        )
        assert product_response.status_code == 201
        product = product_response.json()
        assert product["sku"] == "MOUSE-001"

        duplicate_sku_response = client.post(
            "/products",
            json={
                "name": "Duplicate Mouse",
                "sku": "MOUSE-001",
                "price": "20.00",
                "quantity_in_stock": 5,
            },
        )
        assert duplicate_sku_response.status_code == 409

        customer_response = client.post(
            "/customers",
            json={
                "full_name": "Alex Morgan",
                "email": "ALEX@example.com",
                "phone": "+1 555 123 4567",
            },
        )
        assert customer_response.status_code == 201
        customer = customer_response.json()
        assert customer["email"] == "alex@example.com"

        duplicate_email_response = client.post(
            "/customers",
            json={
                "full_name": "Alex Duplicate",
                "email": "alex@example.com",
                "phone": "+1 555 000 0000",
            },
        )
        assert duplicate_email_response.status_code == 409

        order_response = client.post(
            "/orders",
            json={
                "customer_id": customer["id"],
                "items": [{"product_id": product["id"], "quantity": 3}],
            },
        )
        assert order_response.status_code == 201
        order = order_response.json()
        assert float(order["total_amount"]) == 76.5
        assert order["items"][0]["quantity"] == 3

        stock_after_order = client.get(f"/products/{product['id']}").json()["quantity_in_stock"]
        assert stock_after_order == 7

        insufficient_response = client.post(
            "/orders",
            json={
                "customer_id": customer["id"],
                "items": [{"product_id": product["id"], "quantity": 99}],
            },
        )
        assert insufficient_response.status_code == 409

        delete_order_response = client.delete(f"/orders/{order['id']}")
        assert delete_order_response.status_code == 204

        restored_stock = client.get(f"/products/{product['id']}").json()["quantity_in_stock"]
        assert restored_stock == 10

        dashboard_response = client.get("/dashboard")
        assert dashboard_response.status_code == 200
        dashboard = dashboard_response.json()
        assert dashboard["total_products"] == 1
        assert dashboard["total_customers"] == 1
        assert dashboard["total_orders"] == 0
