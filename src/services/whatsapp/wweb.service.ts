import { Client, LocalAuth } from "whatsapp-web.js";
import qrcode from "qrcode-terminal";
import { EventEmitter } from "events";
import fs from "fs";
import path from "path";

type ClientState = "DISCONNECTED" | "INITIALIZING" | "AUTHENTICATING" | "READY";
type IncomingMessageHandler = (from: string, body: string) => Promise<void>;

let client: Client | null = null;
let incomingMessageHandler: IncomingMessageHandler | null = null;

export const setIncomingMessageHandler = (handler: IncomingMessageHandler): void => {
  incomingMessageHandler = handler;
};
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

    // Serves WhatsApp Web from local cache to avoid "Navigating frame was
    // detached" crash on Chrome 130+. Version must match the file actually
    // present in the cache directory (filename = <version>.html).
    webVersion: process.env.WWEB_VERSION ?? "2.3000.1041357421",
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

  // Deduplicate across both event listeners so we never process the same
  // incoming message twice if both fire for the same message.
  const seenMsgIds = new Set<string>();

  const handleIncoming = async (msg: { id: { id: string }; fromMe: boolean; from: string; type: string; body?: string | null; getContact?: () => Promise<{ number?: string }> }) => {
    console.log(
      `[WhatsApp] incoming — fromMe=${msg.fromMe} from=${msg.from} type=${msg.type} id=${msg.id.id} body="${String(msg.body ?? "").slice(0, 60)}"`,
    );

    if (msg.fromMe) return;
    if (!msg.body?.trim()) return;

    // Accept both @c.us (classic) and @lid (WhatsApp Linked ID, newer versions).
    // Skip everything else (group metadata, broadcasts, newsletters, etc.)
    const isLid = msg.from.endsWith("@lid");
    const isCus = msg.from.endsWith("@c.us");
    if (!isCus && !isLid) return;

    // Deduplicate
    if (seenMsgIds.has(msg.id.id)) {
      console.log(`[WhatsApp] Skipping duplicate msg id=${msg.id.id}`);
      return;
    }
    seenMsgIds.add(msg.id.id);
    if (seenMsgIds.size > 500) {
      const first = seenMsgIds.values().next().value;
      if (first !== undefined) seenMsgIds.delete(first);
    }

    if (!incomingMessageHandler) {
      console.warn("[WhatsApp] Incoming message arrived but no handler registered");
      return;
    }

    // Keep @lid as-is so the worker can look it up in the Redis @lid map.
    // NOTE: getContact().number in newer WhatsApp returns the @lid user part (e.g.
    // "124176463597591"), NOT the actual phone — so we must NOT convert it to @c.us.
    // The worker matches @lid via the Redis map populated at send time.
    const resolvedFrom = msg.from;

    try {
      await incomingMessageHandler(resolvedFrom, msg.body as string);
    } catch (err) {
      console.error("[WhatsApp] Error in incoming message handler:", err);
    }
  };

  // "message" fires only for received (inbound) messages — most reliable for replies.
  // "message_create" fires for ALL messages; used as fallback in case "message" misfires.
  client.on("message", handleIncoming);
  client.on("message_create", handleIncoming);

  client.on("qr", (qr) => {
    state = "AUTHENTICATING";
    console.log("\n[WhatsApp] Scan QR code to authenticate:\n");
    qrcode.generate(qr, { small: true });
  });

  client.on("authenticated", () => {
    console.log("[WhatsApp] Authenticated — session saved");
  });

  client.on("ready", async () => {
    state = "READY";
    reconnectAttempts = 0;
    console.log("[WhatsApp] Client ready");
    readyEmitter.emit("ready");

    const page = (client as unknown as { pupPage: { evaluate: (fn: string | (() => unknown)) => Promise<unknown>; on: (event: string, cb: (...args: unknown[]) => void) => void } }).pupPage;
    if (!page) return;

    // Forward browser-side JS errors to Node console for visibility
    page.on("pageerror", (err: unknown) => console.error("[Pup PageError]", String(err)));
    page.on("console", (...args: unknown[]) => {
      const msg = args[0] as { type: () => string; text: () => string };
      const t = msg.type();
      if (t === "error" || t === "warn") {
        console.log(`[Pup ${t}] ${msg.text().slice(0, 300)}`);
      }
    });

    // Diagnose whether WAWebCollections is available in this WA Web version
    try {
      const diag = await page.evaluate(`
        (() => {
          try {
            var c = window.require('WAWebCollections');
            return { exists: !!c, hasMsg: !!(c && c.Msg), hasChat: !!(c && c.Chat) };
          } catch (e) {
            return { exists: false, error: String(e) };
          }
        })()
      `) as { exists: boolean; hasMsg?: boolean; hasChat?: boolean; error?: string };

      console.log("[WhatsApp] WAWebCollections diagnostic:", JSON.stringify(diag));

      // NOTE: we intentionally do NOT register a second Msg.on('add') listener here.
      // The custom listener was removed because it called window.onAddMessageEvent()
      // for the same message that wweb.js's own listener already dispatched, causing
      // every incoming message to be processed twice → duplicate DB records.
    } catch (err) {
      console.error("[WhatsApp] Ready-phase injection error:", String(err));
    }
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

/** Returns the remote @lid if WhatsApp assigned one (newer privacy format), otherwise null. */
export const sendWhatsAppMessage = async (
  phone: string,
  message: string,
): Promise<string | null> => {
  await waitUntilReady(120_000);

  if (!client)
    throw new Error("[WhatsApp] Client unavailable after ready signal");

  const digits = phone.replace(/[^\d]/g, "");
  const normalized = digits.startsWith("880")
    ? digits
    : "880" + digits.replace(/^0/, "");
  const chatId = `${normalized}@c.us`;
  console.log(`[WhatsApp] Sending to ${chatId}`);
  const sentMsg = await client.sendMessage(chatId, message);
  const msgId = sentMsg.id as unknown as { remote: string };
  const remoteLid =
    typeof msgId.remote === "string" && msgId.remote.endsWith("@lid")
      ? msgId.remote
      : null;
  if (remoteLid) console.log(`[WhatsApp] Remote @lid for sent msg: ${remoteLid}`);
  return remoteLid;
};

/**
 * Look up the @lid assigned by WhatsApp for a known @c.us chat ID.
 * Used at startup to pre-populate the @lid → leadId mapping for already-sent leads.
 * Returns the @lid string (e.g. "124176463597591@lid") or null if not found.
 */
export const getLidForChatId = async (chatId: string): Promise<string | null> => {
  if (!client) return null;
  const page = (
    client as unknown as { pupPage: { evaluate: (code: string) => Promise<unknown> } }
  ).pupPage;
  if (!page) return null;

  const escaped = JSON.stringify(chatId);
  return page.evaluate(`
    (function() {
      try {
        var store = window.require('WAWebCollections');
        var c = store.Contact.get(${escaped});
        if (c) {
          var id = c.get ? c.get('id') : c.id;
          if (id && String(id._serialized || '').endsWith('@lid')) return id._serialized;
          var lid = c.get ? c.get('lid') : c.lid;
          if (lid && lid._serialized) return lid._serialized;
        }
        var chat = store.Chat.get(${escaped});
        if (chat && chat.contact) {
          var cc = chat.contact;
          var cid = cc.get ? cc.get('id') : cc.id;
          if (cid && String(cid._serialized || '').endsWith('@lid')) return cid._serialized;
        }
        return null;
      } catch(e) { return null; }
    })()
  `) as Promise<string | null>;
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
