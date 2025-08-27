import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { Garment } from "@shared/schema";

interface BarcodeScannerProps {
  onGarmentFound: (garment: Garment) => void;
}

export default function BarcodeScanner({ onGarmentFound }: BarcodeScannerProps) {
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [barcodeBuffer, setBarcodeBuffer] = useState<string>("");
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const { data: garment, error } = useQuery({
    queryKey: ['/api/garments', scannedCode],
    enabled: !!scannedCode,
  });



  useEffect(() => {
    if (garment && scannedCode) {
      onGarmentFound(garment);
      setScannedCode(null);
      setBarcodeBuffer("");
    }
  }, [garment, scannedCode, onGarmentFound]);

  useEffect(() => {
    if (error) {
      toast({
        title: "Prenda no encontrada",
        description: "El código escaneado no se encuentra en la base de datos.",
        variant: "destructive",
      });
      setScannedCode(null);
      setBarcodeBuffer("");
    }
  }, [error, toast]);

  // Handle keyboard input from barcode scanner with ref for current buffer
  const bufferRef = useRef<string>("");
  
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      
      // Don't prevent Enter - let it work normally  
      if (event.key !== 'Enter') {
        event.preventDefault();
      }
      
      if (event.key === 'Enter') {
        // Enter key indicates end of barcode scan
        if (bufferRef.current.trim()) {
          console.log("Scanned barcode (Enter):", bufferRef.current.trim());
          setScannedCode(bufferRef.current.trim());
          setBarcodeBuffer("");
          bufferRef.current = "";
        }
      } else if (event.key.length === 1 && /[a-zA-Z0-9]/.test(event.key)) {
        // Only alphanumeric characters
        bufferRef.current += event.key;
        setBarcodeBuffer(bufferRef.current);
        console.log("Building barcode:", bufferRef.current);
        
        // Clear any existing timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        
        // Auto-complete after 100ms of no input
        timeoutRef.current = setTimeout(() => {
          if (bufferRef.current.length >= 1) {
            console.log("Auto-completing barcode scan:", bufferRef.current.trim());
            setScannedCode(bufferRef.current.trim());
            setBarcodeBuffer("");
            bufferRef.current = "";
          }
        }, 100);
      }
    };
    
    // Always listen for scanner input
    bufferRef.current = "";
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-secondary mb-4">Escáner de Códigos de Barras</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Escanee el código de barras de la prenda para obtener información detallada instantáneamente.
        </p>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-8">
          <div className="scanner-container bg-gray-900 rounded-lg p-8 mb-6 min-h-64 flex items-center justify-center">
            <div className="text-center">
              <div className="relative">
                <div className="w-78 h-48 border-4 border-green-400 rounded-lg flex items-center justify-center mb-4 animate-pulse">
                  <div className="text-center">
                    <div className="text-green-400 text-6xl mb-4" ><img src="../../public/icon.png" alt="Mi imagen" className="w-20 h-20 mx-auto" /></div>
                    <div className="text-green-400 font-bold text-lg">ESCÁNER ACTIVO</div>
                  </div>
                </div>
                {barcodeBuffer && (
                  <div className="bg-blue-600 text-white px-3 py-1 rounded text-sm font-mono">
                    Leyendo: {barcodeBuffer}
                  </div>
                )}
              </div>
              <p className="text-white text-sm mt-4">
                Escanee los códigos de barras de las prendas.
              </p>
            </div>
          </div>

          <div className="mt-4 p-3 rounded-lg bg-blue-50 text-primary text-center">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
              <span data-testid="text-scanner-status">Esperando Entrada</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}