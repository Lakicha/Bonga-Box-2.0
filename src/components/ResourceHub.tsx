import React from 'react';
import { BookOpen, Video, FileText, ExternalLink, ShieldCheck, Waves, Shield, CloudRain } from 'lucide-react';
import { motion } from 'motion/react';

const ResourceHub: React.FC = () => {
  const resources = [
    {
      title: "FGM Prevention Guide",
      type: "Guide",
      category: "FGM Prevention",
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
      color: "text-yellow-accent",
      bg: "bg-yellow-accent/10",
      link: "#"
    },
    {
      title: "Community Resilience Video",
      type: "Video",
      category: "FGM Prevention",
      description: "Stories of change from Isiolo: How local communities are ending FGM.",
      icon: Video,
      color: "text-purple-primary",
      bg: "bg-purple-primary/10",
      link: "https://www.thegirlgeneration.org/videos"
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-32 text-white">
      <div className="text-center mb-20">
        <h1 className="text-4xl lg:text-5xl font-bold mb-4">Resource <span className="gradient-text">Hub</span></h1>
        <p className="text-text-dim max-w-2xl mx-auto">
          Access guides, videos, and toolkits to stay informed and protect your community.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {resources.map((res, index) => (
          <motion.a 
            key={index} 
            href={res.link}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ y: -10 }}
            className="glass-card flex flex-col h-full hover:shadow-glow transition-all border-white/5 hover:border-purple-primary/30 group p-8"
          >
            <div className={`w-16 h-16 ${res.bg} ${res.color} rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform border border-white/5 shadow-glow`}>
              <res.icon size={32} />
            </div>
            <div className="flex-grow">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-text-dim px-2 py-1 bg-white/5 rounded-md border border-white/5">{res.type}</span>
                <span className="text-[10px] font-bold text-purple-primary uppercase tracking-widest">{res.category}</span>
              </div>
              <h3 className="text-2xl font-bold mb-4 group-hover:text-purple-primary transition-colors">{res.title}</h3>
              <p className="text-text-dim leading-relaxed mb-8 text-sm">{res.description}</p>
            </div>
            <div 
              className="flex items-center justify-center gap-3 py-4 border border-purple-primary/20 text-purple-primary text-xs font-bold rounded-2xl group-hover:bg-purple-primary group-hover:text-white group-hover:border-purple-primary transition-all shadow-glow uppercase tracking-widest"
            >
              <span>View Resource</span>
              <ExternalLink size={14} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </div>
          </motion.a>
        ))}
      </div>

      <div className="mt-32 p-12 glass-card flex flex-col lg:flex-row items-center gap-16 relative overflow-hidden border-purple-primary/20">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-primary/10 rounded-full -mr-48 -mt-48 blur-[120px]" />
        
        <div className="lg:w-2/3 relative z-10">
          <h2 className="text-4xl font-bold mb-6 tracking-tight">Partnering with <span className="gradient-text">The Girl Generation</span></h2>
          <p className="text-lg text-text-dim leading-relaxed mb-10">
            Bonga Box works closely with global partners like The Girl Generation to provide the most up-to-date information and support for ending FGM in Isiolo County.
          </p>
          <a href="https://www.thegirlgeneration.org" target="_blank" rel="noopener noreferrer" className="btn-primary inline-flex items-center gap-3 !py-4 !px-10 shadow-glow">
            Visit The Girl Generation <ExternalLink size={20} />
          </a>
        </div>
        <div className="lg:w-1/3 flex justify-center relative z-10">
          <div className="w-64 h-64 bg-linear-to-br from-purple-primary/10 to-magenta-accent/10 rounded-full flex items-center justify-center border border-white/5 shadow-glow relative">
            <div className="absolute inset-0 bg-purple-primary/5 blur-2xl rounded-full" />
            <BookOpen size={80} className="text-purple-primary opacity-50 relative z-10" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResourceHub;
