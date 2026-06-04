import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Send, List } from 'lucide-react';

const links = [
  { to: '/', label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
  { to: '/send', label: 'Send', icon: <Send size={16} /> },
  { to: '/send-list', label: 'Send List', icon: <List size={16} /> },
];

export default function Navbar() {
  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-blue-600 flex items-center justify-center">
              <Send size={14} className="text-white" />
            </div>
            <span className="font-semibold text-gray-900 text-sm">LeadApp</span>
          </div>
          <div className="flex items-center gap-1">
            {links.map(({ to, label, icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`
                }
              >
                {icon}
                {label}
              </NavLink>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
