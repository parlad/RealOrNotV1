import React, { useCallback, useState } from 'react';
import { AnalysisStatus } from '../types';

interface DropzoneProps {
  onFileSelect: (file: File) => void;
  status: AnalysisStatus;
}

const Dropzone: React.FC<DropzoneProps> = ({ onFileSelect, status }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      
      if (status === AnalysisStatus.ANALYZING) return;

      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        validateAndSelect(files[0]);
      }
    },
    [status] // eslint-disable-next-line react-hooks/exhaustive-deps
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSelect(e.target.files[0]);
    }
  };

  const validateAndSelect = (file: File) => {
    // Basic validation
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm'];
    if (!validTypes.includes(file.type)) {
      alert("Please upload a supported image (JPEG, PNG, WEBP) or video (MP4, WEBM) file.");
      return;
    }
    // Size limit (15MB for browser base64 safety in this demo)
    if (file.size > 15 * 1024 * 1024) {
      alert("File is too large. Please upload a file smaller than 15MB.");
      return;
    }
    onFileSelect(file);
  };

  const isBusy = status === AnalysisStatus.ANALYZING;

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        relative w-full max-w-2xl mx-auto p-12 rounded-3xl border-2 border-dashed transition-all duration-300 ease-in-out
        flex flex-col items-center justify-center text-center cursor-pointer group
        ${isDragging 
          ? 'border-brand-500 bg-brand-500/10 scale-[1.02]' 
          : 'border-slate-600 hover:border-brand-400 hover:bg-slate-800/50 glass-panel'}
        ${isBusy ? 'opacity-50 pointer-events-none' : ''}
      `}
    >
      <input
        type="file"
        accept="image/*,video/*"
        onChange={handleFileInput}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        disabled={isBusy}
      />
      
      <div className="bg-slate-700/50 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform duration-300">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-brand-400">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
        </svg>
      </div>

      <h3 className="text-xl font-semibold text-slate-100 mb-2">
        {isDragging ? 'Drop it here!' : 'Upload a photo or video'}
      </h3>
      <p className="text-slate-400 text-sm max-w-sm">
        Drag and drop files here, or click to browse. Supports JPG, PNG, WEBP, MP4. (Max 15MB)
      </p>
    </div>
  );
};

export default Dropzone;