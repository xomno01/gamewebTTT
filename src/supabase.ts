import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Sử dụng biến môi trường của Vite (import.meta.env)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Trong môi trường production, Vercel sẽ cung cấp các biến này.
  // Lỗi này chủ yếu để cảnh báo khi chạy local mà chưa có file .env
  console.error("Supabase URL or Anon Key is not defined. Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are in your .env file for local development or set in Vercel environment variables for deployment.");
  // Không nên throw error ở đây vì khi build trên Vercel, import.meta.env có thể chưa được populate ngay lập tức theo cách Vite hoạt động với biến môi trường build-time vs run-time.
  // Vercel sẽ inject các biến này vào quá trình build.
}

// Khởi tạo Supabase client. Nếu các biến môi trường không có sẵn khi code này chạy lần đầu (ví dụ: trong một số ngữ cảnh build nhất định),
// createClient có thể nhận undefined, nhưng khi app thực sự chạy trên Vercel, các biến này sẽ được Vercel cung cấp.
export const supabase: SupabaseClient = createClient(supabaseUrl!, supabaseAnonKey!);