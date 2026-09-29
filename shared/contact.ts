export const CONTACT_SERVICES = ["IA y automatización", "AWS, cloud y costes", "Seguridad y Microsoft 365", "Desarrollo e integraciones", "Web y ecommerce"];
const CONTACT_OPTIONS = [...CONTACT_SERVICES, "Quiero orientación"];
export const CONTACT_LIMITS = { name: 120, email: 254, company: 160, message: 6000 };
export type ContactData = { name: string; email: string; company: string; message: string; services: string[] };
export const validEmail = (value: string) => value.length <= 254 && /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]{2,}$/.test(value);

/** Shared rules; the server never relies on browser validation. */
export function validateContact(input: unknown): { data: ContactData; errors: Record<string, string> } {
  const raw = input && typeof input === "object" ? input as Record<string, unknown> : {};
  const string = (key: string) => typeof raw[key] === "string" ? raw[key].trim() : "";
  const data: ContactData = { name: string("name"), email: string("email"), company: string("company"), message: string("message"), services: [] };
  const errors: Record<string, string> = {};
  if (!data.name || data.name.length > CONTACT_LIMITS.name || /[\r\n\x00-\x1f]/.test(data.name)) errors.nombre = "Indica tu nombre (máximo 120 caracteres).";
  if (!validEmail(data.email)) errors.email = "Revisa el correo electrónico (máximo 254 caracteres).";
  if (data.company.length > CONTACT_LIMITS.company || /[\r\n\x00-\x1f]/.test(data.company)) errors.empresa = "La empresa admite un máximo de 160 caracteres y una sola línea.";
  if (data.message.length < 10 || data.message.length > CONTACT_LIMITS.message || data.message.includes("\0")) errors.mensaje = "Cuéntanos un poco más: entre 10 y 6000 caracteres.";
  if (!Array.isArray(raw.services) || raw.services.length > CONTACT_OPTIONS.length || raw.services.some(s => typeof s !== "string" || !CONTACT_OPTIONS.includes(s))) {
    errors.ayuda = "Selecciona servicios de la lista.";
  } else data.services = [...new Set(raw.services as string[])];
  return { data, errors };
}
