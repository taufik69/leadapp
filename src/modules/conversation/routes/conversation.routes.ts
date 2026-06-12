import { Router, Request, Response } from "express";
import { conversationController } from "../controller/conversation.controller";
import { addSseClient, removeSseClient } from "../../../services/sse/sse.service";

const router = Router();

// SSE stream — browser connects here to receive real-time incoming reply events
router.get("/whatsapp/stream", (req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  // Disable response buffering so writes reach the browser immediately
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  // Confirm connection with a comment (doesn't trigger onmessage on client)
  res.write(": connected\n\n");

  addSseClient(res);

  const cleanup = () => removeSseClient(res);
  req.on("close", cleanup);
  req.on("error", cleanup);
});

// Conversation history for a lead
router.get("/leads/:id/messages", conversationController.getMessages);

// Send a WhatsApp reply to a lead
router.post("/leads/:id/whatsapp", conversationController.sendReply);

export default router;
