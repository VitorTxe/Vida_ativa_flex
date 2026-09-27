import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/backend/services/auth.service";
import {
  exchangeAuthorizationCode,
  getStravaRedirectUri,
  saveStravaConnection,
} from "@/backend/services/strava.service";

export const dynamic = "force-dynamic";

const OAUTH_STATE_COOKIE = "flex_strava_oauth_state";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const resultUrl = new URL("/", request.url);
  const responseWithStatus = (status: string) => {
    resultUrl.searchParams.set("strava", status);
    const response = NextResponse.redirect(resultUrl);
    response.cookies.set(OAUTH_STATE_COOKIE, "", { path: "/api/strava/callback", maxAge: 0 });
    return response;
  };

  const identity = await getCurrentUser();
  if (!identity) return responseWithStatus("login");
  if (requestUrl.searchParams.get("error")) return responseWithStatus("denied");

  const code = requestUrl.searchParams.get("code");
  const returnedState = requestUrl.searchParams.get("state");
  const acceptedScope = requestUrl.searchParams.get("scope") ?? "";
  const savedState = (await cookies()).get(OAUTH_STATE_COOKIE)?.value;

  if (!code || !returnedState || !savedState || returnedState !== savedState) {
    return responseWithStatus("invalid_state");
  }

  try {
    const token = await exchangeAuthorizationCode(code, getStravaRedirectUri(request.url));
    await saveStravaConnection(identity.idAluno, token, acceptedScope);
    return responseWithStatus("connected");
  } catch (error: unknown) {
    console.error("Erro no callback OAuth do Strava:", error);
    return responseWithStatus("error");
  }
}
