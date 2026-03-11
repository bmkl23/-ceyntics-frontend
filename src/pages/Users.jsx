import { useState, useEffect } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { Plus, UserCog, Edit, UserX, UserCheck, Trash2, X } from 'lucide-react';

export default function Users() {
  const [users, setUsers]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]   = useState(null);
  const [form, setForm] = useState({
    name: '', email: '', password: '', role: 'staff'
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const r = await api.get('/users');
      setUsers(r.data);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', email: '', password: '', role: 'staff' });
    setShowModal(true);
  };

  const openEdit = (user) => {
    setEditing(user);
    setForm({ name: user.name, email: user.email, password: '', role: user.role });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form };
      if (editing && !payload.password) delete payload.password;

      if (editing) {
        await api.put(`/users/${editing.id}`, payload);
        toast.success('User updated!');
      } else {
        await api.post('/users', payload);
        toast.success('User created!');
      }
      setShowModal(false);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving user');
    }
  };

  const handleToggleStatus = async (user) => {
    try {
      await api.patch(`/users/${user.id}/deactivate`);
      toast.success(`User ${user.is_active ? 'deactivated' : 'activated'}`);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error updating status');
    }
  };

  const handleDelete = async (user) => {
    if (!confirm(`Delete "${user.name}" permanently?\n\nWarning: This cannot be undone. Consider deactivating instead to preserve audit history.`)) return;
    try {
      await api.delete(`/users/${user.id}`);
      toast.success('User deleted');
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cannot delete this user');
    }
  };

  // Avatar initials + color
  const getAvatar = (name) => {
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    const colors = [
      'bg-purple-500/30 text-purple-300',
      'bg-blue-500/30 text-blue-300',
      'bg-green-500/30 text-green-300',
      'bg-orange-500/30 text-orange-300',
      'bg-pink-500/30 text-pink-300',
    ];
    const color = colors[name.charCodeAt(0) % colors.length];
    return { initials, color };
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Users</h1>
          <p className="mt-1 text-sm text-dark-400">{users.length} users total</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors">
          <Plus className="w-4 h-4"/> Add User
        </button>
      </div>

      {/* Table */}
      <div className="overflow-hidden border bg-dark-900 border-dark-700 rounded-2xl">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-2 rounded-full border-accent border-t-transparent animate-spin"/>
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-dark-500">
            <UserCog className="w-10 h-10 mb-2"/>
            <p>No users found</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-700">
                {['User', 'Email', 'Role', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-5 py-3 text-xs font-medium tracking-wider text-left uppercase text-dark-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-800">
              {users.map(user => {
                const { initials, color } = getAvatar(user.name);
                return (
                  <tr key={user.id} className="transition-colors hover:bg-dark-800/50">

                    {/* Avatar + Name */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-semibold ${color}`}>
                          {initials}
                        </div>
                        <p className="text-sm font-medium text-white">{user.name}</p>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-5 py-4 text-sm text-dark-300">{user.email}</td>

                    {/* Role badge */}
                    <td className="px-5 py-4">
                      <span className={`text-xs px-2.5 py-1 rounded-lg border font-medium ${
                        user.role === 'admin'
                          ? 'bg-accent/15 text-accent border-accent/20'
                          : 'bg-dark-700 text-dark-300 border-dark-600'
                      }`}>
                        {user.role}
                      </span>
                    </td>

                    {/* Active/Inactive status */}
                    <td className="px-5 py-4">
                      <span className={`text-xs px-2.5 py-1 rounded-lg border font-medium ${
                        user.is_active
                          ? 'bg-green-500/15 text-green-400 border-green-500/20'
                          : 'bg-red-500/15 text-red-400 border-red-500/20'
                      }`}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">

                        {/* Edit */}
                        <button
                          onClick={() => openEdit(user)}
                          title="Edit user"
                          className="p-1.5 text-dark-400 hover:text-white hover:bg-dark-700 rounded-lg transition-colors"
                        >
                          <Edit className="w-3.5 h-3.5"/>
                        </button>

                        {/* Activate / Deactivate toggle */}
                        <button
                          onClick={() => handleToggleStatus(user)}
                          title={user.is_active ? 'Deactivate user' : 'Activate user'}
                          className={`p-1.5 rounded-lg transition-colors ${
                            user.is_active
                              ? 'text-dark-400 hover:text-orange-400 hover:bg-orange-500/10'
                              : 'text-dark-400 hover:text-green-400 hover:bg-green-500/10'
                          }`}
                        >
                          {user.is_active
                            ? <UserX className="w-3.5 h-3.5"/>
                            : <UserCheck className="w-3.5 h-3.5"/>
                          }
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => handleDelete(user)}
                          title="Delete user permanently"
                          className="p-1.5 text-dark-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5"/>
                        </button>

                      </div>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="w-full max-w-md border bg-dark-900 border-dark-700 rounded-2xl">
            <div className="flex items-center justify-between p-6 border-b border-dark-700">
              <div>
                <h2 className="font-semibold text-white">{editing ? 'Edit User' : 'Add New User'}</h2>
                <p className="text-dark-500 text-xs mt-0.5">
                  {editing ? 'Update user details below' : 'Create a new system user'}
                </p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-dark-400 hover:text-white">
                <X className="w-5 h-5"/>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">

              <div>
                <label className="block text-xs font-medium text-dark-400 mb-1.5">Full Name</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Kasuni Perera"
                  value={form.name}
                  onChange={e => setForm({...form, name: e.target.value})}
                  className="w-full bg-dark-800 border border-dark-600 rounded-xl py-2.5 px-3 text-white text-sm focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-dark-400 mb-1.5">Email Address</label>
                <input
                  required
                  type="email"
                  placeholder="e.g. kasuni@ceyntics.com"
                  value={form.email}
                  onChange={e => setForm({...form, email: e.target.value})}
                  className="w-full bg-dark-800 border border-dark-600 rounded-xl py-2.5 px-3 text-white text-sm focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-dark-400 mb-1.5">
                  Password
                  {editing && <span className="ml-1 font-normal text-dark-600">(leave blank to keep current)</span>}
                </label>
                <input
                  type="password"
                  required={!editing}
                  placeholder={editing ? 'Leave blank to keep current' : 'Min 8 characters'}
                  value={form.password}
                  onChange={e => setForm({...form, password: e.target.value})}
                  className="w-full bg-dark-800 border border-dark-600 rounded-xl py-2.5 px-3 text-white text-sm focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-dark-400 mb-1.5">Role</label>
                <select
                  value={form.role}
                  onChange={e => setForm({...form, role: e.target.value})}
                  className="w-full bg-dark-800 border border-dark-600 rounded-xl py-2.5 px-3 text-white text-sm focus:outline-none focus:border-accent"
                >
                  <option value="staff">Staff — can view and borrow items</option>
                  <option value="admin">Admin — full system access</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-dark-600 text-dark-300 text-sm">
                  Cancel
                </button>
                <button type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-white text-sm font-medium">
                  {editing ? 'Save Changes' : 'Create User'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
