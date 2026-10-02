import React from 'react';
import { Network, Server, Shield } from 'lucide-react';

const redesData = [
  { sede: 'Sede Principal', subred: '10.120.0.0/8', vlan: '10', desc: 'Administración' },
  { sede: 'Sede Principal', subred: '10.120.0.0/8', vlan: '20', desc: 'Infraestructura / Servidores' },
  { sede: 'Sede Principal', subred: '10.120.0.0/8', vlan: '30', desc: 'Soporte Técnico' },
  { sede: 'Sede Principal', subred: '10.120.0.0/8', vlan: '40', desc: 'Visitantes / Invitados' },
  { sede: 'Sede Remota', subred: '192.168.1.0/24', vlan: '50', desc: 'Operaciones Remotas' },
];

export default function RedesView({ theme }) {
  const isDark = theme === 'dark';
  
  return (
    <div className={`p-6 rounded-2xl backdrop-blur-md border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white/60 border-black/10'} shadow-xl`}>
      <div className="flex items-center gap-3 mb-6">
        <div className={`p-3 rounded-xl ${isDark ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-600/10 text-indigo-700'}`}>
          <Network size={24} />
        </div>
        <div>
          <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Infraestructura de Red - Enter Ltda.</h2>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Documentación técnica de VLANs y segmentación</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className={isDark ? 'text-gray-400 border-b border-white/10' : 'text-gray-600 border-b border-black/10'}>
              <th className="py-3 px-4 font-semibold">Sede</th>
              <th className="py-3 px-4 font-semibold">Subred</th>
              <th className="py-3 px-4 font-semibold">VLAN ID</th>
              <th className="py-3 px-4 font-semibold">Descripción</th>
            </tr>
          </thead>
          <tbody>
            {redesData.map((item, idx) => (
              <tr key={idx} className={`border-b ${isDark ? 'border-white/5 hover:bg-white/5' : 'border-black/5 hover:bg-black/5'} transition-colors`}>
                <td className={`py-4 px-4 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{item.sede}</td>
                <td className="py-4 px-4 font-mono text-emerald-500">{item.subred}</td>
                <td className="py-4 px-4 font-bold">{item.vlan}</td>
                <td className={`py-4 px-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{item.desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className={`mt-6 p-4 rounded-lg flex items-center gap-4 ${isDark ? 'bg-amber-500/10 text-amber-200' : 'bg-amber-100 text-amber-900'}`}>
        <Shield size={20} />
        <p className="text-sm font-medium">Nota: Asegurar el cumplimiento de políticas de acceso por VLAN antes de cualquier despliegue de hardware.</p>
      </div>
    </div>
  );
}
