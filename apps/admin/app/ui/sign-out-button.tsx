'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '../lib/supabase/client';

export function SignOutButton() {
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <button
      className="button secondary"
      style={{ fontSize: 13 }}
      onClick={() => { void signOut(); }}
    >
      Sign out
    </button>
  );
}
