export interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  ONESIGNAL_APP_ID: string;
  ONESIGNAL_REST_API_KEY: string;
}

export default {
  // Fungsi utama yang dipanggil oleh Cron Trigger setiap 1 menit
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(processCamHubReminders(env));
  },

  // Fungsi tambahan untuk mempermudah pengetesan via URL browser (opsional)
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    await processCamHubReminders(env);
    return new Response("Pengecekan alarm peminjaman CamHub berhasil dijalankan!");
  },
};

async function processCamHubReminders(env: Env) {
  // 1. Ambil waktu saat ini di WIB (Waktu Indonesia Barat = UTC+7)
  const WIB_OFFSET = 7 * 60 * 60 * 1000;
  const nowWIB = new Date(Date.now() + WIB_OFFSET);
  
  // Konversi waktu sekarang ke total menit (contoh: 14:30 = (14*60)+30 = 870 menit)
  const currentTotalMins = nowWIB.getUTCHours() * 60 + nowWIB.getUTCMinutes();

  // 2. Query ke Supabase via REST API
  // Ambil data pinjaman aktif yang belum dikirim notif final (10 menit setelah habis)
  const supabaseUrl = `${env.SUPABASE_URL}/rest/v1/borrow_requests?select=id,user_id,jam_selesai,notif_10m_sent,notif_expired_sent,notif_final_warning_sent,cameras(nama_barang)&status_request=eq.Dipinjam&notif_final_warning_sent=eq.false`;

  const reqResponse = await fetch(supabaseUrl, {
    headers: {
      'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`
    }
  });

  const requests = await reqResponse.json() as any[];

  if (!requests || requests.length === 0) {
    console.log("Tidak ada peminjaman aktif yang perlu dinotifikasi.");
    return;
  }

  console.log(`Mengecek ${requests.length} data peminjaman...`);

  const updated10mIds: string[] = [];
  const updatedExpiredIds: string[] = [];
  const updatedFinalIds: string[] = [];

  // 3. Cek masing-masing sisa waktu peminjaman
  for (const req of requests) {
    // Parsing jam_selesai dari Supabase (misal "15:00:00" menjadi [15, 0])
    const [endHour, endMin] = req.jam_selesai.split(':').map(Number);
    const endTotalMins = endHour * 60 + endMin;
    
    // Hitung selisih waktu
    // diffMins positif = waktu masih ada, diffMins negatif = waktu sudah lewat
    const diffMins = endTotalMins - currentTotalMins;
    const namaAlat = req.cameras?.nama_barang || "Alat Lab";

    // KONDISI A: H-10 Menit (Waktu sisa 1 s/d 10 menit)
    if (diffMins <= 10 && diffMins > 0 && req.notif_10m_sent === false) {
      await sendPushNotification(
        env, 
        req.user_id, 
        "Waktu Hampir Habis! ⏳", 
        `Peminjaman ${namaAlat} tersisa ${diffMins} menit lagi. Harap bersiap untuk mengembalikan.`
      );
      updated10mIds.push(req.id);
    } 
    // KONDISI B: Waktu Habis (Tepat waktu 0 s/d lewat 9 menit)
    else if (diffMins <= 0 && diffMins > -10 && req.notif_expired_sent === false) {
      await sendPushNotification(
        env, 
        req.user_id, 
        "Waktu Habis! 🚨", 
        `Batas waktu peminjaman ${namaAlat} sudah habis. Segera kembalikan ke Lab sekarang!`
      );
      updatedExpiredIds.push(req.id);
    }
    // KONDISI C: Lewat 10 Menit (Batas Akhir Sebelum Sanksi)
    else if (diffMins <= -10 && req.notif_final_warning_sent === false) {
      await sendPushNotification(
        env, 
        req.user_id, 
        "PERINGATAN SANKSI! ❌", 
        `Kamu sudah telat lebih dari 10 menit mengembalikan ${namaAlat}. Segera lapor ke admin sebelum dikenakan sanksi/denda!`
      );
      updatedFinalIds.push(req.id);
    }
  }

  // 4. Update status reminder di Supabase agar tidak spam/double notif
  if (updated10mIds.length > 0) {
    await updateSupabaseFlags(env, updated10mIds, { notif_10m_sent: true });
    console.log(`${updated10mIds.length} notif pengingat 10 menit terkirim.`);
  }
  
  if (updatedExpiredIds.length > 0) {
    // Sekalian set notif_10m_sent ke true untuk jaga-jaga kalau sebelumnya terlewat
    await updateSupabaseFlags(env, updatedExpiredIds, { notif_expired_sent: true, notif_10m_sent: true });
    console.log(`${updatedExpiredIds.length} notif waktu habis terkirim.`);
  }

  if (updatedFinalIds.length > 0) {
    // Sekalian set semua notif sebelumnya ke true biar aman
    await updateSupabaseFlags(env, updatedFinalIds, { notif_final_warning_sent: true, notif_expired_sent: true, notif_10m_sent: true });
    console.log(`${updatedFinalIds.length} notif peringatan sanksi terkirim.`);
  }
}

// === FUNGSI BANTUAN ===

// Fungsi untuk menembak API OneSignal
async function sendPushNotification(env: Env, userId: string, title: string, message: string) {
  const payload = {
    app_id: env.ONESIGNAL_APP_ID,
    include_aliases: {
      external_id: [userId] // Mengincar ID user spesifik dari Supabase
    },
    target_channel: "push",
    headings: { en: title },
    contents: { en: message },
    priority: 10, // Memaksa Android memprioritaskan notifikasi (High Priority)
    ttl: 3600,    // Waktu tunggu (Time-To-Live) 1 jam jika HP mati/offline
  };

  const osResponse = await fetch("https://onesignal.com/api/v1/notifications", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Basic ${env.ONESIGNAL_REST_API_KEY}`
    },
    body: JSON.stringify(payload)
  });

  if (!osResponse.ok) {
    console.error(`Gagal mengirim OneSignal ke user ${userId}:`, await osResponse.text());
  }
}

// Fungsi untuk update nilai kolom penanda di Supabase
async function updateSupabaseFlags(env: Env, ids: string[], data: any) {
  const updateUrl = `${env.SUPABASE_URL}/rest/v1/borrow_requests?id=in.(${ids.join(',')})`;
  const response = await fetch(updateUrl, {
    method: "PATCH",
    headers: {
      'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    console.error(`Gagal update Supabase untuk IDs ${ids.join(',')}:`, await response.text());
  }
}
