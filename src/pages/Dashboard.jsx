import { useState, useEffect } from 'react';
import api from '../api/axios';
import {
  Package, ArrowLeftRight, AlertTriangle,
  TrendingDown, Clock, Users, Activity
} from 'lucide-react';

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="p-5 transition-colors border bg-dark-900 border-dark-700 rounded-2xl hover:border-dark-600">
    <div className="flex items-center justify-between mb-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
    <p className="text-2xl font-bold text-white">{value ?? '0'}</p>
    <p className="mt-1 text-sm text-dark-400">{label}</p>
  </div>
);

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
  const config = ACTION_LABELS[action] ?? { label: action, color: 'bg-dark-800 text-dark-400' };
  return (
    <span className={`flex-shrink-0 px-2 py-1 text-xs rounded-lg font-medium ${config.color}`}>
      {config.label}
    </span>
  );
};

export default function Dashboard() {
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/stats')
      .then(r => setStats(r.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 rounded-full border-accent border-t-transparent animate-spin"/>
    </div>
  );

  const cards = [
    { icon: Package,        label: 'Total Items',    value: stats?.total_items,    color: 'bg-blue-500/15 text-blue-400'     },
    { icon: ArrowLeftRight, label: 'Borrowed',        value: stats?.borrowed_items, color: 'bg-accent/15 text-accent'         },
    { icon: AlertTriangle,  label: 'Damaged',         value: stats?.damaged_items,  color: 'bg-orange-500/15 text-orange-400' },
    { icon: TrendingDown,   label: 'Low Stock',       value: stats?.low_stock_items,color: 'bg-yellow-500/15 text-yellow-400' },
    { icon: Clock,          label: 'Overdue Borrows', value: stats?.overdue_borrows,color: 'bg-red-500/15 text-red-400'       },
    { icon: Users,          label: 'Total Users',     value: stats?.total_users,    color: 'bg-green-500/15 text-green-400'   },
  ];

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="mt-1 text-sm text-dark-400">Overview of your inventory system</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {cards.map((c, i) => <StatCard key={i} {...c} />)}
      </div>

      {/* Recent Activity */}
      <div className="p-5 border bg-dark-900 border-dark-700 rounded-2xl">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-4 h-4 text-accent"/>
          <h2 className="font-semibold text-white">Recent Activity</h2>
          <span className="ml-auto text-xs text-dark-500">
            {stats?.recent_activity?.length ?? 0} entries
          </span>
        </div>
        <div className="space-y-1">
          {stats?.recent_activity?.length === 0 ? (
            <p className="py-8 text-sm text-center text-dark-500">No recent activity</p>
          ) : (
            stats?.recent_activity?.map(log => (
              <div key={log.id} className="flex items-start gap-3 py-3 border-b border-dark-800 last:border-0">
                <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-accent"/>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-dark-200">{log.description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-dark-500">{log.user?.name ?? 'System'}</span>
                    <span className="text-dark-700">•</span>
                    <span className="text-xs text-dark-500">
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>
                <ActionBadge action={log.action}/>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}