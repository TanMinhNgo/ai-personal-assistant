import { insforge } from '@/lib/insforge';

type InsForgeUser = {
  email?: string | null;
  id: string;
  profile?: { avatar_url?: string | null; name?: string | null } | null;
};

export async function saveVerifiedUserProfile(
  user: InsForgeUser,
  name?: string
) {
  if (!user.email)
    throw new Error('The authenticated user does not have an email address.');

  const displayName =
    name?.trim() || user.profile?.name || user.email.split('@')[0];
  const { error } = await insforge.auth.setProfile({
    name: displayName,
    email: user.email,
    avatar_url: user.profile?.avatar_url ?? undefined,
  });
  if (error) throw error;
}
