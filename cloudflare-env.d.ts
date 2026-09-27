declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    OPENAI_API_KEY?: string;
    OPENAI_MODEL?: string;
    GEMINI_API_KEY?: string;
    GEMINI_MODEL?: string;
    STRAVA_CLIENT_ID?: string;
    STRAVA_CLIENT_SECRET?: string;
    STRAVA_REDIRECT_URI?: string;
    STRAVA_TOKEN_ENCRYPTION_KEY?: string;
    STRAVA_WEBHOOK_VERIFY_TOKEN?: string;
    STRAVA_WEBHOOK_SUBSCRIPTION_ID?: string;
  }
}
