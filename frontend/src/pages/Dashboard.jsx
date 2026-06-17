import { useEffect, useMemo, useState } from 'react';
import { dashboardApi, getErrorMessage } from '../api/api.js';
import Alert from '../components/Alert.jsx';
import EmptyState from '../components/EmptyState.jsx';
import Loader from '../components/Loader.jsx';
import StatCard from '../components/StatCard.jsx';
import { formatCurrency } from '../utils/formatters.js';

export default function Dashboard({ onNavigate }) {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        setError('');
        const response = await dashboardApi.get();
        setDashboard(response.data);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  const lowStockCount = dashboard?.low_stock_products?.length || 0;
  const hasLowStock = lowStockCount > 0;

  const lowStockValue = useMemo(() => {
    return (dashboard?.low_stock_products || []).reduce(
      (total, product) => total + Number(product.price) * Number(product.quantity_in_stock),
      0,
    );
  }, [dashboard]);

  if (loading) return <Loader label="Refreshing operational dashboard" />;

  return (
    <section className="page dashboard-page">
      <div className="hero-card">
        <div>
          <p className="eyebrow">Business snapshot</p>
          <h1>Know what is in stock, who is buying, and what needs attention.</h1>
          <p>
            A clean control room for product availability, customer records, and order movement across the business.
          </p>
        </div>
        <div className="hero-actions">
          <button type="button" onClick={() => onNavigate('orders')}>Create order</button>
          <button type="button" className="secondary" onClick={() => onNavigate('products')}>Add stock</button>
        </div>
      </div>

      <Alert type="error" message={error} onClose={() => setError('')} />

      {dashboard && (
        <>
          <div className="stats-grid">
            <StatCard label="Products" value={dashboard.total_products} helper="Active catalog items" tone="blue" />
            <StatCard label="Customers" value={dashboard.total_customers} helper="Saved buyer profiles" tone="green" />
            <StatCard label="Orders" value={dashboard.total_orders} helper="Orders created" tone="violet" />
            <StatCard
              label="Low stock"
              value={lowStockCount}
              helper={hasLowStock ? 'Needs replenishment' : 'Inventory looks healthy'}
              tone={hasLowStock ? 'amber' : 'green'}
            />
          </div>

          <div className="grid dashboard-grid">
            <article className="card focus-card">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Inventory watch</p>
                  <h3>Low stock products</h3>
                </div>
                <span className={hasLowStock ? 'badge warning' : 'badge success'}>
                  {hasLowStock ? `${lowStockCount} flagged` : 'Clear'}
                </span>
              </div>

              {!hasLowStock ? (
                <EmptyState
                  title="No replenishment pressure right now"
                  description="Products below the low stock threshold will appear here automatically."
                  action={<button type="button" className="secondary" onClick={() => onNavigate('products')}>Review products</button>}
                />
              ) : (
                <div className="table-wrapper modern-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>SKU</th>
                        <th>Price</th>
                        <th>Stock</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboard.low_stock_products.map((product) => (
                        <tr key={product.id}>
                          <td>
                            <div className="product-cell">
                              <span className="product-dot" />
                              <strong>{product.name}</strong>
                            </div>
                          </td>
                          <td><code>{product.sku}</code></td>
                          <td>{formatCurrency(product.price)}</td>
                          <td>
                            <div className="stock-meter compact">
                              <span style={{ width: `${Math.min(Number(product.quantity_in_stock) * 18, 100)}%` }} />
                            </div>
                            <span className="badge warning">{product.quantity_in_stock} left</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </article>

            <aside className="card insight-card">
              <p className="eyebrow">Planner note</p>
              <h3>{hasLowStock ? 'Prioritize replenishment before accepting large orders.' : 'Inventory health is stable.'}</h3>
              <p>
                {hasLowStock
                  ? `Low-stock products currently represent ${formatCurrency(lowStockValue)} in remaining shelf value.`
                  : 'Create products and customer records, then use the order screen to test automatic stock deduction.'}
              </p>
              <div className="insight-list">
                <div><span />Unique SKU validation</div>
                <div><span />Email uniqueness checks</div>
                <div><span />Backend-calculated totals</div>
                <div><span />Stock restored on order delete</div>
              </div>
            </aside>
          </div>
        </>
      )}
    </section>
  );
}
