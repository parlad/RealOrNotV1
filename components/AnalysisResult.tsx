
import React, { useState } from 'react';
import { DetectionResult, FileType } from '../types';

interface AnalysisResultProps {
  result: DetectionResult;
  fileUrl: string | null;
  fileType: FileType | null;
  onReset: () => void;
  onAnalyzeNew: () => void;
}

const AnalysisResultView: React.FC<AnalysisResultProps> = ({ result, fileUrl, fileType, onReset, onAnalyzeNew }) => {
  const { isLikelyAI, confidenceScore, suggestedTitle, verdict, reasoning, artifactsFound, annotatedArtifacts, technicalAnalysis } = result;
  
  const [hoveredArtifactIndex, setHoveredArtifactIndex] = useState<number | null>(null);
  const [expandedArtifactIndices, setExpandedArtifactIndices] = useState<Set<number>>(new Set());

  const toggleArtifact = (index: number) => {
    const newSet = new Set(expandedArtifactIndices);
    if (newSet.has(index)) {
      newSet.delete(index);
    } else {
      newSet.add(index);
    }
    setExpandedArtifactIndices(newSet);
  };

  const isSafe = !isLikelyAI;
  const colorClass = isSafe ? 'text-accent-400' : 'text-rose-400';
  const borderClass = isSafe ? 'border-accent-500/20' : 'border-rose-500/20';

  return (
    <div className="w-full max-w-5xl mx-auto animate-fade-in space-y-8 pb-16">
      
      {/* 1. Header Result Card */}
      <div className={`glass-panel rounded-3xl p-10 border ${borderClass} relative overflow-hidden shadow-2xl`}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2 min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-slate-500 text-[10px] uppercase tracking-widest font-black">Analysis Result</h2>
              {suggestedTitle && (
                <span className="text-slate-600 text-[10px] uppercase font-bold tracking-widest">• {suggestedTitle}</span>
              )}
            </div>
            <h1 className={`text-4xl md:text-6xl font-black ${colorClass} tracking-tight truncate`}>
              {verdict}
            </h1>
          </div>
          
          <div className="flex items-center gap-6 bg-black/40 px-6 py-4 rounded-2xl border border-white/5 backdrop-blur-md">
            <div className="text-right">
              <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Likelihood</div>
              <div className="text-3xl font-mono font-black text-white">{confidenceScore}%</div>
            </div>
            <div className="w-16 h-16 relative flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-slate-800" />
                <circle 
                  cx="32" cy="32" r="28" 
                  stroke="currentColor" 
                  strokeWidth="6" 
                  fill="transparent" 
                  strokeDasharray={175.9} 
                  strokeDashoffset={175.9 - (175.9 * confidenceScore) / 100} 
                  className={colorClass} 
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="mt-8">
          <p className="text-xl text-slate-200 leading-relaxed font-medium">
            {reasoning}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* 2. Visual Analysis Section */}
        <div className="space-y-6">
           <div className="flex items-center justify-between px-2">
             <h3 className="text-xs font-black text-slate-300 flex items-center gap-3 uppercase tracking-widest">
              Visual Highlights
            </h3>
           </div>

          <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-black shadow-xl group">
            {fileUrl ? (
              fileType === 'video' ? (
                <video src={fileUrl} controls className="w-full h-auto max-h-[500px] object-contain" />
              ) : (
                <div className="relative w-full">
                  <img src={fileUrl} alt="Analyzed" className="w-full h-auto block" />
                  
                  {annotatedArtifacts && annotatedArtifacts.length > 0 && (
                    <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 1000 1000" preserveAspectRatio="none">
                      {annotatedArtifacts.map((artifact, index) => {
                        const [ymin, xmin, ymax, xmax] = artifact.box_2d;
                        const width = xmax - xmin;
                        const height = ymax - ymin;
                        const cx = xmin + width / 2;
                        const cy = ymin + height / 2;
                        const primaryColor = isSafe ? '#06b6d4' : '#f43f5e';
                        const isHovered = hoveredArtifactIndex === index;
                        
                        return (
                          <g key={index}>
                            <rect 
                              x={xmin} y={ymin} width={width} height={height} 
                              fill="none" stroke={primaryColor} strokeWidth={isHovered ? "6" : "3"} 
                              opacity={isHovered ? "1" : "0.6"}
                              className="transition-all duration-200"
                            />
                            <circle cx={cx} cy={cy} r={isHovered ? 12 : 8} fill={primaryColor} />
                          </g>
                        );
                      })}
                    </svg>
                  )}
                </div>
              )
            ) : null}
          </div>
        </div>

        {/* 3. Findings Column */}
        <div className="space-y-8">
          <div className="glass-panel rounded-2xl overflow-hidden border border-white/5">
            <div className="p-8 border-b border-white/5">
               <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-3">
                 What we found
               </h3>
            </div>
            
            <div className="p-8">
              {annotatedArtifacts && annotatedArtifacts.length > 0 ? (
                 <div className="space-y-4">
                  {annotatedArtifacts.map((artifact, idx) => {
                    const isExpanded = expandedArtifactIndices.has(idx);
                    return (
                      <div 
                        key={idx}
                        onMouseEnter={() => setHoveredArtifactIndex(idx)}
                        onMouseLeave={() => setHoveredArtifactIndex(null)}
                        onClick={() => toggleArtifact(idx)}
                        className={`
                          rounded-xl border transition-all cursor-pointer p-4
                          ${hoveredArtifactIndex === idx 
                            ? 'bg-brand-500/10 border-brand-500/30' 
                            : 'bg-white/[0.02] border-white/5'}
                        `}
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-white font-bold text-sm">{artifact.label}</span>
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className={`w-4 h-4 text-slate-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                          </svg>
                        </div>
                        {isExpanded && (
                          <div className="mt-3 text-slate-400 text-xs leading-relaxed">
                            {artifact.description}
                          </div>
                        )}
                      </div>
                    );
                  })}
                 </div>
              ) : (
                <p className="text-slate-600 text-sm font-medium italic">No obvious AI markers detected.</p>
              )}
            </div>
          </div>

          <div className="glass-panel p-8 rounded-2xl border border-white/5">
            <h3 className="text-xs font-black text-slate-300 uppercase tracking-widest mb-4">Breakdown</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              {technicalAnalysis}
            </p>
          </div>

          <button
            onClick={onAnalyzeNew}
            className="w-full py-5 bg-brand-600 hover:bg-brand-500 text-white font-black uppercase tracking-widest text-xs rounded-xl transition-all shadow-lg"
          >
            Check Another File
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnalysisResultView;
