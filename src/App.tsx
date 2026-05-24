import React, { useState, useEffect } from 'react';
import {
  Sparkles, Bell, User, Lock, Shuffle, LogOut, Sun, Moon, Info, CheckSquare, Dumbbell, ShieldAlert, Heart
} from 'lucide-react';
import { User as UserType, Member, Trainer, SysNotification } from './types';
import AIWidget from './components/AIWidget';
import MemberDashboard from './components/MemberDashboard';
import TrainerDashboard from './components/TrainerDashboard';
import AdminDashboard from './components/AdminDashboard';
import Login from './components/Login';

export default function App() {
  // Global App States
  const [sessionUser, setSessionUser] = useState<UserType | null>(() => {
    try {
      const saved = localStorage.getItem('strive_session_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [sessionMemberObj, setSessionMemberObj] = useState<Member | null>(() => {
    try {
      const saved = localStorage.getItem('strive_session_member');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [sessionTrainerObj, setSessionTrainerObj] = useState<Trainer | null>(() => {
    try {
      const saved = localStorage.getItem('strive_session_trainer');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Lists loaded from backend
  const [allUsers, setAllUsers] = useState<UserType[]>([]);
  const [notifications, setNotifications] = useState<SysNotification[]>([]);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);

  // Theme support: Default premium dark mode of StriveAI, toggleable to a pristine light mode variant
  const [isLightMode, setIsLightMode] = useState(false);

  // Load baseline values on startup
  useEffect(() => {
    fetchGlobalDirectory();
  }, []);

  // Sync notifications on user session changes
  useEffect(() => {
    if (sessionUser) {
      fetch(`/api/notifications/${sessionUser.id}`)
        .then(res => res.ok ? res.json() : [])
        .then(data => setNotifications(data))
        .catch(err => console.error("Could not sync notifications", err));
    }
  }, [sessionUser]);

  const fetchGlobalDirectory = async () => {
    try {
      // Fetch users
      const resU = await fetch('/api/admin/users');
      if (resU.ok) {
        const users = await resU.json();
        setAllUsers(users);
      }
    } catch (e) {
      console.error("Baseline loading failed", e);
    }
  };

  const handleLoginSuccess = (userObj: UserType, memberObj: Member | null, trainerObj: Trainer | null) => {
    setSessionUser(userObj);
    setSessionMemberObj(memberObj);
    setSessionTrainerObj(trainerObj);
    localStorage.setItem('strive_session_user', JSON.stringify(userObj));
    if (memberObj) {
      localStorage.setItem('strive_session_member', JSON.stringify(memberObj));
    } else {
      localStorage.removeItem('strive_session_member');
    }
    if (trainerObj) {
      localStorage.setItem('strive_session_trainer', JSON.stringify(trainerObj));
    } else {
      localStorage.removeItem('strive_session_trainer');
    }
  };

  const handleLogout = () => {
    setSessionUser(null);
    setSessionMemberObj(null);
    setSessionTrainerObj(null);
    localStorage.removeItem('strive_session_user');
    localStorage.removeItem('strive_session_member');
    localStorage.removeItem('strive_session_trainer');
    setShowNotificationDropdown(false);
  };

  const initializeSessionContext = async (userObj: UserType) => {
    setSessionUser(userObj);
    setSessionMemberObj(null);
    setSessionTrainerObj(null);
    localStorage.setItem('strive_session_user', JSON.stringify(userObj));

    try {
      // Load notifications for user
      const resN = await fetch(`/api/notifications/${userObj.id}`);
      if (resN.ok) setNotifications(await resN.json());

      // If user is Member, load member detail object
      if (userObj.role === 'Member') {
        const resMem = await fetch('/api/admin/metrics');
        if (resMem.ok) {
          const metrics = await resMem.json();
          // Find standard member
          const resMembers = await fetch('/api/admin/users'); // fallback or similar
          // Let's resolve the actual matching database element
          const resFullMembers = await fetch('/api/trainer/members/trn-1'); // Sarah Miller's list
          if (resFullMembers.ok) {
            const list = await resFullMembers.json();
            const matchingMember = list.find((item: Member) => item.userId === userObj.id);
            if (matchingMember) {
              setSessionMemberObj(matchingMember);
              localStorage.setItem('strive_session_member', JSON.stringify(matchingMember));
            } else {
              // Create virtual member placeholder if created on-the-fly
              const backupMember = {
                id: `mem-${userObj.id}`,
                userId: userObj.id,
                name: userObj.name,
                email: userObj.email,
                avatar: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=200',
                gender: 'Alternative',
                age: 26, height: 180, weight: 78, fitnessGoal: 'muscle-building', activityLevel: 'moderately-active', bmi: 24.1,
                membershipType: 'Standard Monthly', membershipStatus: 'Active', membershipExpiry: '2026-12-31', trainerId: 'trn-1'
              };
              setSessionMemberObj(backupMember);
              localStorage.setItem('strive_session_member', JSON.stringify(backupMember));
            }
          }
        }
      } 
      // If user is Trainer, load trainer detail object
      else if (userObj.role === 'Trainer') {
        if (userObj.email === 'trainer@gym.com') {
          const tObj = {
            id: 'trn-1',
            userId: userObj.id,
            name: userObj.name,
            email: userObj.email,
            avatar: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=200',
            specialties: ['Bodybuilding', 'Custom Nutrition Styling'], rating: 4.9, biography: 'Certified Master Personal Trainer', memberIds: ['mem-1']
          };
          setSessionTrainerObj(tObj);
          localStorage.setItem('strive_session_trainer', JSON.stringify(tObj));
        } else {
          const tObj = {
            id: 'trn-2',
            userId: userObj.id,
            name: userObj.name,
            email: userObj.email,
            avatar: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?q=80&w=200',
            specialties: ['Powerlifting', 'Injury Rehabilitation'], rating: 4.8, biography: 'Elite powerlifter', memberIds: []
          };
          setSessionTrainerObj(tObj);
          localStorage.setItem('strive_session_trainer', JSON.stringify(tObj));
        }
      }
    } catch (e) {
      console.error("Context mapping failed", e);
    }
  };

  const handleRoleTransition = (userId: string) => {
    const userToSwitch = allUsers.find(u => u.id === userId);
    if (userToSwitch) {
      initializeSessionContext(userToSwitch);
      setShowNotificationDropdown(false);
    }
  };

  // Helper inside workspace to push temporary live alerts
  const handleAddNewLiveNotificationAtRuntime = async (title: string, message: string) => {
    if (!sessionUser) return;
    try {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: sessionUser.id, title, message })
      });
      if (res.ok) {
        const updatedList = await fetch(`/api/notifications/${sessionUser.id}`);
        if (updatedList.ok) setNotifications(await updatedList.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleClearNotifications = async () => {
    if (!sessionUser) return;
    try {
      await fetch(`/api/notifications/clear/${sessionUser.id}`, { method: 'POST' });
      setNotifications([]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRefreshMemberProfileData = async () => {
    if (sessionUser) {
      initializeSessionContext(sessionUser);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-200 ${
      isLightMode ? 'bg-[#F4F4F5] text-[#18181B]' : 'bg-[#09090B] text-[#FAFAFA]'
    }`}>
      {/* Main Brand Header Panel */}
      <header className={`p-4 px-4 md:px-8 border-b flex items-center justify-between ${
        isLightMode ? 'bg-white border-zinc-200' : 'bg-[#0C0C0E] border-white/10'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#C8FF00] flex items-center justify-center shadow-lg shadow-[#C8FF00]/10">
            <Sparkles className="w-5 h-5 text-black" />
          </div>
          <div>
            <span className="text-[9px] tracking-widest text-[#C8FF00] font-black uppercase">Active Performance</span>
            <h1 className="text-lg font-black uppercase tracking-widest font-mono leading-none">strive.ai</h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Light-Dark Toggle control */}
          <button
            onClick={() => setIsLightMode(!isLightMode)}
            className={`p-2.5 rounded-xl border transition cursor-pointer ${
              isLightMode ? 'bg-zinc-100 border-zinc-200 text-black hover:bg-zinc-200' : 'bg-white/5 border-white/5 text-white/70 hover:bg-white/10'
            }`}
            title="Toggle contrast palettes"
          >
            {isLightMode ? <Moon className="w-4.5 h-4.5" /> : <Sun className="w-4.5 h-4.5 text-[#C8FF00]" />}
          </button>

          {/* Real-time notification Bell */}
          {sessionUser && (
            <div className="relative">
              <button
                onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
                className={`p-2.5 rounded-xl border relative transition cursor-pointer ${
                  isLightMode ? 'bg-zinc-100 border-zinc-200 text-black' : 'bg-white/5 border-white/5 text-white/80 hover:bg-white/10'
                }`}
              >
                <Bell className="w-4.5 h-4.5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-[10px] font-black font-mono text-white flex items-center justify-center rounded-full animate-bounce">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotificationDropdown && (
                <div className={`absolute right-0 mt-3 w-80 rounded-2xl p-4 border shadow-2xl z-50 ${
                  isLightMode ? 'bg-white border-zinc-200 text-zinc-800' : 'bg-[#0F0F12] border-white/10 text-white'
                }`}>
                  <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-3">
                    <span className="text-xs uppercase font-extrabold tracking-wider">Dynamic Alerts</span>
                    <button
                      onClick={handleClearNotifications}
                      className="text-[10px] text-[#C8FF00] uppercase font-bold hover:underline cursor-pointer"
                    >
                      Clear All
                    </button>
                  </div>

                  <div className="space-y-2.5 max-h-[220px] overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="text-[11px] text-white/35 py-6 text-center">No warnings or activities registered.</p>
                    ) : (
                      notifications.map((n) => (
                        <div key={n.id} className="text-xs space-y-0.5 font-sans">
                          <strong className="block font-bold text-left">{n.title}</strong>
                          <p className="text-[11px] text-white/50 leading-relaxed text-left">{n.message}</p>
                          <span className="text-[9px] text-white/20 font-mono block text-left mt-1">{new Date(n.createdAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Active logged user tag representation capsule */}
          {sessionUser ? (
            <>
              <div className={`hidden sm:flex items-center gap-3 p-1.5 pl-3 pr-4 rounded-xl border ${
                isLightMode ? 'bg-zinc-50 border-zinc-200' : 'bg-white/5 border-white/5'
              }`}>
                <div className="text-right">
                  <p className="text-xs font-black leading-none">{sessionUser.name}</p>
                  <span className="text-[9px] text-[#C8FF00] uppercase font-mono tracking-wider font-extrabold">{sessionUser.role} Portal</span>
                </div>
                <div className="w-8 h-8 rounded-lg bg-[#C8FF00]/15 border border-[#C8FF00]/20 flex items-center justify-center font-black font-mono text-xs text-[#C8FF00]">
                  {sessionUser.name ? sessionUser.name[0] : 'U'}
                </div>
              </div>

              {/* Secure logout trigger */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold uppercase tracking-wider text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/25 rounded-xl transition cursor-pointer"
                title="Log Out of system"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Log Out</span>
              </button>
            </>
          ) : null}
        </div>
      </header>

      {/* Main Content Dashboard Frame or Portal Login Screen */}
      {!sessionUser ? (
        <Login onLoginSuccess={handleLoginSuccess} isLightMode={isLightMode} />
      ) : (
        <main className="flex-1 flex flex-col lg:flex-row min-w-0">
          {/* Core Conditional Dashboard Router */}
          {sessionUser.role === 'Member' && sessionMemberObj && (
            <MemberDashboard
              user={sessionUser}
              member={sessionMemberObj}
              onRefreshProfile={handleRefreshMemberProfileData}
              onAddNotification={handleAddNewLiveNotificationAtRuntime}
            />
          )}

          {sessionUser.role === 'Trainer' && sessionTrainerObj && (
            <TrainerDashboard
              user={sessionUser}
              trainer={sessionTrainerObj}
              onAddNotification={handleAddNewLiveNotificationAtRuntime}
            />
          )}

          {sessionUser.role === 'Admin' && (
            <AdminDashboard
              user={sessionUser}
              onAddNotification={handleAddNewLiveNotificationAtRuntime}
            />
          )}

          {/* Global constant mini overview advisor Coach */}
          <div className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-white/10 p-4 md:p-6 bg-[#09090B]/40 shrink-0 select-none">
            <h4 className="text-xs font-black uppercase tracking-widest text-[#C8FF00] mb-4 font-mono">Core AI Virtual Coach</h4>
            <AIWidget
              user={sessionUser}
              member={sessionMemberObj}
              inlineVariant={true}
            />
          </div>
        </main>
      )}

      {/* Persistent global floating interactive companion bot */}
      {sessionUser && (
        <AIWidget
          user={sessionUser}
          member={sessionMemberObj}
          inlineVariant={false}
        />
      )}

      {/* Minimal sleek footer branding element */}
      <footer className="p-3 text-center border-t border-white/5 text-[10px] text-zinc-600 bg-black/60 tracking-wider">
        STRIVE.AI PHYSICAL SYSTEMS CORPORATION © 2026. ALL RIGHTS REGISTERED AND PRIVACY PROTECTED.
      </footer>
    </div>
  );
}
