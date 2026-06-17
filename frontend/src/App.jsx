import { useMemo, useState } from 'react';
import Dashboard from './pages/Dashboard.jsx';
import Products from './pages/Products.jsx';
import Customers from './pages/Customers.jsx';
import Orders from './pages/Orders.jsx';

const pages = {
  dashboard: Dashboard,
  products: Products,
  customers: Customers,
  orders: Orders,
};

const navItems = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    caption: 'Live business pulse',
    icon: 'DB',
  },
  {
    key: 'products',
    label: 'Products',
    caption: 'Catalog and stock',
    icon: 'PR',
  },
  {
    key: 'customers',
    label: 'Customers',
    caption: 'Buyer records',
    icon: 'CU',
  },
  {
    key: 'orders',
    label: 'Orders',
    caption: 'Sales and fulfilment',
    icon: 'OR',
  },
];

export default function App() {
  const [activePage, setActivePage] = useState('dashboard');
  const ActivePage = pages[activePage];

  const today = useMemo(
    () => new Intl.DateTimeFormat(undefined, {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
    }).format(new Date()),
    [],
  );

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-panel">
          <div className="brand-mark" aria-hidden="true">
            <span />
          </div>
          <div>
            <p className="eyebrow">Operations Suite</p>
            <h1>InventoryHub</h1>
          </div>
        </div>

        <nav className="nav-menu" aria-label="Main navigation">
          {navItems.map((item) => (
            <button
              key={item.key}
              type="button"
              className={activePage === item.key ? 'active' : ''}
              onClick={() => setActivePage(item.key)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>
                <strong>{item.label}</strong>
                <small>{item.caption}</small>
              </span>
            </button>
          ))}
        </nav>

        <div className="sidebar-card">
          <span className="status-dot" />
          <div>
            <strong>Local workspace</strong>
            <p>Docker Compose ready with React, FastAPI, and PostgreSQL.</p>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="eyebrow">Inventory and order management</p>
            <h2>{navItems.find((item) => item.key === activePage)?.label}</h2>
          </div>
          <div className="topbar-actions">
            <span className="date-chip">{today}</span>
            <span className="api-chip"><span className="status-dot" />API connected</span>
          </div>
        </header>

        <ActivePage onNavigate={setActivePage} />
      </main>
    </div>
  );
}
