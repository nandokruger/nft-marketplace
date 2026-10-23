import { useEffect } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useAuthModal } from '@/context/AuthModalContext';

export const Route = createFileRoute('/login')({
  component: LoginPage
});

function LoginPage() {
  const { openLogin } = useAuthModal();
  const search = Route.useSearch() as { redirect?: string };
  const redirectUrl = search?.redirect || '/';
  const navigate = useNavigate();

  useEffect(() => {
    openLogin(redirectUrl);
    // Replace URL to target redirect or home so user is not stuck on a standalone page
    navigate({ to: redirectUrl, replace: true });
  }, [openLogin, redirectUrl, navigate]);

  return null;
}
