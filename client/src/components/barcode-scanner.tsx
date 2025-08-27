
import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Check, X, RotateCcw } from "lucide-react";
import type { Garment } from "@shared/schema";

interface BarcodeScannerProps {
  onGarmentFound: (garment: Garment) => void;
}

export default function BarcodeScanner({ onGarmentFound }: BarcodeScannerProps) {
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [referenceCode, setReferenceCode] = useState<string | null>(null);
  const [pendingReferenceCode, setPendingReferenceCode] = useState<string | null>(null);
  const [barcodeBuffer, setBarcodeBuffer] = useState<string>("");
  const [isReadingReference, setIsReadingReference] = useState(true);
  const [comparisonResult, setComparisonResult] = useState<"match" | "no-match" | null>(null);
  const [scanCount, setScanCount] = useState(0);
  const [comparisonCount, setComparisonCount] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Query for reference garment (when reading first time)
  const { data: referenceGarment, error: referenceError } = useQuery({
    queryKey: ['/api/garments', pendingReferenceCode],
    enabled: !!pendingReferenceCode,
  });

  // Show garment info when reference garment is loaded
  useEffect(() => {
    if (referenceGarment && pendingReferenceCode) {
      // Don't call onGarmentFound here, we'll show the info inline
    }
  }, [referenceGarment, pendingReferenceCode]);

  useEffect(() => {
    if (referenceError && pendingReferenceCode) {
      toast({
        title: "❌ Prenda no encontrada",
        description: "El código escaneado no se encuentra en la base de datos.",
        variant: "destructive",
        duration: 4000,
      });
      setPendingReferenceCode(null);
    }
  }, [referenceError, pendingReferenceCode, toast]);

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
          const code = bufferRef.current.trim();
          
          if (isReadingReference) {
            // Reading reference code for first time
            setPendingReferenceCode(code);
            setScanCount(prev => prev + 1);
          } else {
            // Comparing with reference code
            handleCodeComparison(code);
          }
          
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
            const code = bufferRef.current.trim();
            
            if (isReadingReference) {
              // Reading reference code for first time
              setPendingReferenceCode(code);
              setScanCount(prev => prev + 1);
            } else {
              // Comparing with reference code
              handleCodeComparison(code);
            }
            
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
  }, [isReadingReference, referenceCode]);

  const handleCodeComparison = (code: string) => {
    if (referenceCode) {
      const matches = code === referenceCode;
      setComparisonResult(matches ? "match" : "no-match");
      
      // Only increment counter for successful matches
      if (matches) {
        setComparisonCount(prev => prev + 1);
      }
      
      toast({
        title: matches ? "✅ ¡Código coincide!" : "❌ Código no coincide",
        description: matches 
          ? `El código ${code} coincide con el de referencia` 
          : `El código ${code} no coincide con el de referencia ${referenceCode}`,
        variant: matches ? "default" : "destructive",
        duration: 4000,
      });

      // Clear result after 3 seconds
      setTimeout(() => {
        setComparisonResult(null);
      }, 3000);
    }
  };

  const handleAcceptReference = () => {
    if (pendingReferenceCode && referenceGarment) {
      setReferenceCode(pendingReferenceCode);
      setIsReadingReference(false);
      setPendingReferenceCode(null);
      toast({
        title: "✅ Código de referencia guardado",
        description: `Código ${pendingReferenceCode} guardado como referencia. Ahora puede escanear códigos para comparar.`,
        duration: 4000,
      });
    }
  };

  const handleCancelReference = () => {
    setPendingReferenceCode(null);
    toast({
      title: "🚫 Operación cancelada",
      description: "No se guardó el código de referencia.",
      duration: 3000,
    });
  };

  const handleNewReference = () => {
    setReferenceCode(null);
    setPendingReferenceCode(null);
    setIsReadingReference(true);
    setComparisonResult(null);
    setScanCount(0);
    setComparisonCount(0);
    toast({
      title: "🔄 Listo para nuevo código",
      description: "Escanee un nuevo código de referencia.",
      duration: 3000,
    });
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const getStatusText = () => {
    if (pendingReferenceCode) return "Código leído - Confirme para guardar";
    if (isReadingReference) return "Esperando código de referencia";
    if (comparisonResult === "match") return "✓ COINCIDE";
    if (comparisonResult === "no-match") return "✗ NO COINCIDE";
    return "Esperando código para comparar";
  };

  const getStatusColor = () => {
    if (comparisonResult === "match") return "text-green-600 bg-green-50";
    if (comparisonResult === "no-match") return "text-red-600 bg-red-50";
    if (pendingReferenceCode) return "text-blue-600 bg-blue-50";
    return "text-primary bg-blue-50";
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-secondary mb-4">
          {isReadingReference ? "Leer Código de Referencia" : "Comparar Códigos"}
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          {isReadingReference 
            ? "Escanee el código de barras que servirá como referencia para las comparaciones."
            : `Código de referencia: ${referenceCode}. Escanee códigos para compararlos.`
          }
        </p>
        
        {/* Scan Counters */}
        <div className="flex justify-center gap-8 mt-4">
          <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg border border-blue-200">
            <span className="text-sm font-medium">Códigos de referencia leídos: </span>
            <span className="text-lg font-bold">{scanCount}</span>
          </div>
          {!isReadingReference && (
            <div className="bg-green-50 text-green-700 px-4 py-2 rounded-lg border border-green-200">
              <span className="text-sm font-medium">Códigos que coinciden: </span>
              <span className="text-lg font-bold">{comparisonCount}</span>
            </div>
          )}
        </div>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-8">
          <div className="scanner-container bg-gray-900 rounded-lg p-8 mb-6 min-h-64 flex items-center justify-center">
            <div className="text-center">
              <div className="relative">
                <div className="w-78 h-48 border-4 border-green-400 rounded-lg flex items-center justify-center mb-4 animate-pulse">
                  <div className="text-center">
                    <div className="text-green-400 text-6xl mb-4">
                      <img src="../../public/icon.png" alt="Mi imagen" className="w-20 h-20 mx-auto" />
                    </div>
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
                {isReadingReference 
                  ? "Escanee el código de referencia."
                  : "Escanee códigos para comparar con la referencia."
                }
              </p>
            </div>
          </div>

          {/* Status Display */}
          <div className={`mt-4 p-3 rounded-lg text-center ${getStatusColor()}`}>
            <div className="flex items-center justify-center">
              {comparisonResult === "match" && <Check className="h-5 w-5 mr-2" />}
              {comparisonResult === "no-match" && <X className="h-5 w-5 mr-2" />}
              {!comparisonResult && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
              )}
              <span data-testid="text-scanner-status">{getStatusText()}</span>
            </div>
          </div>

          {/* Garment Information Display */}
          {pendingReferenceCode && referenceGarment && (
            <div className="mt-6 bg-white rounded-lg border-2 border-blue-200 p-6 shadow-lg">
              <h3 className="text-xl font-bold text-center mb-4 text-blue-800">
                📋 Información de la Prenda
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-semibold text-gray-700">Código:</span>
                  <p className="text-blue-600 font-bold">{referenceGarment.codigo}</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Área:</span>
                  <p className="text-gray-800">{referenceGarment.area}</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Tipo:</span>
                  <p className="text-gray-800">{referenceGarment.dama_cab}</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Prenda:</span>
                  <p className="text-gray-800">{referenceGarment.prenda}</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Modelo:</span>
                  <p className="text-gray-800">{referenceGarment.modelo}</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Tela:</span>
                  <p className="text-gray-800">{referenceGarment.tela}</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Color:</span>
                  <p className="text-gray-800">{referenceGarment.color}</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Talla:</span>
                  <p className="text-gray-800">{referenceGarment.talla}</p>
                </div>
              </div>
              
              {/* Confirmation Message */}
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-center text-blue-800 font-medium">
                  ¿Desea guardar este código como referencia para comparaciones?
                </p>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex gap-4 justify-center">
                <Button 
                  onClick={handleAcceptReference}
                  className="bg-green-600 hover:bg-green-700 text-white px-8 py-2 text-lg font-semibold"
                >
                  <Check className="h-5 w-5 mr-2" />
                  Aceptar
                </Button>
                <Button 
                  onClick={handleCancelReference}
                  variant="outline"
                  className="border-red-300 text-red-600 hover:bg-red-50 px-8 py-2 text-lg font-semibold"
                >
                  <X className="h-5 w-5 mr-2" />
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          {!isReadingReference && !pendingReferenceCode && (
            <div className="mt-6 flex justify-center">
              <Button 
                onClick={handleNewReference}
                variant="outline"
                className="border-blue-300 text-blue-600 hover:bg-blue-50"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Leer Nuevo Código de Referencia
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
