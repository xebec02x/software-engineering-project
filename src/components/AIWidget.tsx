import React, { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, MessageSquare, Mic, MicOff, RefreshCw, X, HelpCircle, Flame } from 'lucide-react';
import { AIChatMessage, User, Member } from '../types';

interface AIWidgetProps {
  user: User | null;
  member: Member | null;
  inlineVariant?: boolean;
}

const DEFAULT_PROMPTS = [
  "How can I lose weight?",
  "Create a chest workout",
  "Give me a 2500 calorie plan",
  "Suggest beginner exercises",
  "How much protein do I need?"
];

const DAILY_MOTIVATIONS = [
  "No citizen has a right to be an amateur in the matter of physical training. It is a shame for a man to grow old without seeing the beauty and strength of which his body is capable.",
  "Your struggle today is developing the strength you absolutely need for tomorrow. Do not compromise.",
  "The iron never lies to you. You can walk outside and listen to all kinds of talk, get told that you're a god or a total bastard. But 200 pounds is always 200 pounds.",
  "Do not pray for an easy life, pray for the strength to endure a difficult one and lift heavy.",
  "Energy flows where attention goes. Focus with absolute clarity on your lifting tempo today."
];

export default function AIWidget({ user, member, inlineVariant = false }: AIWidgetProps) {
  const [messages, setMessages] = useState<AIChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [dailyTip, setDailyTip] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Select daily physical wisdom
    const dayIndex = new Date().getDate() % DAILY_MOTIVATIONS.length;
    setDailyTip(DAILY_MOTIVATIONS[dayIndex]);

    if (user) {
      fetchHistory();
    }
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchHistory = async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/ai/history/${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (e) {
      console.error("Failed to load virtual coach chat history", e);
    }
  };

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || !user) return;
    const prompt = textToSend;
    setInputText('');
    setLoading(true);

    // Optimistically add user message
    const tempUserMsg: AIChatMessage = {
      id: `temp-${Date.now()}`,
      userId: user.id,
      role: 'user',
      text: prompt,
      createdAt: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, question: prompt })
      });
      if (res.ok) {
        const data = await res.json();
        // server returns userMessage, aiMessage, and fullHistory updated
        setMessages(data.allHistory);
      } else {
        throw new Error("Bad status");
      }
    } catch (e) {
      // Add offline error response
      const fallbackMsgs: AIChatMessage[] = [
        ...messages,
        tempUserMsg,
        {
          id: `err-${Date.now()}`,
          userId: user.id,
          role: 'model',
          text: `[Coach Connectivity Guard] As your virtual trainer, I recommend continuing your **${member?.fitnessGoal || 'general strength'}** program. Keep aiming for an adequate protein split!`,
          createdAt: new Date().toISOString()
        }
      ];
      setMessages(fallbackMsgs);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendMessage(inputText);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      // Simulate input voice-to-text
      const voicePhrases = [
        "Create a fast muscle building snack",
        "Give me a gym routine for beginners",
        "How can I stay motivated to exercise?",
        "What is my current BMI score?"
      ];
      const phrase = voicePhrases[Math.floor(Math.random() * voicePhrases.length)];
      setInputText(phrase);
    } else {
      setIsRecording(true);
      // Auto-stop after 3 seconds for simulation
      setTimeout(() => {
        setIsRecording(prev => {
          if (prev) {
            const voicePhrases = [
              "Create a high-protein breakfast recipe",
              "Suggest a solid leg workout circuit",
              "Suggest macro nutrients for weight gain",
              "Analyze my current weight metrics"
            ];
            setInputText(voicePhrases[Math.floor(Math.random() * voicePhrases.length)]);
          }
          return false;
        });
      }, 2500);
    }
  };

  if (inlineVariant) {
    // Beautiful compact embedding layout inside the dashboard
    return (
      <div className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden flex flex-col h-full">
        {/* Header indicator */}
        <div className="p-4 border-b border-white/5 bg-white/[0.04] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#C8FF00]" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Interactive Voice Coach</h4>
          </div>
          <span className="text-[10px] bg-[#C8FF00]/10 text-[#C8FF00] px-2 py-0.5 rounded-full font-bold">AuraFit Agent</span>
        </div>

        {/* Motivation marquee */}
        <div className="p-3 bg-white/[0.01] border-b border-white/5 text-[11px] text-white/70 italic flex items-start gap-2">
          <Flame className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
          <span>"{dailyTip}"</span>
        </div>

        {/* Live Chat History */}
        <div className="flex-1 p-4 space-y-3 overflow-y-auto max-h-[300px] text-xs">
          {messages.length === 0 ? (
            <div className="text-center py-6 text-white/40">
              <MessageSquare className="w-8 h-8 mx-auto opacity-30 mb-2" />
              <p>Ask AuraFit any sport or macro question!</p>
            </div>
          ) : (
            messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col gap-1 max-w-[85%] ${
                  m.role === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'
                }`}
              >
                <div
                  className={`p-3 rounded-xl whitespace-pre-line leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-[#C8FF00] text-black font-medium rounded-tr-none'
                      : 'bg-white/5 text-white/90 rounded-tl-none border border-white/5'
                  }`}
                >
                  {m.text}
                </div>
                <span className="text-[9px] text-white/30 px-1">
                  {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))
          )}
          {loading && (
            <div className="flex items-center gap-1.5 text-white/40 italic py-1 pl-1">
              <span className="w-1.5 h-1.5 bg-[#C8FF00] rounded-full animate-bounce"></span>
              <span className="w-1.5 h-1.5 bg-[#C8FF00] rounded-full animate-bounce delay-100"></span>
              <span className="w-1.5 h-1.5 bg-[#C8FF00] rounded-full animate-bounce delay-200"></span>
              <span className="text-[10px]">AuraFit is calculating...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input panel with suggestions */}
        <div className="p-3 border-t border-white/5 bg-white/[0.01]">
          {/* Quick recommendations */}
          <div className="flex gap-1.5 pb-2.5 overflow-x-auto scrollbar-none">
            {DEFAULT_PROMPTS.slice(0, 3).map((p, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(p)}
                className="text-[9px] bg-white/5 hover:bg-white/10 hover:border-[#C8FF00]/40 border border-white/5 text-white/60 px-2 py-1 rounded-full whitespace-nowrap transition"
              >
                {p}
              </button>
            ))}
          </div>

          <div className="flex gap-2 relative">
            <button
              onClick={toggleRecording}
              className={`p-2.5 rounded-xl transition shrink-0 flex items-center justify-center ${
                isRecording
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
              title="Simulate Voice Input Transcription"
            >
              <Mic className="w-4 h-4" />
            </button>

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Query exercises weight limits, caloric targets..."
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#C8FF00]/60"
            />

            <button
              onClick={() => handleSendMessage(inputText)}
              disabled={loading || !inputText.trim()}
              className="bg-[#C8FF00] text-black hover:opacity-90 disabled:opacity-40 p-2.5 rounded-xl transition font-bold"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          {isRecording && (
            <p className="text-[10px] text-red-400 mt-1.5 animate-pulse text-center font-bold">
              Listening to voice frequencies... Click again to finalize transcript!
            </p>
          )}
        </div>
      </div>
    );
  }

  // Floating Messenger Interface
  return (
    <>
      {/* Floating Sparkle Action button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 bg-[#C8FF00] text-black w-14 h-14 rounded-full flex items-center justify-center shadow-[0_8px_30px_rgb(200,255,0,0.3)] hover:scale-105 transition-transform duration-200"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Sparkles className="w-6 h-6 animate-pulse" />}
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-96 h-[500px] bg-[#0C0C0E] border border-white/10 rounded-[28px] overflow-hidden flex flex-col shadow-2xl animate-in fade-in slide-in-from-bottom-6">
          {/* Top Panel Banner */}
          <div className="p-4 bg-white/5 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-black border border-[#C8FF00]/50 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-[#C8FF00]" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-widest">AuraFit Coaching Chat</h4>
                <p className="text-[9px] text-[#C8FF00]">Virtual Personal Assistant Online</p>
              </div>
            </div>

            <button
              onClick={() => {
                if (confirm("Reset chat history?")) {
                  setMessages([]);
                }
              }}
              title="Reset Chat State"
              className="text-white/40 hover:text-white p-1 rounded-full hover:bg-white/5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Motivational Tip Bar */}
          <div className="p-3 bg-white/[0.02] border-b border-white/5 text-[10px] text-[#C8FF00]/80 italic overflow-hidden flex gap-2 items-center leading-relaxed">
            <Flame className="w-3.5 h-3.5 shrink-0 text-orange-400" />
            <span className="truncate">"{dailyTip}"</span>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 p-4 space-y-3 overflow-y-auto max-h-[340px]">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-3 p-4">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-[#C8FF00]" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-white">Need a dynamic workout?</h5>
                  <p className="text-[10px] text-white/40 mt-1 max-w-[200px]">
                    I know your height, weight & goals. Type any fitness or meal question!
                  </p>
                </div>
              </div>
            ) : (
              messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col gap-1 max-w-[85%] ${
                    m.role === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'
                  }`}
                >
                  <div
                    className={`p-3 rounded-2xl whitespace-pre-line text-xs font-medium ${
                      m.role === 'user'
                        ? 'bg-[#C8FF00] text-black rounded-tr-none'
                        : 'bg-white/5 text-white/90 rounded-tl-none border border-white/5'
                    }`}
                  >
                    {m.text}
                  </div>
                  <span className="text-[8px] text-white/20 px-1">
                    {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            )}
            {loading && (
              <div className="flex items-center gap-1.5 text-white/30 italic text-xs">
                <span className="w-2 h-2 bg-[#C8FF00] rounded-full animate-ping"></span>
                <span>Calculating calories...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Prompt options */}
          <div className="px-3 py-1 bg-[#09090B]/60 flex gap-1.5 overflow-x-auto scrollbar-none border-t border-white/5">
            {DEFAULT_PROMPTS.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(p)}
                className="text-[9px] bg-white/5 whitespace-nowrap px-2.5 py-1 rounded-full border border-white/5 text-white/50 hover:text-white hover:border-[#C8FF00]/30 transition"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Bottom input area */}
          <div className="p-4 bg-[#09090B] border-t border-white/5">
            <div className="flex gap-2 relative">
              <button
                onClick={toggleRecording}
                className={`p-2.5 rounded-xl transition ${
                  isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
                title="Voice Recording Simulator"
              >
                <Mic className="w-4 h-4" />
              </button>

              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Ask trainer about macros, squats..."
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#C8FF00]/50"
              />

              <button
                onClick={() => handleSendMessage(inputText)}
                disabled={loading || !inputText.trim()}
                className="bg-[#C8FF00] text-black hover:opacity-95 disabled:opacity-30 p-2.5 rounded-xl font-bold font-mono transition"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            {isRecording && (
              <div className="text-[10px] text-red-400 mt-2 text-center animate-pulse font-bold">
                Transcribing physical signals... Click Mic key again to lock transcript phrase.
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
