import React from 'react';
import { BookOpen, Video, FileText, ExternalLink, ShieldCheck, Waves, Shield, CloudRain } from 'lucide-react';
import { motion } from 'motion/react';

const ResourceHub: React.FC = () => {
  const resources = [
    {
      title: "FGM Prevention Guide",
      type: "Guide",
      category: "FGM Protection",
      description: "A comprehensive guide on the physical and psychological impacts of FGM and how to seek help.",
      icon: ShieldCheck,
      color: "text-purple-primary",
      bg: "bg-purple-primary/10",
      link: "https://www.thegirlgeneration.org/resources"
    },
    {
      title: "Flood Safety Toolkit",
      type: "Toolkit",
      category: "Flood Safety",
      description: "Essential steps to take before, during, and after a flood in Isiolo County.",
      icon: Waves,
      color: "text-cyan-500",
      bg: "bg-cyan-50",
      link: "#"
    },
    {
      title: "Community Resilience Video",
      type: "Video",
      category: "FGM Protection",
      description: "Stories of change from Isiolo: How local communities are ending FGM.",
      icon: Video,
      color: "text-purple-primary",
      bg: "bg-purple-primary/10",
      link: "https://www.thegirlgeneration.org/videos"
    }
  ];

  return (
    <div className="p-5 text-slate-800 font-sans max-w-md mx-auto">
      <div className="text-center mb-5">
        <h1 className="text-xl font-display font-extrabold text-slate-900 tracking-tight leading-none mb-1">
          Partner <span className="text-[#4F46E5]">Routes</span>
        </h1>
        <p className="text-[10px] text-text-dim font-semibold uppercase tracking-wider">
          Resources & Educational Guides
        </p>
      </div>

      <div className="space-y-3">
        {resources.map((res, index) => (
          <motion.a 
            key={index} 
            href={res.link}
            target="_blank"
            rel="noopener noreferrer"
            className="block bg-white border border-slate-150 rounded-2xl p-4 shadow-xs hover:border-[#4F46E5]/45 transition-colors group text-left"
          >
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 ${res.bg} ${res.color} rounded-xl flex items-center justify-center shrink-0 border border-slate-50`}>
                <res.icon size={20} />
              </div>
              <div className="flex-grow">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[8px] font-bold uppercase tracking-wider text-text-dim px-1 bg-slate-100 rounded border border-slate-100">{res.type}</span>
                  <span className={`text-[8px] font-bold uppercase tracking-wider ${res.color}`}>{res.category}</span>
                </div>
                <h3 className="text-xs font-display font-bold text-slate-950 leading-tight mb-1 group-hover:text-[#4F46E5] transition-colors">{res.title}</h3>
                <p className="text-[10px] text-slate-500 leading-normal line-clamp-2 font-medium">{res.description}</p>
              </div>
            </div>
            
            <div 
              className="flex items-center justify-center gap-1.5 py-1.5 border border-slate-150 text-slate-900 text-[9px] font-bold rounded-xl mt-3 hover:bg-[#4F46E5] hover:text-white hover:border-transparent transition-all"
            >
              <span>View Resource</span>
              <ExternalLink size={10} />
            </div>
          </motion.a>
        ))}
      </div>

      {/* Partner Spotlight */}
      <div className="mt-5 bg-white border border-slate-150 rounded-3xl p-4 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#4F46E5]/5 rounded-full -mr-16 -mt-16 blur-xl" />
        
        <div className="relative z-10 text-center">
          <h2 className="text-sm font-display font-extrabold mb-1.5 tracking-tight">The Girl Generation Alliance</h2>
          <p className="text-[9px] text-text-dim leading-relaxed mb-4 font-medium">
            Bonga Box works alongside global advocates like The Girl Generation to distribute safe protection toolkits directly to clubs in Isiolo County.
          </p>
          <a 
            href="https://www.thegirlgeneration.org" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="inline-flex items-center justify-center gap-1.5 py-2 px-4 bg-[#4f46e5]/10 text-[#4f46e5] text-[9.5px] font-bold rounded-xl uppercase tracking-wider hover:bg-[#4f46e5] hover:text-white transition-all pointer-events-auto"
          >
            <span>Visit Home Alliance</span>
            <ExternalLink size={11} />
          </a>
        </div>
      </div>
    </div>
  );
};

export default ResourceHub;
