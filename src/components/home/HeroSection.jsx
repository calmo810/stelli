import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const STEPS = [
  {
    key: 'moment',
    label: 'Moment',
    prompt: "What are you celebrating?",
    placeholder: 'Choose the moment',
    type: 'dropdown',
    options: ['Birthday', 'Dinner', 'Rooftop Hang', 'Music Video', 'Restaurant Opening', 'Content Day', 'Proposal', 'Wedding', 'Corporate', 'Custom'],
  },
  {
    key: 'where',
    label: 'Where',
    prompt: 'Where in New York?',
    placeholder: 'Any neighborhood',
    type: 'dropdown',
    options: ['Anywhere in NYC', 'Williamsburg', 'Bushwick', 'DUMBO', 'Lower East Side', 'Harlem', 'West Village', 'SoHo', 'Chelsea', 'Greenpoint'],
  },
  {
    key: 'when',
    label: 'When',
    prompt: 'Pick a date',
    type: 'date',
  },
];

export default function HeroSection() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef(null);
  const currentStep = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const isComplete = step >= STEPS.length;

  const handleSelect = (value) => {
    const newAnswers = { ...answers, [currentStep.key]: value };
    setAnswers(newAnswers);
    setShowDropdown(false);
    if (isLast) doSearch(newAnswers);
    else setStep(s => s + 1);
  };

  const handleDateChange = (e) => { if (e.target.value) handleSelect(e.target.value); };

  const doSearch = (a) => {
    const params = new URLSearchParams();
    const ans = a || answers;
    if (ans.moment && ans.moment !== 'Custom') params.set('event_type', ans.moment.toLowerCase().replace(/ /g, '_'));
    if (ans.where && ans.where !== 'Anywhere in NYC') params.set('neighborhood', ans.where);
    navigate(`/browse?${params.toString()}`);
  };

  const reset = () => { setStep(0); setAnswers({}); setShowDropdown(false); };

  useEffect(() => {
    if (!showDropdown) return;
    const handler = (e) => { if (containerRef.current && !containerRef.current.contains(e.target)) setShowDropdown(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showDropdown]);

  useEffect(() => { if (currentStep?.type === 'dropdown') setShowDropdown(true); }, [step]);

  return (
    <section className="relative min-h-screen bg-[#F5F4EF] flex flex-col overflow-hidden">
      {/* Scribble annotations */}
      <span className="absolute top-32 right-[12%] font-display italic text-[11px] text-[#1a2a6c]/20 rotate-6 select-none pointer-events-none">"golden hour"</span>
      <span className="absolute bottom-48 left-[6%] font-display italic text-[10px] text-[#1a2a6c]/15 -rotate-3 select-none pointer-events-none">"worth remembering"</span>
      <span className="absolute top-[45%] right-[4%] text-[#1a2a6c]/10 text-2xl select-none pointer-events-none">✦</span>
      <span className="absolute top-[70%] left-[3%] text-[#1a2a6c]/8 text-lg select-none pointer-events-none">✦</span>

      <div className="relative z-10 flex-1 flex flex-col justify-center px-8 md:px-16 lg:px-28 pt-28 pb-20 max-w-[1300px] mx-auto w-full">

        {/* Eyebrow */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7 }}
          className="text-[9px] font-body tracking-[0.4em] text-[#1a2a6c]/35 uppercase mb-10 flex items-center gap-3"
        >
          <span className="inline-block w-10 h-px bg-[#1a2a6c]/20" />
          N.Y.C — 2026 · Vol. 01
        </motion.p>

        {/* Main headline — pitch deck style */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.05 }}
          className="mb-10"
        >
          <h1 className="font-display text-[clamp(52px,8vw,120px)] leading-[0.92] font-semibold text-[#1a2a6c] tracking-tight">
            Some moments
          </h1>
          <h1 className="font-display text-[clamp(52px,8vw,120px)] leading-[0.92] font-semibold text-[#1a2a6c] tracking-tight flex items-baseline gap-4 flex-wrap">
            only happen
            <span className="italic font-display text-[clamp(52px,8vw,120px)]">once.</span>
          </h1>
          {/* Scribble underline decoration */}
          <div className="mt-4 ml-1 relative inline-block">
            <span className="font-display italic text-[13px] text-[#1a2a6c]/40 tracking-wide">keep forever</span>
            <svg className="absolute -bottom-1 left-0 w-full" height="8" viewBox="0 0 120 8" fill="none">
              <path d="M2 6 Q30 2 60 5 Q90 8 118 3" stroke="#1a2a6c" strokeWidth="1" strokeOpacity="0.25" fill="none" strokeLinecap="round"/>
            </svg>
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="font-body text-[15px] text-[#666] max-w-[420px] leading-relaxed mb-12 ml-1"
        >
          And the best ones never wait for you to be ready — the toast, the hug, the light at 8 p.m. Book New York's best.
        </motion.p>

        {/* Animated Pill Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="max-w-[580px]"
          ref={containerRef}
        >
          {/* Pills */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            {STEPS.map((s, i) => {
              const done = i < step || isComplete;
              const active = i === step && !isComplete;
              const val = answers[s.key];
              return (
                <button
                  key={s.key}
                  onClick={() => { if (done) { setStep(i); setShowDropdown(s.type === 'dropdown'); } }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-body font-medium transition-all border ${
                    active ? 'bg-[#1a2a6c] text-white border-[#1a2a6c] shadow-md'
                    : done ? 'bg-white text-[#1a2a6c] border-[#1a2a6c]/30 cursor-pointer hover:border-[#1a2a6c]/60'
                    : 'bg-transparent text-[#1a1a1a]/30 border-[#1a1a1a]/10'
                  }`}
                >
                  {done && val ? (
                    <><span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />{val.length > 14 ? val.slice(0,14)+'…' : val}</>
                  ) : (
                    <><span className={`text-[8px] font-semibold ${active ? 'text-white/60' : 'text-[#1a1a1a]/20'}`}>{i+1}</span>{s.label}</>
                  )}
                </button>
              );
            })}
            {(step > 0 || Object.keys(answers).length > 0) && (
              <button onClick={reset} className="text-[10px] font-body text-[#1a1a1a]/25 hover:text-[#1a1a1a]/50 transition-colors px-1">Reset</button>
            )}
          </div>

          {/* Active step card */}
          <AnimatePresence mode="wait">
            {!isComplete && (
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.2 }}
                className="relative"
              >
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-between px-6 py-5">
                    <div className="flex-1">
                      <p className="text-[9px] font-body font-semibold tracking-[0.25em] text-[#1a1a1a]/35 uppercase mb-1">Step {step+1} of {STEPS.length}</p>
                      <AnimatePresence mode="wait">
                        <motion.p key={currentStep.key} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                          className="text-[18px] font-heading font-semibold text-[#1a1a1a]">
                          {currentStep.prompt}
                        </motion.p>
                      </AnimatePresence>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {step > 0 && (
                        <button onClick={() => setStep(s => s - 1)} className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:border-gray-400 transition-colors">
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {currentStep.type === 'dropdown' && (
                        <button onClick={() => setShowDropdown(v => !v)}
                          className="flex items-center gap-2 px-4 h-9 rounded-full bg-[#1a2a6c] text-white text-[13px] font-body font-medium hover:bg-[#22337a] transition-all">
                          {currentStep.placeholder} <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                      {currentStep.type === 'date' && (
                        <input type="date" onChange={handleDateChange}
                          className="text-sm font-body text-[#1a1a1a] bg-[#f5f4ef] border border-gray-200 rounded-xl px-4 py-2 outline-none focus:border-[#1a2a6c] cursor-pointer" autoFocus />
                      )}
                    </div>
                  </div>
                  <div className="px-6 pb-4 -mt-2">
                    <button onClick={() => { if (isLast) doSearch(); else setStep(s => s + 1); }}
                      className="text-[10px] font-body text-[#1a1a1a]/30 hover:text-[#1a1a1a]/55 transition-colors">
                      Skip this step →
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {showDropdown && currentStep.type === 'dropdown' && (
                    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
                      className="absolute top-full left-0 mt-2 w-56 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 py-2">
                      {currentStep.options.map(opt => (
                        <button key={opt} className="w-full text-left px-4 py-2.5 text-[13px] font-body text-[#1a1a1a] hover:bg-[#f5f4ef] transition-colors"
                          onMouseDown={e => { e.preventDefault(); handleSelect(opt); }}>
                          {opt}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {isComplete && (
              <motion.div key="done" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-body font-semibold text-[#1a1a1a] mb-0.5">Finding your lensman…</p>
                  <p className="text-[11px] font-body text-gray-400">Developing film. Collecting memories.</p>
                </div>
                <button onClick={() => doSearch()}
                  className="flex items-center gap-2 px-5 h-9 rounded-full bg-[#1a2a6c] text-white text-[13px] font-body font-medium hover:bg-[#22337a] transition-all">
                  Search <ArrowRight className="w-3 h-3" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Trust pills */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.55 }}
          className="flex flex-wrap gap-2 mt-8 ml-1">
          {['Vetted creators only', 'Fixed upfront prices', 'Held until delivery', 'Contracts built in'].map(label => (
            <span key={label} className="text-[10px] font-body text-[#1a2a6c]/50 border border-[#1a2a6c]/12 rounded-full px-3 py-1">{label}</span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}