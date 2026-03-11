import { useState, useEffect } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { Plus, Archive, Edit, Trash2, X, ChevronDown, ChevronUp } from 'lucide-react';

export default function Cupboards() {
  const [cupboards, setCupboards] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [expanded, setExpanded]   = useState({});
  const [showModal, setShowModal] = useState(false);
  const [showPlaceModal, setShowPlaceModal] = useState(false);
  const [editing, setEditing]     = useState(null);
  const [selectedCupboard, setSelectedCupboard] = useState(null);
  const [form, setForm]           = useState({ name:'', location:'', description:'' });
  const [placeForm, setPlaceForm] = useState({ name:'', description:'' });

  const fetchCupboards = () => {
    setLoading(true);
    api.get('/cupboards').then(r => setCupboards(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchCupboards(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/cupboards/${editing.id}`, form);
        toast.success('Cupboard updated!');
      } else {
        await api.post('/cupboards', form);
        toast.success('Cupboard created!');
      }
      setShowModal(false);
      fetchCupboards();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const handlePlaceSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/places', { ...placeForm, cupboard_id: selectedCupboard.id });
      toast.success('Place created!');
      setShowPlaceModal(false);
      fetchCupboards();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const deleteCupboard = async (id) => {
    if (!confirm('Delete this cupboard?')) return;
    try {
      await api.delete(`/cupboards/${id}`);
      toast.success('Cupboard deleted');
      fetchCupboards();
    } catch { toast.error('Error'); }
  };

  const deletePlace = async (id) => {
    if (!confirm('Delete this place?')) return;
    try {
      await api.delete(`/places/${id}`);
      toast.success('Place deleted');
      fetchCupboards();
    } catch { toast.error('Error'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Cupboards & Places</h1>
          <p className="text-dark-400 text-sm mt-1">Manage storage locations</p>
        </div>
        <button onClick={() => { setEditing(null); setForm({name:'',location:'',description:''}); setShowModal(true); }}
          className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors">
          <Plus className="w-4 h-4"/> Add Cupboard
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-2 border-accent rounded-full border-t-transparent animate-spin"/>
        </div>
      ) : (
        <div className="space-y-3">
          {cupboards.map(cupboard => (
            <div key={cupboard.id} className="bg-dark-900 border border-dark-700 rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between p-5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-accent/15 border border-accent/20 flex items-center justify-center">
                    <Archive className="w-4 h-4 text-accent"/>
                  </div>
                  <div>
                    <p className="text-white font-medium">{cupboard.name}</p>
                    <p className="text-dark-500 text-xs">{cupboard.location} • {cupboard.places?.length || 0} places</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => { setSelectedCupboard(cupboard); setPlaceForm({name:'',description:''}); setShowPlaceModal(true); }}
                    className="text-xs bg-dark-700 hover:bg-dark-600 text-dark-300 hover:text-white px-3 py-1.5 rounded-lg transition-colors">
                    + Place
                  </button>
                  <button onClick={() => { setEditing(cupboard); setForm({name:cupboard.name,location:cupboard.location,description:cupboard.description||''}); setShowModal(true); }}
                    className="p-1.5 text-dark-400 hover:text-white hover:bg-dark-700 rounded-lg transition-colors">
                    <Edit className="w-3.5 h-3.5"/>
                  </button>
                  <button onClick={() => deleteCupboard(cupboard.id)}
                    className="p-1.5 text-dark-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                    <Trash2 className="w-3.5 h-3.5"/>
                  </button>
                  <button onClick={() => setExpanded(p => ({...p, [cupboard.id]: !p[cupboard.id]}))}
                    className="p-1.5 text-dark-400 hover:text-white hover:bg-dark-700 rounded-lg transition-colors">
                    {expanded[cupboard.id] ? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>}
                  </button>
                </div>
              </div>
              {expanded[cupboard.id] && (
                <div className="border-t border-dark-700 px-5 py-3 space-y-2">
                  {!cupboard.places?.length ? (
                    <p className="text-dark-500 text-sm py-2">No places yet</p>
                  ) : cupboard.places.map(place => (
                    <div key={place.id} className="flex items-center justify-between py-2 px-3 bg-dark-800 rounded-xl">
                      <div>
                        <p className="text-dark-200 text-sm">{place.name}</p>
                        {place.description && <p className="text-dark-500 text-xs">{place.description}</p>}
                      </div>
                      <button onClick={() => deletePlace(place.id)}
                        className="p-1.5 text-dark-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                        <Trash2 className="w-3.5 h-3.5"/>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Cupboard Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-dark-900 border border-dark-700 rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-dark-700">
              <h2 className="text-white font-semibold">{editing ? 'Edit Cupboard' : 'Add Cupboard'}</h2>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-dark-400"/></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {[['name','Name'],['location','Location'],['description','Description']].map(([field,label]) => (
                <div key={field}>
                  <label className="block text-xs font-medium text-dark-400 mb-1.5">{label}</label>
                  <input required={field !== 'description'} value={form[field]}
                    onChange={e => setForm({...form,[field]:e.target.value})}
                    className="w-full bg-dark-800 border border-dark-600 rounded-xl py-2.5 px-3 text-white text-sm focus:outline-none focus:border-accent"/>
                </div>
              ))}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl border border-dark-600 text-dark-300 text-sm">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-white text-sm font-medium">
                  {editing ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Place Modal */}
      {showPlaceModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-dark-900 border border-dark-700 rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-dark-700">
              <h2 className="text-white font-semibold">Add Place to {selectedCupboard?.name}</h2>
              <button onClick={() => setShowPlaceModal(false)}><X className="w-5 h-5 text-dark-400"/></button>
            </div>
            <form onSubmit={handlePlaceSubmit} className="p-6 space-y-4">
              {[['name','Place Name'],['description','Description']].map(([field,label]) => (
                <div key={field}>
                  <label className="block text-xs font-medium text-dark-400 mb-1.5">{label}</label>
                  <input required={field === 'name'} value={placeForm[field]}
                    onChange={e => setPlaceForm({...placeForm,[field]:e.target.value})}
                    className="w-full bg-dark-800 border border-dark-600 rounded-xl py-2.5 px-3 text-white text-sm focus:outline-none focus:border-accent"/>
                </div>
              ))}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowPlaceModal(false)} className="flex-1 py-2.5 rounded-xl border border-dark-600 text-dark-300 text-sm">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-white text-sm font-medium">Create Place</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}