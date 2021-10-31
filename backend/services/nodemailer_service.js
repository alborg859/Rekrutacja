import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.ethereal.email",
  port: 587,
  auth: {
    user: "griffin.reynolds41@ethereal.email",
    pass: "gwAdJVjTNrtndDN4Gd"
  }
});
//passing auth data directly, not from .env, because it's a test acc

export const send_email = async (to, subject, text) => {
  const result = await transporter.sendMail({
    from: "Restauracja SOLVRO",
    to,
    subject,
    text
  });
  return result;
};
