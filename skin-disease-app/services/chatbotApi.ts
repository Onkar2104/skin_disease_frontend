import { DJANGO_API } from "@/constants/api";

export interface BotResponse {
  reply: string;
  severity?: string;
  quick_replies?: string[];
}

export const sendMessageToBot = async (
  message: string,
  disease?: string,
  trigger?: "scan_result" | "chat",
  severity?: string
) => {
  const response = await fetch(`${DJANGO_API.BASE_URL}/api/chatbot/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      disease,
      trigger,
      severity,
    }),
  });

  if (!response.ok) {
    throw new Error(`Server error: ${response.status}`);
  }

  return response.json();
};
