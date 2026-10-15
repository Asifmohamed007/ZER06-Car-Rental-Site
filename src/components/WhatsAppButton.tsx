import { whatsappLink } from "@/lib/whatsapp";

export const WaIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
    <path d="M17.5 14.4c-.3-.1-1.7-.8-2-.9-.3-.1-.5-.1-.7.1-.2.3-.8.9-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.2-.5-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6l.4-.5c.2-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.4s1 2.8 1.2 3c.1.2 2 3.1 4.9 4.3.7.3 1.2.5 1.7.6.7.2 1.3.2 1.8.1.6-.1 1.7-.7 1.9-1.4.2-.7.2-1.2.2-1.4-.1-.1-.3-.2-.6-.3zM12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.5 0-3-.4-4.3-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2z" />
  </svg>
);

export function WhatsAppFloat({ number, message, fallbackHref }: { number: string; message: string; fallbackHref: string }) {
  const href = whatsappLink(number, message);
  return (
    <a href={href ?? fallbackHref} target={href ? "_blank" : undefined} rel="noopener noreferrer"
      className="fixed bottom-5 right-5 z-30 grid h-14 w-14 place-items-center rounded-full bg-[#1FAF5A] text-white shadow-[0_8px_30px_rgba(0,0,0,0.4)] transition-transform hover:scale-105 focus-visible:outline-cream"
      aria-label={href ? "Chat with us on WhatsApp (opens in a new tab)" : "Contact us"}>
      <WaIcon className="h-7 w-7" />
    </a>
  );
}
