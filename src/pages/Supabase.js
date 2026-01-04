import { createClient } from '@supabase/supabase-js';

// 환경 변수에서 Supabase URL과 ANON KEY를 가져옵니다.
const REACT_APP_SUPABASE_API_URL = process.env.REACT_APP_SUPABASE_API_URL;
const REACT_APP_SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;


// 환경 변수가 설정되지 않은 경우 에러를 발생시키거나, 기본값을 설정할 수 있습니다.
const missingVars = [];
if (!REACT_APP_SUPABASE_API_URL) missingVars.push('REACT_APP_SUPABASE_API_URL');
if (!REACT_APP_SUPABASE_ANON_KEY) missingVars.push('REACT_APP_SUPABASE_ANON_KEY');
if (missingVars.length > 0) {
  console.error('Missing environment variables:', missingVars.join(', '));
  throw new Error('Supabase URL or ANON KEY is not set in environment variables');
}
// Supabase 클라이언트를 생성합니다.
const supabase = createClient(REACT_APP_SUPABASE_API_URL, REACT_APP_SUPABASE_ANON_KEY);

export default supabase;