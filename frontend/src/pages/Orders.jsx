import { useEffect, useMemo, useState } from 'react';
import { customersApi, getErrorMessage, ordersApi, productsApi } from '../api/api.js';
import Alert from '../components/Alert.jsx';
import EmptyState from '../components/EmptyState.jsx';
import Loader from '../components/Loader.jsx';
import { formatCurrency, formatDateTime } from '../utils/formatters.js';

const emptyItem = { product_id: '', quantity: 1 };

export default function Orders() {
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [customerId, setCustomerId] = useState('');
  const [items, setItems] = useState([{ ...emptyItem }]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const productMap = useMemo(() => {
    return products.reduce((acc, product) => {
      acc[product.id] = product;
      return acc;
    }, {});
  }, [products]);

  const orderPreview = useMemo(() => {
    return items.reduce((total, item) => {
      const product = productMap[item.product_id];
      if (!product) return total;
      return total + Number(product.price) * Number(item.quantity || 0);
    }, 0);
  }, [items, productMap]);

  const selectedCustomer = useMemo(
    () => customers.find((customer) => Number(customer.id) === Number(customerId)),
    [customers, customerId],
  );

  async function loadData() {
    try {
      setLoading(true);
      const [customersResponse, productsResponse, ordersResponse] = await Promise.all([
        customersApi.list(),
        productsApi.list(),
        ordersApi.list(),
      ]);
      setCustomers(customersResponse.data);
      setProducts(productsResponse.data);
      setOrders(ordersResponse.data);
    } catch (err) {
      setMessage({ type: 'error', text: getErrorMessage(err) });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function updateItem(index, field, value) {
    setItems((current) => current.map((item, itemIndex) => (
      itemIndex === index ? { ...item, [field]: value } : item
    )));
  }

  function addItem() {
    setItems((current) => [...current, { ...emptyItem }]);
  }

  function removeItem(index) {
    setItems((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  function validateOrder() {
    if (!customerId) return 'Select a customer.';
    if (items.length === 0) return 'Add at least one product.';
    for (const item of items) {
      if (!item.product_id) return 'Select a product for every line item.';
      if (Number(item.quantity) <= 0) return 'Quantity must be greater than zero.';
      const product = productMap[item.product_id];
      if (product && Number(item.quantity) > Number(product.quantity_in_stock)) {
        return `${product.name} has only ${product.quantity_in_stock} unit(s) available.`;
      }
    }
    return '';
  }

  async function submitOrder(event) {
    event.preventDefault();
    const validationError = validateOrder();
    if (validationError) {
      setMessage({ type: 'error', text: validationError });
      return;
    }

    const payload = {
      customer_id: Number(customerId),
      items: items.map((item) => ({
        product_id: Number(item.product_id),
        quantity: Number(item.quantity),
      })),
    };

    try {
      setSaving(true);
      const response = await ordersApi.create(payload);
      setMessage({ type: 'success', text: `Order created. Backend total: ${formatCurrency(response.data.total_amount)}.` });
      setCustomerId('');
      setItems([{ ...emptyItem }]);
      setSelectedOrder(response.data);
      await loadData();
    } catch (err) {
      setMessage({ type: 'error', text: getErrorMessage(err) });
    } finally {
      setSaving(false);
    }
  }

  async function deleteOrder(orderId) {
    const confirmed = window.confirm('Delete this order and restore product stock?');
    if (!confirmed) return;

    try {
      await ordersApi.remove(orderId);
      setMessage({ type: 'success', text: 'Order deleted and stock restored.' });
      setSelectedOrder(null);
      await loadData();
    } catch (err) {
      setMessage({ type: 'error', text: getErrorMessage(err) });
    }
  }

  return (
    <section className="page orders-page">
      <div className="page-intro">
        <div>
          <p className="eyebrow">Order desk</p>
          <h1>Create orders with automatic stock deduction.</h1>
          <p>The backend calculates totals and blocks requests when inventory is insufficient.</p>
        </div>
        <div className="mini-metrics">
          <div><span>{orders.length}</span><small>Orders</small></div>
          <div><span>{products.length}</span><small>Products</small></div>
          <div><span>{customers.length}</span><small>Customers</small></div>
        </div>
      </div>

      <Alert type={message.type} message={message.text} onClose={() => setMessage({ type: '', text: '' })} />

      {loading ? (
        <Loader label="Loading order workspace" />
      ) : (
        <div className="grid two-columns order-layout">
          <form className="card form-card elevated-form" onSubmit={submitOrder}>
            <div className="section-heading">
              <div>
                <p className="eyebrow">New order</p>
                <h3>Build order</h3>
              </div>
              <span className="badge neutral">{items.length} line item{items.length === 1 ? '' : 's'}</span>
            </div>

            <label>
              Customer
              <select value={customerId} onChange={(event) => setCustomerId(event.target.value)} required>
                <option value="">Select customer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>{customer.full_name} ({customer.email})</option>
                ))}
              </select>
            </label>

            <div className="line-items">
              <div className="line-items-header">
                <div>
                  <p className="eyebrow">Order items</p>
                  <h4>Products</h4>
                </div>
                <button type="button" className="secondary small" onClick={addItem}>Add product</button>
              </div>

              {items.map((item, index) => {
                const selectedProduct = productMap[item.product_id];
                const lineTotal = selectedProduct ? Number(selectedProduct.price) * Number(item.quantity || 0) : 0;
                const overStock = selectedProduct && Number(item.quantity) > Number(selectedProduct.quantity_in_stock);

                return (
                  <div className={overStock ? 'line-item danger-line' : 'line-item'} key={`${index}-${item.product_id}`}>
                    <label>
                      Product
                      <select value={item.product_id} onChange={(event) => updateItem(index, 'product_id', event.target.value)} required>
                        <option value="">Select product</option>
                        {products.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name} - {product.sku} - stock {product.quantity_in_stock}
                          </option>
                        ))}
                      </select>
                    </label>
                    <div className="form-row compact-row">
                      <label>
                        Quantity
                        <input type="number" min="1" step="1" value={item.quantity} onChange={(event) => updateItem(index, 'quantity', event.target.value)} required />
                      </label>
                      <div className="line-total-card">
                        <span>Line total</span>
                        <strong>{formatCurrency(lineTotal)}</strong>
                      </div>
                    </div>
                    {selectedProduct && (
                      <p className={overStock ? 'small-text danger-copy' : 'muted small-text'}>
                        Unit price {formatCurrency(selectedProduct.price)} | {selectedProduct.quantity_in_stock} unit(s) available
                      </p>
                    )}
                    {items.length > 1 && (
                      <button type="button" className="danger small align-start" onClick={() => removeItem(index)}>Remove item</button>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="order-summary-panel">
              <div>
                <span>Customer</span>
                <strong>{selectedCustomer?.full_name || 'Not selected'}</strong>
              </div>
              <div>
                <span>Estimated total</span>
                <strong>{formatCurrency(orderPreview)}</strong>
              </div>
            </div>

            <button type="submit" disabled={saving || customers.length === 0 || products.length === 0}>
              {saving ? 'Creating order...' : 'Create order'}
            </button>
          </form>

          <div className="card content-card">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Recent sales</p>
                <h3>Orders</h3>
              </div>
              <span className="badge neutral">{orders.length} total</span>
            </div>

            {orders.length === 0 ? (
              <EmptyState title="No orders yet" description="Create an order after adding at least one customer and one product." />
            ) : (
              <div className="order-list">
                {orders.map((order) => (
                  <article className="order-card" key={order.id}>
                    <div className="order-card-main">
                      <span className="order-number">#{order.id}</span>
                      <div>
                        <strong>{order.customer?.full_name || `Customer #${order.customer_id}`}</strong>
                        <p>{formatDateTime(order.created_at)}</p>
                      </div>
                    </div>
                    <div className="order-actions">
                      <strong>{formatCurrency(order.total_amount)}</strong>
                      <button type="button" className="secondary small" onClick={() => setSelectedOrder(order)}>Details</button>
                      <button type="button" className="danger small" onClick={() => deleteOrder(order.id)}>Delete</button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {selectedOrder && (
        <div className="card order-details">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Order detail</p>
              <h3>Order #{selectedOrder.id}</h3>
            </div>
            <button type="button" className="secondary small" onClick={() => setSelectedOrder(null)}>Close</button>
          </div>
          <div className="detail-strip">
            <div><span>Customer</span><strong>{selectedOrder.customer?.full_name || selectedOrder.customer_id}</strong></div>
            <div><span>Total</span><strong>{formatCurrency(selectedOrder.total_amount)}</strong></div>
            <div><span>Items</span><strong>{selectedOrder.items.length}</strong></div>
          </div>
          <div className="table-wrapper modern-table">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Quantity</th>
                  <th>Unit price</th>
                  <th>Line total</th>
                </tr>
              </thead>
              <tbody>
                {selectedOrder.items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.product?.name || `Product #${item.product_id}`}</td>
                    <td><code>{item.product?.sku || '-'}</code></td>
                    <td>{item.quantity}</td>
                    <td>{formatCurrency(item.unit_price)}</td>
                    <td>{formatCurrency(item.line_total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
