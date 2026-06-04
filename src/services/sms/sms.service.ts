const API_URL = "http://bulksmsbd.net/api/smsapi";

const normalizeBDPhone = (phone: string): string => {
  const digits = phone.replace(/[^\d]/g, "");
  return digits.startsWith("880") ? digits : "880" + digits.replace(/^0/, "");
};

export const sendSms = async (phone: string, message: string): Promise<void> => {
  const apiKey = process.env.BULKSMS_API_KEY;
  const senderId = process.env.BULKSMS_SENDER_ID;
  if (!apiKey || !senderId) throw new Error("[SMS] BULKSMS_API_KEY or BULKSMS_SENDER_ID not set");

  const number = normalizeBDPhone(phone);

  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ api_key: apiKey, senderid: senderId, number, message }),
  });

  if (!res.ok) throw new Error(`[SMS] HTTP ${res.status}: ${await res.text()}`);

  const body = (await res.json()) as { response_code?: number; error?: string };
  if (body.response_code !== 202) {
    throw new Error(`[SMS] API error code ${body.response_code}: ${body.error ?? "unknown"}`);
  }

  console.log(`[SMS] Sent to ${number}`);
};

export const buildSmsMessage = (shopName: string, ownerName?: string | null): string => {
  const name = ownerName ?? shopName;
  return `হ্যালো ${name}! ${shopName} সম্পর্কে আমরা আপনার সাথে কথা বলতে চাই। Reply করুন। ধন্যবাদ!`;
};
