import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X, User } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AvatarUploadProps {
  currentAvatarUrl?: string;
  userName: string;
  onAvatarChange: (url: string | null) => void;
}

const AvatarUpload = ({ currentAvatarUrl, userName, onAvatarChange }: AvatarUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(currentAvatarUrl);

const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor selecciona una imagen válida');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen debe ser menor a 5MB');
      return;
    }

    setUploading(true);
    console.log('Starting avatar upload process...');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      console.log('User data:', user);
      if (!user) throw new Error('Usuario no autenticado');

      // Get user profile for creating readable slug
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name, username')
        .eq('id', user.id)
        .single();

      // Create readable slug from username or name
      let slug = '';
      if (profile?.username) {
        slug = profile.username.toLowerCase().replace(/[^a-z0-9]/g, '-');
      } else if (profile?.first_name || profile?.last_name) {
        const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
        slug = fullName.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-');
      } else {
        slug = 'usuario';
      }

      // Add short ID to prevent collisions
      const shortId = user.id.substring(0, 8);
      const fileExt = file.name.split('.').pop();
      const fileName = `${slug}-${shortId}/avatar.${fileExt}`;
      console.log('Upload filename:', fileName);

      // Upload to Supabase Storage with upsert to replace existing
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      console.log('Upload result:', { uploadData, uploadError });
      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      console.log('Public URL:', publicUrl);

      // Update user profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      console.log('Profile update error:', updateError);
      if (updateError) throw updateError;

      setPreviewUrl(publicUrl);
      onAvatarChange(publicUrl);
      toast.success('Foto de perfil actualizada exitosamente');

    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Error al subir la imagen');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      // Remove avatar URL from profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setPreviewUrl(null);
      onAvatarChange(null);
      toast.success('Foto de perfil eliminada');

    } catch (error) {
      console.error('Error removing avatar:', error);
      toast.error('Error al eliminar la imagen');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative">
        <Avatar className="h-24 w-24">
          {previewUrl ? (
            <AvatarImage src={previewUrl} alt="Foto de perfil" />
          ) : (
            <AvatarFallback className="text-2xl">
              <User className="h-8 w-8" />
            </AvatarFallback>
          )}
        </Avatar>
        
        {previewUrl && (
          <Button
            variant="destructive"
            size="sm"
            className="absolute -top-2 -right-2 h-8 w-8 rounded-full p-0"
            onClick={handleRemoveAvatar}
            disabled={uploading}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="flex flex-col space-y-2">
        <Label htmlFor="avatar-upload" className="cursor-pointer">
          <Button
            variant="outline"
            size="sm"
            disabled={uploading}
            asChild
          >
            <span>
              <Upload className="h-4 w-4 mr-2" />
              {uploading ? 'Subiendo...' : 'Cambiar foto'}
            </span>
          </Button>
        </Label>
        
        <Input
          id="avatar-upload"
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
          disabled={uploading}
        />
        
        <p className="text-xs text-muted-foreground text-center">
          Máximo 5MB. Formatos: JPG, PNG, GIF
        </p>
      </div>
    </div>
  );
};

export default AvatarUpload;