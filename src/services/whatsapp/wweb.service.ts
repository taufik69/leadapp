import { Client, LocalAuth } from "whatsapp-web.js";
import qrcode from "qrcode-terminal";

let client: Client | null = null;
let isReady = false;

const initializeClient = (): void => {
  client = new Client({
    authStrategy: new LocalAuth({
      dataPath: process.env.WWEB_SESSION_PATH ?? "./.wwebjs_auth",
    }),
    puppeteer: {
      headless: true,
      executablePath: "/usr/bin/google-chrome",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    },
  });

  client.on("qr", (qr) => {
    console.log("\n📱 WhatsApp QR Code — scan করুন:\n");
    qrcode.generate(qr, { small: true });
  });

  client.on("ready", () => {
    isReady = true;
    console.log("✅ WhatsApp client ready");
  });

  client.on("disconnected", (reason) => {
    isReady = false;
    client = null;
    console.warn("WhatsApp disconnected:", reason);
    console.log("🔄 Reconnecting in 5s...");
    setTimeout(initializeClient, 5000);
  });

  client.initialize();
};

export const getWhatsAppClient = (): Client => {
  if (!client) initializeClient();
  return client!;
};

const waitUntilReady = (timeoutMs = 30000): Promise<void> =>
  new Promise((resolve, reject) => {
    if (isReady) return resolve();
    const start = Date.now();
    const interval = setInterval(() => {
      if (isReady) {
        clearInterval(interval);
        resolve();
      } else if (Date.now() - start > timeoutMs) {
        clearInterval(interval);
        reject(new Error("WhatsApp client not ready — timeout"));
      }
    }, 500);
  });

export const sendWhatsAppMessage = async (
  phone: string,
  message: string,
): Promise<void> => {
  await waitUntilReady();

  const digits = phone.replace(/[^\d]/g, "");
  const normalized = digits.startsWith("880")
    ? digits
    : "880" + digits.replace(/^0/, "");
  const chatId = normalized + "@c.us";
  console.log(`[WhatsApp] Sending to chatId: ${chatId}`);
  await getWhatsAppClient().sendMessage(chatId, message);
};

export const buildWhatsAppMessage = (
  shopName: string,
  ownerName?: string | null,
): string => {
  const name = ownerName ?? shopName;
  return `হ্যালো *${name}*! 👋\n\n*${shopName}* সম্পর্কে আমরা আপনার সাথে fuck করতে চাই।\n\nআমাদের সেবা সম্পর্কে জানতে reply করুন। ধন্যবাদ! 🙏`;
};

initializeClient();
