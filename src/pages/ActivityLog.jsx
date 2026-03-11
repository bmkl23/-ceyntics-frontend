import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Search, ScrollText } from 'lucide-react';

const ACTION_LABELS = {
  'item.created':      { label: 'Item Created',      color: 'bg-green-500/15 text-green-400'   },
  'item.updated':      { label: 'Item Updated',      color: 'bg-blue-500/15 text-blue-400'     },
  'item.deleted':      { label: 'Item Deleted',      color: 'bg-red-500/15 text-red-400'       },
  'item.borrowed':     { label: 'Borrowed',          color: 'bg-accent/15 text-accent'         },
  'item.returned':     { label: 'Returned',          color: 'bg-green-500/15 text-green-400'   },
  'status.changed':    { label: 'Status Changed',    color: 'bg-orange-500/15 text-orange-400' },
  'quantity.changed':  { label: 'Qty Changed',       color: 'bg-yellow-500/15 text-yellow-400' },
  'user.created':      { label: 'User Created',      color: 'bg-purple-500/15 text-purple-400' },
  'user.updated':      { label: 'User Updated',      color: 'bg-blue-500/15 text-blue-400'     },
  'user.deactivated':  { label: 'User Deactivated',  color: 'bg-red-500/15 text-red-400'       },
  'place.created':     { label: 'Place Created',     color: 'bg-green-500/15 text-green-400'   },
  'place.updated':     { label: 'Place Updated',     color: 'bg-blue-500/15 text-blue-400'     },
  'place.deleted':     { label: 'Place Deleted',     color: 'bg-red-500/15 text-red-400'       },
  'cupboard.created':  { label: 'Cupboard Created',  color: 'bg-green-500/15 text-green-400'   },
  'cupboard.updated':  { label: 'Cupboard Updated',  color: 'bg-blue-500/15 text-blue-400'     },
  'cupboard.deleted':  { label: 'Cupboard Deleted',  color: 'bg-red-500/15 text-red-400'       },
};

const ActionBadge = ({ action }) => {
  const config = ACTION_LABELS[action] ?? { label: action, color: 'bg-dark-700 text-dark-300' };
  return (
    <span className={`text-xs px-2.5 py-1 rounded-lg font-medium ${config.color}`}>
      {config.label}
    </span>
  );
};

export default function ActivityLog() {
  const [logs, setLogs]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [action, setAction]   = useState('');

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (action) params.action = action;
    if (search) params.search = search;
    api.get('/logs', { params })
      .then(r => setLogs(r.data.data))
      .finally(() => setLoading(false));
  }, [action, search]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Activity Log</h1>
        <p className="mt-1 text-sm text-dark-400">Full audit trail of all system actions</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute w-4 h-4 -translate-y-1/2 left-3 top-1/2 text-dark-400"/>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search logs..."
            className="w-full bg-dark-900 border border-dark-700 rounded-xl py-2.5 pl-9 pr-4 text-white placeholder-dark-500 focus:outline-none focus:border-accent text-sm"/>
        </div>
        <select value={action} onChange={e => setAction(e.target.value)}
          className="bg-dark-900 border border-dark-700 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:border-accent text-sm">
          <option value="">All Actions</option>
          <option value="item.created">Item Created</option>
          <option value="item.updated">Item Updated</option>
          <option value="item.deleted">Item Deleted</option>
          <option value="item.borrowed">Borrowed</option>
          <option value="item.returned">Returned</option>
          <option value="status.changed">Status Changed</option>
          <option value="quantity.changed">Qty Changed</option>
          <option value="user.created">User Created</option>
          <option value="user.updated">User Updated</option>
          <option value="user.deactivated">User Deactivated</option>
          <option value="place.created">Place Created</option>
          <option value="cupboard.created">Cupboard Created</option>
        </select>
      </div>

      {/* Logs Table */}
      <div className="overflow-hidden border bg-dark-900 border-dark-700 rounded-2xl">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-2 rounded-full border-accent border-t-transparent animate-spin"/>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-dark-500">
            <ScrollText className="w-10 h-10 mb-2"/>
            <p>No logs found</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-700">
                {['Action', 'Description', 'Entity', 'User', 'Time'].map(h => (
                  <th key={h} className="px-5 py-3 text-xs font-medium tracking-wider text-left uppercase text-dark-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-800">
              {logs.map(log => (
                <tr key={log.id} className="transition-colors hover:bg-dark-800/50">
                  <td className="px-5 py-4">
                    <ActionBadge action={log.action}/>
                  </td>
                  <td className="max-w-xs px-5 py-4 text-sm truncate text-dark-300">{log.description}</td>
                  <td className="px-5 py-4 text-xs text-dark-400">{log.entity_type} #{log.entity_id}</td>
                  <td className="px-5 py-4 text-sm text-dark-300">{log.user?.name ?? 'System'}</td>
                  <td className="px-5 py-4 text-xs text-dark-500">{new Date(log.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
