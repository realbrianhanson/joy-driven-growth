import { Star, Type, AlignLeft, Video, Mic, ListChecks, Smile } from "lucide-react";
import type { QuestionPurpose } from "@/lib/form-templates";
import { DEFAULT_CONSENT_TEMPLATE } from "@/lib/consent";

export interface Question {
  id: string;
  type: "short_text" | "long_text" | "rating" | "video" | "audio" | "multiple_choice" | "sentiment";
  question: string;
  placeholder?: string;
  helpText?: string;
  purpose?: QuestionPurpose;
  required: boolean;
}

export interface FormSettings {
  name: string;
  slug: string;
  status: boolean;
  logo?: string;
  brandColor: string;
  welcomeEnabled: boolean;
  welcomeTitle: string;
  welcomeMessage: string;
  thankYouTitle: string;
  thankYouMessage: string;
  thankYouRedirect?: string;
  confettiEnabled: boolean;
  collectText: boolean;
  collectVideo: boolean;
  collectAudio: boolean;
  letThemChoose: boolean;
  videoMaxLength: number;
  aiInterviewEnabled: boolean;
  aiCustomPrompt: string;
  incentiveEnabled: boolean;
  incentiveType: "discount" | "giftcard" | "download";
  incentiveValue: string;
  reviewRoutingEnabled: boolean;
  positiveThreshold: number;
  positiveAction: string;
  negativeAction: string;
  consentEnabled: boolean;
  consentText: string;
  nameDisplayEnabled: boolean;
  reviewPlatform: "none" | "google" | "trustpilot" | "facebook" | "g2" | "capterra" | "other";
  reviewUrl: string;
}

export const defaultQuestions: Question[] = [
  { id: "1", type: "rating", question: "How would you rate your overall experience?", required: true },
  { id: "2", type: "long_text", question: "What did you enjoy most about working with us?", placeholder: "Tell us about your experience...", required: true },
  { id: "3", type: "short_text", question: "Would you recommend us to others? Why?", required: false },
];

export const defaultSettings: FormSettings = {
  name: "New Collection Form",
  slug: "new-form",
  status: true,
  brandColor: "#6366F1",
  welcomeEnabled: true,
  welcomeTitle: "Hey there!",
  welcomeMessage: "We'd love to hear about your experience. It'll only take a minute!",
  thankYouTitle: "Thank you!",
  thankYouMessage: "Thank you so much for sharing your story. It means the world to us!",
  confettiEnabled: true,
  collectText: true,
  collectVideo: true,
  collectAudio: false,
  letThemChoose: true,
  videoMaxLength: 60,
  aiInterviewEnabled: false,
  aiCustomPrompt: "Ask about their experience, what results they achieved, and what they'd tell others considering our product.",
  incentiveEnabled: false,
  incentiveType: "discount",
  incentiveValue: "10%",
  reviewRoutingEnabled: false,
  positiveThreshold: 4,
  positiveAction: "google",
  negativeAction: "",
  consentEnabled: true,
  consentText: DEFAULT_CONSENT_TEMPLATE,
  nameDisplayEnabled: true,
  reviewPlatform: "none",
  reviewUrl: "",
};

export const questionTypes = [
  { type: "short_text", icon: Type, label: "Short Text" },
  { type: "long_text", icon: AlignLeft, label: "Long Text" },
  { type: "rating", icon: Star, label: "Rating" },
  { type: "video", icon: Video, label: "Video" },
  { type: "audio", icon: Mic, label: "Audio" },
  { type: "multiple_choice", icon: ListChecks, label: "Multiple Choice" },
  { type: "sentiment", icon: Smile, label: "Sentiment" },
] as const;