from datetime import datetime
from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field, condecimal, conint, field_validator

PositiveMoney = condecimal(gt=0, max_digits=12, decimal_places=2)
NonNegativeStock = conint(ge=0)
PositiveQuantity = conint(gt=0)


def normalize_required_text(value: str) -> str:
    value = value.strip()
    if not value:
        raise ValueError("Value cannot be blank.")
    return value


def normalize_optional_text(value: Optional[str]) -> Optional[str]:
    if value is None:
        return None
    value = value.strip()
    return value or None


def normalize_optional_update_text(value: Optional[str]) -> Optional[str]:
    if value is None:
        return None
    return normalize_required_text(value)


class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    sku: str = Field(..., min_length=1, max_length=100)
    price: PositiveMoney
    quantity_in_stock: NonNegativeStock

    @field_validator("name", mode="before")
    @classmethod
    def strip_name(cls, value: str) -> str:
        return normalize_required_text(value)

    @field_validator("sku", mode="before")
    @classmethod
    def normalize_sku(cls, value: str) -> str:
        return normalize_required_text(value).upper()


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    sku: Optional[str] = Field(None, min_length=1, max_length=100)
    price: Optional[PositiveMoney] = None
    quantity_in_stock: Optional[NonNegativeStock] = None

    @field_validator("name", mode="before")
    @classmethod
    def strip_name(cls, value: Optional[str]) -> Optional[str]:
        return normalize_optional_update_text(value)

    @field_validator("sku", mode="before")
    @classmethod
    def normalize_sku(cls, value: Optional[str]) -> Optional[str]:
        normalized = normalize_optional_update_text(value)
        return normalized.upper() if normalized else normalized


class ProductResponse(ProductBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime


class CustomerBase(BaseModel):
    full_name: str = Field(..., min_length=1, max_length=255)
    email: EmailStr
    phone: Optional[str] = Field(None, max_length=50)

    @field_validator("full_name", mode="before")
    @classmethod
    def strip_full_name(cls, value: str) -> str:
        return normalize_required_text(value)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: EmailStr) -> str:
        return str(value).strip().lower()

    @field_validator("phone", mode="before")
    @classmethod
    def strip_phone(cls, value: Optional[str]) -> Optional[str]:
        return normalize_optional_text(value)


class CustomerCreate(CustomerBase):
    pass


class CustomerResponse(CustomerBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime


class OrderItemCreate(BaseModel):
    product_id: int = Field(..., gt=0)
    quantity: PositiveQuantity


class OrderCreate(BaseModel):
    customer_id: int = Field(..., gt=0)
    items: List[OrderItemCreate] = Field(..., min_length=1)


class OrderItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    product_id: int
    quantity: int
    unit_price: Decimal
    line_total: Decimal
    product: Optional[ProductResponse] = None


class OrderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    customer_id: int
    total_amount: Decimal
    created_at: datetime
    customer: Optional[CustomerResponse] = None
    items: List[OrderItemResponse] = Field(default_factory=list)


class DashboardResponse(BaseModel):
    total_products: int
    total_customers: int
    total_orders: int
    low_stock_products: List[ProductResponse]


class HealthResponse(BaseModel):
    status: str
    database: str
