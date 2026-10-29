import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import EditProfileClient from '@/components/profile/EditProfileClient'

export default async function EditProfilePage() {
  const supabase = await createClient()

  // getUser() - daha güvenli auth doğrulama
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect('/giris?redirect=/profil/duzenle')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/giris')
  }

  return <EditProfileClient initialProfile={profile} />
}
