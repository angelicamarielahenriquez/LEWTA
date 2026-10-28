/**
 * Replacement question content for the first eleven New York Business City Boss prompts.
 * These are integrated into the existing 80-question Boss round (not a separate game).
 * IDs live outside the city synonym-pair range so they are not added to Words to Revisit.
 */
export type BusinessBlankQuestion = {
  id: number;
  category: string;
  answer: string;
  spanish: string;
  sentence: string;
  explanation: string;
  choices: string[];
};

export const newYorkBusinessQuestions: BusinessBlankQuestion[] = [
  {
    id: 900001,
    category: "Purchasing",
    answer: "purchase",
    choices: ["purchase", "postpone", "assist", "notify"],
    spanish: "comprar / adquirir",
    sentence: "Our department will purchase new computers this month.",
    explanation: "Purchase means to buy or acquire something by paying for it. It is common in formal business communication.",
  },
  {
    id: 900002,
    category: "Decisions",
    answer: "make a decision",
    choices: ["make a decision", "make a purchase", "reply promptly", "take a break"],
    spanish: "tomar una decisión",
    sentence: "Before approving the new budget, the director needs to make a decision about the proposed expenses.",
    explanation: "Make a decision is the standard collocation meaning to choose what to do after considering the options.",
  },
  {
    id: 900003,
    category: "Meetings",
    answer: "talk over the matter",
    choices: ["talk over the matter", "file the report", "approve the invoice", "notify the client"],
    spanish: "discutir / conversar sobre el asunto",
    sentence: "The project manager would like to talk over the matter with the marketing team before finalizing the proposal.",
    explanation: "Talk over the matter means to discuss an issue carefully with other people before making a decision.",
  },
  {
    id: 900004,
    category: "Email communication",
    answer: "respond to the email",
    choices: ["respond to the email", "purchase the equipment", "postpone the conference", "combine the reports"],
    spanish: "responder al correo electrónico",
    sentence: "Please respond to the email as soon as possible so we can confirm your attendance at the conference.",
    explanation: "Respond to an email means to send an answer or reaction to a message you received.",
  },
  {
    id: 900005,
    category: "Workplace support",
    answer: "assist",
    choices: ["assist", "postpone", "notify", "purchase"],
    spanish: "ayudar / asistir",
    sentence: "Our administrative assistant will assist the new employees during the onboarding process.",
    explanation: "Assist means to help someone complete a task. It is a formal and common workplace verb.",
  },
  {
    id: 900006,
    category: "Professional communication",
    answer: "apologize",
    choices: ["apologize", "notify", "purchase", "combine"],
    spanish: "disculparse",
    sentence: "The supplier called to apologize for the delay in delivering the office equipment.",
    explanation: "Apologize means to express regret for a mistake, inconvenience, or problem.",
  },
  {
    id: 900007,
    category: "Announcements",
    answer: "notify",
    choices: ["notify", "postpone", "purchase", "combine"],
    spanish: "notificar / informar",
    sentence: "Human Resources must notify all employees about the upcoming changes to the company policy.",
    explanation: "Notify means to formally inform someone about an event, decision, or change.",
  },
  {
    id: 900008,
    category: "Scheduling",
    answer: "postpone",
    choices: ["postpone", "apologize", "assist", "notify"],
    spanish: "posponer / aplazar",
    sentence: "Due to a scheduling conflict, we have decided to postpone the meeting until next Monday.",
    explanation: "Postpone means to move a planned event to a later time or date.",
  },
  {
    id: 900009,
    category: "Customer service",
    answer: "reply promptly",
    choices: ["reply promptly", "postpone the meeting", "purchase the materials", "combine the reports"],
    spanish: "responder rápidamente / sin demora",
    sentence: "If you receive a request from a client, please reply promptly to maintain excellent customer service.",
    explanation: "Reply promptly means to respond without unnecessary delay, especially when good customer service is expected.",
  },
  {
    id: 900010,
    category: "Meetings",
    answer: "combine",
    choices: ["combine", "postpone", "apologize", "notify"],
    spanish: "combinar / unir",
    sentence: "To save time, the manager suggested that we combine the two team meetings into one session.",
    explanation: "Combine means to bring two or more things together as one.",
  },
  {
    id: 900011,
    category: "Presentations",
    answer: "stress",
    choices: ["stress", "purchase", "postpone", "assist"],
    spanish: "destacar / enfatizar",
    sentence: "During the presentation, the director will stress the importance of meeting our quarterly sales targets.",
    explanation: "Stress means to emphasize or highlight an important point so that people pay attention to it.",
  },
];
