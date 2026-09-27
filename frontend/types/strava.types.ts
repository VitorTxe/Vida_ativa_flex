export interface StravaConnectionStatus {
  connected: boolean;
  athlete: { id: string; name: string | null } | null;
  scopes: string[];
  connectedAt: string | null;
}

export interface StravaActivity {
  id: string;
  name: string;
  sportType: string;
  distanceMeters: number;
  movingTime: number;
  elapsedTime: number;
  averageSpeed: number | null;
  paceAverage: string | null;
  startDate: string;
  startDateLocal: string;
  trainer: boolean;
  url: string;
}

export interface TrainingCompletion {
  id: string;
  week: number;
  session: number;
  source: "manual" | "strava";
  stravaActivityId: string | null;
  activityName: string | null;
  sportType: string | null;
  startDate: string | null;
  movingTime: number | null;
  elapsedTime: number | null;
  distanceMeters: number | null;
  averageSpeed: number | null;
  paceAverage: string | null;
  completedAt: string;
  stravaUrl: string | null;
}
