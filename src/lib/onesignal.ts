import OneSignal from 'react-onesignal';

let initPromise: Promise<void> | null = null;

export const initOneSignal = async () => {
  if (typeof window === 'undefined') return;

  if (!initPromise) {
    initPromise = OneSignal.init({
      appId: import.meta.env.VITE_ONESIGNAL_APP_ID,
      allowLocalhostAsSecureOrigin: true,
      notifyButton: {
        enable: false, // Lonceng merah dimatikan total
      },
      promptOptions: {
        slidedown: {
          prompts: [
            {
              type: 'push',
              autoPrompt: true, // Otomatis muncul pas web dibuka/refresh
              text: {
                actionMessage:
                  'Aktifkan notifikasi CamHub untuk mendapat pengingat sebelum batas waktu peminjaman alat lab habis.',
                acceptButton: 'Izinkan',
                cancelButton: 'Nanti Saja',
              },
              delay: {
                pageViews: 1,
                timeDelay: 2, // Muncul otomatis 2 detik setelah halaman dimuat
              },
            },
          ],
        },
      },
    })
      .then(() => {
        console.log('✅ OneSignal initialized');
      })
      .catch((error) => {
        console.error('❌ OneSignal init error:', error);
        initPromise = null;
      });
  }

  return initPromise;
};

// Pasangkan ID Supabase ke OneSignal saat login
export const setOneSignalUser = async (userId: string) => {
  try {
    await initOneSignal();
    await OneSignal.login(userId);
    console.log(`✅ OneSignal linked to user: ${userId}`);
  } catch (error) {
    console.error('❌ Failed to link OneSignal user:', error);
  }
};

// Lepaskan kaitan saat logout
export const logoutOneSignal = async () => {
  try {
    await OneSignal.logout();
    console.log('OneSignal logged out');
  } catch (error) {
    console.error('Failed to logout OneSignal:', error);
  }
};
