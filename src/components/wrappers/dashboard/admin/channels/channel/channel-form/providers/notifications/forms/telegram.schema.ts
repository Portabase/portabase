import { z } from "zod";

export const TelegramChannelConfigSchema = z
  .object({
    telegramBotToken: z.string().min(1, "Bot token is required"),
    telegramChatId: z.string().min(1, "Chat ID is required"),
    telegramTopicId: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.telegramTopicId && !data.telegramChatId) {
        return false;
      }
      return true;
    },
    {
      message: "Chat ID is required when a Topic ID is provided",
      path: ["telegramChatId"],
    },
  );
