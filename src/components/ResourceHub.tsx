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
      title: "Isiolo Club Protection Protocol",
      size: "1.4 MB",
      format: "PDF",
      category: "FGM Prevention"
    },
    {
      id: 'guide-fgm-2',
      title: "Legal Framework on Gender Security",
      size: "820 KB",
      format: "PDF",
      category: "FGM Prevention"
    },
    {
      id: 'guide-flood-1',
      title: "Sandbagging & High Ground Grid Plans",
      size: "2.1 MB",
      format: "PDF",
      category: "Flood Safety"
    },
    {
      id: 'guide-flood-2',
      title: "First-Aid Torrential Water Hazards",
      size: "950 KB",
      format: "PDF",
      category: "Flood Safety"
    }
  ];

  const handleDownload = (id: string, title: string) => {
    setDownloadTracker(prev => ({ ...prev, [id]: true }));
    setTimeout(() => {
      alert(`Downloaded guide: ${title}`);
    }, 400);
  };

  const handleDownloadAll = () => {
    setDownloadedAll(true);
    setTimeout(() => {
      alert("All offline safety PDFs downloaded to device storage successfully.");
    }, 600);
  };

  // Filter guides
  const filteredGuides = guides.filter(guide => 
    guide.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
          placeholder="Search safety guides, directories..." 
          className="w-full pl-11 pr-5 py-3.5 bg-white border border-purple-primary rounded-2xl text-xs font-semibold focus:outline-none placeholder:text-slate-400 text-slate-800 shadow-sm"
        />
      </div>

      {/* Categories: Two clean cards for "FGM Prevention" and "Flood Safety" with educational design */}
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
              Safe community reporting networks and counselor helpline listings for Isiolo County.
            </p>
          </div>

          {/* Card Category Flood Safety */}
          <div className="bg-white border border-slate-150 rounded-2xl p-4 flex flex-col text-left space-y-2 pb-5">
            <div className="w-9 h-9 rounded-xl bg-purple-primary/5 text-purple-primary flex items-center justify-center">
              <CloudRain size={20} />
            </div>
            <h3 className="text-xs font-display font-black text-slate-900 leading-tight">
              Flood Safety
            </h3>
            <p className="text-[10px] text-slate-400 font-semibold leading-normal">
              Hydrological warning level indicators, sandbag store vectors, high elevation coordinates.
            </p>
          </div>
        </div>
      </div>

      {/* Download List: A list of PDF guides with purple download arrows next to them */}
      <div className="bg-white border border-slate-150 rounded-[2rem] p-5 shadow-xs space-y-3">
        <div className="flex justify-between items-center pb-2.5 border-b border-slate-100">
          <span className="text-[10px] font-extrabold text-slate-900 uppercase tracking-widest block">
            Downloadable Toolkits
          </span>
          <span className="text-[9px] font-mono text-slate-400 font-bold">{filteredGuides.length} Archives</span>
        </div>

        {filteredGuides.length > 0 ? (
          <div className="space-y-2.5">
            {filteredGuides.map((guide) => {
              const isDownloaded = downloadTracker[guide.id];
              return (
                <div 
                  key={guide.id}
                  className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <span className="text-[8px] font-black tracking-wider uppercase bg-purple-primary/5 text-[#4F46E5] px-1.5 py-0.5 rounded">
                      {guide.category}
                    </span>
                    <h4 className="text-[11px] font-bold text-slate-900 truncate mt-1">
                      {guide.title}
                    </h4>
                    <p className="text-[9px] font-mono text-slate-400 mt-0.5">{guide.size} · {guide.format}</p>
                  </div>

                  {/* Purple download arrow action */}
                  <button
                    onClick={() => handleDownload(guide.id, guide.title)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors shrink-0 ${
                      isDownloaded 
                        ? 'bg-emerald-50 text-emerald-500' 
                        : 'bg-white hover:bg-slate-100 border border-slate-201 text-[#4F46E5]'
                    }`}
                  >
                    {isDownloaded ? <FileCheck2 size={14} /> : <Download size={14} />}
                  </button>
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
                ? 'bg-emerald-500 text-white shadow-inner' 
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
