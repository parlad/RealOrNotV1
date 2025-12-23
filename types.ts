
export interface AnnotatedArtifact {
  label: string;
  description: string;
  box_2d: number[]; // [ymin, xmin, ymax, xmax] normalized 0-1000
}

export interface DetectionResult {
  isLikelyAI: boolean;
  confidenceScore: number;
  verdict: string;
  reasoning: string;
  suggestedTitle: string; // Added: A descriptive title for the media
  artifactsFound: string[];
  annotatedArtifacts: AnnotatedArtifact[];
  technicalAnalysis: string;
}

export enum AnalysisStatus {
  IDLE = 'IDLE',
  UPLOADING = 'UPLOADING',
  ANALYZING = 'ANALYZING',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR',
  LIMIT_REACHED = 'LIMIT_REACHED'
}

export interface User {
  email: string;
  isPro: boolean;
  isOwner: boolean;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  fileName: string;
  fileType: FileType;
  result: DetectionResult;
  fileData?: string; // Base64 data for persistence
  mimeType?: string;
}

export type FileType = 'image' | 'video' | 'unknown';
