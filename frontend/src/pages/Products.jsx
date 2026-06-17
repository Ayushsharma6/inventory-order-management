import { useEffect, useMemo, useState } from 'react';
import { getErrorMessage, productsApi } from '../api/api.js';
import Alert from '../components/Alert.jsx';
import EmptyState from '../components/EmptyState.jsx';
import Loader from '../components/Loader.jsx';
import { formatCurrency } from '../utils/formatters.js';

const emptyProduct = {
  name: '',
  sku: '',
  price: '',
  quantity_in_stock: '',
};

function getStockTone(quantity) {
  if (Number(quantity) <= 5) return 'warning';
  if (Number(quantity) <= 15) return 'neutral';
  return 'success';
}

export default function Products() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(emptyProduct);
  const [editingId, setEditingId] = useState(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const isEditing = useMemo(() => editingId !== null, [editingId]);

  const filteredProducts = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return products;
    return products.filter((product) => (
      product.name.toLowerCase().includes(normalized)
      || product.sku.toLowerCase().includes(normalized)
    ));
  }, [products, query]);

  const inventoryValue = useMemo(() => products.reduce(
    (total, product) => total + Number(product.price) * Number(product.quantity_in_stock),
    0,
  ), [products]);

  const lowStockCount = useMemo(() => products.filter((product) => Number(product.quantity_in_stock) <= 5).length, [products]);

  async function loadProducts() {
    try {
      setLoading(true);
      const response = await productsApi.list();
      setProducts(response.data);
    } catch (err) {
      setMessage({ type: 'error', text: getErrorMessage(err) });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  function updateForm(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function validateProduct() {
    if (!form.name.trim()) return 'Product name is required.';
    if (!form.sku.trim()) return 'SKU is required.';
    if (Number(form.price) <= 0) return 'Price must be greater than zero.';
    if (Number(form.quantity_in_stock) < 0) return 'Quantity cannot be negative.';
    return '';
  }

  async function submitProduct(event) {
    event.preventDefault();
    const validationError = validateProduct();
    if (validationError) {
      setMessage({ type: 'error', text: validationError });
      return;
    }

    const payload = {
      name: form.name.trim(),
      sku: form.sku.trim(),
      price: Number(form.price),
      quantity_in_stock: Number(form.quantity_in_stock),
    };

    try {
      setSaving(true);
      setMessage({ type: '', text: '' });
      if (isEditing) {
        await productsApi.update(editingId, payload);
        setMessage({ type: 'success', text: 'Product updated successfully.' });
      } else {
        await productsApi.create(payload);
        setMessage({ type: 'success', text: 'Product added to inventory.' });
      }
      setForm(emptyProduct);
      setEditingId(null);
      await loadProducts();
    } catch (err) {
      setMessage({ type: 'error', text: getErrorMessage(err) });
    } finally {
      setSaving(false);
    }
  }

  function editProduct(product) {
    setEditingId(product.id);
    setForm({
      name: product.name,
      sku: product.sku,
      price: product.price,
      quantity_in_stock: product.quantity_in_stock,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function deleteProduct(productId) {
    const confirmed = window.confirm('Delete this product?');
    if (!confirmed) return;

    try {
      await productsApi.remove(productId);
      setMessage({ type: 'success', text: 'Product deleted successfully.' });
      await loadProducts();
    } catch (err) {
      setMessage({ type: 'error', text: getErrorMessage(err) });
    }
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyProduct);
    setMessage({ type: '', text: '' });
  }

  return (
    <section className="page products-page">
      <div className="page-intro">
        <div>
          <p className="eyebrow">Catalog control</p>
          <h1>Maintain clean product records and real-time stock counts.</h1>
          <p>SKU, price, and availability stay ready for order creation and inventory checks.</p>
        </div>
        <div className="mini-metrics">
          <div><span>{products.length}</span><small>Products</small></div>
          <div><span>{formatCurrency(inventoryValue)}</span><small>Stock value</small></div>
          <div><span>{lowStockCount}</span><small>Low stock</small></div>
        </div>
      </div>

      <Alert type={message.type} message={message.text} onClose={() => setMessage({ type: '', text: '' })} />

      <div className="grid two-columns">
        <form className="card form-card elevated-form" onSubmit={submitProduct}>
          <div className="section-heading">
            <div>
              <p className="eyebrow">{isEditing ? 'Editing product' : 'New product'}</p>
              <h3>{isEditing ? 'Update product details' : 'Add a product'}</h3>
            </div>
            {isEditing && <span className="badge neutral">Edit mode</span>}
          </div>

          <label>
            Product name
            <input name="name" value={form.name} onChange={updateForm} placeholder="Wireless Mouse" required />
          </label>
          <label>
            SKU or code
            <input name="sku" value={form.sku} onChange={updateForm} placeholder="MOUSE-001" required />
          </label>
          <div className="form-row">
            <label>
              Price
              <input name="price" type="number" min="0.01" step="0.01" value={form.price} onChange={updateForm} placeholder="29.99" required />
            </label>
            <label>
              Quantity
              <input name="quantity_in_stock" type="number" min="0" step="1" value={form.quantity_in_stock} onChange={updateForm} placeholder="25" required />
            </label>
          </div>
          <div className="form-actions">
            <button type="submit" disabled={saving}>{saving ? 'Saving...' : isEditing ? 'Save changes' : 'Add product'}</button>
            {isEditing && (
              <button type="button" className="secondary" onClick={resetForm}>Cancel edit</button>
            )}
          </div>
        </form>

        <div className="card content-card">
          <div className="section-heading with-search">
            <div>
              <p className="eyebrow">Inventory list</p>
              <h3>Products</h3>
            </div>
            <input
              className="search-input"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search name or SKU"
              aria-label="Search products"
            />
          </div>

          {loading ? (
            <Loader label="Loading products" />
          ) : products.length === 0 ? (
            <EmptyState
              title="Your catalog is empty"
              description="Add the first product to start tracking stock and creating orders."
            />
          ) : filteredProducts.length === 0 ? (
            <EmptyState
              title="No matching products"
              description="Try a different product name or SKU."
              action={<button type="button" className="secondary" onClick={() => setQuery('')}>Clear search</button>}
            />
          ) : (
            <div className="table-wrapper modern-table">
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Price</th>
                    <th>Inventory</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => {
                    const tone = getStockTone(product.quantity_in_stock);
                    return (
                      <tr key={product.id}>
                        <td>
                          <div className="product-cell">
                            <span className="product-dot" />
                            <div>
                              <strong>{product.name}</strong>
                              <small><code>{product.sku}</code></small>
                            </div>
                          </div>
                        </td>
                        <td>{formatCurrency(product.price)}</td>
                        <td>
                          <div className="stock-stack">
                            <span className={`badge ${tone}`}>{product.quantity_in_stock} units</span>
                            <div className="stock-meter">
                              <span style={{ width: `${Math.min(Number(product.quantity_in_stock) * 4, 100)}%` }} />
                            </div>
                          </div>
                        </td>
                        <td className="actions">
                          <button type="button" className="secondary small" onClick={() => editProduct(product)}>Edit</button>
                          <button type="button" className="danger small" onClick={() => deleteProduct(product.id)}>Delete</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
