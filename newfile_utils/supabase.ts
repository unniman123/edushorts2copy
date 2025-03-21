import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://fjbujzpvfdpcgubcrcef.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqYnVqenB2ZmRwY2d1YmNyY2VmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEwMzI3ODEsImV4cCI6MjA1NjYwODc4MX0.p5jfri1LYQLB4bOZmdsa9YqytNr9q9jJPNkpdBsMsMg'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);