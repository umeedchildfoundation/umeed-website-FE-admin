// Get these values from https://www.emailjs.com/
// 1. Create a free account at EmailJS
// 2. Create an Email Service (e.g., Gmail)
// 3. Create an Email Template
// 4. Copy Service ID, Template ID, and Public Key

export const emailConfig = {
    serviceId: import.meta.env.VITE_EMAILJS_SERVICE_ID || "YOUR_SERVICE_ID",
    templateId: import.meta.env.VITE_EMAILJS_TEMPLATE_ID || "YOUR_TEMPLATE_ID",
    publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY || "YOUR_PUBLIC_KEY",
};
