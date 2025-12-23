
import React, { useState, useRef } from 'react';
import Dropzone from './components/Dropzone';
import AnalysisResultView from './components/AnalysisResult';
import { analyzeMedia } from './services/geminiService';
import { AnalysisStatus, DetectionResult } from './types';

const App: React.FC = () => {
  const [status, setStatus] = useState<AnalysisStatus>(AnalysisStatus.IDLE);
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [fileType, setFileType] = useState<'image' | 'video' | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    setResult(null);
    setStatus(AnalysisStatus.UPLOADING);
    
    if (fileUrl) {
      URL.revokeObjectURL(fileUrl);
    }
    
    const objectUrl = URL.createObjectURL(file);
    setFileUrl(objectUrl);
    setFileType(file.type.startsWith('video') ? 'video' : 'image');

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
    if (fileUrl) URL.revokeObjectURL(fileUrl);
    setFileUrl(null);
    setFileType(null);
  };
  
  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };
  
  const handleHiddenFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm'];
      if (!validTypes.includes(file.type)) {
        alert("Unsupported file format.");
        return;
      }
      handleFileSelect(file);
    }
    if (e.target) e.target.value = '';
  };

  return (
    <div className="min-h-screen text-slate-100 flex flex-col selection:bg-brand-500/30">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleHiddenFileInput}
        className="hidden"
        accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
      />

      {/* Navbar */}
      <nav className="border-b border-white/5 bg-gray-950/40 backdrop-blur-3xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={handleReset}>
            <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center shadow-lg group-hover:scale-105 transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6 text-white">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight text-white">
                GenAI Checker
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">Utility Tool</span>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center justify-center p-6 sm:p-12 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 -left-1/4 w-full h-full bg-brand-600/5 rounded-full blur-[150px] pointer-events-none"></div>
        <div className="absolute bottom-0 -right-1/4 w-full h-full bg-accent-600/5 rounded-full blur-[150px] pointer-events-none"></div>

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
            <Dropzone onFileSelect={handleFileSelect} status={status} />
            
            <div className="flex flex-wrap justify-center gap-6 opacity-60">
               <span className="text-[10px] font-bold tracking-widest uppercase text-slate-500">Image Check</span>
               <span className="text-[10px] font-bold tracking-widest uppercase text-slate-500">•</span>
               <span className="text-[10px] font-bold tracking-widest uppercase text-slate-500">Video Analysis</span>
               <span className="text-[10px] font-bold tracking-widest uppercase text-slate-500">•</span>
               <span className="text-[10px] font-bold tracking-widest uppercase text-slate-500">Instant Results</span>
            </div>
          </div>
        )}

        {(status === AnalysisStatus.UPLOADING || status === AnalysisStatus.ANALYZING) && (
          <div className="w-full max-w-2xl flex flex-col items-center gap-8">
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
            onAnalyzeNew={triggerFileUpload}
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
              <h3 className="text-2xl font-bold text-white">Could not check file</h3>
              <p className="text-slate-400 text-sm">Make sure it's a valid image or video and try again.</p>
            </div>
            <button
              onClick={handleReset}
              className="px-8 py-3 bg-brand-600 hover:bg-brand-500 rounded-xl text-white font-bold transition-all text-sm uppercase tracking-widest"
            >
              Try Again
            </button>
          </div>
        )}
      </main>
      
      {/* Footer */}
      <footer className="border-t border-white/5 py-8 mt-auto bg-slate-950/40">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-slate-600 text-[10px] font-bold tracking-widest uppercase">
            Quick GenAI Verification Utility • 2025
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
