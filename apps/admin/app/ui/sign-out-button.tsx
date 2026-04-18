'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '../lib/supabase/client';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

export function SignOutButton() {
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <Button variant="outline" size="sm" onClick={() => { void signOut(); }}>
      <LogOut size={14} />
      Sign out
    </Button>
  );
}
