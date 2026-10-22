import { supabase } from '@/lib/supabase';

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];

export async function uploadImage(file: File, folder: string): Promise<string> {
  if (!ALLOWED.includes(file.type)) throw new Error('Dovoljene so samo slike (JPG, PNG, WEBP, GIF, AVIF).');
  if (file.size > MAX_BYTES) throw new Error('Slika je prevelika (največ 8 MB).');
  const ext = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
  const path = `${folder}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
  const { error } = await supabase.storage.from('media').upload(path, file, { contentType: file.type, cacheControl: '31536000' });
  if (error) throw new Error('Nalaganje slike ni uspelo. Poskusite znova.');
  return supabase.storage.from('media').getPublicUrl(path).data.publicUrl;
}
