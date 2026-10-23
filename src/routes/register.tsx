import { useEffect } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useAuthModal } from '@/context/AuthModalContext';

export const Route = createFileRoute('/register')({
  component: RegisterPage
});

function RegisterPage() {
  const { openRegister } = useAuthModal();
  const search = Route.useSearch() as { redirect?: string };
  const redirectUrl = search?.redirect || '/';
  const navigate = useNavigate();

  useEffect(() => {
    openRegister(redirectUrl);
    navigate({ to: redirectUrl, replace: true });
  }, [openRegister, redirectUrl, navigate]);

  return null;
}
