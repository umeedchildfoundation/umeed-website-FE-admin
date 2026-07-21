import emailjs from "@emailjs/browser";
import { emailConfig } from "../config/emailConfig";

// Initialize EmailJS immediately
emailjs.init(emailConfig.publicKey);

export const sendApprovalEmail = async (
  toEmail: string,
  toName: string,
  loginLink: string,
) => {
  if (
    emailConfig.serviceId === "YOUR_SERVICE_ID" ||
    emailConfig.publicKey === "YOUR_PUBLIC_KEY"
  ) {
    console.warn("EmailJS not configured. Skipping email send.");
    return { status: "skipped", message: "EmailJS not configured" };
  }

  const templateParams = {
    to_email: toEmail,
    to_name: toName,
    login_link: loginLink,
    message: `Congratulations! You have been selected as a volunteer. 

Important: 
1. You have been assigned a temporary password: **umeed@123**
2. Login immediately here: ${loginLink}

Note: You are currently on a probation period for your first 12 sessions.`,
  };

  console.log("Attempting to send email with params:", templateParams);

  try {
    const response = await emailjs.send(
      emailConfig.serviceId,
      emailConfig.templateId,
      templateParams,
      emailConfig.publicKey,
    );
    console.log("Email successfully sent!", response.status, response.text);
    return { status: "success", response };
  } catch (error) {
    console.error("Failed to send email:", error);
    throw error;
  }
};
