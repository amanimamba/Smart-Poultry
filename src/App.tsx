/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  PlusCircle, 
  ClipboardCheck, 
  ScanSearch, 
  Settings,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  Droplets,
  Pizza,
  Skull,
  LogIn,
  UserPlus,
  LogOut,
  Mail,
  Lock,
  User as UserIcon,
  Bell,
  Trash2,
  CheckCircle2,
  MessageSquare,
  Send,
  Loader2,
  Camera,
  FileText,
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, differenceInDays, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { GoogleGenAI } from "@google/genai";

import { Toaster, toast } from 'sonner';

import { Project, DailyLog, ProjectType, User, FeedPriceConfig, MaintenanceTask } from './types';
import { cn } from './constants';
import { GEMINI_API_KEY } from './lib/api';
// import { detectDiseaseFromImage } from './services/ai'; // Removing local service as we use Gemini directly

// --- Sub-components (Simplified for now) ---

const StatCard = ({ title, value, icon: Icon, color, trend }: any) => (
  <div className="card p-6 flex flex-col justify-between">
    <div className="flex items-center justify-between mb-4">
      <div className={cn("p-2 rounded-lg", color)}>
        <Icon size={18} className="text-white" />
      </div>
      {trend && <span className="text-[10px] text-red-600 font-black">{trend}</span>}
    </div>
    <div>
      <p className="stat-label mb-1">{title}</p>
      <h3 className="stat-value">{value}</h3>
    </div>
  </div>
);

export default function App() {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('poultry_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('poultry_projects');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [activeProjectId, setActiveProjectId] = useState<string | null>(() => {
    return localStorage.getItem('poultry_active_project') || null;
  });

  const [activeTab, setActiveTab] = useState('dashboard');
  const [trackingSubTab, setTrackingSubTab] = useState('feed-water');
  const [showNewProject, setShowNewProject] = useState(false);
  
  const [feedPrices, setFeedPrices] = useState<FeedPriceConfig[]>(() => {
    const saved = localStorage.getItem('poultry_feed_prices');
    return saved ? JSON.parse(saved) : [
      { id: '1', typeName: 'Aliment Démarrage', pricePerKg: 1.5 },
      { id: '2', typeName: 'Aliment Croissance', pricePerKg: 1.2 },
      { id: '3', typeName: 'Aliment Finition', pricePerKg: 1.0 }
    ];
  });

  const [maintenanceTasks, setMaintenanceTasks] = useState<MaintenanceTask[]>(() => {
    const saved = localStorage.getItem('poultry_tasks');
    return saved ? JSON.parse(saved) : [];
  });

  const activeProject = useMemo(() => 
    projects.find(p => p.id === activeProjectId), 
    [projects, activeProjectId]
  );

  const logs = useMemo(() => {
    const saved = localStorage.getItem('poultry_logs');
    return saved ? JSON.parse(saved) : [];
  }, [activeTab]); // Refresh when tab changes or logs updated

  const projectLogs = useMemo(() => 
    logs.filter((l: any) => l.projectId === activeProjectId),
    [logs, activeProjectId]
  );

  const latestStats = useMemo(() => {
    if (!activeProject) return { mortality: 0, sick: 0, weight: 0 };
    const healthLogs = projectLogs.filter((l: any) => l.type === 'health');
    if (healthLogs.length === 0) return { mortality: 0, sick: 0, weight: 0 };
    
    const latest = healthLogs.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
    return {
      mortality: latest.deadBirds || 0,
      sick: latest.sickBirds || 0,
      weight: latest.averageWeight || 0
    };
  }, [projectLogs, activeProject]);

  const totalMortality = useMemo(() => {
    const healthLogs = projectLogs.filter((l: any) => l.type === 'health');
    return healthLogs.reduce((sum: number, l: any) => sum + (l.deadBirds || 0), 0);
  }, [projectLogs]);

  const mortalityRate = activeProject ? (totalMortality / activeProject.chickCount) * 100 : 0;

  useEffect(() => {
    localStorage.setItem('poultry_projects', JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    if (activeProjectId) localStorage.setItem('poultry_active_project', activeProjectId);
  }, [activeProjectId]);

  useEffect(() => {
    localStorage.setItem('poultry_feed_prices', JSON.stringify(feedPrices));
  }, [feedPrices]);

  useEffect(() => {
    localStorage.setItem('poultry_tasks', JSON.stringify(maintenanceTasks));
  }, [maintenanceTasks]);

  const handleLogout = () => {
    localStorage.removeItem('poultry_user');
    setUser(null);
  };

  if (!user) {
    return <AuthScreen onLogin={setUser} />;
  }

  const handleCreateProject = (newProject: Omit<Project, 'id'>) => {
    const project: Project = { ...newProject, id: crypto.randomUUID() };
    setProjects([...projects, project]);
    setActiveProjectId(project.id);
    setShowNewProject(false);
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans antialiased text-slate-900">
      <Toaster position="top-right" richColors />
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col p-6 gap-8 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center text-white font-bold text-xl overflow-hidden shadow-lg shadow-red-600/30">
            <img src="https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&q=80&w=100" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="font-display font-bold text-slate-800 leading-none tracking-tight">Smart Poultry</h1>
            <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest mt-1">Manager</p>
          </div>
        </div>

        <nav className="flex flex-col gap-1.5">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-3">Menu Principal</p>
          <NavItem icon={LayoutDashboard} label="Tableau de bord" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          
          <div className="flex flex-col gap-1">
            <NavItem 
              icon={ClipboardCheck} 
              label="Suivi Quotidien" 
              active={activeTab === 'tracking'} 
              onClick={() => setActiveTab('tracking')} 
            />
            {activeTab === 'tracking' && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                className="ml-9 flex flex-col gap-1 border-l-2 border-slate-100 pl-4 py-2"
              >
                <button 
                  onClick={() => setTrackingSubTab('feed-water')}
                  className={cn(
                    "text-[13px] font-bold text-left transition-colors py-1.5 pl-3 mb-1 w-full",
                    trackingSubTab === 'feed-water' ? "text-red-700 bg-red-100 rounded-xl" : "text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl"
                  )}
                >
                  Aliment & Eau
                </button>
                <button 
                  onClick={() => setTrackingSubTab('cleanliness')}
                  className={cn(
                    "text-[13px] font-bold text-left transition-colors py-1.5 pl-3 mb-1 w-full",
                    trackingSubTab === 'cleanliness' ? "text-red-700 bg-red-100 rounded-xl" : "text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl"
                  )}
                >
                  Propreté
                </button>
                <button 
                  onClick={() => setTrackingSubTab('health')}
                  className={cn(
                    "text-[13px] font-bold text-left transition-colors py-1.5 pl-3 w-full",
                    trackingSubTab === 'health' ? "text-red-700 bg-red-100 rounded-xl" : "text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl"
                  )}
                >
                  Santé
                </button>
              </motion.div>
            )}
          </div>

          <NavItem icon={ScanSearch} label="IA Maladies" active={activeTab === 'ai'} onClick={() => setActiveTab('ai')} />
          <NavItem icon={Calendar} label="Planning & Rappels" active={activeTab === 'planning'} onClick={() => setActiveTab('planning')} />
          <div className="mt-6 pt-6 border-t border-slate-100">
            <NavItem icon={Settings} label="Paramètres" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
          </div>
        </nav>

        <div className="mt-auto">
          <div className="bg-red-900 rounded-xl p-5 text-white shadow-lg shadow-red-900/40 relative overflow-hidden">
            <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
               <img src="https://images.unsplash.com/photo-1594910419293-1961448eb0f0?auto=format&fit=crop&q=80&w=200" alt="Poultry" className="w-24 h-24 object-contain" />
            </div>
            <p className="text-[10px] text-red-400 font-black uppercase tracking-wider mb-2 relative z-10">Statut Système</p>
            {activeProject ? (
              <div className="relative z-10">
                <p className="text-sm font-bold leading-tight mb-2 truncate">{activeProject.name}</p>
                <div className="h-1 w-full bg-red-800 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '80%' }}
                    className="h-full bg-white rounded-full"
                  />
                </div>
                <p className="text-[10px] text-red-300 mt-2 font-medium">Jour {differenceInDays(new Date(), new Date(activeProject.startDate)) + 1} du cycle</p>
              </div>
            ) : (
              <p className="text-xs text-red-300 font-medium italic relative z-10">Aucun projet actif</p>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-2">
            <div className="h-8 w-1 bg-red-500 rounded-full mr-2"></div>
            <div>
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest">
                {activeTab === 'dashboard' && "Tableau de Bord"}
                {activeTab === 'tracking' && "Suivi Quotidien"}
                {activeTab === 'ai' && "Analyse IA"}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-6">
             <div className="flex gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
               <span className="text-red-600">FR</span>
               <span className="opacity-50">EN</span>
               <span className="opacity-50">SW</span>
             </div>
             
             <div className="h-6 w-px bg-slate-200"></div>

             <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 pr-4 border-r border-slate-100">
                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-800">{user.name}</p>
                    <p className="text-[10px] text-slate-400 uppercase">{user.role}</p>
                  </div>
                  <button onClick={handleLogout} className="p-2 hover:bg-rose-50 text-rose-500 rounded-lg transition-colors" title="Déconnexion">
                    <LogOut size={18} />
                  </button>
                </div>
                {projects.length > 0 && (
                  <select 
                    value={activeProjectId || ''} 
                    onChange={(e) => setActiveProjectId(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-600 focus:ring-2 focus:ring-red-500 focus:outline-none cursor-pointer"
                  >
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                )}
                <button 
                  onClick={() => setShowNewProject(true)}
                  className="btn-primary flex items-center gap-2 py-2"
                >
                  <PlusCircle size={16} />
                  NOUVEAU
                </button>
             </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 max-w-[1400px] mx-auto w-full">
           <AnimatePresence mode="wait">
             {activeTab === 'dashboard' && projects.length === 0 && (
               <motion.div 
                 key="empty"
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0 }}
                 className="flex flex-col items-center justify-center h-full text-center py-20"
               >
                 <div className="w-24 h-24 bg-red-100 text-red-600 rounded-3xl flex items-center justify-center mb-6 overflow-hidden shadow-xl shadow-red-600/10 border-2 border-white">
                    <img src="https://images.unsplash.com/photo-1542444455-be4a942550f1?auto=format&fit=crop&q=80&w=200" alt="Chicks" className="w-full h-full object-cover" />
                 </div>
                 <h3 className="text-2xl font-bold font-display text-slate-800 mb-2">Bienvenue sur Smart Poultry</h3>
                 <p className="text-slate-500 max-w-sm mb-8">Commencez par créer votre premier projet d'élevage pour débloquer toutes les fonctionnalités de suivi.</p>
                 <button onClick={() => setShowNewProject(true)} className="btn-primary text-lg px-8 py-3 shadow-lg shadow-red-600/30">Créer mon premier projet</button>
               </motion.div>
              )}

              {activeTab === 'dashboard' && projects.length > 0 && activeProject && (
               <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                  {/* Top Stats Bar */}
                  <div className="card p-6 flex flex-col md:flex-row items-center justify-between gap-6 border-slate-200 shadow-sm">
                    <div>
                      <h1 className="text-2xl font-black text-slate-800 tracking-tight">Projet : {activeProject.name}</h1>
                      <p className="text-slate-500 text-sm italic">Lancé le {format(new Date(activeProject.startDate), 'd MMMM yyyy', { locale: fr })} • Jour {differenceInDays(new Date(), new Date(activeProject.startDate)) + 1} du cycle</p>
                    </div>
                    <div className="flex items-center gap-8">
                       <div className="text-center px-6 border-r border-slate-100">
                          <p className="stat-label mb-1">Effectif Restant</p>
                          <p className="text-2xl font-black text-slate-800">{activeProject.chickCount - totalMortality}</p>
                       </div>
                       <div className="text-center px-6 border-r border-slate-100">
                          <p className="stat-label mb-1 text-rose-500">Mortalité Totale</p>
                          <p className="text-2xl font-black text-rose-600">{mortalityRate.toFixed(1)}%</p>
                       </div>
                       <div className="text-center px-6">
                          <p className="stat-label mb-1 text-red-500">Poids Moyen</p>
                          <p className="text-2xl font-black text-red-600">{latestStats.weight}g</p>
                       </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                       <div className="card p-8">
                         <div className="flex items-center justify-between mb-8">
                           <h4 className="stat-label">Vision Globale - Rapports Récents</h4>
                           <div className="flex gap-4">
                             <span className="px-3 py-1 bg-slate-900 text-white rounded-full text-[10px] font-black uppercase">Derniers 7 jours</span>
                           </div>
                         </div>
                         
                         {projectLogs.length === 0 ? (
                           <div className="h-40 flex flex-col items-center justify-center text-slate-400 italic text-sm">
                              Aucune donnée enregistrée pour le moment.
                           </div>
                         ) : (
                           <div className="space-y-4">
                              {projectLogs.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5).map((log: any) => (
                                <div key={log.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 transition-all hover:border-red-200">
                                  <div className="flex items-center gap-4">
                                     <div className={cn(
                                       "w-10 h-10 rounded-xl flex items-center justify-center text-white",
                                       log.type === 'health' ? "bg-red-600" : log.type === 'cleanliness' ? "bg-slate-900" : "bg-blue-600"
                                     )}>
                                       {log.type === 'health' ? <Skull size={18} /> : log.type === 'cleanliness' ? <Trash2 size={18} /> : <Droplets size={18} />}
                                     </div>
                                     <div>
                                       <p className="text-xs font-bold text-slate-800">
                                         {log.type === 'health' ? 'Suivi Santé & Poids' : log.type === 'cleanliness' ? 'Maintenance Propreté' : 'Aliment & Eau'}
                                       </p>
                                       <p className="text-[10px] text-slate-400 font-medium uppercase">{format(new Date(log.timestamp), 'd MMM HH:mm', { locale: fr })}</p>
                                     </div>
                                  </div>
                                  <div className="text-right">
                                     {log.type === 'health' && (
                                       <p className="text-xs font-black text-rose-600">{log.deadBirds} Morts | {log.averageWeight}g</p>
                                     )}
                                     {log.type === 'cleanliness' && (
                                       <p className="text-xs font-black text-slate-700">{log.completedTasks?.length} tâches faites</p>
                                     )}
                                     {log.type === 'feed-water' && (
                                       <p className="text-xs font-black text-blue-600">{log.foodQuantity}kg | {log.waterQuantity}L</p>
                                     )}
                                  </div>
                                </div>
                              ))}
                           </div>
                         )}
                       </div>

                       <div className="card p-8">
                          <h4 className="stat-label mb-6 leading-none">Rappels Prioritaires</h4>
                          <div className="space-y-3">
                            <TaskItem label="Distribution Alimentaire Matin" done />
                            <TaskItem label="Nettoyage et Désinfection" urgent />
                            <TaskItem label="Pesée d'échantillon" />
                            <TaskItem label="Vérification Température" />
                          </div>
                       </div>
                    </div>

                    <div className="space-y-8">
                       {/* AI Diagnostic Quick Access */}
                       <div className="card bg-slate-900 text-white p-8 flex flex-col items-center text-center shadow-xl relative overflow-hidden group">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                          <div className="w-16 h-16 bg-red-500 rounded-full mb-6 flex items-center justify-center shadow-lg shadow-red-500/20 group-hover:scale-110 transition-transform">
                             <ScanSearch size={32} className="text-white" />
                          </div>
                          <h3 className="text-lg font-bold mb-2">Détection IA</h3>
                          <p className="text-slate-400 text-xs mb-8 px-2 leading-relaxed">Analysez vos poussins pour prévenir les maladies comme la Coccidiose.</p>
                          <button onClick={() => setActiveTab('ai')} className="w-full py-4 bg-white text-slate-900 font-black text-xs uppercase tracking-widest rounded-lg hover:bg-red-400 transition-colors">Analyser Photo</button>
                       </div>
                    </div>
                  </div>
               </motion.div>
             )}
             
             {activeTab === 'tracking' && activeProject && (
                <div className="space-y-6">
                  {trackingSubTab === 'feed-water' && (
                    <FeedWaterTracker 
                      projectId={activeProject.id} 
                      chickCount={activeProject.chickCount}
                      startDate={activeProject.startDate}
                      type={activeProject.type}
                      onSave={() => setActiveTab('dashboard')} 
                    />
                  )}
                  {trackingSubTab === 'cleanliness' && (
                    <CleanlinessTracker 
                      projectId={activeProject.id} 
                      onSave={() => setActiveTab('dashboard')} 
                    />
                  )}
                  {trackingSubTab === 'health' && (
                    <HealthTracker 
                      projectId={activeProject.id}
                      chickCount={activeProject.chickCount}
                      onSave={() => setActiveTab('dashboard')} 
                    />
                  )}
                </div>
              )}
             {activeTab === 'ai' && <AIDetector />}
             {activeTab === 'planning' && activeProject && <FollowUpPlanner projectId={activeProject.id} chickCount={activeProject.chickCount} startDate={activeProject.startDate} />}
             {activeTab === 'settings' && (
                <div className="space-y-8 pb-12">
                  <div className="card p-8">
                    <h4 className="text-xl font-black text-slate-800 mb-6 tracking-tight font-display">Configuration des Prix d'Aliment</h4>
                    <p className="text-sm text-slate-500 mb-8 italic">Mettez à jour les prix du marché pour des calculs de rentabilité précis.</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                       {feedPrices.map(price => (
                         <div key={price.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                            <label className="stat-label text-red-600 uppercase tracking-widest">{price.typeName}</label>
                            <div className="relative">
                              <input 
                                type="number" 
                                value={price.pricePerKg} 
                                onChange={(e) => {
                                  const newVal = parseFloat(e.target.value);
                                  setFeedPrices(prev => prev.map(p => p.id === price.id ? {...p, pricePerKg: newVal} : p));
                                }}
                                className="w-full p-4 bg-white border border-slate-200 rounded-xl pr-20 focus:ring-2 focus:ring-red-500 focus:outline-none font-black text-slate-700"
                              />
                              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase">$/kg</span>
                            </div>
                         </div>
                       ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="card p-8">
                      <h4 className="stat-label mb-6 text-slate-800 text-lg uppercase tracking-widest">Programme d'Entretien</h4>
                      <div className="space-y-3">
                         <TaskItem label="Nettoyage et Désinfection Hebdomadaire" done />
                         <TaskItem label="Vérification de la Litière" />
                         <TaskItem label="Contrôle de la Qualité de l'Eau" />
                      </div>
                    </div>
                    <div className="card p-8">
                      <h4 className="stat-label mb-6 text-slate-800 text-lg uppercase tracking-widest">Suivi Sanitaire & Vaccins</h4>
                      <div className="space-y-3">
                         <div className="flex items-center justify-between p-4 bg-rose-50 rounded-xl border border-rose-100">
                            <span className="text-sm font-bold text-rose-800">Vaccin Newcastle (J7)</span>
                            <span className="text-[10px] font-black bg-rose-600 text-white px-2 py-0.5 rounded shadow-sm shadow-rose-600/20">Rappel</span>
                         </div>
                         <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 opacity-60">
                            <span className="text-sm font-bold text-slate-500">Vaccin Gumboro (J14)</span>
                            <span className="text-[10px] font-black bg-slate-400 text-white px-2 py-0.5 rounded">Terminé</span>
                         </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

           </AnimatePresence>
        </div>

        {/* New Project Modal */}
        {showNewProject && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
             <motion.div 
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl overflow-y-auto max-h-[90vh]"
            >
               <NewProjectForm onCancel={() => setShowNewProject(false)} onCreate={handleCreateProject} />
             </motion.div>
          </div>
        )}
      </main>
    </div>
  );
}

// --- Helper Components ---

function NavItem({ icon: Icon, label, active, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-3 py-3 rounded-lg transition-all font-bold text-xs tracking-tight group",
        active ? "bg-red-50 text-red-700" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
      )}
    >
      <div className={cn(
        "w-5 h-5 border-2 rounded-sm flex items-center justify-center transition-all",
        active ? "border-red-700 bg-red-700 text-white" : "border-slate-300 group-hover:border-slate-400"
      )}>
        <Icon size={12} className={active ? "opacity-100" : "opacity-0"} />
      </div>
      <span>{label}</span>
    </button>
  );
}

function TaskItem({ label, done, urgent }: { label: string; done?: boolean; urgent?: boolean }) {
  return (
    <div className={cn("flex items-center gap-3 p-3 rounded-lg border transition-all", done ? "bg-slate-50 border-slate-100 opacity-60" : "bg-white border-slate-200")}>
       <div className={cn("w-5 h-5 rounded border flex items-center justify-center transition-all", done ? "bg-red-600 border-red-600" : "border-slate-300 shadow-inner")}>
          {done && <ChevronRight size={12} className="text-white" />}
       </div>
       <span className={cn("text-sm font-medium", done ? "text-slate-400" : "text-slate-700")}>{label}</span>
       {!done && urgent && <span className="ml-auto text-[10px] font-black text-red-700 bg-red-100 px-2 py-0.5 rounded uppercase tracking-tighter">Urgent</span>}
       {!done && !urgent && label.includes('Aliment') && <span className="ml-auto text-[10px] font-black text-amber-700 bg-amber-100 px-2 py-0.5 rounded uppercase tracking-tighter">Routine</span>}
    </div>
  );
}

function NewProjectForm({ onCancel, onCreate }: { onCancel: () => void; onCreate: (p: Omit<Project, 'id'>) => void }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    type: 'Chair' as ProjectType,
    chickCount: 100,
    startDate: format(new Date(), 'yyyy-MM-dd'),
    breed: 'Local',
    origin: '',
    purchasePrice: 0,
    budget: 0,
    selectedFeedingStrategy: 'ideal' as 'ideal' | 'average',
    ageInDaysAtStart: 7, 
    status: 'active' as const
  });

  const feedingData = useMemo(() => {
    const birdCount = formData.chickCount;
    const idealGrams = 80; 
    const avgGrams = 60;
    
    return {
      ideal: {
        perDay: (idealGrams * birdCount) / 1000,
        perMonth: (idealGrams * birdCount * 30) / 1000,
        priceEst: (idealGrams * birdCount * 30 * 1.5) / 1000 
      },
      average: {
        perDay: (avgGrams * birdCount) / 1000,
        perMonth: (avgGrams * birdCount * 30) / 1000,
        priceEst: (avgGrams * birdCount * 30 * 1.2) / 1000 
      }
    };
  }, [formData.chickCount, formData.ageInDaysAtStart]);

  return (
    <div className="flex flex-col h-full">
       <div className="p-8 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold font-display text-slate-800 tracking-tight">Nouveau Projet d'Élevage</h3>
            <p className="text-xs text-slate-400 font-medium tracking-wide">Étape {step} sur 2</p>
          </div>
          <button onClick={onCancel} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400">
            <PlusCircle className="rotate-45" size={24} />
          </button>
       </div>

       <div className="p-8 space-y-6">
          {step === 1 ? (
             <div className="grid grid-cols-2 gap-6">
               <div className="col-span-2 space-y-2">
                 <label className="stat-label uppercase tracking-widest text-slate-400">Nom du projet</label>
                 <input 
                   placeholder="Ex: Lot Poussin Mai 2024"
                   className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-red-500 focus:outline-none transition-all font-bold"
                   value={formData.name}
                   onChange={e => setFormData({...formData, name: e.target.value})}
                 />
               </div>
               <div className="space-y-2">
                 <label className="stat-label uppercase tracking-widest text-slate-400">Nombre de poussins</label>
                 <input 
                   type="number"
                   className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-red-500 focus:outline-none font-bold"
                   value={formData.chickCount}
                   onChange={e => setFormData({...formData, chickCount: parseInt(e.target.value)})}
                 />
               </div>
               <div className="space-y-2">
                 <label className="stat-label uppercase tracking-widest text-slate-400">Âge actuel (jours)</label>
                 <input 
                   type="number"
                   className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-red-500 focus:outline-none font-bold"
                   value={formData.ageInDaysAtStart}
                   onChange={e => setFormData({...formData, ageInDaysAtStart: parseInt(e.target.value)})}
                 />
               </div>
               <div className="space-y-2">
                 <label className="stat-label uppercase tracking-widest text-slate-400">Type d'élevage</label>
                 <select 
                   className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-red-500 focus:outline-none font-bold"
                   value={formData.type}
                   onChange={e => setFormData({...formData, type: e.target.value as ProjectType})}
                 >
                   <option value="Chair">Chair</option>
                   <option value="Ponte">Ponte</option>
                 </select>
               </div>
               <div className="space-y-2">
                 <label className="stat-label uppercase tracking-widest text-slate-400">Date de début</label>
                 <input 
                   type="date"
                   className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-red-500 focus:outline-none cursor-pointer font-bold"
                   value={formData.startDate}
                   onChange={e => setFormData({...formData, startDate: e.target.value})}
                 />
               </div>
             </div>
          ) : (
             <div className="space-y-8">
               <h4 className="stat-label text-center text-red-600 uppercase tracking-widest font-display">Stratégie d'Alimentation</h4>
               <p className="text-[10px] text-slate-400 text-center uppercase font-black px-8 border-b pb-6 border-slate-100 italic">Configurez le plan nutritionnel pour {formData.chickCount} poussins.</p>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {/* IDÉAL */}
                 <button 
                   onClick={() => setFormData({...formData, selectedFeedingStrategy: 'ideal'})}
                   className={cn(
                     "relative p-6 rounded-2xl border-2 transition-all text-left flex flex-col gap-4 shadow-sm",
                     formData.selectedFeedingStrategy === 'ideal' ? "border-red-500 bg-red-50/50" : "border-slate-100 hover:border-slate-200"
                   )}
                 >
                   <div className="flex items-center justify-between">
                     <span className="text-xs font-black uppercase tracking-widest text-red-600">Option Idéal</span>
                     {formData.selectedFeedingStrategy === 'ideal' && <div className="w-4 h-4 bg-red-500 rounded-full shadow-lg shadow-red-500/20 animate-pulse"></div>}
                   </div>
                   <div>
                     <p className="text-2xl font-black text-slate-800 tracking-tight">{feedingData.ideal.perDay.toFixed(1)} kg / jr</p>
                     <p className="text-[10px] text-slate-400 uppercase font-black tracking-tighter mt-1">Mensuel: {feedingData.ideal.perMonth.toFixed(0)} kg</p>
                   </div>
                   <div className="p-3 bg-white rounded-xl border border-slate-100">
                      <p className="text-[10px] text-slate-400 font-bold uppercase mb-1 leading-none">Coût Mensuel Est.</p>
                      <p className="text-lg font-black text-slate-700">{feedingData.ideal.priceEst.toLocaleString()} $</p>
                   </div>
                 </button>

                 {/* MOYENNE */}
                 <button 
                    onClick={() => setFormData({...formData, selectedFeedingStrategy: 'average'})}
                    className={cn(
                      "relative p-6 rounded-2xl border-2 transition-all text-left flex flex-col gap-4 shadow-sm",
                      formData.selectedFeedingStrategy === 'average' ? "border-amber-500 bg-amber-50/50" : "border-slate-100 hover:border-slate-200"
                    )}
                 >
                   <div className="flex items-center justify-between">
                     <span className="text-xs font-black uppercase tracking-widest text-amber-600">Option Moyenne</span>
                     {formData.selectedFeedingStrategy === 'average' && <div className="w-4 h-4 bg-amber-500 rounded-full shadow-lg shadow-amber-500/20 animate-pulse"></div>}
                   </div>
                   <div>
                     <p className="text-2xl font-black text-slate-800 tracking-tight">{feedingData.average.perDay.toFixed(1)} kg / jr</p>
                     <p className="text-[10px] text-slate-400 uppercase font-black tracking-tighter mt-1">Mensuel: {feedingData.average.perMonth.toFixed(0)} kg</p>
                   </div>
                   <div className="p-3 bg-white rounded-xl border border-slate-100">
                      <p className="text-[10px] text-slate-400 font-bold uppercase mb-1 leading-none">Coût Mensuel Est.</p>
                      <p className="text-lg font-black text-slate-700">{feedingData.average.priceEst.toLocaleString()} $</p>
                   </div>
                 </button>
               </div>
             </div>
          )}
       </div>

       <div className="p-8 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-4">
          <button onClick={onCancel} className="text-sm font-bold text-slate-500 hover:text-slate-800 font-display">Abandonner</button>
          <div className="flex gap-4">
             {step === 2 && (
               <button onClick={() => setStep(1)} className="btn-secondary px-8">Retour</button>
             )}
             {step === 1 ? (
               <button onClick={() => setStep(2)} className="btn-primary px-12" disabled={!formData.name}>Suivant</button>
             ) : (
               <button onClick={() => onCreate(formData)} className="btn-primary px-12">Lancer le projet</button>
             )}
          </div>
       </div>
    </div>
  );
}

function FeedWaterTracker({ projectId, chickCount, startDate, type, onSave }: { projectId: string; chickCount: number; startDate: string; type: 'Chair' | 'Ponte' | 'Mixte'; onSave: () => void }) {
  const ageInDays = differenceInDays(new Date(), new Date(startDate)) + 1;
  
  // Calculate recommendations based on industry standards (simplified)
  const getRecommendations = () => {
    let foodPerChick = 0; // in grams
    if (type === 'Chair') {
      if (ageInDays <= 7) foodPerChick = 20;
      else if (ageInDays <= 14) foodPerChick = 45;
      else if (ageInDays <= 21) foodPerChick = 75;
      else if (ageInDays <= 28) foodPerChick = 110;
      else if (ageInDays <= 35) foodPerChick = 145;
      else foodPerChick = 170;
    } else {
      // For Ponte/Mixte, slightly different
      if (ageInDays <= 7) foodPerChick = 15;
      else if (ageInDays <= 28) foodPerChick = 50;
      else if (ageInDays <= 60) foodPerChick = 80;
      else foodPerChick = 110;
    }

    const totalFoodKg = (foodPerChick * chickCount) / 1000;
    const totalWaterL = totalFoodKg * 2; // Roughly 2L per 1kg of food
    
    return { 
      food: parseFloat(totalFoodKg.toFixed(2)), 
      water: parseFloat(totalWaterL.toFixed(1)) 
    };
  };

  const rec = getRecommendations();

  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    foodQuantity: rec.food,
    waterQuantity: rec.water,
    frequency: '3' as string,
    notifications: true
  });

  const applyRec = () => {
    setFormData({
      ...formData,
      foodQuantity: rec.food,
      waterQuantity: rec.water
    });
  };

  const scheduleNotification = (type: string) => {
    toast(`Rappel programmé ! L'application vous enverra une notification pour le prochain passage : ${type}.`);
  };

  const handleSave = () => {
    const logs = JSON.parse(localStorage.getItem('poultry_logs') || '[]');
    const newLog = { 
      ...formData, 
      id: crypto.randomUUID(), 
      projectId,
      timestamp: new Date().toISOString(),
      type: 'feed-water'
    };
    localStorage.setItem('poultry_logs', JSON.stringify([...logs, newLog]));
    scheduleNotification('Alimentation & Eau');
    
    // Notification reminder
    setTimeout(() => {
      toast.info(`RAPPEL: Il est temps de nourrir et d'abreuver vos sujets pour le projet ${projectId}.`, { duration: 6000 });
    }, 5000);
    
    onSave();
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card p-8 max-w-3xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold font-display text-slate-800 flex items-center gap-3">
          <Pizza className="text-red-500" /> Suivi Alimentaire & Eau
        </h3>
        <div className="flex items-center gap-2 px-3 py-1 bg-red-50 text-red-600 rounded-full text-[10px] font-black uppercase">
          <Bell size={12} /> Rappels {formData.notifications ? 'Activés' : 'Désactivés'}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="p-4 bg-red-50/50 rounded-2xl border border-red-100 flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-1">Proposition IA (Jour {ageInDays})</p>
              <p className="text-xs font-bold text-slate-700">
                L'IA suggère <span className="text-red-600">{rec.food} kg</span> d'aliment et <span className="text-red-600">{rec.water} L</span> d'eau pour vos {chickCount} sujets.
              </p>
            </div>
            <button 
              onClick={applyRec}
              className="px-3 py-2 bg-white border border-red-200 text-red-600 rounded-lg text-[10px] font-black uppercase hover:bg-red-600 hover:text-white transition-all shadow-sm"
            >
              Appliquer
            </button>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Date du suivi</label>
            <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-red-500" />
          </div>

          <div className="space-y-4">
            <label className="text-sm font-bold text-slate-700 block">Fréquence recommandée</label>
            <div className="flex flex-wrap gap-3">
              {['2', '3', '4'].map(f => (
                <button 
                  key={f}
                  onClick={() => setFormData({...formData, frequency: f})}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-bold border transition-all",
                    formData.frequency === f ? "bg-red-600 border-red-600 text-white shadow-lg shadow-red-600/20" : "bg-white border-slate-200 text-slate-500"
                  )}
                >
                  {f} fois / jour
                </button>
              ))}
              <input 
                type="number" 
                placeholder="Autre..." 
                className="w-24 px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold"
                onChange={e => setFormData({...formData, frequency: e.target.value})}
              />
            </div>
            <p className="text-[10px] text-slate-400 italic">L'application propose 2-3 fois/jour par défaut pour optimiser la croissance.</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <Pizza size={16} /> Quantité Nourriture (kg)
            </label>
            <input type="number" step="0.1" value={formData.foodQuantity} onChange={e => setFormData({...formData, foodQuantity: parseFloat(e.target.value)})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-red-500" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <Droplets size={16} /> Quantité Eau (Litres)
            </label>
            <input type="number" step="1" value={formData.waterQuantity} onChange={e => setFormData({...formData, waterQuantity: parseFloat(e.target.value)})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-red-500" />
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={formData.notifications} onChange={e => setFormData({...formData, notifications: e.target.checked})} className="w-5 h-5 accent-red-600" />
            <span className="text-sm font-bold text-slate-600">Activer les notifications de rappel</span>
          </label>
        </div>
      </div>

      <div className="pt-8 border-t border-slate-100 flex justify-end gap-4">
        <button className="btn-secondary" onClick={onSave}>Annuler</button>
        <button className="btn-primary px-10" onClick={handleSave}>Enregistrer</button>
      </div>
    </motion.div>
  );
}

function CleanlinessTracker({ projectId, onSave }: { projectId: string; onSave: () => void }) {
  const [frequency, setFrequency] = useState<string>('3'); // Default 3 times per week
  const [tasks, setTasks] = useState([
    { id: 1, label: 'Nettoyage litière', done: false },
    { id: 2, label: 'Désinfection mangeoires', done: false },
    { id: 3, label: 'Purification de l\'air / Ventilation', done: false },
    { id: 4, label: 'Vérification humidité', done: false }
  ]);
  const [notifications, setNotifications] = useState(true);

  const handleSave = () => {
    const logs = JSON.parse(localStorage.getItem('poultry_logs') || '[]');
    const newLog = {
      id: crypto.randomUUID(),
      projectId,
      type: 'cleanliness',
      frequency,
      date: format(new Date(), 'yyyy-MM-dd'),
      completedTasks: tasks.filter(t => t.done).map(t => t.label),
      timestamp: new Date().toISOString()
    };
    localStorage.setItem('poultry_logs', JSON.stringify([...logs, newLog]));

    if (notifications) {
      toast.success(`Fréquence de ${frequency} fois par semaine enregistrée. Rappels activés pour le nettoyage !`);
      
      // Simulate future reminders
      setTimeout(() => {
        toast.warning("RAPPEL PROPRETÉ : C'est le moment de vérifier la litière et de désinfecter le matériel pour la santé de votre élevage.", { duration: 8000 });
      }, 8000);
    }
    
    onSave();
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card p-8 max-w-3xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold font-display text-slate-800 flex items-center gap-3">
          <Trash2 className="text-red-500" /> Suivi & Planification de Propreté
        </h3>
        <div className="flex items-center gap-2 px-3 py-1 bg-red-50 text-red-600 rounded-full text-[10px] font-black uppercase">
          <Bell size={12} /> Rappels actifs
        </div>
      </div>

      <div className="space-y-6 bg-slate-50 p-6 rounded-3xl border border-slate-100">
        <div>
          <label className="text-sm font-bold text-slate-700 block mb-3">Planifier la fréquence de nettoyage</label>
          <div className="flex flex-wrap gap-2">
            {['1', '2', '3', '4', '5'].map(f => (
              <button 
                key={f}
                onClick={() => setFrequency(f)}
                className={cn(
                  "px-5 py-2.5 rounded-xl text-xs font-bold border transition-all",
                  frequency === f ? "bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-900/20" : "bg-white border-slate-200 text-slate-500 hover:border-red-400"
                )}
              >
                {f} fois / semaine
              </button>
            ))}
          </div>
          <p className="text-[10px] text-slate-400 mt-2 italic">Une fréquence élevée réduit les risques de maladies respiratoires et pododermatites.</p>
        </div>
        
        <div className="flex items-center gap-4 pt-2">
          <label className="flex items-center gap-3 cursor-pointer flex-1">
            <input type="checkbox" checked={notifications} onChange={e => setNotifications(e.target.checked)} className="w-5 h-5 accent-red-600 rounded" />
            <span className="text-sm font-bold text-slate-600">M'alerter automatiquement selon cette fréquence</span>
          </label>
          <button 
            onClick={() => toast.success(`Fréquence de ${frequency} fois/semaine validée ! Les notifications sont maintenant ${notifications ? 'activées' : 'désactivées'}.`)}
            className="px-4 py-2 bg-green-600 text-white text-[10px] font-black uppercase rounded-xl hover:bg-green-700 transition-all shadow-sm"
          >
            Valider & Activer
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <label className="text-sm font-bold text-slate-700 block">Actions effectuées aujourd'hui</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {tasks.map(task => (
            <div 
              key={task.id}
              onClick={() => setTasks(tasks.map(t => t.id === task.id ? {...t, done: !t.done} : t))}
              className={cn(
                "p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between",
                task.done ? "border-red-500 bg-red-50" : "border-slate-100 bg-white hover:border-slate-200"
              )}
            >
              <span className={cn("font-bold text-xs", task.done ? "text-red-700" : "text-slate-600")}>{task.label}</span>
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center transition-all shadow-sm",
                task.done ? "bg-red-600 text-white" : "border-2 border-slate-200 bg-slate-50"
              )}>
                {task.done && <CheckCircle2 size={16} />}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-8 border-t border-slate-100 flex justify-end gap-4">
        <button className="btn-secondary" onClick={onSave}>Annuler</button>
        <button className="btn-primary px-12" onClick={handleSave}>Enregistrer le plan</button>
      </div>
    </motion.div>
  );
}

function HealthTracker({ projectId, chickCount, onSave }: { projectId: string; chickCount: number; onSave: () => void }) {
  const [frequency, setFrequency] = useState<string>('1'); // Default 1 time per week for health check
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    deadBirds: 0,
    sickBirds: 0,
    averageWeight: 0,
    symptoms: ''
  });

  const mortalityRate = (formData.deadBirds / chickCount) * 100;
  const morbidityRate = (formData.sickBirds / chickCount) * 100;

  const scheduleHealthReminder = () => {
    toast.success(`Rappel Santé validé ! Fréquence de ${frequency} fois par semaine activée. L'IA surveillera les prochains rapports.`);
  };

  const handleSave = () => {
    const logs = JSON.parse(localStorage.getItem('poultry_logs') || '[]');
    const newLog = {
      id: crypto.randomUUID(),
      projectId,
      type: 'health',
      frequency,
      ...formData,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem('poultry_logs', JSON.stringify([...logs, newLog]));
    
    toast.success("Données de santé enregistrées !");
    onSave();
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card p-8 max-w-3xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold font-display text-slate-800 flex items-center gap-3">
          <Skull className="text-red-500" /> Suivi de Santé & Progrès
        </h3>
        <div className="flex items-center gap-2 px-3 py-1 bg-red-50 text-red-600 rounded-full text-[10px] font-black uppercase">
          <Bell size={12} /> Fréquence: {frequency}x / sem
        </div>
      </div>

      <div className="space-y-6 bg-slate-50 p-6 rounded-3xl border border-slate-100">
        <div>
          <label className="text-sm font-bold text-slate-700 block mb-3">Planifier la fréquence de suivi sanitaire</label>
          <div className="flex flex-wrap gap-2">
            {['1', '2', '3', '7'].map(f => (
              <button 
                key={f}
                onClick={() => setFrequency(f)}
                className={cn(
                  "px-5 py-2.5 rounded-xl text-xs font-bold border transition-all",
                  frequency === f ? "bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-900/20" : "bg-white border-slate-200 text-slate-500 hover:border-red-400"
                )}
              >
                {f === '7' ? 'Tous les jours' : `${f} fois / semaine`}
              </button>
            ))}
          </div>
          <button 
            onClick={scheduleHealthReminder}
            className="mt-4 px-4 py-2 bg-green-600 text-white text-[10px] font-black uppercase rounded-xl hover:bg-green-700 transition-all shadow-sm"
          >
            Valider & Activer Rappels Santé
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Date du suivi</label>
            <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-red-500" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
               Poids Moyen (grammes)
            </label>
            <input type="number" value={formData.averageWeight} onChange={e => setFormData({...formData, averageWeight: parseInt(e.target.value) || 0})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-red-500 font-bold" placeholder="Ex: 450" />
            <p className="text-[10px] text-slate-400 italic">Essentiel pour suivre la courbe de croissance réelle.</p>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 text-center">
              <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-1">Mortalité</p>
              <p className="text-xl font-black text-rose-800">{mortalityRate.toFixed(1)}%</p>
            </div>
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 text-center">
              <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">Maladie</p>
              <p className="text-xl font-black text-amber-800">{morbidityRate.toFixed(1)}%</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Poules Mortes</label>
              <input type="number" value={formData.deadBirds} onChange={e => setFormData({...formData, deadBirds: parseInt(e.target.value) || 0})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Poules Malades</label>
              <input type="number" value={formData.sickBirds} onChange={e => setFormData({...formData, sickBirds: parseInt(e.target.value) || 0})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Symptômes & Observations</label>
            <textarea value={formData.symptoms} onChange={e => setFormData({...formData, symptoms: e.target.value})} placeholder="Décrivez l'état général..." className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl h-32" />
          </div>
        </div>
      </div>

      <div className="pt-8 border-t border-slate-100 flex justify-end gap-4">
        <button className="btn-secondary" onClick={onSave}>Annuler</button>
        <button className="btn-primary px-10" onClick={handleSave}>Enregistrer les données</button>
      </div>
    </motion.div>
  );
}

function FollowUpPlanner({ projectId, chickCount, startDate }: { projectId: string; chickCount: number; startDate: string }) {
  const [tasks, setTasks] = useState<MaintenanceTask[]>(() => {
    const saved = localStorage.getItem(`poultry_tasks_${projectId}`);
    return saved ? JSON.parse(saved) : [];
  });

  const ageDays = differenceInDays(new Date(), new Date(startDate)) + 1;

  const proposedSchedule = useMemo(() => [
    { title: 'Distribution Aliment et Eau (Matin)', type: 'feeding', frequency: 'daily', time: '08:00' },
    { title: 'Distribution Aliment et Eau (Midi)', type: 'feeding', frequency: 'daily', time: '14:00' },
    { title: 'Distribution Aliment et Eau (Soir)', type: 'feeding', frequency: 'daily', time: '18:00' },
    { title: 'Inspection et Santé', type: 'feeding', frequency: 'daily', time: '09:00' },
    { title: 'Pesée Hebdomadaire', type: 'vaccination', frequency: 'weekly', day: 'Monday' },
    { title: 'Nettoyage et Désinfection', type: 'cleaning', frequency: 'weekly', day: 'Saturday' },
    { title: 'Vaccin New Castle (Rappel)', type: 'vaccination', frequency: 'custom', dayOffset: 21 },
    { title: 'Vaccin Gumboro (Rappel)', type: 'vaccination', frequency: 'custom', dayOffset: 28 },
  ], []);

  const generateTasks = () => {
    const newTasks: MaintenanceTask[] = proposedSchedule.map(s => ({
      id: crypto.randomUUID(),
      projectId,
      title: s.title,
      type: s.type as any,
      frequency: s.frequency as any,
      nextScheduledAt: new Date().toISOString(),
      isDone: false
    }));
    setTasks(newTasks);
    localStorage.setItem(`poultry_tasks_${projectId}`, JSON.stringify(newTasks));
    toast.success("Planning de suivi généré avec succès ! Les rappels sont activés.");
  };

  const toggleTask = (id: string) => {
    const updated = tasks.map(t => t.id === id ? { ...t, isDone: !t.isDone } : t);
    setTasks(updated);
    localStorage.setItem(`poultry_tasks_${projectId}`, JSON.stringify(updated));
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="card p-8 bg-slate-900 text-white relative overflow-hidden">
        <div className="relative z-10 max-w-xl">
          <h2 className="text-3xl font-black mb-2 tracking-tight">Planning de Suivi Intelligent</h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Optimisez votre production avec une fréquence de suivi rigoureuse. 
            Smart Poultry vous propose un calendrier adapté à l'âge de vos sujets (Jour {ageDays}).
          </p>
          <button 
            onClick={generateTasks}
            className="mt-6 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-red-600/20"
          >
            ACTIVER LE PLANNING PROPOSÉ
          </button>
        </div>
        <Calendar size={180} className="absolute -right-10 -bottom-10 opacity-10 text-white rotate-12" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="card p-8">
          <div className="flex items-center justify-between mb-8">
            <h4 className="font-bold font-display text-slate-800 uppercase tracking-widest text-xs">Phases de Fréquence</h4>
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-black uppercase">Recommandé</span>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-xs font-bold text-slate-800 mb-2">Suivi Quotidien (3x/jour)</p>
              <p className="text-xs text-slate-500 leading-relaxed italic">Vérification de l'eau et de l'aliment à 8h, 14h et 18h. Une inspection visuelle de la santé doit être faite chaque matin.</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-xs font-bold text-slate-800 mb-2">Suivi Hebdomadaire</p>
              <p className="text-xs text-slate-500 leading-relaxed italic">Pesée d'un échantillon (5%) chaque lundi pour suivre la courbe de poids. Nettoyage complet du poulailler chaque samedi.</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-xs font-bold text-slate-800 mb-2">Suivi Sanitaire</p>
              <p className="text-xs text-slate-500 leading-relaxed italic">Vaccinations programmées selon le calendrier vaccinal standard (J7, J14, J21, J28).</p>
            </div>
          </div>
        </div>

        <div className="card p-8">
          <div className="flex items-center justify-between mb-8">
            <h4 className="font-bold font-display text-slate-800 uppercase tracking-widest text-xs">Tâches et Rappels</h4>
            <div className="flex items-center gap-2">
               <Bell size={14} className="text-red-500" />
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Notification push active</span>
            </div>
          </div>

          {tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 mb-4">
                <ClipboardCheck size={32} />
              </div>
              <p className="text-sm text-slate-400 italic">Aucune tâche planifiée. Activez le planning proposé pour commencer.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map(task => (
                <div 
                  key={task.id}
                  onClick={() => toggleTask(task.id)}
                  className={cn(
                    "p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all",
                    task.isDone ? "bg-slate-50 border-slate-100 opacity-60" : "bg-white border-slate-200 hover:border-red-300"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-5 h-5 rounded flex items-center justify-center border transition-all",
                      task.isDone ? "bg-red-600 border-red-600 text-white" : "border-slate-300"
                    )}>
                      {task.isDone && <CheckCircle2 size={12} />}
                    </div>
                    <div>
                      <p className={cn("text-xs font-bold", task.isDone ? "text-slate-400 line-through" : "text-slate-700")}>{task.title}</p>
                      <p className="text-[10px] text-slate-400 uppercase font-medium">{task.frequency === 'daily' ? 'Quotidien' : task.frequency === 'weekly' ? 'Hebdomadaire' : 'Ponctuel'}</p>
                    </div>
                  </div>
                  {!task.isDone && <Bell size={12} className="text-red-400 animate-pulse" />}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** AI Health Assistant Tool */
function AIDetector() {
  const [image, setImage] = useState<string | null>(null);
  const [observations, setObservations] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalysis = async () => {
    if (!image && !observations.trim()) return;
    setAnalyzing(true);
    try {
      const genAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
      
      const prompt = `En tant qu'expert vétérinaire avicole spécialisé dans l'élevage africain (poulets locaux et chair), analyse la situation suivante. 
      Observations du client: "${observations}"
      ${image ? "Une image est fournie pour examen des symptômes ou fientes." : "Pas d'image fournie (uniquement observations textuelles)."}
      
      Renvoie une réponse structurée au format JSON (sans texte avant ou après) contenant:
      - "diagnosis": Ton diagnostic principal précis
      - "confidence": Un score entre 0 et 1 (décimal)
      - "recommendations": Une liste de mesures immédiates (isolement, désinfection, etc.)
      - "medications": Une liste de traitements locaux ou vétérinaires possibles
      - "urgency": 'Faible', 'Moyenne', 'Haute' ou 'Critique'`;

      const parts: any[] = [{ text: prompt }];
      if (image) {
        parts.push({
          inlineData: {
            mimeType: "image/png",
            data: image.split(',')[1]
          }
        });
      }

      const response = await genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ parts }],
        config: { responseMimeType: "application/json" }
      });

      const data = JSON.parse(response.text || '{}');
      setResult(data);
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de l'analyse IA. Vérifiez votre connexion.");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="h-full max-w-4xl mx-auto flex flex-col gap-8">
      <div className="flex flex-col bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden min-h-[600px]">
        {/* Chat Header */}
        <div className="p-6 bg-red-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <ScanSearch size={24} />
            </div>
            <div>
              <h3 className="font-bold">Assistant Santé Avicole IA</h3>
              <p className="text-[10px] opacity-80 uppercase tracking-widest font-black">Diagnostic Immédiat</p>
            </div>
          </div>
          {result && (
            <button onClick={() => {setResult(null); setImage(null); setObservations('');}} className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition-colors font-bold">Nouveau Diagnostic</button>
          )}
        </div>

        {/* Chat Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30">
          {!result && !analyzing && (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-20">
              <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center shadow-inner">
                <MessageSquare size={40} />
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-800">Décrivez le problème</h4>
                <p className="text-sm text-slate-500 max-w-xs mx-auto">Ajoutez une photo des symptômes ou rédigez vos observations pour obtenir un diagnostic instantané.</p>
              </div>
            </div>
          )}

          {analyzing && (
            <div className="flex flex-col items-center justify-center h-full space-y-4 py-20">
              <Loader2 className="w-12 h-12 text-red-600 animate-spin" />
              <p className="text-sm font-bold text-slate-400 animate-pulse uppercase tracking-widest">Analyse vétérinaire en cours...</p>
            </div>
          )}

          {result && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
               <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden">
                <div className={cn(
                  "absolute top-0 left-0 w-2 h-full",
                  result.urgency === 'Critique' || result.urgency === 'Haute' ? "bg-red-500" : "bg-amber-500"
                )}></div>
                
                <div className="flex flex-col md:flex-row justify-between items-start mb-8 gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn(
                        "text-[10px] font-black uppercase px-2 py-0.5 rounded",
                        result.urgency === 'Critique' || result.urgency === 'Haute' ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600"
                      )}>
                        Urgence: {result.urgency}
                      </span>
                    </div>
                    <h4 className="text-3xl font-black text-slate-800 tracking-tight leading-none">{result.diagnosis}</h4>
                  </div>
                  <div className="text-left md:text-right p-4 bg-slate-50 rounded-2xl border border-slate-100 min-w-[120px]">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Confiance IA</p>
                    <p className="text-3xl font-black text-red-600">{(result.confidence * 100).toFixed(0)}%</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-slate-100">
                  <div className="space-y-4">
                    <h5 className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-widest">
                      <CheckCircle2 size={16} className="text-red-500" /> Mesures immédiates
                    </h5>
                    <ul className="space-y-2">
                       {result.recommendations?.map((rec: string, i: number) => (
                         <li key={i} className="flex items-start gap-3 p-3 bg-red-50/30 rounded-xl text-sm font-medium text-slate-700">
                           <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                           {rec}
                         </li>
                       ))}
                    </ul>
                  </div>

                  <div className="space-y-4">
                    <h5 className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-widest">
                      <FileText size={16} className="text-red-500" /> Traitements suggérés
                    </h5>
                    <div className="flex flex-wrap gap-2">
                      {result.medications?.map((med: string, i: number) => (
                        <span key={i} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase">{med}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Chat Input Area */}
        {!result && !analyzing && (
          <div className="p-6 bg-white border-t border-slate-100">
            <div className="flex flex-col gap-4">
              <div className="flex gap-4">
                <div className="relative group shrink-0">
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                  <div className={cn(
                    "w-20 h-20 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-all overflow-hidden",
                    image ? "border-red-500 bg-red-50 text-red-500" : "border-slate-300 text-slate-400 group-hover:border-red-400"
                  )}>
                    {image ? (
                      <img src={image} className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center justify-center">
                        <Camera size={24} />
                        <span className="text-[8px] font-bold mt-1 uppercase tracking-tighter">Photo</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex-1 relative">
                  <textarea 
                    placeholder="Quels sont les symptômes ? (ex: fientes liquides, sujets prostrés, yeux gonflés...)"
                    className="w-full h-20 p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-red-500 focus:outline-none resize-none text-sm font-medium pr-12"
                    value={observations}
                    onChange={e => setObservations(e.target.value)}
                  />
                </div>
              </div>

              <button 
                onClick={handleAnalysis}
                disabled={!image && !observations.trim()}
                className="w-full py-4 bg-red-600 text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-red-700 disabled:bg-slate-200 disabled:text-slate-400 transition-all shadow-lg shadow-red-600/20 active:scale-[0.98]"
              >
                OBTENIR UN DIAGNOSTIC <Send size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-10">
        <div className="card p-6 border-l-4 border-l-amber-500">
          <h5 className="text-xs font-black uppercase text-amber-600 mb-2">Note Importante</h5>
          <p className="text-sm text-slate-600 font-medium">L'IA est un outil d'aide à la décision. En cas de mortalité suspecte ou massive, contactez immédiatement un vétérinaire agréé.</p>
        </div>
        <div className="card p-6 border-l-4 border-l-slate-400">
          <h5 className="text-xs font-black uppercase text-slate-500 mb-2">Historique</h5>
          <p className="text-sm text-slate-400 font-medium italic">Votre historique d'analyses apparaîtra ici après vos premiers diagnostics enregistrés.</p>
        </div>
      </div>
    </div>
  );
}

function AuthScreen({ onLogin }: { onLogin: (user: User) => void }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  // Seed demo data
  useEffect(() => {
    const existingUsers = JSON.parse(localStorage.getItem('poultry_users') || '[]');
    if (existingUsers.length === 0) {
      const demoUser: User = {
        id: 'demo-admin-id',
        name: 'Admin Demo',
        email: 'admin@smart.com',
        password: 'admin123',
        role: 'admin'
      };
      localStorage.setItem('poultry_users', JSON.stringify([demoUser]));

      // Seed a demo project too
      const demoProject: Project = {
        id: 'demo-project-id',
        name: 'Élevage Témoin - Chair',
        type: 'Chair',
        chickCount: 500,
        startDate: format(addDays(new Date(), -24), 'yyyy-MM-dd'),
        breed: 'ISA Brown',
        origin: 'Couvoir National',
        purchasePrice: 1.5,
        budget: 1500,
        foodCost: 200,
        medsCost: 50,
        ageInDaysAtStart: 1,
        selectedFeedingStrategy: 'ideal',
        status: 'active'
      };
      localStorage.setItem('poultry_projects', JSON.stringify([demoProject]));
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isLogin) {
      const users = JSON.parse(localStorage.getItem('poultry_users') || '[]');
      const found = users.find((u: any) => u.email === email && u.password === password);
      if (found) {
        localStorage.setItem('poultry_user', JSON.stringify(found));
        onLogin(found);
      } else {
        setError('Email ou mot de passe incorrect.');
      }
    } else {
      const users = JSON.parse(localStorage.getItem('poultry_users') || '[]');
      if (users.find((u: any) => u.email === email)) {
        setError('Cet email est déjà utilisé.');
        return;
      }
      const newUser: User = {
        id: crypto.randomUUID(),
        name,
        email,
        password,
        role: 'user'
      };
      localStorage.setItem('poultry_users', JSON.stringify([...users, newUser]));
      localStorage.setItem('poultry_user', JSON.stringify(newUser));
      onLogin(newUser);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Rooster-themed Background */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&q=80&w=1600" 
          alt="Rooster Background" 
          className="w-full h-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card w-full max-w-md p-8 pt-12 relative z-10 bg-white/95 backdrop-blur-md border-none shadow-2xl"
      >
        <div className="absolute top-0 left-0 w-full h-2 bg-red-600"></div>
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center text-white font-bold text-3xl shadow-lg shadow-red-600/40 mb-4 overflow-hidden">
            <img src="https://images.unsplash.com/photo-1594910419293-1961448eb0f0?auto=format&fit=crop&q=80&w=200" alt="Rooster" className="w-full h-full object-cover" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Smart Poultry Manager</h2>
          <p className="text-slate-400 text-sm font-medium uppercase tracking-widest mt-1">
            {isLogin ? 'Connexion Alpha' : 'Inscription'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="space-y-1">
              <label className="stat-label">Nom complet</label>
              <div className="relative">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  required 
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none text-sm transition-all"
                  placeholder="Jean Dupont"
                />
              </div>
            </div>
          )}
          <div className="space-y-1">
            <label className="stat-label">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="email" 
                required 
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none text-sm transition-all"
                placeholder="email@exemple.com"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="stat-label">Mot de passe</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="password" 
                required 
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none text-sm transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && <p className="text-xs font-bold text-rose-500 bg-rose-50 p-3 rounded-lg border border-rose-100">{error}</p>}

          <button type="submit" className="btn-primary w-full py-4 mt-2 shadow-xl shadow-red-600/20">
            {isLogin ? 'SE CONNECTER' : "S'INSCRIRE"}
          </button>
        </form>

        <div className="mt-8 text-center" id="auth-toggle">
          {isLogin && (
            <div className="mb-6 p-4 bg-red-50 rounded-xl border border-red-100 text-left">
              <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-1">Compte Démo</p>
              <p className="text-xs text-red-800 font-medium">Email: <span className="font-bold text-red-950 underline underline-offset-2">admin@smart.com</span></p>
              <p className="text-xs text-red-800 font-medium">Pass: <span className="font-bold text-red-950">admin123</span></p>
            </div>
          )}
          <button 
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm font-bold text-slate-500 hover:text-red-600 transition-colors"
          >
            {isLogin ? "Pas encore de compte ? S'inscrire" : "Déjà un compte ? Se connecter"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
