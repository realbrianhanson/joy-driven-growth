export type QuestionPurpose = "context" | "problem" | "result" | "emotion" | "recommendation" | "rating" | "open";

export interface TemplateQuestion {
  id: string;
  type: "short_text" | "long_text" | "rating" | "video" | "audio" | "multiple_choice" | "sentiment";
  question: string;
  helpText?: string;
  placeholder?: string;
  purpose: QuestionPurpose;
  required: boolean;
}

export interface FormTemplate {
  id: string;
  name: string;
  description: string;
  recommended?: boolean;
  questions: TemplateQuestion[];
}

export const FORM_TEMPLATES: FormTemplate[] = [
  {
    id: "marketing",
    name: "Marketing Testimonial",
    description: "Pulls context-rich, specific answers that work as copy-paste testimonials. Recommended.",
    recommended: true,
    questions: [
      {
        id: "1", type: "rating", purpose: "rating", required: true,
        question: "Overall, how would you rate your experience?",
      },
      {
        id: "2", type: "long_text", purpose: "context", required: true,
        question: "Before you found us, what were you struggling with?",
        helpText: "Set the scene — what was going on that made you look for a solution?",
        placeholder: "Before this, I was...",
      },
      {
        id: "3", type: "long_text", purpose: "problem", required: false,
        question: "Was there anything that made you hesitate before getting started?",
        helpText: "Honest hesitations are fine — they make your story relatable.",
        placeholder: "I wasn't sure about...",
      },
      {
        id: "4", type: "long_text", purpose: "result", required: true,
        question: "What specific results have you seen since? Numbers, timeframes, or concrete changes help.",
        helpText: "Be as specific as you can — e.g. 'went from X to Y in 3 months'. Only share what's true for you.",
        placeholder: "Since working with them, I've...",
      },
      {
        id: "5", type: "long_text", purpose: "emotion", required: false,
        question: "How do you feel about that change?",
        helpText: "The human side — what does that result actually mean for you day to day?",
      },
      {
        id: "6", type: "long_text", purpose: "recommendation", required: false,
        question: "What would you say to someone who's considering us but on the fence?",
        helpText: "Speak to someone in the position you were in before.",
      },
    ],
  },
  {
    id: "quick",
    name: "Quick Review",
    description: "Short and low-friction — a rating and a couple of open questions.",
    questions: [
      { id: "1", type: "rating", purpose: "rating", required: true, question: "How would you rate your experience?" },
      { id: "2", type: "long_text", purpose: "open", required: true, question: "What stood out to you about working with us?", helpText: "A sentence or two is perfect." },
      { id: "3", type: "short_text", purpose: "recommendation", required: false, question: "Would you recommend us? Why?" },
    ],
  },
  {
    id: "casestudy",
    name: "Case Study Deep-Dive",
    description: "Longer, structured — for in-depth written case studies.",
    questions: [
      { id: "1", type: "rating", purpose: "rating", required: true, question: "Overall rating of your experience?" },
      { id: "2", type: "long_text", purpose: "context", required: true, question: "What was the situation before you started?", helpText: "Background, team size, what you'd tried before." },
      { id: "3", type: "long_text", purpose: "problem", required: true, question: "What was the core problem you needed solved?" },
      { id: "4", type: "long_text", purpose: "result", required: true, question: "What measurable results have you achieved?", helpText: "Specific metrics make the strongest case studies." },
      { id: "5", type: "long_text", purpose: "emotion", required: false, question: "What's been the biggest difference for you or your team?" },
      { id: "6", type: "long_text", purpose: "recommendation", required: false, question: "Who would you recommend this to, and why?" },
    ],
  },
  {
    id: "video",
    name: "Video Testimonial",
    description: "A short prompt list designed to be answered on camera.",
    questions: [
      { id: "1", type: "video", purpose: "open", required: true, question: "Introduce yourself and tell us about your experience.", helpText: "Relax — speak naturally, like you're telling a friend." },
      { id: "2", type: "long_text", purpose: "result", required: false, question: "Anything specific you'd like to add in writing?" },
    ],
  },
  {
    id: "blank",
    name: "Blank Form",
    description: "Start from scratch.",
    questions: [
      { id: "1", type: "rating", purpose: "rating", required: true, question: "How would you rate your experience?" },
    ],
  },
];

export const PURPOSE_LABELS: Record<QuestionPurpose, string> = {
  context: "Context / Before",
  problem: "Hesitation / Problem",
  result: "Specific Result",
  emotion: "Emotional Payoff",
  recommendation: "Recommendation",
  rating: "Rating",
  open: "Open",
};