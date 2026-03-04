import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { registerReferral } from '@/hooks/useReferrals';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Plane, Mail, Lock, User, Phone, ArrowLeft, Eye, EyeOff, CreditCard, FileText } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Separator } from '@/components/ui/separator';
import AvatarUploadPreview from '@/components/auth/AvatarUploadPreview';
import { supabaseWithRetry } from '@/lib/supabaseWithRetry';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { logAuthError, getEmailDomain, detectAuthErrorFromUrl } from '@/lib/authErrorLogger';
import { APP_URL } from '@/lib/constants';
import { MetaPixel } from '@/lib/metaPixel';


const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [countryCode, setCountryCode] = useState('+502');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [username, setUsername] = useState('');
  const [documentType, setDocumentType] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [recoveryRequested, setRecoveryRequested] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [currentTab, setCurrentTab] = useState('signin');
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const networkStatus = useNetworkStatus();
  const [authError, setAuthError] = useState<{ title: string; message: string; details: string } | null>(null);

  useEffect(() => {
    // Capture referral code from URL
    const searchParams = new URLSearchParams(window.location.search);
    const refCode = searchParams.get('ref');
    if (refCode) {
      localStorage.setItem('pending_referral_code', refCode);
      console.log('📎 Referral code captured:', refCode);
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      console.log('🔐 Auth component mounted, location.state:', location.state);
      
      // Check for OAuth errors in URL
      detectAuthErrorFromUrl();
      
      // Check for mode from navigation state or URL query param
      const urlMode = location.state?.mode || new URLSearchParams(window.location.search).get('mode');
      console.log('Navigation mode:', urlMode);
      if (urlMode === 'register') {
        console.log('Setting currentTab to signup');
        setCurrentTab('signup');
      }

      // Check if password recovery was previously active (from localStorage)
      const recoveryActive = localStorage.getItem('password_recovery_active');
      if (recoveryActive === 'true') {
        console.log('🔄 Recovering password reset state from localStorage');
        setIsResettingPassword(true);
      }

      // Check if this is a password reset redirect from email link
      // Supabase sends recovery tokens in both hash fragment and query params
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const searchParams = new URLSearchParams(window.location.search);
      const type = hashParams.get('type') || searchParams.get('type');
      const accessToken = hashParams.get('access_token') || searchParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token') || searchParams.get('refresh_token');
      const modeParam = searchParams.get('mode');
      
      console.log('🔍 Auth URL params:', { 
        type, 
        mode: modeParam,
        accessToken: accessToken ? '✅ present' : '❌ missing',
        refreshToken: refreshToken ? '✅ present' : '❌ missing'
      });
      
      // Detect recovery intent from either type=recovery or mode=recovery
      const isRecoveryIntent = type === 'recovery' || modeParam === 'recovery';
      
      if (isRecoveryIntent) {
        console.log('🔐 Recovery intent detected');
        setRecoveryRequested(true);
        
        if (accessToken && refreshToken) {
          console.log('✅ Valid password recovery tokens found');
          
          try {
            // Establish the session with the recovery tokens BEFORE cleaning URL
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            });
            
            if (error) throw error;
            
            console.log('✅ Recovery session established successfully');
            localStorage.setItem('password_recovery_active', 'true');
            setIsResettingPassword(true);
            
            // NOW we can clean the URL
            window.history.replaceState({}, document.title, window.location.pathname);
            
            toast({
              title: "Restablecer contraseña",
              description: "Ingresa tu nueva contraseña para completar el proceso",
              duration: 6000,
            });
            
            // IMPORTANT: Exit early to prevent session check that would redirect away
            return;
          } catch (error: any) {
            console.error('❌ Failed to establish recovery session:', error);
            setRecoveryRequested(true);
            setIsResettingPassword(false);
            
            toast({
              title: "Error de sesión",
              description: "El enlace es inválido o ha expirado.",
              variant: "destructive",
            });
            
            // Clean the URL but keep recovery state
            window.history.replaceState({}, document.title, window.location.pathname);
            return;
          }
        } else {
          console.error('❌ Recovery intent but missing tokens');
          setRecoveryRequested(true);
          setIsResettingPassword(false);
          
          toast({
            title: "Enlace inválido o expirado",
            description: "Por favor solicita un nuevo enlace de recuperación",
            variant: "destructive",
          });
          
          // Clean the URL but keep recovery state
          window.history.replaceState({}, document.title, window.location.pathname);
          return;
        }
      }
      
      // Only check for existing session if NOT in recovery mode
      console.log('Checking for existing session...');
      supabase.auth.getSession().then(({ data: { session } }) => {
        console.log('Existing session check result:', session);
        if (session && !isResettingPassword) {
          const from = (location.state as any)?.from;
          console.log('Existing session found. From state:', from);
          if (from?.pathname) {
            const target = `${from.pathname}${from.search || ''}${from.hash || ''}`;
            console.log('Redirecting back to previous location:', target);
            navigate(target, { replace: true });
          } else {
            console.log('No previous location. Redirecting to /dashboard');
            navigate('/dashboard', { replace: true });
          }
        } else {
          console.log('No existing session, staying on auth page');
        }
      });

      // Set up auth state listener for other auth events
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        console.log('🔐 Auth state change:', event, 'Session:', !!session);
        
        if (event === 'PASSWORD_RECOVERY') {
          console.log('✅ PASSWORD_RECOVERY event detected');
          localStorage.setItem('password_recovery_active', 'true');
          setIsResettingPassword(true);
          toast({
            title: 'Restablecer contraseña',
            description: 'Ingresa tu nueva contraseña para continuar',
            duration: 6000,
          });
          return;
        }
        
        if (event === 'SIGNED_IN' && session) {
          // Clean recovery flag after successful login
          localStorage.removeItem('password_recovery_active');
          
          if (!isResettingPassword) {
            // Always redirect to production dashboard after successful login
            window.location.href = `${APP_URL}/dashboard`;
          }
        }
      });

      return () => subscription.unsubscribe();
    };

    initAuth();
  }, [navigate, toast, isResettingPassword, location.state]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    
    // Validar que las contraseñas coincidan
    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Las contraseñas no coinciden",
        variant: "destructive",
      });
      return;
    }

    // Check network status
    if (!networkStatus.isOnline) {
      setAuthError({
        title: 'Error de conexión',
        message: 'No hay conexión a internet. Verifica tu conexión y vuelve a intentar.',
        details: 'Network offline'
      });
      return;
    }
    
    setLoading(true);

    try {
      const { data, error } = await supabaseWithRetry.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${APP_URL}/`,
          data: {
            first_name: firstName,
            last_name: lastName,
            country_code: countryCode,
            phone_number: phoneNumber,
            username: username,
            document_type: documentType,
            document_number: documentNumber,
          }
        }
      });

      if (error) throw error;

      // Si hay un avatar seleccionado, subirlo después del registro
      if (avatarFile && data?.user) {
        try {
          const fileExt = avatarFile.name.split('.').pop();
          const fileName = `${data.user.id}/${data.user.id}-${Date.now()}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(fileName, avatarFile);
            
          if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage
              .from('avatars')
              .getPublicUrl(fileName);
              
            // Actualizar el perfil con la URL del avatar
            await supabase
              .from('profiles')
              .update({ avatar_url: publicUrl })
              .eq('id', data.user.id);
          }
        } catch (avatarError) {
          console.error('Error uploading avatar:', avatarError);
          // No mostrar error al usuario, el avatar es opcional
        }
      }

      toast({
        title: "¡Cuenta creada exitosamente! ✅",
        description: "Ya puedes iniciar sesión con tu cuenta.",
        duration: 4000,
      });

      // Track registration in Meta Pixel
      MetaPixel.trackCompleteRegistration(data?.user?.id);

      // Register referral if pending
      if (data?.user?.id) {
        const pendingRefCode = localStorage.getItem('pending_referral_code');
        if (pendingRefCode) {
          await registerReferral(data.user.id, pendingRefCode);
          localStorage.removeItem('pending_referral_code');
        }
      }

      // Cambiar a pestaña de iniciar sesión después de 1 segundo
      setTimeout(() => {
        setCurrentTab('signin');
      }, 1000);

      // Limpiar formulario
      setFirstName('');
      setLastName('');
      setPhoneNumber('');
      setUsername('');
      setDocumentType('');
      setDocumentNumber('');
      setPassword('');
      setConfirmPassword('');
      setAvatarFile(null);
      
    } catch (error: any) {
      const details = JSON.stringify(
        { name: error?.name, message: error?.message, status: error?.status, code: error?.code },
        null,
        2
      );
      setAuthError({ title: 'Error al crear cuenta', message: error?.message, details });
      // Log signup error
      logAuthError(
        'auth_signup',
        `Signup failed: ${error.message}`,
        'error',
        {
          emailDomain: getEmailDomain(email),
          supabaseErrorCode: error.name || error.code,
          supabaseErrorMsg: error.message,
          redirectUrl: 'https://favoron.app'
        }
      );

      // Provide better error messages based on error type
      if (error.message?.toLowerCase().includes('load failed') || 
          error.message?.toLowerCase().includes('failed to fetch')) {
        setAuthError({
          title: 'Error de conexión',
          message: 'Error de conexión. Verifica tu internet y vuelve a intentar.',
          details: error.message
        });
      } else {
        toast({
          title: "Error al crear cuenta",
          description: error.message === "over_email_send_rate_limit" 
            ? "Has enviado demasiados emails. Espera un momento antes de intentar de nuevo."
            : error.message?.toLowerCase().includes('password should be at least')
            ? "La contraseña debe tener al menos 8 caracteres e incluir: una letra minúscula, una letra mayúscula, un número y un carácter especial (!@#$%^&*)"
            : error.message,
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const cleanupAuthState = () => {
    // Remove standard auth tokens
    try { localStorage.removeItem('supabase.auth.token'); } catch {}
    // Remove all Supabase auth keys from localStorage
    try {
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
          localStorage.removeItem(key);
        }
      });
    } catch {}
    // Remove from sessionStorage as well
    try {
      Object.keys(sessionStorage).forEach((key) => {
        if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
          sessionStorage.removeItem(key);
        }
      });
    } catch {}
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Check network status
    if (!networkStatus.isOnline) {
      setAuthError({
        title: 'Error de conexión',
        message: 'No hay conexión a internet. Verifica tu conexión y vuelve a intentar.',
        details: 'Network offline'
      });
      setLoading(false);
      return;
    }

    try {
      // Direct sign in - skipping pre-cleanup and global sign-out for speed
      const { data, error } = await supabaseWithRetry.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      if (data.user) {
        // Always redirect to production dashboard
        window.location.href = `${APP_URL}/dashboard`;
      }
    } catch (error: any) {
      // Log signin error
      logAuthError(
        'auth_signin',
        `Signin failed: ${error.message}`,
        'error',
        {
          emailDomain: getEmailDomain(email),
          supabaseErrorCode: error.name || error.code,
          supabaseErrorMsg: error.message
        }
      );

      // Provide better error messages based on error type
      if (error.message?.toLowerCase().includes('load failed') || 
          error.message?.toLowerCase().includes('failed to fetch')) {
        setAuthError({
          title: 'Error de conexión',
          message: 'Error de conexión. Verifica tu internet y vuelve a intentar.',
          details: error.message
        });
      } else {
        toast({
          title: "Error",
          description: error.message === "Invalid login credentials" 
            ? "Email o contraseña incorrectos" 
            : error.message,
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotPasswordEmail, {
        redirectTo: `${APP_URL}/auth?mode=recovery`,
      });

      if (error) throw error;

      toast({
        title: "Email enviado ✅",
        description: "Revisa tu correo para restablecer tu contraseña",
        duration: 5000,
      });

      setShowForgotPassword(false);
      setForgotPasswordEmail('');
    } catch (error: any) {
      toast({
        title: 'Error',
        description:
          error.message === 'User not found'
            ? 'No encontramos una cuenta con ese email'
            : error.message === 'over_email_send_rate_limit'
            ? 'Has enviado demasiados emails. Espera un momento antes de intentar de nuevo.'
            : (typeof error.message === 'string' && error.message.toLowerCase().includes('failed to fetch'))
            ? 'No se pudo conectar. Si el enlace apunta a localhost, solicita la recuperación desde el sitio en producción.'
            : error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "Las contraseñas no coinciden",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Error",
        description: "La contraseña debe tener al menos 6 caracteres",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Verify we have an active session first
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No hay una sesión activa. Por favor solicita un nuevo enlace de recuperación.');
      }
      
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      // ✅ Clean recovery flag after successful password update
      localStorage.removeItem('password_recovery_active');

      toast({
        title: "Contraseña actualizada ✅",
        description: "Tu contraseña ha sido restablecida exitosamente",
        duration: 5000,
      });

      // Reset state and redirect to home
      setIsResettingPassword(false);
      setNewPassword('');
      setConfirmPassword('');
      
      // Redirect after successful password reset
      setTimeout(() => {
        navigate('/');
      }, 1000);

    } catch (error: any) {
      console.error('❌ Password update failed:', error);
      
      let errorMessage = error.message;
      
      if (error.message?.includes('session') || error.message?.includes('Auth session missing')) {
        errorMessage = 'Tu sesión de recuperación ha expirado. Por favor solicita un nuevo enlace.';
      }
      
      toast({
        title: "Error al actualizar contraseña",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${APP_URL}/dashboard`
        }
      });

      if (error) throw error;

      // Don't show success message here - user will be redirected
    } catch (error: any) {
      console.error('Google auth error:', error);
      const details = JSON.stringify(
        { name: error?.name, message: error?.message, status: error?.status, code: error?.code },
        null,
        2
      );
      setAuthError({ title: 'Error con Google', message: 'Error al iniciar sesión con Google', details });
      
      // Log OAuth error
      logAuthError(
        'auth_oauth',
        `Google OAuth failed: ${error.message}`,
        'error',
        {
          provider: 'google',
          supabaseErrorCode: error.name || error.code,
          supabaseErrorMsg: error.message,
          redirectUrl: 'https://favoron.app'
        }
      );

      toast({
        title: "Error",
        description: "Error al iniciar sesión con Google",
        variant: "destructive"
      });
    }
  };

  const handleAvatarUpload = (file: File | null) => {
    setAvatarFile(file);
  };

  // Render invalid recovery link screen
  if (recoveryRequested && !isResettingPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-destructive/10">
                <Lock className="h-8 w-8 text-destructive" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">Enlace inválido o expirado</CardTitle>
            <CardDescription>
              El enlace de recuperación que usaste ya no es válido. Por favor solicita uno nuevo.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={() => {
                setRecoveryRequested(false);
                setShowForgotPassword(true);
              }}
              className="w-full"
            >
              Solicitar nuevo enlace
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                setRecoveryRequested(false);
                setShowForgotPassword(false);
              }}
              className="w-full"
            >
              Volver al inicio de sesión
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Button>
            <img 
              src="/lovable-uploads/b4ea91c2-1974-4a3d-b9b6-c538aa52daa7.png" 
              alt="Favorón Logo" 
              className="h-10 w-auto"
            />
            <div className="w-16"></div> {/* Spacer for centering */}
          </div>
          <CardTitle>Bienvenido</CardTitle>
          <CardDescription>
            Inicia sesión o crea tu cuenta para comenzar
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Network status alert */}
          {!networkStatus.isOnline && (
            <Alert className="mb-4" variant="destructive">
              <AlertTitle>Sin conexión</AlertTitle>
              <AlertDescription>
                No hay conexión a internet. Verifica tu conexión para continuar.
              </AlertDescription>
            </Alert>
          )}

          {/* Auth error alert */}
          {authError && (
            <Alert className="mb-4" variant="destructive">
              <AlertTitle>{authError.title}</AlertTitle>
              <AlertDescription>{authError.message}</AlertDescription>
            </Alert>
          )}

          {/* Password Reset Form */}
          {isResettingPassword ? (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-foreground">Restablecer contraseña</h3>
                <p className="text-sm text-muted-foreground">Ingresa tu nueva contraseña</p>
              </div>
              
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">Nueva contraseña</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="new-password"
                      type="password"
                      placeholder="Mínimo 6 caracteres"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="pl-10"
                      required
                      minLength={6}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirmar contraseña</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="Confirma tu contraseña"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10"
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setIsResettingPassword(false);
                      setNewPassword('');
                      setConfirmPassword('');
                    }}
                    disabled={loading}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" className="flex-1" disabled={loading}>
                    {loading ? 'Actualizando...' : 'Actualizar contraseña'}
                  </Button>
                </div>
              </form>
            </div>
          ) : showForgotPassword ? (
            /* Forgot Password Form */
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-foreground">¿Olvidaste tu contraseña?</h3>
                <p className="text-sm text-muted-foreground">
                  Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña
                </p>
              </div>
              
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="forgot-password-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="forgot-password-email"
                      type="email"
                      placeholder="tu@email.com"
                      value={forgotPasswordEmail}
                      onChange={(e) => setForgotPasswordEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setShowForgotPassword(false);
                      setForgotPasswordEmail('');
                    }}
                    disabled={loading}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Volver
                  </Button>
                  <Button type="submit" className="flex-1" disabled={loading || !networkStatus.isOnline}>
                    {loading ? 'Enviando...' : 'Enviar enlace'}
                  </Button>
                </div>
              </form>
            </div>
          ) : (
          <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Iniciar Sesión</TabsTrigger>
              <TabsTrigger value="signup">Registrarse</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              {/* Google Sign In Button */}
              <Button 
                type="button" 
                variant="outline" 
                className="w-full mb-4" 
                size="lg"
                onClick={handleGoogleSignIn}
                disabled={!networkStatus.isOnline}
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continuar con Google
              </Button>

              <div className="relative mb-4">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">O continúa con email</span>
                </div>
              </div>

              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="tu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Contraseña</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signin-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Tu contraseña"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={loading || !networkStatus.isOnline}>
                  {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
                </Button>
                
                <div className="text-center">
                  <button
                    type="button"
                    className="text-sm text-muted-foreground hover:text-foreground"
                    onClick={() => setShowForgotPassword(true)}
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              {/* Google Sign In Button */}
              <Button 
                type="button" 
                variant="outline" 
                className="w-full mb-4" 
                size="lg"
                onClick={handleGoogleSignIn}
                disabled={!networkStatus.isOnline}
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continuar con Google
              </Button>

              <div className="relative mb-4">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">O continúa con email</span>
                </div>
              </div>

              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="tu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password">Contraseña</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-password"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Tu contraseña"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirmar contraseña</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="Confirma tu contraseña"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10"
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="first-name">Nombre</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="first-name"
                      type="text"
                      placeholder="Tu nombre"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="last-name">Apellido</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="last-name"
                      type="text"
                      placeholder="Tu apellido"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone-number">Número de teléfono</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <Input
                      placeholder="+502"
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="text-center"
                    />
                    <Input
                      type="number"
                      placeholder="12345678"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="col-span-2"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">Nombre de usuario</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="username"
                      type="text"
                      placeholder="Tu nombre de usuario"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="document-type">Tipo de documento</Label>
                  <Select onValueChange={setDocumentType}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="DPI" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DPI">DPI (Guatemala)</SelectItem>
                      {/* Add more document types as needed */}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="document-number">Número de documento</Label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="document-number"
                      type="text"
                      placeholder="Tu número de documento"
                      value={documentNumber}
                      onChange={(e) => setDocumentNumber(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Avatar (Opcional)</Label>
                  <AvatarUploadPreview 
                    selectedFile={avatarFile}
                    onFileSelect={handleAvatarUpload} 
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading || !networkStatus.isOnline}>
                  {loading ? "Creando cuenta..." : "Crear Cuenta"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
