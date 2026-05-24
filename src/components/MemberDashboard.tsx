import React, { useState, useEffect } from 'react';
import {
  Activity, Award, Calendar, CheckSquare, Clock, Plus, Zap, AlertTriangle, Trash2,
  TrendingUp, Compass, Heart, Droplet, Search, BookOpen, CreditCard, ChevronRight, CheckCircle2, QrCode, X
} from 'lucide-react';
import {
  Member, User, WorkoutPlan, DietPlan, LoggedMeal, FoodDatabaseEntry,
  AttendanceRecord, HealthProgress, PaymentRecord, SysNotification
} from '../types';
import AIConsultant from './AIConsultant';
import AIFormChecker from './AIFormChecker';

interface MemberDashboardProps {
  user: User;
  member: Member;
  onRefreshProfile: () => void;
  onAddNotification: (title: string, msg: string) => void;
}

export default function MemberDashboard({ user, member, onRefreshProfile, onAddNotification }: MemberDashboardProps) {
  // Navigation tabs for Member Profile
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'workouts' | 'nutrition' | 'health' | 'payments' | 'consultant' | 'formcheck'>('overview');

  // Core Data Lists
  const [workoutPlans, setWorkoutPlans] = useState<WorkoutPlan[]>([]);
  const [dietPlans, setDietPlans] = useState<DietPlan[]>([]);
  const [loggedMeals, setLoggedMeals] = useState<LoggedMeal[]>([]);
  const [foodDatabase, setFoodDatabase] = useState<FoodDatabaseEntry[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [progressLogs, setProgressLogs] = useState<HealthProgress[]>([]);
  const [paymentsList, setPaymentsList] = useState<PaymentRecord[]>([]);

  // State Helpers for forms
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Nutrition Input state
  const [mealSearchQuery, setMealSearchQuery] = useState('');
  const [showAddCustomFood, setShowAddCustomFood] = useState(false);
  const [customFoodForm, setCustomFoodForm] = useState({
    name: '', calories: '', protein: '', carbs: '', fat: '', servingSize: '100g'
  });
  const [selectedMealCategory, setSelectedMealCategory] = useState<'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks' | 'Pre-workout' | 'Post-workout'>('Breakfast');

  // Book Session States
  const [sessionForm, setSessionForm] = useState({
    trainerId: '', date: new Date(Date.now() + 24*3600*1000).toISOString().split('T')[0], timeSlot: '10:00 AM'
  });

  // Health Metrics Logging States
  const [showMetricsModal, setShowMetricsModal] = useState(false);
  const [metricsForm, setMetricsForm] = useState({
    weight: member.weight.toString(),
    sleepHours: '8',
    steps: '8000',
    waterMl: '2000',
    chest: '42',
    waist: '32',
    hips: '38',
    biceps: '15'
  });

  // Photo Simulator State
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState<string | null>(null);

  // Payment Upgrade States
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    planName: 'Premium Gold Lifetime',
    amount: '199',
    cardNumber: '4111 2222 3333 4444',
    cardExpiry: '12/29',
    cardCvv: '357',
    method: 'Credit Card'
  });

  useEffect(() => {
    fetchMemberOverviewData();
  }, [member.id]);

  const fetchMemberOverviewData = async () => {
    try {
      // Workouts
      const resW = await fetch(`/api/workouts/member/${member.id}`);
      if (resW.ok) setWorkoutPlans(await resW.ok ? await resW.json() : []);

      // Diets
      const resD = await fetch(`/api/diets/member/${member.id}`);
      if (resD.ok) setDietPlans(await resD.json());

      // Logged Meals
      const resM = await fetch(`/api/meals/member/${member.id}/${selectedDate}`);
      if (resM.ok) setLoggedMeals(await resM.json());

      // Global Nutrition DB
      const resF = await fetch('/api/food/db');
      if (resF.ok) setFoodDatabase(await resF.json());

      // Attendance history
      const resA = await fetch(`/api/attendance/member/${member.id}`);
      if (resA.ok) setAttendanceRecords(await resA.json());

      // Progress history logs
      const resP = await fetch(`/api/progress/member/${member.id}`);
      if (resP.ok) setProgressLogs(await resP.json());

      // Fetch admin reports for current payments
      const resPay = await fetch('/api/admin/metrics');
      if (resPay.ok) {
        const met = await resPay.json();
        // filter payments belonging to our user
        const mine = met.recentPayments ? met.recentPayments.filter((p: any) => p.memberId === member.id) : [];
        setPaymentsList(mine);
      }
    } catch (e) {
      console.error("Failed to load member datasets", e);
    }
  };

  // Water Drink incremental action
  const changeWaterTracker = async (amountMl: number) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const latestLog = progressLogs.find(p => p.date === todayStr);
    const existingWater = latestLog ? latestLog.waterMl : 1500;
    const newVol = Math.max(0, existingWater + amountMl);

    try {
      const res = await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: member.id,
          date: todayStr,
          waterMl: newVol
        })
      });
      if (res.ok) {
        await fetchMemberOverviewData();
        onAddNotification("Hydration Tracked", `Logged ${amountMl}ml of pure water! Current volume: ${newVol}ml.`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Quick Barcode Scanning simulator
  const handleBarcodeSimulator = () => {
    if (foodDatabase.length === 0) return;
    const randomFood = foodDatabase[Math.floor(Math.random() * foodDatabase.length)];
    // Quick log meal
    handleLogMeal(randomFood);
    onAddNotification("Barcode Scanned!", `Sleek AI Scanner resolved UPC: ${randomFood.name} logged under ${selectedMealCategory}!`);
  };

  // Log Consumed Meal
  const handleLogMeal = async (food: FoodDatabaseEntry) => {
    try {
      const res = await fetch('/api/meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: member.id,
          date: selectedDate,
          category: selectedMealCategory,
          name: food.name,
          calories: food.calories,
          protein: food.protein,
          carbs: food.carbs,
          fat: food.fat,
          servingSize: food.servingSize
        })
      });
      if (res.ok) {
        await fetchMemberOverviewData();
        onAddNotification("Meal Logged", `Added ${food.name} (${food.calories} kcal) to consumed list.`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteMealLog = async (logId: string) => {
    try {
      const res = await fetch(`/api/meals/${logId}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchMemberOverviewData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Save new physical metric measurements formulation
  const handleSaveMetrics = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: member.id,
          date: new Date().toISOString().split('T')[0],
          weight: parseFloat(metricsForm.weight),
          sleepHours: parseInt(metricsForm.sleepHours),
          steps: parseInt(metricsForm.steps),
          waterMl: parseInt(metricsForm.waterMl),
          chest: parseFloat(metricsForm.chest),
          waist: parseFloat(metricsForm.waist),
          hips: parseFloat(metricsForm.hips),
          biceps: parseFloat(metricsForm.biceps),
          photoUrl: uploadedPhotoUrl || undefined
        })
      });
      if (res.ok) {
        setShowMetricsModal(false);
        await fetchMemberOverviewData();
        onRefreshProfile(); // triggers outer app parent to synchronize height changes
        onAddNotification("Metrics Published", "Logged target dimensions and physical parameters successfully.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle slot booking calendar appointment
  const handleBookSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionForm.trainerId) {
      alert("Please choose a Trainer first");
      return;
    }
    try {
      const res = await fetch('/api/trainer/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: member.id,
          trainerId: sessionForm.trainerId,
          timeSlot: sessionForm.timeSlot,
          date: sessionForm.date
        })
      });
      if (res.ok) {
        const body = await res.json();
        onAddNotification("Booking Established", body.message);
        alert(body.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle customized food addition to inventory list
  const handleAddCustomInventoryFood = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customFoodForm.name || !customFoodForm.calories) return;
    try {
      const res = await fetch('/api/food/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: customFoodForm.name,
          calories: parseInt(customFoodForm.calories),
          protein: parseInt(customFoodForm.protein) || 0,
          carbs: parseInt(customFoodForm.carbs) || 0,
          fat: parseInt(customFoodForm.fat) || 0,
          servingSize: customFoodForm.servingSize
        })
      });
      if (res.ok) {
        const item = await res.json();
        setFoodDatabase(prev => [item, ...prev]);
        setShowAddCustomFood(false);
        setCustomFoodForm({ name: '', calories: '', protein: '', carbs: '', fat: '', servingSize: '100g' });
        onAddNotification("Inventory Enlarged", `Registered custom nutrient ingredient target: ${item.name}!`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Process Mock Visa checkout upgrade transaction
  const handleConfirmUpgrade = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/payments/charge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: member.id,
          amount: parseFloat(paymentForm.amount),
          planName: paymentForm.planName,
          method: paymentForm.method
        })
      });
      if (res.ok) {
        setShowPaymentModal(false);
        await fetchMemberOverviewData();
        onRefreshProfile();
        onAddNotification("Plan Unlocked", `Upgrade payment to ${paymentForm.planName} processed! Balance synchronized.`);
        alert(`Transaction Success! Enjoy full ${paymentForm.planName} parameters.`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Compute Calories logic derived from active diet plan
  const activeDiet = dietPlans[0] || {
    dailyCalorieTarget: 2200, proteinTarget: 140, carbTarget: 220, fatTarget: 60
  };

  const consumedSum = loggedMeals.reduce((acc, m) => {
    acc.calories += m.calories;
    acc.protein += m.protein;
    acc.carbs += m.carbs;
    acc.fat += m.fat;
    return acc;
  }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

  const sleepSum = progressLogs[progressLogs.length - 1]?.sleepHours || 8;
  const stepsSum = progressLogs[progressLogs.length - 1]?.steps || 5500;
  const currentWater = progressLogs[progressLogs.length - 1]?.waterMl || 1200;

  // Search filtered foods catalog
  const filteredFoods = foodDatabase.filter(f =>
    f.name.toLowerCase().includes(mealSearchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 text-white">
      {/* Sub tabs view selector */}
      <div className="flex border-b border-white/10 pb-1 overflow-x-auto gap-4 scrollbar-none">
        {[
          { id: 'overview', name: 'Overview' },
          { id: 'workouts', name: 'Workout Builder' },
          { id: 'nutrition', name: 'Meal & Nutrition System' },
          { id: 'health', name: 'Physical Biometrics' },
          { id: 'payments', name: 'Subscription Payments' },
          { id: 'consultant', name: 'AI Consultant' },
          { id: 'formcheck', name: 'AI Form Checker' }
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

      {/* OVERVIEW TAB */}
      {activeSubTab === 'overview' && (
        <div className="space-y-8">
          {/* Welcome Banner Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 bg-gradient-to-br from-[#C8FF00] via-[#D8FF31] to-[#609900] rounded-3xl p-6 md:p-8 text-black flex flex-col justify-between relative overflow-hidden">
              <div className="relative z-10 max-w-lg space-y-3">
                <span className="px-3 py-1 bg-black/15 text-[9px] font-extrabold uppercase tracking-widest rounded-full">
                  StriveAI Core Suite
                </span>
                <h2 className="text-3xl md:text-5xl font-black tracking-tight uppercase leading-none">
                  Push your parameters today
                </h2>
                <p className="text-black/85 text-xs md:text-sm font-medium">
                  Welcome back, {user.name}. You are assigned with Coach Sarah Miller. BMI metric status stands at <strong className="font-bold">{member.bmi} ({member.bmi < 25 ? 'Healthy Range' : 'Moderate Mass'})</strong>. Let's make every physical repetition count!
                </p>
                <div className="flex flex-wrap gap-3 pt-4">
                  <button
                    onClick={() => setShowMetricsModal(true)}
                    className="px-6 py-2.5 bg-black text-[#C8FF00] font-black text-xs uppercase tracking-wider rounded-xl transition hover:opacity-90"
                  >
                    Log Physical Progress
                  </button>
                  <button
                    onClick={() => setActiveSubTab('nutrition')}
                    className="px-6 py-2.5 border border-black/25 text-black font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-black/5"
                  >
                    Meal Planner
                  </button>
                </div>
              </div>
              <div className="absolute right-0 bottom-0 opacity-15 translate-x-12 translate-y-8 select-none pointer-events-none">
                <QrCode className="w-64 h-64" />
              </div>
            </div>

            {/* Attendance QR Badge */}
            <div className="lg:col-span-4 bg-[#0C0C0E] border border-white/10 rounded-3xl p-6 flex flex-col items-center text-center justify-between space-y-4">
              <div>
                <span className="px-3 py-1 bg-white/[0.04] text-[9px] uppercase tracking-wider text-[#C8FF00] rounded-full border border-white/5 font-bold">
                  Quick Check-In Badge
                </span>
                <h3 className="font-bold text-sm text-white uppercase tracking-wider mt-3">Scan Gym Attendance</h3>
                <p className="text-[11px] text-white/50 max-w-[200px] mt-1 mx-auto leading-relaxed">
                  Hold this cryptographic StriveAI code against our physical gym screen to log presence.
                </p>
              </div>

              {/* Vector SVG QR */}
              <div className="bg-white p-3 rounded-2xl relative shadow-lg">
                <svg className="w-32 h-32 text-black" viewBox="0 0 100 100">
                  <rect width="100" height="100" fill="white" />
                  <rect x="10" y="10" width="25" height="25" fill="black" />
                  <rect x="15" y="15" width="15" height="15" fill="white" />
                  <rect x="18" y="18" width="9" height="9" fill="black" />
                  
                  <rect x="65" y="10" width="25" height="25" fill="black" />
                  <rect x="70" y="15" width="15" height="15" fill="white" />
                  <rect x="73" y="18" width="9" height="9" fill="black" />

                  <rect x="10" y="65" width="25" height="25" fill="black" />
                  <rect x="15" y="70" width="15" height="15" fill="white" />
                  <rect x="18" y="73" width="9" height="9" fill="black" />

                  {/* Random pixels */}
                  <rect x="45" y="15" width="8" height="8" fill="black" />
                  <rect x="55" y="25" width="5" height="8" fill="black" />
                  <rect x="42" y="38" width="12" height="6" fill="black" />
                  <rect x="25" y="45" width="9" height="7" fill="black" />
                  <rect x="68" y="42" width="14" height="9" fill="black" />
                  <rect x="52" y="55" width="15" height="6" fill="black" />
                  <rect x="45" y="75" width="18" height="6" fill="black" />
                  <rect x="75" y="75" width="12" height="12" fill="black" />
                  <rect x="80" y="55" width="6" height="12" fill="black" />
                  <rect x="38" y="60" width="9" height="12" fill="black" />
                </svg>
                {/* Branding dot in middle */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-black flex items-center justify-center rounded-lg border-2 border-white">
                  <div className="w-3.5 h-3.5 bg-[#C8FF00] rounded-sm"></div>
                </div>
              </div>

              <div className="text-[10px] text-white/40 uppercase tracking-widest font-black">
                Checked in: {attendanceRecords.length} times this month
              </div>
            </div>
          </div>

          {/* Key Macro Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <div className="bg-[#0C0C0E] border border-white/10 p-5 rounded-3xl space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider">Consumed Calories</p>
                <Zap className="w-4 h-4 text-[#C8FF00]" />
              </div>
              <div>
                <h3 className="text-2xl md:text-3xl font-black">{consumedSum.calories} <span className="text-xs font-normal text-white/30"> / {activeDiet.dailyCalorieTarget} kcal</span></h3>
                <div className="h-1.5 w-full bg-white/5 rounded-full mt-3 overflow-hidden">
                  <div
                    className="h-full bg-[#C8FF00] rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, (consumedSum.calories / activeDiet.dailyCalorieTarget) * 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="bg-[#0C0C0E] border border-white/10 p-5 rounded-3xl space-y-4 font-mono">
              <div className="flex items-center justify-between">
                <p className="text-white/40 text-[10px] uppercase tracking-wider font-sans">Hydration State</p>
                <Droplet className="w-4 h-4 text-[#00E5FF]" />
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl md:text-3xl font-black text-white font-sans">{currentWater} <span className="text-xs font-normal text-white/30"> / 3000 mL</span></h3>
                <div className="flex gap-1 pt-1">
                  {[250, 500, 750, 1000, 1250, 1500, 2000, 3000].map((step, idx) => (
                    <div
                      key={idx}
                      className={`h-1.5 flex-1 rounded-full transition-all ${
                        currentWater >= step ? 'bg-[#00E5FF]' : 'bg-white/5'
                      }`}
                    ></div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => changeWaterTracker(250)}
                    className="flex-1 py-1 text-[9px] bg-white/5 hover:bg-white/10 border border-white/5 text-white rounded font-sans uppercase font-bold"
                  >
                    +250ml
                  </button>
                  <button
                    onClick={() => changeWaterTracker(500)}
                    className="flex-1 py-1 text-[9px] bg-[#00E5FF]/20 hover:bg-[#00E5FF]/30 border border-[#00E5FF]/20 text-[#00E5FF] rounded font-sans uppercase font-bold"
                  >
                    +500ml
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-[#0C0C0E] border border-white/10 p-5 rounded-3xl space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider">Sleep Tracker</p>
                <Clock className="w-4 h-4 text-[#C5A3FF]" />
              </div>
              <div>
                <h3 className="text-2xl md:text-3xl font-black">{sleepSum} <span className="text-xs font-normal text-white/30"> Hours Logged</span></h3>
                <p className="text-[11px] text-zinc-400 mt-2 font-medium">
                  {sleepSum >= 7 ? "Optimal muscular tissue rebuild." : "Inadequate rest. Goal is 7.5+ Hrs."}
                </p>
              </div>
            </div>

            <div className="bg-[#0C0C0E] border border-white/10 p-5 rounded-3xl space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider">Step Counter</p>
                <TrendingUp className="w-4 h-4 text-orange-400" />
              </div>
              <div>
                <h3 className="text-2xl md:text-3xl font-black">{stepsSum.toLocaleString()}<span className="text-xs font-normal text-white/30"> / 10,000</span></h3>
                <div className="h-1.5 w-full bg-white/5 rounded-full mt-3 overflow-hidden">
                  <div
                    className="h-full bg-orange-400 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, (stepsSum / 10000) * 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Assigned Workout overview */}
            <div className="lg:col-span-6 bg-[#0C0C0E] border border-white/10 rounded-3xl p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-wider text-[#C8FF00]">Active Workout Routine</h4>
                  <p className="text-xs text-white/50">Provided by Coach Sarah Miller</p>
                </div>
                <button
                  onClick={() => setActiveSubTab('workouts')}
                  className="p-2 text-white/60 hover:text-white bg-white/5 rounded-xl border border-white/5"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {workoutPlans.length > 0 ? (
                <div className="space-y-4">
                  <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl relative">
                    <span className="absolute top-4 right-4 text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">Active</span>
                    <h5 className="font-bold text-sm text-white">{workoutPlans[0].title}</h5>
                    <p className="text-[10px] text-white/40 mt-1 uppercase tracking-widest font-bold">Split Strategy</p>
                  </div>
                  <div className="divide-y divide-white/5 max-h-[220px] overflow-y-auto pr-1">
                    {workoutPlans[0].exercises.slice(0, 4).map((ex, i) => (
                      <div key={i} className="py-2.5 flex justify-between items-center text-xs">
                        <div>
                          <p className="font-semibold text-white">{ex.name}</p>
                          <p className="text-[10px] text-zinc-400 font-mono mt-0.5">{ex.day} • {ex.notes || 'Routine rep series'}</p>
                        </div>
                        <span className="text-[#C8FF00] font-bold font-mono">{ex.sets}x{ex.reps} {ex.weight && `@ ${ex.weight}`}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-white/40 text-xs">
                  No explicit physical routines cataloged yet.
                </div>
              )}
            </div>

            {/* Quick nutrition split */}
            <div className="lg:col-span-6 bg-[#0C0C0E] border border-white/10 rounded-3xl p-6 flex flex-col justify-between">
              <div>
                <h4 className="text-sm font-bold uppercase tracking-wider text-[#C8FF00] mb-4">Macro Balance Distribution</h4>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-white/60 font-medium">Protein Target</span>
                      <span className="text-[#C8FF00] font-bold font-mono">{consumedSum.protein}g / {activeDiet.proteinTarget}g</span>
                    </div>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-[#C8FF00]" style={{ width: `${Math.min(100, (consumedSum.protein / activeDiet.proteinTarget) * 100)}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-white/60 font-medium">Carb Fuel Volume</span>
                      <span className="text-blue-400 font-bold font-mono">{consumedSum.carbs}g / {activeDiet.carbTarget}g</span>
                    </div>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-400" style={{ width: `${Math.min(100, (consumedSum.carbs / activeDiet.carbTarget) * 100)}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-white/60 font-medium">Healthy Fats</span>
                      <span className="text-orange-400 font-bold font-mono">{consumedSum.fat}g / {activeDiet.fatTarget}g</span>
                    </div>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-orange-400" style={{ width: `${Math.min(100, (consumedSum.fat / activeDiet.fatTarget) * 100)}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tips banner inside panel */}
              <div className="mt-6 bg-white/[0.02] border border-white/5 p-4 rounded-xl flex items-start gap-3">
                <Award className="w-5 h-5 text-[#C8FF00] shrink-0" />
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-white uppercase tracking-wider">Coach Wisdom</p>
                  <p className="text-[11px] text-white/50 leading-relaxed">
                    Based on your target of <strong className="text-zinc-200">{member.fitnessGoal}</strong>, try prioritizing post-workout proteins within 45 minutes of training to speed up fibers reconstruction.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* WORKOUTS TAB */}
      {activeSubTab === 'workouts' && (
        <div className="space-y-8">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-2xl font-black uppercase tracking-tight">Assigned Workout Routines</h3>
              <p className="text-xs text-white/40">Complete the target sets below under supervision of AuraFit</p>
            </div>
            <button
              onClick={() => {
                const title = prompt("Enter custom workout routine label:", "My Morning Bodyweight Splendid Split");
                if (title) {
                  const demoExc = [
                    { day: 'Monday', name: 'Barbell Bench Press', sets: 4, reps: 8, weight: '70kg' },
                    { day: 'Friday', name: 'Barbell Squat Deep', sets: 3, reps: 10, weight: '90kg' }
                  ];
                  fetch('/api/workouts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ memberId: member.id, title, exercises: demoExc, trainerId: 'AI' })
                  }).then(() => fetchMemberOverviewData());
                }
              }}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-[#C8FF00] border border-[#C8FF00]/20 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Create Custom Routine
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-6">
              {workoutPlans.map((plan) => (
                <div key={plan.id} className="bg-[#0C0C0E] border border-white/10 rounded-3xl p-6 relative">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <span className="text-[9px] bg-white/5 border border-white/10 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider text-neutral-400">
                        {plan.trainerId === 'AI' ? 'AI Generated Plan' : 'Trainer Sarah Miller'}
                      </span>
                      <h4 className="text-lg font-black text-white uppercase tracking-wider mt-1.5">{plan.title}</h4>
                    </div>
                    <button
                      onClick={async () => {
                        if (confirm("Delete this physical blueprint?")) {
                          const res = await fetch(`/api/workouts/${plan.id}`, { method: 'DELETE' });
                          if (res.ok) await fetchMemberOverviewData();
                        }
                      }}
                      className="text-red-400/60 hover:text-red-400 p-2 rounded-lg hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Exercises check off */}
                  <div className="space-y-3">
                    {plan.exercises.map((ex, i) => (
                      <div key={i} className="flex bg-white/[0.01] hover:bg-white/[0.02] border border-white/5 p-4 rounded-2xl items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-lg bg-[#C8FF00]/10 border border-[#C8FF00]/20 flex items-center justify-center font-bold text-[10px] text-[#C8FF00]">
                            {i + 1}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-white">{ex.name}</p>
                            <p className="text-[10px] text-white/40 mt-0.5">{ex.day} • {ex.notes || "High intensity repetitions"}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-mono text-xs font-bold text-[#C8FF00]">{ex.sets} Sets x {ex.reps} Reps {ex.weight ? `@ ${ex.weight}` : ''}</span>
                          <button
                            onClick={() => onAddNotification("Exercise Done!", `Checked off ${ex.name} sets! Keep pushing.`)}
                            className="p-1 px-2.5 bg-white/5 hover:bg-[#C8FF00]/20 border border-white/10 hover:border-[#C8FF00]/30 rounded-lg text-[9px] font-bold text-white uppercase"
                          >
                            Done
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Trainer Booking Calendar and Slot reserve */}
            <div className="lg:col-span-4 bg-[#0C0C0E] border border-white/10 rounded-3xl p-6">
              <h4 className="text-sm font-bold uppercase tracking-wider text-[#C8FF00] mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Private Trainer Booking
              </h4>
              <p className="text-[11px] text-white/50 leading-relaxed mb-6">
                Reserve 1-on-1 offline muscle testing or posture correction session blocks with coaches.
              </p>

              <form onSubmit={handleBookSession} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-black tracking-widest text-zinc-400">Select Gym Coach</label>
                  <select
                    value={sessionForm.trainerId}
                    onChange={(e) => setSessionForm(prev => ({ ...prev, trainerId: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 text-xs rounded-xl p-3 focus:outline-none focus:border-[#C8FF00]"
                  >
                    <option value="" className="bg-[#09090B]">Choose Coach Coach</option>
                    <option value="trn-1" className="bg-[#09090B]">Sarah Miller (Muscle tone)</option>
                    <option value="trn-2" className="bg-[#09090B]">Bob Sterling (Powerlifting & Squat posture)</option>
                  </select>
                </div>

                <div className="space-y-1.5 font-mono text-xs">
                  <label className="text-[10px] uppercase font-black font-sans tracking-widest text-zinc-400">Proposed Slot Date</label>
                  <input
                    type="date"
                    value={sessionForm.date}
                    onChange={(e) => setSessionForm(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:outline-none focus:border-[#C8FF00]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-black tracking-widest text-zinc-400">Proposed Hour Block</label>
                  <select
                    value={sessionForm.timeSlot}
                    onChange={(e) => setSessionForm(prev => ({ ...prev, timeSlot: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 text-xs rounded-xl p-3 focus:outline-none focus:border-[#C8FF00]"
                  >
                    <option value="08:00 AM">08:00 AM - 09:00 AM</option>
                    <option value="10:00 AM">10:00 AM - 11:00 AM</option>
                    <option value="14:30 PM">14:30 PM - 15:30 PM</option>
                    <option value="18:00 PM">18:00 PM - 19:00 PM</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-[#C8FF00] hover:bg-[#B3E500] text-black text-xs font-black uppercase tracking-wider rounded-xl transition"
                >
                  Schedule Training Block
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* NUTRITION TAB */}
      {activeSubTab === 'nutrition' && (
        <div className="space-y-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="text-2xl font-black uppercase tracking-tight">Macro Diet Tracker</h3>
              <p className="text-xs text-white/40">Select target dates to search and log consumed food macro items</p>
            </div>

            <div className="flex flex-wrap gap-2 font-mono text-xs">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  fetchMemberOverviewData();
                }}
                className="bg-[#0C0C0E] border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none"
              />

              <button
                onClick={handleBarcodeSimulator}
                className="px-4 py-2 bg-gradient-to-r from-cyan-400/20 to-blue-500/20 hover:from-cyan-400/30 text-[#00E5FF] border border-[#00E5FF]/30 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 font-sans"
              >
                Scan Barcode
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Food item additions & search logs */}
            <div className="lg:col-span-8 space-y-6">
              {/* Daily Meal Categories lists */}
              <div className="bg-[#0C0C0E] border border-white/10 rounded-3xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h4 className="font-bold text-sm text-white uppercase tracking-wider">Consumed Logs</h4>
                    <p className="text-[11px] text-white/40">Date parameters logged: {selectedDate}</p>
                  </div>
                  <span className="text-xs font-mono bg-[#C8FF00]/10 text-[#C8FF00] border border-[#C8FF00]/20 rounded-full px-3 py-1 font-bold">
                    {consumedSum.calories} kcal Today
                  </span>
                </div>

                <div className="divide-y divide-white/5 space-y-3">
                  {['Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Pre-workout', 'Post-workout'].map((cat) => {
                    const mealsInCat = loggedMeals.filter(m => m.category === cat);
                    return (
                      <div key={cat} className="pt-3 first:pt-0">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-[10px] uppercase font-black tracking-widest text-[#C8FF00]">{cat}</span>
                          <span className="text-[10px] text-white/40 font-mono">
                            {mealsInCat.reduce((s, m) => s + m.calories, 0)} kcal
                          </span>
                        </div>

                        {mealsInCat.length === 0 ? (
                          <div className="text-[10px] text-white/20 italic pb-2">No meals logged yet.</div>
                        ) : (
                          <div className="space-y-1.5 pb-2">
                            {mealsInCat.map((meal) => (
                              <div key={meal.id} className="bg-white/[0.01] border border-white/5 p-3 rounded-xl flex items-center justify-between text-xs">
                                <div>
                                  <p className="font-bold text-white">{meal.name}</p>
                                  <p className="text-[10px] text-white/30 mt-0.5">{meal.servingSize} • P {meal.protein}g | C {meal.carbs}g | F {meal.fat}g</p>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="font-mono text-zinc-300 font-bold">{meal.calories} kcal</span>
                                  <button
                                    onClick={() => handleDeleteMealLog(meal.id)}
                                    className="text-red-400 hover:text-red-300 p-1"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Food Search and additions database */}
            <div className="lg:col-span-4 bg-[#0C0C0E] border border-white/10 rounded-3xl p-6 space-y-6">
              <div>
                <h4 className="text-sm font-bold uppercase tracking-wider text-[#C8FF00]">Food Inventory & Log</h4>
                <p className="text-[11px] text-white/40 mt-1">Search or enter clean diet materials manually</p>
              </div>

              {/* Category selector */}
              <div>
                <label className="text-[9px] uppercase font-black tracking-widest text-zinc-400 block mb-1.5">Meal Category Target</label>
                <div className="grid grid-cols-2 gap-1 text-[10px]">
                  {['Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Pre-workout', 'Post-workout'].map((c) => (
                    <button
                      key={c}
                      onClick={() => setSelectedMealCategory(c as any)}
                      className={`py-1 px-2.5 rounded-lg border uppercase font-bold text-[9px] transition ${
                        selectedMealCategory === c ? 'bg-[#C8FF00] text-black border-[#C8FF00]' : 'bg-white/5 text-zinc-400 border-white/5 hover:bg-white/10'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={mealSearchQuery}
                  onChange={(e) => setMealSearchQuery(e.target.value)}
                  placeholder="Type Chicken, Oats, Salmon..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-[#C8FF00]"
                />
                <Search className="w-3.5 h-3.5 text-white/40 absolute left-3.5" />
              </div>

              {/* Search results list */}
              <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                {filteredFoods.map((food, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleLogMeal(food)}
                    className="w-full text-left bg-white/[0.02] hover:bg-white/5 border border-white/5 p-2.5 rounded-xl flex items-center justify-between text-xs transition"
                  >
                    <div>
                      <p className="font-bold text-white">{food.name}</p>
                      <p className="text-[9px] text-white/40">{food.servingSize} • P {food.protein}g | C {food.carbs}g</p>
                    </div>
                    <span className="text-[#C8FF00] font-bold font-mono text-[11px] shrink-0 bg-white/5 px-2 py-0.5 rounded-md border border-white/5 flex items-center gap-1">+ {food.calories}kcal</span>
                  </button>
                ))}
              </div>

              {/* Quick custom item generation form */}
              {!showAddCustomFood ? (
                <button
                  onClick={() => setShowAddCustomFood(true)}
                  className="w-full py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-xs font-bold uppercase tracking-wider"
                >
                  Cannot find? Enter Custom Ingredient
                </button>
              ) : (
                <form onSubmit={handleAddCustomInventoryFood} className="bg-black/40 border border-white/5 p-4 rounded-xl space-y-3">
                  <div className="flex justify-between items-center pb-1 border-b border-white/5">
                    <span className="text-[9px] uppercase tracking-widest font-black text-[#C8FF00]">New Ingredient parameters</span>
                    <button type="button" onClick={() => setShowAddCustomFood(false)} className="text-white/40 hover:text-white"><X className="w-3 h-3" /></button>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Food Label e.g. Whey Protein Powder"
                    value={customFoodForm.name}
                    onChange={(e) => setCustomFoodForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-xs focus:outline-none"
                  />
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <input
                      type="number"
                      required
                      placeholder="Kcal"
                      value={customFoodForm.calories}
                      onChange={(e) => setCustomFoodForm(prev => ({ ...prev, calories: e.target.value }))}
                      className="bg-white/5 border border-white/10 rounded-lg p-2 focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Size: 100g / 1 cup"
                      value={customFoodForm.servingSize}
                      onChange={(e) => setCustomFoodForm(prev => ({ ...prev, servingSize: e.target.value }))}
                      className="bg-white/5 border border-white/10 rounded-lg p-2 focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 text-xs text-center font-mono">
                    <input
                      type="number"
                      placeholder="Prot (g)"
                      value={customFoodForm.protein}
                      onChange={(e) => setCustomFoodForm(prev => ({ ...prev, protein: e.target.value }))}
                      className="bg-white/5 border border-white/10 rounded-lg p-1.5 focus:outline-none"
                    />
                    <input
                      type="number"
                      placeholder="Carb (g)"
                      value={customFoodForm.carbs}
                      onChange={(e) => setCustomFoodForm(prev => ({ ...prev, carbs: e.target.value }))}
                      className="bg-white/5 border border-white/10 rounded-lg p-1.5 focus:outline-none"
                    />
                    <input
                      type="number"
                      placeholder="Fat (g)"
                      value={customFoodForm.fat}
                      onChange={(e) => setCustomFoodForm(prev => ({ ...prev, fat: e.target.value }))}
                      className="bg-white/5 border border-white/10 rounded-lg p-1.5 focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2 bg-[#C8FF00] text-black text-[10px] font-black uppercase tracking-wider rounded-lg"
                  >
                    Register to database
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* BIOMETRICS PROGRESS TRACKING TAB */}
      {activeSubTab === 'health' && (
        <div className="space-y-8">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-2xl font-black uppercase tracking-tight">Biometric Dimension Analytics</h3>
              <p className="text-xs text-white/40 font-mono">Weight registers and structural measurement logs over time</p>
            </div>
            <button
              onClick={() => setShowMetricsModal(true)}
              className="px-5 py-2.5 bg-[#C8FF00] text-black text-xs font-black uppercase tracking-wider rounded-xl transition hover:opacity-90 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Log Physical State
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 bg-[#0C0C0E] border border-white/10 rounded-3xl p-6">
              <h4 className="text-sm font-bold uppercase tracking-wider text-[#C8FF00] mb-6">Historic Weight Tracking Sequence</h4>

              {/* Simple High-Contrast D3 custom inline SVG Graph rendering */}
              <div className="bg-white/[0.01] border border-white/5 p-4 rounded-2xl">
                <div className="h-64 flex items-end justify-between gap-2 border-b border-l border-white/10 pb-4 pl-4 pt-4 relative">
                  {/* Grid lines */}
                  <div className="absolute left-4 right-0 top-1/4 border-t border-white/5 pointer-events-none"></div>
                  <div className="absolute left-4 right-0 top-2/4 border-t border-white/5 pointer-events-none"></div>
                  <div className="absolute left-4 right-0 top-3/4 border-t border-white/5 pointer-events-none"></div>

                  {progressLogs.length > 0 ? (
                    progressLogs.map((item, idx) => {
                      const maxWeight = 100;
                      const percentage = Math.max(10, Math.min(100, (item.weight / maxWeight) * 100));
                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full relative group">
                          {/* Hover stats representation box */}
                          <div className="absolute -top-8 bg-zinc-800 text-[9px] px-2 py-0.5 rounded text-[#C8FF00] font-mono border border-white/15 opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-20">
                            {item.weight} kg
                          </div>
                          
                          {/* Main bar block */}
                          <div
                            className="w-full max-w-[28px] bg-[#C8FF00] rounded-t-lg transition-all duration-500 hover:brightness-110"
                            style={{ height: `${percentage}%` }}
                          ></div>
                          
                          <span className="text-[8px] text-white/35 font-mono mt-2 truncate max-w-full">
                            {item.date.slice(5)}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="w-full text-center text-white/20 italic pb-8">No physical progress registered yet.</div>
                  )}
                </div>
                <div className="flex justify-between items-center mt-3 text-[10px] text-white/40 uppercase tracking-widest font-black pr-1 font-sans">
                  <span>Start (May)</span>
                  <span>Ongoing Status</span>
                </div>
              </div>
            </div>

            {/* Body measures panel list */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-[#0C0C0E] border border-white/10 rounded-3xl p-6 space-y-4">
                <h4 className="text-sm font-bold uppercase tracking-wider text-[#C8FF00]">Latest Measurements Log</h4>
                <div className="divide-y divide-white/5 text-xs">
                  {[
                    { label: 'Chest circumference', val: progressLogs[progressLogs.length-1]?.chest || 42, unit: 'in' },
                    { label: 'Waistline target', val: progressLogs[progressLogs.length-1]?.waist || 33.5, unit: 'in' },
                    { label: 'Hip bounds', val: progressLogs[progressLogs.length-1]?.hips || 37.5, unit: 'in' },
                    { label: 'Relaxed Biceps', val: progressLogs[progressLogs.length-1]?.biceps || 15.5, unit: 'in' },
                  ].map((it, idx) => (
                    <div key={idx} className="py-2.5 flex justify-between items-center font-mono">
                      <span className="text-white/60 font-sans">{it.label}</span>
                      <span className="text-white font-bold font-mono">{it.val} {it.unit}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Uploaded progress photos module representation */}
              <div className="bg-[#0C0C0E] border border-white/10 rounded-3xl p-6 space-y-4">
                <h4 className="text-sm font-bold uppercase tracking-wider text-[#C8FF00]">Progress Photo Timeline</h4>
                <p className="text-[11px] text-white/40 leading-relaxed">
                  Add secure visual check-ins to monitor visual muscle definitions.
                </p>

                <div className="bg-white/[0.01] border-2 border-dashed border-white/10 hover:border-[#C8FF00]/40 rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-2 relative">
                  {uploadedPhotoUrl ? (
                    <div className="relative w-full h-32 rounded-xl overflow-hidden group">
                      <img 
                        src={uploadedPhotoUrl} 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover" 
                      />
                      <button
                        onClick={(e) => { e.stopPropagation(); setUploadedPhotoUrl(null); }}
                        className="absolute top-2 right-2 bg-black/60 p-1 rounded-md text-white hover:text-[#C8FF00]"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <Compass className="w-8 h-8 text-white/30 animate-pulse" />
                      <div>
                        <p className="text-xs font-bold text-white">Choose visual file</p>
                        <p className="text-[9px] text-white/30 mt-0.5">Drag-and-drop or tap to select image</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const demoUrls = [
                            "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=400&auto=format&fit=crop",
                            "https://images.unsplash.com/photo-1548690312-e3b507d8c110?q=80&w=400&auto=format&fit=crop",
                            "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=400&auto=format&fit=crop"
                          ];
                          setUploadedPhotoUrl(demoUrls[Math.floor(Math.random() * demoUrls.length)]);
                          onAddNotification("Photo Updated", "Loaded mockup progress snapshot of ongoing muscle development.");
                        }}
                        className="h-full w-full absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBSCRIPTION PAYMENTS TAB */}
      {activeSubTab === 'payments' && (
        <div className="space-y-8">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-2xl font-black uppercase tracking-tight">Billing & Subscriptions</h3>
              <p className="text-xs text-white/40 font-mono">View membership validity terms and payment transaction records</p>
            </div>
            <button
              onClick={() => {
                setPaymentForm(prev => ({ ...prev, planName: 'Premium Gym Access Package', amount: '99' }));
                setShowPaymentModal(true);
              }}
              className="px-5 py-2.5 bg-[#C8FF00] text-black text-xs font-black uppercase tracking-wider rounded-xl transition hover:opacity-90 flex items-center gap-2"
            >
              <CreditCard className="w-4 h-4" /> Renew Membership
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4 bg-[#0C0C0E] border border-white/10 rounded-3xl p-6 space-y-6 flex flex-col justify-between">
              <div>
                <span className="px-3 py-1 bg-white/[0.04] text-[9px] uppercase tracking-wider text-[#C8FF00] rounded-full border border-white/5 font-extrabold">Currently Active Tier</span>
                <h4 className="text-3xl font-black text-white mt-4 uppercase tracking-wider leading-none">{member.membershipType}</h4>
                <div className="divide-y divide-white/5 text-xs font-mono pt-4">
                  <div className="py-2.5 flex justify-between font-sans">
                    <span className="text-zinc-400">Account status</span>
                    <span className="text-emerald-400 font-bold uppercase tracking-wider">Active Authorized</span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-zinc-400 font-sans">Valid Expiry Date</span>
                    <span>{member.membershipExpiry}</span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-zinc-400 font-sans">Renew pricing template</span>
                    <span>$49.00 / Month</span>
                  </div>
                </div>
              </div>

              {/* Renewal trigger buttons */}
              <div className="space-y-2 pt-6">
                <button
                  onClick={() => {
                    setPaymentForm(prev => ({ ...prev, planName: 'Premium Gold Lifetime Tier', amount: '350' }));
                    setShowPaymentModal(true);
                  }}
                  className="w-full py-3 bg-white text-black text-xs font-black uppercase tracking-wider rounded-xl transition"
                >
                  Upgrade to Premium Gold ($350)
                </button>
                <button
                  onClick={() => {
                    setPaymentForm(prev => ({ ...prev, planName: 'Standard Monthly Renewal', amount: '49' }));
                    setShowPaymentModal(true);
                  }}
                  className="w-full py-3 bg-white/5 hover:bg-white/10 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition"
                >
                  Monthly Standard Extension ($49)
                </button>
              </div>
            </div>

            {/* Payment history list entries */}
            <div className="lg:col-span-8 bg-[#0C0C0E] border border-white/10 rounded-3xl p-6">
              <h4 className="text-sm font-bold uppercase tracking-wider text-[#C8FF00] mb-6">Payment History Records</h4>

              <div className="divide-y divide-white/5 space-y-3 max-h-[350px] overflow-y-auto">
                {paymentsList.length === 0 ? (
                  <div className="text-center py-12 text-white/35 text-xs">
                    No payment instances registered.
                  </div>
                ) : (
                  paymentsList.map((pay) => (
                    <div key={pay.id} className="pt-3 first:pt-0 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-semibold text-white">{pay.planName}</p>
                        <p className="text-[10px] text-white/40 mt-1 font-mono">{pay.date} • Paid via {pay.method}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-mono text-white font-bold">${pay.amount}.00</span>
                        <span className="block text-[8px] mt-0.5 text-emerald-400 font-extrabold uppercase tracking-widest">{pay.status}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}


      {/* AI CONSULTANT TAB */}
      {activeSubTab === 'consultant' && (
        <AIConsultant
          user={user}
          member={member}
          onAddNotification={onAddNotification}
        />
      )}

      {/* AI FORM CHECKER TAB */}
      {activeSubTab === 'formcheck' && (
        <AIFormChecker
          user={user}
          member={member}
          onAddNotification={onAddNotification}
        />
      )}


      {/* LOG PROGRESS DIALOG FORM MODAL */}
      {showMetricsModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0C0C0E] border border-white/10 w-full max-w-lg rounded-[28px] overflow-hidden">
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-[#C8FF00]" />
                <h4 className="text-sm font-bold font-sans text-white uppercase tracking-wider">Log Physical Measurements</h4>
              </div>
              <button
                type="button"
                onClick={() => setShowMetricsModal(false)}
                className="text-white/40 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveMetrics} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] uppercase font-bold text-zinc-400">Current Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={metricsForm.weight}
                    onChange={(e) => setMetricsForm(prev => ({ ...prev, weight: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] uppercase font-bold text-zinc-400">Today steps registered</label>
                  <input
                    type="number"
                    value={metricsForm.steps}
                    onChange={(e) => setMetricsForm(prev => ({ ...prev, steps: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 font-mono">
                  <label className="text-[9px] uppercase font-sans font-bold text-zinc-400">Water Intake Volume (ml)</label>
                  <input
                    type="number"
                    value={metricsForm.waterMl}
                    onChange={(e) => setMetricsForm(prev => ({ ...prev, waterMl: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] uppercase font-bold text-zinc-400">Rest / Sleep DurationgetHours (Hrs)</label>
                  <input
                    type="number"
                    value={metricsForm.sleepHours}
                    onChange={(e) => setMetricsForm(prev => ({ ...prev, sleepHours: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 font-mono text-center">
                <div className="space-y-1">
                  <label className="text-[8px] uppercase font-sans text-zinc-400">Chest (in)</label>
                  <input
                    type="number"
                    value={metricsForm.chest}
                    onChange={(e) => setMetricsForm(prev => ({ ...prev, chest: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-xs focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] uppercase font-sans text-zinc-400">Waist (in)</label>
                  <input
                    type="number"
                    value={metricsForm.waist}
                    onChange={(e) => setMetricsForm(prev => ({ ...prev, waist: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-xs focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] uppercase font-sans text-zinc-400">Hips (in)</label>
                  <input
                    type="number"
                    value={metricsForm.hips}
                    onChange={(e) => setMetricsForm(prev => ({ ...prev, hips: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-xs focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] uppercase font-sans text-zinc-400">Biceps (in)</label>
                  <input
                    type="number"
                    value={metricsForm.biceps}
                    onChange={(e) => setMetricsForm(prev => ({ ...prev, biceps: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#C8FF00] hover:bg-[#B3E500] text-black text-xs font-black uppercase tracking-wider rounded-xl transition duration-150 mt-4"
              >
                Log metrics parameters
              </button>
            </form>
          </div>
        </div>
      )}


      {/* UPGRADE AND FEE PAYMENT FORMS MODAL */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0C0C0E] border border-white/10 w-full max-w-md rounded-[28px] overflow-hidden">
            <div className="p-6 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-[#C8FF00]" />
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">Premium Strive Checkout</h4>
              </div>
              <button onClick={() => setShowPaymentModal(false)} className="text-white/40 hover:text-white"><X className="w-4 h-4" /></button>
            </div>

            <form onSubmit={handleConfirmUpgrade} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[9px] uppercase font-bold text-zinc-400">Selected Option Plan</label>
                <input
                  type="text"
                  readOnly
                  value={`${paymentForm.planName} ($${paymentForm.amount})`}
                  className="w-full bg-white/5 border border-white/5 rounded-xl p-3 text-xs text-white uppercase tracking-wider font-extrabold focus:outline-none"
                />
              </div>

              <div className="space-y-1.5 font-mono">
                <label className="text-[9px] uppercase font-sans font-bold text-zinc-400">Visa / Mastercard Number</label>
                <input
                  type="text"
                  required
                  value={paymentForm.cardNumber}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, cardNumber: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs focus:outline-none text-white font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 font-mono text-center">
                <div className="space-y-1.5">
                  <label className="text-[9px] uppercase font-sans font-bold text-zinc-400">Card Expiry</label>
                  <input
                    type="text"
                    required
                    value={paymentForm.cardExpiry}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, cardExpiry: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] uppercase font-sans font-bold text-zinc-400">CVV Guard</label>
                  <input
                    type="text"
                    required
                    value={paymentForm.cardCvv}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, cardCvv: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="bg-white/[0.01] border border-white/5 p-4 rounded-2xl flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
                <p className="text-[10px] text-white/50 leading-relaxed">
                  Your transaction balance of <strong className="text-white">${paymentForm.amount}.00</strong> is processed instantly via mock StriveAI gateway bypass checks.
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#C8FF00] hover:bg-[#B3E500] text-black text-xs font-black uppercase tracking-wider rounded-xl transition mt-4"
              >
                Confirm Payment & Sync Tier
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
