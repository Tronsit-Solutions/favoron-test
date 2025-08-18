import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Plane, Mail, Lock, User, Phone, ArrowLeft, Eye, EyeOff, CreditCard, FileText } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import AvatarUploadPreview from '@/components/auth/AvatarUploadPreview';

const PRODUCTION_ORIGIN = 'https://83029cdd-4a24-4c8c-80e4-b84bf2312db5.lovableproject.com';

const getSafeOrigin = () => {
  try {
    const origin = window.location.origin;
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return PRODUCTION_ORIGIN;
    }
    return origin;
  } catch {
    return PRODUCTION_ORIGIN;
  }
};

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
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [currentTab, setCurrentTab] = useState('signin');
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    console.log('Auth component mounted, location.state:', location.state);
    
    // Check for mode from navigation state
    const mode = location.state?.mode;
    console.log('Navigation mode:', mode);
    if (mode === 'register') {
      console.log('Setting currentTab to signup');
      setCurrentTab('signup');
    }

    // Check if this is a password reset redirect from email link
    // Supabase sends recovery tokens in the URL hash fragment
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get('type');
    
    if (type === 'recovery') {
      console.log('Password recovery detected');
      // This is a password recovery from email link
      setIsResettingPassword(true);
      toast({
        title: "Restablecer contraseña",
        description: "Ingresa tu nueva contraseña para completar el proceso",
        duration: 6000,
      });
    } else {
      // Check if user is already logged in (but with a delay to avoid immediate redirect)
      console.log('Checking for existing session...');
      setTimeout(async () => {
        const { data: { session } } = await supabase.auth.getSession();
        console.log('Existing session check result:', session);
        if (session && !isResettingPassword) {
          console.log('Existing session found, redirecting to home');
          navigate('/');
        } else {
          console.log('No existing session, staying on auth page');
        }
      }, 100);
    }

    // Set up auth state listener for other auth events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state change:', event, 'Session:', !!session);
      if (event === 'PASSWORD_RECOVERY') {
        setIsResettingPassword(true);
        toast({
          title: 'Restablecer contraseña',
          description: 'Ingresa tu nueva contraseña para continuar',
          duration: 6000,
        });
        return;
      }
      if (event === 'SIGNED_IN' && session && !isResettingPassword) {
        console.log('User signed in, redirecting to home');
        // User is signed in and not in password reset flow
        navigate('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, toast, isResettingPassword, location.state]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar que las contraseñas coincidan
    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Las contraseñas no coinciden",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${getSafeOrigin()}/`,
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
      toast({
        title: "Error al crear cuenta",
        description: error.message === "over_email_send_rate_limit" 
          ? "Has enviado demasiados emails. Espera un momento antes de intentar de nuevo."
          : error.message,
        variant: "destructive",
      });
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

    try {
      // Clean up existing state
      cleanupAuthState();
      
      // Attempt global sign out first
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        // Continue even if this fails
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      if (data.user) {
        // Force page reload for clean state
        window.location.href = '/';
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message === "Invalid login credentials" 
          ? "Email o contraseña incorrectos" 
          : error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotPasswordEmail, {
        redirectTo: `${getSafeOrigin()}/auth`,
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
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

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
        window.location.href = '/';
      }, 1000);

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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
          ) : (
          <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Iniciar Sesión</TabsTrigger>
              <TabsTrigger value="signup">Registrarse</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
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
                      type="password"
                      placeholder="Tu contraseña"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                </Button>
                
                <div className="text-center">
                  <Button
                    type="button"
                    variant="link"
                    className="text-sm text-muted-foreground hover:text-primary"
                    onClick={() => setShowForgotPassword(true)}
                  >
                    ¿Olvidaste tu contraseña?
                  </Button>
                </div>
              </form>
              
              {/* Forgot Password Modal */}
              {showForgotPassword && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                  <Card className="w-full max-w-sm">
                    <CardHeader>
                      <CardTitle className="text-lg">Restablecer contraseña</CardTitle>
                      <CardDescription>
                        Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleForgotPassword} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="forgot-email">Email</Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="forgot-email"
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
                            Cancelar
                          </Button>
                          <Button type="submit" className="flex-1" disabled={loading}>
                            {loading ? 'Enviando...' : 'Enviar'}
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                {/* Avatar Upload */}
                <div className="flex justify-center">
                  <AvatarUploadPreview 
                    onFileSelect={setAvatarFile}
                    selectedFile={avatarFile}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
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
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">WhatsApp</Label>
                  <div className="grid grid-cols-5 gap-2">
                    <div className="col-span-2">
                      <Input
                        id="country-code"
                        type="text"
                        placeholder="+502"
                        value={countryCode}
                        onChange={(e) => setCountryCode(e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-span-3 relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="1234 5678"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">Nombre de usuario</Label>
                  <p className="text-xs text-muted-foreground">Este es tu momento para ser creativo</p>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="username"
                      type="text"
                      placeholder="tu_usuario"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="document-type">Tipo de documento</Label>
                  <Select value={documentType} onValueChange={setDocumentType} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona tipo de documento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DPI">DPI</SelectItem>
                      <SelectItem value="pasaporte">Pasaporte</SelectItem>
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
                      placeholder="Número del documento"
                      value={documentNumber}
                      onChange={(e) => setDocumentNumber(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

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
                      type={showPassword ? "text" : "password"}
                      placeholder="Mínimo 6 caracteres"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirmar Contraseña</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirma tu contraseña"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10 pr-10"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
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