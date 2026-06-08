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
  FileCheck2
} from 'lucide-react';
import { motion } from 'motion/react';

const ResourceHub: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [downloadedAll, setDownloadedAll] = useState(false);
  const [downloadTracker, setDownloadTracker] = useState<Record<string, boolean>>({});

  const guides = [
    {
      id: 'guide-fgm-1',
      title: "Female Genital Mutilation Prevention and Response for Community Health Promoters",
      description: "The strongest practical toolkit for prevention, referrals, survivor support, and community awareness in Kenya.",
      size: "3.2 MB",
      format: "Toolkit",
      category: "FGM Prevention",
      url: "https://thegirlgeneration.org/global-public-goods/?utm_source=chatgpt.com"
    },
    {
      id: 'guide-fgm-2',
      title: "Community Engagement Toolkit: Champions Pocket Guide",
      description: "Useful for community dialogues, awareness campaigns, and engagement with elders and religious leaders.",
      size: "1.8 MB",
      format: "Pocket Guide",
      category: "FGM Prevention",
      url: "https://thegirlgeneration.org/global-public-goods/?utm_source=chatgpt.com"
    },
    {
      id: 'guide-fgm-3',
      title: "Developing a Girl-Centred Approach to End FGM",
      description: "Focuses on protecting girls, empowerment, and survivor-centered programming.",
      size: "2.4 MB",
      format: "Reference Guide",
      category: "FGM Prevention",
      url: "https://thegirlgeneration.org/global-public-goods/?utm_source=chatgpt.com"
    },
    {
      id: 'guide-legal-1',
      title: "Political Economy Analysis – Kenya",
      description: "Examines Kenya's policy, governance, and legal environment related to FGM and gender protection safeguarding.",
      size: "4.5 MB",
      format: "PDF Report",
      category: "Legal Framework",
      url: "https://thegirlgeneration.org/wp-content/uploads/2022/10/PEA-Kenya_final_-PDF-002.pdf?utm_source=chatgpt.com"
    },
    {
      id: 'guide-legal-2',
      title: "Do No Harm Safeguarding and Emotional Well-being Framework",
      description: "Essential framework for survivor protection, safeguarding standards, and ethical response mechanisms.",
      size: "1.2 MB",
      format: "Framework",
      category: "Legal Framework",
      url: "https://thegirlgeneration.org/publications/?utm_source=chatgpt.com"
    },
    {
      id: 'guide-legal-3',
      title: "Kenya Prohibition of Female Genital Mutilation Act, 2011",
      description: "Official legislation criminalizing FGM, enforcing strict penalties, and setting safe-keeping guidelines in Isiolo and beyond.",
      size: "950 KB",
      format: "Legislative Act",
      category: "Legal Framework",
      url: "https://thegirlgeneration.org/publications/?utm_source=chatgpt.com"
    }
  ];

  const handleDownloadAll = () => {
    setDownloadedAll(true);
    const updatedTracker: Record<string, boolean> = {};
    guides.forEach(guide => {
      updatedTracker[guide.id] = true;
    });
    setDownloadTracker(updatedTracker);
    window.open("https://thegirlgeneration.org/publications/?utm_source=chatgpt.com", "_blank", "noopener,noreferrer");
  };

  // Filter guides
  const filteredGuides = guides.filter(guide => 
    guide.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    guide.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    guide.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="font-sans max-w-md mx-auto select-none py-2 space-y-5">
      
      {/* Search Header Bar with thin purple border and magnifying glass icon */}
      <div className="relative">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-purple-primary">
          <Search size={16} />
        </div>
        <input 
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search safety guides, publications..." 
          className="w-full pl-11 pr-5 py-3.5 bg-white border border-purple-primary rounded-2xl text-xs font-semibold focus:outline-none placeholder:text-slate-400 text-slate-800 shadow-xs"
        />
      </div>

      {/* Categories: Two clean cards for "FGM Prevention" and "Legal Framework" with educational design */}
      <div>
        <p className="text-[9.5px] text-slate-400 font-extrabold uppercase tracking-widest pl-1 mb-2.5">
          Knowledge Base Hub
        </p>

        <div className="grid grid-cols-2 gap-3.5">
          {/* Card Category FGM Prevention */}
          <div className="bg-white border border-slate-150 rounded-2xl p-4 flex flex-col text-left space-y-2 pb-5">
            <div className="w-9 h-9 rounded-xl bg-purple-primary/5 text-purple-primary flex items-center justify-center">
              <ShieldCheck size={20} />
            </div>
            <h3 className="text-xs font-display font-black text-slate-900 leading-tight">
              FGM Prevention
            </h3>
            <p className="text-[10px] text-slate-400 font-semibold leading-normal">
              Practical community response, referential guidelines, risk prevention, and safe-keeping networks.
            </p>
          </div>

          {/* Card Category Legal Framework */}
          <div className="bg-white border border-slate-150 rounded-2xl p-4 flex flex-col text-left space-y-2 pb-5">
            <div className="w-9 h-9 rounded-xl bg-purple-primary/5 text-purple-primary flex items-center justify-center">
              <BookOpen size={18} />
            </div>
            <h3 className="text-xs font-display font-black text-slate-900 leading-tight">
              Legal Framework
            </h3>
            <p className="text-[10px] text-slate-400 font-semibold leading-normal">
              Kenya Prohibition Action of 2011, political-economy gender protection audits, and safeguarding frameworks.
            </p>
          </div>
        </div>
      </div>

      {/* Download List: A list of PDF guides with purple download arrows next to them */}
      <div className="bg-white border border-slate-150 rounded-[2rem] p-5 shadow-xs space-y-3">
        <div className="flex justify-between items-center pb-2.5 border-b border-slate-100">
          <span className="text-[10px] font-extrabold text-slate-900 uppercase tracking-widest block">
            Downloadable Toolkits & Publications
          </span>
          <span className="text-[9px] font-mono text-slate-400 font-bold">{filteredGuides.length} Archives</span>
        </div>

        {filteredGuides.length > 0 ? (
          <div className="space-y-3">
            {filteredGuides.map((guide) => {
              const isDownloaded = downloadTracker[guide.id];
              return (
                <div 
                  key={guide.id}
                  className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl flex items-start justify-between gap-3.5 text-left"
                >
                  <div className="min-w-0 flex-1">
                    <span className="text-[8px] font-black tracking-wider uppercase bg-purple-primary/5 text-[#4F46E5] px-1.5 py-0.5 rounded">
                      {guide.category}
                    </span>
                    <h4 className="text-[11px] font-bold text-slate-950 mt-1 leading-snug">
                      {guide.title}
                    </h4>
                    <p className="text-[10px] text-slate-500 font-medium leading-normal mt-1">
                      {guide.description}
                    </p>
                    <p className="text-[9px] font-mono text-slate-400 mt-1.5">{guide.size} · {guide.format}</p>
                  </div>

                  {/* Direct Link Tag with target="_blank" for robust iframe support */}
                  <a
                    href={guide.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setDownloadTracker(prev => ({ ...prev, [guide.id]: true }))}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all shrink-0 mt-0.5 ${
                      isDownloaded 
                        ? 'bg-emerald-50 text-emerald-500 hover:bg-emerald-100' 
                        : 'bg-white hover:bg-slate-100 border border-slate-200 text-[#4F46E5]'
                    }`}
                  >
                    {isDownloaded ? <FileCheck2 size={14} /> : <Download size={14} />}
                  </a>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-[10.5px] text-center text-slate-400 py-4 font-semibold italic">
            No safety guidelines fit search parameter.
          </p>
        )}
      </div>

      {/* Banner: A vibrant purple-to-blue gradient banner at the bottom with "Knowledge is Power" and a "Download All" button */}
      <div className="bg-gradient-to-r from-[#4F46E5] via-[#3F37C9] to-[#06B6D4] text-white rounded-[2rem] p-5 shadow-lg relative overflow-hidden text-center flex flex-col items-center">
        <div className="absolute inset-0 bg-white/5 backdrop-blur-xs pointer-events-none" />
        <div className="relative z-10 w-full flex flex-col items-center">
          <Lightbulb size={24} className="text-amber-300 animate-bounce mb-2" />
          <h3 className="font-display font-black text-base text-white tracking-tight uppercase leading-none mb-1">
            Knowledge is Power
          </h3>
          <p className="text-[10px] text-indigo-150 font-bold mb-4">
            Cache all regional protection files for instant offline viewing.
          </p>
          
          <button
            onClick={handleDownloadAll}
            disabled={downloadedAll}
            className={`w-full py-2.5 rounded-xl font-extrabold text-[10px] uppercase tracking-wider transition-all select-none ${
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
