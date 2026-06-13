import React, { useState } from 'react';
import { 
  BookOpen, 
  Search, 
  ShieldCheck, 
  ArrowDownCircle, 
  HelpCircle, 
  Sparkles, 
  Lightbulb, 
  CloudRain, 
  Download, 
  CheckCircle,
  FileCheck2,
  ArrowRight,
  ArrowLeft,
  AlertTriangle,
  RotateCcw,
  Check,
  ChevronRight,
  Info,
  ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const REPORTING_PROTOCOLS = {
  FGM: {
    title: "Anonymous FGM Reporting Protocol",
    short: "FGM Prevention",
    themeColor: "from-rose-500 to-purple-600",
    bgColor: "bg-rose-50/50",
    borderColor: "border-rose-100",
    textColor: "text-rose-700",
    iconColor: "text-rose-500",
    steps: [
      {
        title: "Pre-Reporting Anonymity",
        subtitle: "Scrubbing Digital Footprints",
        description: "Standard protocols to seal your identity online before sending key alerts.",
        checklists: [
          { text: "Confirm you are using an incognito browser window or safe device", detail: "Avoids leaving local cache traces on shared community phones." },
          { text: "Scrub media metadata if attaching images", detail: "Ensure EXIF GPS coordinates are removed to secure the witness." },
          { text: "Avoid stating direct familial relationships", detail: "Use passive phrasing (e.g., 'A risk has been flagged near...' instead of 'My niece is...')" }
        ],
        interactiveQuestion: "Which reporting phrase is safer for anonymity?",
        interactiveOptions: [
          { text: "My cousin who lives near Kinna junction is at risk tomorrow morning.", isSafe: false, feedback: "Incorrect. Mentioning familial relations can lead back to you." },
          { text: "A female minor in Kinna is facing an imminent threat next to the secondary clinic.", isSafe: true, feedback: "Correct! This provides precise geography without personal attributes." }
        ]
      },
      {
        title: "Exact Spatial Identifiers",
        subtitle: "Aiding Safehouse Extraction",
        description: "Enabling quick rescue responses by providing localized coordinates and transport vectors.",
        checklists: [
          { text: "Identify sub-county boundaries (e.g. Merti, Garba Tulla, Sericho)", detail: "Speeds up national protection response filters." },
          { text: "Name landmarks or recognizable intersections", detail: "Critical for remote areas where satellite maps may lack detailed roads." },
          { text: "Specify the transit method if target is moving", detail: "Is it a local transport motorcycle, transit bus, or pedestrian path?" }
        ],
        interactiveQuestion: "What is the best way to report target locations?",
        interactiveOptions: [
          { text: "She is currently in Garba Tulla town, probably on a side road.", isSafe: false, feedback: "Incorrect. This is too vague for response officers." },
          { text: "House 300m East of Garba Tulla clinic, near the green storage tank.", isSafe: true, feedback: "Correct! Extremely actionable spatial landmark." }
        ]
      },
      {
        title: "Actionable Timeline Details",
        subtitle: "Enforcing Early Prevention",
        description: "Rescue squads need exact timing to mount physical interventions.",
        checklists: [
          { text: "Indicate exact upcoming dates or cultural windows", detail: "Many FGM risks concentrate around school holidays or custom windows." },
          { text: "Specify time of day for high-urgency threats", detail: "State clearly: 'Expected at dawn (5 AM)' or 'Sunset (6 PM)'." },
          { text: "Provide the count of minors involved if known", detail: "Allows responders to scale safe-housing allocation accordingly." }
        ],
        interactiveQuestion: "Select the highest quality timing details:",
        interactiveOptions: [
          { text: "Something is happening during this holiday week in Sericho.", isSafe: false, feedback: "Incorrect. Responders cannot coordinate a 24/7 stakeout without specific windows." },
          { text: "Threat window is tomorrow Saturday between 4 AM and 8 AM before travel.", isSafe: true, feedback: "Correct! Specific time ranges allow immediate dispatch layout." }
        ]
      },
      {
        title: "Self-Saving Guidelines",
        subtitle: "Remaining Secure and Safe",
        description: "Witness safety is paramount. Follow these rules to remain out of danger.",
        checklists: [
          { text: "Never attempt physical intervention yourself", detail: "Always delegate to trained local protection personnel." },
          { text: "Delete local SMS or cellular dispatch history after submission", detail: "Protects against direct phone checks by guardians." },
          { text: "Identify closest safe shelter on our offline maps", detail: "Know where to run if your safety is compromised." }
        ],
        interactiveQuestion: "What should you do immediately after reporting?",
        interactiveOptions: [
          { text: "Clear my cellular report logs and maintain high-vigilance routine.", isSafe: true, feedback: "Correct! Wiping the device tracks is key to complete immunity." },
          { text: "Visit the location to verify if dispatch officers arrived safely.", isSafe: false, feedback: "Incorrect. This breaches your safety protocol and may raise suspicion." }
        ]
      }
    ]
  },
  FLOOD: {
    title: "Anonymous Flood Reporting Protocol",
    short: "Flood Incident",
    themeColor: "from-blue-500 to-indigo-600",
    bgColor: "bg-blue-50/50",
    borderColor: "border-blue-100",
    textColor: "text-blue-700",
    iconColor: "text-blue-500",
    steps: [
      {
        title: "Visual Severity Calibration",
        subtitle: "Defining Severity Accurately",
        description: "Standard scale definitions to help dispatch boats, sandbags, or rescue trucks.",
        checklists: [
          { text: "Ankle Depth: Slow runoffs, drainage blockages only", detail: "Responders classify as routine monitoring. No immediate threat." },
          { text: "Waist Depth: Local structures filled, vehicles stalling", detail: "Requires immediate local drainage detour flags." },
          { text: "Deep Overflow: Strong currents, buildings breached, bridge submersions", detail: "Spurs active community-wide evacuation alerts." }
        ],
        interactiveQuestion: "Identify the critical case definition:",
        interactiveOptions: [
          { text: "Road is muddy with standard surface ponding.", isSafe: false, feedback: "Incorrect. mud/ponding is minor-grade." },
          { text: "Riverbank breached, water flowing fast through lower market structures.", isSafe: true, feedback: "Correct! Breached waterways require urgent evacuation." }
        ]
      },
      {
        title: "Spatial Landmarks & Blockages",
        subtitle: "Mapping Inundated Pathways",
        description: "Describe physical infrastructure impact to secure logistics.",
        checklists: [
          { text: "Specify which access roads are fully cut-off", detail: "Allows rescue vehicles to map alternative navigation vectors." },
          { text: "Identify low-lying schools or communal structures at risk", detail: "Helps target evacuation priorities first." },
          { text: "Mark drainage or bridge blockages clearly", detail: "Enables engineering teams to dispatch clearing crews." }
        ],
        interactiveQuestion: "Which alert is most helpful for evacuation routes?",
        interactiveOptions: [
          { text: "Road is super wet and full of deep water spots.", isSafe: false, feedback: "Incorrect. Vague descriptions do not provide routing block information." },
          { text: "Main Merti bridge submerged; bypass vehicles must use the East Kinna corridor.", isSafe: true, feedback: "Correct! Guides emergency trucks safely without risking stalls." }
        ]
      },
      {
        title: "Early Safe-Zones",
        subtitle: "Directing Citizens to High Grounds",
        description: "Help responders know where the community is gathering for safety.",
        checklists: [
          { text: "Locate established high-ground shelters", detail: "Mention local churches, sanctuaries, or elevated hills." },
          { text: "Report food/water reserves at collection points", detail: "Helps supply trucks deliver medical packs to accurate points." },
          { text: "Note count of stranded or vulnerable people", detail: "Prioritizes children, elders, or injured individuals." }
        ],
        interactiveQuestion: "Choose the highest quality shelter update:",
        interactiveOptions: [
          { text: "People are hiding out at various dry spots in town.", isSafe: false, feedback: "Incorrect. This is too vague for responders to allocate supplies." },
          { text: "35 individuals (mostly elders) gathered at Merti East high church; supplies are low.", isSafe: true, feedback: "Correct! Excellent actionable dispatch update." }
        ]
      }
    ]
  }
};

const ResourceHub: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [downloadedAll, setDownloadedAll] = useState(false);
  const [downloadTracker, setDownloadTracker] = useState<Record<string, boolean>>({});

  // Wizard state variables
  const [selectedProtocol, setSelectedProtocol] = useState<'FGM' | 'FLOOD' | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  const guides = [
    {
      id: 'guide-fgm-1',
      title: "Interregional Coalition Pact",
      description: "A collaborative commitment by stakeholders and partners to strengthen regional cooperation, advocacy, and collective action towards ending FGM across affected regions.",
      size: "1.4 MB",
      format: "PDF (English)",
      category: "FGM Prevention",
      url: "https://thegirlgeneration.org/wp-content/uploads/2016/05/INTERREGIONAL-COALITION-PACT-en-GB.pdf"
    },
    {
      id: 'guide-fgm-2',
      title: "The Hidden Toll: A Girl Dies Every 12 Minutes as a Result of FGM",
      description: "A policy brief highlighting the mortality burden associated with FGM, presenting evidence that FGM-related complications contribute to thousands of preventable deaths and should be treated as a public health emergency.",
      size: "820 KB",
      format: "Summary Report",
      category: "FGM Prevention",
      url: "https://thegirlgeneration.org/wp-content/uploads/25_08/The_Hidden_Toll_Summary.pdf"
    },
    {
      id: 'guide-legal-1',
      title: "Political Economy Analysis – Kenya",
      description: "Examines Kenya's policy, governance, and legal environment related to FGM and gender protection safeguarding.",
      size: "4.5 MB",
      format: "PDF Report",
      category: "Legal Framework",
      url: "https://thegirlgeneration.org/wp-content/uploads/2022/10/PEA-Kenya_final_-PDF-002.pdf"
    },
    {
      id: 'guide-legal-2',
      title: "Kenya Prohibition of Female Genital Mutilation Act, 2011",
      description: "Official legislation criminalizing FGM, enforcing strict penalties, and setting safe-keeping guidelines in Isiolo and beyond.",
      size: "950 KB",
      format: "Legislative Act",
      category: "Legal Framework",
      url: "https://thegirlgeneration.org/publications/"
    }
  ];

  const handleDownloadAll = () => {
    setDownloadedAll(true);
    const updatedTracker: Record<string, boolean> = {};
    guides.forEach(guide => {
      updatedTracker[guide.id] = true;
    });
    setDownloadTracker(updatedTracker);
    window.open("https://thegirlgeneration.org/publications/", "_blank", "noopener,noreferrer");
  };

  // Filter guides
  const filteredGuides = guides.filter(guide => 
    guide.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    guide.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    guide.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="font-sans max-w-md mx-auto select-none py-1.5 space-y-4">
      
      {/* Search Header Bar with thin purple border and magnifying glass icon */}
      <div className="relative">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-purple-primary">
          <Search size={15} />
        </div>
        <input 
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search safety guides, publications..." 
          className="w-full pl-11 pr-5 py-2.5 bg-white border border-purple-primary rounded-2xl text-xs font-semibold focus:outline-none placeholder:text-slate-400 text-slate-800 shadow-xs"
        />
      </div>

      {/* Interactive step-by-step reporting protocols module */}
      <div className="bg-white border border-slate-100 rounded-[20px] p-4.5 shadow-xs text-left">
        {selectedProtocol === null ? (
          <div>
            <div className="flex items-start gap-2.5 mb-2">
              <div className="p-2 bg-purple-50 text-purple-primary rounded-xl shrink-0 mt-0.5 border border-purple-100/50">
                <ShieldAlert size={16} className="animate-pulse" />
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest leading-normal">
                  Anonymous Incident Protocols
                </h3>
                <p className="text-[10px] font-semibold text-slate-400 mt-0.5 leading-normal">
                  Learn to submit high-quality community safety reports anonymous of cellular footprints.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <button
                onClick={() => {
                  setSelectedProtocol('FGM');
                  setCurrentStep(0);
                  setSelectedAnswer(null);
                  setIsCompleted(false);
                }}
                className="p-3 rounded-2xl border border-rose-150 bg-rose-50/20 hover:bg-rose-50/50 text-rose-800 transition-all flex flex-col items-start gap-1.5 cursor-pointer text-left font-sans"
              >
                <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-rose-100 text-rose-700">Protocol 01</span>
                <span className="text-xs font-extrabold tracking-tight">FGM Prevention</span>
                <span className="text-[9.5px] font-medium leading-normal text-rose-600">Secure witness pathways & timing metrics.</span>
              </button>

              <button
                onClick={() => {
                  setSelectedProtocol('FLOOD');
                  setCurrentStep(0);
                  setSelectedAnswer(null);
                  setIsCompleted(false);
                }}
                className="p-3 rounded-2xl border border-blue-150 bg-blue-50/20 hover:bg-blue-50/50 text-blue-800 transition-all flex flex-col items-start gap-1.5 cursor-pointer text-left font-sans"
              >
                <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">Protocol 02</span>
                <span className="text-xs font-extrabold tracking-tight">Flood Hazards</span>
                <span className="text-[9.5px] font-medium leading-normal text-blue-600">Severity calibrations & routing guides.</span>
              </button>
            </div>
          </div>
        ) : (
          <div>
            {/* Header of Active Protocol */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3.5 font-sans">
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md bg-purple-50 text-purple-primary border border-purple-100/50">
                  {REPORTING_PROTOCOLS[selectedProtocol].short}
                </span>
                {!isCompleted && (
                  <span className="text-[9px] font-bold text-slate-400">
                    Step {currentStep + 1} of {REPORTING_PROTOCOLS[selectedProtocol].steps.length}
                  </span>
                )}
              </div>
              
              <button
                onClick={() => {
                  setSelectedProtocol(null);
                  setIsCompleted(false);
                }}
                className="text-[9.5px] font-extrabold uppercase tracking-wider text-slate-400 hover:text-slate-800 transition-all cursor-pointer flex items-center gap-1 border-none bg-transparent"
              >
                <RotateCcw size={10} /> Exit Protocol
              </button>
            </div>

            {/* Progress Bar */}
            {!isCompleted && (
              <div className="w-full h-1 bg-slate-100 rounded-full mb-4">
                <div 
                  className="h-full bg-purple-primary rounded-full transition-all duration-350"
                  style={{ width: `${((currentStep) / REPORTING_PROTOCOLS[selectedProtocol].steps.length) * 100}%` }}
                />
              </div>
            )}

            <AnimatePresence mode="wait">
              {!isCompleted ? (
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-4"
                >
                  <div>
                    <h3 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5 leading-tight">
                      <ChevronRight size={14} className="text-purple-primary" />
                      {REPORTING_PROTOCOLS[selectedProtocol].steps[currentStep].title}
                    </h3>
                    <p className="text-[9.5px] font-black uppercase tracking-widest text-[#4F46E5] mt-1 pl-5">
                      {REPORTING_PROTOCOLS[selectedProtocol].steps[currentStep].subtitle}
                    </p>
                    <p className="text-[10px] text-slate-500 font-medium leading-normal mt-1.5 pl-5">
                      {REPORTING_PROTOCOLS[selectedProtocol].steps[currentStep].description}
                    </p>
                  </div>

                  {/* Checklists area */}
                  <div className="space-y-2 bg-slate-50/50 p-2.5 rounded-2xl border border-slate-100">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-1">
                      Protocol Safeguards (Click to study guideline):
                    </p>
                    {REPORTING_PROTOCOLS[selectedProtocol].steps[currentStep].checklists.map((item, idx) => {
                      const itemKey = `${selectedProtocol}-${currentStep}-${idx}`;
                      const isChecked = checkedItems[itemKey];
                      return (
                        <div 
                          key={idx}
                          onClick={() => setCheckedItems(prev => ({ ...prev, [itemKey]: !isChecked }))}
                          className={`p-2 rounded-xl transition-all cursor-pointer border text-left flex items-start gap-2.5 ${
                            isChecked 
                              ? 'bg-emerald-50/30 border-emerald-100 text-slate-850' 
                              : 'bg-white border-slate-150 hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 mt-0.5 transition-all text-white ${
                            isChecked ? 'bg-emerald-500' : 'border border-slate-300 bg-white'
                          }`}>
                            {isChecked && <Check size={10} strokeWidth={4} />}
                          </div>
                          <div>
                            <p className="text-[10px] font-bold leading-tight">{item.text}</p>
                            {isChecked && (
                              <p className="text-[9.1px] text-[#4F46E5] font-semibold leading-normal mt-1 bg-white p-1.5 border border-[#4F46E5]/10 rounded-lg">
                                💡 {item.detail}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Interactive Question / Knowledge Check */}
                  <div className="bg-purple-primary/5 p-3 rounded-2xl border border-purple-primary/10 space-y-2.5">
                    <div className="flex items-center gap-1.5 text-purple-primary">
                      <Info size={12} />
                      <span className="text-[9px] font-black uppercase tracking-widest">Protocol Action Test</span>
                    </div>
                    
                    <p className="text-[10.5px] font-semibold text-slate-800 leading-normal pl-0.5">
                      {REPORTING_PROTOCOLS[selectedProtocol].steps[currentStep].interactiveQuestion}
                    </p>

                    <div className="space-y-1.5">
                      {REPORTING_PROTOCOLS[selectedProtocol].steps[currentStep].interactiveOptions.map((opt, oIdx) => {
                        const isSelected = selectedAnswer === oIdx;
                        return (
                          <button
                            key={oIdx}
                            onClick={() => setSelectedAnswer(oIdx)}
                            className={`w-full p-2.5 text-[10px] font-bold transition-all border rounded-xl text-left cursor-pointer ${
                              isSelected
                                ? opt.isSafe
                                  ? 'bg-emerald-500 text-white border-emerald-500 shadow-xs'
                                  : 'bg-rose-500 text-white border-rose-500 shadow-xs'
                                : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              <span className="font-extrabold shrink-0">{oIdx === 0 ? 'A.' : 'B.'}</span>
                              <span className="leading-snug">{opt.text}</span>
                            </div>
                            
                            {isSelected && (
                              <p className={`text-[9.5px] font-semibold mt-1.5 pt-1.5 border-t ${
                                opt.isSafe ? 'border-emerald-400 text-emerald-100' : 'border-rose-400 text-rose-100'
                              }`}>
                                {opt.feedback}
                              </p>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Navigation Footer */}
                  <div className="flex justify-between items-center pt-2">
                    <button
                      onClick={() => {
                        if (currentStep > 0) {
                          setCurrentStep(prev => prev - 1);
                          setSelectedAnswer(null);
                        } else {
                          setSelectedProtocol(null);
                        }
                      }}
                      className="px-3 py-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl text-[9.5px] font-black uppercase tracking-wider cursor-pointer flex items-center gap-1"
                    >
                      <ArrowLeft size={11} /> Back
                    </button>

                    <button
                      disabled={selectedAnswer === null || !REPORTING_PROTOCOLS[selectedProtocol].steps[currentStep].interactiveOptions[selectedAnswer].isSafe}
                      onClick={() => {
                        const nextStepIndex = currentStep + 1;
                        if (nextStepIndex < REPORTING_PROTOCOLS[selectedProtocol].steps.length) {
                          setCurrentStep(nextStepIndex);
                          setSelectedAnswer(null);
                        } else {
                          setIsCompleted(true);
                        }
                      }}
                      className={`px-3.5 py-2 rounded-xl text-[9.5px] font-black uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer ${
                        selectedAnswer !== null && REPORTING_PROTOCOLS[selectedProtocol].steps[currentStep].interactiveOptions[selectedAnswer].isSafe
                          ? 'bg-purple-primary hover:bg-[#3F37C9] text-white shadow-xs'
                          : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                      }`}
                    >
                      {currentStep === REPORTING_PROTOCOLS[selectedProtocol].steps.length - 1 ? 'Finish' : 'Next Step'} <ArrowRight size={11} />
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-4 text-center py-2"
                >
                  <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-500 border border-emerald-100 flex items-center justify-center mx-auto mb-1">
                    <CheckCircle size={24} className="text-emerald-500 animate-bounce" />
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-black text-slate-900 tracking-tight uppercase">
                      Protocol Certified Complete!
                    </h3>
                    <p className="text-[10px] text-slate-500 font-bold mt-1">
                      You now excel at submitting secure, high-quality community safety reports.
                    </p>
                  </div>

                  {/* Certificate or Quick Action Cheat Sheet */}
                  <div className="bg-slate-50 border border-slate-150 rounded-2xl p-3.5 text-left font-mono text-[9px] text-slate-700 space-y-2">
                    <p className="font-sans text-[8.5px] font-black text-purple-primary uppercase tracking-widest">
                      📋 Standardized Report Action Card
                    </p>
                    <p className="font-semibold text-slate-550 border-b border-dashed border-slate-200 pb-1.5 mb-1 bg-white p-2 rounded-lg border leading-relaxed font-sans">
                      Verify these exact values before transmitting alerts to maximize the quality and accuracy of the dispatch vector:
                    </p>
                    
                    <div className="space-y-1 bg-white p-2 rounded-lg border border-slate-100">
                      <div><span className="text-indigo-600 font-bold">1. BOUNDARY:</span> Sub-county identifier (e.g. Merti, Garba Tulla)</div>
                      <div><span className="text-indigo-600 font-bold">2. LANDMARK:</span> Intersections, visual markers near incident coords</div>
                      <div><span className="text-indigo-600 font-bold">3. TIMEFRAME:</span> Specific upcoming dates & time ranges (dawn/dusk)</div>
                      {selectedProtocol === 'FGM' ? (
                        <>
                          <div><span className="text-indigo-600 font-bold">4. CARRIER:</span> Transit method (bodaboda, public bus, walking)</div>
                          <div><span className="text-indigo-600 font-bold">5. WITNESSES:</span> Safe, direct counts of target individuals at risk</div>
                        </>
                      ) : (
                        <>
                          <div><span className="text-indigo-600 font-bold">4. DEPTH:</span> Verified water level index (Ankle, Waist, Deep)</div>
                          <div><span className="text-indigo-600 font-bold">5. ACCESS:</span> Evacuation blockades and functioning safe-points</div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 pt-1.5">
                    <button
                      onClick={() => {
                        setCurrentStep(0);
                        setSelectedAnswer(null);
                        setIsCompleted(false);
                      }}
                      className="flex-1 py-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer flex items-center justify-center gap-1.5 border-none bg-transparent"
                    >
                      <RotateCcw size={11} /> Re-study Protocol
                    </button>
                    
                    <button
                      onClick={() => {
                        setSelectedProtocol(null);
                        setIsCompleted(false);
                      }}
                      className="flex-1 py-2 bg-purple-primary hover:bg-[#3F37C9] text-white rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer transition-all border-none"
                    >
                      Study Other
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Categories: Two clean cards for "FGM Prevention" and "Legal Framework" with educational design */}
      <div>
        <p className="text-xxs text-slate-400 font-extrabold uppercase tracking-widest pl-1 mb-2">
          Knowledge Base Hub
        </p>

        <div className="grid grid-cols-2 gap-3">
          {/* Card Category FGM Prevention */}
          <div className="bg-white border border-slate-100 rounded-[20px] shadow-xs p-3.5 flex flex-col text-left space-y-1.5 pb-4">
            <div className="w-8.5 h-8.5 rounded-xl bg-purple-primary/5 text-purple-primary flex items-center justify-center shrink-0">
              <ShieldCheck size={18} />
            </div>
            <h3 className="text-xs font-display font-black text-slate-900 leading-tight">
              FGM Prevention
            </h3>
            <p className="text-xxs text-slate-400 font-semibold leading-normal">
              Practical community response, referential guidelines, risk prevention, and safe-keeping networks.
            </p>
          </div>

          {/* Card Category Legal Framework */}
          <div className="bg-white border border-slate-100 rounded-[20px] shadow-xs p-3.5 flex flex-col text-left space-y-1.5 pb-4">
            <div className="w-8.5 h-8.5 rounded-xl bg-purple-primary/5 text-purple-primary flex items-center justify-center shrink-0">
              <BookOpen size={16} />
            </div>
            <h3 className="text-xs font-display font-black text-slate-900 leading-tight">
              Legal Framework
            </h3>
            <p className="text-xxs text-slate-400 font-semibold leading-normal">
              Kenya Prohibition Action of 2011, political-economy gender protection audits, and safeguarding frameworks.
            </p>
          </div>
        </div>
      </div>

      {/* Download List: A list of PDF guides with purple download arrows next to them */}
      <div className="bg-white border border-slate-100 rounded-[20px] p-4 shadow-xs space-y-3">
        <div className="flex justify-between items-center pb-2 border-b border-slate-100 font-sans">
          <span className="text-xxs font-extrabold text-slate-900 uppercase tracking-widest block">
            Downloadable Toolkits & Publications
          </span>
          <span className="text-xxs font-mono text-slate-400 font-bold">{filteredGuides.length} Archives</span>
        </div>

        {filteredGuides.length > 0 ? (
          <div className="space-y-2.5">
            {filteredGuides.map((guide) => {
              const isDownloaded = downloadTracker[guide.id];
              return (
                <div 
                  key={guide.id}
                  className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-start justify-between gap-3 text-left"
                >
                  <div className="min-w-0 flex-1">
                    <span className="text-xxs font-black tracking-wider uppercase bg-purple-primary/5 text-[#4F46E5] px-1.5 py-0.5 rounded">
                      {guide.category}
                    </span>
                    <h4 className="text-xs font-bold text-slate-950 mt-1 leading-snug">
                      {guide.title}
                    </h4>
                    <p className="text-xxs text-slate-500 font-medium leading-normal mt-1">
                      {guide.description}
                    </p>
                    <p className="text-xxs font-mono text-slate-400 mt-1.5">{guide.size} · {guide.format}</p>
                  </div>

                  {/* Direct Link Tag with target="_blank" for robust iframe support */}
                  <a
                    href={guide.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setDownloadTracker(prev => ({ ...prev, [guide.id]: true }))}
                    className={`w-7.5 h-7.5 rounded-full flex items-center justify-center transition-all shrink-0 mt-0.5 ${
                      isDownloaded 
                        ? 'bg-emerald-50 text-emerald-500 hover:bg-emerald-100' 
                        : 'bg-white hover:bg-slate-100 border border-slate-200 text-[#4F46E5]'
                    }`}
                  >
                    {isDownloaded ? <FileCheck2 size={13} /> : <Download size={13} />}
                  </a>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xxs text-center text-slate-400 py-4 font-semibold italic">
            No safety guidelines fit search parameter.
          </p>
        )}
      </div>

      {/* Banner: A vibrant purple-to-blue gradient banner at the bottom with "Knowledge is Power" and a "Download All" button */}
      <div className="bg-gradient-to-r from-[#4F46E5] via-[#3F37C9] to-[#06B6D4] text-white rounded-[20px] p-4.5 shadow-lg relative overflow-hidden text-center flex flex-col items-center">
        <div className="absolute inset-0 bg-white/5 backdrop-blur-xs pointer-events-none" />
        <div className="relative z-10 w-full flex flex-col items-center">
          <Lightbulb size={20} className="text-amber-300 animate-bounce mb-1.5" />
          <h3 className="font-display font-black text-sm text-white tracking-tight uppercase leading-none mb-1">
            Knowledge is Power
          </h3>
          <p className="text-xxs text-indigo-150 font-bold mb-3.5">
            Cache all regional protection files for instant offline viewing.
          </p>
          
          <button
            onClick={handleDownloadAll}
            disabled={downloadedAll}
            className={`w-full py-2 rounded-xl font-extrabold text-xxs uppercase tracking-wider transition-all select-none ${
              downloadedAll 
                ? 'bg-emerald-500 text-white shadow-inner pointer-events-none' 
                : 'bg-white hover:bg-indigo-50 text-[#4F46E5] shadow-md active:scale-[0.98]'
            }`}
          >
            {downloadedAll ? 'Offline Cache Ready' : 'Download All Toolkits'}
          </button>
        </div>
      </div>

    </div>
  );
};

export default ResourceHub;
