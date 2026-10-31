import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const ReactSwal = withReactContent(Swal);

// Tema Standar CamHub
export const CustomSwal = ReactSwal.mixin({
  customClass: {
    popup: 'rounded-[2rem] bg-white shadow-2xl border border-stone-100 p-2 sm:p-4 font-["Outfit",sans-serif]',
    title: 'text-xl font-black text-[#1c1917] pt-4',
    htmlContainer: 'text-sm font-medium text-stone-500',
    actions: 'mt-6 gap-3 w-full flex-col sm:flex-row px-4 pb-4',
    confirmButton: 'flex-1 w-full rounded-full bg-orange-600 px-6 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-orange-600/30 transition hover:bg-orange-500 active:scale-95 m-0',
    cancelButton: 'flex-1 w-full rounded-full border border-stone-200 bg-stone-50 px-6 py-3.5 text-sm font-bold text-stone-600 transition hover:bg-stone-100 active:scale-95 m-0',
  },
  buttonsStyling: false,
  backdrop: 'rgba(0,0,0,0.6)',
});

// Toast Notif Pojok
export const Toast = ReactSwal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  customClass: {
    popup: 'rounded-xl bg-white shadow-xl border border-stone-100 font-["Outfit",sans-serif] mt-16 mr-4',
    title: 'text-sm font-bold text-[#1c1917]',
  },
});

// ALERT STRUKTUR TASKFLOW VERSI LIGHT THEME CAMHUB
export const showFeedbackAlert = (
  title = 'Aspirasi Diterima! 🎉', 
  message = 'Terima kasih banyak! Masukanmu bakal langsung ditinjau oleh tim operator lab multimedia.'
) => {
  return ReactSwal.fire({
    html: `
      <div class="flex flex-col items-center text-center p-2 sm:p-3">
        <!-- Lingkaran Centang Oranye ala CamHub -->
        <div class="flex h-20 w-20 items-center justify-center rounded-full border-2 border-orange-500 bg-orange-50 mb-5 ring-8 ring-orange-500/10">
          <svg class="h-10 w-10 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        
        <!-- Judul Bold Tebal -->
        <h3 class="font-['Outfit',sans-serif] text-2xl font-black text-[#1c1917] mb-2 tracking-tight">
          ${title}
        </h3>
        
        <!-- Pesan Deskripsi Ringkas -->
        <p class="text-xs sm:text-sm font-medium text-stone-500 leading-relaxed max-w-xs mb-3">
          ${message}
        </p>
      </div>
    `,
    showConfirmButton: true,
    confirmButtonText: 'Mantap!',
    customClass: {
      popup: 'rounded-[2.5rem] bg-white border border-stone-100 p-4 sm:p-6 shadow-2xl backdrop-blur-sm',
      actions: 'w-full justify-center pb-2',
      confirmButton: 'rounded-full bg-orange-600 px-9 py-3 text-sm font-extrabold text-white shadow-lg shadow-orange-600/30 transition hover:bg-orange-500 active:scale-95'
    },
    buttonsStyling: false,
    backdrop: 'rgba(0,0,0,0.6)',
  });
};
