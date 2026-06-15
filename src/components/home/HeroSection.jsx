import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const STEPS = [
  {
    key: 'moment',
    label: 'Moment',
    prompt: "What's the moment?",
    placeholder: 'e.g. Birthday, Dinner, Content Day…',
    type: 'dropdown',
    options: ['Birthday', 'Dinner', 'Rooftop Hang', 'Music Video', 'Restaurant Opening', 'Content Day', 'Proposal', 'Wedding', 'Corporate', 'Custom'],
  },
  {
    key: 'where',
    label: 'Where',
    prompt: 'Where in New York?',
    placeholder: 'Anywhere in NYC',
    type: 'dropdown',
    options: ['Anywhere in NYC', 'Williamsburg', 'Bushwick', 'DUMBO', 'Lower East Side', 'Harlem', 'Park Slope', 'Midtown', 'SoHo', 'Astoria'],
  },
  {
    key: 'when',
    label: 'When',
    prompt: 'Pick a date',
    type: 'date',
  },
  {
    key: 'vibe',
    label: 'Vibe',
    prompt: 'Choose a vibe',
    type: 'dropdown',
    options: ['Moody & dark', 'Bright & airy', 'Documentary', 'Editorial', 'Candid & raw', 'Cinematic'],
  },
];

function StepDropdown({ options, onSelect }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      className="absolute top-full left-0 mt-2 w-52 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 py-2 overflow-hidden"
    >
      {options.map((opt) => (
        <button
          key={opt}
          className="w-full text-left px-4 py-2.5 text-sm font-body text-[#1a1a1a] hover:bg-[#f5f4ef] transition-colors"
          onMouseDown={(e) => { e.preventDefault(); onSelect(opt); }}
        >
          {opt}
        </button>
      ))}
    </motion.div>
  );
}

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
    if (isLast) {
      doSearch(newAnswers);
    } else {
      setStep(s => s + 1);
    }
  };

  const handleDateChange = (e) => {
    if (e.target.value) handleSelect(e.target.value);
  };

  const doSearch = (a) => {
    const params = new URLSearchParams();
    const ans = a || answers;
    if (ans.moment && ans.moment !== 'Custom') {
      params.set('event_type', ans.moment.toLowerCase().replace(/ /g, '_'));
    }
    if (ans.where && ans.where !== 'Anywhere in NYC') {
      params.set('neighborhood', ans.where);
    }
    navigate(`/browse?${params.toString()}`);
  };

  const reset = () => {
    setStep(0);
    setAnswers({});
    setShowDropdown(false);
  };

  // Close dropdown on outside click
  useEffect(() => {
    if (!showDropdown) return;
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showDropdown]);

  // Auto-open dropdown for dropdown steps
  useEffect(() => {
    if (currentStep?.type === 'dropdown') setShowDropdown(true);
  }, [step]);

  return (
    <section className="relative min-h-screen bg-[#F5F4EF] flex flex-col">
      {/* Decorative stars */}
      <span className="absolute top-28 right-[10%] text-[#1a2a6c]/15 text-3xl select-none">✦</span>
      <span className="absolute top-[55%] right-[5%] text-[#1a2a6c]/10 text-xl select-none">✦</span>
      <span className="absolute bottom-32 left-[8%] text-[#1a2a6c]/10 text-2xl select-none">✦</span>

      <div className="relative z-10 flex-1 flex flex-col justify-center px-8 md:px-16 lg:px-24 pt-24 pb-20 max-w-[1300px] mx-auto w-full">

        {/* Eyebrow */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-[10px] font-body tracking-[0.3em] text-[#1a2a6c]/40 uppercase mb-8 flex items-center gap-3"
        >
          <span className="inline-block w-8 h-px bg-[#1a2a6c]/20" />
          New York Creative Collective — Est. 2026
        </motion.p>

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.05 }}
          className="mb-4"
        >
          <img
            src="https://media.base44.com/images/public/6a2c4e448e7fec52fb6d322a/b178af09a_Screenshot2026-06-14at105757PM.png"
            alt="Stelli"
            className="h-[clamp(80px,12vw,160px)] w-auto object-contain"
          />
        </motion.div>

        {/* Subhead */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="font-body text-[15px] text-[#555] max-w-[460px] leading-relaxed mb-10 ml-1"
        >
          Book New York's best photographers & filmmakers — fixed prices, vetted talent, payment held until delivery.
        </motion.p>

        {/* Animated Pill Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="max-w-[640px]"
          ref={containerRef}
        >
          {/* Progress pills */}
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
                    active
                      ? 'bg-[#1a2a6c] text-white border-[#1a2a6c] shadow-md'
                      : done
                      ? 'bg-white text-[#1a2a6c] border-[#1a2a6c]/30 cursor-pointer hover:border-[#1a2a6c]/60'
                      : 'bg-transparent text-[#1a1a1a]/30 border-[#1a1a1a]/10'
                  }`}
                >
                  {done && val ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
                      {val.length > 12 ? val.slice(0, 12) + '…' : val}
                    </>
                  ) : (
                    <>
                      <span className={`text-[9px] font-semibold ${active ? 'text-white/70' : 'text-[#1a1a1a]/20'}`}>{i + 1}</span>
                      {s.label}
                    </>
                  )}
                </button>
              );
            })}
            {(step > 0 || Object.keys(answers).length > 0) && (
              <button onClick={reset} className="text-[11px] font-body text-[#1a1a1a]/30 hover:text-[#1a1a1a]/60 transition-colors px-1">
                Reset
              </button>
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
                transition={{ duration: 0.22 }}
                className="relative"
              >
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-visible">
                  <div className="flex items-center justify-between px-6 py-5">
                    <div className="flex-1">
                      <p className="text-[10px] font-body font-semibold tracking-[0.2em] text-[#1a1a1a]/40 uppercase mb-1">
                        Step {step + 1} of {STEPS.length}
                      </p>
                      <AnimatePresence mode="wait">
                        <motion.p
                          key={currentStep.key}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          className="text-lg font-heading font-semibold text-[#1a1a1a]"
                        >
                          {currentStep.prompt}
                        </motion.p>
                      </AnimatePresence>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      {step > 0 && (
                        <button
                          onClick={() => setStep(s => s - 1)}
                          className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:border-gray-400 transition-colors"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                      )}
                      {currentStep.type === 'dropdown' && (
                        <button
                          onClick={() => setShowDropdown(v => !v)}
                          className="flex items-center gap-2 px-4 h-10 rounded-full bg-[#1a2a6c] text-white text-sm font-body font-medium hover:bg-[#22337a] transition-all"
                        >
                          {currentStep.placeholder || 'Choose'} <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {currentStep.type === 'date' && (
                        <input
                          type="date"
                          onChange={handleDateChange}
                          className="text-sm font-body text-[#1a1a1a] bg-[#f5f4ef] border border-gray-200 rounded-xl px-4 py-2 outline-none focus:border-[#1a2a6c] cursor-pointer"
                          autoFocus
                        />
                      )}
                    </div>
                  </div>

                  {/* Skip */}
                  <div className="px-6 pb-4 -mt-1">
                    <button
                      onClick={() => {
                        if (isLast) doSearch();
                        else setStep(s => s + 1);
                      }}
                      className="text-[11px] font-body text-[#1a1a1a]/35 hover:text-[#1a1a1a]/60 transition-colors"
                    >
                      Skip this step →
                    </button>
                  </div>
                </div>

                {/* Dropdown */}
                <AnimatePresence>
                  {showDropdown && currentStep.type === 'dropdown' && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      className="absolute top-full left-0 mt-2 w-56 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 py-2 overflow-hidden"
                    >
                      {currentStep.options.map((opt) => (
                        <button
                          key={opt}
                          className="w-full text-left px-4 py-2.5 text-sm font-body text-[#1a1a1a] hover:bg-[#f5f4ef] transition-colors"
                          onMouseDown={(e) => { e.preventDefault(); handleSelect(opt); }}
                        >
                          {opt}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {isComplete && (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-2xl border border-gray-200 shadow-sm px-6 py-5 flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-body font-semibold text-[#1a1a1a] mb-0.5">Finding your lensman…</p>
                  <p className="text-[11px] font-body text-gray-400">Showing results for your moment</p>
                </div>
                <button
                  onClick={() => doSearch()}
                  className="flex items-center gap-2 px-5 h-10 rounded-full bg-[#1a2a6c] text-white text-sm font-body font-medium hover:bg-[#22337a] transition-all"
                >
                  Search <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Trust pills */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="flex flex-wrap gap-3 mt-7 ml-1"
        >
          {['Vetted creators only', 'Fixed upfront prices', 'Payment held in escrow', 'Contracts built in'].map((label) => (
            <span key={label} className="text-[11px] font-body text-[#1a2a6c]/60 border border-[#1a2a6c]/15 rounded-full px-3 py-1">
              {label}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}