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
        isDark ? 'bg-slate-900/90 border-slate-700/80 text-white shadow-black/60' : 'bg-white border-slate-200 text-slate-900 shadow-xl shadow-slate-200/50'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-emerald-600 text-white shadow-lg shadow-blue-500/30 border border-white/20">
              <Network size={30} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-mono font-bold uppercase tracking-wider ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>
                  Infraestructura & Telecomunicaciones
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold flex items-center gap-1.5 border shadow-sm ${
                  isDark
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50 shadow-emerald-500/30'
                    : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                }`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  WAN ONLINE
                </span>
              </div>
              <h1 className={`text-2xl sm:text-3xl font-extrabold font-display tracking-tight mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Módulo Administrativo & Redes · ENTER Ltda.
              </h1>
              <p className={`text-xs sm:text-sm mt-1 leading-relaxed ${isDark ? 'text-slate-200' : 'text-slate-700 font-medium'}`}>
                Documentación técnica de subredes, direccionamiento IP, topología multi-sede y enlaces corporativos de ENTER Ltda.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              onClick={() => setShowModalNuevaSubred(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold text-xs transition flex items-center gap-2 shadow-lg shadow-orange-500/30 border border-orange-400/40"
            >
              <Plus size={16} />
              <span>Documentar Segmento de Red</span>
            </button>
          </div>
        </div>

        {/* SELECTOR INTERACTIVO DE SEDES */}
        <div className={`grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t ${isDark ? 'border-slate-700/60' : 'border-slate-200'}`}>
          {sedes.map(s => {
            const activa = s.id === sedeActivaId;
            return (
              <button
                key={s.id}
                onClick={() => setSedeActivaId(s.id)}
                className={`p-3.5 rounded-2xl border text-left transition-all backdrop-blur-md ${
                  activa
                    ? isDark 
                      ? 'bg-emerald-500/20 border-emerald-400 text-white shadow-lg shadow-emerald-500/20 ring-1 ring-emerald-400/30'
                      : 'bg-emerald-50 border-emerald-500 text-slate-900 shadow-md ring-1 ring-emerald-500/30'
                    : isDark 
                      ? 'bg-slate-950/80 border-slate-700/80 hover:bg-slate-800/80 hover:border-slate-600 text-slate-200'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-800 shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <Building size={16} className={activa ? (isDark ? 'text-emerald-400' : 'text-emerald-600') : (isDark ? 'text-slate-400' : 'text-slate-500')} />
                  <span className={`w-2.5 h-2.5 rounded-full ${activa ? (isDark ? 'bg-emerald-400 shadow-sm shadow-emerald-400' : 'bg-emerald-600') + ' animate-pulse' : (isDark ? 'bg-emerald-500/60' : 'bg-emerald-500')}`} />
                </div>
                <div className={`font-extrabold text-xs truncate ${activa ? (isDark ? 'text-white' : 'text-emerald-950') : (isDark ? 'text-white' : 'text-slate-900')}`}>
                  {s.nombre.replace('Sede ', '')}
                </div>
                <div className={`text-[11px] font-mono truncate mt-0.5 ${isDark ? 'text-slate-300' : 'text-slate-600 font-medium'}`}>
                  {s.subredes.length} subredes activas
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* TARJETAS RESUMEN DE LA SEDE SELECCIONADA (Estilo SaaS KPIs con fondos diferenciados) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: IP WAN (Azul Corporativo) */}
        <div className={`p-5 rounded-2xl border backdrop-blur-xl transition-all hover:scale-[1.01] ${
          isDark 
            ? 'bg-gradient-to-br from-blue-950/70 via-slate-900/90 to-blue-900/40 border-blue-500/40 text-white shadow-lg shadow-blue-950/50' 
            : 'bg-white border-blue-200 text-slate-900 shadow-md shadow-blue-100/50'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-[11px] font-bold uppercase tracking-wider font-mono ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
              IP Pública WAN
            </span>
            <div className={`p-2 rounded-xl border shadow-sm ${
              isDark ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'bg-blue-50 text-blue-600 border-blue-200'
            }`}><Router size={17} /></div>
          </div>
          <div className={`text-xl font-mono font-black flex items-center justify-between tracking-tight ${isDark ? 'text-blue-300' : 'text-blue-900'}`}>
            <span>{sedeActiva.ipWAN}</span>
            <button
              onClick={() => copiarPortapapeles(sedeActiva.ipWAN, 'wan')}
              className={`transition p-1 rounded-lg ${
                isDark ? 'text-slate-300 hover:text-white hover:bg-white/10' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
              }`}
              title="Copiar IP WAN"
            >
              {copiado === 'wan' ? <Check size={15} className="text-emerald-500" /> : <Copy size={15} />}
            </button>
          </div>
          <div className={`text-xs font-medium mt-1.5 truncate ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{sedeActiva.routerBorde}</div>
        </div>

        {/* KPI 2: Ancho de Banda (Verde Esmeralda) */}
        <div className={`p-5 rounded-2xl border backdrop-blur-xl transition-all hover:scale-[1.01] ${
          isDark 
            ? 'bg-gradient-to-br from-emerald-950/70 via-slate-900/90 to-emerald-900/40 border-emerald-500/40 text-white shadow-lg shadow-emerald-950/50' 
            : 'bg-white border-emerald-200 text-slate-900 shadow-md shadow-emerald-100/50'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-[11px] font-bold uppercase tracking-wider font-mono ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>
              Capacidad de Enlace
            </span>
            <div className={`p-2 rounded-xl border shadow-sm ${
              isDark ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-emerald-50 text-emerald-600 border-emerald-200'
            }`}><Activity size={17} /></div>
          </div>
          <div className={`text-xl font-extrabold tracking-tight ${isDark ? 'text-emerald-300' : 'text-emerald-900'}`}>
            {sedeActiva.anchoBanda.split(' ')[0]} {sedeActiva.anchoBanda.split(' ')[1]}
          </div>
          <div className={`text-xs font-medium mt-1.5 flex items-center gap-1.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
            <span>Simetría 1:1 Dedicada</span>
          </div>
        </div>

        {/* KPI 3: Equipos Conectados (Violeta / Púrpura) */}
        <div className={`p-5 rounded-2xl border backdrop-blur-xl transition-all hover:scale-[1.01] ${
          isDark 
            ? 'bg-gradient-to-br from-purple-950/70 via-slate-900/90 to-purple-900/40 border-purple-500/40 text-white shadow-lg shadow-purple-950/50' 
            : 'bg-white border-purple-200 text-slate-900 shadow-md shadow-purple-100/50'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-[11px] font-bold uppercase tracking-wider font-mono ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>
              Hosts / Dispositivos
            </span>
            <div className={`p-2 rounded-xl border shadow-sm ${
              isDark ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' : 'bg-purple-50 text-purple-600 border-purple-200'
            }`}><HardDrive size={17} /></div>
          </div>
          <div className={`text-xl font-extrabold tracking-tight ${isDark ? 'text-purple-300' : 'text-purple-900'}`}>
            {totalEquiposSede} Equipos
          </div>
          <div className={`text-xs font-medium mt-1.5 truncate ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Switch Core: {sedeActiva.switchCore}</div>
        </div>

        {/* KPI 4: Gateway & DNS (Ámbar Corporativo) */}
        <div className={`p-5 rounded-2xl border backdrop-blur-xl transition-all hover:scale-[1.01] ${
          isDark 
            ? 'bg-gradient-to-br from-amber-950/70 via-slate-900/90 to-amber-900/40 border-amber-500/40 text-white shadow-lg shadow-amber-950/50' 
            : 'bg-white border-amber-200 text-slate-900 shadow-md shadow-amber-100/50'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-[11px] font-bold uppercase tracking-wider font-mono ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
              Gateway Primario
            </span>
            <div className={`p-2 rounded-xl border shadow-sm ${
              isDark ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-amber-50 text-amber-600 border-amber-200'
            }`}><Wifi size={17} /></div>
          </div>
          <div className={`text-xl font-mono font-black tracking-tight ${isDark ? 'text-amber-300' : 'text-amber-900'}`}>
            {sedeActiva.gateway}
          </div>
          <div className={`text-xs font-medium mt-1.5 font-mono truncate ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            DNS: {sedeActiva.dnsPrimario} | {sedeActiva.dnsSecundario}
          </div>
        </div>
      </div>

      {/* TABLA DE SUBREDES & VLANS DE LA SEDE */}
      <div className={`p-6 sm:p-8 rounded-3xl border backdrop-blur-2xl transition-all shadow-2xl space-y-6 ${
        isDark ? 'bg-slate-900/90 border-slate-700/80 text-white shadow-black/60' : 'bg-white border-slate-200 text-slate-900 shadow-xl shadow-slate-200/50'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className={`text-xl sm:text-2xl font-bold font-display flex items-center gap-2.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <div className="p-2 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30">
                <Layers size={22} />
              </div>
              <span>Segmentación de Red y VLANs · {sedeActiva.nombre}</span>
            </h2>
            <p className={`text-xs sm:text-sm mt-1.5 ${isDark ? 'text-slate-300' : 'text-slate-600 font-medium'}`}>
              Direccionamiento IPv4 privado y asignación de propósitos corporativos con aislamiento de seguridad
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search size={16} className={`absolute left-3.5 top-3.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
            <input
              type="text"
              placeholder="Buscar por VLAN o subred…"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-xs font-medium border outline-none transition ${
                isDark 
                  ? 'bg-slate-950/80 border-slate-700 text-white placeholder-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30' 
                  : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-500 focus:border-orange-500'
              }`}
            />
          </div>
        </div>

        <div className={`overflow-x-auto rounded-2xl border shadow-inner ${isDark ? 'border-slate-700/60 bg-slate-950/40' : 'border-slate-200 bg-white'}`}>
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className={`border-b ${isDark ? 'bg-slate-950/90 border-slate-700/80 text-slate-200' : 'bg-slate-100 border-slate-200 text-slate-800'}`}>
                <th className="py-3.5 px-4 font-bold uppercase tracking-wider text-[11px] font-mono">VLAN ID</th>
                <th className="py-3.5 px-4 font-bold uppercase tracking-wider text-[11px]">Nombre / Propósito</th>
                <th className="py-3.5 px-4 font-bold uppercase tracking-wider text-[11px] font-mono">Subred CIDR</th>
                <th className="py-3.5 px-4 font-bold uppercase tracking-wider text-[11px]">Rango Asignable</th>
                <th className="py-3.5 px-4 font-bold uppercase tracking-wider text-[11px]">Pool DHCP</th>
                <th className="py-3.5 px-4 font-bold uppercase tracking-wider text-[11px] text-center">Hosts</th>
                <th className="py-3.5 px-4 font-bold uppercase tracking-wider text-[11px] text-right">Estado</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-slate-700/50' : 'divide-slate-200'}`}>
              {subredesFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={7} className={`text-center py-10 font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    No se encontraron subredes registradas para el filtro ingresado.
                  </td>
                </tr>
              ) : (
                subredesFiltradas.map((sub) => (
                  <tr
                    key={sub.id}
                    className={`transition-colors ${
                      isDark ? 'hover:bg-slate-800/50 bg-slate-900/40' : 'hover:bg-slate-50 bg-white'
                    }`}
                  >
                    <td className={`py-4 px-4 font-bold font-mono text-[13px] ${isDark ? 'text-amber-400' : 'text-amber-700 font-extrabold'}`}>
                      VLAN {sub.vlan}
                    </td>
                    <td className={`py-4 px-4 font-bold text-[13px] ${isDark ? 'text-white' : 'text-slate-900 font-extrabold'}`}>
                      {sub.nombre}
                    </td>
                    <td className={`py-4 px-4 font-mono font-bold text-[13px] ${isDark ? 'text-emerald-400' : 'text-emerald-700 font-extrabold'}`}>
                      {sub.subred}
                    </td>
                    <td className={`py-4 px-4 font-mono font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                      {sub.rango}
                    </td>
                    <td className={`py-4 px-4 font-mono font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                      {sub.dhcp}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full font-bold font-mono text-xs border ${
                        isDark ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' : 'bg-purple-100 text-purple-800 border-purple-200'
                      }`}>
                        {sub.equipos}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold font-mono border shadow-sm ${
                        isDark 
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40 shadow-emerald-500/20' 
                          : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-emerald-400' : 'bg-emerald-600'} animate-pulse`} />
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
        <div className={`p-4 rounded-2xl flex items-center gap-3.5 border ${
          isDark ? 'bg-amber-500/15 border-amber-500/30 text-slate-200' : 'bg-amber-50 border-amber-200 text-amber-950'
        }`}>
          <div className={`p-2 rounded-xl shrink-0 ${isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-700'}`}>
            <Shield size={20} />
          </div>
          <p className="text-xs leading-relaxed">
            <strong className={isDark ? 'text-amber-300' : 'text-amber-900 font-extrabold'}>Política de Seguridad Corporativa ENTER Ltda.:</strong> Todas las VLANs están aisladas mediante Listas de Control de Acceso (ACLs) perimetrales en el Switch Core. La VLAN 40 (Visitantes) y VLAN 58 (Invitados) disponen de salida a Internet exclusiva sin comunicación directa hacia el Data Center o Gerencia.
          </p>
        </div>
      </div>

      {/* TOPOLOGÍA VISUAL ESQUEMÁTICA MULTI-SEDE */}
      <div className={`p-6 sm:p-8 rounded-3xl border backdrop-blur-2xl transition-all shadow-2xl space-y-5 ${
        isDark ? 'bg-slate-900/90 border-slate-700/80 text-white shadow-black/60' : 'bg-white border-slate-200 text-slate-900 shadow-xl'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className={`text-lg sm:text-xl font-bold font-display ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Arquitectura de Conectividad WAN / VPN IPSec
            </h3>
            <p className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-slate-300' : 'text-slate-600 font-medium'}`}>
              Esquema de malla radial (Hub and Spoke) con núcleo en Bogotá D.C.
            </p>
          </div>
          <span className={`text-xs font-mono font-bold px-3 py-1.5 rounded-full border shadow-sm ${
            isDark ? 'bg-blue-500/20 text-blue-300 border-blue-500/40 shadow-blue-500/20' : 'bg-blue-100 text-blue-800 border-blue-300'
          }`}>
            Túneles AES-256
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className={`p-5 rounded-2xl border text-center space-y-2.5 transition-all hover:scale-[1.01] ${
            isDark ? 'bg-gradient-to-b from-orange-950/40 to-slate-900/90 border-orange-500/30' : 'bg-orange-50/80 border-orange-200'
          }`}>
            <div className={`w-12 h-12 mx-auto rounded-2xl border flex items-center justify-center font-black text-lg shadow-sm ${
              isDark ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' : 'bg-orange-100 text-orange-700 border-orange-200'
            }`}>
              HQ
            </div>
            <div className={`font-extrabold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>Nodo Central Bogotá</div>
            <div className={`text-xs font-mono font-bold ${isDark ? 'text-amber-300' : 'text-amber-800'}`}>10.120.0.0/8</div>
            <div className={`text-[11px] font-semibold ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>Hub Principal & Servidores</div>
          </div>

          <div className={`p-5 rounded-2xl border text-center space-y-2.5 transition-all hover:scale-[1.01] ${
            isDark ? 'bg-gradient-to-b from-blue-950/40 to-slate-900/90 border-blue-500/30' : 'bg-blue-50/80 border-blue-200'
          }`}>
            <div className={`w-12 h-12 mx-auto rounded-2xl border flex items-center justify-center font-black text-lg shadow-sm ${
              isDark ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'bg-blue-100 text-blue-700 border-blue-200'
            }`}>
              VPN
            </div>
            <div className={`font-extrabold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>Interconexión Encriptada</div>
            <div className={`text-xs font-mono font-bold ${isDark ? 'text-blue-300' : 'text-blue-800'}`}>IPSec Site-to-Site</div>
            <div className={`text-[11px] font-semibold ${isDark ? 'text-blue-400' : 'text-blue-700'}`}>Túneles Redundantes BGP</div>
          </div>

          <div className={`p-5 rounded-2xl border text-center space-y-2.5 transition-all hover:scale-[1.01] ${
            isDark ? 'bg-gradient-to-b from-purple-950/40 to-slate-900/90 border-purple-500/30' : 'bg-purple-50/80 border-purple-200'
          }`}>
            <div className={`w-12 h-12 mx-auto rounded-2xl border flex items-center justify-center font-black text-lg shadow-sm ${
              isDark ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' : 'bg-purple-100 text-purple-700 border-purple-200'
            }`}>
              SPK
            </div>
            <div className={`font-extrabold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>Sedes Remotas (Spokes)</div>
            <div className={`text-xs font-mono font-bold ${isDark ? 'text-purple-300' : 'text-purple-800'}`}>Medellín · Cali · B/quilla</div>
            <div className={`text-[11px] font-semibold ${isDark ? 'text-purple-400' : 'text-purple-700'}`}>Acceso a Servicios Centralizados</div>
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
