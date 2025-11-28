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
}

export type FileType = 'image' | 'video' | 'unknown';