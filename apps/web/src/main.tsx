import { useEffect, useState, FormEvent, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import {
  LayoutDashboard, Users, Package, FileText, LogOut, Plus, Search,
  AlertTriangle, ArrowUpRight, ChevronRight, ChevronLeft, X, Edit2,
  ArrowDownLeft, ArrowUpRight as ArrowOut, Clock, MapPin
} from 'lucide-react';
import './styles.css';
import './modal.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';

type Role = 'ADMIN' | 'SALES' | 'WAREHOUSE' | 'ACCOUNTS';
type User = { name: string; role: Role };

const PERMS = {
  createCustomer: ['ADMIN', 'SALES'] as Role[],
  editCustomer: ['ADMIN', 'SALES'] as Role[],
  addFollowup: ['ADMIN', 'SALES'] as Role[],
  createProduct: ['ADMIN', 'WAREHOUSE'] as Role[],
  editProduct: ['ADMIN', 'WAREHOUSE'] as Role[],
  stockMovement: ['ADMIN', 'WAREHOUSE'] as Role[],
  createChallan: ['ADMIN', 'SALES'] as Role[],
  confirmChallan: ['ADMIN', 'SALES'] as Role[],
};

function can(role: Role, action: keyof typeof PERMS) {
  return PERMS[action].includes(role);
}

async function api<T = unknown>(path: string, token?: string, init?: RequestInit): Promise<T> {
  const r = await fetch(API + path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });
  const b = await r.json();
  if (!r.ok) throw new Error(b.error || 'Request failed');
  return b as T;
}

function parseRoute() {
  const parts = location.hash.slice(1).split('/').filter(Boolean);
  return { section: parts[0] || 'dashboard', id: parts[1] || null };
}

function navigate(section: string, id?: string) {
  location.hash = id ? `${section}/${id}` : section;
}

function Badge({ children }: { children: ReactNode }) {
  return <span className={'badge ' + String(children).toLowerCase()}>{children}</span>;
}

function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <section className={'modal' + (wide ? ' modal-wide' : '')} role="dialog" aria-labelledby="modal-title">
        <div className="modal-head">
          <h2 id="modal-title">{title}</h2>
          <button className="icon-button" onClick={onClose} aria-label="Close">×</button>
        </div>
        {children}
      </section>
    </div>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return <div className="empty">{children}</div>;
}

function fmtDate(d: string | null | undefined) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function fmtCurrency(n: number) {
  return '₹' + Number(n).toLocaleString('en-IN');
}

/* ─── Forms ─── */

function CustomerForm({ token, initial, onDone }: { token: string; initial?: Record<string, unknown>; onDone: () => void }) {
  const [error, setError] = useState('');
  const isEdit = !!initial;
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const body = {
      name: f.get('name'), mobile: f.get('mobile'), email: f.get('email'),
      businessName: f.get('businessName'), gstNumber: f.get('gstNumber'),
      type: f.get('type'), address: f.get('address'), status: f.get('status'),
      followUpDate: f.get('followUpDate') || null, notes: f.get('notes'),
    };
    try {
      if (isEdit) await api(`/customers/${initial.id}`, token, { method: 'PUT', body: JSON.stringify(body) });
      else await api('/customers', token, { method: 'POST', body: JSON.stringify(body) });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    }
  };
  return (
    <form className="form-grid" onSubmit={submit}>
      <label>Contact name<input name="name" required defaultValue={String(initial?.name || '')} /></label>
      <label>Mobile<input name="mobile" required defaultValue={String(initial?.mobile || '')} /></label>
      <label>Business name<input name="businessName" required defaultValue={String(initial?.business_name || '')} /></label>
      <label>Email<input name="email" type="email" defaultValue={String(initial?.email || '')} /></label>
      <label>Customer type
        <select name="type" defaultValue={String(initial?.type || 'RETAIL')}>
          <option value="RETAIL">Retail</option><option value="WHOLESALE">Wholesale</option><option value="DISTRIBUTOR">Distributor</option>
        </select>
      </label>
      <label>Status
        <select name="status" defaultValue={String(initial?.status || 'LEAD')}>
          <option value="LEAD">Lead</option><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option>
        </select>
      </label>
      <label>GST number<input name="gstNumber" defaultValue={String(initial?.gst_number || '')} /></label>
      <label>Next follow-up<input name="followUpDate" type="date" defaultValue={initial?.follow_up_date ? String(initial.follow_up_date).slice(0, 10) : ''} /></label>
      <label className="wide">Address<input name="address" required defaultValue={String(initial?.address || '')} /></label>
      <label className="wide">Notes<textarea name="notes" rows={3} defaultValue={String(initial?.notes || '')} /></label>
      {error && <p className="error wide">{error}</p>}
      <div className="wide form-actions"><button>{isEdit ? 'Save changes' : 'Add customer'}</button></div>
    </form>
  );
}

function ProductForm({ token, initial, onDone }: { token: string; initial?: Record<string, unknown>; onDone: () => void }) {
  const [error, setError] = useState('');
  const isEdit = !!initial;
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const body = {
      name: f.get('name'), sku: f.get('sku'), category: f.get('category'),
      unitPrice: f.get('unitPrice'), currentStock: f.get('currentStock'),
      minStock: f.get('minStock'), warehouse: f.get('warehouse'),
    };
    try {
      if (isEdit) await api(`/products/${initial.id}`, token, { method: 'PUT', body: JSON.stringify(body) });
      else await api('/products', token, { method: 'POST', body: JSON.stringify(body) });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    }
  };
  return (
    <form className="form-grid" onSubmit={submit}>
      <label>Product name<input name="name" required defaultValue={String(initial?.name || '')} /></label>
      <label>SKU / code<input name="sku" required defaultValue={String(initial?.sku || '')} /></label>
      <label>Category<input name="category" required defaultValue={String(initial?.category || '')} /></label>
      <label>Warehouse<input name="warehouse" required defaultValue={String(initial?.warehouse || '')} /></label>
      <label>Unit price (₹)<input name="unitPrice" type="number" min="0" step="0.01" required defaultValue={String(initial?.unit_price ?? '')} /></label>
      <label>{isEdit ? 'Current stock' : 'Opening stock'}<input name="currentStock" type="number" min="0" required defaultValue={String(initial?.current_stock ?? '')} /></label>
      <label>Low-stock alert at<input name="minStock" type="number" min="0" required defaultValue={String(initial?.min_stock ?? '')} /></label>
      {error && <p className="error wide">{error}</p>}
      <div className="wide form-actions"><button>{isEdit ? 'Save changes' : 'Add product'}</button></div>
    </form>
  );
}

function StockMovementForm({ token, productId, onDone }: { token: string; productId: string; onDone: () => void }) {
  const [error, setError] = useState('');
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    try {
      await api(`/products/${productId}/movements`, token, {
        method: 'POST',
        body: JSON.stringify({ quantity: Number(f.get('quantity')), movementType: f.get('movementType'), reason: f.get('reason') }),
      });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Movement failed');
    }
  };
  return (
    <form className="form-grid" onSubmit={submit}>
      <label>Movement type
        <select name="movementType"><option value="IN">Stock IN</option><option value="OUT">Stock OUT</option></select>
      </label>
      <label>Quantity<input name="quantity" type="number" min="1" required /></label>
      <label className="wide">Reason<input name="reason" required placeholder="e.g. Goods received note GRN-1042" /></label>
      {error && <p className="error wide">{error}</p>}
      <div className="wide form-actions"><button>Record movement</button></div>
    </form>
  );
}

type ChallanRow = { productId: string; quantity: number };

function ChallanForm({ token, onDone }: { token: string; onDone: () => void }) {
  const [customers, setCustomers] = useState<Record<string, unknown>[]>([]);
  const [products, setProducts] = useState<Record<string, unknown>[]>([]);
  const [rows, setRows] = useState<ChallanRow[]>([{ productId: '', quantity: 1 }]);
  const [error, setError] = useState('');

  useEffect(() => {
    void Promise.all([api<{ data: Record<string, unknown>[] }>('/customers?limit=50', token), api<{ data: Record<string, unknown>[] }>('/products', token)])
      .then(([c, p]) => { setCustomers(c.data); setProducts(p.data); });
  }, [token]);

  const updateRow = (i: number, field: keyof ChallanRow, val: string | number) => {
    setRows(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: val } : r));
  };

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const items = rows.filter(r => r.productId && r.quantity > 0);
    if (!items.length) { setError('Add at least one product row'); return; }
    try {
      await api('/challans', token, {
        method: 'POST',
        body: JSON.stringify({ customerId: f.get('customerId'), status: f.get('status'), items }),
      });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create failed');
    }
  };

  return (
    <form className="form-grid" onSubmit={submit}>
      <label className="wide">Customer
        <select name="customerId" required>
          <option value="">Select customer</option>
          {customers.map(c => <option value={String(c.id)} key={String(c.id)}>{String(c.business_name)} — {String(c.name)}</option>)}
        </select>
      </label>
      <div className="wide challan-rows">
        <div className="challan-rows-head"><span>Product</span><span>Qty</span><span></span></div>
        {rows.map((row, i) => (
          <div className="challan-row" key={i}>
            <select value={row.productId} onChange={e => updateRow(i, 'productId', e.target.value)} required={i === 0}>
              <option value="">Select product</option>
              {products.map(p => <option value={String(p.id)} key={String(p.id)}>{String(p.name)} ({String(p.current_stock)} in stock)</option>)}
            </select>
            <input type="number" min="1" value={row.quantity} onChange={e => updateRow(i, 'quantity', Number(e.target.value))} required />
            {rows.length > 1 && <button type="button" className="icon-button row-remove" onClick={() => setRows(rows.filter((_, idx) => idx !== i))} aria-label="Remove row"><X size={14} /></button>}
          </div>
        ))}
        <button type="button" className="quiet add-row" onClick={() => setRows([...rows, { productId: '', quantity: 1 }])}><Plus size={14} /> Add product row</button>
      </div>
      <label>Save as
        <select name="status"><option value="DRAFT">Draft</option><option value="CONFIRMED">Confirmed — reduce stock</option></select>
      </label>
      <p className="hint wide">A confirmed challan locks stock, prevents negative inventory, and creates OUT movements automatically.</p>
      {error && <p className="error wide">{error}</p>}
      <div className="wide form-actions"><button>Create challan</button></div>
    </form>
  );
}

function FollowupForm({ token, customerId, onDone }: { token: string; customerId: string; onDone: () => void }) {
  const [error, setError] = useState('');
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    try {
      await api(`/customers/${customerId}/followups`, token, {
        method: 'POST',
        body: JSON.stringify({ note: f.get('note'), followUpDate: f.get('followUpDate') || null }),
      });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    }
  };
  return (
    <form className="form-grid" onSubmit={submit}>
      <label className="wide">Follow-up note<textarea name="note" rows={3} required placeholder="What was discussed?" /></label>
      <label>Next follow-up date<input name="followUpDate" type="date" /></label>
      {error && <p className="error wide">{error}</p>}
      <div className="wide form-actions"><button>Add follow-up</button></div>
    </form>
  );
}

/* ─── Login ─── */

function Login({ onLogin }: { onLogin: (t: string, u: User) => void }) {
  const [email, setEmail] = useState('sales@nexus.test');
  const [password, setPassword] = useState('Campus@2026');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      const r = await api<{ token: string; user: User }>('/auth/login', undefined, { method: 'POST', body: JSON.stringify({ email, password }) });
      onLogin(r.token, r.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally { setBusy(false); }
  };
  return (
    <main className="login">
      <section>
        <div className="brandmark">N</div>
        <p className="eyebrow">WHOLESALE OPERATIONS</p>
        <h1>Make every movement count.</h1>
        <p className="muted">Nexus Ops is the calm, connected workspace for sales, warehouse and accounts teams.</p>
        <div className="login-note"><AlertTriangle size={18} /><span>Demo password for every role:<br /><b>Campus@2026</b></span></div>
      </section>
      <form onSubmit={submit} className="card login-card">
        <p className="eyebrow">WELCOME BACK</p>
        <h2>Sign in to Nexus</h2>
        <label>Email<input value={email} onChange={e => setEmail(e.target.value)} type="email" autoComplete="username" /></label>
        <label>Password<input value={password} onChange={e => setPassword(e.target.value)} type="password" autoComplete="current-password" /></label>
        {error && <p className="error">{error}</p>}
        <button disabled={busy}>{busy ? 'Signing in…' : 'Sign in'} <ArrowUpRight size={17} /></button>
        <p className="hint">Try admin@nexus.test, sales@nexus.test,<br />warehouse@nexus.test or accounts@nexus.test</p>
      </form>
    </main>
  );
}

/* ─── Dashboard ─── */

function Dashboard({ token, user }: { token: string; user: User }) {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  useEffect(() => { void api<Record<string, unknown>>('/dashboard', token).then(setData); }, [token]);
  if (!data) return <p className="muted">Loading your operations pulse…</p>;
  const cards: [string, number, typeof Users, string][] = [
    ['Active customers', data.active_customers as number, Users, 'Healthy pipeline'],
    ['Low-stock alerts', data.low_stock as number, AlertTriangle, 'Needs attention'],
    ['Confirmed today', data.confirmed_today as number, FileText, 'Dispatches created'],
    ['Units moved today', data.units_today as number, Package, 'Across all hubs'],
  ];
  const lowStock = (data.lowStock as Record<string, unknown>[]) || [];
  const recent = (data.recentChallans as Record<string, unknown>[]) || [];
  return (
    <>
      <div className="page-head">
        <div>
          <p className="eyebrow">GOOD MORNING, {user.name.split(' ')[0].toUpperCase()}</p>
          <h1>Operations pulse</h1>
          <p className="muted">A clear view of the work that matters today.</p>
        </div>
        {can(user.role, 'createChallan') && (
          <button onClick={() => navigate('challans')}><Plus size={17} /> New challan</button>
        )}
      </div>
      <div className="metrics">
        {cards.map(([l, n, I, sub]) => (
          <article className="metric" key={l}>
            <div className="metric-icon"><I size={20} /></div>
            <p>{l}</p><strong>{n}</strong><small>{sub}</small>
          </article>
        ))}
      </div>
      <section className="grid">
        <article className="panel">
          <div className="panel-title">
            <div><p className="eyebrow">STOCK WATCH</p><h2>Items needing attention</h2></div>
            <a href="#products" onClick={e => { e.preventDefault(); navigate('products'); }}>Inventory <ChevronRight size={16} /></a>
          </div>
          {lowStock.length ? (
            <table><thead><tr><th>Product</th><th>Hub</th><th>Available</th><th>Minimum</th></tr></thead>
              <tbody>{lowStock.map(p => (
                <tr key={String(p.id)} className="clickable" onClick={() => navigate('products', String(p.id))}>
                  <td><b>{String(p.name)}</b><small>{String(p.sku)}</small></td>
                  <td>{String(p.warehouse)}</td>
                  <td className="danger">{String(p.current_stock)}</td>
                  <td>{String(p.min_stock)}</td>
                </tr>
              ))}</tbody>
            </table>
          ) : <Empty>All stock levels are healthy.</Empty>}
        </article>
        <article className="panel">
          <div className="panel-title"><div><p className="eyebrow">LIVE ACTIVITY</p><h2>Latest challans</h2></div></div>
          {recent.length ? recent.map(c => (
            <div className="activity clickable" key={String(c.challan_number)} onClick={() => navigate('challans')}>
              <div className="activity-dot" />
              <div><b>{String(c.challan_number)}</b><p>{String(c.business_name)} · {String(c.total_quantity)} units</p></div>
              <Badge>{String(c.status)}</Badge>
            </div>
          )) : <Empty>No challans yet. Create your first dispatch.</Empty>}
        </article>
      </section>
    </>
  );
}

/* ─── Customers ─── */

function CustomerDetail({ token, user, id }: { token: string; user: User; id: string }) {
  const [customer, setCustomer] = useState<Record<string, unknown> | null>(null);
  const [editing, setEditing] = useState(false);
  const [addingFollowup, setAddingFollowup] = useState(false);
  const load = () => void api<Record<string, unknown>>(`/customers/${id}`, token).then(setCustomer);
  useEffect(() => { load(); }, [id, token]);
  if (!customer) return <p className="muted">Loading customer…</p>;
  const followups = (customer.followups as Record<string, unknown>[]) || [];
  return (
    <>
      <div className="page-head">
        <div>
          <button className="back-link" onClick={() => navigate('customers')}><ChevronLeft size={16} /> Back to customers</button>
          <h1>{String(customer.business_name)}</h1>
          <p className="muted">{String(customer.name)} · {String(customer.mobile)}</p>
        </div>
        <div className="head-actions">
          {can(user.role, 'addFollowup') && <button className="quiet" onClick={() => setAddingFollowup(true)}><Plus size={16} /> Add follow-up</button>}
          {can(user.role, 'editCustomer') && <button onClick={() => setEditing(true)}><Edit2 size={16} /> Edit</button>}
        </div>
      </div>
      <div className="detail-grid">
        <article className="panel">
          <p className="eyebrow">PROFILE</p>
          <dl className="detail-list">
            <div><dt>Status</dt><dd><Badge>{String(customer.status)}</Badge></dd></div>
            <div><dt>Type</dt><dd>{String(customer.type)}</dd></div>
            <div><dt>Email</dt><dd>{String(customer.email || '—')}</dd></div>
            <div><dt>GST</dt><dd>{String(customer.gst_number || '—')}</dd></div>
            <div><dt>Next follow-up</dt><dd>{fmtDate(customer.follow_up_date as string)}</dd></div>
            <div className="wide"><dt>Address</dt><dd><MapPin size={14} /> {String(customer.address)}</dd></div>
            {customer.notes ? <div className="wide"><dt>Notes</dt><dd>{String(customer.notes)}</dd></div> : null}
          </dl>
        </article>
        <article className="panel">
          <p className="eyebrow">FOLLOW-UP TIMELINE</p>
          {followups.length ? (
            <div className="timeline">
              {followups.map(f => (
                <div className="timeline-item" key={String(f.id)}>
                  <div className="timeline-dot" />
                  <div>
                    <p>{String(f.note)}</p>
                    <small><Clock size={12} /> {fmtDate(f.created_at as string)}
                      {f.follow_up_date ? ` · Next: ${fmtDate(f.follow_up_date as string)}` : ''}
                      {f.created_by_name ? ` · ${String(f.created_by_name)}` : ''}
                    </small>
                  </div>
                </div>
              ))}
            </div>
          ) : <Empty>No follow-ups recorded yet.</Empty>}
        </article>
      </div>
      {editing && <Modal title="Edit customer" onClose={() => setEditing(false)}><CustomerForm token={token} initial={customer} onDone={() => { setEditing(false); load(); }} /></Modal>}
      {addingFollowup && <Modal title="Add follow-up" onClose={() => setAddingFollowup(false)}><FollowupForm token={token} customerId={id} onDone={() => { setAddingFollowup(false); load(); }} /></Modal>}
    </>
  );
}

function Customers({ token, user }: { token: string; user: User }) {
  const { id } = parseRoute();
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [adding, setAdding] = useState(false);
  const limit = 10;

  const load = (p = page, q = search) =>
    api<{ data: Record<string, unknown>[]; total: number }>(`/customers?search=${encodeURIComponent(q)}&page=${p}&limit=${limit}`, token)
      .then(x => { setData(x.data); setTotal(x.total); });

  useEffect(() => { void load(); }, [token]);

  if (id) return <CustomerDetail token={token} user={user} id={id} />;

  const pages = Math.max(1, Math.ceil(total / limit));

  return (
    <>
      <div className="page-head">
        <div><p className="eyebrow">CRM</p><h1>Customers</h1><p className="muted">Track relationships, not just records.</p></div>
        {can(user.role, 'createCustomer') && <button onClick={() => setAdding(true)}><Plus size={17} /> Add customer</button>}
      </div>
      <div className="toolbar">
        <Search size={18} />
        <input placeholder="Search customer, business or mobile" value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && (setPage(1), load(1, search))} />
        <button className="quiet" onClick={() => { setPage(1); void load(1, search); }}>Search</button>
      </div>
      <article className="panel">
        {data.length ? (
          <>
            <table><thead><tr><th>Customer</th><th>Business</th><th>Type</th><th>Next follow-up</th><th>Status</th></tr></thead>
              <tbody>{data.map(c => (
                <tr key={String(c.id)} className="clickable" onClick={() => navigate('customers', String(c.id))}>
                  <td><b>{String(c.name)}</b><small>{String(c.mobile)} · {String(c.email || 'No email')}</small></td>
                  <td>{String(c.business_name)}</td><td>{String(c.type)}</td>
                  <td>{fmtDate(c.follow_up_date as string)}</td>
                  <td><Badge>{String(c.status)}</Badge></td>
                </tr>
              ))}</tbody>
            </table>
            {pages > 1 && (
              <div className="pagination">
                <button className="quiet" disabled={page <= 1} onClick={() => { setPage(page - 1); void load(page - 1); }}><ChevronLeft size={14} /> Prev</button>
                <span>Page {page} of {pages} · {total} customers</span>
                <button className="quiet" disabled={page >= pages} onClick={() => { setPage(page + 1); void load(page + 1); }}>Next <ChevronRight size={14} /></button>
              </div>
            )}
          </>
        ) : <Empty>No customers match your search. {can(user.role, 'createCustomer') ? 'Add your first customer to get started.' : ''}</Empty>}
      </article>
      {adding && <Modal title="Add customer" onClose={() => setAdding(false)}><CustomerForm token={token} onDone={() => { setAdding(false); void load(); }} /></Modal>}
    </>
  );
}

/* ─── Products ─── */

function ProductDetail({ token, user, id }: { token: string; user: User; id: string }) {
  const [product, setProduct] = useState<Record<string, unknown> | null>(null);
  const [movements, setMovements] = useState<Record<string, unknown>[]>([]);
  const [editing, setEditing] = useState(false);
  const [moving, setMoving] = useState(false);
  const load = () => {
    void api<Record<string, unknown>>(`/products/${id}`, token).then(setProduct);
    void api<{ data: Record<string, unknown>[] }>(`/products/${id}/movements`, token).then(m => setMovements(m.data));
  };
  useEffect(() => { load(); }, [id, token]);
  if (!product) return <p className="muted">Loading product…</p>;
  const low = Number(product.current_stock) <= Number(product.min_stock);
  return (
    <>
      <div className="page-head">
        <div>
          <button className="back-link" onClick={() => navigate('products')}><ChevronLeft size={16} /> Back to inventory</button>
          <h1>{String(product.name)}</h1>
          <p className="muted">{String(product.sku)} · {String(product.category)}</p>
        </div>
        <div className="head-actions">
          {can(user.role, 'stockMovement') && <button className="quiet" onClick={() => setMoving(true)}><ArrowDownLeft size={16} /> Stock movement</button>}
          {can(user.role, 'editProduct') && <button onClick={() => setEditing(true)}><Edit2 size={16} /> Edit</button>}
        </div>
      </div>
      <div className="detail-grid">
        <article className="panel">
          <p className="eyebrow">INVENTORY</p>
          <dl className="detail-list">
            <div><dt>Warehouse</dt><dd>{String(product.warehouse)}</dd></div>
            <div><dt>Unit price</dt><dd>{fmtCurrency(Number(product.unit_price))}</dd></div>
            <div><dt>Available</dt><dd className={low ? 'danger' : ''}>{String(product.current_stock)} units</dd></div>
            <div><dt>Alert threshold</dt><dd>{String(product.min_stock)} units</dd></div>
          </dl>
          {low && <div className="alert-banner"><AlertTriangle size={16} /> Stock is at or below minimum threshold</div>}
        </article>
        <article className="panel">
          <p className="eyebrow">MOVEMENT HISTORY</p>
          {movements.length ? (
            <table><thead><tr><th>Type</th><th>Qty</th><th>Reason</th><th>By</th><th>When</th></tr></thead>
              <tbody>{movements.map(m => (
                <tr key={String(m.id)}>
                  <td><span className={'move-badge ' + String(m.movement_type).toLowerCase()}>{String(m.movement_type)}</span></td>
                  <td>{String(m.quantity)}</td>
                  <td>{String(m.reason)}</td>
                  <td>{String(m.created_by_name || '—')}</td>
                  <td>{fmtDate(m.created_at as string)}</td>
                </tr>
              ))}</tbody>
            </table>
          ) : <Empty>No stock movements recorded yet.</Empty>}
        </article>
      </div>
      {editing && <Modal title="Edit product" onClose={() => setEditing(false)}><ProductForm token={token} initial={product} onDone={() => { setEditing(false); load(); }} /></Modal>}
      {moving && <Modal title="Record stock movement" onClose={() => setMoving(false)}><StockMovementForm token={token} productId={id} onDone={() => { setMoving(false); load(); }} /></Modal>}
    </>
  );
}

function Products({ token, user }: { token: string; user: User }) {
  const { id } = parseRoute();
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [search, setSearch] = useState('');
  const [adding, setAdding] = useState(false);
  const load = (q = search) => api<{ data: Record<string, unknown>[] }>(`/products?search=${encodeURIComponent(q)}`, token).then(x => setData(x.data));
  useEffect(() => { void load(); }, [token]);
  if (id) return <ProductDetail token={token} user={user} id={id} />;

  return (
    <>
      <div className="page-head">
        <div><p className="eyebrow">INVENTORY</p><h1>Stock control</h1><p className="muted">Know what is available before you promise it.</p></div>
        {can(user.role, 'createProduct') && <button onClick={() => setAdding(true)}><Plus size={17} /> Add product</button>}
      </div>
      <div className="toolbar">
        <Search size={18} />
        <input placeholder="Search product, SKU or category" value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && load(search)} />
        <button className="quiet" onClick={() => load(search)}>Search</button>
      </div>
      <article className="panel">
        {data.length ? (
          <table><thead><tr><th>Product</th><th>SKU</th><th>Warehouse</th><th>Unit price</th><th>Available</th><th>Alert at</th></tr></thead>
            <tbody>{data.map(p => (
              <tr key={String(p.id)} className="clickable" onClick={() => navigate('products', String(p.id))}>
                <td><b>{String(p.name)}</b><small>{String(p.category)}</small></td>
                <td>{String(p.sku)}</td><td>{String(p.warehouse)}</td>
                <td>{fmtCurrency(Number(p.unit_price))}</td>
                <td className={Number(p.current_stock) <= Number(p.min_stock) ? 'danger' : ''}>{String(p.current_stock)}</td>
                <td>{String(p.min_stock)}</td>
              </tr>
            ))}</tbody>
          </table>
        ) : <Empty>No products found. {can(user.role, 'createProduct') ? 'Add your first product to start tracking inventory.' : ''}</Empty>}
      </article>
      {adding && <Modal title="Add product" onClose={() => setAdding(false)}><ProductForm token={token} onDone={() => { setAdding(false); void load(); }} /></Modal>}
    </>
  );
}

/* ─── Challans ─── */

function ChallanDetail({ token, user, id }: { token: string; user: User; id: string }) {
  const [challan, setChallan] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const load = () => void api<Record<string, unknown>>(`/challans/${id}`, token).then(setChallan);
  useEffect(() => { load(); }, [id, token]);
  if (!challan) return <p className="muted">Loading challan…</p>;
  const items = (challan.items as Record<string, unknown>[]) || [];
  const totalValue = items.reduce((s, i) => s + Number(i.unit_price) * Number(i.quantity), 0);
  const confirm = async () => {
    setBusy(true); setError('');
    try {
      await api(`/challans/${id}/confirm`, token, { method: 'PATCH' });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Confirm failed');
    } finally { setBusy(false); }
  };
  return (
    <>
      <div className="page-head">
        <div>
          <button className="back-link" onClick={() => navigate('challans')}><ChevronLeft size={16} /> Back to challans</button>
          <h1>{String(challan.challan_number)}</h1>
          <p className="muted">{String(challan.business_name)} · {String(challan.total_quantity)} units</p>
        </div>
        <div className="head-actions">
          <Badge>{String(challan.status)}</Badge>
          {challan.status === 'DRAFT' && can(user.role, 'confirmChallan') && (
            <button onClick={confirm} disabled={busy}><ArrowOut size={16} /> {busy ? 'Confirming…' : 'Confirm challan'}</button>
          )}
        </div>
      </div>
      {error && <p className="error banner-error">{error}</p>}
      <div className="detail-grid">
        <article className="panel">
          <p className="eyebrow">DISPATCH DETAILS</p>
          <dl className="detail-list">
            <div><dt>Customer</dt><dd>{String(challan.customer_name)} ({String(challan.business_name)})</dd></div>
            <div><dt>Created by</dt><dd>{String(challan.created_by_name || '—')}</dd></div>
            <div><dt>Created</dt><dd>{fmtDate(challan.created_at as string)}</dd></div>
            {challan.confirmed_at ? <div><dt>Confirmed</dt><dd>{fmtDate(challan.confirmed_at as string)}</dd></div> : null}
            <div><dt>Total value</dt><dd>{fmtCurrency(totalValue)}</dd></div>
          </dl>
        </article>
        <article className="panel">
          <p className="eyebrow">PRODUCT SNAPSHOT</p>
          <p className="hint snapshot-note">Prices and SKUs are frozen at challan creation and cannot be changed.</p>
          {items.length ? (
            <table><thead><tr><th>Product</th><th>SKU</th><th>Price</th><th>Qty</th><th>Line total</th></tr></thead>
              <tbody>{items.map(i => (
                <tr key={String(i.id)}>
                  <td><b>{String(i.product_name)}</b></td>
                  <td>{String(i.sku)}</td>
                  <td>{fmtCurrency(Number(i.unit_price))}</td>
                  <td>{String(i.quantity)}</td>
                  <td>{fmtCurrency(Number(i.unit_price) * Number(i.quantity))}</td>
                </tr>
              ))}</tbody>
            </table>
          ) : <Empty>No line items.</Empty>}
        </article>
      </div>
    </>
  );
}

function Challans({ token, user }: { token: string; user: User }) {
  const { id } = parseRoute();
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [adding, setAdding] = useState(false);
  const load = () => api<{ data: Record<string, unknown>[] }>('/challans', token).then(x => setData(x.data));
  useEffect(() => { void load(); }, [token]);
  if (id) return <ChallanDetail token={token} user={user} id={id} />;

  return (
    <>
      <div className="page-head">
        <div><p className="eyebrow">FULFILMENT</p><h1>Sales challans</h1><p className="muted">Draft carefully. Confirm confidently.</p></div>
        {can(user.role, 'createChallan') && <button onClick={() => setAdding(true)}><Plus size={17} /> New challan</button>}
      </div>
      <article className="panel">
        {data.length ? (
          <table><thead><tr><th>Challan no.</th><th>Customer</th><th>Units</th><th>Created by</th><th>Date</th><th>Status</th></tr></thead>
            <tbody>{data.map(c => (
              <tr key={String(c.id)} className="clickable" onClick={() => navigate('challans', String(c.id))}>
                <td><b>{String(c.challan_number)}</b></td>
                <td>{String(c.business_name)}</td>
                <td>{String(c.total_quantity)}</td>
                <td>{String(c.created_by_name)}</td>
                <td>{fmtDate(c.created_at as string)}</td>
                <td><Badge>{String(c.status)}</Badge></td>
              </tr>
            ))}</tbody>
          </table>
        ) : <Empty>No sales challans yet. {can(user.role, 'createChallan') ? 'Create your first dispatch challan.' : ''}</Empty>}
      </article>
      {adding && <Modal title="Create sales challan" onClose={() => setAdding(false)} wide><ChallanForm token={token} onDone={() => { setAdding(false); void load(); }} /></Modal>}
    </>
  );
}

/* ─── App shell ─── */

function App() {
  const [session, setSession] = useState<{ token: string; user: User } | null>(() => {
    const s = localStorage.getItem('nexus');
    return s ? JSON.parse(s) as { token: string; user: User } : null;
  });
  const [route, setRoute] = useState(parseRoute);

  useEffect(() => {
    const h = () => setRoute(parseRoute());
    addEventListener('hashchange', h);
    return () => removeEventListener('hashchange', h);
  }, []);

  if (!session) {
    return <Login onLogin={(token, user) => { localStorage.setItem('nexus', JSON.stringify({ token, user })); setSession({ token, user }); }} />;
  }

  const { section } = route;
  const nav: [string, string, typeof LayoutDashboard][] = [
    ['dashboard', 'Pulse', LayoutDashboard],
    ['customers', 'Customers', Users],
    ['products', 'Inventory', Package],
    ['challans', 'Challans', FileText],
  ];

  const views: Record<string, ReactNode> = {
    dashboard: <Dashboard token={session.token} user={session.user} />,
    customers: <Customers token={session.token} user={session.user} />,
    products: <Products token={session.token} user={session.user} />,
    challans: <Challans token={session.token} user={session.user} />,
  };

  return (
    <div className="shell">
      <aside>
        <a href="#dashboard" className="logo" onClick={e => { e.preventDefault(); navigate('dashboard'); }}><span>N</span> nexus <i>ops</i></a>
        <nav>
          {nav.map(([id, label, I]) => (
            <a href={'#' + id} className={section === id ? 'active' : ''} key={id}
              onClick={e => { e.preventDefault(); navigate(id); }}>
              <I size={18} />{label}
            </a>
          ))}
        </nav>
        <div className="user">
          <div className="avatar">{session.user.name[0]}</div>
          <div><b>{session.user.name}</b><small>{session.user.role}</small></div>
          <button title="Sign out" aria-label="Sign out" onClick={() => { localStorage.removeItem('nexus'); setSession(null); }}><LogOut size={17} /></button>
        </div>
      </aside>
      <main className="content">{views[section] || views.dashboard}</main>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
