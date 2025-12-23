
import React, { useState, useRef, useEffect } from 'react';
import Dropzone from './components/Dropzone';
import AnalysisResultView from './components/AnalysisResult';
import Login from './components/Login';
import History from './components/History';
import { analyzeMedia } from './services/geminiService';
import { AnalysisStatus, DetectionResult, User, HistoryItem } from './types';
import { getAllHistory, saveHistoryItem, clearAllHistory } from './services/db';

const MAX_FREE_REQUESTS = 3;

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [usageCount, setUsageCount] = useState<number>(0);
  const [status, setStatus] = useState<AnalysisStatus>(AnalysisStatus.IDLE);
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [fileType, setFileType] = useState<'image' | 'video' | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('gc_user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      updateUsageCount(parsedUser.email);
      loadHistory();
    }
  }, []);

  const updateUsageCount = (email: string) => {
    const counts = JSON.parse(localStorage.getItem('gc_usage') || '{}');
    setUsageCount(counts[email] || 0);
  };

  const loadHistory = async () => {
    const history = await getAllHistory();
    setHistoryItems(history);
  };

  const clearHistory = async () => {
    if (!user) return;
    await clearAllHistory();
    setHistoryItems([]);
  };

  const incrementUsage = (email: string) => {
    const counts = JSON.parse(localStorage.getItem('gc_usage') || '{}');
    const newCount = (counts[email] || 0) + 1;
    counts[email] = newCount;
    localStorage.setItem('gc_usage', JSON.stringify(counts));
    setUsageCount(newCount);
  };

  const handleLogin = (newUser: User) => {
    setUser(newUser);
    localStorage.setItem('gc_user', JSON.stringify(newUser));
    updateUsageCount(newUser.email);
    loadHistory();
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('gc_user');
    handleReset();
  };

  const handleUpgrade = () => {
    if (!user) return;
    const upgradedUser = { ...user, isPro: true };
    setUser(upgradedUser);
    localStorage.setItem('gc_user', JSON.stringify(upgradedUser));
  };

  const handleFileSelect = async (file: File) => {
    if (!user) return;
    
    const isRestricted = !user.isOwner && !user.isPro;
    if (isRestricted && usageCount >= MAX_FREE_REQUESTS) {
      setStatus(AnalysisStatus.LIMIT_REACHED);
      return;
    }

    setResult(null);
    setStatus(AnalysisStatus.UPLOADING);
    
    if (fileUrl) {
      URL.revokeObjectURL(fileUrl);
    }
    
    const objectUrl = URL.createObjectURL(file);
    setFileUrl(objectUrl);
    const type = file.type.startsWith('video') ? 'video' : 'image' as 'image' | 'video';
    setFileType(type);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = async () => {
        const base64String = reader.result as string;
        const base64Data = base64String.split(',')[1];
        
        setStatus(AnalysisStatus.ANALYZING);
        try {
          const analysisResult = await analyzeMedia(base64Data, file.type);
          setResult(analysisResult);
          setStatus(AnalysisStatus.COMPLETE);
          
          const historyItem: HistoryItem = {
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            fileName: file.name,
            fileType: type,
            result: analysisResult,
            fileData: base64String, // Store full base64 for history viewing
            mimeType: file.type
          };
          await saveHistoryItem(historyItem);
          await loadHistory();
          
          if (!user.isOwner && !user.isPro) {
            incrementUsage(user.email);
          }
        } catch (error) {
          console.error(error);
          setStatus(AnalysisStatus.ERROR);
        }
      };

      reader.onerror = () => {
        setStatus(AnalysisStatus.ERROR);
      };

    } catch (e) {
      console.error(e);
      setStatus(AnalysisStatus.ERROR);
    }
  };

  const handleReset = () => {
    setStatus(AnalysisStatus.IDLE);
    setResult(null);
    if (fileUrl && !fileUrl.startsWith('data:')) {
      URL.revokeObjectURL(fileUrl);
    }
    setFileUrl(null);
    setFileType(null);
    setShowHistory(false);
  };

  const selectHistoryItem = (item: HistoryItem) => {
    setResult(item.result);
    setFileType(item.fileType as 'image' | 'video');
    setFileUrl(item.fileData || null);
    setStatus(AnalysisStatus.COMPLETE);
    setShowHistory(false);
  };
  
  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };
  
  const handleHiddenFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      handleFileSelect(file);
    }
    if (e.target) e.target.value = '';
  };

  const isAtLimit = !user?.isOwner && !user?.isPro && usageCount >= MAX_FREE_REQUESTS;

  return (
    <div className="min-h-screen text-slate-100 flex flex-col selection:bg-brand-500/30">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleHiddenFileInput}
        className="hidden"
        accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
      />

      <nav className="border-b border-white/5 bg-gray-950/40 backdrop-blur-3xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={handleReset}>
            <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center shadow-lg group-hover:scale-105 transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6 text-white">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight text-white hidden sm:block">AI or Real</span>
          </div>
          
          {user && (
            <div className="flex items-center gap-4 sm:gap-6">
              <button
                onClick={() => setShowHistory(true)}
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-white/5 border border-transparent hover:border-white/5 transition-all group"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-white">History</span>
              </button>

              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Credits:</span>
                <span className={`text-[10px] font-black uppercase tracking-widest ${isAtLimit ? 'text-rose-400' : 'text-accent-400'}`}>
                  {user.isOwner || user.isPro ? 'Unlimited' : `${usageCount} / ${MAX_FREE_REQUESTS}`}
                </span>
              </div>
              
              <button 
                onClick={handleLogout}
                className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </nav>

      <main className="flex-grow flex flex-col items-center justify-center p-6 sm:p-12 relative overflow-hidden">
        <div className="absolute top-0 -left-1/4 w-full h-full bg-brand-600/5 rounded-full blur-[150px] pointer-events-none"></div>
        <div className="absolute bottom-0 -right-1/4 w-full h-full bg-accent-600/5 rounded-full blur-[150px] pointer-events-none"></div>

        {!user ? (
          <Login onLogin={handleLogin} />
        ) : showHistory ? (
          <History 
            items={historyItems} 
            onSelectItem={selectHistoryItem} 
            onClearHistory={clearHistory}
            onBack={handleReset}
          />
        ) : (
          <>
            {status === AnalysisStatus.IDLE && (
              <div className="w-full max-w-4xl mx-auto text-center space-y-12 animate-fade-in-up">
                <div className="space-y-4">
                  <h1 className="text-6xl sm:text-8xl font-black tracking-tight text-white leading-none">
                    Is it <span className="text-brand-400">AI</span> or <span className="text-accent-400">Real</span>?
                  </h1>
                  <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto font-medium">
                    Upload a photo or video to quickly check for AI-generated patterns and visual inconsistencies.
                  </p>
                </div>
                
                {isAtLimit ? (
                  <div className="glass-panel p-12 rounded-3xl border border-rose-500/20 max-w-2xl mx-auto space-y-8 shadow-2xl">
                    <div className="space-y-4">
                      <h2 className="text-3xl font-black text-white">Daily Limit Reached</h2>
                      <p className="text-slate-400">You've used all {MAX_FREE_REQUESTS} free checks for today. Upgrade to Unlimited for unrestricted analysis.</p>
                    </div>
                    <button
                      onClick={handleUpgrade}
                      className="w-full py-5 bg-accent-600 hover:bg-accent-500 text-white font-black uppercase tracking-widest text-xs rounded-xl transition-all shadow-lg shadow-accent-500/20"
                    >
                      Unlock Unlimited Access
                    </button>
                  </div>
                ) : (
                  <Dropzone onFileSelect={handleFileSelect} status={status} />
                )}
                
                <div className="flex flex-wrap justify-center gap-6 opacity-60">
                   <button 
                    onClick={() => setShowHistory(true)}
                    className="text-[10px] font-bold tracking-widest uppercase text-slate-500 hover:text-white transition-colors flex items-center gap-2"
                   >
                     View Previous Reports
                   </button>
                </div>
              </div>
            )}

            {(status === AnalysisStatus.UPLOADING || status === AnalysisStatus.ANALYZING) && (
              <div className="w-full max-w-2xl flex flex-col items-center gap-8 animate-fade-in">
                <div className="relative w-full aspect-video bg-slate-900 rounded-2xl overflow-hidden shadow-xl border border-white/5">
                  {fileUrl && (
                    fileType === 'image' ? (
                      <img src={fileUrl} alt="Preview" className="w-full h-full object-cover opacity-20 scale-105" />
                    ) : (
                      <video src={fileUrl} className="w-full h-full object-cover opacity-20" muted loop autoPlay />
                    )
                  )}
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-brand-500/20 to-transparent w-full h-1 animate-scan"></div>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="bg-slate-950/80 px-8 py-4 rounded-xl border border-white/10 flex items-center gap-4 shadow-xl">
                      <div className="flex gap-1.5">
                        <div className="w-1 h-6 bg-brand-500 rounded-full animate-bounce"></div>
                        <div className="w-1 h-6 bg-brand-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                        <div className="w-1 h-6 bg-brand-300 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                      </div>
                      <span className="text-brand-50 font-bold text-xs tracking-widest uppercase">
                        {status === AnalysisStatus.UPLOADING ? 'Uploading...' : 'Checking Media...'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {status === AnalysisStatus.COMPLETE && result && (
              <AnalysisResultView 
                result={result} 
                fileUrl={fileUrl}
                fileType={fileType}
                onReset={handleReset} 
                onAnalyzeNew={isAtLimit ? handleReset : triggerFileUpload}
              />
            )}

            {status === AnalysisStatus.ERROR && (
              <div className="text-center space-y-8 animate-fade-in max-w-md">
                <div className="w-20 h-20 bg-rose-500/10 rounded-2xl flex items-center justify-center mx-auto border border-rose-500/20">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-10 h-10 text-rose-500">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                  </svg>
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-white">Analysis Failed</h3>
                  <p className="text-slate-400 text-sm">We couldn't process this file. Please try a different one.</p>
                </div>
                <button
                  onClick={handleReset}
                  className="px-8 py-3 bg-brand-600 hover:bg-brand-500 rounded-xl text-white font-bold transition-all text-sm uppercase tracking-widest"
                >
                  Try Again
                </button>
              </div>
            )}
          </>
        )}
      </main>
      
      <footer className="border-t border-white/5 py-8 mt-auto bg-slate-950/40">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-slate-600 text-[10px] font-bold tracking-widest uppercase">
            AI or Real Utility • 2025
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
