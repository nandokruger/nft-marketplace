import { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import { useAuthModal } from '@/context/AuthModalContext';
import { apiClient, AUTH_TOKEN_KEY, AUTH_USER_KEY } from '@/lib/axios';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useIsDesktop } from '@/lib/use-media-query';
import { cn } from '@/lib/utils';
import type { AuthResponse } from '@/contracts';

// Validation Schemas
const loginSchema = z.object({
  email: z.string().min(1, 'Digite seu e-mail').email('Formato de e-mail inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres')
});
type LoginFormValues = z.infer<typeof loginSchema>;

const registerSchema = z
  .object({
    name: z.string().min(2, 'Nome de usuário deve ter no mínimo 2 caracteres'),
    email: z.string().min(1, 'Digite seu e-mail').email('Formato de e-mail inválido'),
    password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
    confirmPassword: z.string().min(1, 'Confirme sua senha')
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword']
  });
type RegisterFormValues = z.infer<typeof registerSchema>;

export function AuthModal() {
  const { isOpen, mode, redirectUrl, close, setMode } = useAuthModal();
  const navigate = useNavigate();
  const qc = useQueryClient();

  // Visibility toggles for password fields
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showRegisterConfirmPassword, setShowRegisterConfirmPassword] = useState(false);

  // Error and info feedback
  const [apiError, setApiError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  // Forms with React Hook Form + Zod
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: ''
    }
  });

  // Reset errors and fields on open or mode switch
  useEffect(() => {
    if (isOpen) {
      setApiError(null);
      setInfoMessage(null);
    }
  }, [isOpen, mode]);

  // Login Mutation
  const loginMutation = useMutation({
    mutationFn: async (values: LoginFormValues) => {
      setApiError(null);
      const res = await apiClient.post<AuthResponse>('/api/auth/login', {
        email: values.email,
        password: values.password
      });
      return res.data;
    },
    onSuccess: async (data) => {
      // 1. Save auth credentials in storage and axios headers
      window.localStorage.setItem(AUTH_TOKEN_KEY, data.token);
      window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;

      // 2. Merge guest cart into user account
      try {
        await apiClient.post('/api/cart/merge');
      } catch {
        try {
          await apiClient.post('/api/cart/sync');
        } catch {
          // ignore
        }
      }

      // 3. Invalidate caches and trigger reactive updates
      await qc.invalidateQueries({ queryKey: ['session'] });
      await qc.invalidateQueries({ queryKey: ['private'] });
      window.dispatchEvent(new CustomEvent('kurio:auth-changed'));

      // 4. Close modal
      close();
      loginForm.reset();

      // 5. Context preservation: navigate only if an explicit different target was requested
      if (redirectUrl && redirectUrl !== window.location.pathname) {
        navigate({ to: redirectUrl });
      }
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      setApiError(err.response?.data?.message || 'Credenciais inválidas. Verifique seu e-mail e senha.');
    }
  });

  // Register Mutation
  const registerMutation = useMutation({
    mutationFn: async (values: { name: string; email: string; password: string }) => {
      setApiError(null);
      const res = await apiClient.post<AuthResponse>('/api/auth/register', values);
      return res.data;
    },
    onSuccess: async (data) => {
      // 1. Save auth credentials
      window.localStorage.setItem(AUTH_TOKEN_KEY, data.token);
      window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;

      // 2. Merge guest cart
      try {
        await apiClient.post('/api/cart/merge');
      } catch {
        try {
          await apiClient.post('/api/cart/sync');
        } catch {
          // ignore
        }
      }

      // 3. Invalidate caches
      await qc.invalidateQueries({ queryKey: ['session'] });
      await qc.invalidateQueries({ queryKey: ['private'] });
      window.dispatchEvent(new CustomEvent('kurio:auth-changed'));

      // 4. Close modal
      close();
      registerForm.reset();

      // 5. Navigate if target specified
      if (redirectUrl && redirectUrl !== window.location.pathname) {
        navigate({ to: redirectUrl });
      }
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      setApiError(err.response?.data?.message || 'Já existe uma conta associada a este endereço de e-mail.');
    }
  });

  const isDesktop = useIsDesktop();
  const isPending = loginMutation.isPending || registerMutation.isPending;

  if (!isDesktop) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-[390px] mx-auto rounded-[2.5rem] bg-[#120B07] border border-[#2D241E] p-6 sm:p-7 shadow-[0_20px_60px_rgba(0,0,0,0.85)] max-h-[92vh] overflow-y-auto gap-0 text-foreground font-mono [&>button]:right-5 [&>button]:top-5 [&>button]:text-[#8E857E] [&>button]:hover:text-white [&>button]:rounded-full [&>button]:p-1.5 [&>button]:hover:bg-white/10">
        {/* Top Brand Identity: KURIO */}
        <div className="pt-2 pb-1 text-center select-none">
          <span className="font-mono font-bold tracking-[0.22em] text-2xl text-white">
            KURIO
          </span>
        </div>

        {/* Accessible Dialog Titles for screen readers */}
        <DialogTitle className="sr-only">
          {mode === 'login' ? 'Entrar' : 'Criar perfil de colecionador'}
        </DialogTitle>
        <DialogDescription className="sr-only">
          {mode === 'login'
            ? 'Acesse sua conta para gerenciar seus NFTs e transações.'
            : 'Crie seu perfil de colecionador para começar a negociar arte digital.'}
        </DialogDescription>

        {/* View Title */}
        <h2 className="text-center font-mono font-bold text-base text-white mt-8 mb-6 tracking-tight">
          {mode === 'login' ? 'Entrar' : 'Criar perfil de colecionador'}
        </h2>

        {/* Error Feedback Banner */}
        {apiError && (
          <div
            role="alert"
            aria-live="polite"
            className="mb-4 rounded-xl border border-text-coral/50 bg-[#241612] p-3 text-xs text-text-coral flex items-center gap-2.5 animate-in fade-in"
          >
            <AlertCircle className="w-4 h-4 shrink-0 text-text-coral" />
            <span className="flex-1 leading-relaxed">{apiError}</span>
          </div>
        )}

        {/* Info Feedback Banner */}
        {infoMessage && (
          <div
            role="status"
            aria-live="polite"
            className="mb-4 rounded-xl border border-primary/40 bg-surface-dark p-3 text-xs text-primary flex items-center gap-2.5 animate-in fade-in"
          >
            <span className="text-base shrink-0">✦</span>
            <span className="flex-1 leading-relaxed">{infoMessage}</span>
          </div>
        )}

        {/* Form Body */}
        {mode === 'login' ? (
          /* ======================================================== */
          /*                 A. VISÃO DE LOGIN                         */
          /* ======================================================== */
          <form
            onSubmit={loginForm.handleSubmit((d) => loginMutation.mutate(d))}
            noValidate
            className="flex flex-col gap-3"
          >
            {/* Campo 1: E-mail */}
            <div className="flex flex-col gap-1">
              <Label htmlFor="email-input" className="sr-only">
                E-mail
              </Label>
              <Input
                id="email-input"
                type="email"
                autoComplete="email"
                placeholder="contato@email.com"
                aria-invalid={Boolean(loginForm.formState.errors.email)}
                aria-describedby={loginForm.formState.errors.email ? 'login-email-err' : undefined}
                {...loginForm.register('email')}
                className="h-12 w-full rounded-xl bg-[#17110D] border border-[#2D241E] px-4 text-xs sm:text-sm font-mono text-foreground placeholder:text-[#8E857E] focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-amber-500/50 outline-none transition-colors"
              />
              {loginForm.formState.errors.email && (
                <span id="login-email-err" role="alert" className="text-[11px] text-text-coral font-mono px-1">
                  {loginForm.formState.errors.email.message}
                </span>
              )}
            </div>

            {/* Campo 2: Senha com máscara e alternador de visibilidade */}
            <div className="flex flex-col gap-1">
              <Label htmlFor="password-input" className="sr-only">
                Senha
              </Label>
              <div className="relative flex items-center">
                <Input
                  id="password-input"
                  type={showLoginPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••••••"
                  aria-invalid={Boolean(loginForm.formState.errors.password)}
                  aria-describedby={loginForm.formState.errors.password ? 'login-pwd-err' : undefined}
                  {...loginForm.register('password')}
                  className="h-12 w-full rounded-xl bg-[#17110D] border border-[#2D241E] pl-4 pr-11 text-xs sm:text-sm font-mono text-foreground placeholder:text-[#8E857E] focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-amber-500/50 outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword((v) => !v)}
                  aria-label={showLoginPassword ? 'Ocultar senha' : 'Exibir senha'}
                  className="absolute right-3.5 text-[#8E857E] hover:text-[#CFB28C] transition-colors p-1 cursor-pointer"
                >
                  {showLoginPassword ? (
                    <Eye className="w-4 h-4" aria-hidden="true" />
                  ) : (
                    <EyeOff className="w-4 h-4" aria-hidden="true" />
                  )}
                </button>
              </div>
              {loginForm.formState.errors.password && (
                <span id="login-pwd-err" role="alert" className="text-[11px] text-text-coral font-mono px-1">
                  {loginForm.formState.errors.password.message}
                </span>
              )}
            </div>

            {/* Ação Secundária: Esqueceu a senha? */}
            <div className="flex justify-end pt-0.5">
              <button
                type="button"
                onClick={() => {
                  setInfoMessage('Para testes do protótipo, use: satoshi@kurio.app / password123');
                  loginForm.setValue('email', 'satoshi@kurio.app');
                  loginForm.setValue('password', 'password123');
                }}
                className="text-xs font-mono text-[#CFB28C] hover:text-primary hover:underline transition-colors cursor-pointer"
              >
                Esqueceu a senha?
              </button>
            </div>

            {/* Botão Primário: Entrar */}
            <Button
              type="submit"
              disabled={isPending}
              aria-label="Entrar na Conta"
              className="w-full h-12 rounded-xl bg-[#C98A4B] hover:bg-[#d89656] text-[#140D0A] font-mono font-bold text-sm tracking-wide transition-all cursor-pointer shadow-md active:scale-[0.99] disabled:opacity-50 mt-2"
            >
              {loginMutation.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Acessando...</span>
                </span>
              ) : (
                'Entrar'
              )}
            </Button>
          </form>
        ) : (
          /* ======================================================== */
          /*                 B. VISÃO DE CADASTRO                      */
          /* ======================================================== */
          <form
            onSubmit={registerForm.handleSubmit((d) =>
              registerMutation.mutate({
                name: d.name,
                email: d.email,
                password: d.password
              })
            )}
            noValidate
            className="flex flex-col gap-3"
          >
            {/* Campo 1: Nome de usuário */}
            <div className="flex flex-col gap-1">
              <Label htmlFor="name-input" className="sr-only">
                Nome de usuário
              </Label>
              <Input
                id="name-input"
                type="text"
                autoComplete="name"
                placeholder="Nome de usuário"
                aria-invalid={Boolean(registerForm.formState.errors.name)}
                aria-describedby={registerForm.formState.errors.name ? 'reg-name-err' : undefined}
                {...registerForm.register('name')}
                className="h-12 w-full rounded-xl bg-[#17110D] border border-[#2D241E] px-4 text-xs sm:text-sm font-mono text-foreground placeholder:text-[#8E857E] focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-amber-500/50 outline-none transition-colors"
              />
              {registerForm.formState.errors.name && (
                <span id="reg-name-err" role="alert" className="text-[11px] text-text-coral font-mono px-1">
                  {registerForm.formState.errors.name.message}
                </span>
              )}
            </div>

            {/* Campo 2: Digite seu e-mail */}
            <div className="flex flex-col gap-1">
              <Label htmlFor="register-email" className="sr-only">
                Digite seu e-mail
              </Label>
              <Input
                id="register-email"
                type="email"
                autoComplete="email"
                placeholder="Digite seu e-mail"
                aria-invalid={Boolean(registerForm.formState.errors.email)}
                aria-describedby={registerForm.formState.errors.email ? 'reg-email-err' : undefined}
                {...registerForm.register('email')}
                className="h-12 w-full rounded-xl bg-[#17110D] border border-[#2D241E] px-4 text-xs sm:text-sm font-mono text-foreground placeholder:text-[#8E857E] focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-amber-500/50 outline-none transition-colors"
              />
              {registerForm.formState.errors.email && (
                <span id="reg-email-err" role="alert" className="text-[11px] text-text-coral font-mono px-1">
                  {registerForm.formState.errors.email.message}
                </span>
              )}
            </div>

            {/* Campo 3: Senha */}
            <div className="flex flex-col gap-1">
              <Label htmlFor="register-password" className="sr-only">
                Senha
              </Label>
              <div className="relative flex items-center">
                <Input
                  id="register-password"
                  type={showRegisterPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Senha"
                  aria-invalid={Boolean(registerForm.formState.errors.password)}
                  aria-describedby={registerForm.formState.errors.password ? 'reg-pwd-err' : undefined}
                  {...registerForm.register('password')}
                  className="h-12 w-full rounded-xl bg-[#17110D] border border-[#2D241E] pl-4 pr-11 text-xs sm:text-sm font-mono text-foreground placeholder:text-[#8E857E] focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-amber-500/50 outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowRegisterPassword((v) => !v)}
                  aria-label={showRegisterPassword ? 'Ocultar senha' : 'Exibir senha'}
                  className="absolute right-3.5 text-[#8E857E] hover:text-[#CFB28C] transition-colors p-1 cursor-pointer"
                >
                  {showRegisterPassword ? (
                    <Eye className="w-4 h-4" aria-hidden="true" />
                  ) : (
                    <EyeOff className="w-4 h-4" aria-hidden="true" />
                  )}
                </button>
              </div>
              {registerForm.formState.errors.password && (
                <span id="reg-pwd-err" role="alert" className="text-[11px] text-text-coral font-mono px-1">
                  {registerForm.formState.errors.password.message}
                </span>
              )}
            </div>

            {/* Campo 4: Confirmar senha */}
            <div className="flex flex-col gap-1">
              <Label htmlFor="register-confirm-password" className="sr-only">
                Confirmar senha
              </Label>
              <div className="relative flex items-center">
                <Input
                  id="register-confirm-password"
                  type={showRegisterConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Confirmar senha"
                  aria-invalid={Boolean(registerForm.formState.errors.confirmPassword)}
                  aria-describedby={registerForm.formState.errors.confirmPassword ? 'reg-conf-err' : undefined}
                  {...registerForm.register('confirmPassword')}
                  className="h-12 w-full rounded-xl bg-[#17110D] border border-[#2D241E] pl-4 pr-11 text-xs sm:text-sm font-mono text-foreground placeholder:text-[#8E857E] focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-amber-500/50 outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowRegisterConfirmPassword((v) => !v)}
                  aria-label={showRegisterConfirmPassword ? 'Ocultar confirmação de senha' : 'Exibir confirmação de senha'}
                  className="absolute right-3.5 text-[#8E857E] hover:text-[#CFB28C] transition-colors p-1 cursor-pointer"
                >
                  {showRegisterConfirmPassword ? (
                    <Eye className="w-4 h-4" aria-hidden="true" />
                  ) : (
                    <EyeOff className="w-4 h-4" aria-hidden="true" />
                  )}
                </button>
              </div>
              {registerForm.formState.errors.confirmPassword && (
                <span id="reg-conf-err" role="alert" className="text-[11px] text-text-coral font-mono px-1">
                  {registerForm.formState.errors.confirmPassword.message}
                </span>
              )}
            </div>

            {/* Botão Primário: Criar perfil */}
            <Button
              type="submit"
              disabled={isPending}
              aria-label="Criar perfil de colecionador"
              className="w-full h-12 rounded-xl bg-[#C98A4B] hover:bg-[#d89656] text-[#140D0A] font-mono font-bold text-sm tracking-wide transition-all cursor-pointer shadow-md active:scale-[0.99] disabled:opacity-50 mt-2"
            >
              {registerMutation.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Criando perfil...</span>
                </span>
              ) : (
                'Criar perfil'
              )}
            </Button>
          </form>
        )}

        {/* Divisor Social: Ou continue com */}
        <div className="flex items-center gap-3 my-5">
          <div className="h-[1px] flex-1 bg-[#2D241E]" />
          <span className="text-xs text-[#8E857E] font-mono select-none px-1">
            Ou continue com
          </span>
          <div className="h-[1px] flex-1 bg-[#2D241E]" />
        </div>

        {/* Botões de Login Social */}
        <div className="flex flex-col gap-2.5">
          {/* Continuar com Google */}
          <button
            type="button"
            onClick={() => setInfoMessage('Autenticação com Google mockada para desenvolvimento.')}
            className="w-full h-12 rounded-xl border border-[#2D241E] bg-transparent hover:bg-[#201712] hover:border-primary/40 flex items-center justify-center gap-3 transition-colors cursor-pointer active:scale-[0.99]"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g clip-path="url(#clip0_81692_758)">
                <path d="M16.4336 17.6055C14.6992 19.0703 12.4493 20 10 20C6.35547 20 3.15621 17.9922 1.42188 15.0625L2.07117 12.0695L4.94922 11.5352C5.61719 13.6914 7.63278 15.2734 10 15.2734C11.1484 15.2734 12.2148 14.9102 13.0938 14.2656L15.8594 14.6875L16.4336 17.6055Z" fill="#59C36A" />
                <path d="M16.4336 17.6055L15.8594 14.6875L13.0937 14.2656C12.2148 14.9102 11.1484 15.2734 10 15.2734V20C12.4493 20 14.6992 19.0703 16.4336 17.6055Z" fill="#00A66C" />
                <path d="M4.72656 10C4.72656 10.539 4.8086 11.0546 4.94922 11.5352L1.42188 15.0625C0.542969 13.5859 0 11.8515 0 10C0 8.1484 0.542969 6.41406 1.42188 4.9375L4.25285 5.42473L4.94922 8.46484C4.8086 8.94527 4.72656 9.4609 4.72656 10Z" fill="#FFDA2D" />
                <path d="M20 10C20 13.0468 18.5899 15.7773 16.4336 17.6055L13.0938 14.2656C13.7734 13.7734 14.3477 13.1171 14.7227 12.3437H10C9.67184 12.3437 9.41406 12.0859 9.41406 11.7578V8.24219C9.41406 7.91402 9.67184 7.65625 10 7.65625H19.25C19.5312 7.65625 19.7773 7.85543 19.8242 8.13668C19.9414 8.74609 20 9.37887 20 10V10Z" fill="#4086F4" />
                <path d="M14.7227 12.3437C14.3477 13.1171 13.7734 13.7734 13.0938 14.2656L16.4336 17.6055C18.5899 15.7773 20 13.0469 20 10C20 9.37887 19.9414 8.74609 19.8242 8.13668C19.7773 7.85543 19.5312 7.65625 19.25 7.65625H10V12.3437H14.7227Z" fill="#4175DF" />
                <path d="M16.5977 2.79293C16.6094 2.95699 16.5391 3.10937 16.4336 3.22652L13.9258 5.72262C13.7266 5.93355 13.3985 5.95699 13.1641 5.78121C12.2382 5.08984 11.1484 4.72656 10 4.72656C7.63278 4.72656 5.61719 6.30855 4.94922 8.46484L1.42188 4.9375C3.15621 2.00781 6.35547 0 10 0C12.332 0 14.6055 0.859375 16.3867 2.35934C16.5156 2.46484 16.5859 2.62887 16.5977 2.79293V2.79293Z" fill="#FF641A" />
                <path d="M13.1641 5.78121C13.3984 5.95703 13.7265 5.93355 13.9257 5.72262L16.4336 3.22652C16.5391 3.10938 16.6094 2.95703 16.5976 2.79293C16.5859 2.62883 16.5156 2.46484 16.3867 2.35934C14.6055 0.859375 12.332 0 10 0V4.72656C11.1484 4.72656 12.2382 5.08984 13.1641 5.78121Z" fill="#F0805F" />
              </g>
              <defs>
                <clipPath id="clip0_81692_758">
                  <rect width="20" height="20" fill="white" />
                </clipPath>
              </defs>
            </svg>
            <span className="text-xs font-mono font-medium text-foreground">
              Continuar com Google
            </span>
          </button>

          {/* Continuar com Facebook */}
          <button
            type="button"
            onClick={() => setInfoMessage('Autenticação com Facebook mockada para desenvolvimento.')}
            className="w-full h-12 rounded-xl border border-[#2D241E] bg-transparent hover:bg-[#201712] hover:border-primary/40 flex items-center justify-center gap-3 transition-colors cursor-pointer active:scale-[0.99]"
          >
            <svg width="10" height="20" viewBox="0 0 10 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8.175 3.32083H10.0008V0.140833C9.68583 0.0975 8.6025 0 7.34083 0C1.56417 0 3.13583 6.54167 2.90583 7.5H0V11.055H2.905V20H6.46667V11.0558H9.25417L9.69667 7.50083H6.46583C6.6225 5.1475 5.83167 3.32083 8.175 3.32083V3.32083Z" fill="#3B5999" />
            </svg>

            <span className="text-xs font-mono font-medium text-foreground">
              Continuar com Facebook
            </span>
          </button>
        </div>

        {/* Alternador de Fluxo no Rodapé */}
        <div className="text-center mt-6 text-xs font-mono">
          {mode === 'login' ? (
            <>
              <span className="text-[#8E857E]">Novo na Kurio? </span>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setApiError(null);
                  setInfoMessage(null);
                  loginForm.reset();
                  registerForm.reset();
                }}
                className="text-foreground hover:text-primary hover:underline cursor-pointer font-medium transition-colors"
              >
                Crie uma conta
              </button>
            </>
          ) : (
            <>
              <span className="text-[#8E857E]">Já tem uma conta? </span>
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setApiError(null);
                  setInfoMessage(null);
                  loginForm.reset();
                  registerForm.reset();
                }}
                className="text-foreground hover:text-primary hover:underline cursor-pointer font-medium transition-colors"
              >
                Entre
              </button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-[460px] mx-auto p-0 rounded-xl bg-[#17100B] border border-[#2E2118] shadow-[0_25px_70px_rgba(0,0,0,0.9)] overflow-hidden font-mono text-foreground gap-0 [&>button]:right-6 [&>button]:top-6 [&>button]:text-[#8E7E72] [&>button]:hover:text-white [&>button]:opacity-90 [&>button]:hover:opacity-100 [&>button]:bg-transparent [&>button]:border-0 [&>button]:p-1 [&>button>svg]:w-[18px] [&>button>svg]:h-[18px] [&>button>svg]:text-current">
        <DialogTitle className="sr-only">
          {mode === 'login' ? 'Entrar' : 'Criar conta'}
        </DialogTitle>
        <DialogDescription className="sr-only">
          {mode === 'login'
            ? 'Entre para gerenciar sua carteira, coleção e perfil de criador.'
            : 'Crie sua conta para gerenciar sua carteira, coleção e perfil de criador.'}
        </DialogDescription>

        <div className="p-8 sm:p-10 pb-8 flex flex-col">
          {/* Header Switcher: Entrar | Criar conta */}
          <div className="flex items-center justify-center gap-3 pt-1 select-none">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setApiError(null);
                setInfoMessage(null);
              }}
              className={cn(
                'font-mono text-2xl font-medium tracking-tight transition-colors cursor-pointer outline-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0',
                mode === 'login'
                  ? 'text-[#D28A4C]'
                  : 'text-[#F5F1EB] hover:text-[#D28A4C]'
              )}
            >
              Entrar
            </button>
            <span className="text-[#634F40] text-xl font-light select-none">|</span>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setApiError(null);
                setInfoMessage(null);
              }}
              className={cn(
                'font-mono text-2xl font-medium tracking-tight transition-colors cursor-pointer outline-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0',
                mode === 'register'
                  ? 'text-[#D28A4C]'
                  : 'text-[#F5F1EB] hover:text-[#D28A4C]'
              )}
            >
              Criar conta
            </button>
          </div>

          {/* Subtitle */}
          <p className="text-center font-mono text-sm text-[#C5B4A5] mt-4 mb-7 leading-relaxed max-w-[360px] mx-auto select-none">
            {mode === 'login'
              ? 'Entre para gerenciar sua carteira, coleção e perfil de criador.'
              : 'Crie sua conta para gerenciar sua carteira, coleção e perfil de criador.'}
          </p>

          {/* Feedback Banners */}
          {apiError && (
            <div
              role="alert"
              aria-live="polite"
              className="mb-4 rounded-md border border-text-coral/50 bg-[#241612] p-3 text-xs text-text-coral flex items-center gap-2.5 animate-in fade-in"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-text-coral" />
              <span className="flex-1 leading-relaxed">{apiError}</span>
            </div>
          )}

          {infoMessage && (
            <div
              role="status"
              aria-live="polite"
              className="mb-4 rounded-md border border-[#D28A4C]/40 bg-[#241612] p-3 text-xs text-[#D28A4C] flex items-center gap-2.5 animate-in fade-in"
            >
              <span className="text-base shrink-0">✦</span>
              <span className="flex-1 leading-relaxed">{infoMessage}</span>
            </div>
          )}

          {/* Forms */}
          {mode === 'login' ? (
            <form
              onSubmit={loginForm.handleSubmit((d) => loginMutation.mutate(d))}
              noValidate
              className="flex flex-col gap-3.5"
            >
              {/* E-mail */}
              <div className="flex flex-col gap-1">
                <Label htmlFor="email-input" className="sr-only">
                  E-mail
                </Label>
                <Input
                  id="email-input"
                  type="email"
                  autoComplete="email"
                  placeholder="contato@email.com"
                  aria-invalid={Boolean(loginForm.formState.errors.email)}
                  aria-describedby={loginForm.formState.errors.email ? 'login-email-err' : undefined}
                  {...loginForm.register('email')}
                  className="h-12 w-full rounded-[6px] bg-[#1E1510] border border-[#35281E] px-4 text-sm font-mono text-[#F5F1EB] placeholder:text-[#7D6858] focus-visible:border-[#D28A4C] focus-visible:ring-1 focus-visible:ring-[#D28A4C]/50 outline-none transition-colors"
                />
                {loginForm.formState.errors.email && (
                  <span id="login-email-err" role="alert" className="text-xs text-text-coral font-mono px-1">
                    {loginForm.formState.errors.email.message}
                  </span>
                )}
              </div>

              {/* Senha */}
              <div className="flex flex-col gap-1">
                <Label htmlFor="password-input" className="sr-only">
                  Senha
                </Label>
                <div className="relative flex items-center">
                  <Input
                    id="password-input"
                    type={showLoginPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="************"
                    aria-invalid={Boolean(loginForm.formState.errors.password)}
                    aria-describedby={loginForm.formState.errors.password ? 'login-pwd-err' : undefined}
                    {...loginForm.register('password')}
                    className="h-12 w-full rounded-[6px] bg-[#1E1510] border border-[#D28A4C] pl-4 pr-11 text-sm font-mono text-[#F5F1EB] placeholder:text-[#7D6858] focus-visible:border-[#D28A4C] focus-visible:ring-1 focus-visible:ring-[#D28A4C]/50 outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword((v) => !v)}
                    aria-label={showLoginPassword ? 'Ocultar senha' : 'Exibir senha'}
                    className="absolute right-3.5 text-[#A69282] hover:text-[#D28A4C] transition-colors p-1 cursor-pointer"
                  >
                    {showLoginPassword ? (
                      <Eye className="w-5 h-5" aria-hidden="true" />
                    ) : (
                      <EyeOff className="w-5 h-5" aria-hidden="true" />
                    )}
                  </button>
                </div>
                {loginForm.formState.errors.password && (
                  <span id="login-pwd-err" role="alert" className="text-xs text-text-coral font-mono px-1">
                    {loginForm.formState.errors.password.message}
                  </span>
                )}
              </div>

              {/* Esqueceu a senha? */}
              <div className="flex justify-end pt-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setInfoMessage('Para testes do protótipo, use: satoshi@kurio.app / password123');
                    loginForm.setValue('email', 'satoshi@kurio.app');
                    loginForm.setValue('password', 'password123');
                  }}
                  className="text-sm font-mono text-[#D28A4C] hover:underline transition-colors cursor-pointer"
                >
                  Esqueceu a senha?
                </button>
              </div>

              {/* Botão Entrar */}
              <Button
                type="submit"
                disabled={isPending}
                aria-label="Entrar na Conta"
                className="w-full h-12 rounded-[6px] bg-[#D28A4C] hover:bg-[#DE9655] active:bg-[#C47D3F] text-[#140D0A] font-mono font-bold text-base tracking-wide transition-all cursor-pointer shadow-md mt-2 disabled:opacity-50"
              >
                {loginMutation.isPending ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Acessando...</span>
                  </span>
                ) : (
                  'Entrar'
                )}
              </Button>
            </form>
          ) : (
            <form
              onSubmit={registerForm.handleSubmit((d) =>
                registerMutation.mutate({
                  name: d.name,
                  email: d.email,
                  password: d.password
                })
              )}
              noValidate
              className="flex flex-col gap-3"
            >
              {/* Nome */}
              <div className="flex flex-col gap-1">
                <Label htmlFor="name-input" className="sr-only">
                  Nome de usuário
                </Label>
                <Input
                  id="name-input"
                  type="text"
                  autoComplete="name"
                  placeholder="Nome de usuário"
                  aria-invalid={Boolean(registerForm.formState.errors.name)}
                  aria-describedby={registerForm.formState.errors.name ? 'reg-name-err' : undefined}
                  {...registerForm.register('name')}
                  className="h-12 w-full rounded-[6px] bg-[#1E1510] border border-[#35281E] px-4 text-sm font-mono text-[#F5F1EB] placeholder:text-[#7D6858] focus-visible:border-[#D28A4C] focus-visible:ring-1 focus-visible:ring-[#D28A4C]/50 outline-none transition-colors"
                />
                {registerForm.formState.errors.name && (
                  <span id="reg-name-err" role="alert" className="text-xs text-text-coral font-mono px-1">
                    {registerForm.formState.errors.name.message}
                  </span>
                )}
              </div>

              {/* E-mail */}
              <div className="flex flex-col gap-1">
                <Label htmlFor="register-email" className="sr-only">
                  E-mail
                </Label>
                <Input
                  id="register-email"
                  type="email"
                  autoComplete="email"
                  placeholder="contato@email.com"
                  aria-invalid={Boolean(registerForm.formState.errors.email)}
                  aria-describedby={registerForm.formState.errors.email ? 'reg-email-err' : undefined}
                  {...registerForm.register('email')}
                  className="h-12 w-full rounded-[6px] bg-[#1E1510] border border-[#35281E] px-4 text-sm font-mono text-[#F5F1EB] placeholder:text-[#7D6858] focus-visible:border-[#D28A4C] focus-visible:ring-1 focus-visible:ring-[#D28A4C]/50 outline-none transition-colors"
                />
                {registerForm.formState.errors.email && (
                  <span id="reg-email-err" role="alert" className="text-xs text-text-coral font-mono px-1">
                    {registerForm.formState.errors.email.message}
                  </span>
                )}
              </div>

              {/* Senha */}
              <div className="flex flex-col gap-1">
                <Label htmlFor="register-password" className="sr-only">
                  Senha
                </Label>
                <div className="relative flex items-center">
                  <Input
                    id="register-password"
                    type={showRegisterPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="************"
                    aria-invalid={Boolean(registerForm.formState.errors.password)}
                    aria-describedby={registerForm.formState.errors.password ? 'reg-pwd-err' : undefined}
                    {...registerForm.register('password')}
                    className="h-12 w-full rounded-[6px] bg-[#1E1510] border border-[#35281E] pl-4 pr-11 text-sm font-mono text-[#F5F1EB] placeholder:text-[#7D6858] focus-visible:border-[#D28A4C] focus-visible:ring-1 focus-visible:ring-[#D28A4C]/50 outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegisterPassword((v) => !v)}
                    aria-label={showRegisterPassword ? 'Ocultar senha' : 'Exibir senha'}
                    className="absolute right-3.5 text-[#A69282] hover:text-[#D28A4C] transition-colors p-1 cursor-pointer"
                  >
                    {showRegisterPassword ? (
                      <Eye className="w-5 h-5" aria-hidden="true" />
                    ) : (
                      <EyeOff className="w-5 h-5" aria-hidden="true" />
                    )}
                  </button>
                </div>
                {registerForm.formState.errors.password && (
                  <span id="reg-pwd-err" role="alert" className="text-xs text-text-coral font-mono px-1">
                    {registerForm.formState.errors.password.message}
                  </span>
                )}
              </div>

              {/* Confirmar senha */}
              <div className="flex flex-col gap-1">
                <Label htmlFor="register-confirm-password" className="sr-only">
                  Confirmar senha
                </Label>
                <div className="relative flex items-center">
                  <Input
                    id="register-confirm-password"
                    type={showRegisterConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="************"
                    aria-invalid={Boolean(registerForm.formState.errors.confirmPassword)}
                    aria-describedby={registerForm.formState.errors.confirmPassword ? 'reg-conf-err' : undefined}
                    {...registerForm.register('confirmPassword')}
                    className="h-12 w-full rounded-[6px] bg-[#1E1510] border border-[#35281E] pl-4 pr-11 text-sm font-mono text-[#F5F1EB] placeholder:text-[#7D6858] focus-visible:border-[#D28A4C] focus-visible:ring-1 focus-visible:ring-[#D28A4C]/50 outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegisterConfirmPassword((v) => !v)}
                    aria-label={showRegisterConfirmPassword ? 'Ocultar confirmação de senha' : 'Exibir confirmação de senha'}
                    className="absolute right-3.5 text-[#A69282] hover:text-[#D28A4C] transition-colors p-1 cursor-pointer"
                  >
                    {showRegisterConfirmPassword ? (
                      <Eye className="w-5 h-5" aria-hidden="true" />
                    ) : (
                      <EyeOff className="w-5 h-5" aria-hidden="true" />
                    )}
                  </button>
                </div>
                {registerForm.formState.errors.confirmPassword && (
                  <span id="reg-conf-err" role="alert" className="text-xs text-text-coral font-mono px-1">
                    {registerForm.formState.errors.confirmPassword.message}
                  </span>
                )}
              </div>

              {/* Botão Criar conta */}
              <Button
                type="submit"
                disabled={isPending}
                aria-label="Criar perfil de colecionador"
                className="w-full h-12 rounded-[6px] bg-[#D28A4C] hover:bg-[#DE9655] active:bg-[#C47D3F] text-[#140D0A] font-mono font-bold text-base tracking-wide transition-all cursor-pointer shadow-md mt-2 disabled:opacity-50"
              >
                {registerMutation.isPending ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Criando perfil...</span>
                  </span>
                ) : (
                  'Criar conta'
                )}
              </Button>
            </form>
          )}

          {/* Divisor Social: Ou continue com */}
          <div className="flex items-center gap-4 my-6">
            <div className="h-[1px] flex-1 bg-[#2D221A]" />
            <span className="text-xs text-[#A69587] font-mono select-none px-1">
              Ou continue com
            </span>
            <div className="h-[1px] flex-1 bg-[#2D221A]" />
          </div>

          {/* Botões de Login Social */}
          <div className="flex flex-col gap-3">
            {/* Continuar com Google */}
            <button
              type="button"
              onClick={() => setInfoMessage('Autenticação com Google mockada para desenvolvimento.')}
              className="w-full h-12 rounded-[6px] border border-[#35281E] bg-[#1E1510] hover:bg-[#281B13] hover:border-[#4B3627] flex items-center justify-center gap-3 transition-colors cursor-pointer active:scale-[0.99]"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g clipPath="url(#desktop_clip0_81692_758)">
                  <path d="M16.4336 17.6055C14.6992 19.0703 12.4493 20 10 20C6.35547 20 3.15621 17.9922 1.42188 15.0625L2.07117 12.0695L4.94922 11.5352C5.61719 13.6914 7.63278 15.2734 10 15.2734C11.1484 15.2734 12.2148 14.9102 13.0938 14.2656L15.8594 14.6875L16.4336 17.6055Z" fill="#59C36A" />
                  <path d="M16.4336 17.6055L15.8594 14.6875L13.0937 14.2656C12.2148 14.9102 11.1484 15.2734 10 15.2734V20C12.4493 20 14.6992 19.0703 16.4336 17.6055Z" fill="#00A66C" />
                  <path d="M4.72656 10C4.72656 10.539 4.8086 11.0546 4.94922 11.5352L1.42188 15.0625C0.542969 13.5859 0 11.8515 0 10C0 8.1484 0.542969 6.41406 1.42188 4.9375L4.25285 5.42473L4.94922 8.46484C4.8086 8.94527 4.72656 9.4609 4.72656 10Z" fill="#FFDA2D" />
                  <path d="M20 10C20 13.0468 18.5899 15.7773 16.4336 17.6055L13.0938 14.2656C13.7734 13.7734 14.3477 13.1171 14.7227 12.3437H10C9.67184 12.3437 9.41406 12.0859 9.41406 11.7578V8.24219C9.41406 7.91402 9.67184 7.65625 10 7.65625H19.25C19.5312 7.65625 19.7773 7.85543 19.8242 8.13668C19.9414 8.74609 20 9.37887 20 10V10Z" fill="#4086F4" />
                  <path d="M14.7227 12.3437C14.3477 13.1171 13.7734 13.7734 13.0938 14.2656L16.4336 17.6055C18.5899 15.7773 20 13.0469 20 10C20 9.37887 19.9414 8.74609 19.8242 8.13668C19.7773 7.85543 19.5312 7.65625 19.25 7.65625H10V12.3437H14.7227Z" fill="#4175DF" />
                  <path d="M16.5977 2.79293C16.6094 2.95699 16.5391 3.10937 16.4336 3.22652L13.9258 5.72262C13.7266 5.93355 13.3985 5.95699 13.1641 5.78121C12.2382 5.08984 11.1484 4.72656 10 4.72656C7.63278 4.72656 5.61719 6.30855 4.94922 8.46484L1.42188 4.9375C3.15621 2.00781 6.35547 0 10 0C12.332 0 14.6055 0.859375 16.3867 2.35934C16.5156 2.46484 16.5859 2.62887 16.5977 2.79293V2.79293Z" fill="#FF641A" />
                  <path d="M13.1641 5.78121C13.3984 5.95703 13.7265 5.93355 13.9257 5.72262L16.4336 3.22652C16.5391 3.10938 16.6094 2.95703 16.5976 2.79293C16.5859 2.62883 16.5156 2.46484 16.3867 2.35934C14.6055 0.859375 12.332 0 10 0V4.72656C11.1484 4.72656 12.2382 5.08984 13.1641 5.78121Z" fill="#F0805F" />
                </g>
                <defs>
                  <clipPath id="desktop_clip0_81692_758">
                    <rect width="20" height="20" fill="white" />
                  </clipPath>
                </defs>
              </svg>
              <span className="text-sm font-mono font-medium text-[#D8CCC2]">
                Continuar com Google
              </span>
            </button>

            {/* Continuar com Facebook */}
            <button
              type="button"
              onClick={() => setInfoMessage('Autenticação com Facebook mockada para desenvolvimento.')}
              className="w-full h-12 rounded-[6px] border border-[#35281E] bg-[#1E1510] hover:bg-[#281B13] hover:border-[#4B3627] flex items-center justify-center gap-3 transition-colors cursor-pointer active:scale-[0.99]"
            >
              <svg width="10" height="20" viewBox="0 0 10 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8.175 3.32083H10.0008V0.140833C9.68583 0.0975 8.6025 0 7.34083 0C1.56417 0 3.13583 6.54167 2.90583 7.5H0V11.055H2.905V20H6.46667V11.0558H9.25417L9.69667 7.50083H6.46583C6.6225 5.1475 5.83167 3.32083 8.175 3.32083V3.32083Z" fill="#3B5999" />
              </svg>
              <span className="text-sm font-mono font-medium text-[#D8CCC2]">
                Continuar com Facebook
              </span>
            </button>
          </div>
        </div>

        {/* Barra de destaque inferior laranja */}
        <div className="h-3.5 w-full bg-[#D28A4C]" />
      </DialogContent>
    </Dialog>
  );
}
