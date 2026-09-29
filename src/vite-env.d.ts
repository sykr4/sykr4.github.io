/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CONTACT_ENDPOINT?: string;
  readonly VITE_CONTACT_EMAIL?: string;
  readonly VITE_CONTACT_MODE?: "download" | "email";
}
