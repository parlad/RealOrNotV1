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
  
  // Ref for hidden file input to support direct "Analyze Another" click
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    setResult(null); // Clear previous result immediately
    setStatus(AnalysisStatus.UPLOADING);
    
    // Revoke old URL if it exists
    if (fileUrl) {
      URL.revokeObjectURL(fileUrl);
    }
    
    const objectUrl = URL.createObjectURL(file);
    setFileUrl(objectUrl);
    setFileType(file.type.startsWith('video') ? 'video' : 'image');

    try {
      // Read file as base64
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = async () => {
        const base64String = reader.result as string;
        // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
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
      
      // Basic validation (duplicated from Dropzone logic for simplicity/robustness)
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm'];
      if (!validTypes.includes(file.type)) {
        alert("Please upload a supported image (JPEG, PNG, WEBP) or video (MP4, WEBM) file.");
        return;
      }
      if (file.size > 15 * 1024 * 1024) {
        alert("File is too large. Please upload a file smaller than 15MB.");
        return;
      }
      
      handleFileSelect(file);
    }
    // Reset value so the same file can be selected again if needed
    if (e.target) e.target.value = '';
  };

  return (
    <div className="min-h-screen bg-[#0f172a] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0f172a] to-black text-slate-100 flex flex-col">
      {/* Hidden Input for direct upload triggering */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleHiddenFileInput}
        className="hidden"
        accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
      />

      {/* Navbar */}
      <nav className="border-b border-white/5 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={handleReset}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-accent-600 flex items-center justify-center shadow-lg shadow-brand-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-white">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              TruthLens
            </span>
          </div>
          <div className="text-xs font-mono text-slate-500 border border-slate-800 rounded-full px-3 py-1">
            POWERED BY GEMINI 2.5
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center justify-center p-4 sm:p-8 relative">
        {/* Decorative elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-brand-500/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent-600/10 rounded-full blur-[120px] pointer-events-none"></div>

        {status === AnalysisStatus.IDLE && (
          <div className="w-full max-w-2xl mx-auto text-center space-y-8 animate-fade-in-up">
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white">
                Real or <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-accent-500">Synthetic?</span>
              </h1>
              <p className="text-lg text-slate-400 max-w-xl mx-auto">
                Upload images or videos to detect AI-generated content. 
                Our forensic AI analyzes artifacts, lighting, and anatomy to reveal the truth.
              </p>
            </div>
            <Dropzone onFileSelect={handleFileSelect} status={status} />
          </div>
        )}

        {status === AnalysisStatus.UPLOADING || status === AnalysisStatus.ANALYZING ? (
          <div className="w-full max-w-2xl flex flex-col items-center gap-8">
            <div className="relative w-full max-w-md aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-slate-700">
              {fileUrl && fileType === 'image' && (
                <img src={fileUrl} alt="Preview" className="w-full h-full object-contain opacity-50" />
              )}
              {fileUrl && fileType === 'video' && (
                <video src={fileUrl} className="w-full h-full object-contain opacity-50" muted loop autoPlay />
              )}
              
              {/* Scanning Overlay */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-brand-500/20 to-transparent w-full h-1/3 animate-scan border-b border-brand-400/50 shadow-[0_0_15px_rgba(56,189,248,0.5)]"></div>
              
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-black/70 backdrop-blur-sm px-6 py-3 rounded-full border border-brand-500/30 flex items-center gap-3">
                  <div className="w-2 h-2 bg-brand-400 rounded-full animate-pulse"></div>
                  <span className="text-brand-100 font-mono text-sm tracking-wider">
                    {status === AnalysisStatus.UPLOADING ? 'PROCESSING FILE...' : 'ANALYZING ARTIFACTS...'}
                  </span>
                </div>
              </div>
            </div>
            <p className="text-slate-500 text-sm animate-pulse">This might take a few seconds...</p>
          </div>
        ) : null}

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
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-red-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white">Analysis Failed</h3>
            <p className="text-slate-400">Something went wrong while processing the file. Please try again.</p>
            <div className="flex gap-4 justify-center">
               <button
                onClick={handleReset}
                className="px-6 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-white transition-colors"
              >
                Go Home
              </button>
              <button
                onClick={triggerFileUpload}
                className="px-6 py-2 bg-brand-600 hover:bg-brand-500 rounded-lg text-white transition-colors shadow-lg shadow-brand-500/20"
              >
                Try Another File
              </button>
            </div>
          </div>
        )}
      </main>
      
      {/* Footer */}
      <footer className="border-t border-white/5 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-6 text-center text-slate-500 text-xs">
          <p>Disclaimer: This tool uses probabilistic AI models (Gemini) to estimate the likelihood of content being AI-generated.</p>
          <p className="mt-1">Results are for informational purposes only and should not be considered definitive proof.</p>
        </div>
      </footer>
    </div>
  );
};

export default App;