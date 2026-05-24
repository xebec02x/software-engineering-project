import React, { useState, useEffect } from 'react';
import {
  Shield, UserCheck, DollarSign, Activity, Trash2, Plus, RefreshCw, Settings, Search, AlertCircle, X
} from 'lucide-react';
import { User, SysNotification } from '../types';

interface AdminDashboardProps {
  user: User;
  onAddNotification: (title: string, msg: string) => void;
}

export default function AdminDashboard({ user, onAddNotification }: AdminDashboardProps) {
  // Navigation tabs of Admin
  const [activeSubTab, setActiveSubTab] = useState<'metrics' | 'roster' | 'payments'>('metrics');

  const [metrics, setMetrics] = useState<any>({
    activeMembers: 0,
    totalTrainers: 0,
    monthlyCheckins: 0,
    aggregateRevenue: 0,
    recentPayments: [],
    recentNotifications: []
  });

  const [usersList, setUsersList] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Account creation state
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [userForm, setUserForm] = useState({
    name: '', email: '', role: 'Member', gender: 'Female', age: '25', height: '172', weight: '65', fitnessGoal: 'muscle-building'
  });

  useEffect(() => {
    fetchAdminDatasets();
  }, []);

  const fetchAdminDatasets = async () => {
    try {
      // Metrics aggregate
      const resM = await fetch('/api/admin/metrics');
      if (resM.ok) setMetrics(await resM.json());

      // Global User directory
      const resU = await fetch('/api/admin/users');
      if (resU.ok) setUsersList(await resU.json());
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForm.name || !userForm.email) return;

    try {
      // Step 1: Create authentication user
      const resU = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: userForm.name,
          email: userForm.email,
          role: userForm.role
        })
      });
      if (resU.ok) {
        const newUserObj = await resU.json();

        // Step 2: Create matching member parameters if role is Member
        if (userForm.role === 'Member') {
          await fetch('/api/admin/members', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: newUserObj.id,
              name: userForm.name,
              email: userForm.email,
              gender: userForm.gender,
              age: parseInt(userForm.age) || 28,
              height: parseInt(userForm.height) || 180,
              weight: parseInt(userForm.weight) || 75,
              fitnessGoal: userForm.fitnessGoal
            })
          });
          onAddNotification("Member Created", `Standard member profile configured for ${userForm.name}.`);
        } else if (userForm.role === 'Trainer') {
          // Create matching Trainer records
          await fetch('/api/admin/trainers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: newUserObj.id,
              name: userForm.name,
              email: userForm.email
            })
          });
          onAddNotification("Trainer Enlisted", `Professional biography bounds set for Coach ${userForm.name}.`);
        }

        setShowAddUserModal(false);
        setUserForm({
          name: '', email: '', role: 'Member', gender: 'Female', age: '25', height: '172', weight: '65', fitnessGoal: 'muscle-building'
        });
        await fetchAdminDatasets();
        alert("Account registered and synchronized successfully!");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteUserAccount = async (uId: string) => {
    if (!confirm("Are you sure you want to terminate this account? This breaks related tables.")) return;
    try {
      const res = await fetch(`/api/admin/users/${uId}`, { method: 'DELETE' });
      if (res.ok) {
        onAddNotification("Account Terminated", "Purged authentication session of user ID successfully.");
        await fetchAdminDatasets();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 text-white">
      {/* Sub navigation selection */}
      <div className="flex border-b border-white/10 pb-1 overflow-x-auto gap-4 scrollbar-none">
        {[
          { id: 'metrics', name: 'Strategic Performance Metrics' },
          { id: 'roster', name: 'Identity Directory' },
          { id: 'payments', name: 'Financial Revenue Ledger' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`pb-3 font-semibold text-xs md:text-sm uppercase tracking-widest relative whitespace-nowrap transition-colors ${
              activeSubTab === tab.id ? 'text-[#C8FF00]' : 'text-white/40 hover:text-white'
            }`}
          >
            {tab.name}
            {activeSubTab === tab.id && (
              <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#C8FF00]"></span>
            )}
          </button>
        ))}
      </div>

      {/* METRICS DASHBOARD VIEW */}
      {activeSubTab === 'metrics' && (
        <div className="space-y-8">
          {/* Key Aggregate Bento parameters cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-[#0C0C0E] border border-white/10 rounded-2xl p-6 space-y-3">
              <div className="flex justify-between items-center text-white/40">
                <span className="text-[10px] uppercase font-black tracking-widest">Active Members</span>
                <UserCheck className="w-4 h-4 text-[#C8FF00]" />
              </div>
              <h3 className="text-3xl font-black">{metrics.activeMembers || 0}</h3>
              <p className="text-[10px] text-white/40 font-mono">100% compliant monthly accounts</p>
            </div>

            <div className="bg-[#0C0C0E] border border-white/10 rounded-2xl p-6 space-y-3">
              <div className="flex justify-between items-center text-white/40">
                <span className="text-[10px] uppercase font-black tracking-widest">Aggregate Revenue</span>
                <DollarSign className="w-4 h-4 text-[#00E5FF]" />
              </div>
              <h3 className="text-3xl font-black text-[#00E5FF] font-mono">${metrics.aggregateRevenue || 0}.00</h3>
              <p className="text-[10px] text-white/40">Aggregated StriveAI membership fees</p>
            </div>

            <div className="bg-[#0C0C0E] border border-white/10 rounded-2xl p-6 space-y-3">
              <div className="flex justify-between items-center text-white/40">
                <span className="text-[10px] uppercase font-black tracking-widest">Active Gym Coaches</span>
                <Shield className="w-4 h-4 text-[#C5A3FF]" />
              </div>
              <h3 className="text-3xl font-black">{metrics.totalTrainers || 0}</h3>
              <p className="text-[10px] text-white/40 font-mono">Sarah Miller & coach Bob roster</p>
            </div>

            <div className="bg-[#0C0C0E] border border-white/10 rounded-2xl p-6 space-y-3">
              <div className="flex justify-between items-center text-white/40">
                <span className="text-[10px] uppercase font-black tracking-widest">Daily Check-ins</span>
                <Activity className="w-4 h-4 text-orange-400" />
              </div>
              <h3 className="text-3xl font-black font-mono">{metrics.monthlyCheckins || 0}</h3>
              <p className="text-[10px] text-white/40">Attendance records today</p>
            </div>
          </div>

          {/* Sub visual notifications logs */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-6 bg-[#0C0C0E] border border-white/10 rounded-3xl p-6 space-y-4">
              <h4 className="text-sm font-bold uppercase tracking-wider text-[#C8FF00]">System Activity Logs</h4>
              <p className="text-xs text-white/40">Real-time alerts published across standard gym gateways</p>

              <div className="divide-y divide-white/5 space-y-3.5 max-h-[250px] overflow-y-auto pr-1">
                {(metrics.recentNotifications || []).map((not: any) => (
                  <div key={not.id} className="pt-3.5 first:pt-0 flex items-start gap-3 text-xs">
                    <AlertCircle className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-white/90">{not.title}</p>
                      <p className="text-[11px] text-white/40 leading-relaxed mt-0.5">{not.message}</p>
                      <span className="text-[9px] text-white/20 font-mono">{not.createdAt}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick overview metrics guidelines */}
            <div className="lg:col-span-6 bg-[#0C0C0E] border border-white/10 rounded-3xl p-6 space-y-4 flex flex-col justify-between">
              <div>
                <h4 className="text-sm font-bold uppercase tracking-wider text-[#C8FF00]">Security policy & permissions</h4>
                <p className="text-xs text-white/50 leading-relaxed mt-1">
                  StriveAI operates role-based security configurations. Standard members cannot execute administrative billing adjustments or check diet tables of other accounts. All database assets sit comfortably on secure Node sandboxes with 256-bit encryption mock standards.
                </p>
              </div>

              <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl text-xs flex justify-between items-center">
                <div>
                  <p className="font-bold">System Status: Active</p>
                  <p className="text-[10px] text-white/30">Vite + Express routing secure</p>
                </div>
                <button
                  onClick={fetchAdminDatasets}
                  className="p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-[#C8FF00]/10 text-white hover:text-[#C8FF00]"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* IDENTITY ROSTER TABLE */}
      {activeSubTab === 'roster' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="text-2xl font-black uppercase tracking-tight">Identity Directory</h3>
              <p className="text-xs text-white/40">Review, add or dismiss gym user roles</p>
            </div>

            <div className="flex gap-3">
              <div className="relative flex items-center font-sans">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Query names or emails..."
                  className="bg-[#0C0C0E] border border-white/10 rounded-xl py-2 pl-9 pr-3 text-xs focus:outline-none focus:border-[#C8FF00]"
                />
                <Search className="w-3.5 h-3.5 absolute left-3 text-white/40" />
              </div>

              <button
                onClick={() => setShowAddUserModal(true)}
                className="px-4 py-2 bg-[#C8FF00] text-black font-black text-xs uppercase tracking-wider rounded-xl flex items-center gap-2 transition"
              >
                <Plus className="w-4 h-4" /> Create Account
              </button>
            </div>
          </div>

          {/* User Data Roster Grid */}
          <div className="bg-[#0C0C0E] border border-white/10 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-white/5 bg-white/[0.02] grid grid-cols-12 text-[10px] text-white/40 uppercase tracking-widest font-black">
              <div className="col-span-5">Name & Email</div>
              <div className="col-span-3">Role Status</div>
              <div className="col-span-3">Date Joined</div>
              <div className="col-span-1 text-center">Action</div>
            </div>

            <div className="divide-y divide-white/5 text-xs">
              {usersList
                .filter(u => u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((userItem) => (
                  <div key={userItem.id} className="p-4 grid grid-cols-12 items-center hover:bg-white/[0.01]">
                    <div className="col-span-5 font-semibold">
                      <p className="text-white font-bold">{userItem.name}</p>
                      <p className="text-[10px] text-white/40 mt-0.5">{userItem.email}</p>
                    </div>
                    <div className="col-span-3">
                      <span className={`px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide rounded-full ${
                        userItem.role === 'Admin'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : userItem.role === 'Trainer'
                          ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                          : 'bg-[#C8FF00]/10 text-[#C8FF00] border border-[#C8FF00]/20'
                      }`}>
                        {userItem.role}
                      </span>
                    </div>
                    <div className="col-span-3 font-mono text-zinc-400">{userItem.createdAt.slice(0,10)}</div>
                    <div className="col-span-1 text-center">
                      <button
                        onClick={() => handleDeleteUserAccount(userItem.id)}
                        disabled={userItem.id === user.id} // cannot delete self
                        className="text-red-400 hover:text-red-300 disabled:opacity-30 p-1"
                        title="Dismiss User"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* REVENUE PAYMENTS HISTORY */}
      {activeSubTab === 'payments' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-2xl font-black uppercase tracking-tight">Financial ledger</h3>
            <p className="text-xs text-white/40 font-mono">Bypass billing logs of linked subscriptions</p>
          </div>

          <div className="bg-[#0C0C0E] border border-white/10 rounded-2xl overflow-hidden pr-3">
            <div className="p-4 border-b border-white/5 bg-white/[0.02] grid grid-cols-12 text-[10px] text-white/40 uppercase tracking-widest font-black">
              <div className="col-span-5">Linked Package tier</div>
              <div className="col-span-3 text-center">Checkout date</div>
              <div className="col-span-2 text-center">Provider</div>
              <div className="col-span-2 text-right">Aggregate Amount</div>
            </div>

            <div className="divide-y divide-white/5 text-xs max-h-[400px] overflow-y-auto">
              {(metrics.recentPayments || []).map((pay: any) => (
                <div key={pay.id} className="p-4 grid grid-cols-12 items-center hover:bg-white/[0.01]">
                  <div className="col-span-5 font-bold">
                    <p className="text-white">{pay.planName}</p>
                    <p className="text-[10px] text-white/40 font-mono mt-0.5">Reference key ID: {pay.id}</p>
                  </div>
                  <div className="col-span-3 text-center font-mono text-zinc-400">{pay.date}</div>
                  <div className="col-span-2 text-center font-mono">
                    <span className="text-[10.5px] uppercase bg-black/40 px-2 py-0.5 border border-white/5 rounded-md">{pay.method}</span>
                  </div>
                  <div className="col-span-2 text-right font-mono font-bold text-[#00E5FF]">${pay.amount}.00</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}


      {/* CREATION AUTH USER FORM LIGHTBOX */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0C0C0E] border border-white/10 w-full max-w-lg rounded-[28px] overflow-hidden">
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#C8FF00]" />
                <h4 className="text-xs font-bold font-sans text-white uppercase tracking-wider">Configure new Gym Roster account</h4>
              </div>
              <button onClick={() => setShowAddUserModal(false)} className="text-white/40 hover:text-white"><X className="w-4 h-4" /></button>
            </div>

            <form onSubmit={handleCreateAccount} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[9px] uppercase font-bold text-zinc-400">Human full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jack Henderson"
                  value={userForm.name}
                  onChange={(e) => setUserForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#C8FF00]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] uppercase font-bold text-zinc-400">Electronic Mail address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. jack@strive.com"
                  value={userForm.email}
                  onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] uppercase font-bold text-zinc-400">Associated Gym Role</label>
                  <select
                    value={userForm.role}
                    onChange={(e) => setUserForm(prev => ({ ...prev, role: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs focus:outline-none"
                  >
                    <option value="Member">Member User</option>
                    <option value="Trainer">Trainer Coach</option>
                    <option value="Admin">Gym Administrator</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] uppercase font-bold text-zinc-400">Gender Identity</label>
                  <select
                    value={userForm.gender}
                    onChange={(e) => setUserForm(prev => ({ ...prev, gender: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs focus:outline-none"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Alternative">Other</option>
                  </select>
                </div>
              </div>

              {userForm.role === 'Member' && (
                <div className="border-t border-white/5 pt-4 space-y-4">
                  <span className="text-[9px] uppercase font-black text-[#C8FF00] tracking-widest block">Physical Body Configuration</span>
                  
                  <div className="grid grid-cols-3 gap-2 text-xs font-mono text-center">
                    <div className="space-y-1">
                      <label className="text-[8px] uppercase text-zinc-500 font-sans">Age</label>
                      <input
                        type="number"
                        value={userForm.age}
                        onChange={(e) => setUserForm(prev => ({ ...prev, age: e.target.value }))}
                        className="w-full bg-white/5 border border-white/10 rounded-lg p-2 focus:outline-none text-center"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] uppercase text-zinc-500 font-sans">Height (cm)</label>
                      <input
                        type="number"
                        value={userForm.height}
                        onChange={(e) => setUserForm(prev => ({ ...prev, height: e.target.value }))}
                        className="w-full bg-white/5 border border-white/10 rounded-lg p-2 focus:outline-none text-center"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] uppercase text-zinc-500 font-sans">Weight (kg)</label>
                      <input
                        type="number"
                        value={userForm.weight}
                        onChange={(e) => setUserForm(prev => ({ ...prev, weight: e.target.value }))}
                        className="w-full bg-white/5 border border-white/10 rounded-lg p-2 focus:outline-none text-center"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] uppercase font-bold text-zinc-400">Gym Program Objective</label>
                    <select
                      value={userForm.fitnessGoal}
                      onChange={(e) => setUserForm(prev => ({ ...prev, fitnessGoal: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs focus:outline-none"
                    >
                      <option value="muscle-building">Hypertrophy (Muscle Building)</option>
                      <option value="fat-loss">Direct Lipolysis (Fat Loss)</option>
                      <option value="cardio-conditioning">Endurance & Cardio Tone</option>
                      <option value="powerlifting-strength">Pure Postural Powerlifting</option>
                    </select>
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-[#C8FF00] hover:bg-[#B3E500] text-black text-xs font-black uppercase tracking-wider rounded-xl transition duration-150 mt-4"
              >
                Register and sync to database
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
