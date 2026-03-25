
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Mail, Lock, Phone, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Separator } from "@/components/ui/separator";
import { logAuthError, getEmailDomain } from "@/lib/authErrorLogger";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { APP_URL } from "@/lib/constants";
import { copyToClipboard } from "@/lib/clipboard";
interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'login' | 'register';
  onAuth: (userData: any) => void;
}

const AuthModal = ({ isOpen, onClose, mode: initialMode, onAuth }: AuthModalProps) => {
  const { toast } = useToast();
  const [mode, setMode] = useState(initialMode);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    idNumber: '',
    email: '',
    password: '',
    phone: '',
    confirmPassword: ''
  });
  
  const [authError, setAuthError] = useState<{ title: string; message: string; details: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    
    if (mode === 'register') {
      if (formData.password.length < 6) {
        toast({
          title: "Error",
          description: "La contraseña debe tener al menos 6 caracteres",
          variant: "destructive"
        });
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        toast({
          title: "Error",
          description: "Las contraseñas no coinciden",
          variant: "destructive"
        });
        return;
      }
      
      if (!formData.firstName || !formData.lastName || !formData.idNumber || !formData.phone) {
        toast({
          title: "Error",
          description: "Todos los campos son obligatorios",
          variant: "destructive"
        });
        return;
      }
    }

    try {
      if (mode === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) throw error;

        onClose();
        toast({
          title: "¡Bienvenido!",
          description: "Has iniciado sesión correctamente"
        });
      } else {
        const redirectUrl = `${APP_URL}/`;
        
        // Validate WhatsApp before registration
        if (mode === 'register') {
          const { validateWhatsAppNumber } = await import('@/lib/validators');
          const phoneValidation = validateWhatsAppNumber(formData.phone);
          
          if (!phoneValidation.isValid) {
            throw new Error(`WhatsApp inválido: ${phoneValidation.error}`);
          }
        }
        
        // Extract country code from phone number
        const phoneDigits = formData.phone.replace(/[\s\-\(\)]/g, '');
        let countryCode = '+502'; // Default Guatemala
        let localPhone = phoneDigits;
        if (phoneDigits.startsWith('+')) {
          // Try common country codes
          if (phoneDigits.startsWith('+502')) {
            countryCode = '+502';
            localPhone = phoneDigits.slice(4);
          } else if (phoneDigits.startsWith('+1')) {
            countryCode = '+1';
            localPhone = phoneDigits.slice(2);
          } else if (phoneDigits.startsWith('+52')) {
            countryCode = '+52';
            localPhone = phoneDigits.slice(3);
          } else {
            // Generic: take first 2-4 digits as country code
            countryCode = phoneDigits.slice(0, 4);
            localPhone = phoneDigits.slice(4);
          }
        }
        
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              first_name: formData.firstName,
              last_name: formData.lastName,
              phone_number: localPhone,
              country_code: countryCode,
              document_number: formData.idNumber,
              document_type: 'dpi',
              username: `${formData.firstName.toLowerCase()}_${formData.lastName.toLowerCase()}`
            }
          }
        });

        if (error) throw error;

        onClose();
        toast({
          title: "¡Cuenta creada!",
          description: "Revisa tu email para confirmar tu cuenta"
        });
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      const details = JSON.stringify(
        { name: error?.name, message: error?.message, status: error?.status, code: error?.code },
        null,
        2
      );
      setAuthError({
        title: mode === 'login' ? 'Error al iniciar sesión' : 'Error al registrarse',
        message: error?.message || 'Error en la autenticación',
        details,
      });
      
      // Log auth error
      logAuthError(
        mode === 'login' ? 'auth_signin' : 'auth_signup',
        `${mode === 'login' ? 'Signin' : 'Signup'} failed in modal: ${error.message}`,
        'error',
        {
          emailDomain: getEmailDomain(formData.email),
          supabaseErrorCode: error.name || error.code,
          supabaseErrorMsg: error.message,
          redirectUrl: APP_URL
        }
      );

      toast({
        title: 'Error',
        description: error.message?.toLowerCase().includes('password should be at least')
          ? "La contraseña debe tener al menos 8 caracteres e incluir: una letra minúscula, una letra mayúscula, un número y un carácter especial (!@#$%^&*)"
          : error.message || 'Error en la autenticación',
        variant: 'destructive'
      });
    }

    setFormData({ firstName: '', lastName: '', idNumber: '', email: '', password: '', phone: '', confirmPassword: '' });
  };

  const handleGoogleSignIn = async () => {
    try {
      const isNative = typeof window !== 'undefined' && 
        'Capacitor' in window && 
        (window as any).Capacitor?.isNativePlatform?.();
      
      const redirectUrl = isNative ? 'favoron://auth/callback' : `${APP_URL}/`;
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl
        }
      });

      if (error) throw error;

      // Don't close modal here - user will be redirected
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
        `Google OAuth failed in modal: ${error.message}`,
        'error',
        {
          provider: 'google',
          supabaseErrorCode: error.name || error.code,
          supabaseErrorMsg: error.message,
          redirectUrl: APP_URL
        }
      );

      toast({
        title: "Error",
        description: "Error al iniciar sesión con Google",
        variant: "destructive"
      });
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCopyDetails = async () => {
    if (authError?.details) {
      const success = await copyToClipboard(authError.details);
      if (success) {
        toast({ title: 'Copiado', description: 'Detalles copiados al portapapeles' });
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold text-primary">
            {mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
          </DialogTitle>
          <DialogDescription className="text-center">
            {mode === 'login' 
              ? 'Ingresa a tu cuenta de Favorón' 
              : 'Únete a la comunidad de Favorón'
            }
          </DialogDescription>
        </DialogHeader>

        {authError && (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>{authError.title}</AlertTitle>
            <AlertDescription className="whitespace-pre-wrap">{authError.message}</AlertDescription>
            <div className="mt-2 flex justify-end">
              <Button type="button" variant="outline" size="sm" onClick={handleCopyDetails}>
                Copiar detalles
              </Button>
            </div>
          </Alert>
        )}

        {/* Google Sign In Button */}
        <Button 
          type="button" 
          variant="outline" 
          className="w-full" 
          size="lg"
          onClick={handleGoogleSignIn}
        >
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continuar con Google
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">O continúa con email</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Nombre *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="firstName"
                      type="text"
                      placeholder="Tu nombre"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="lastName">Apellido *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="lastName"
                      type="text"
                      placeholder="Tu apellido"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="idNumber">Documento de identidad *</Label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="idNumber"
                    type="text"
                    placeholder="Número de identificación"
                    value={formData.idNumber}
                    onChange={(e) => handleInputChange('idNumber', e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Correo electrónico *</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          {mode === 'register' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="phone">WhatsApp (con código de país) *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+502 1234 5678"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  ⚠️ Obligatorio: Necesitas WhatsApp para usar solicitar paquetes y registrar viajes
                </p>
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="password">Contraseña *</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="Tu contraseña"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          {mode === 'register' && (
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar contraseña *</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirma tu contraseña"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
          )}

          <Button type="submit" className="w-full" size="lg">
            {mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
          </Button>
        </form>

        <div className="text-center text-sm text-muted-foreground">
          {mode === 'login' ? (
            <p>
              ¿No tienes cuenta?{' '}
              <button 
                type="button" 
                className="text-primary hover:underline font-medium"
                onClick={() => setMode('register')}
              >
                Regístrate aquí
              </button>
            </p>
          ) : (
            <p>
              ¿Ya tienes cuenta?{' '}
              <button 
                type="button" 
                className="text-primary hover:underline font-medium"
                onClick={() => setMode('login')}
              >
                Inicia sesión
              </button>
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;
