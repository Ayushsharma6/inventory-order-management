from collections import defaultdict
from decimal import Decimal
from typing import Iterable, List, Optional

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from . import models, schemas

LOW_STOCK_THRESHOLD = 5


class NotFoundError(Exception):
    pass


class ConflictError(Exception):
    pass


class InsufficientStockError(Exception):
    pass


def _handle_integrity_error(db: Session, exc: IntegrityError, duplicate_message: str) -> None:
    db.rollback()
    raise ConflictError(duplicate_message) from exc


# Products

def create_product(db: Session, product: schemas.ProductCreate) -> models.Product:
    db_product = models.Product(**product.model_dump())
    db.add(db_product)
    try:
        db.commit()
        db.refresh(db_product)
        return db_product
    except IntegrityError as exc:
        _handle_integrity_error(db, exc, "Product SKU already exists.")


def list_products(db: Session) -> List[models.Product]:
    return db.scalars(select(models.Product).order_by(models.Product.id)).all()


def get_product(db: Session, product_id: int) -> models.Product:
    product = db.get(models.Product, product_id)
    if not product:
        raise NotFoundError("Product not found.")
    return product


def update_product(db: Session, product_id: int, product_update: schemas.ProductUpdate) -> models.Product:
    product = get_product(db, product_id)
    update_data = product_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(product, key, value)
    try:
        db.commit()
        db.refresh(product)
        return product
    except IntegrityError as exc:
        _handle_integrity_error(db, exc, "Product SKU already exists.")


def delete_product(db: Session, product_id: int) -> None:
    product = get_product(db, product_id)
    db.delete(product)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise ConflictError("Product cannot be deleted because it is used in one or more orders.") from exc


# Customers

def create_customer(db: Session, customer: schemas.CustomerCreate) -> models.Customer:
    db_customer = models.Customer(**customer.model_dump())
    db.add(db_customer)
    try:
        db.commit()
        db.refresh(db_customer)
        return db_customer
    except IntegrityError as exc:
        _handle_integrity_error(db, exc, "Customer email already exists.")


def list_customers(db: Session) -> List[models.Customer]:
    return db.scalars(select(models.Customer).order_by(models.Customer.id)).all()


def get_customer(db: Session, customer_id: int) -> models.Customer:
    customer = db.get(models.Customer, customer_id)
    if not customer:
        raise NotFoundError("Customer not found.")
    return customer


def delete_customer(db: Session, customer_id: int) -> None:
    customer = db.scalars(
        select(models.Customer)
        .options(joinedload(models.Customer.orders).joinedload(models.Order.items))
        .where(models.Customer.id == customer_id)
    ).unique().first()
    if not customer:
        raise NotFoundError("Customer not found.")

    # Keep inventory consistent if a customer and their historical orders are removed.
    for order in customer.orders:
        for item in order.items:
            product = db.get(models.Product, item.product_id)
            if product:
                product.quantity_in_stock += item.quantity

    db.delete(customer)
    db.commit()


# Orders

def create_order(db: Session, order_in: schemas.OrderCreate) -> models.Order:
    try:
        customer = db.get(models.Customer, order_in.customer_id)
        if not customer:
            raise NotFoundError("Customer not found.")

        quantities_by_product_id: dict[int, int] = defaultdict(int)
        for item in order_in.items:
            quantities_by_product_id[item.product_id] += int(item.quantity)

        product_ids = list(quantities_by_product_id.keys())
        products = db.scalars(
            select(models.Product)
            .where(models.Product.id.in_(product_ids))
            .with_for_update()
        ).all()
        products_by_id = {product.id: product for product in products}

        missing_ids = sorted(set(product_ids) - set(products_by_id.keys()))
        if missing_ids:
            raise NotFoundError(f"Product not found: {missing_ids[0]}.")

        for product_id, requested_quantity in quantities_by_product_id.items():
            product = products_by_id[product_id]
            if product.quantity_in_stock < requested_quantity:
                raise InsufficientStockError(
                    f"Insufficient stock for product '{product.name}' (SKU: {product.sku}). "
                    f"Requested {requested_quantity}, available {product.quantity_in_stock}."
                )

        order = models.Order(customer_id=order_in.customer_id, total_amount=Decimal("0.00"))
        db.add(order)
        db.flush()

        total_amount = Decimal("0.00")
        for product_id, requested_quantity in quantities_by_product_id.items():
            product = products_by_id[product_id]
            unit_price = Decimal(product.price)
            line_total = unit_price * Decimal(requested_quantity)
            product.quantity_in_stock -= requested_quantity
            db.add(
                models.OrderItem(
                    order_id=order.id,
                    product_id=product.id,
                    quantity=requested_quantity,
                    unit_price=unit_price,
                    line_total=line_total,
                )
            )
            total_amount += line_total

        order.total_amount = total_amount
        db.commit()
        return get_order(db, order.id)
    except (NotFoundError, InsufficientStockError):
        db.rollback()
        raise
    except IntegrityError as exc:
        db.rollback()
        raise ConflictError("Order could not be created due to a database constraint.") from exc


def list_orders(db: Session) -> List[models.Order]:
    return db.scalars(
        select(models.Order)
        .options(joinedload(models.Order.customer), joinedload(models.Order.items).joinedload(models.OrderItem.product))
        .order_by(models.Order.id.desc())
    ).unique().all()


def get_order(db: Session, order_id: int) -> models.Order:
    order = db.scalars(
        select(models.Order)
        .options(joinedload(models.Order.customer), joinedload(models.Order.items).joinedload(models.OrderItem.product))
        .where(models.Order.id == order_id)
    ).unique().first()
    if not order:
        raise NotFoundError("Order not found.")
    return order


def delete_order(db: Session, order_id: int) -> None:
    try:
        order = get_order(db, order_id)
        for item in order.items:
            product = db.get(models.Product, item.product_id)
            if product:
                product.quantity_in_stock += item.quantity
        db.delete(order)
        db.commit()
    except NotFoundError:
        db.rollback()
        raise


# Dashboard

def get_dashboard(db: Session) -> dict:
    total_products = db.scalar(select(func.count(models.Product.id))) or 0
    total_customers = db.scalar(select(func.count(models.Customer.id))) or 0
    total_orders = db.scalar(select(func.count(models.Order.id))) or 0
    low_stock_products = db.scalars(
        select(models.Product)
        .where(models.Product.quantity_in_stock <= LOW_STOCK_THRESHOLD)
        .order_by(models.Product.quantity_in_stock.asc(), models.Product.name.asc())
    ).all()
    return {
        "total_products": total_products,
        "total_customers": total_customers,
        "total_orders": total_orders,
        "low_stock_products": low_stock_products,
    }
