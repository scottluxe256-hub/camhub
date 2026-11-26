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
          foto_url: string | null
          foto_public_id: string | null
        }
        Insert: {
          id: string
          nama_lengkap?: string | null
          nis?: string | null
          kelas?: string | null
          role?: 'siswa' | 'admin'
          foto_url?: string | null
          foto_public_id?: string | null
        }
        Update: {
          id?: string
          nama_lengkap?: string | null
          nis?: string | null
          kelas?: string | null
          role?: 'siswa' | 'admin'
          foto_url?: string | null
          foto_public_id?: string | null
        }
        Relationships: []
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
        Relationships: []
      }
      borrow_requests: {
        Row: {
          id: string
          user_id: string
          camera_id: string
          tanggal_pinjam: string
          jam_mulai: string
          jam_selesai: string
          rencana_kembali: string
          tanggal_dikembalikan: string | null
          alasan_pinjam: string
          status_request: 'Pending' | 'Approved' | 'Rejected' | 'Returned'
          catatan_admin: string | null
          notif_10m_sent: boolean
          notif_expired_sent: boolean
          notif_final_warning_sent: boolean
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
          notif_10m_sent?: boolean
          notif_expired_sent?: boolean
          notif_final_warning_sent?: boolean
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
          notif_10m_sent?: boolean
          notif_expired_sent?: boolean
          notif_final_warning_sent?: boolean
          created_at?: string
        }
        Relationships: []
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
        Relationships: []
      }
      studio_settings: {
        Row: {
          id: number
          jam_buka: string
          jam_tutup: string
          istirahat_mulai: string
          istirahat_selesai: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          id?: number
          jam_buka?: string
          jam_tutup?: string
          istirahat_mulai?: string
          istirahat_selesai?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          id?: number
          jam_buka?: string
          jam_tutup?: string
          istirahat_mulai?: string
          istirahat_selesai?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type ProfileItem = Database['public']['Tables']['profiles']['Row'];
