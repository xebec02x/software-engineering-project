import React, { useState } from 'react';
import { User, Member } from '../types';
import { Sparkles, Award, ShieldAlert, Cpu, Heart, Flame, RefreshCw, Send, FileText, CheckCircle } from 'lucide-react';

interface AIConsultantProps {
  user: User;
  member: Member;
  onAddNotification: (title: string, msg: string) => void;
}

interface ConsultReport {
  type: string;
  summary: string;
  nutritionAdvice: string;
  trainingAdvice: string;
  precautions: string;
  macros: { calories: number; protein: number; carbs: number; fat: number };
  rawRecommendation: string;
}

export default function AIConsultant({ user, member, onAddNotification }: AIConsultantProps) {
  const [selectedSpec, setSelectedSpec] = useState<'hypertrophy' | 'injury' | 'diet' | 'cardio'>('hypertrophy');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [report, setReport] = useState<ConsultReport | null>(null);

  const specialties = {
    hypertrophy: {
      title: 'Hypertrophy & Overload Strategy',
      badge: 'Athletic Prep',
      icon: <Flame className="w-5 h-5 text-orange-400" />,
      description: 'Maximize muscular cross-sectional hypertrophy, optimize progressive overload increments, and design optimal push-pull-legs microcycle parameters.',
      prompt: 'Develop an advanced muscular hypertrophy strategy. Detail rep-ranges, mechanical tension tips, and progressive weight loading principles for my current stats.',
    },
    injury: {
      title: 'Posture & Joint Biomechanics',
      badge: 'Injury Prevention',
      icon: <ShieldAlert className="w-5 h-5 text-emerald-400" />,
      description: 'Examine joint line angles, shoulder retraction habits, back stability on compound movements, and preventative flexibility/mobility protocol planning.',
      prompt: 'Provide a complete biomechanical posture and structural safety audit. List stretches, rotator cuff/spine stability exercises, and form corrections for compound lifts.',
    },
    diet: {
      title: 'Sports Nutrition Metabolism',
      badge: 'Macro Optimization',
      icon: <Flame className="w-5 h-5 text-[#C8FF00]" />,
      description: 'In-depth analysis of caloric expenditures, protein-to-bodyweight equations, nutrient timing around active workouts, and metabolic optimization plans.',
      prompt: 'Construct a premier sports nutrition schema. Include exact calorie targets, daily macro splits, and optimal pre/post workout nutrient fueling schedules.',
    },
    cardio: {
      title: 'VO2 Max & Aerobic Efficiency',
      badge: 'HIIT & Endurance',
      icon: <Heart className="w-5 h-5 text-red-500" />,
      description: 'Analyze aerobic thresholds, VO2 max capacity markers, anaerobic lactate pooling ranges, and systematic cardio recovery intervals.',
      prompt: 'Formulate an advanced aerobic/anaerobic cardiovascular adaptation program. Detail precise HIIT cycles, steady-state cardio zone targets, and active recovery schemes.',
    }
  };

  const handleConsultSubmit = async () => {
    setLoading(true);
    setReport(null);
    setLoadingStep(0);

    const steps = [
      'Establishing connection with AuraFit AI Expert Core...',
      'Analyzing member diagnostics (Height: ' + member.height + 'cm, Weight: ' + member.weight + 'kg, BMI: ' + member.bmi + ')...',
      'Simulating kinematic muscle alignments...',
      'Calculating macronutrient thresholds...',
      'Synthesizing ultimate sports science report...'
    ];

    const interval = setInterval(() => {
      setLoadingStep(prev => {
        if (prev < steps.length - 1) {
          return prev + 1;
        } else {
          clearInterval(interval);
          return prev;
        }
      });
    }, 1200);

    try {
      const res = await fetch('/api/ai/consult', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          consultationType: selectedSpec,
          specTitle: specialties[selectedSpec].title,
          notes: additionalNotes,
          prompt: specialties[selectedSpec].prompt
        })
      });

      clearInterval(interval);

      if (res.ok) {
        const data = await res.json();
        setReport(data.report);
        onAddNotification("Consultation Complete", `AI Consultant generated a comprehensive ${specialties[selectedSpec].title} report.`);
      } else {
        throw new Error("Failed to consult");
      }
    } catch (err) {
      console.error(err);
      // Fallback data
      setReport({
        type: specialties[selectedSpec].title,
        summary: `Highly detailed analysis prepared for ${member.name}. Stature: ${member.height}cm / ${member.weight}kg. Target Fitness Alignment: ${member.fitnessGoal}. Based on structural data, we recommend focusing extensively on clean ranges, structured progressions, and premium recovery intervals.`,
        nutritionAdvice: `Consume approximately 2,900 kcal daily. Distribute intake into 5 primary feeding zones: 180g Protein, 320g Clean Complex Carbs, and 75g essential dietary fats. Prioritize whey isolates and oats surrounding intense workouts.`,
        trainingAdvice: `Undergo a 4-day workout split using upper-lower structure: Monday push elements, Tuesday lower quad development, Thursday pull kinematics, and Friday core/eccentric loading intervals. Focus heavily on complete joint ranges of motion.`,
        precautions: `Restrain from executing high-fat meals within 2 hours of heavy compound workouts to safeguard blood flow allocation. Ensure back lumbar architecture stays neutral when squatting.`,
        macros: { calories: 2900, protein: 180, carbs: 320, fat: 75 },
        rawRecommendation: `Full simulation report finalized. AuraFit Coach advises progressive load steps of 2.5% to 5.0% maximum increments every fortnight on multi-joint operations. Ensure 8 hours of sleep for cellular synthesis.`
      });
      onAddNotification("Demo Consultation Ready", "Generated offline fitness evaluation details successfully.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="ai-consultant-section" className="space-y-8 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="px-3 py-1 bg-white/[0.04] text-[9px] uppercase tracking-wider text-[#C8FF00] rounded-full border border-white/5 font-extrabold flex items-center gap-1.5 w-fit">
            <Cpu className="w-3 h-3 text-[#C8FF00]" /> Science-Based Kinematics Engine
          </span>
          <h3 className="text-3xl font-black uppercase tracking-tight mt-2">AI Premium Specialist</h3>
          <p className="text-xs text-white/40 font-mono">Commission a comprehensive biometric consultation with top-tier AI Sports Science Intelligence</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Input Configuration */}
        <div className="lg:col-span-5 bg-[#0C0C0E] border border-white/10 rounded-3xl p-6 space-y-6 flex flex-col justify-between">
          <div className="space-y-6">
            <h4 className="text-xs font-extrabold uppercase tracking-widest text-[#C8FF00]">Select Consultancy Domain</h4>
            
            <div className="grid grid-cols-1 gap-3">
              {(Object.keys(specialties) as Array<keyof typeof specialties>).map(key => {
                const item = specialties[key];
                const isSelected = selectedSpec === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedSpec(key)}
                    className={`p-4 rounded-2xl border text-left flex items-start gap-3.5 transition ${
                      isSelected 
                        ? 'bg-[#C8FF00]/[0.02] border-[#C8FF00] text-white' 
                        : 'bg-white/[0.01] border-white/5 text-white/60 hover:border-white/10 hover:text-white'
                    }`}
                  >
                    <div className={`p-2 rounded-xl border ${isSelected ? 'bg-[#C8FF00]/10 border-[#C8FF00]/20' : 'bg-white/[0.02] border-white/5'}`}>
                      {item.icon}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs uppercase tracking-wide">{item.title}</span>
                        <span className={`text-[8px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded ${
                          isSelected ? 'bg-[#C8FF00] text-black' : 'bg-white/5 text-white/40'
                        }`}>{item.badge}</span>
                      </div>
                      <p className="text-[10px] text-white/40 leading-relaxed font-sans">{item.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="space-y-2">
              <label className="text-[9px] uppercase tracking-wider font-bold text-zinc-400 flex justify-between">
                <span>Personal Constraints / Notes (Allergies, Old Injuries, Stances)</span>
                <span className="text-white/30 font-normal">Optional</span>
              </label>
              <textarea
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                placeholder="Examples: 'Minor shoulder impingement when pressing', 'Prefer dairy-free macros', 'Goal is deadlift form optimization'..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-xs text-white placeholder-white/20 focus:outline-none focus:border-[#C8FF00] h-28 resize-none transition"
              />
            </div>
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={handleConsultSubmit}
            className="w-full py-4 bg-[#C8FF00] hover:bg-[#B3E500] disabled:bg-[#C8FF00]/40 text-black text-xs font-black uppercase tracking-widest rounded-2xl transition flex items-center justify-center gap-2 mt-6 cursor-pointer"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin-slow text-black" />
                Synthesizing Consultation...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-black" />
                Initiate Premium Consultation
              </>
            )}
          </button>
        </div>

        {/* Right Output View */}
        <div className="lg:col-span-7 bg-[#0C0C0E]/50 border border-white/10 rounded-3xl p-6 min-h-[500px] flex flex-col justify-center relative overflow-hidden">
          {/* Diagnostic Stats Background */}
          <div className="absolute top-4 right-4 text-[9px] font-mono text-white/10 text-right uppercase leading-loose pointer-events-none">
            Diagnostics: {member.height}CM | {member.weight}KG | BMI {member.bmi}<br />
            Target: {member.fitnessGoal}<br />
            Engine: Gemini-3.5-flash
          </div>

          {loading && (
            <div className="text-center space-y-6 max-w-md mx-auto py-12 animate-pulse">
              <div className="p-4 bg-[#C8FF00]/10 border border-[#C8FF00]/20 rounded-full w-fit mx-auto animate-spin-slow">
                <Cpu className="w-8 h-8 text-[#C8FF00]" />
              </div>
              <div className="space-y-2">
                <h5 className="font-extrabold uppercase tracking-widest text-sm text-white">Engineering Diagnostic Analysis</h5>
                <p className="text-[10px] sm:text-xs text-white/40 font-mono italic">"{
                  [
                    'Establishing connection with AuraFit AI Expert Core...',
                    'Analyzing member diagnostics (Height: ' + member.height + 'cm, Weight: ' + member.weight + 'kg, BMI: ' + member.bmi + ')...',
                    'Simulating kinematic muscle alignments...',
                    'Calculating macronutrient thresholds...',
                    'Synthesizing ultimate sports science report...'
                  ][loadingStep]
                }"</p>
              </div>
              {/* Dynamic Loader Progress */}
              <div className="w-48 bg-white/5 border border-white/10 h-1.5 rounded-full mx-auto overflow-hidden">
                <div 
                  className="bg-[#C8FF00] h-full transition-all duration-1000" 
                  style={{ width: `${((loadingStep + 1) / 5) * 100}%` }}
                />
              </div>
            </div>
          )}

          {!loading && !report && (
            <div className="text-center max-w-sm mx-auto p-8 space-y-4">
              <div className="p-3 bg-white/[0.02] border border-white/5 rounded-2xl w-fit mx-auto">
                <FileText className="w-6 h-6 text-white/30" />
              </div>
              <p className="text-xs text-white/50 leading-relaxed font-sans">
                Domain expertise selects will load on-demand analysis. Specify your parameters on the left pane and launch a consultation to retrieve deep kinematic advice.
              </p>
            </div>
          )}

          {!loading && report && (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b border-white/5 pb-4 flex items-center justify-between">
                <div>
                  <span className="text-[9px] uppercase tracking-wider font-extrabold text-[#C8FF00] font-mono">Expert Consulting PDF Print Ready</span>
                  <h4 className="text-lg font-black uppercase text-white mt-0.5 tracking-wide">{report.type}</h4>
                </div>
                <button
                  onClick={() => alert("BIOMETRICS REPORT PRINTED SUCCESSFULLY! Mock PDF download saved under /downloads/AuraFit_Consult_" + member.name.replace(/\s+/g, '_') + '.pdf')}
                  className="px-3.5 py-1.5 bg-white/5 border border-white/10 hover:bg-white/10 text-[10px] text-white font-bold uppercase tracking-wider rounded-xl transition flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" /> Export PDF
                </button>
              </div>

              <div className="space-y-5 text-xs">
                {/* Summary section */}
                <div className="space-y-1.5">
                  <h5 className="font-extrabold uppercase tracking-wider text-white flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-[#C8FF00]" /> Athletic Biometric Summary
                  </h5>
                  <p className="text-white/60 font-sans leading-relaxed bg-white/[0.01] border border-white/5 rounded-xl p-3.5 italic">
                    "{report.summary}"
                  </p>
                </div>

                {/* Macro stats blocks */}
                <div className="grid grid-cols-4 gap-2">
                  <div className="bg-[#0C0C0E] border border-white/5 p-3 rounded-xl text-center">
                    <span className="block text-[8px] text-white/40 uppercase tracking-widest font-sans">Sug. Calories</span>
                    <strong className="text-[#C8FF00] font-mono text-sm block mt-1">{report.macros?.calories || 2900} kcal</strong>
                  </div>
                  <div className="bg-[#0C0C0E] border border-white/5 p-3 rounded-xl text-center">
                    <span className="block text-[8px] text-white/40 uppercase tracking-widest font-sans">Sug. Protein</span>
                    <strong className="text-white font-mono text-sm block mt-1">{report.macros?.protein || 180}g</strong>
                  </div>
                  <div className="bg-[#0C0C0E] border border-white/5 p-3 rounded-xl text-center">
                    <span className="block text-[8px] text-white/40 uppercase tracking-widest font-sans">Complex Carbs</span>
                    <strong className="text-white font-mono text-sm block mt-1">{report.macros?.carbs || 320}g</strong>
                  </div>
                  <div className="bg-[#0C0C0E] border border-white/5 p-3 rounded-xl text-center">
                    <span className="block text-[8px] text-white/40 uppercase tracking-widest font-sans">Essential Fats</span>
                    <strong className="text-white font-mono text-sm block mt-1">{report.macros?.fat || 75}g</strong>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Nutrition segment */}
                  <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-4 space-y-1.5">
                    <h5 className="font-bold uppercase text-[#C8FF00] tracking-wide">Macro & Fueling Advice</h5>
                    <p className="text-white/60 font-sans leading-relaxed text-[11px] whitespace-pre-wrap">{report.nutritionAdvice}</p>
                  </div>

                  {/* Splits segment */}
                  <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-4 space-y-1.5">
                    <h5 className="font-bold uppercase text-white tracking-wide">Recommended Training Protocol</h5>
                    <p className="text-white/60 font-sans leading-relaxed text-[11px] whitespace-pre-wrap">{report.trainingAdvice}</p>
                  </div>
                </div>

                {/* Precautions warnings */}
                <div className="bg-red-500/[0.02] border border-red-500/15 rounded-2xl p-4 flex items-start gap-2.5">
                  <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5 animate-pulse" />
                  <div className="space-y-1">
                    <h5 className="font-extrabold uppercase tracking-wide text-red-400 text-[10px]">Kinematic Precautions & Posture Safeguards</h5>
                    <p className="text-white/60 font-sans leading-relaxed text-[11px]">{report.precautions}</p>
                  </div>
                </div>

                {/* Raw system recommendation details */}
                <div className="text-[10px] font-mono text-zinc-500 bg-black/20 p-3 rounded-xl border border-white/[0.02] mt-2">
                  <span className="text-[#C8FF00] font-bold">SYSTEM REPORT STAMP //</span> {report.rawRecommendation}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
