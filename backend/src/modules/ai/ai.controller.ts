import { Response } from "express";
import { AuthRequest } from "../../middlewares/auth.middleware";
import {
  buildSystemPrompt,
  ConversationMessage,
  generateAIResponse,
  validateUserQuery,
} from "./ai.service";
import logger from "../../utils/logger";

type ChatBody = {
  message?: string;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
};

export const chatHandler = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    const body = (req.body || {}) as ChatBody;
    const message = String(body.message || "").trim();

    if (!validateUserQuery(message)) {
      return res.status(400).json({ success: false, message: "Invalid message" });
    }

    const safeHistory: ConversationMessage[] = Array.isArray(body.history)
      ? body.history
          .filter((entry) => entry && (entry.role === "user" || entry.role === "assistant"))
          .map((entry) => ({
            role: entry.role,
            content: String(entry.content || "").slice(0, 2000),
          }))
      : [];

    const lastMessages = safeHistory.slice(-10);
    const response = await generateAIResponse({
      userId: req.user.id,
      messages: [...lastMessages, { role: "user", content: message }],
      systemPrompt: buildSystemPrompt(req.user.coreRole || "etudiant"),
    });

    return res.status(200).json({
      success: true,
      data: {
        reply: response.message,
        confidence: response.confidence,
        suggestedActions: response.suggestedActions || [],
      },
    });
  } catch (error: any) {
    logger.error("Error in AI chatHandler:", error);
    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to generate AI response",
    });
  }
};