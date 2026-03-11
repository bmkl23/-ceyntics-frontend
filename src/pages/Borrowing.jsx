import { useState, useEffect } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { Plus, Search, ArrowLeftRight, RotateCcw, X, Info } from 'lucide-react';

const STATUS_COLORS = {
  active:             'bg-blue-500/15 text-blue-400 border-blue-500/20',
  partially_returned: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
  returned:           'bg-green-500/15 text-green-400 border-green-500/20',
  overdue:            'bg-red-500/15 text-red-400 border-red-500/20',
};

export default function Borrowing() {
  const [borrows, setBorrows]               = useState([]);
  const [loading, setLoading]               = useState(true);
  const [search, setSearch]                 = useState('');
  const [status, setStatus]                 = useState('');
  const [items, setItems]                   = useState([]);
  const [showCreate, setShowCreate]         = useState(false);
  const [showReturn, setShowReturn]         = useState(null);
  const [returnQtyGood, setReturnQtyGood]   = useState(0);
  const [returnQtyDamaged, setReturnQtyDamaged] = useState(0);
  const [form, setForm] = useState({
    item_id:'', borrower_name:'', contact:'',
    quantity_borrowed:'', borrow_date:'', expected_return:'', notes:''
  });

  const fetchBorrows = async () => {
    setLoading(true);
    try {
      const params = {};
      if (status) params.status = status;
      const r = await api.get('/borrows', { params });
      const data = search
        ? r.data.filter(b => b.borrower_name.toLowerCase().includes(search.toLowerCase()))
        : r.data;
      setBorrows(data);
    } finally { setLoading(false); }
  };

  useEffect(() => {
    // Only show items available for borrowing (not damaged or missing)
    api.get('/items').then(r =>
      setItems(r.data.filter(i => i.status !== 'damaged' && i.status !== 'missing'))
    );
  }, []);

  useEffect(() => { fetchBorrows(); }, [status, search]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/borrows', form);
      toast.success('Borrow record created!');
      setShowCreate(false);
      setForm({ item_id:'', borrower_name:'', contact:'', quantity_borrowed:'', borrow_date:'', expected_return:'', notes:'' });
      fetchBorrows();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error creating borrow record');
    }
  };

  const handleReturn = async () => {
    const totalReturning = returnQtyGood + returnQtyDamaged;
    const stillOut = showReturn.quantity_borrowed - showReturn.quantity_returned;

    // Validation
    if (totalReturning === 0) {
      toast.error('Please enter at least 1 item to return');
      return;
    }
    if (totalReturning > stillOut) {
      toast.error('Total exceeds the number of items still out!');
      return;
    }

    try {
      // Step 1 — record the return (restores quantity in stock)
      await api.patch(`/borrows/${showReturn.id}/return`, {
        quantity_returned: totalReturning
      });

      // Step 2 — if any items came back damaged, update item status
      if (returnQtyDamaged > 0) {
        await api.patch(`/items/${showReturn.item_id}/status`, { status: 'damaged' });
        toast.success(`Return processed — ${returnQtyDamaged} item(s) marked as Damaged`);
      } else {
        toast.success('Return processed successfully!');
      }

      setShowReturn(null);
      setReturnQtyGood(0);
      setReturnQtyDamaged(0);
      fetchBorrows();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error processing return');
    }
  };

  // Computed values for return modal
  const stillOut         = showReturn ? showReturn.quantity_borrowed - showReturn.quantity_returned : 0;
  const totalReturning   = returnQtyGood + returnQtyDamaged;
  const notAccountedFor  = stillOut - totalReturning;
  const isOverLimit      = totalReturning > stillOut;

  return (
    <div className="space-y-6">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Borrowing</h1>
          <p className="mt-1 text-sm text-dark-400">{borrows.length} records</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4"/> New Borrow
        </button>
      </div>



      {/* ── Filters ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute w-4 h-4 -translate-y-1/2 left-3 top-1/2 text-dark-400"/>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search borrower name..."
            className="w-full bg-dark-900 border border-dark-700 rounded-xl py-2.5 pl-9 pr-4 text-white placeholder-dark-500 focus:outline-none focus:border-accent text-sm"
          />
        </div>
        <select
          value={status}
          onChange={e => setStatus(e.target.value)}
          className="bg-dark-900 border border-dark-700 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:border-accent text-sm"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="partially_returned">Partially Returned</option>
          <option value="returned">Returned</option>
          <option value="overdue">Overdue</option>
        </select>
      </div>

      {/* ── Table ───────────────────────────────────────────────── */}
      <div className="overflow-hidden border bg-dark-900 border-dark-700 rounded-2xl">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-2 rounded-full border-accent border-t-transparent animate-spin"/>
          </div>
        ) : borrows.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-dark-500">
            <ArrowLeftRight className="w-10 h-10 mb-2"/>
            <p>No borrow records found</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-700">
                {['Borrower','Item','Qty','Borrow Date','Expected Return','Status',''].map(h => (
                  <th key={h} className="px-5 py-3 text-xs font-medium tracking-wider text-left uppercase text-dark-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-800">
              {borrows.map(b => (
                <tr key={b.id} className="transition-colors hover:bg-dark-800/50">

                  {/* Borrower */}
                  <td className="px-5 py-4">
                    <p className="text-sm font-medium text-white">{b.borrower_name}</p>
                    <p className="text-xs text-dark-500">{b.contact}</p>
                  </td>

                  {/* Item */}
                  <td className="px-5 py-4 text-sm text-dark-300">{b.item?.name}</td>

                  {/* Qty: returned / borrowed */}
                  <td className="px-5 py-4">
                    <span className="text-sm font-medium text-white">{b.quantity_returned}</span>
                    <span className="text-sm text-dark-500">/{b.quantity_borrowed}</span>
                    <p className="text-xs text-dark-600">returned/borrowed</p>
                  </td>

                  {/* Borrow date */}
                  <td className="px-5 py-4 text-sm text-dark-300">
                    {new Date(b.borrow_date).toLocaleDateString()}
                  </td>

                  {/* Expected return — red if overdue */}
                  <td className="px-5 py-4">
                    <span className={`text-sm ${new Date(b.expected_return) < new Date() && b.status === 'active' ? 'text-red-400' : 'text-dark-300'}`}>
                      {new Date(b.expected_return).toLocaleDateString()}
                    </span>
                    {new Date(b.expected_return) < new Date() && b.status === 'active' && (
                      <p className="text-xs text-red-400">Overdue!</p>
                    )}
                  </td>

                  {/* Status badge */}
                  <td className="px-5 py-4">
                    <span className={`text-xs px-2.5 py-1 rounded-lg border font-medium ${STATUS_COLORS[b.status]}`}>
                      {b.status.replace(/_/g, ' ')}
                    </span>
                  </td>

                  {/* Return button */}
                  <td className="px-5 py-4">
                    {b.status !== 'returned' && (
                      <button
                        onClick={() => {
                          setShowReturn(b);
                          setReturnQtyGood(0);
                          setReturnQtyDamaged(0);
                        }}
                        className="flex items-center gap-1.5 text-xs text-accent hover:text-accent-light bg-accent/10 hover:bg-accent/20 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <RotateCcw className="w-3 h-3"/> Return
                      </button>
                    )}
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Create Borrow Modal ──────────────────────────────────── */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-dark-900 border border-dark-700 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-dark-700">
              <div>
                <h2 className="font-semibold text-white">New Borrow Record</h2>
                <p className="text-dark-500 text-xs mt-0.5">Stock will be deducted automatically</p>
              </div>
              <button onClick={() => setShowCreate(false)}>
                <X className="w-5 h-5 text-dark-400"/>
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">

              <div>
                <label className="block text-xs font-medium text-dark-400 mb-1.5">
                  Item to Borrow
                  <span className="ml-1 font-normal text-dark-600">(only available items shown)</span>
                </label>
                <select
                  required
                  value={form.item_id}
                  onChange={e => setForm({...form, item_id: e.target.value})}
                  className="w-full bg-dark-800 border border-dark-600 rounded-xl py-2.5 px-3 text-white text-sm focus:outline-none focus:border-accent"
                >
                  <option value="">Select item...</option>
                  {items.map(i => (
                    <option key={i.id} value={i.id}>
                      {i.name} ({i.code}) — {i.quantity} available
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  ['borrower_name',    'Borrower Name',   'text',   'e.g. Mr. Perera'],
                  ['contact',          'Contact Number',  'text',   'e.g. 0771234567'],
                  ['quantity_borrowed','Quantity',        'number', 'How many units'],
                  ['borrow_date',      'Borrow Date',     'date',   ''],
                  ['expected_return',  'Expected Return', 'date',   ''],
                ].map(([field, label, type, hint]) => (
                  <div key={field}>
                    <label className="block text-xs font-medium text-dark-400 mb-1.5">{label}</label>
                    <input
                      type={type} required
                      placeholder={hint}
                      value={form[field]}
                      onChange={e => setForm({...form, [field]: e.target.value})}
                      className="w-full bg-dark-800 border border-dark-600 rounded-xl py-2.5 px-3 text-white text-sm focus:outline-none focus:border-accent"
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-xs font-medium text-dark-400 mb-1.5">Notes (optional)</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm({...form, notes: e.target.value})}
                  rows={2}
                  placeholder="e.g. Borrowed for client demo..."
                  className="w-full bg-dark-800 border border-dark-600 rounded-xl py-2.5 px-3 text-white text-sm focus:outline-none focus:border-accent resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)}
                  className="flex-1 py-2.5 rounded-xl border border-dark-600 text-dark-300 text-sm">
                  Cancel
                </button>
                <button type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-white text-sm font-medium">
                  Create Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Return Modal ─────────────────────────────────────────── */}
      {showReturn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="w-full max-w-sm border bg-dark-900 border-dark-700 rounded-2xl">
            <div className="flex items-center justify-between p-6 border-b border-dark-700">
              <div>
                <h2 className="font-semibold text-white">Process Return</h2>
                <p className="text-dark-500 text-xs mt-0.5">Enter how many came back good vs damaged</p>
              </div>
              <button onClick={() => setShowReturn(null)}>
                <X className="w-5 h-5 text-dark-400"/>
              </button>
            </div>
            <div className="p-6 space-y-4">

              {/* Borrow summary */}
              <div className="bg-dark-800 rounded-xl p-4 space-y-1.5">
                <p className="text-sm font-medium text-white">{showReturn.borrower_name}</p>
                <p className="text-xs text-dark-400">{showReturn.item?.name}</p>
                <div className="flex gap-4 pt-1">
                  <div>
                    <p className="text-xs text-dark-500">Borrowed</p>
                    <p className="text-sm font-semibold text-white">{showReturn.quantity_borrowed}</p>
                  </div>
                  <div>
                    <p className="text-xs text-dark-500">Already Returned</p>
                    <p className="text-sm font-semibold text-white">{showReturn.quantity_returned}</p>
                  </div>
                  <div>
                    <p className="text-xs text-dark-500">Still Out</p>
                    <p className="text-sm font-semibold text-yellow-400">{stillOut}</p>
                  </div>
                </div>
              </div>

              {/* Good quantity */}
              <div>
                <label className="block text-xs font-medium text-dark-400 mb-1.5">
                  ✅ Quantity Returned in Good Condition
                </label>
                <input
                  type="number" min="0" max={stillOut}
                  value={returnQtyGood}
                  onChange={e => setReturnQtyGood(Number(e.target.value))}
                  className="w-full bg-dark-800 border border-dark-600 rounded-xl py-2.5 px-3 text-white text-sm focus:outline-none focus:border-accent"
                />
              </div>

              {/* Damaged quantity */}
              <div>
                <label className="block text-xs font-medium text-dark-400 mb-1.5">
                  ⚠️ Quantity Returned Damaged
                </label>
                <input
                  type="number" min="0" max={stillOut}
                  value={returnQtyDamaged}
                  onChange={e => setReturnQtyDamaged(Number(e.target.value))}
                  className="w-full bg-dark-800 border border-dark-600 rounded-xl py-2.5 px-3 text-white text-sm focus:outline-none focus:border-accent"
                />
              </div>

              {/* Live return summary */}
              {totalReturning > 0 && !isOverLimit && (
                <div className="bg-dark-800 rounded-xl px-4 py-3 space-y-1.5">
                  <p className="text-xs font-medium tracking-wide uppercase text-dark-400">Return Summary</p>
                  {returnQtyGood > 0 && (
                    <p className="text-xs text-green-400">✅ {returnQtyGood} item(s) back in stock</p>
                  )}
                  {returnQtyDamaged > 0 && (
                    <p className="text-xs text-orange-400">⚠️ {returnQtyDamaged} item(s) will be marked as Damaged</p>
                  )}
                  {notAccountedFor > 0 && (
                    <p className="text-xs text-red-400">❌ {notAccountedFor} item(s) still not accounted for</p>
                  )}
                  {notAccountedFor === 0 && (
                    <p className="text-xs text-dark-500">✓ All items accounted for</p>
                  )}
                </div>
              )}

              {/* Over limit warning */}
              {isOverLimit && (
                <div className="px-4 py-3 border bg-red-500/10 border-red-500/20 rounded-xl">
                  <p className="text-xs text-red-400">
                    ⚠️ Total ({totalReturning}) exceeds items still out ({stillOut})!
                  </p>
                </div>
              )}

              {/* Damaged warning */}
              {returnQtyDamaged > 0 && !isOverLimit && (
                <div className="px-4 py-3 border bg-orange-500/10 border-orange-500/20 rounded-xl">
                  <p className="text-xs leading-relaxed text-orange-400">
                    ⚠️ Item will be marked as <strong>Damaged</strong> and will not be available for future borrowing until restored.
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setShowReturn(null)}
                  className="flex-1 py-2.5 rounded-xl border border-dark-600 text-dark-300 text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReturn}
                  disabled={isOverLimit || totalReturning === 0}
                  className="flex-1 py-2.5 rounded-xl bg-accent hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
                >
                  Confirm Return
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
