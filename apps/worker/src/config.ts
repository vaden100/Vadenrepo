/** Worker env. The service-role key lives ONLY here and in server functions (SPEC 11). */
export interface WorkerConfig {
  port: number;
  supabaseUrl: string | undefined;
  hasServiceRole: boolean;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): WorkerConfig {
  return {
    port: Number(env.PORT ?? 8787),
    supabaseUrl: env.SUPABASE_URL,
    hasServiceRole: Boolean(env.SUPABASE_SERVICE_ROLE_KEY),
  };
}
