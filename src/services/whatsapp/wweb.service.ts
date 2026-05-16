import { Client, LocalAuth } from "whatsapp-web.js";
import qrcode from "qrcode-terminal";

let client: Client | null = null;
let isReady = false;

export const getWhatsAppClient = (): Client => {
  if (!client) {
    client = new Client({
      authStrategy: new LocalAuth({
        dataPath: process.env.WWEB_SESSION_PATH ?? "./.wwebjs_auth",
      }),
      puppeteer: {
        headless: true,
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
      console.warn("WhatsApp disconnected:", reason);
      client = null;
    });

    client.initialize();
  }

  return client;
};

export const sendWhatsAppMessage = async (
  phone: string,
  message: string,
): Promise<void> => {
  if (!isReady) throw new Error("WhatsApp client not ready");

  // phone format: 8801XXXXXXXXX@c.us
  const chatId = phone.replace(/\D/g, "") + "@c.us";
  await getWhatsAppClient().sendMessage(chatId, message);
};

export const buildWhatsAppMessage = (
  shopName: string,
  ownerName?: string | null,
): string => {
  const name = ownerName ?? shopName;
  return `হ্যালো *${name}*! 👋\n\n*${shopName}* সম্পর্কে আমরা আপনার সাথে যোগাযোগ করতে চাই।\n\nআমাদের সেবা সম্পর্কে জানতে reply করুন। ধন্যবাদ! 🙏`;
};
