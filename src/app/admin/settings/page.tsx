"use client";

import { useState } from "react";
import { Settings, BellRing, Shield, Save, MessageSquare, Key, HelpCircle } from "lucide-react";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("general");

  const tabs = [
    { id: "general", label: "General", icon: Settings },
    { id: "notifications", label: "Notificaciones", icon: BellRing },
    { id: "security", label: "Seguridad", icon: Shield },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Configuración</h1>
          <p className="text-slate-500 dark:text-slate-400">Administra los ajustes globales de la plataforma.</p>
        </div>
        <button type="button" className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white font-medium rounded-xl hover:bg-blue-600 transition-all duration-300 ease-in-out shadow-lg shadow-primary/30 hover:scale-[1.02] active:scale-95">
          <Save className="w-5 h-5" />
          Guardar Cambios
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-6 pt-4">
        
        {/* Sidebar de Navegación de Configuración */}
        <div className="w-full md:w-64 shrink-0">
          <nav aria-label="Secciones de configuración" className="grid grid-cols-3 md:flex md:flex-col gap-1 sm:gap-2 pb-2 md:pb-0">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  aria-pressed={isActive}
                  className={`min-w-0 flex items-center justify-center md:justify-start gap-1.5 sm:gap-3 px-2 sm:px-4 py-3 rounded-xl text-xs sm:text-sm font-medium transition-all duration-300 ease-in-out active:scale-95 ${
                    isActive 
                      ? "bg-white dark:bg-slate-800 text-primary shadow-sm ring-1 ring-slate-200 dark:ring-slate-700" 
                      : "text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <tab.icon className={`w-5 h-5 ${isActive ? "text-primary" : "text-slate-400"}`} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Contenido de Configuración */}
        <div className="flex-1">
          {activeTab === "general" && (
            <div className="glass rounded-2xl p-6 sm:p-8 space-y-8 animate-in fade-in duration-300">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Información de la Empresa</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Detalles básicos de tu negocio que se mostrarán en los vouchers.</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="business-name" className="text-sm font-medium text-slate-700 dark:text-slate-300">Nombre Comercial</label>
                    <input 
                      id="business-name"
                      type="text" 
                      defaultValue="Galápagos Platform"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-slate-900 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="business-email" className="text-sm font-medium text-slate-700 dark:text-slate-300">Correo Principal</label>
                    <input 
                      id="business-email"
                      type="email" 
                      defaultValue="contacto@empresa.com"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-slate-900 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <label htmlFor="business-address" className="text-sm font-medium text-slate-700 dark:text-slate-300">Dirección</label>
                    <input 
                      id="business-address"
                      type="text" 
                      defaultValue="Puerto Ayora, Isla Santa Cruz, Galápagos"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-slate-900 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-200 dark:border-slate-800 pt-8">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Preferencias Regionales</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Configura cómo se maneja la zona horaria de las salidas.</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="timezone" className="text-sm font-medium text-slate-700 dark:text-slate-300">Zona Horaria</label>
                    <select id="timezone" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-slate-900 outline-none transition-all">
                      <option>(GMT-06:00) Galápagos</option>
                      <option>(GMT-05:00) Ecuador Continental</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="currency" className="text-sm font-medium text-slate-700 dark:text-slate-300">Moneda Base</label>
                    <select id="currency" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-slate-900 outline-none transition-all">
                      <option>USD ($) - Dólar Estadounidense</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="glass rounded-2xl p-6 sm:p-8 space-y-8 animate-in fade-in duration-300">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Automatización con WhatsApp</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Gestiona la integración del bot para enviar vouchers automáticos a agencias y dueños.</p>
                
                <div className="p-5 sm:p-6 rounded-2xl border-2 border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-900/10 flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-900 dark:text-white text-lg">Servicio de WhatsApp</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                      El servidor simulará una sesión web para enviar mensajes gratis. Requiere escanear un código QR la primera vez.
                    </p>
                  </div>
                  
                  {/* Toggle Switch */}
                  <div className="shrink-0">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" value="" aria-label="Activar servicio de WhatsApp" className="sr-only peer" defaultChecked />
                      <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 dark:peer-focus:ring-emerald-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all dark:border-gray-600 peer-checked:bg-emerald-500"></div>
                      <span className="ml-3 text-sm font-medium text-slate-900 dark:text-slate-300 sr-only">Toggle WhatsApp</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                <h4 className="font-bold text-slate-900 dark:text-white">Eventos Notificables</h4>
                
                <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">Nueva Reserva Confirmada</p>
                    <p className="text-xs text-slate-500">Envía el voucher en PDF a la agencia.</p>
                  </div>
                  <input type="checkbox" aria-label="Notificar nueva reserva confirmada" className="w-5 h-5 rounded text-primary focus:ring-primary accent-primary" defaultChecked />
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">Alerta a Embarcación</p>
                    <p className="text-xs text-slate-500">Avisa al dueño del barco que un cupo ha sido tomado.</p>
                  </div>
                  <input type="checkbox" aria-label="Notificar alerta a embarcación" className="w-5 h-5 rounded text-primary focus:ring-primary accent-primary" defaultChecked />
                </div>
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="glass rounded-2xl p-6 sm:p-8 space-y-8 animate-in fade-in duration-300">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Seguridad de la Cuenta</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Actualiza tu contraseña de administrador.</p>
                
                <div className="space-y-4 max-w-md">
                  <div className="space-y-2">
                    <label htmlFor="current-password" className="text-sm font-medium text-slate-700 dark:text-slate-300">Contraseña Actual</label>
                    <div className="relative">
                      <Key className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        id="current-password"
                        type="password" 
                        autoComplete="current-password"
                        placeholder="••••••••"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-slate-900 outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="new-password" className="text-sm font-medium text-slate-700 dark:text-slate-300">Nueva Contraseña</label>
                    <div className="relative">
                      <Key className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        id="new-password"
                        type="password" 
                        autoComplete="new-password"
                        placeholder="Mínimo 8 caracteres"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-slate-900 outline-none transition-all"
                      />
                    </div>
                  </div>
                  <button type="button" className="w-full min-h-11 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-medium rounded-xl hover:bg-slate-800 dark:hover:bg-slate-100 transition-all duration-300 ease-in-out active:scale-95 mt-2">
                    Actualizar Contraseña
                  </button>
                </div>
              </div>
              
              <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 flex gap-4">
                <HelpCircle className="w-6 h-6 text-blue-500 shrink-0" />
                <div>
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 text-sm">Respaldo de Base de Datos</h4>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                    Recuerda que como usamos Supabase de forma local en Docker, los respaldos (backups) deben realizarse manualmente desde la consola del servidor de PostgreSQL.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
