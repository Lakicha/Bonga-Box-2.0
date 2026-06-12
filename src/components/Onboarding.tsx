import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  Landmark, 
  Signal, 
  ArrowRight, 
  ArrowLeft, 
  X, 
  Sparkles, 
  Check, 
  Fingerprint, 
  MapPin, 
  WifiOff, 
  ShieldAlert, 
  AlertTriangle, 
  PhoneCall, 
  Flame, 
  Info, 
  Navigation,
  Globe,
  Compass
} from 'lucide-react';

const Onboarding: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  
  // Interactive Simulator States
  // Slide 2: FGM Sanctuary Simulated Toggle
  const [activeSpecialty, setActiveSpecialty] = useState<string>('all');
  
  // Slide 3: Flood Simulator Gauge Progress Value
  const [floodSimulationLevel, setFloodSimulationLevel] = useState<number>(35);
  const [floodSimulating, setFloodSimulating] = useState<boolean>(false);

  // Slide 4: USSD Dial Simulator Keypad Options
  const [ussdMenuChoice, setUssdMenuChoice] = useState<string>('root');

  // Slide 5: Mini Sandbox Plot Toggles
  const [sandboxFgmOn, setSandboxFgmOn] = useState<boolean>(true);
  const [sandboxFloodOn, setSandboxFloodOn] = useState<boolean>(false);

  useEffect(() => {
    // Check if user has completed onboarding before
    const isCompleted = localStorage.getItem('bonga_onboarding_completed_v3');
    if (!isCompleted) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, []);

  // Set up custom global event listener so user can replay from home or anywhere!
  useEffect(() => {
    const handleTriggerTour = () => {
      setCurrentStep(0);
      setFloodSimulationLevel(35);
      setUssdMenuChoice('root');
      setSandboxFgmOn(true);
      setSandboxFloodOn(false);
      setIsOpen(true);
    };

    window.addEventListener('bonga_trigger_onboarding_carousel', handleTriggerTour);
    return () => {
      window.removeEventListener('bonga_trigger_onboarding_carousel', handleTriggerTour);
    };
  }, []);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem('bonga_onboarding_completed_v3', 'true');
    setIsOpen(false);
  };

  // Run water elevation simulator
  const runFloodSimulation = () => {
    if (floodSimulating) return;
    setFloodSimulating(true);
    let level = 35;
    const interval = setInterval(() => {
      level += 12;
      if (level >= 95) {
        level = 95;
        clearInterval(interval);
        setFloodSimulating(false);
      }
      setFloodSimulationLevel(level);
    }, 180);
  };

  // Steps declaration
  const steps = [
    {
      title: "Welcome to Bonga Box Safeland",
      subtitle: "Combined Youth Safety Network",
      accent: "text-[#4F46E5] bg-[#4F46E5]/5 border-[#4F46E5]/10",
      icon: ShieldCheck,
      desc: "An educational safe space defending girls in Isiolo from Gender-Based Violence (FGM) while providing critical meteorological early flood rescue lines on a single unified platform.",
      illustration: (
        <div className="w-full h-36 bg-slate-50 border border-slate-100 rounded-[20px] flex flex-col items-center justify-center p-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-radial-gradient from-purple-primary/[0.04] to-transparent pointer-events-none" />
          <div className="flex gap-4 items-center z-10">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-150 flex flex-col items-center justify-center text-[#4F46E5]">
              <ShieldAlert size={22} />
              <span className="text-[7px] font-black tracking-widest mt-0.5">ANTI-FGM</span>
            </div>
            <div className="w-6 h-6 rounded-full border border-dashed border-slate-350 flex items-center justify-center text-slate-300">
              <Sparkles size={11} className="animate-pulse" />
            </div>
            <div className="w-12 h-12 rounded-2xl bg-cyan-50 border border-cyan-150 flex flex-col items-center justify-center text-[#06B6D4]">
              <AlertTriangle size={22} />
              <span className="text-[7px] font-black tracking-widest mt-0.5">METEOR</span>
            </div>
          </div>
          
          <div className="mt-3.5 flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-100 rounded-lg shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Isiolo County Central Handshake Active</span>
          </div>
        </div>
      )
    },
    {
      title: "Anti-FGM Safety Shield",
      subtitle: "Silent Intervention Protocols",
      accent: "text-purple-primary bg-purple-primary/5 border-purple-primary/10",
      icon: ShieldAlert,
      desc: "Safely file anonymous logs and reach certified school counselors. Explore endangered shelters with high judicial protection to defend children against FGM forced practices.",
      illustration: (
        <div className="w-full h-40 bg-slate-50 border border-slate-100 rounded-[20px] p-3 flex flex-col justify-between text-left relative overflow-hidden">
          {/* FGM Shelter Selector Tool */}
          <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-2">
            <span className="text-[8.5px] font-black text-purple-primary uppercase tracking-wider">Simulate Protection Categories</span>
            <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-150 rounded text-[7.5px] font-black">JUDICIAL ESCORT</span>
          </div>

          <div className="grid grid-cols-2 gap-2 flex-grow overflow-y-auto max-h-[75px] scrollbar-none">
            <div 
              onClick={() => setActiveSpecialty('merti')}
              className={`p-2 border rounded-xl cursor-pointer transition-all ${
                activeSpecialty === 'merti' 
                  ? 'bg-purple-primary border-purple-primary text-white shadow-xs' 
                  : 'bg-white border-slate-201 text-slate-800 hover:border-purple-300'
              }`}
            >
              <h5 className="text-[9px] font-black leading-tight">Merti Girls Haven</h5>
              <p className={`text-[7px] mt-0.5 leading-snug ${activeSpecialty === 'merti' ? 'text-indigo-150' : 'text-slate-400'}`}>Specialty: Anti-FGM rescue beds.</p>
            </div>

            <div 
              onClick={() => setActiveSpecialty('central')}
              className={`p-2 border rounded-xl cursor-pointer transition-all ${
                activeSpecialty === 'central' 
                  ? 'bg-purple-primary border-purple-primary text-white shadow-xs' 
                  : 'bg-white border-slate-201 text-slate-800 hover:border-purple-300'
              }`}
            >
              <h5 className="text-[9px] font-black leading-tight">Isiolo Central</h5>
              <p className={`text-[7px] mt-0.5 leading-snug ${activeSpecialty === 'central' ? 'text-indigo-150' : 'text-slate-400'}`}>Specialty: Direct Legal Liaisons.</p>
            </div>
          </div>

          <p className="text-[7.5px] text-slate-400 font-extrabold uppercase mt-1 leading-none text-center">
            *Tap a card to filter our simulated secure rescue sanctuary
          </p>
        </div>
      )
    },
    {
      title: "Flood Telemetry Mapping",
      subtitle: "Interactive Elevational Safe Havens",
      accent: "text-[#06B6D4] bg-[#06B6D4]/5 border-[#06B6D4]/10",
      icon: Landmark,
      desc: "Overlay meteorological flood warnings on our dynamic maps. Secure coordinates of high-ground camps, sandbag storage depots, and route status logs.",
      illustration: (
        <div className="w-full h-40 bg-slate-50 border border-slate-100 rounded-[20px] p-3 flex flex-col justify-between text-left">
          <div className="flex justify-between items-center border-b border-slate-100 pb-1.5 mb-1.5">
            <span className="text-[8.5px] font-black text-[#06B6D4] uppercase tracking-wider">Simulated Rivers Basin Flood Rise</span>
            <span className="text-[8px] font-mono font-extrabold text-[#06B6D4]">{floodSimulationLevel}% Capacity</span>
          </div>

          {/* Indicator meter bar */}
          <div className="space-y-1.5 flex-grow flex flex-col justify-center">
            <div className="w-full bg-slate-200 rounded-full h-3.5 overflow-hidden border border-slate-200 flex items-center relative">
              <motion.div 
                animate={{ width: `${floodSimulationLevel}%` }}
                className={`h-full transition-all duration-300 ${
                  floodSimulationLevel > 80 ? 'bg-red-500' : floodSimulationLevel > 50 ? 'bg-amber-400' : 'bg-emerald-400'
                }`}
              />
              <span className="absolute right-2 text-[8px] font-black text-slate-600 tracking-wider">EWASO NG'IRO</span>
            </div>

            <div className="flex justify-between items-center text-[7.5px] font-bold text-slate-400 uppercase">
              <span>Stable Low Flow</span>
              {floodSimulationLevel > 80 ? (
                <span className="text-red-500 font-black flex items-center gap-0.5 animate-pulse">● CRITICAL EVACUATE</span>
              ) : (
                <span>Level Sensor Node</span>
              )}
            </div>
          </div>

          <button
            onClick={runFloodSimulation}
            disabled={floodSimulating}
            className="w-full py-2 bg-[#06B6D4] hover:bg-cyan-600 disabled:bg-slate-300 text-white font-black text-[9px] uppercase tracking-wider rounded-lg shadow-sm"
          >
            {floodSimulating ? "Simulating Tidal Rise..." : "Trigger Water Simulator Gauge"}
          </button>
        </div>
      )
    },
    {
      title: "Zero-Data SMS/USSD Gateway",
      subtitle: "Failsafe Analog Connectivity",
      accent: "text-amber-500 bg-amber-500/5 border-amber-500/10",
      icon: WifiOff,
      desc: "Zero cell service or mobile internet? Dial *123# USSD menu or draft text-free SMS reports. Your signals scramble directly into emergency county relays over analog spectrums.",
      illustration: (
        <div className="w-full h-40 bg-indigo-950 text-white border border-slate-800 rounded-2xl p-3 flex flex-col justify-between text-left font-mono relative overflow-hidden">
          <div className="absolute top-[-20%] left-[-20%] w-24 h-24 bg-purple-500/10 rounded-full blur-xl pointer-events-none" />
          
          <div className="flex justify-between items-center text-[#4F46E5] text-[8.5px] font-extrabold tracking-tight border-b border-slate-800 pb-1.5">
            <span>analog ussd: *123#</span>
            <span className="text-emerald-400 animate-pulse text-[7.5px]">● SECURING TERMINAL</span>
          </div>

          <div className="bg-indigo-900/50 p-2 border border-slate-800 rounded-xl flex-grow flex flex-col justify-center min-h-[60px] text-[9.5px]">
            {ussdMenuChoice === 'root' && (
              <div className="space-y-1 text-slate-350">
                <p className="font-extrabold text-white text-[9px]">Select Option:</p>
                <div onClick={() => setUssdMenuChoice('fgm')} className="hover:text-white cursor-pointer px-1 py-0.5 bg-slate-850/50 rounded flex justify-between">
                  <span>1. File Confidential FGM Alert</span>
                  <span className="text-purple-primary text-[8px]">&gt;</span>
                </div>
                <div onClick={() => setUssdMenuChoice('flood')} className="hover:text-white cursor-pointer px-1 py-0.5 bg-slate-850/50 rounded flex justify-between">
                  <span>2. Evacuation Shelter Directory</span>
                  <span className="text-purple-primary text-[8px]">&gt;</span>
                </div>
              </div>
            )}

            {ussdMenuChoice === 'fgm' && (
              <div className="space-y-1.5">
                <p className="text-emerald-400 text-[8.5px] font-black">LOG RECEIVED SAFELY:</p>
                <p className="text-[7.5px] text-slate-300 leading-normal">Encryption hash: SHA-Bonga-Node_Secure. First responder assigned.</p>
                <button onClick={() => setUssdMenuChoice('root')} className="px-1.5 py-0.5 bg-slate-800 text-white rounded text-[7.5px] hover:bg-slate-700">Back</button>
              </div>
            )}

            {ussdMenuChoice === 'flood' && (
              <div className="space-y-1.5">
                <p className="text-cyan-400 text-[8.5px] font-black">NEAREST SANCTUARIES:</p>
                <p className="text-[7.5px] text-slate-300 leading-normal">Ewaso High Camp · 0.58° N, 37.69° E. 240m altitude clearance.</p>
                <button onClick={() => setUssdMenuChoice('root')} className="px-1.5 py-0.5 bg-slate-800 text-white rounded text-[7.5px] hover:bg-slate-700">Back</button>
              </div>
            )}
          </div>

          <p className="text-[7px] text-slate-500 font-bold uppercase tracking-wider leading-none text-center">
            *Choose an option above to simulate USSD cellular logic
          </p>
        </div>
      )
    },
    {
      title: "Interactive Sandbox Live Mode",
      subtitle: "Bonga Box System Dashboard Preview",
      accent: "text-emerald-500 bg-emerald-500/5 border-emerald-500/10",
      icon: Compass,
      desc: "Turn tactical filters on or off below to preview exactly how spatial elements render on the true County Maps! Master your tools.",
      illustration: (
        <div className="w-full h-40 bg-slate-900 border border-slate-950 rounded-2xl p-2.5 flex flex-col justify-between text-left text-white overflow-hidden relative">
          
          {/* Mapping canvas area */}
          <div className="flex-grow bg-slate-950 border border-slate-850 rounded-xl relative p-2 flex flex-col justify-between overflow-hidden">
            {/* Compass graphical backdrop */}
            <Compass size={40} className="text-slate-900 absolute right-2 bottom-2 rotate-45 shrink-0 pointer-events-none" />
            
            <div className="flex justify-between items-center text-[7.5px] font-extrabold uppercase text-slate-500 tracking-wider">
              <span>Isiolo Satellite Telemetry Vector Chart</span>
              <span className="text-[#4F46E5] font-mono">Zoom: 10x</span>
            </div>

            <div className="space-y-1.5 z-10 py-1 flex-grow flex flex-col justify-center">
              {sandboxFgmOn && (
                <div className="flex items-center gap-1 bg-purple-primary/20 border border-purple-primary/30 p-1 rounded-md max-w-xs animate-fadeIn">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-primary" />
                  <span className="text-[8px] font-bold text-indigo-200">Merti Sanctuary (Active Protection beds)</span>
                </div>
              )}
              {sandboxFloodOn && (
                <div className="flex items-center gap-1 bg-amber-500/20 border border-amber-500/30 p-1 rounded-md max-w-xs animate-fadeIn">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                  <span className="text-[8px] font-bold text-amber-200">Bula Pesa Flash Flood Zone Prone</span>
                </div>
              )}
              {!sandboxFgmOn && !sandboxFloodOn && (
                <div className="text-[8px] italic text-slate-500 text-center py-2">No active map overlays toggled. Click selectors below.</div>
              )}
            </div>

            <div className="flex justify-end gap-1.5 shrink-0">
              <span className="px-1 text-[6.5px] font-extrabold uppercase bg-slate-900 text-slate-400 border border-slate-850 rounded-sm">TLS SHA-256 Valid</span>
            </div>
          </div>

          {/* Selector panels beneath the preview */}
          <div className="grid grid-cols-2 gap-1.5 mt-1.5">
            <button 
              onClick={() => setSandboxFgmOn(!sandboxFgmOn)}
              className={`p-1 text-[7.5px] font-black uppercase tracking-wider rounded-md border text-center transition-all ${
                sandboxFgmOn 
                  ? 'bg-purple-primary border-purple-primary text-white' 
                  : 'bg-slate-850 border-slate-800 text-slate-400'
              }`}
            >
              FGM Shelter Overlay: {sandboxFgmOn ? 'ON' : 'OFF'}
            </button>
            <button 
              onClick={() => setSandboxFloodOn(!sandboxFloodOn)}
              className={`p-1 text-[7.5px] font-black uppercase tracking-wider rounded-md border text-center transition-all ${
                sandboxFloodOn 
                  ? 'bg-amber-500 border-amber-500 text-white' 
                  : 'bg-slate-850 border-slate-800 text-slate-400'
              }`}
            >
              Flood Zone Alert: {sandboxFloodOn ? 'ON' : 'OFF'}
            </button>
          </div>

        </div>
      )
    }
  ];

  const StepIcon = steps[currentStep].icon;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop mask */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleComplete}
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-md z-[100] flex items-center justify-center p-4"
          >
            {/* Onboarding Dialog Card matching premium purple-and-white theme */}
            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-white border border-slate-100 p-5 rounded-[20px] shadow-2xl relative text-center flex flex-col justify-between min-h-[510px] space-y-4"
            >
              {/* Skip Handle button */}
              <button
                onClick={handleComplete}
                className="absolute top-4 right-4 p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-705 transition-colors z-20"
                title="Skip tour"
              >
                <X size={14} />
              </button>

              {/* Step indicator header badge & Progress scale */}
              <div className="pt-1.5 flex flex-col items-center gap-1">
                <span className="px-2.5 py-0.5 bg-indigo-50 border border-indigo-200/50 text-[#4F46E5] text-[7.5px] font-black uppercase tracking-widest rounded-full">
                  Safety System Tour · Step {currentStep + 1} of {steps.length}
                </span>
                
                {/* Visual horizontal linear progress meter */}
                <div className="w-32 bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1 flex">
                  <div 
                    className="bg-[#4F46E5] h-full transition-all duration-300"
                    style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Title, Subtitle and Icon bubble */}
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 border ${steps[currentStep].accent}`}>
                  <StepIcon size={20} className="shrink-0" />
                </div>
                <h2 className="text-sm font-display font-black text-slate-900 tracking-tight leading-none mb-0.5">
                  {steps[currentStep].title}
                </h2>
                <span className="text-[8px] text-slate-400 font-black uppercase tracking-widest leading-none mb-2 block">
                  {steps[currentStep].subtitle}
                </span>
              </div>

              {/* Dynamic steps graphics */}
              <div className="flex-grow flex items-center justify-center min-h-[160px]">
                {steps[currentStep].illustration}
              </div>

              {/* Descriptive details */}
              <p className="text-[10px] text-slate-500 leading-relaxed font-semibold px-2">
                {steps[currentStep].desc}
              </p>

              {/* Previous + Next + Dots Carousel Controller Segment */}
              <div className="space-y-4 pt-1">
                {/* Dots Progress Indicator - Clickable to jump to slide instantly */}
                <div className="flex justify-center gap-2">
                  {steps.map((_, idx) => (
                    <button 
                      key={idx}
                      onClick={() => setCurrentStep(idx)}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        idx === currentStep ? 'w-6 bg-purple-primary' : 'w-1.5 bg-slate-200 hover:bg-slate-300'
                      }`}
                      title={`Go to step ${idx + 1}`}
                    />
                  ))}
                </div>

                {/* Left (Prev) and Right (Next) navigation with slide buttons */}
                <div className="grid grid-cols-12 gap-2">
                  {/* Prev Button */}
                  <div className="col-span-3">
                    <button
                      onClick={handlePrev}
                      disabled={currentStep === 0}
                      className="w-full py-2.5 border border-slate-250 text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 disabled:opacity-35 text-[10px] font-black rounded-xl tracking-wider uppercase flex items-center justify-center gap-1 transition-all disabled:pointer-events-none"
                    >
                      <ArrowLeft size={10} />
                      <span>Prev</span>
                    </button>
                  </div>

                  {/* Next / Completion CTA Button */}
                  <div className="col-span-9">
                    <button
                      onClick={handleNext}
                      className="w-full py-2.5 bg-[#4F46E5] hover:bg-[#3F37C9] text-white text-[10px] font-black rounded-xl tracking-wider uppercase shadow-md flex items-center justify-center gap-1 transition-all active:scale-[0.98]"
                    >
                      <span>{currentStep === steps.length - 1 ? "Start Operating" : "Next Safeguard"}</span>
                      <ArrowRight size={10} />
                    </button>
                  </div>
                </div>
              </div>

            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default Onboarding;
