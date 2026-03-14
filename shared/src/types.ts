export type UserRole = "farmer" | "officer" | "admin";
export type QueryType = "text" | "voice" | "image";
export type QueryStatus = "pending" | "answered" | "escalated" | "resolved";
export type ResponseType = "ai" | "officer";
export type EscalationStatus = "pending" | "in_progress" | "resolved";
export type FeedbackRating = "helpful" | "not_helpful";

export interface User {
  userId: string;
  name: string;
  role: UserRole;
  phone?: string;
  email?: string;
  region?: string;
  language: "en" | "hi" | "pa";
  fcmTokens?: string[];
  isActive?: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export interface Query {
  queryId: string;
  userId: string;
  type: QueryType;
  content?: string;
  audioUrl?: string;
  imageUrl?: string;
  description?: string;
  transcribedText?: string;
  detectedDisease?: string;
  diseaseConfidence?: number;
  status: QueryStatus;
  confidence?: number;
  latestResponse?: string;
  aiResponseAudioUrl?: string;
  createdAt: string;
  answeredAt?: string;
  escalatedAt?: string;
  resolvedAt?: string;
}

export interface Response {
  responseId: string;
  queryId: string;
  type: ResponseType;
  content: string;
  generatedBy?: string;
  confidence?: number;
  officerId?: string;
  officerName?: string;
  referenceLinks?: string[];
  audioUrl?: string | null;
  createdAt: string;
}

export interface Escalation {
  escalationId: string;
  queryId: string;
  userId: string;
  queryType: QueryType;
  reason: string;
  priority: "low" | "normal" | "high";
  status: EscalationStatus;
  assignedTo?: string | null;
  assignedAt?: string;
  responseId?: string | null;
  createdAt: string;
  resolvedAt?: string;
  farmerName?: string;
  officerName?: string;
  queryPreview?: string;
}

export interface Feedback {
  feedbackId: string;
  queryId: string;
  responseId: string;
  userId: string;
  rating: FeedbackRating;
  comment?: string;
  createdAt: string;
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
  };
}
