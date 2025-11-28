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
  const { isLikelyAI, confidenceScore, verdict, reasoning, artifactsFound, annotatedArtifacts, technicalAnalysis } = result;
  
  // State for interactivity
  const [hoveredArtifactIndex, setHoveredArtifactIndex] = useState<number | null>(null);
  const [isArtifactsSectionOpen, setIsArtifactsSectionOpen] = useState(true);
  const [expandedArtifactIndices, setExpandedArtifactIndices] = useState<Set<number>>(new Set());

  // Helper to toggle artifact details
  const toggleArtifact = (index: number) => {
    const newSet = new Set(expandedArtifactIndices);
    if (newSet.has(index)) {
      newSet.delete(index);
    } else {
      newSet.add(index);
    }
    setExpandedArtifactIndices(newSet);
  };

  // Determine color scheme based on result
  const isSafe = !isLikelyAI;
  const colorClass = isSafe ? 'text-emerald-400' : 'text-rose-500';
  const bgClass = isSafe ? 'bg-emerald-500' : 'bg-rose-500';
  const borderClass = isSafe ? 'border-emerald-500/30' : 'border-rose-500/30';

  return (
    <div className="w-full max-w-6xl mx-auto animate-fade-in space-y-8 pb-12">
      
      {/* 1. Header Result Card */}
      <div className={`glass-panel rounded-3xl p-8 border ${borderClass} relative overflow-hidden`}>
        <div className={`absolute top-0 left-0 w-2 h-full ${bgClass} opacity-80`}></div>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h2 className="text-slate-400 text-sm uppercase tracking-wider font-semibold mb-1">Analysis Verdict</h2>
            <h1 className={`text-4xl md:text-5xl font-bold ${colorClass} tracking-tight`}>
              {verdict}
            </h1>
          </div>
          
          <div className="flex items-center gap-4 bg-slate-800/50 p-4 rounded-2xl border border-slate-700">
            <div className="text-right">
              <div className="text-xs text-slate-400 uppercase font-bold">Confidence</div>
              <div className="text-2xl font-mono font-bold text-white">{confidenceScore}%</div>
            </div>
            <div className="w-16 h-16 relative flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-700" />
                <circle 
                  cx="32" cy="32" r="28" 
                  stroke="currentColor" 
                  strokeWidth="4" 
                  fill="transparent" 
                  strokeDasharray={175.9} 
                  strokeDashoffset={175.9 - (175.9 * confidenceScore) / 100} 
                  className={colorClass} 
                />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="mt-8">
          <p className="text-lg text-slate-200 leading-relaxed font-light">
            {reasoning}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* 2. Visual Evidence Section (Input Image with Overlays) */}
        <div className="lg:col-span-1 space-y-4">
           <div className="flex items-center justify-between px-1">
             <h3 className="text-xl font-semibold text-white flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-brand-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              </svg>
              Visual Evidence
            </h3>
            <span className="text-xs text-slate-400 bg-slate-800/50 px-2 py-1 rounded border border-slate-700">
              {annotatedArtifacts?.length || 0} issues detected
            </span>
           </div>

          <div className="relative rounded-2xl overflow-hidden border border-slate-700 bg-black shadow-2xl group">
            {fileUrl ? (
              fileType === 'video' ? (
                <video src={fileUrl} controls className="w-full h-auto max-h-[600px] object-contain" />
              ) : (
                <div className="relative w-full">
                  <img src={fileUrl} alt="Analyzed Media" className="w-full h-auto block" />
                  
                  {/* SVG Overlay layer */}
                  {annotatedArtifacts && annotatedArtifacts.length > 0 && (
                    <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 1000 1000" preserveAspectRatio="none">
                      <defs>
                        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                          <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
                          <feMerge>
                            <feMergeNode in="coloredBlur"/>
                            <feMergeNode in="SourceGraphic"/>
                          </feMerge>
                        </filter>
                        <filter id="solid-text-bg" x="0" y="0" width="1" height="1">
                          <feFlood floodColor="black" result="bg" />
                          <feMerge>
                            <feMergeNode in="bg"/>
                            <feMergeNode in="SourceGraphic"/>
                          </feMerge>
                        </filter>
                      </defs>
                      {annotatedArtifacts.map((artifact, index) => {
                        const [ymin, xmin, ymax, xmax] = artifact.box_2d;
                        const width = xmax - xmin;
                        const height = ymax - ymin;
                        const cx = xmin + width / 2;
                        const cy = ymin + height / 2;
                        
                        // Smart Positioning logic
                        const isRightSide = cx > 500;
                        const isBottomSide = cy > 500;

                        // Distances for the label - Increased for better separation
                        let dx = isRightSide ? -180 : 180;
                        let dy = isBottomSide ? -120 : 120;

                        // Target Label Position
                        let labelX = cx + dx;
                        let labelY = cy + dy;

                        // Dimensions - SIGNIFICANTLY INCREASED for readability
                        const LABEL_WIDTH = 320;
                        const LABEL_HEIGHT = 100; 
                        const PADDING = 20;

                        // Clamp Logic
                        if (labelX < PADDING) labelX = PADDING;
                        if (labelX > 1000 - LABEL_WIDTH - PADDING) labelX = 1000 - LABEL_WIDTH - PADDING;
                        
                        if (labelY < PADDING) labelY = PADDING;
                        if (labelY > 1000 - LABEL_HEIGHT - PADDING) labelY = 1000 - LABEL_HEIGHT - PADDING;

                        // Connect line to the nearest point on the label box
                        const boxCenterX = labelX + LABEL_WIDTH / 2;
                        const boxCenterY = labelY + LABEL_HEIGHT / 2;

                        const isHovered = hoveredArtifactIndex === index;
                        // BLUE THEME as requested
                        const primaryColor = '#0ea5e9'; // sky-500
                        const glowColor = '#bae6fd'; // sky-200
                        
                        return (
                          <g key={index} className="transition-all duration-300 ease-out">
                            
                            {/* 1. Radar Target Marker (Replacing the big ellipse) */}
                            <g filter="url(#glow)">
                                {/* Center Dot */}
                                <circle 
                                    cx={cx} 
                                    cy={cy} 
                                    r={isHovered ? 8 : 6} 
                                    fill={glowColor}
                                    className="animate-pulse"
                                />
                                {/* Inner Ring */}
                                <circle 
                                    cx={cx} 
                                    cy={cy} 
                                    r={20} 
                                    stroke={primaryColor} 
                                    strokeWidth="3" 
                                    fill="none" 
                                />
                                {/* Outer Ring (faint) */}
                                <circle 
                                    cx={cx} 
                                    cy={cy} 
                                    r={35} 
                                    stroke={primaryColor} 
                                    strokeWidth="2" 
                                    strokeDasharray="4,4"
                                    fill="none" 
                                    opacity="0.8"
                                />
                            </g>

                            {/* 2. Dotted Connecting Line */}
                            <line 
                              x1={cx} 
                              y1={cy} 
                              x2={boxCenterX} 
                              y2={boxCenterY} 
                              stroke={primaryColor} 
                              strokeWidth="3" 
                              strokeDasharray="8,6"
                              className="opacity-100 drop-shadow-md"
                            />

                            {/* 3. High Readability Label Container */}
                            <foreignObject 
                              x={labelX} 
                              y={labelY} 
                              width={LABEL_WIDTH} 
                              height={LABEL_HEIGHT}
                              className="overflow-visible"
                            >
                                <div 
                                  className={`
                                    flex flex-col justify-center items-center px-6 py-4 rounded-xl
                                    shadow-2xl border-2 transition-transform duration-200
                                    ${isHovered ? 'scale-110 z-50' : 'z-10'}
                                  `}
                                  style={{ 
                                    backgroundColor: '#000000', // PURE BLACK for max contrast
                                    borderColor: primaryColor,
                                    boxShadow: `0 0 25px ${primaryColor}60` // Stronger glow
                                  }}
                                  onMouseEnter={() => setHoveredArtifactIndex(index)}
                                  onMouseLeave={() => setHoveredArtifactIndex(null)}
                                >
                                  {/* Larger Font, Extra Bold, Wider Tracking */}
                                  <span className="text-white font-extrabold text-xl md:text-2xl text-center leading-none tracking-wide drop-shadow-md">
                                    {artifact.label}
                                  </span>
                                </div>
                            </foreignObject>
                          </g>
                        );
                      })}
                    </svg>
                  )}
                </div>
              )
            ) : (
              <div className="h-64 flex items-center justify-center text-slate-500">No Image Loaded</div>
            )}
          </div>
          <p className="text-xs text-slate-500 text-center">
            {annotatedArtifacts && annotatedArtifacts.length > 0 
              ? "Highlighted regions indicate areas with synthetic artifacts."
              : "No specific local artifacts were highlighted."}
          </p>
        </div>

        {/* 3. Text Analysis Column */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Indicators List - Collapsible Section */}
          <div className="glass-panel rounded-3xl overflow-hidden transition-all duration-300">
            {/* Collapsible Header */}
            <button 
              onClick={() => setIsArtifactsSectionOpen(!isArtifactsSectionOpen)}
              className="w-full p-6 flex items-center justify-between hover:bg-slate-800/30 transition-colors group"
            >
              <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-accent-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Detected Artifacts
              </h3>
              <div className={`p-2 rounded-full bg-slate-800 text-slate-400 group-hover:text-white group-hover:bg-slate-700 transition-all ${isArtifactsSectionOpen ? 'rotate-180' : ''}`}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </div>
            </button>
            
            {/* Collapsible Content */}
            <div 
              className={`
                px-6 transition-all duration-500 ease-in-out overflow-hidden
                ${isArtifactsSectionOpen ? 'max-h-[800px] opacity-100 pb-6' : 'max-h-0 opacity-0 pb-0'}
              `}
            >
              {annotatedArtifacts && annotatedArtifacts.length > 0 ? (
                 <div className="space-y-3">
                  {annotatedArtifacts.map((artifact, idx) => {
                    const isExpanded = expandedArtifactIndices.has(idx);
                    return (
                      <div 
                        key={idx}
                        onMouseEnter={() => setHoveredArtifactIndex(idx)}
                        onMouseLeave={() => setHoveredArtifactIndex(null)}
                        onClick={() => toggleArtifact(idx)}
                        className={`
                          rounded-xl border transition-all cursor-pointer overflow-hidden
                          ${hoveredArtifactIndex === idx 
                            ? 'bg-sky-500/10 border-sky-500/50 shadow-[0_0_15px_rgba(14,165,233,0.1)]' 
                            : 'bg-slate-800/40 border-slate-700 hover:bg-slate-800/60'}
                        `}
                      >
                        <div className="p-4 flex justify-between items-center">
                          <div className="flex items-center gap-3">
                             <span className={`w-2 h-2 rounded-full transition-colors ${hoveredArtifactIndex === idx ? 'bg-sky-500' : 'bg-slate-500'}`}></span>
                             <span className="text-slate-200 font-medium">{artifact.label}</span>
                          </div>
                          <div className="flex items-center gap-3">
                             {hoveredArtifactIndex === idx && (
                                <span className="text-xs text-sky-400 font-mono animate-pulse hidden sm:inline-block">LOCATING</span>
                              )}
                              <svg 
                                xmlns="http://www.w3.org/2000/svg" 
                                fill="none" 
                                viewBox="0 0 24 24" 
                                strokeWidth={2} 
                                stroke="currentColor" 
                                className={`w-4 h-4 text-slate-500 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                              </svg>
                          </div>
                        </div>

                        {/* Accordion Content for Details */}
                        <div className={`transition-all duration-300 ease-in-out bg-slate-900/30 ${isExpanded ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                           <div className="p-4 pt-0 text-sm text-slate-400 pl-9 border-l-2 border-slate-700 ml-5 mb-4">
                             {artifact.description || "No further details provided."}
                           </div>
                        </div>
                      </div>
                    );
                  })}
                 </div>
              ) : artifactsFound && artifactsFound.length > 0 ? (
                <ul className="space-y-3">
                  {artifactsFound.map((artifact, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-slate-300">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-accent-500 flex-shrink-0"></span>
                      <span>{artifact}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-500 italic">No suspicious artifacts detected.</p>
              )}
            </div>
          </div>

          {/* Technical Deep Dive */}
          <div className="glass-panel p-6 rounded-3xl">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-brand-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
              Technical Breakdown
            </h3>
            <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">
              {technicalAnalysis}
            </p>
          </div>

          <div className="flex justify-start pt-2">
            <button
              onClick={onAnalyzeNew}
              className="bg-slate-700 hover:bg-slate-600 text-white font-medium py-3 px-8 rounded-full transition-colors duration-200 flex items-center gap-2 w-full justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
              Analyze Another File
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisResultView;