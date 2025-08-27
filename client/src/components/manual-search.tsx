import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, ScanLine } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { Garment } from "@shared/schema";

interface ManualSearchProps {
  onGarmentFound: (garment: Garment) => void;
}

export default function ManualSearch({ onGarmentFound }: ManualSearchProps) {
  const [searchCode, setSearchCode] = useState("");
  const [submittedCode, setSubmittedCode] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: garment, error, isLoading } = useQuery({
    queryKey: ['/api/garments', submittedCode],
    enabled: !!submittedCode,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchCode.trim()) {
      toast({
        title: "Código requerido",
        description: "Por favor ingrese un código de prenda para buscar.",
        variant: "destructive",
      });
      return;
    }
    setSubmittedCode(searchCode.trim());
  };

  // Handle successful garment search
  useEffect(() => {
    if (garment && submittedCode) {
      onGarmentFound(garment);
      setSubmittedCode(null);
      setSearchCode("");
    }
  }, [garment, submittedCode]);

  // Handle error
  useEffect(() => {
    if (error && submittedCode) {
      toast({
        title: "Prenda no encontrada",
        description: `No se encontró ninguna prenda con el código: ${submittedCode}`,
        variant: "destructive",
      });
      setSubmittedCode(null);
    }
  }, [error, submittedCode, toast]);

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-secondary mb-4">Búsqueda Manual</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Ingrese el código de la prenda manualmente para buscar su información.
        </p>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="manualCode" className="text-sm font-medium text-secondary mb-2 block">
                Código de la Prenda
              </Label>
              <div className="relative">
                <Input
                  id="manualCode"
                  type="text"
                  value={searchCode}
                  onChange={(e) => setSearchCode(e.target.value)}
                  className="text-lg font-mono pr-12"
                  placeholder="Ej: TXT001234567890"
                  data-testid="input-manual-code"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <ScanLine className="text-gray-400 h-5 w-5" />
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary/90 text-white font-semibold"
              disabled={isLoading}
              data-testid="button-search-garment"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Buscando...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Buscar Prenda
                </>
              )}
            </Button>
          </form>

          {/* Search Tips */}
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-secondary mb-2">Consejos de búsqueda:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Asegúrese de ingresar el código completo</li>
              <li>• Los códigos suelen tener formato alfanumérico</li>
              <li>• Verifique que no haya espacios adicionales</li>
              <li>• El código debe coincidir exactamente con el registrado</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
