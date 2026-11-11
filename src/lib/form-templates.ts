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

/**
 * Starting sets of questions for a new form. The wording matters: a specific
 * question gets a specific answer, and a specific answer is what makes a
 * testimonial worth reading.
 */
export const FORM_TEMPLATES: FormTemplate[] = [
  {
    id: "marketing",
    name: "Full story",
    description: "Asks what life was like before, what changed, and what they would tell someone on the fence. Best for most businesses.",
    recommended: true,
    questions: [
      { id: "1", type: "rating", purpose: "rating", required: true, question: "How would you rate your experience?" },
      {
        id: "2",
        type: "long_text",
        purpose: "context",
        required: true,
        question: "What was going on before you came to us?",
        helpText: "Describe the problem you wanted to solve.",
        placeholder: "Before this, I was...",
      },
      {
        id: "3",
        type: "long_text",
        purpose: "problem",
        required: false,
        question: "Did anything make you hesitate before you started?",
        helpText: "Honest doubts help other people who feel the same.",
        placeholder: "I was not sure about...",
      },
      {
        id: "4",
        type: "long_text",
        purpose: "result",
        required: true,
        question: "What changed? Share numbers or timeframes if you have them.",
        helpText: "For example: went from X to Y in 3 months. Share only what is true for you.",
        placeholder: "Since then...",
      },
      {
        id: "5",
        type: "long_text",
        purpose: "emotion",
        required: false,
        question: "How does that change feel day to day?",
        helpText: "Say what the result means for you.",
      },
      {
        id: "6",
        type: "long_text",
        purpose: "recommendation",
        required: false,
        question: "What would you say to someone who is thinking about working with us?",
        helpText: "Picture someone who is where you were.",
      },
    ],
  },
  {
    id: "quick",
    name: "Quick review",
    description: "A star rating and two short questions. Use it when your clients are busy.",
    questions: [
      { id: "1", type: "rating", purpose: "rating", required: true, question: "How would you rate your experience?" },
      {
        id: "2",
        type: "long_text",
        purpose: "open",
        required: true,
        question: "What stood out about working with us?",
        helpText: "One or two sentences is perfect.",
      },
      { id: "3", type: "short_text", purpose: "recommendation", required: false, question: "Would you recommend us? Why?" },
    ],
  },
  {
    id: "casestudy",
    name: "Case study",
    description: "Longer and more structured. Use it when you want a full written case study.",
    questions: [
      { id: "1", type: "rating", purpose: "rating", required: true, question: "How would you rate your experience?" },
      {
        id: "2",
        type: "long_text",
        purpose: "context",
        required: true,
        question: "What was the situation before you started?",
        helpText: "Background, team size, and what you had tried.",
      },
      { id: "3", type: "long_text", purpose: "problem", required: true, question: "What was the main problem you needed to solve?" },
      {
        id: "4",
        type: "long_text",
        purpose: "result",
        required: true,
        question: "What measurable results have you seen?",
        helpText: "Specific numbers make the strongest case study.",
      },
      {
        id: "5",
        type: "long_text",
        purpose: "emotion",
        required: false,
        question: "What has been the biggest difference for you or your team?",
      },
      { id: "6", type: "long_text", purpose: "recommendation", required: false, question: "Who would you recommend this to, and why?" },
    ],
  },
  {
    id: "video",
    name: "Video testimonial",
    description: "One simple prompt to answer on camera, with room for a written note.",
    questions: [
      {
        id: "1",
        type: "video",
        purpose: "open",
        required: true,
        question: "Introduce yourself and tell us about your experience.",
        helpText: "Relax and speak the way you would to a friend.",
      },
      { id: "2", type: "long_text", purpose: "result", required: false, question: "Is there anything you want to add in writing?" },
    ],
  },
  {
    id: "blank",
    name: "Blank form",
    description: "Only the star rating. Add your own questions.",
    questions: [{ id: "1", type: "rating", purpose: "rating", required: true, question: "How would you rate your experience?" }],
  },
];

export const PURPOSE_LABELS: Record<QuestionPurpose, string> = {
  context: "Before",
  problem: "Hesitation",
  result: "Result",
  emotion: "Feeling",
  recommendation: "Recommendation",
  rating: "Rating",
  open: "Open",
};
