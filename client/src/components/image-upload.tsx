import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Upload, Image as ImageIcon } from "lucide-react";


interface ImageUploadProps {
  garmentCode: string;
  onImageUploaded?: (imageUrl: string) => void;
}

export default function ImageUpload({ garmentCode, onImageUploaded }: ImageUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch(`/api/garments/${garmentCode}/image`, {
        method: 'POST',
        body: formData,
        // Don't set Content-Type header for FormData - browser will set it automatically
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }));
        throw new Error(errorData.message || 'Error subiendo imagen');
      }

      return response.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: "Imagen subida exitosamente",
        description: "La imagen de la prenda ha sido actualizada.",
      });

      // Invalidate garment query to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/garments', garmentCode] });

      if (onImageUploaded && data.imageUrl) {
        onImageUploaded(data.imageUrl);
      }

      setSelectedFile(null);
    },
    onError: (error: any) => {
      console.error("Upload error:", error);
      toast({
        title: "Error subiendo imagen",
        description: error.message || "No se pudo subir la imagen",
        variant: "destructive",
      });
    }
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Archivo inválido",
          description: "Por favor seleccione un archivo de imagen.",
          variant: "destructive",
        });
        return;
      }

      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Archivo muy grande",
          description: "La imagen no puede superar los 5MB.",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      uploadMutation.mutate(selectedFile);
    }
  };

  return (
    <div className="space-y-6">
      <div 
        className="border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 hover:shadow-lg"
        style={{ 
          borderColor: '#737373',
          backgroundColor: 'rgba(217, 217, 217, 0.1)'
        }}
      >
        <input
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          id={`image-upload-${garmentCode}`}
          data-testid="input-image-file"
        />

        <label 
          htmlFor={`image-upload-${garmentCode}`} 
          className="cursor-pointer block"
        >
          <ImageIcon 
            className="mx-auto mb-4" 
            size={48} 
            style={{ color: '#737373' }}
          />
          <p 
            className="text-sm"
            style={{ color: '#737373' }}
          >
            PNG, JPG, GIF hasta 5MB
          </p>
        </label>
      </div>

      {selectedFile && (
        <Button 
          onClick={handleUpload}
          disabled={uploadMutation.isPending}
          className="w-full py-3 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 border-0"
          style={{ 
            backgroundColor: '#2c234e', 
            color: '#d9d9d9',
          }}
          data-testid="button-upload-image"
        >
          <Upload className="mr-3 h-5 w-5" />
          {uploadMutation.isPending ? "Subiendo..." : "Subir Imagen"}
        </Button>
      )}
    </div>
  );
}