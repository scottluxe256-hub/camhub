export const uploadToCloudinary = async (file: File) => {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    const msg = "VITE_CLOUDINARY_CLOUD_NAME atau VITE_CLOUDINARY_UPLOAD_PRESET belum terpasang di file .env!";
    console.error(msg);
    throw new Error(msg);
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Detail Error Cloudinary:", data);
      throw new Error(data.error?.message || "Gagal mengunggah ke Cloudinary.");
    }

    // Mengubah URL gambar ke rasio 400x400 auto-format
    const optimizedUrl = data.secure_url.replace(
      '/upload/',
      '/upload/c_fill,w_400,h_400,q_auto,f_auto/'
    );

    return {
      imageUrl: optimizedUrl,
      publicId: data.public_id as string,
    };
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw error;
  }
};
