export interface Env extends Cloudflare.Env {
  SESSION_SECRET: string;
  ALLOWED_ORIGINS: string;
}
