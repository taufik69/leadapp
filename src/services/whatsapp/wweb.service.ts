import { Client, LocalAuth } from "whatsapp-web.js";
import qrcode from "qrcode-terminal";
import { EventEmitter } from "events";
import fs from "fs";
import path from "path";

type ClientState = "DISCONNECTED" | "INITIALIZING" | "AUTHENTICATING" | "READY";

let client: Client | null = null;
let state: ClientState = "DISCONNECTED";
let reconnectTimer: NodeJS.Timeout | null = null;
let reconnectAttempts = 0;

const MAX_RECONNECT_DELAY_MS = 60_000;
const readyEmitter = new EventEmitter();
readyEmitter.setMaxListeners(50);

const getReconnectDelay = (): number =>
  Math.min(1_000 * 2 ** reconnectAttempts, MAX_RECONNECT_DELAY_MS);

const removeStaleLocks = (): void => {
  const sessionDir = path.resolve(
    process.env.WWEB_SESSION_PATH ?? "./.wwebjs_auth",
    "session",
  );
  for (const name of ["SingletonLock", "SingletonCookie", "SingletonSocket"]) {
    try {
      fs.unlinkSync(path.join(sessionDir, name));
    } catch {
      // file absent — nothing to do
    }
  }
};

export const initializeWhatsAppClient = (): void => {
  if (
    state === "INITIALIZING" ||
    state === "AUTHENTICATING" ||
    state === "READY"
  ) {
    console.log(`[WhatsApp] Already in state "${state}", skipping init`);
    return;
  }

  state = "INITIALIZING";
  console.log("[WhatsApp] Initializing client...");

  client = new Client({
    authStrategy: new LocalAuth({
      dataPath: process.env.WWEB_SESSION_PATH ?? "./.wwebjs_auth",
    }),

    // Intercepts the page.goto("https://web.whatsapp.com") call and responds
    // with the locally cached HTML instead of fetching over the network.
    // This prevents the "Navigating frame was detached" crash on Chrome 130+.
    webVersion: process.env.WWEB_VERSION ?? "2.3000.1040735178",
    webVersionCache: {
      type: "local",
      path: process.env.WWEB_CACHE_PATH ?? "./.wwebjs_cache",
    },

    puppeteer: {
      headless: true,
      executablePath: "/usr/bin/google-chrome",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--no-first-run",
        "--no-zygote",
        "--disable-accelerated-2d-canvas",
        "--disable-blink-features=AutomationControlled",
      ],
    },
  });

  client.on("qr", (qr) => {
    state = "AUTHENTICATING";
    console.log("\n[WhatsApp] Scan QR code to authenticate:\n");
    qrcode.generate(qr, { small: true });
  });

  client.on("authenticated", () => {
    console.log("[WhatsApp] Authenticated — session saved");
  });

  client.on("ready", () => {
    state = "READY";
    reconnectAttempts = 0;
    console.log("[WhatsApp] Client ready");
    readyEmitter.emit("ready");
  });

  client.on("auth_failure", (msg) => {
    console.error("[WhatsApp] Authentication failed:", msg);
    state = "DISCONNECTED";
    client = null;
    scheduleReconnect();
  });

  client.on("disconnected", (reason) => {
    console.warn("[WhatsApp] Disconnected:", reason);
    state = "DISCONNECTED";
    client = null;
    scheduleReconnect();
  });

  removeStaleLocks();
  client.initialize().catch((err: unknown) => {
    console.error("[WhatsApp] Initialization error:", err);
    state = "DISCONNECTED";
    client = null;
    scheduleReconnect();
  });
};

const scheduleReconnect = (): void => {
  if (reconnectTimer) return;
  const delay = getReconnectDelay();
  reconnectAttempts++;
  console.log(
    `[WhatsApp] Reconnecting in ${delay / 1_000}s (attempt ${reconnectAttempts})...`,
  );
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    initializeWhatsAppClient();
  }, delay);
};

const waitUntilReady = (timeoutMs: number): Promise<void> =>
  new Promise((resolve, reject) => {
    if (state === "READY") return resolve();

    const timer = setTimeout(() => {
      readyEmitter.off("ready", onReady);
      reject(new Error("[WhatsApp] Client not ready — timeout"));
    }, timeoutMs);

    const onReady = () => {
      clearTimeout(timer);
      resolve();
    };

    readyEmitter.once("ready", onReady);
  });

/** Exported for worker startup — allows a long wait for QR scan on first run. */
export const waitForWhatsAppReady = (timeoutMs = 300_000): Promise<void> =>
  waitUntilReady(timeoutMs);

export const sendWhatsAppMessage = async (
  phone: string,
  message: string,
): Promise<void> => {
  await waitUntilReady(120_000);

  if (!client)
    throw new Error("[WhatsApp] Client unavailable after ready signal");

  const digits = phone.replace(/[^\d]/g, "");
  const normalized = digits.startsWith("880")
    ? digits
    : "880" + digits.replace(/^0/, "");
  const chatId = `${normalized}@c.us`;
  console.log(`[WhatsApp] Sending to ${chatId}`);
  await client.sendMessage(chatId, message);
};

export const buildWhatsAppMessage = (
  shopName: string,
  ownerName?: string | null,
): string => {
  const name = ownerName ?? shopName;
  return `হ্যালো *${name}*! 👋\n\n*${shopName}* সম্পর্কে আমরা আপনার সাথে কথা বলতে চাই।\n\nআমাদের সেবা সম্পর্কে জানতে reply করুন। ধন্যবাদ! 🙏`;
};

export const shutdownWhatsAppClient = async (): Promise<void> => {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  if (client) {
    try {
      await client.destroy();
    } catch {
      // ignore destroy errors during shutdown
    }
    client = null;
  }
  state = "DISCONNECTED";
  console.log("[WhatsApp] Client shut down");
};
