export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    nama_lengkap: string | null
                    nis: string | null
                    kelas: string | null
                    role: 'siswa' | 'admin'
                }
                Insert: {
                    id: string
                    nama_lengkap?: string | null
                    nis?: string | null
                    kelas?: string | null
                    role?: 'siswa' | 'admin'
                }
                Update: {
                    id?: string
                    nama_lengkap?: string | null
                    nis?: string | null
                    kelas?: string | null
                    role?: 'siswa' | 'admin'
                }
            }
            cameras: {
                Row: {
                    id: string
                    nama_barang: string
                    tipe: string | null
                    kode_inventaris: string
                    kondisi: string | null
                    status: 'Tersedia' | 'Dipinjam' | 'Maintenance'
                    image_url: string | null
                    image_public_id: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    nama_barang: string
                    tipe?: string | null
                    kode_inventaris: string
                    kondisi?: string | null
                    status?: 'Tersedia' | 'Dipinjam' | 'Maintenance'
                    image_url?: string | null
                    image_public_id?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    nama_barang?: string
                    tipe?: string | null
                    kode_inventaris?: string
                    kondisi?: string | null
                    status?: 'Tersedia' | 'Dipinjam' | 'Maintenance'
                    image_url?: string | null
                    image_public_id?: string | null
                    created_at?: string
                }
            }
            borrow_requests: {
                Row: {
                    id: string
                    user_id: string
                    camera_id: string
                    tanggal_pinjam: string
                    jam_mulai: string     // Format time: '08:00:00'
                    jam_selesai: string   // Format time: '14:00:00'
                    rencana_kembali: string
                    tanggal_dikembalikan: string | null
                    alasan_pinjam: string
                    status_request: 'Pending' | 'Approved' | 'Rejected' | 'Returned'
                    catatan_admin: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    camera_id: string
                    tanggal_pinjam: string
                    jam_mulai: string
                    jam_selesai: string
                    rencana_kembali: string
                    tanggal_dikembalikan?: string | null
                    alasan_pinjam: string
                    status_request?: 'Pending' | 'Approved' | 'Rejected' | 'Returned'
                    catatan_admin?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    camera_id?: string
                    tanggal_pinjam?: string
                    jam_mulai?: string
                    jam_selesai?: string
                    rencana_kembali?: string
                    tanggal_dikembalikan?: string | null
                    alasan_pinjam?: string
                    status_request?: 'Pending' | 'Approved' | 'Rejected' | 'Returned'
                    catatan_admin?: string | null
                    created_at?: string
                }
            }
            feedbacks: {
                Row: {
                    id: string
                    user_id: string
                    pesan: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    pesan: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    pesan?: string
                    created_at?: string
                }
            }
        }
    }
}
