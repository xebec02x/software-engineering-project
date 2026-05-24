import React, { useState, useEffect } from 'react';
import {
  Users, Dumbbell, Apple, Heart, Activity, CheckCircle, Search, Plus, Trash2, Calendar, Edit, ArrowRight
} from 'lucide-react';
import { Trainer, Member, WorkoutPlan, DietPlan, LoggedMeal, HealthProgress, User } from '../types';

interface TrainerDashboardProps {
  user: User;
  trainer: Trainer;
  onAddNotification: (title: string, msg: string) => void;
}

export default function TrainerDashboard({ user, trainer, onAddNotification }: TrainerDashboardProps) {
  // Navigation
  const [activeTab, setActiveTab] = useState<'members' | 'workouts' | 'nutrition' | 'attendance'>('members');

  // Client lists
  const [clients, setClients] = useState<Member[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');

  // Active Selected client states
  const [selectedClientWorkouts, setSelectedClientWorkouts] = useState<WorkoutPlan[]>([]);
  const [selectedClientDiets, setSelectedClientDiets] = useState<DietPlan[]>([]);
  const [selectedClientProgress, setSelectedClientProgress] = useState<HealthProgress[]>([]);

  // Search filter
  const [memberSearchQuery, setMemberSearchQuery] = useState('');

  // New Workout Creator Form States
  const [newWorkoutTitle, setNewWorkoutTitle] = useState('Personal Extreme Hypertrophy Split');
  const [exercisesList, setExercisesList] = useState<any[]>([
    { day: 'Monday', name: 'Barbell Bench Press', sets: 4, reps: 8, weight: '80kg', notes: 'Keep dynamic movement' }
  ]);
  const [newExerciseRow, setNewExerciseRow] = useState({
    day: 'Monday', name: '', sets: 3, reps: 10, weight: '', notes: ''
  });

  // Diet Formulation Form states
  const [newDietForm, setNewDietForm] = useState({
    title: 'Custom Hypertrophy Diet Blueprint',
    dailyCalories: 2800,
    protein: 170,
    carbs: 300,
    fats: 70
  });

  useEffect(() => {
    fetchTrainerPortalData();
  }, [trainer.id]);

  useEffect(() => {
    if (selectedClientId) {
      fetchClientInformation(selectedClientId);
    }
  }, [selectedClientId]);

  const fetchTrainerPortalData = async () => {
    try {
      const res = await fetch(`/api/trainer/members/${trainer.id}`);
      if (res.ok) {
        const list = await res.json();
        setClients(list);
        if (list.length > 0) {
          setSelectedClientId(list[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchClientInformation = async (clientId: string) => {
    try {
      // Workouts
      const resW = await fetch(`/api/workouts/member/${clientId}`);
      if (resW.ok) setSelectedClientWorkouts(await resW.json());

      // Diets
      const resD = await fetch(`/api/diets/member/${clientId}`);
      if (resD.ok) setSelectedClientDiets(await resD.json());

      // Progress logs
      const resP = await fetch(`/api/progress/member/${clientId}`);
      if (resP.ok) setSelectedClientProgress(await resP.json());
    } catch (e) {
      console.error(e);
    }
  };

  const handlePushWorkoutPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId) {
      alert("Choose a client to assign this routine");
      return;
    }
    if (exercisesList.length === 0) {
      alert("Please add at least one exercise step to the routine catalog");
      return;
    }

    try {
      const res = await fetch('/api/workouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: selectedClientId,
          trainerId: trainer.id,
          title: newWorkoutTitle,
          exercises: exercisesList
        })
      });
      if (res.ok) {
        onAddNotification("Plan Cataloged!", `Successfully published fitness program split of '${newWorkoutTitle}'!`);
        alert("Workout routine published successfully to client portal!");
        fetchClientInformation(selectedClientId);
        setNewWorkoutTitle('Personal Muscle Conditioning Split');
        setExercisesList([{ day: 'Monday', name: 'Plank Holds', sets: 3, reps: 1, weight: 'Bodyweight', notes: '60s hold' }]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddExerciseRow = () => {
    if (!newExerciseRow.name) return;
    setExercisesList(prev => [...prev, { ...newExerciseRow }]);
    setNewExerciseRow({ day: 'Monday', name: '', sets: 3, reps: 10, weight: '', notes: '' });
  };

  const handleRemoveExerciseRow = (idx: number) => {
    setExercisesList(prev => prev.filter((_, i) => i !== idx));
  };

  const handlePushDietBlueprint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId) {
      alert("Choose a client to configure diet target parameters");
      return;
    }

    try {
      const res = await fetch('/api/diets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: selectedClientId,
          trainerId: trainer.id,
          title: newDietForm.title,
          dailyCalorieTarget: newDietForm.dailyCalories,
          proteinTarget: newDietForm.protein,
          carbTarget: newDietForm.carbs,
          fatTarget: newDietForm.fats,
          meals: [
            { category: 'Breakfast', name: 'Whey Protein shake & Oats', description: 'Clean morning carb starter', calories: 500, protein: 40, carbs: 60, fat: 8 },
            { category: 'Lunch', name: 'Steamed Chicken breast and rice', description: 'Lean muscle development', calories: 650, protein: 50, carbs: 80, fat: 12 },
            { category: 'Dinner', name: 'Salmon and asparagus rods', description: 'Healthy fats & omega fatty acids', calories: 680, protein: 45, carbs: 40, fat: 22 }
          ]
        })
      });
      if (res.ok) {
        onAddNotification("Macros Synchronized!", "Updated standard macro allocations for client diet logs.");
        alert("Macro and Diet Target updated in client records!");
        fetchClientInformation(selectedClientId);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const activeClientObj = clients.find(c => c.id === selectedClientId);

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 text-white">
      {/* Dynamic Sub Tab controls */}
      <div className="flex border-b border-white/10 pb-1 overflow-x-auto gap-4 scrollbar-none">
        {[
          { id: 'members', name: 'Associated Clients' },
          { id: 'workouts', name: 'Routine Assigner' },
          { id: 'nutrition', name: 'Macro Diet Configurator' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-3 font-semibold text-xs md:text-sm uppercase tracking-widest relative whitespace-nowrap transition-colors ${
              activeTab === tab.id ? 'text-[#C8FF00]' : 'text-white/40 hover:text-white'
            }`}
          >
            {tab.name}
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#C8FF00]"></span>
            )}
          </button>
        ))}
      </div>

      {/* ASSOCIATED CLIENTS LIST OVERVIEW INTERFACE */}
      {activeTab === 'members' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Members search list block */}
          <div className="lg:col-span-4 bg-[#0C0C0E] border border-white/10 rounded-3xl p-6 space-y-4">
            <div>
              <h3 className="font-bold text-[#C8FF00] text-sm uppercase tracking-wider">Client Roster</h3>
              <p className="text-[11px] text-white/40">Select gym-goer to view physical compliance logs</p>
            </div>

            <div className="relative flex items-center">
              <input
                type="text"
                value={memberSearchQuery}
                onChange={(e) => setMemberSearchQuery(e.target.value)}
                placeholder="Find client name..."
                className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#C8FF00]"
              />
              <Search className="w-3.5 h-3.5 text-white/40 absolute left-3.5" />
            </div>

            <div className="space-y-2">
              {clients
                .filter(c => c.name.toLowerCase().includes(memberSearchQuery.toLowerCase()))
                .map((cli) => (
                  <button
                    key={cli.id}
                    onClick={() => setSelectedClientId(cli.id)}
                    className={`w-full text-left p-3.5 rounded-2xl flex items-center gap-3.5 border transition ${
                      selectedClientId === cli.id
                        ? 'bg-[#C8FF00]/10 border-[#C8FF00]/50'
                        : 'bg-white/[0.01] border-white/5 hover:bg-white/5'
                    }`}
                  >
                    <img 
                      src={cli.avatar} 
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-xl object-cover shrink-0 border border-white/10" 
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white truncate">{cli.name}</p>
                      <p className="text-[10px] text-white/40 font-mono mt-0.5 uppercase tracking-widest">{cli.fitnessGoal} Target</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[#C8FF00] shrink-0" />
                  </button>
                ))}
            </div>
          </div>

          {/* Compliance physical overview of selected member client */}
          <div className="lg:col-span-8 space-y-6">
            {activeClientObj ? (
              <div className="bg-[#0C0C0E] border border-white/10 rounded-3xl p-6 md:p-8 space-y-8">
                {/* Visual Bio Banner */}
                <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between border-b border-white/5 pb-6">
                  <div className="flex items-center gap-4">
                    <img 
                      src={activeClientObj.avatar} 
                      referrerPolicy="no-referrer"
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-[#C8FF00]/40 shadow-md" 
                    />
                    <div>
                      <h4 className="text-xl font-black text-white">{activeClientObj.name}</h4>
                      <p className="text-xs text-white/50">{activeClientObj.email} • {activeClientObj.membershipType}</p>
                      <p className="text-[11px] text-[#C8FF00] font-mono mt-1 uppercase font-bold">Goal parameter: {activeClientObj.fitnessGoal}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-6 font-mono text-center">
                    <div className="bg-white/[0.02] border border-white/5 p-2 rounded-xl">
                      <span className="text-[9px] text-zinc-400 block font-sans">Weight</span>
                      <strong className="text-sm font-black text-white">{activeClientObj.weight} kg</strong>
                    </div>
                    <div className="bg-white/[0.02] border border-white/5 p-2 rounded-xl">
                      <span className="text-[9px] text-zinc-400 block font-sans">BMI Score</span>
                      <strong className="text-sm font-black text-[#C8FF00]">{activeClientObj.bmi}</strong>
                    </div>
                    <div className="bg-white/[0.02] border border-white/5 p-2 rounded-xl">
                      <span className="text-[9px] text-zinc-400 block font-sans">Age</span>
                      <strong className="text-sm font-black text-white">{activeClientObj.age} Yrs</strong>
                    </div>
                  </div>
                </div>

                {/* Sub features compliance check items */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Assigned Blueprints status */}
                  <div className="space-y-4">
                    <h5 className="font-bold text-xs uppercase tracking-wider text-[#C8FF00]">Assigned Routines</h5>
                    {selectedClientWorkouts.length === 0 ? (
                      <p className="text-xs text-white/30 italic">No exercises logged yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {selectedClientWorkouts.map((w, idx) => (
                          <div key={idx} className="bg-white/[0.01] border border-white/5 p-3 rounded-xl flex justify-between items-center text-xs">
                            <div>
                              <p className="font-bold text-white">{w.title}</p>
                              <p className="text-[9px] text-white/40 mt-0.5">{w.exercises.length} distinct movements assigned</p>
                            </div>
                            <span className="text-[#C8FF00] font-mono text-[10px] font-bold">Active</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Weight history checklist */}
                  <div className="space-y-4">
                    <h5 className="font-bold text-xs uppercase tracking-wider text-[#C8FF00]">Weight progression</h5>
                    {selectedClientProgress.length === 0 ? (
                      <p className="text-xs text-white/30 italic">No progress checkins logged by member yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {selectedClientProgress.slice(-4).map((p, idx) => (
                          <div key={idx} className="bg-white/[0.01] border border-white/5 p-3 rounded-xl flex justify-between items-center text-xs font-mono">
                            <span className="font-sans text-white/50">{p.date} Checkin</span>
                            <span className="text-white font-bold">{p.weight} kg (BMI: {p.bmi || 'Normal'})</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-20 text-white/40 text-xs bg-[#0C0C0E] border border-white/10 rounded-3xl">
                Please assign or link clients under your Sarah roster tab.
              </div>
            )}
          </div>
        </div>
      )}

      {/* WORKOUT INTERACTION SPLIT ROSTER ASSIGNER */}
      {activeTab === 'workouts' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 bg-[#0C0C0E] border border-white/10 rounded-3xl p-6 space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-[#C8FF00]">Targets Selection</h4>
            <p className="text-xs text-white/50">Pick member client to receive programmatic exercises</p>
            <div className="space-y-2">
              {clients.map(cl => (
                <button
                  key={cl.id}
                  onClick={() => setSelectedClientId(cl.id)}
                  className={`w-full text-left p-3 rounded-xl border text-xs flex justify-between items-center transition ${
                    selectedClientId === cl.id ? 'bg-[#C8FF00]/10 border-[#C8FF00]/30 text-white' : 'bg-white/[0.01] border-white/5 text-zinc-400 hover:bg-white/5'
                  }`}
                >
                  <span>{cl.name}</span>
                  <span className="font-mono font-bold text-[9px] uppercase">{cl.fitnessGoal}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-8 bg-[#0C0C0E] border border-white/10 rounded-3xl p-6 md:p-8 space-y-6">
            <div className="border-b border-white/5 pb-4">
              <h4 className="font-bold text-base text-white">Create Gym Routine Assigned Split</h4>
              <p className="text-xs text-white/40">These exercises push instantly into client overview badge panels</p>
            </div>

            <form onSubmit={handlePushWorkoutPlan} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-zinc-400">Workout Roster Title</label>
                <input
                  type="text"
                  required
                  value={newWorkoutTitle}
                  onChange={(e) => setNewWorkoutTitle(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs focus:outline-none text-white focus:border-[#C8FF00]"
                />
              </div>

              {/* Rows added exercise tracker */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-zinc-400 block pb-1 border-b border-white/5">Movement list items</label>
                {exercisesList.map((ex, exIdx) => (
                  <div key={exIdx} className="bg-white/[0.02] border border-white/5 rounded-xl p-3 flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-white">{ex.name}</p>
                      <p className="text-[11px] text-white/40 mt-0.5">{ex.day} • {ex.sets}x{ex.reps} {ex.weight ? `@ ${ex.weight}` : ''} • notes: {ex.notes || 'Normal sets'}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveExerciseRow(exIdx)}
                      className="text-red-400 hover:text-red-300 p-1 rounded hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add exercise sub form interactive row UI */}
              <div className="bg-[#09090B] border border-white/5 p-4 rounded-2xl space-y-4">
                <span className="text-[9px] uppercase tracking-widest font-black text-[#C8FF00] block mb-2">Configure Movement Parameters</span>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[8px] uppercase text-zinc-500 font-bold">Movement Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Incline Bench Press"
                      value={newExerciseRow.name}
                      onChange={(e) => setNewExerciseRow(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full bg-white/5 border border-white/15 rounded-lg p-2.5 text-xs focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] uppercase text-zinc-500 font-bold">Training Day</label>
                    <select
                      value={newExerciseRow.day}
                      onChange={(e) => setNewExerciseRow(prev => ({ ...prev, day: e.target.value }))}
                      className="w-full bg-white/5 border border-white/15 rounded-lg p-2.5 text-xs text-white focus:outline-none"
                    >
                      <option value="Monday" className="bg-[#09090B]">Monday</option>
                      <option value="Tuesday" className="bg-[#09090B]">Tuesday</option>
                      <option value="Wednesday" className="bg-[#09090B]">Wednesday</option>
                      <option value="Thursday" className="bg-[#09090B]">Thursday</option>
                      <option value="Friday" className="bg-[#09090B]">Friday</option>
                      <option value="Saturday" className="bg-[#09090B]">Saturday</option>
                      <option value="Sunday" className="bg-[#09090B]">Sunday</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                  <div className="space-y-1">
                    <label className="text-[8px] uppercase text-zinc-500 font-sans">Sets target</label>
                    <input
                      type="number"
                      value={newExerciseRow.sets}
                      onChange={(e) => setNewExerciseRow(prev => ({ ...prev, sets: parseInt(e.target.value) || 3 }))}
                      className="w-full bg-white/5 border border-white/15 rounded-lg p-2 focus:outline-none text-center"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] uppercase text-zinc-500 font-sans">Reps target</label>
                    <input
                      type="number"
                      value={newExerciseRow.reps}
                      onChange={(e) => setNewExerciseRow(prev => ({ ...prev, reps: parseInt(e.target.value) || 10 }))}
                      className="w-full bg-white/5 border border-white/15 rounded-lg p-2 focus:outline-none text-center"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] uppercase text-zinc-500 font-sans">Limit weight (kg/lbs)</label>
                    <input
                      type="text"
                      placeholder="e.g. 75 kg"
                      value={newExerciseRow.weight}
                      onChange={(e) => setNewExerciseRow(prev => ({ ...prev, weight: e.target.value }))}
                      className="w-full bg-white/5 border border-white/15 rounded-lg p-2 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[8px] uppercase text-zinc-500 font-bold">Coach Advice Notes</label>
                  <input
                    type="text"
                    placeholder="Focus deep contraction..."
                    value={newExerciseRow.notes}
                    onChange={(e) => setNewExerciseRow(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full bg-white/5 border border-white/15 rounded-lg p-2 focus:outline-none text-xs"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleAddExerciseRow}
                  className="w-full py-2 bg-white/10 hover:bg-white/15 border border-white/10 text-white text-[10px] uppercase font-black tracking-widest rounded-lg"
                >
                  Log Exercise Step to stack
                </button>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#C8FF00] hover:bg-[#B3E500] text-black text-xs font-black uppercase tracking-wider rounded-xl transition mt-6"
              >
                Compile and Publish entire workout plan
              </button>
            </form>
          </div>
        </div>
      )}

      {/* NUTRITION CONFIGURATOR SYSTEM FOR TRAINERS */}
      {activeTab === 'nutrition' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 bg-[#0C0C0E] border border-white/10 rounded-3xl p-6 space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-[#C8FF00]">Client selection</h4>
            <p className="text-xs text-white/50">Pick member client to adjust nutritional allocations</p>
            <div className="space-y-2">
              {clients.map(cl => (
                <button
                  key={cl.id}
                  onClick={() => setSelectedClientId(cl.id)}
                  className={`w-full text-left p-3 rounded-xl border text-xs flex justify-between items-center transition ${
                    selectedClientId === cl.id ? 'bg-[#C8FF00]/10 border-[#C8FF00]/30 text-white' : 'bg-white/[0.01] border-white/5 text-zinc-400 hover:bg-white/5'
                  }`}
                >
                  <span>{cl.name}</span>
                  <span className="font-mono font-bold text-[9px] text-[#C8FF00]">{cl.weight} kg</span>
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-8 bg-[#0C0C0E] border border-white/10 rounded-3xl p-6 md:p-8 space-y-6">
            <div className="border-b border-white/5 pb-4">
              <h4 className="font-bold text-base text-white font-sans uppercase tracking-wider">Macros Nutrition formulation</h4>
              <p className="text-xs text-white/40">Synchronize required protein grams and energetic caloric thresholds</p>
            </div>

            <form onSubmit={handlePushDietBlueprint} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-zinc-400">Meal Blueprint Title</label>
                <input
                  type="text"
                  required
                  value={newDietForm.title}
                  onChange={(e) => setNewDietForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 text-xs rounded-xl p-3 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 font-mono">
                  <label className="text-[9px] uppercase font-sans font-bold text-zinc-400">Daily Calorie Target (Kcal)</label>
                  <input
                    type="number"
                    required
                    value={newDietForm.dailyCalories}
                    onChange={(e) => setNewDietForm(prev => ({ ...prev, dailyCalories: parseInt(e.target.value) || 2000 }))}
                    className="w-full bg-white/5 border border-white/10 p-3 rounded-xl focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5 font-mono">
                  <label className="text-[9px] uppercase font-sans font-bold text-zinc-400">Target Protein (g)</label>
                  <input
                    type="number"
                    required
                    value={newDietForm.protein}
                    onChange={(e) => setNewDietForm(prev => ({ ...prev, protein: parseInt(e.target.value) || 140 }))}
                    className="w-full bg-white/5 border border-[#C8FF00]/40 p-3 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 font-mono">
                <div className="space-y-1.5">
                  <label className="text-[9px] uppercase font-sans font-bold text-zinc-400">Target Carbohydrates (g)</label>
                  <input
                    type="number"
                    value={newDietForm.carbs}
                    onChange={(e) => setNewDietForm(prev => ({ ...prev, carbs: parseInt(e.target.value) || 200 }))}
                    className="w-full bg-white/5 border border-white/10 p-3 rounded-xl focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] uppercase font-sans font-bold text-zinc-400">Target Lipids/Fats (g)</label>
                  <input
                    type="number"
                    value={newDietForm.fats}
                    onChange={(e) => setNewDietForm(prev => ({ ...prev, fats: parseInt(e.target.value) || 60 }))}
                    className="w-full bg-white/5 border border-white/10 p-3 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#C8FF00] text-black hover:bg-[#B3E500] text-xs font-black uppercase tracking-wider rounded-xl transition mt-4"
              >
                Pushed standard daily requirements blueprint
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
