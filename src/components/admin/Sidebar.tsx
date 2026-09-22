"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Map, 
  Ship, 
  Building2, 
  Settings, 
  LogOut,
  X,
  History
} from "lucide-react";

const navItems = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Rutas y Tours", href: "/admin/tours", icon: Map },
  { name: "Embarcaciones", href: "/admin/vessels", icon: Ship },
  { name: "Agencias", href: "/admin/agencies", icon: Building2 },
  { name: "Auditoría", href: "/admin/audit", icon: History },
  { name: "Configuración", href: "/admin/settings", icon: Settings },
];

export function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Content */}
      <aside className={`
        glass-sidebar w-64 h-screen flex flex-col justify-between p-4 
        fixed md:sticky top-0 left-0 z-50
        transition-transform duration-300 ease-in-out
        ${isOpen ? "visible translate-x-0" : "invisible md:visible -translate-x-full md:translate-x-0"}
      `}>
        <div>
          <div className="flex items-center justify-between px-2 py-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-blue-400 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary/30">
                G
              </div>
              <span className="font-bold text-xl tracking-tight">Galápagos</span>
            </div>
            <button type="button" onClick={onClose} aria-label="Cerrar menú de navegación" className="md:hidden w-11 h-11 flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all duration-300 ease-in-out active:scale-95">
              <X className="w-6 h-6" />
            </button>
          </div>

          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => onClose()}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 group ${
                    isActive 
                      ? "bg-primary text-white shadow-md shadow-primary/20" 
                      : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <item.icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? "scale-110" : "group-hover:scale-110"}`} />
                  <span className="font-medium text-sm">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer / Logout */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
          <Link 
            href="/" 
            onClick={onClose}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10 dark:hover:text-red-400 transition-all duration-300 ease-in-out active:scale-95 w-full"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Cerrar Sesión</span>
          </Link>
        </div>
      </aside>
    </>
  );
}
