import logger from "../../utils/logger";

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
  timestamp?: Date;
}

export interface ConversationContext {
  userId: number;
  messages: ConversationMessage[];
  systemPrompt?: string;
}

export interface AIResponse {
  message: string;
  confidence?: number;
  suggestedActions?: string[];
  metadata?: Record<string, unknown>;
}

type GroqMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-120b";
const GROQ_TEMPERATURE = Number(process.env.GROQ_TEMPERATURE || 0.7);
const GROQ_MAX_TOKENS = Number(process.env.GROQ_MAX_TOKENS || 1024);

const trimMessages = (messages: ConversationMessage[]): ConversationMessage[] =>
  messages
    .slice(-12)
    .map((message) => ({
      role: message.role,
      content: String(message.content || "").slice(0, 2000),
    }))
    .filter((message) => message.content.trim().length > 0);

const toGroqMessages = (context: ConversationContext): GroqMessage[] => {
  const baseSystemPrompt =
    context.systemPrompt ||
    "You are the G11 university assistant. Be concise, accurate, and helpful.";

  const scopedMessages = trimMessages(context.messages);

  return [
    { role: "system", content: baseSystemPrompt },
    ...scopedMessages.map((message) => ({ role: message.role, content: message.content })),
  ];
};

const generateFallbackResponse = (context: ConversationContext): string => {
  const lastMessage = context.messages[context.messages.length - 1];
  const userQuery = (lastMessage?.content || "").toLowerCase();

  if (userQuery.includes("pfe") || userQuery.includes("projet")) {
    return "Le PFE est disponible dans votre espace académique. Consultez les sujets, groupes et échéances dans la section PFE.";
  }
  if (userQuery.includes("document") || userQuery.includes("fichier")) {
    return "Vous pouvez accéder aux documents via la section Documents. Si vous voulez, je peux vous guider selon votre rôle.";
  }
  if (userQuery.includes("demande") || userQuery.includes("réclamation") || userQuery.includes("reclamation")) {
    return "Les demandes se font via la section Requêtes. Vous pouvez créer une réclamation ou une justification puis suivre son statut.";
  }

  return "Je suis votre assistant académique G11. Posez-moi une question sur le PFE, les documents, les requêtes, ou le suivi académique.";
};

export const generateAIResponse = async (context: ConversationContext): Promise<AIResponse> => {
  try {
    const groqApiKey = process.env.GROQ_API_KEY;
    const messages = toGroqMessages(context);

    if (!groqApiKey) {
      logger.warn("GROQ_API_KEY is missing. Falling back to local AI response.");
      return {
        message: generateFallbackResponse(context),
        confidence: 0.6,
        suggestedActions: ["Voir mes informations", "Ouvrir PFE", "Créer une requête"],
        metadata: { provider: "fallback", reason: "missing_api_key" },
      };
    }

    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${groqApiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages,
        temperature: Number.isFinite(GROQ_TEMPERATURE) ? GROQ_TEMPERATURE : 0.7,
        max_tokens: Number.isFinite(GROQ_MAX_TOKENS) ? GROQ_MAX_TOKENS : 1024,
      }),
    });

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
      usage?: Record<string, unknown>;
      error?: { message?: string };
    };

    if (!response.ok) {
      const providerError = payload?.error?.message || `Groq API error (${response.status})`;
      throw new Error(providerError);
    }

    const reply = payload?.choices?.[0]?.message?.content?.trim();
    if (!reply) {
      throw new Error("Groq returned an empty response");
    }

    logger.info(`AI response generated via Groq for user ${context.userId}`);

    return {
      message: reply,
      confidence: 0.9,
      suggestedActions: ["Continuer", "Voir les détails", "Poser une autre question"],
      metadata: {
        provider: "groq",
        model: GROQ_MODEL,
        usage: payload?.usage || null,
      },
    };
  } catch (error) {
    logger.error("Error generating AI response:", error);
    return {
      message: generateFallbackResponse(context),
      confidence: 0.55,
      suggestedActions: ["Réessayer", "Reformuler", "Contacter l'administration"],
      metadata: {
        provider: "fallback",
        reason: error instanceof Error ? error.message : "unknown_error",
      },
    };
  }
};

export const analyzeUserQuery = async (query: string): Promise<{
  intent: string;
  entities: string[];
  suggestedActions: string[];
}> => {
  try {
    // Simple intent detection based on keywords
    const intents: Record<string, string> = {
      pfe: "query_pfe",
      document: "query_documents",
      demande: "manage_requests",
      note: "query_grades",
      discipline: "query_discipline",
      aide: "request_help",
    };

    let detectedIntent = "general_query";
    const entities: string[] = [];

    for (const [keyword, intent] of Object.entries(intents)) {
      if (query.toLowerCase().includes(keyword)) {
        detectedIntent = intent;
        entities.push(keyword);
      }
    }

    const suggestedActions = getSuggestedActionsForIntent(detectedIntent);

    return {
      intent: detectedIntent,
      entities,
      suggestedActions,
    };
  } catch (error) {
    logger.error("Error analyzing user query:", error);
    throw error;
  }
};

const getSuggestedActionsForIntent = (intent: string): string[] => {
  const actions: Record<string, string[]> = {
    query_pfe: [
      "Voir les sujets PFE",
      "Consulter mon groupe",
      "Planifier la défense",
    ],
    query_documents: [
      "Parcourir les documents",
      "Télécharger un guide",
      "Créer une demande de document",
    ],
    manage_requests: [
      "Créer une nouvelle demande",
      "Voir mes demandes",
      "Suivre l'approbation",
    ],
    query_grades: ["Voir mes notes", "Consulter les détails", "Contacter le professeur"],
    query_discipline: [
      "Consulter les cas",
      "Voir l'historique",
      "Contacter le doyen",
    ],
    request_help: ["Consulter la FAQ", "Contacter le support", "Voir la documentation"],
  };

  return actions[intent] || [
    "Poser une autre question",
    "Retourner à l'accueil",
  ];
};

export const storeConversation = async (
  userId: number,
  _messages: ConversationMessage[]
): Promise<void> => {
  try {
    // Store conversation to database or file
    logger.info(`Conversation stored for user ${userId}`);
  } catch (error) {
    logger.error("Error storing conversation:", error);
    throw error;
  }
};

export const buildSystemPrompt = (userRole: string): string => {
  const globalRules = `
You are the in-app assistant for the G11 university platform.
Mandatory rules:
- The user is already authenticated in this application context.
- Never ask for identity verification steps (student id, date of birth, institutional email confirmation, etc.).
- Never invent URLs, emails, phone numbers, offices, or external portals.
- Never mention imaginary policies, legal disclaimers, or security procedures unless explicitly provided by user content.
- If data is unavailable, say it clearly and guide the user to the correct in-app section only.
- Keep responses concise, practical, and action-oriented.
- Default language is French unless the user writes in another language.
- Prefer plain text over heavy markdown formatting.
`;

  const prompts: Record<string, string> = {
    etudiant: `${globalRules}
Role: student assistant.
Focus on PFE, modules, documents, requests/reclamations, justifications, and discipline workflow for the logged-in student.
When asked for personal status (e.g., PFE/soutenance), answer directly if possible; otherwise say what to check in the app dashboard sections.`,
    enseignant: `${globalRules}
Role: teacher assistant.
Focus on courses, assigned students, announcements, reclamations follow-up, and PFE supervision tasks.
Give concrete next steps using in-app teacher pages and actions.`,
    admin: `${globalRules}
Role: admin assistant.
Focus on user management, announcements, requests workflows, documents, and operational summaries.
Give concise operational guidance grounded in existing platform features.`,
  };

  return (
    prompts[userRole] ||
    "You are a helpful academic assistant. Respond helpfully and professionally."
  );
};

export const validateUserQuery = (query: string): boolean => {
  if (!query || query.trim().length === 0) return false;
  if (query.trim().length > 5000) return false;
  return true;
};
