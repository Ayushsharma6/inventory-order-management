import { useEffect, useMemo, useState } from 'react';
import { customersApi, getErrorMessage } from '../api/api.js';
import Alert from '../components/Alert.jsx';
import EmptyState from '../components/EmptyState.jsx';
import Loader from '../components/Loader.jsx';
import { getInitials } from '../utils/formatters.js';

const emptyCustomer = {
  full_name: '',
  email: '',
  phone: '',
};

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState(emptyCustomer);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const filteredCustomers = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return customers;
    return customers.filter((customer) => (
      customer.full_name.toLowerCase().includes(normalized)
      || customer.email.toLowerCase().includes(normalized)
      || (customer.phone || '').toLowerCase().includes(normalized)
    ));
  }, [customers, query]);

  async function loadCustomers() {
    try {
      setLoading(true);
      const response = await customersApi.list();
      setCustomers(response.data);
    } catch (err) {
      setMessage({ type: 'error', text: getErrorMessage(err) });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCustomers();
  }, []);

  function updateForm(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function validateCustomer() {
    if (!form.full_name.trim()) return 'Full name is required.';
    if (!form.email.trim()) return 'Email is required.';
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) return 'Enter a valid email address.';
    return '';
  }

  async function submitCustomer(event) {
    event.preventDefault();
    const validationError = validateCustomer();
    if (validationError) {
      setMessage({ type: 'error', text: validationError });
      return;
    }

    try {
      setSaving(true);
      await customersApi.create({
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
      });
      setMessage({ type: 'success', text: 'Customer profile created.' });
      setForm(emptyCustomer);
      await loadCustomers();
    } catch (err) {
      setMessage({ type: 'error', text: getErrorMessage(err) });
    } finally {
      setSaving(false);
    }
  }

  async function deleteCustomer(customerId) {
    const confirmed = window.confirm('Delete this customer and related orders?');
    if (!confirmed) return;

    try {
      await customersApi.remove(customerId);
      setMessage({ type: 'success', text: 'Customer deleted successfully.' });
      await loadCustomers();
    } catch (err) {
      setMessage({ type: 'error', text: getErrorMessage(err) });
    }
  }

  return (
    <section className="page customers-page">
      <div className="page-intro">
        <div>
          <p className="eyebrow">Customer records</p>
          <h1>Keep buyer information tidy, searchable, and order-ready.</h1>
          <p>Every customer uses a unique email address so orders can always be traced clearly.</p>
        </div>
        <div className="mini-metrics single">
          <div><span>{customers.length}</span><small>Total customers</small></div>
        </div>
      </div>

      <Alert type={message.type} message={message.text} onClose={() => setMessage({ type: '', text: '' })} />

      <div className="grid two-columns">
        <form className="card form-card elevated-form" onSubmit={submitCustomer}>
          <div className="section-heading">
            <div>
              <p className="eyebrow">New customer</p>
              <h3>Add customer</h3>
            </div>
          </div>

          <label>
            Full name
            <input name="full_name" value={form.full_name} onChange={updateForm} placeholder="Alex Morgan" required />
          </label>
          <label>
            Email address
            <input name="email" type="email" value={form.email} onChange={updateForm} placeholder="alex@example.com" required />
          </label>
          <label>
            Phone number
            <input name="phone" value={form.phone} onChange={updateForm} placeholder="+1 555 123 4567" />
          </label>
          <button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Add customer'}</button>
        </form>

        <div className="card content-card">
          <div className="section-heading with-search">
            <div>
              <p className="eyebrow">Directory</p>
              <h3>Customers</h3>
            </div>
            <input
              className="search-input"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search customers"
              aria-label="Search customers"
            />
          </div>

          {loading ? (
            <Loader label="Loading customers" />
          ) : customers.length === 0 ? (
            <EmptyState title="No customers yet" description="Create a customer before placing orders." />
          ) : filteredCustomers.length === 0 ? (
            <EmptyState
              title="No matching customers"
              description="Try a different name, email, or phone number."
              action={<button type="button" className="secondary" onClick={() => setQuery('')}>Clear search</button>}
            />
          ) : (
            <div className="customer-grid">
              {filteredCustomers.map((customer) => (
                <article className="customer-card" key={customer.id}>
                  <div className="customer-main">
                    <span className="avatar">{getInitials(customer.full_name)}</span>
                    <div>
                      <h4>{customer.full_name}</h4>
                      <a href={`mailto:${customer.email}`}>{customer.email}</a>
                      <p>{customer.phone || 'No phone added'}</p>
                    </div>
                  </div>
                  <button type="button" className="danger small" onClick={() => deleteCustomer(customer.id)}>Delete</button>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
