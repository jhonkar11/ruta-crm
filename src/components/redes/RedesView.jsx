import React, { useState } from 'react';
import {
  Network,
  Server,
  Shield,
  Layers,
  Activity,
  Plus,
  Search,
  Filter,
  CheckCircle,
  AlertCircle,
  Router,
  Wifi,
  HardDrive,
  Copy,
  Check,
  Building,
  RefreshCw,
  Sliders,
  ChevronDown
} from 'lucide-react';

const sedesDefault = [
  {
    id: 'bogota',
    nombre: 'Sede Principal - Bogotá D.C.',
    direccion: 'Calle 72 # 10-34, Nodo Central Financiero',
    ipWAN: '190.157.34.82/30',
    gateway: '10.120.0.1',
    dnsPrimario: '1.1.1.1',
    dnsSecundario: '8.8.8.8',
    anchoBanda: '1 Gbps Fibra Dedicada Simétrica',
    routerBorde: 'Cisco ISR 4331 / FortiGate 100F',
    switchCore: 'Cisco Catalyst 3850 48P PoE+',
    subredes: [
      { id: 'sub-1', subred: '10.120.0.0/24', vlan: '10', nombre: 'Administración & Gerencia', rango: '10.120.0.1 - 10.120.0.254', dhcp: '10.120.0.100 - 10.120.0.200', equipos: 34, estado: 'Activo' },
      { id: 'sub-2', subred: '10.120.10.0/24', vlan: '20', nombre: 'Infraestructura & Data Center', rango: '10.120.10.1 - 10.120.10.254', dhcp: 'Estática / Reservas', equipos: 16, estado: 'Activo' },
      { id: 'sub-3', subred: '10.120.20.0/24', vlan: '30', nombre: 'Soporte Técnico & Sistemas', rango: '10.120.20.1 - 10.120.20.254', dhcp: '10.120.20.50 - 10.120.20.150', equipos: 22, estado: 'Activo' },
      { id: 'sub-4', subred: '10.120.30.0/24', vlan: '40', nombre: 'Visitantes / WiFi Invitados', rango: '10.120.30.1 - 10.120.30.254', dhcp: '10.120.30.10 - 10.120.30.200', equipos: 15, estado: 'Activo' },
      { id: 'sub-5', subred: '10.120.40.0/24', vlan: '45', nombre: 'Telefonía IP & VoIP', rango: '10.120.40.1 - 10.120.40.254', dhcp: '10.120.40.10 - 10.120.40.100', equipos: 28, estado: 'Activo' }
    ]
  },
  {
    id: 'medellin',
    nombre: 'Sede Regional Medellín',
    direccion: 'Cra 43A # 1-50, Centro Tecnológico El Poblado',
    ipWAN: '181.129.45.18/30',
    gateway: '172.16.10.1',
    dnsPrimario: '1.1.1.1',
    dnsSecundario: '10.120.10.10',
    anchoBanda: '500 Mbps Fibra Óptica Empresarial',
    routerBorde: 'MikroTik CCR2004 / VPN IPSec',
    switchCore: 'Aruba Instant On 1930 24G',
    subredes: [
      { id: 'sub-m1', subred: '172.16.10.0/24', vlan: '50', nombre: 'Operaciones Medellín & Ventas', rango: '172.16.10.1 - 172.16.10.254', dhcp: '172.16.10.50 - 172.16.10.200', equipos: 19, estado: 'Activo' },
      { id: 'sub-m2', subred: '172.16.20.0/24', vlan: '55', nombre: 'Soporte Local y Bodega', rango: '172.16.20.1 - 172.16.20.254', dhcp: '172.16.20.20 - 172.16.20.100', equipos: 11, estado: 'Activo' },
      { id: 'sub-m3', subred: '172.16.30.0/24', vlan: '58', nombre: 'Invitados & Recepción', rango: '172.16.30.1 - 172.16.30.254', dhcp: '172.16.30.10 - 172.16.30.150', equipos: 8, estado: 'Activo' }
    ]
  },
  {
    id: 'cali',
    nombre: 'Sede Regional Cali',
    direccion: 'Av. Roosevelt # 28-05, Parque Empresarial',
    ipWAN: '200.91.112.44/30',
    gateway: '192.168.100.1',
    dnsPrimario: '1.1.1.1',
    dnsSecundario: '8.8.8.8',
    anchoBanda: '300 Mbps Fibra Simétrica',
    routerBorde: 'Ubiquiti Dream Machine Pro',
    switchCore: 'UniFi Switch Pro 24 PoE',
    subredes: [
      { id: 'sub-c1', subred: '192.168.100.0/24', vlan: '60', nombre: 'Administración & Comercial Cali', rango: '192.168.100.1 - 192.168.100.254', dhcp: '192.168.100.50 - 192.168.100.200', equipos: 14, estado: 'Activo' },
      { id: 'sub-c2', subred: '192.168.110.0/24', vlan: '65', nombre: 'Laboratorio de Pruebas de Red', rango: '192.168.110.1 - 192.168.110.254', dhcp: 'Estático', equipos: 9, estado: 'Activo' }
    ]
  },
  {
    id: 'barranquilla',
    nombre: 'Sede Caribe - Barranquilla',
    direccion: 'Calle 76 # 54-11, Nodo Caribe',
    ipWAN: '186.84.19.66/30',
    gateway: '192.168.200.1',
    dnsPrimario: '1.1.1.1',
    dnsSecundario: '8.8.8.8',
    anchoBanda: '300 Mbps Enlace Microondas + Fibra',
    routerBorde: 'Cisco RV340 / VPN IPSec',
    switchCore: 'Cisco CBS350 24T',
    subredes: [
      { id: 'sub-b1', subred: '192.168.200.0/24', vlan: '70', nombre: 'Operación Portuaria & Ventas', rango: '192.168.200.1 - 192.168.200.254', dhcp: '192.168.200.20 - 192.168.200.150', equipos: 12, estado: 'Activo' }
    ]
  }
];

export default function RedesView({ theme = 'light' }) {
  const isDark = theme === 'dark';
  const [sedes, setSedes] = useState(sedesDefault);
  const [sedeActivaId, setSedeActivaId] = useState('bogota');
  const [busqueda, setBusqueda] = useState('');
  const [copiado, setCopiado] = useState(null);
  const [showModalNuevaSubred, setShowModalNuevaSubred] = useState(false);

  // Formulario para nueva subred
  const [nuevaSubred, setNuevaSubred] = useState({
    nombre: '',
    vlan: '',
    subred: '',
    rango: '',
    dhcp: ''
  });

  const sedeActiva = sedes.find(s => s.id === sedeActivaId) || sedes[0];

  const subredesFiltradas = sedeActiva.subredes.filter(sub => 
    sub.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    sub.subred.includes(busqueda) ||
    sub.vlan.includes(busqueda)
  );

  const totalEquiposSede = sedeActiva.subredes.reduce((acc, curr) => acc + curr.equipos, 0);

  const copiarPortapapeles = (texto, key) => {
    navigator.clipboard.writeText(texto);
    setCopiado(key);
    setTimeout(() => setCopiado(null), 1800);
  };

  const handleAgregarSubred = (e) => {
    e.preventDefault();
    if (!nuevaSubred.nombre || !nuevaSubred.vlan || !nuevaSubred.subred) {
      alert("Por favor completa los campos principales de la subred");
      return;
    }

    const nuevoItem = {
      id: `sub-${Date.now()}`,
      subred: nuevaSubred.subred,
      vlan: nuevaSubred.vlan,
      nombre: nuevaSubred.nombre,
      rango: nuevaSubred.rango || `${nuevaSubred.subred.replace('.0/24', '.1')} - ${nuevaSubred.subred.replace('.0/24', '.254')}`,
      dhcp: nuevaSubred.dhcp || 'Dinámico / Router',
      equipos: 1,
      estado: 'Activo'
    };

    setSedes(prev => prev.map(s => {
      if (s.id === sedeActivaId) {
        return { ...s, subredes: [...s.subredes, nuevoItem] };
      }
      return s;
    }));

    setNuevaSubred({ nombre: '', vlan: '', subred: '', rango: '', dhcp: '' });
    setShowModalNuevaSubred(false);
  };

  return (
    <div className="w-full space-y-8 animate-fadeIn pb-12">
      {/* CABECERA PRINCIPAL DEL MÓDULO CON GLASSMORFISM */}
      <div className={`p-6 sm:p-8 rounded-3xl border backdrop-blur-2xl transition-all shadow-2xl ${
        isDark ? 'bg-slate-900/70 border-white/10 text-white' : 'bg-white/80 border-slate-200 text-slate-900 shadow-slate-200/50'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30">
              <Network size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-orange-400">
                  Infraestructura & Telecomunicaciones
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  WAN ONLINE
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold font-display">
                Módulo Administrativo & Redes · Interred Ltda.
              </h1>
              <p className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                Documentación técnica de subredes, direccionamiento IP, topología multi-sede y enlaces corporativos (SENA GA6-220501106-AA1).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              onClick={() => setShowModalNuevaSubred(true)}
              className="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs transition flex items-center gap-2 shadow-lg shadow-orange-500/25"
            >
              <Plus size={16} />
              <span>Documentar Segmento de Red</span>
            </button>
          </div>
        </div>

        {/* SELECTOR INTERACTIVO DE SEDES */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-500/20">
          {sedes.map(s => {
            const activa = s.id === sedeActivaId;
            return (
              <button
                key={s.id}
                onClick={() => setSedeActivaId(s.id)}
                className={`p-3.5 rounded-2xl border text-left transition-all backdrop-blur-md ${
                  activa
                    ? 'bg-orange-500/20 border-orange-500 text-white shadow-md'
                    : isDark 
                      ? 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-300'
                      : 'bg-slate-100/70 border-slate-200 hover:bg-slate-100 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <Building size={16} className={activa ? 'text-orange-400' : 'text-slate-400'} />
                  <span className={`w-2 h-2 rounded-full ${activa ? 'bg-orange-400 animate-pulse' : 'bg-emerald-500'}`} />
                </div>
                <div className="font-bold text-xs truncate">{s.nombre.replace('Sede ', '')}</div>
                <div className="text-[11px] text-slate-400 truncate">{s.subredes.length} subredes activas</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* TARJETAS RESUMEN DE LA SEDE SELECCIONADA (Estilo SaaS KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: IP WAN */}
        <div className={`p-5 rounded-2xl border backdrop-blur-xl ${
          isDark ? 'bg-slate-900/60 border-white/10 text-white' : 'bg-white/80 border-slate-200 text-slate-900 shadow-sm'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">IP Pública WAN</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400"><Router size={16} /></div>
          </div>
          <div className="text-lg font-mono font-bold text-blue-400 flex items-center justify-between">
            <span>{sedeActiva.ipWAN}</span>
            <button
              onClick={() => copiarPortapapeles(sedeActiva.ipWAN, 'wan')}
              className="text-slate-400 hover:text-white transition p-1"
              title="Copiar IP WAN"
            >
              {copiado === 'wan' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            </button>
          </div>
          <div className="text-xs text-slate-400 mt-1">{sedeActiva.routerBorde}</div>
        </div>

        {/* KPI 2: Ancho de Banda */}
        <div className={`p-5 rounded-2xl border backdrop-blur-xl ${
          isDark ? 'bg-slate-900/60 border-white/10 text-white' : 'bg-white/80 border-slate-200 text-slate-900 shadow-sm'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Capacidad de Enlace</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400"><Activity size={16} /></div>
          </div>
          <div className="text-lg font-extrabold text-emerald-400">{sedeActiva.anchoBanda.split(' ')[0]} {sedeActiva.anchoBanda.split(' ')[1]}</div>
          <div className="text-xs text-slate-400 mt-1">Simetría 1:1 dedicada</div>
        </div>

        {/* KPI 3: Equipos Conectados */}
        <div className={`p-5 rounded-2xl border backdrop-blur-xl ${
          isDark ? 'bg-slate-900/60 border-white/10 text-white' : 'bg-white/80 border-slate-200 text-slate-900 shadow-sm'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Hosts / Dispositivos</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400"><HardDrive size={16} /></div>
          </div>
          <div className="text-lg font-extrabold text-purple-400">{totalEquiposSede} Equipos</div>
          <div className="text-xs text-slate-400 mt-1">Conectados a {sedeActiva.switchCore}</div>
        </div>

        {/* KPI 4: Gateway & DNS */}
        <div className={`p-5 rounded-2xl border backdrop-blur-xl ${
          isDark ? 'bg-slate-900/60 border-white/10 text-white' : 'bg-white/80 border-slate-200 text-slate-900 shadow-sm'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Gateway Primario</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400"><Wifi size={16} /></div>
          </div>
          <div className="text-lg font-mono font-bold text-amber-400">{sedeActiva.gateway}</div>
          <div className="text-xs text-slate-400 mt-1">DNS: {sedeActiva.dnsPrimario} | {sedeActiva.dnsSecundario}</div>
        </div>
      </div>

      {/* TABLA DE SUBREDES & VLANS DE LA SEDE */}
      <div className={`p-6 sm:p-8 rounded-3xl border backdrop-blur-2xl transition-all shadow-xl space-y-6 ${
        isDark ? 'bg-slate-900/70 border-white/10 text-white' : 'bg-white/90 border-slate-200 text-slate-900 shadow-slate-200/50'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold font-display flex items-center gap-2">
              <Layers size={20} className="text-orange-500" />
              <span>Segmentación de Red y VLANs · {sedeActiva.nombre}</span>
            </h2>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Direccionamiento IPv4 privado y asignación de propósitos corporativos
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por VLAN o subred…"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 rounded-xl text-xs border outline-none transition ${
                isDark 
                  ? 'bg-slate-950/60 border-white/10 text-white focus:border-orange-500' 
                  : 'bg-slate-50 border-slate-300 text-slate-800 focus:border-orange-500'
              }`}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className={`border-b ${isDark ? 'border-white/10 text-slate-400' : 'border-slate-200 text-slate-600'}`}>
                <th className="py-3 px-4 font-bold">VLAN ID</th>
                <th className="py-3 px-4 font-bold">Nombre / Propósito</th>
                <th className="py-3 px-4 font-bold">Subred CIDR</th>
                <th className="py-3 px-4 font-bold">Rango Asignable</th>
                <th className="py-3 px-4 font-bold">Pool DHCP</th>
                <th className="py-3 px-4 font-bold text-center">Hosts</th>
                <th className="py-3 px-4 font-bold text-right">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-500/10">
              {subredesFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    No se encontraron subredes con ese filtro.
                  </td>
                </tr>
              ) : (
                subredesFiltradas.map((sub) => (
                  <tr
                    key={sub.id}
                    className={`transition-colors ${
                      isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="py-3.5 px-4 font-bold text-orange-400 font-mono">
                      VLAN {sub.vlan}
                    </td>
                    <td className="py-3.5 px-4 font-semibold">
                      {sub.nombre}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                      {sub.subred}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-400">
                      {sub.rango}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-400">
                      {sub.dhcp}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full font-bold bg-purple-500/10 text-purple-400">
                        {sub.equipos}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                        <CheckCircle size={12} />
                        <span>{sub.estado}</span>
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* NOTA DE SEGURIDAD & POLÍTICAS DE ACCESO */}
        <div className={`p-4 rounded-2xl flex items-center gap-3 border ${
          isDark ? 'bg-amber-500/10 border-amber-500/20 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-900'
        }`}>
          <Shield size={20} className="shrink-0 text-amber-500" />
          <p className="text-xs leading-relaxed">
            <strong>Política de Seguridad SENA GA6-220501106-AA1:</strong> Todas las VLANs están aisladas mediante Access Control Lists (ACLs) perimetrales en el Switch Core. La VLAN 40 (Visitantes) y VLAN 58 (Invitados) disponen de salida a Internet exclusiva sin comunicación hacia el Data Center o Gerencia.
          </p>
        </div>
      </div>

      {/* TOPOLOGÍA VISUAL ESQUEMÁTICA MULTI-SEDE */}
      <div className={`p-6 sm:p-8 rounded-3xl border backdrop-blur-2xl transition-all shadow-xl space-y-4 ${
        isDark ? 'bg-slate-900/70 border-white/10 text-white' : 'bg-white/90 border-slate-200 text-slate-900'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base sm:text-lg font-bold font-display">
              Arquitectura de Conectividad WAN / VPN IPSec
            </h3>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Esquema de malla radial (Hub and Spoke) con núcleo en Bogotá D.C.
            </p>
          </div>
          <span className="text-xs font-mono px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
            Túneles AES-256
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className={`p-4 rounded-2xl border text-center space-y-2 ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
            <div className="w-10 h-10 mx-auto rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold">
              HQ
            </div>
            <div className="font-bold text-sm">Nodo Central Bogotá</div>
            <div className="text-xs font-mono text-slate-400">10.120.0.0/8</div>
            <div className="text-[11px] text-emerald-400 font-semibold">Hub Principal & Servidores</div>
          </div>

          <div className={`p-4 rounded-2xl border text-center space-y-2 ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
            <div className="w-10 h-10 mx-auto rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
              VPN
            </div>
            <div className="font-bold text-sm">Interconexión Encriptada</div>
            <div className="text-xs font-mono text-slate-400">IPSec Site-to-Site</div>
            <div className="text-[11px] text-blue-400 font-semibold">Túneles Redundantes BGP</div>
          </div>

          <div className={`p-4 rounded-2xl border text-center space-y-2 ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
            <div className="w-10 h-10 mx-auto rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
              SPK
            </div>
            <div className="font-bold text-sm">Sedes Remotas (Spokes)</div>
            <div className="text-xs font-mono text-slate-400">Medellín · Cali · B/quilla</div>
            <div className="text-[11px] text-purple-400 font-semibold">Acceso a Servicios Centralizados</div>
          </div>
        </div>
      </div>

      {/* MODAL PARA AGREGAR NUEVA SUBRED */}
      {showModalNuevaSubred && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className={`w-full max-w-md p-6 rounded-3xl border shadow-2xl space-y-4 ${
            isDark ? 'bg-slate-900 border-white/20 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between border-b border-slate-500/20 pb-3">
              <h3 className="font-bold text-base">Documentar Nuevo Segmento de Red</h3>
              <button
                onClick={() => setShowModalNuevaSubred(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAgregarSubred} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1 uppercase tracking-wider text-slate-400">
                  Nombre del Área / Propósito
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Cámaras CCTV / Seguridad"
                  value={nuevaSubred.nombre}
                  onChange={(e) => setNuevaSubred({ ...nuevaSubred, nombre: e.target.value })}
                  className={`w-full p-2.5 rounded-xl border outline-none ${
                    isDark ? 'bg-slate-950 border-white/10 text-white' : 'bg-slate-50 border-slate-300'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 uppercase tracking-wider text-slate-400">
                    VLAN ID
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="Ej: 80"
                    value={nuevaSubred.vlan}
                    onChange={(e) => setNuevaSubred({ ...nuevaSubred, vlan: e.target.value })}
                    className={`w-full p-2.5 rounded-xl border outline-none ${
                      isDark ? 'bg-slate-950 border-white/10 text-white' : 'bg-slate-50 border-slate-300'
                    }`}
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 uppercase tracking-wider text-slate-400">
                    Subred CIDR
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: 10.120.80.0/24"
                    value={nuevaSubred.subred}
                    onChange={(e) => setNuevaSubred({ ...nuevaSubred, subred: e.target.value })}
                    className={`w-full p-2.5 rounded-xl border outline-none font-mono ${
                      isDark ? 'bg-slate-950 border-white/10 text-white' : 'bg-slate-50 border-slate-300'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 uppercase tracking-wider text-slate-400">
                  Rango Asignable (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ej: 10.120.80.1 - 10.120.80.254"
                  value={nuevaSubred.rango}
                  onChange={(e) => setNuevaSubred({ ...nuevaSubred, rango: e.target.value })}
                  className={`w-full p-2.5 rounded-xl border outline-none font-mono ${
                    isDark ? 'bg-slate-950 border-white/10 text-white' : 'bg-slate-50 border-slate-300'
                  }`}
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 uppercase tracking-wider text-slate-400">
                  Pool DHCP (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ej: 10.120.80.100 - 10.120.80.200"
                  value={nuevaSubred.dhcp}
                  onChange={(e) => setNuevaSubred({ ...nuevaSubred, dhcp: e.target.value })}
                  className={`w-full p-2.5 rounded-xl border outline-none font-mono ${
                    isDark ? 'bg-slate-950 border-white/10 text-white' : 'bg-slate-50 border-slate-300'
                  }`}
                />
              </div>

              <div className="pt-3 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowModalNuevaSubred(false)}
                  className="px-4 py-2 rounded-xl border border-slate-500/20 hover:bg-white/5 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold"
                >
                  Guardar Subred
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
