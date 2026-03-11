import { useState, useEffect } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { Plus, Search, Package, Edit, Trash2, TrendingDown, X } from 'lucide-react';

const STATUS_COLORS = {
  in_store:  'bg-green-500/15 text-green-400 border-green-500/20',
  borrowed:  'bg-blue-500/15 text-blue-400 border-blue-500/20',
  damaged:   'bg-orange-500/15 text-orange-400 border-orange-500/20',
  missing:   'bg-red-500/15 text-red-400 border-red-500/20',
};

export default function Inventory() {
  const [items, setItems]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [status, setStatus]     = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]   = useState(null);
  const [places, setPlaces]     = useState([]);
  const [form, setForm] = useState({
    name:'', code:'', quantity:'', place_id:'',
    serial_number:'', description:'', category:'', min_quantity:'', image:null
  });

  const fetchItems = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (status) params.status = status;
      const r = await api.get('/items', { params });
      setItems(r.data);
    } finally { setLoading(false); }
  };

  useEffect(() => {
    api.get('/places').then(r => setPlaces(r.data));
  }, []);

  useEffect(() => { fetchItems(); }, [search, status]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name:'', code:'', quantity:'', place_id:'', serial_number:'', description:'', category:'', min_quantity:'', image:null });
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setForm({
      name: item.name, code: item.code, quantity: item.quantity,
      place_id: item.place_id, serial_number: item.serial_number || '',
      description: item.description || '', category: item.category || '',
      min_quantity: item.min_quantity, image: null
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v !== null && v !== '') data.append(k, v); });
      if (editing) {
        await api.post(`/items/${editing.id}?_method=PUT`, data, { headers: { 'Content-Type': 'multipart/form-data' }});
        toast.success('Item updated!');
      } else {
        await api.post('/items', data, { headers: { 'Content-Type': 'multipart/form-data' }});
        toast.success('Item created!');
      }
      setShowModal(false);
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this item?')) return;
    try {
      await api.delete(`/items/${id}`);
      toast.success('Item deleted');
      fetchItems();
    } catch { toast.error('Error deleting item'); }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Inventory</h1>
          <p className="mt-1 text-sm text-dark-400">{items.length} items total</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors">
          <Plus className="w-4 h-4"/> Add Item
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute w-4 h-4 -translate-y-1/2 left-3 top-1/2 text-dark-400"/>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search items..."
            className="w-full bg-dark-900 border border-dark-700 rounded-xl py-2.5 pl-9 pr-4 text-white placeholder-dark-500 focus:outline-none focus:border-accent text-sm"/>
        </div>
        <select value={status} onChange={e => setStatus(e.target.value)}
          className="bg-dark-900 border border-dark-700 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:border-accent text-sm">
          <option value="">All Status</option>
          <option value="in_store">In Store</option>
          <option value="borrowed">Borrowed</option>
          <option value="damaged">Damaged</option>
          <option value="missing">Missing</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden border bg-dark-900 border-dark-700 rounded-2xl">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-2 rounded-full border-accent border-t-transparent animate-spin"/>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-dark-500">
            <Package className="w-10 h-10 mb-2"/>
            <p>No items found</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-700">
                {['Item','Code','Qty','Location','Status',''].map(h => (
                  <th key={h} className="px-5 py-3 text-xs font-medium tracking-wider text-left uppercase text-dark-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-800">
              {items.map(item => (
                <tr key={item.id} className="transition-colors hover:bg-dark-800/50">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      {item.image_url ? (
                        <img src={item.image_url} className="object-cover border rounded-lg w-9 h-9 border-dark-600"/>
                      ) : (
                        <div className="flex items-center justify-center rounded-lg w-9 h-9 bg-dark-700">
                          <Package className="w-4 h-4 text-dark-500"/>
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-white">{item.name}</p>
                        <p className="text-xs text-dark-500">{item.category}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 font-mono text-sm text-dark-300">{item.code}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1">
                      <span className={`text-sm font-semibold ${item.quantity <= item.min_quantity ? 'text-yellow-400' : 'text-white'}`}>
                        {item.quantity}
                      </span>
                      {item.quantity <= item.min_quantity && <TrendingDown className="w-3 h-3 text-yellow-400"/>}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-dark-300">{item.place?.name}</td>
                  <td className="px-5 py-4">
                    <span className={`text-xs px-2.5 py-1 rounded-lg border font-medium ${STATUS_COLORS[item.status]}`}>
                      {item.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(item)} className="p-1.5 text-dark-400 hover:text-white hover:bg-dark-700 rounded-lg transition-colors">
                        <Edit className="w-3.5 h-3.5"/>
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="p-1.5 text-dark-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                        <Trash2 className="w-3.5 h-3.5"/>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-dark-900 border border-dark-700 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-dark-700">
              <h2 className="font-semibold text-white">{editing ? 'Edit Item' : 'Add Item'}</h2>
              <button onClick={() => setShowModal(false)} className="text-dark-400 hover:text-white">
                <X className="w-5 h-5"/>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {[['name','Item Name','text',true],['code','Code','text',true],['quantity','Quantity','number',true],['min_quantity','Min Quantity','number',false],['serial_number','Serial Number','text',false],['category','Category','text',false]].map(([field, label, type, req]) => (
                  <div key={field}>
                    <label className="block text-xs font-medium text-dark-400 mb-1.5">{label}</label>
                    <input type={type} required={req} value={form[field]} onChange={e => setForm({...form, [field]: e.target.value})}
                      className="w-full bg-dark-800 border border-dark-600 rounded-xl py-2.5 px-3 text-white text-sm focus:outline-none focus:border-accent"/>
                  </div>
                ))}
              </div>
              <div>
                <label className="block text-xs font-medium text-dark-400 mb-1.5">Location</label>
                <select required value={form.place_id} onChange={e => setForm({...form, place_id: e.target.value})}
                  className="w-full bg-dark-800 border border-dark-600 rounded-xl py-2.5 px-3 text-white text-sm focus:outline-none focus:border-accent">
                  <option value="">Select place</option>
                  {places.map(p => <option key={p.id} value={p.id}>{p.name} — {p.cupboard?.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-dark-400 mb-1.5">Description</label>
                <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={2}
                  className="w-full bg-dark-800 border border-dark-600 rounded-xl py-2.5 px-3 text-white text-sm focus:outline-none focus:border-accent resize-none"/>
              </div>
              <div>
                <label className="block text-xs font-medium text-dark-400 mb-1.5">Image</label>
                <input type="file" accept="image/*" onChange={e => setForm({...form, image: e.target.files[0]})}
                  className="w-full bg-dark-800 border border-dark-600 rounded-xl py-2.5 px-3 text-dark-300 text-sm focus:outline-none focus:border-accent file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-accent/20 file:text-accent file:text-xs"/>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl border border-dark-600 text-dark-300 hover:text-white text-sm transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-white text-sm font-medium transition-colors">
                  {editing ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}