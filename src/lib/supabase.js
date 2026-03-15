import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://coboosdqzqdktzmwmpwk.supabase.co';
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvYm9vc2RxenFka3R6bXdtcHdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1OTY1NjAsImV4cCI6MjA4OTE3MjU2MH0.Q_YcB5T2i1zwPsKZDuT1QXOrME9m8TK9ueR6BjCRF4o';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
