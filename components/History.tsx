
import React from 'react';
import { HistoryItem } from '../types';

interface HistoryProps {
  items: HistoryItem[];
  onSelectItem: (item: HistoryItem) => void;
  onClearHistory: () => void;
  onBack: () => void;
}

const History: React.FC<HistoryProps> = ({ items, onSelectItem, onClearHistory, onBack }) => {
  const formatDate = (timestamp: number) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(timestamp));
  };

  return (
    <div className="w-full max-w-4xl mx-auto animate-fade-in space-y-8 pb-16">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight">Your History</h2>
          <p className="text-slate-400 font-medium">Review your previous analysis reports.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onClearHistory}
            className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-rose-400 transition-colors border border-white/5 rounded-lg"
          >
            Clear All
          </button>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white rounded-lg transition-all border border-white/10"
          >
            Back to Dashboard
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="glass-panel p-20 rounded-3xl border border-white/5 text-center space-y-4">
          <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4 opacity-50">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-slate-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <p className="text-slate-500 font-medium uppercase tracking-widest text-xs">No reports found yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {[...items].sort((a, b) => b.timestamp - a.timestamp).map((item) => {
            const isAI = item.result.isLikelyAI;
            // Prefer descriptive title, fallback to filename
            const displayTitle = item.result.suggestedTitle || item.fileName;
            
            return (
              <div
                key={item.id}
                onClick={() => onSelectItem(item)}
                className="glass-panel p-4 rounded-2xl border border-white/5 hover:border-brand-500/30 cursor-pointer transition-all group flex items-center justify-between"
              >
                <div className="flex items-center gap-6 overflow-hidden">
                  <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden relative flex items-center justify-center bg-slate-900 border border-white/5 shrink-0`}>
                    {item.fileData ? (
                      item.fileType === 'video' ? (
                        <div className="relative w-full h-full">
                           <video src={item.fileData} className="w-full h-full object-cover opacity-60" />
                           <div className="absolute inset-0 flex items-center justify-center">
                             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-white/50">
                               <path fillRule="evenodd" d="M4.5 5.653c0-1.427 1.522-2.333 2.776-1.635l9.906 5.514c1.24.69 1.24 2.479 0 3.17l-9.906 5.515c-1.254.7-2.776-.208-2.776-1.635V5.653Z" clipRule="evenodd" />
                             </svg>
                           </div>
                        </div>
                      ) : (
                        <img src={item.fileData} className="w-full h-full object-cover opacity-80" alt="Thumbnail" />
                      )
                    ) : (
                      <div className={`w-full h-full flex items-center justify-center ${isAI ? 'bg-rose-500/10' : 'bg-accent-500/10'}`}>
                         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-6 h-6 ${isAI ? 'text-rose-400' : 'text-accent-400'}`}>
                           <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6.75a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6.75v10.5a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                         </svg>
                      </div>
                    )}
                  </div>
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 overflow-hidden">
                      <span className="text-white font-bold group-hover:text-brand-400 transition-colors truncate text-sm sm:text-base">
                        {displayTitle}
                      </span>
                      <span className={`w-fit px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest shrink-0 ${isAI ? 'bg-rose-500/20 text-rose-400' : 'bg-accent-500/20 text-accent-400'}`}>
                        {item.result.verdict}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-bold tracking-widest uppercase truncate">
                      {formatDate(item.timestamp)} • {item.result.confidenceScore}% LIKELIHOOD
                    </div>
                  </div>
                </div>
                <div className="hidden sm:block pr-4 shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-slate-600 group-hover:text-white group-hover:translate-x-1 transition-all">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                  </svg>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default History;
