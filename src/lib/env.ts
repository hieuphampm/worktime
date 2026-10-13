function required(name: string, value: string | undefined): string {
  if (!value?.trim()) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export function publicEnv() {
  return {
    url: required('PUBLIC_SUPABASE_URL', import.meta.env.PUBLIC_SUPABASE_URL),
    key: required('PUBLIC_SUPABASE_PUBLISHABLE_KEY', import.meta.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY),
  };
}

export function serverEnv() {
  return {
    ...publicEnv(),
    secret: required('SUPABASE_SECRET_KEY', import.meta.env.SUPABASE_SECRET_KEY),
    timezone: import.meta.env.COMPANY_TIMEZONE || 'Asia/Ho_Chi_Minh',
    companyName: import.meta.env.COMPANY_NAME || 'Công ty',
    appUrl: import.meta.env.APP_URL || 'http://localhost:4321',
  };
}
