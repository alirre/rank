import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import CreateGroupClient from '@/components/group/CreateGroupClient'

export default async function CreateGroupPage() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect('/giris?redirect=/grup/olustur')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/giris')
  }

  // Askıya alınmış kullanıcılar grup oluşturamaz
  if (profile.is_suspended) {
    redirect('/?error=suspended')
  }

  return <CreateGroupClient currentUser={profile} />
}
