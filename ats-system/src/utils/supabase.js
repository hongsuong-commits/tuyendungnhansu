/**
 * supabase.js - Kết nối SmartATS với Supabase (PostgreSQL)
 *
 * Cách sử dụng:
 *   1. Tạo file `.env` tại thư mục gốc ats-system với nội dung:
 *        VITE_SUPABASE_URL=https://<project-ref>.supabase.co
 *        VITE_SUPABASE_ANON_KEY=<anon-public-key>
 *   2. Cài đặt thư viện: npm install @supabase/supabase-js
 *   3. Import và sử dụng: import { supabase } from './src/utils/supabase.js'
 *
 * Lưu ý: Dự án hiện tại chạy纯 client-side (localStorage).
 * File này là lớp nối để migrate sang Supabase khi bạn có key.
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_URL)
  || (typeof process !== 'undefined' && process.env && process.env.VITE_SUPABASE_URL)
  || '';

const SUPABASE_ANON_KEY = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_ANON_KEY)
  || (typeof process !== 'undefined' && process.env && process.env.VITE_SUPABASE_ANON_KEY)
  || '';

let supabase = null;

if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    // Tự động refresh token khi cần
    auth: {
      persistSession: true,
      autoRefreshToken: true
    }
  });
} else {
  // Chưa cấu hình → in cảnh báo một lần duy nhất để không spam console
  if (typeof console !== 'undefined' && !window.__supabaseWarned) {
    console.warn(
      '[Supabase] Chưa cấu hình VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. '
      'Hệ thống vẫn chạy bằng localStorage. Thêm file .env để bật Supabase.'
    );
    window.__supabaseWarned = true;
  }
}

export { supabase };

/**
 * Helpers truy vấn nhanh (dùng khi supabase đã sẵn sàng)
 */
export const supabaseHelpers = {
  // Lấy danh sách users
  async getUsers() {
    if (!supabase) return { data: null, error: new Error('Supabase chưa cấu hình') };
    return supabase.from('users').select('*').order('created_at', { ascending: false });
  },

  // Lấy requisitions
  async getRequisitions() {
    if (!supabase) return { data: null, error: new Error('Supabase chưa cấu hình') };
    return supabase.from('requisitions').select('*').order('created_at', { ascending: false });
  },

  // Lấy applications kèm candidate
  async getApplications() {
    if (!supabase) return { data: null, error: new Error('Supabase chưa cấu hình') };
    return supabase
      .from('applications')
      .select(`
        *,
        candidates (*),
        requisitions (*)
      `)
      .order('applied_date', { ascending: false });
  },

  // Lấy interviews
  async getInterviews() {
    if (!supabase) return { data: null, error: new Error('Supabase chưa cấu hình') };
    return supabase.from('interviews').select('*').order('date', { ascending: true });
  },

  // Lấy evaluations
  async getEvaluations() {
    if (!supabase) return { data: null, error: new Error('Supabase chưa cấu hình') };
    return supabase.from('evaluations').select('*').order('created_at', { ascending: false });
  },

  // Lấy email_log
  async getEmailLog() {
    if (!supabase) return { data: null, error: new Error('Supabase chưa cấu hình') };
    return supabase.from('email_log').select('*').order('created_at', { ascending: false });
  },

  // Ghi một bản ghi email (mô phỏng gửi mail)
  async insertEmail(record) {
    if (!supabase) return { data: null, error: new Error('Supabase chưa cấu hình') };
    return supabase.from('email_log').insert(record).select();
  },

  // Cập nhật trạng thái application + ghi email nếu cần
  async updateApplicationStatus(id, updates) {
    if (!supabase) return { data: null, error: new Error('Supabase chưa cấu hình') };
    return supabase.from('applications').update(updates).eq('id', id).select().single();
  }
};

export default { supabase, supabaseHelpers };
