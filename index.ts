export interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  ONESIGNAL_APP_ID: string;
  ONESIGNAL_REST_API_KEY: string;
}

export default {
  // 1. Endpoint HTTP (opsional, buat tes manual lewat browser/Postman)
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    return new Response("CamHub Notifier Worker Aktif!", { status: 200 });
  },

  // 2. Cron Trigger (otomatis jalan setiap 1 menit)
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(handleLoanNotifications(env));
  },
};

async function handleLoanNotifications(env: Env) {
  // Logika cek waktu peminjaman & tembak OneSignal akan dijalankan di sini
}
