import type { PainCheckValue } from './survey';

// Dashboard stats
export interface FunnelStep {
  step: string;
  stepId: string;
  count: number;
  color: string;
}

export interface UrgencyDistribution {
  low: number;
  medium: number;
  high: number;
  critical: number;
  dominant: string;
  dominantPct: number;
}

export interface TimeSeriesData {
  daily: Array<{ date: string; started: number; completed: number }>;
  completionRate: Array<{ date: string; rate: number }>;
}

export interface RecentResponse {
  session_id: string;
  email: string | null;
  is_completed: boolean;
  started_at: string;
  current_step: string;
}

export interface StepDuration {
  stepId: string;
  stepName: string;
  avgDurationSeconds: number;
  dropOffPct: number;
}

export interface DashboardStats {
  totalResponses: number;
  completedResponses: number;
  voiceRecordings: number;
  completionRate: number;
  funnel: FunnelStep[];
  urgency: UrgencyDistribution;
  timeSeries: TimeSeriesData;
  stepDurations: StepDuration[];
  recentResponses: RecentResponse[];
}

// AI Insights
export interface SentimentAnalysis {
  overall: 'positive' | 'negative' | 'neutral';
  distribution: { positive: number; negative: number; neutral: number };
  timeline: Array<{ date: string; avgSentiment: number; count: number }>;
}

export interface ThemeData {
  theme: string;
  count: number;
  relatedQuotes: string[];
}

export interface Recommendation {
  recommendation: string;
  confidence: number;
  supportingData: string;
}

export interface KeyMetrics {
  avgUrgency: number;
  topConcern: string;
  avgCompletionTime: number;
  totalVoiceMinutes: number;
  responseRate: number;
}

export interface AIInsights {
  sentiment: SentimentAnalysis;
  themes: ThemeData[];
  executiveSummary: string;
  urgencyDistribution: UrgencyDistribution;
  recommendations: Recommendation[];
  keyMetrics: KeyMetrics;
  generatedAt: string;
}

// Per-response AI summary
export interface ResponseAISummary {
  summary: string;
  urgencyScore: number;
  emotionalTone: string;
  primaryConcerns: string[];
  productFitScore: number;
  generatedAt: string;
}

// Tags
export interface Tag {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface TagAssignment {
  id: string;
  response_id: string;
  tag_id: string;
  assigned_at: string;
}

// Admin Notes
export interface AdminNote {
  id: string;
  response_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

// Filter state
export interface ResponseFilters {
  status: 'all' | 'completed' | 'ongoing';
  search: string;
  dateRange: { from: string | null; to: string | null };
  painCheck: PainCheckValue[];
  priceWillingness: string[];
  urgencyMin: number | null;
  urgencyMax: number | null;
  hasVoiceRecordings: boolean | null;
  tags: string[];
}

// Pagination
export interface PaginatedResult<T> {
  data: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Comparison
export interface ComparisonData {
  sessionId: string;
  email: string;
  isCompleted: boolean;
  painCheck: string | null;
  issues: string[];
  ranking: string[];
  benefits: string[];
  transcripts: Array<{ stepNumber: number; transcript: string }>;
  aiSummary: ResponseAISummary | null;
  formData: Record<string, unknown>;
}
