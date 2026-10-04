import React from "react";
import {
  Shield,
  Network,
  Cpu,
  Server,
  Users,
  CheckCircle2,
  ArrowRight,
  Calculator,
  Lock,
  Wifi,
  Headphones,
  Award,
  Activity,
  Layers,
  Sparkles,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  MapPin,
  Clock,
  PhoneCall
} from "lucide-react";
import { C } from "../../styles/tokens";

export default function LandingInstitucional({ setView, profile, theme = "light", onOpenSimulador }) {
  const isDark = theme === "dark";

  const servicios = [
    {
      icon: Network,
      title: "Redes Corporativas & Multi-Sede",
      desc: "Diseño, segmentación en VLANs, enrutamiento avanzado BGP/OSPF y enlaces WAN seguros para interconectar sedes corporativas.",
      tag: "Infraestructura",
      color: "from-blue-500/20 to-indigo-500/20",
      iconColor: "text-blue-400"
    },
    {
      icon: Server,
      title: "Data Centers & Servidores",
      desc: "Implementación de servidores de alta disponibilidad, clústeres de virtualización, almacenamiento SAN/NAS y copias de seguridad híbridas.",
      tag: "Servidores",
      color: "from-purple-500/20 to-pink-500/20",
      iconColor: "text-purple-400"
    },
    {
      icon: Shield,
      title: "Ciberseguridad & Firewalls",
      desc: "Protección perimetral con Firewalls de última generación (NGFW), túneles VPN IPSec/SSL, auditorías de vulnerabilidad y control de accesos.",
      tag: "Seguridad",
      color: "from-emerald-500/20 to-teal-500/20",
      iconColor: "text-emerald-400"
    },
    {
      icon: Headphones,
      title: "Sistemas & Soporte IT 24/7",
      desc: "Mesa de ayuda Nivel 1, 2 y 3, mantenimiento preventivo/correctivo de hardware y análisis asistido por IA de incidencias técnicas.",
      tag: "Soporte",
      color: "from-amber-500/20 to-orange-500/20",
      iconColor: "text-amber-400"
    },
    {
      icon: Users,
      title: "Gestión de Visitantes y Acceso",
      desc: "Control biométrico y digital del flujo de visitantes a sedes, registro de activos tecnológicos portátiles y trazabilidad de ingresos.",
      tag: "Operaciones",
      color: "from-cyan-500/20 to-blue-500/20",
      iconColor: "text-cyan-400"
    },
    {
      icon: Calculator,
      title: "Finanzas & Proyección TIC",
      desc: "Simuladores financieros integrados con tablas de amortización francesa/alemana y validación de tasas para adquisición de infraestructura.",
      tag: "Finanzas",
      color: "from-rose-500/20 to-orange-500/20",
      iconColor: "text-rose-400"
    }
  ];

  const departamentos = [
    {
      id: "redes",
      name: "Administración & Redes",
      desc: "Topología multi-sede, asignación de VLANs, subredes IPv4/IPv6 y monitoreo de enlaces.",
      icon: Network,
      badge: "Infraestructura",
      badgeColor: "bg-blue-500/20 text-blue-400 border-blue-500/30"
    },
    {
      id: "soporte",
      name: "Sistemas & Soporte Técnico",
      desc: "Mesa de servicios, OCR inteligente de órdenes de trabajo, cuentas de cobro y hardware.",
      icon: Headphones,
      badge: "Área Técnica",
      badgeColor: "bg-amber-500/20 text-amber-400 border-amber-500/30"
    },
    {
      id: "contable",
      name: "Financiero & Simulador",
      desc: "Simulador de créditos, amortizaciones y proyecciones de financiamiento de hardware.",
      icon: Calculator,
      badge: "Finanzas",
      badgeColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
    },
    {
      id: "visitantes",
      name: "Control de Visitantes",
      desc: "Registro de ingresos, asignación de carné, control de portátiles y bitácora de seguridad.",
      icon: Users,
      badge: "Seguridad Física",
      badgeColor: "bg-purple-500/20 text-purple-400 border-purple-500/30"
    },
    {
      id: "todos",
      name: "Gestión de Clientes & CRM",
      desc: "Cartera comercial, agenda de citas, expedientes documentales y seguimiento de clientes.",
      icon: Layers,
      badge: "Comercial",
      badgeColor: "bg-rose-500/20 text-rose-400 border-rose-500/30"
    }
  ];

  const sedes = [
    { nombre: "Sede Principal Bogotá", dir: "Calle 72 # 10-34, Centro Financiero", estado: "Operativa", ping: "2ms", vlan: "VLAN 10, 20, 30" },
    { nombre: "Sede Medellín", dir: "Cra 43A # 1-50, El Poblado", estado: "Operativa", ping: "8ms", vlan: "VLAN 50" },
    { nombre: "Sede Cali", dir: "Av. Roosevelt # 28-05, San Fernando", estado: "Operativa", ping: "12ms", vlan: "VLAN 60" },
    { nombre: "Sede Barranquilla", dir: "Calle 76 # 54-11, Nodo Caribe", estado: "Operativa", ping: "15ms", vlan: "VLAN 70" }
  ];

  return (
    <div className="w-full space-y-10 pb-16 animate-fadeIn">
      {/* HERO SECTION DE ALTO IMPACTO (Estilo Glassmorphism SaaS) */}
      <div className={`relative overflow-hidden rounded-3xl p-6 sm:p-10 border transition-all duration-300 shadow-2xl ${
        isDark 
          ? "bg-[#0B132B]/90 border-slate-700/80 text-white backdrop-blur-2xl shadow-black/70" 
          : "bg-white/95 border-slate-200 text-slate-900 backdrop-blur-xl shadow-slate-200/50"
      }`}>
        {/* Luces y gradientes de fondo */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          {/* Badge superior institucional */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono font-bold mb-6 border backdrop-blur-md bg-emerald-500/15 border-emerald-400/40 text-emerald-300 shadow-sm shadow-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>INTERRED LTDA. • SENA GA6-220501106-AA1</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-5">
              <h1 className={`text-3xl sm:text-5xl font-extrabold tracking-tight font-display leading-tight ${isDark ? "text-white" : "text-slate-900"}`}>
                Infraestructura Tecnológica, <br className="hidden sm:block" />
                <span className="bg-gradient-to-r from-orange-400 via-amber-300 to-emerald-400 bg-clip-text text-transparent">
                  Redes Corporativas & CRM
                </span>
              </h1>
              
              <p className={`text-base sm:text-lg leading-relaxed max-w-2xl ${
                isDark ? "text-slate-200" : "text-slate-700"
              }`}>
                Portal corporativo integral para la gestión multi-sede de <strong className={isDark ? "text-white" : "text-slate-900 font-extrabold"}>Interred Ltda.</strong> Monitoreo de direccionamiento de redes, mesa de soporte de sistemas, control de visitantes y simuladores financieros bajo arquitectura modular de alto desempeño.
              </p>

              {/* Botones de acción rápida */}
              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  onClick={() => setView("redes")}
                  className="px-5 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold text-sm shadow-lg shadow-orange-500/30 border border-orange-400/40 flex items-center gap-2 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                >
                  <Network size={18} />
                  <span>Explorar Módulo de Redes</span>
                  <ArrowRight size={16} />
                </button>

                <button
                  onClick={() => setView("soporte")}
                  className={`px-5 py-3 rounded-xl font-bold text-sm border transition-all flex items-center gap-2 backdrop-blur-md ${
                    isDark 
                      ? "bg-slate-900/80 hover:bg-slate-800 border-slate-700 text-white hover:border-amber-500/40 shadow-sm" 
                      : "bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800"
                  }`}
                >
                  <Headphones size={18} className={isDark ? "text-amber-400" : "text-amber-600"} />
                  <span>Soporte Técnico & IA</span>
                </button>

                <button
                  onClick={() => setView("visitantes")}
                  className={`px-5 py-3 rounded-xl font-bold text-sm border transition-all flex items-center gap-2 backdrop-blur-md ${
                    isDark 
                      ? "bg-slate-900/80 hover:bg-slate-800 border-slate-700 text-white hover:border-cyan-500/40 shadow-sm" 
                      : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700 shadow-sm"
                  }`}
                >
                  <Users size={18} className={isDark ? "text-cyan-400" : "text-cyan-600"} />
                  <span>Control de Visitantes</span>
                </button>
              </div>

              {/* Resumen de métricas de confianza */}
              <div className={`grid grid-cols-3 gap-4 pt-6 border-t ${isDark ? "border-slate-700/60" : "border-slate-200"}`}>
                <div>
                  <div className={`text-2xl sm:text-3xl font-black ${isDark ? "text-orange-400" : "text-orange-600"}`}>4 Sedes</div>
                  <div className={`text-xs font-medium ${isDark ? "text-slate-300" : "text-slate-600"}`}>Interconectadas en tiempo real</div>
                </div>
                <div>
                  <div className={`text-2xl sm:text-3xl font-black ${isDark ? "text-emerald-400" : "text-emerald-700"}`}>99.98%</div>
                  <div className={`text-xs font-medium ${isDark ? "text-slate-300" : "text-slate-600"}`}>Disponibilidad de Red</div>
                </div>
                <div>
                  <div className={`text-2xl sm:text-3xl font-black ${isDark ? "text-cyan-400" : "text-cyan-700"}`}>24/7</div>
                  <div className={`text-xs font-medium ${isDark ? "text-slate-300" : "text-slate-600"}`}>Monitoreo y Mesa de Ayuda</div>
                </div>
              </div>
            </div>

            {/* Tarjeta Visual Destacada (Mockup interactivo corporativo) */}
            <div className="lg:col-span-5">
              <div className={`p-6 rounded-2xl border backdrop-blur-xl shadow-2xl relative space-y-4 ${
                isDark 
                  ? "bg-slate-950/90 border-slate-700/80 shadow-black/80" 
                  : "bg-slate-900 text-white border-slate-800"
              }`}>
                {/* Cabecera de la tarjeta */}
                <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                    <span className="text-xs font-mono font-bold tracking-wider text-emerald-300 uppercase">
                      Core Network · Activo
                    </span>
                  </div>
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 font-mono text-emerald-300 font-bold">
                    SENA GA6
                  </span>
                </div>

                {/* Datos de la sede principal */}
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-medium">Sede Principal:</span>
                    <span className="font-bold text-white">Bogotá D.C. (Cll 72)</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-medium">Segmento LAN Primario:</span>
                    <span className="font-mono text-amber-300 font-extrabold">10.120.0.0/8</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-medium">VLANs Desplegadas:</span>
                    <span className="text-slate-200 font-semibold">10 (Admin), 20 (Server), 30 (Soporte)</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-medium">Seguridad Perimetral:</span>
                    <span className="text-emerald-300 font-bold flex items-center gap-1.5">
                      <Lock size={13} className="text-emerald-400" /> FortiGate NGFW Activo
                    </span>
                  </div>
                </div>

                {/* Banner de acceso directo a módulos */}
                <div className="p-3.5 rounded-xl bg-gradient-to-r from-orange-500/15 via-emerald-500/10 to-blue-500/15 border border-slate-700 text-xs">
                  <div className="font-bold text-orange-300 flex items-center gap-1.5 mb-1">
                    <Activity size={15} /> Estado Institucional de Interred Ltda.
                  </div>
                  <div className="text-[11.5px] text-slate-300 leading-relaxed">
                    Todos los subsistemas de hardware, cartera y control de accesos se encuentran sincronizados.
                  </div>
                </div>

                <button
                  onClick={() => setView("redes")}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 border border-orange-400/30"
                >
                  <span>Ver Mapa y Direccionamiento Multi-Sede</span>
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PASARELA DE ACCESO RÁPIDO A DEPARTAMENTOS */}
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className={`text-xl sm:text-2xl font-bold font-display ${isDark ? "text-white" : "text-slate-900"}`}>
              Departamentos y Áreas de Interred Ltda.
            </h2>
            <p className={`text-xs sm:text-sm mt-1 ${isDark ? "text-slate-300" : "text-slate-600"}`}>
              Selecciona el área institucional a la que deseas acceder:
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {departamentos.map((dep) => {
            const Icon = dep.icon;
            return (
              <div
                key={dep.id}
                onClick={() => setView(dep.id)}
                className={`group p-6 rounded-2xl border transition-all duration-200 cursor-pointer shadow-lg hover:shadow-2xl transform hover:-translate-y-1 backdrop-blur-lg ${
                  isDark 
                    ? "bg-[#0B132B]/85 hover:bg-slate-900 border-slate-700/80 hover:border-emerald-500/50 shadow-black/50" 
                    : "bg-white/90 hover:bg-white border-slate-200 hover:border-orange-500/50 shadow-slate-200/50"
                }`}
              >
                <div className="flex justify-between items-start mb-3.5">
                  <div className={`p-3 rounded-xl transition ${
                    isDark ? "bg-white/10 group-hover:bg-emerald-500/20 text-emerald-400 group-hover:text-emerald-300 border border-white/10" : "bg-orange-50 group-hover:bg-orange-100 text-orange-600"
                  }`}>
                    <Icon size={24} />
                  </div>
                  <span className={`text-[11px] font-bold px-3 py-1 rounded-full border ${dep.badgeColor}`}>
                    {dep.badge}
                  </span>
                </div>
                <h3 className={`font-extrabold text-base mb-1.5 group-hover:text-orange-400 transition ${isDark ? "text-white" : "text-slate-900"}`}>
                  {dep.name}
                </h3>
                <p className={`text-xs leading-relaxed ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                  {dep.desc}
                </p>
                <div className="mt-4 pt-3 border-t border-slate-700/60 flex items-center justify-between text-xs font-bold text-orange-400 group-hover:translate-x-1 transition-transform">
                  <span>Ingresar al módulo</span>
                  <ArrowRight size={14} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* QUIÉNES SOMOS & PROPUESTA DE VALOR INSTITUCIONAL */}
      <div className={`p-6 sm:p-8 rounded-3xl border backdrop-blur-xl shadow-2xl ${
        isDark ? "bg-[#0B132B]/90 border-slate-700/80 shadow-black/60" : "bg-white/90 border-slate-200 shadow-lg shadow-slate-100"
      }`}>
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
            <Award size={15} />
            <span>Perfil Corporativo · Interred Ltda.</span>
          </div>
          <h2 className={`text-2xl sm:text-3xl font-extrabold font-display ${isDark ? "text-white" : "text-slate-900"}`}>
            Conectividad Confiable, Telecomunicaciones y Transformación Digital
          </h2>
          <p className={`text-sm sm:text-base leading-relaxed ${isDark ? "text-slate-200" : "text-slate-700"}`}>
            <strong className={isDark ? "text-white" : "text-slate-900 font-extrabold"}>Interred Ltda.</strong> es una empresa colombiana especializada en soluciones de telecomunicaciones, diseño de redes corporativas, cableado estructurado, soporte de sistemas e integración financiera para el sector productivo. En el marco de la formación del SENA (Ruta GA6-220501106-AA1), este portal consolida la operación de nuestras sedes principales y sucursales.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
            <div className={`p-5 rounded-2xl border ${isDark ? "bg-slate-900/80 border-slate-700/80" : "bg-slate-50 border-slate-200"}`}>
              <div className={`font-extrabold text-sm mb-1.5 ${isDark ? "text-orange-400" : "text-orange-600"}`}>Misión Corporativa</div>
              <p className={`text-xs leading-relaxed ${isDark ? "text-slate-300" : "text-slate-600 font-medium"}`}>
                Garantizar la continuidad operativa de nuestros clientes empresariales mediante redes de telecomunicaciones de alta disponibilidad, soporte técnico ágil y control integral de sus activos tecnológicos.
              </p>
            </div>

            <div className={`p-5 rounded-2xl border ${isDark ? "bg-slate-900/80 border-slate-700/80" : "bg-slate-50 border-slate-200"}`}>
              <div className={`font-extrabold text-sm mb-1.5 ${isDark ? "text-emerald-400" : "text-emerald-700"}`}>Visión Estratégica</div>
              <p className={`text-xs leading-relaxed ${isDark ? "text-slate-300" : "text-slate-600 font-medium"}`}>
                Consolidarnos como el proveedor de referencia en infraestructura de redes de vanguardia, automatización basada en IA y soluciones de software seguras para el territorio nacional.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* PORTAFOLIO DE SERVICIOS TECNOLÓGICOS */}
      <div className="space-y-5">
        <div>
          <h2 className={`text-xl sm:text-2xl font-bold font-display ${isDark ? "text-white" : "text-slate-900"}`}>
            Servicios de Infraestructura Tecnológica
          </h2>
          <p className={`text-xs sm:text-sm mt-1 ${isDark ? "text-slate-300" : "text-slate-600"}`}>
            Capacidades técnicas desplegadas en la red nacional de Interred Ltda.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {servicios.map((srv, idx) => {
            const Icon = srv.icon;
            return (
              <div
                key={idx}
                className={`p-6 rounded-2xl border transition-all backdrop-blur-lg hover:scale-[1.01] ${
                  isDark ? "bg-[#0B132B]/85 border-slate-700/80 hover:border-slate-600 shadow-lg shadow-black/40" : "bg-white/80 border-slate-200 hover:border-slate-300 shadow-sm"
                }`}
              >
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${srv.color} border border-white/10 flex items-center justify-center mb-3.5 ${srv.iconColor}`}>
                  <Icon size={22} />
                </div>
                <div className="flex items-center justify-between mb-1.5">
                  <h3 className={`font-extrabold text-sm ${isDark ? "text-white" : "text-slate-900"}`}>{srv.title}</h3>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-mono font-bold">
                    {srv.tag}
                  </span>
                </div>
                <p className={`text-xs leading-relaxed ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                  {srv.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* MONITOR DE SEDES EN VIVO */}
      <div className={`p-6 sm:p-8 rounded-3xl border backdrop-blur-xl shadow-2xl ${
        isDark ? "bg-[#0B132B]/90 border-slate-700/80 shadow-black/60" : "bg-white/90 border-slate-200 shadow-md shadow-slate-100"
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
          <div>
            <h3 className={`font-extrabold text-lg sm:text-xl font-display ${isDark ? "text-white" : "text-slate-900"}`}>
              Sedes Conectadas · Red WAN Interred Ltda.
            </h3>
            <p className={`text-xs sm:text-sm mt-0.5 ${isDark ? "text-slate-300" : "text-slate-600"}`}>
              Estado de interconexión punto a punto mediante túneles seguros y fibra óptica dedicada
            </p>
          </div>
          <button
            onClick={() => setView("redes")}
            className="text-xs font-bold text-orange-400 hover:text-orange-300 flex items-center gap-1.5 self-start sm:self-auto px-3 py-1.5 rounded-xl bg-orange-500/10 border border-orange-500/30"
          >
            <span>Ver detalle técnico completo</span>
            <ArrowRight size={14} />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {sedes.map((s, idx) => (
            <div
              key={idx}
              className={`p-5 rounded-2xl border flex flex-col justify-between transition-all hover:scale-[1.01] ${
                isDark ? "bg-slate-950/80 border-slate-700/80" : "bg-slate-50/90 border-slate-200"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block animate-pulse shadow-sm shadow-emerald-400" />
                    <span className="text-xs font-bold text-emerald-400 font-mono">{s.estado}</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {s.ping}
                  </span>
                </div>
                <div className={`font-extrabold text-sm mb-1 ${isDark ? "text-white" : "text-slate-900"}`}>
                  {s.nombre}
                </div>
                <div className={`text-xs mb-2 truncate ${isDark ? "text-slate-300" : "text-slate-600 font-medium"}`}>
                  {s.dir}
                </div>
              </div>
              <div className={`pt-2 border-t flex items-center justify-between text-[11px] font-mono ${
                isDark ? "border-slate-700/60 text-amber-300" : "border-slate-200 text-amber-800 font-bold"
              }`}>
                <span>{s.vlan}</span>
                <span className={`${isDark ? "text-emerald-400" : "text-emerald-700"} font-extrabold`}>100% ONLINE</span>
              </div>
            </div>
          ))}
        </div>
      </div>


      {/* PIE INSTITUCIONAL / SENA CREDITS */}
      <div className={`p-6 rounded-2xl border text-center space-y-2 backdrop-blur-md ${
        isDark ? "bg-white/5 border-white/10 text-slate-400" : "bg-slate-100 border-slate-200 text-slate-600"
      }`}>
        <div className="text-xs font-mono font-semibold uppercase tracking-wider text-orange-500">
          Actividad Académica SENA · GA6-220501106-AA1
        </div>
        <p className="text-xs max-w-xl mx-auto">
          Sistema de información corporativo, direccionamiento de redes y CRM de Interred Ltda. Desarrollado con arquitectura moderna en React, Vite, Tailwind CSS y Supabase.
        </p>
      </div>
    </div>
  );
}
