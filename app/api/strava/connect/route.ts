import { NextResponse } from "next/server";
import { getCurrentUser } from "@/backend/services/auth.service";
import { getStravaClientId, getStravaRedirectUri, StravaConfigurationError } from "@/backend/services/strava.service";

export const dynamic = "force-dynamic";

const OAUTH_STATE_COOKIE = "flex_strava_oauth_state";

export async function GET(request: Request) {
  const identity = await getCurrentUser();
  if (!identity) return NextResponse.redirect(new URL("/?strava=login", request.url));

  try {
    const state = createRandomState();
    const authorizationUrl = new URL("https://www.strava.com/oauth/authorize");
    authorizationUrl.searchParams.set("client_id", getStravaClientId());
    authorizationUrl.searchParams.set("redirect_uri", getStravaRedirectUri(request.url));
    authorizationUrl.searchParams.set("response_type", "code");
    authorizationUrl.searchParams.set("approval_prompt", "auto");
    authorizationUrl.searchParams.set("scope", "activity:read");
    authorizationUrl.searchParams.set("state", state);

    const response = NextResponse.redirect(authorizationUrl);
    response.cookies.set(OAUTH_STATE_COOKIE, state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/api/strava/callback",
      maxAge: 10 * 60,
    });
    return response;
  } catch (error: unknown) {
    console.error("Erro ao iniciar OAuth do Strava:", error);
    const message = error instanceof StravaConfigurationError ? error.message : "Integração com Strava indisponível.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function createRandomState(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
