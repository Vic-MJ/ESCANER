import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CloudUpload, FileSpreadsheet, CheckCircle, AlertTriangle, XCircle, Lock } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface UploadStats {
  total: number;
  successful: number;
  errors: number;
  warnings: number;
}

export default function ExcelUpload() {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStats, setUploadStats] = useState<UploadStats | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [password, setPassword] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('password', password);

      const response = await apiRequest('POST', '/api/garments/upload', formData);
      return response.json();
    },
    onSuccess: (data) => {
      setUploadStats(data.stats);
      toast({
        title: "Archivo procesado exitosamente",
        description: `${data.stats.successful} registros cargados correctamente.`,
      });
    },
    onError: (error) => {
      console.error('Upload error:', error);
      toast({
        title: "Error al procesar archivo",
        description: "Hubo un problema al procesar el archivo Excel.",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (file: File) => {
    if (!file.name.match(/\.(xlsx|xls)$/)) {
      toast({
        title: "Formato de archivo inválido",
        description: "Por favor seleccione un archivo Excel (.xlsx o .xls).",
        variant: "destructive",
      });
      return;
    }

    if (!password.trim()) {
      toast({
        title: "Contraseña requerida",
        description: "Por favor ingrese la contraseña antes de subir el archivo.",
        variant: "destructive",
      });
      return;
    }

    setUploadProgress(0);
    setUploadStats(null);

    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);

    uploadMutation.mutate(file, {
      onSettled: () => {
        clearInterval(progressInterval);
        setUploadProgress(100);
      }
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const requiredColumns = [
    'CÓDIGO', 'ÁREA', 'DAMA / CAB', 'PRENDA',
    'MODELO', 'TELA', 'COLOR', 'TALLA', 'FICHA DE BORDADO'
  ];

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #2c234e 0%, #231c3e 100%)' }}>
      <div className="container mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4" style={{ color: '#d9d9d9' }}>
            Cargar Datos desde Excel
          </h2>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: '#737373' }}>
            Importe los datos de prendas desde un archivo Excel con las columnas requeridas.
          </p>
        </div>

        <Card className="max-w-5xl mx-auto shadow-2xl border-0" style={{ backgroundColor: '#d9d9d9' }}>
          <CardContent className="p-10">
            {/* File Upload Area */}
            <div 
              className={`border-2 border-dashed rounded-2xl p-16 text-center mb-8 transition-all duration-300 cursor-pointer ${
                isDragging 
                  ? 'scale-105 shadow-lg'
                  : 'hover:scale-102 hover:shadow-md'
              }`}
              style={{ 
                borderColor: isDragging ? '#2c234e' : '#737373',
                backgroundColor: isDragging ? 'rgba(44, 35, 78, 0.1)' : 'transparent'
              }}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              data-testid="upload-area"
            >
              <CloudUpload 
                className="mx-auto mb-6" 
                size={64} 
                style={{ color: '#737373' }}
              />
              <p className="text-2xl font-semibold mb-3" style={{ color: '#2c234e' }}>
                Arrastre su archivo Excel aquí
              </p>
              <p className="text-lg mb-6" style={{ color: '#737373' }}>
                o haga clic para seleccionar
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={handleFileInputChange}
                data-testid="input-file-excel"
              />
              <Button 
                className="px-8 py-3 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 border-0"
                style={{ 
                  backgroundColor: '#2c234e', 
                  color: '#d9d9d9',
                }}
              >
                <FileSpreadsheet className="mr-3 h-5 w-5" />
                Seleccionar Archivo
              </Button>
            </div>

            {/* Password Input */}
            <div className="mb-8">
              <Label 
                htmlFor="password" 
                className="text-lg font-semibold mb-3 flex items-center"
                style={{ color: '#2c234e' }}
              >
                <Lock className="mr-2 h-5 w-5" />
                Contraseña de Seguridad
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingrese la contraseña"
                className="mt-3 p-4 text-lg border-2 rounded-lg"
                style={{ 
                  borderColor: '#737373',
                  backgroundColor: 'white',
                  color: '#2c234e'
                }}
              />
            </div>

            {/* Required Columns Information */}
            <div 
              className="rounded-xl p-8 mb-8 border-2"
              style={{ 
                backgroundColor: 'rgba(44, 35, 78, 0.1)', 
                borderColor: '#2c234e'
              }}
            >
              <h3 className="text-xl font-bold mb-6 flex items-center" style={{ color: '#2c234e' }}>
                <CheckCircle className="mr-3 h-6 w-6" />
                Columnas Requeridas
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {requiredColumns.map((column, index) => (
                  <div key={index} className="flex items-center p-3 rounded-lg" style={{ backgroundColor: 'white' }}>
                    <CheckCircle className="mr-3 h-4 w-4" style={{ color: '#2c234e' }} />
                    <span className="font-medium" style={{ color: '#2c234e' }}>{column}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Upload Progress */}
            {(uploadMutation.isPending || uploadProgress > 0) && (
              <div className="mb-8" data-testid="upload-progress">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-semibold" style={{ color: '#2c234e' }}>
                    {uploadMutation.isPending ? 'Procesando archivo...' : 'Completado'}
                  </span>
                  <span className="text-lg font-bold" style={{ color: '#2c234e' }}>{uploadProgress}%</span>
                </div>
                <Progress 
                  value={uploadProgress} 
                  className="w-full h-3 rounded-full"
                />
              </div>
            )}

            {/* Upload Results */}
            {uploadStats && (
              <div className="grid md:grid-cols-3 gap-8" data-testid="upload-results">
                <div 
                  className="rounded-xl p-6 text-center shadow-lg border-2"
                  style={{ backgroundColor: 'white', borderColor: '#2c234e' }}
                >
                  <CheckCircle className="mx-auto mb-4" size={48} style={{ color: '#2c234e' }} />
                  <div className="text-3xl font-bold mb-2" style={{ color: '#2c234e' }} data-testid="stat-successful">
                    {uploadStats.successful}
                  </div>
                  <div className="text-lg font-medium" style={{ color: '#737373' }}>Registros Cargados</div>
                </div>
                <div 
                  className="rounded-xl p-6 text-center shadow-lg border-2"
                  style={{ backgroundColor: 'white', borderColor: '#737373' }}
                >
                  <AlertTriangle className="mx-auto mb-4" size={48} style={{ color: '#737373' }} />
                  <div className="text-3xl font-bold mb-2" style={{ color: '#737373' }} data-testid="stat-warnings">
                    {uploadStats.warnings}
                  </div>
                  <div className="text-lg font-medium" style={{ color: '#737373' }}>Advertencias</div>
                </div>
                <div 
                  className="rounded-xl p-6 text-center shadow-lg border-2"
                  style={{ backgroundColor: 'white', borderColor: '#737373' }}
                >
                  <XCircle className="mx-auto mb-4" size={48} style={{ color: '#737373' }} />
                  <div className="text-3xl font-bold mb-2" style={{ color: '#737373' }} data-testid="stat-errors">
                    {uploadStats.errors}
                  </div>
                  <div className="text-lg font-medium" style={{ color: '#737373' }}>Errores</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}