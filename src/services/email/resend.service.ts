import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export interface SendEmailOptions {
  to: string;
  shopName: string;
  ownerName?: string | null;
  phoneNumber?: string | null;
}

export const sendLeadEmail = async (options: SendEmailOptions): Promise<void> => {
  const { to, shopName, ownerName, phoneNumber } = options;

  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? "noreply@yourdomain.com",
    to,
    subject: `${shopName} — আমাদের সাথে যোগাযোগ করুন`,
    html: buildEmailTemplate({ shopName, ownerName, phoneNumber }),
  });

  if (error) throw new Error(`Resend error: ${error.message}`);
};

const buildEmailTemplate = ({
  shopName,
  ownerName,
  phoneNumber,
}: {
  shopName: string;
  ownerName?: string | null;
  phoneNumber?: string | null;
}): string => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h2>হ্যালো ${ownerName ?? shopName}!</h2>
    <p>আমরা <strong>${shopName}</strong> সম্পর্কে আপনার সাথে যোগাযোগ করতে চাই।</p>
    ${phoneNumber ? `<p>ফোন: <strong>${phoneNumber}</strong></p>` : ""}
    <p>আমাদের সেবা সম্পর্কে জানতে reply করুন।</p>
    <br/>
    <p>ধন্যবাদ</p>
  </div>
`;
