import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Calendar, Image as ImageIcon } from "lucide-react";
import ImageUpload from "./image-upload";
import { useState, useEffect, useRef } from "react";
import type { Garment } from "@shared/schema";
import JsBarcode from "jsbarcode";

interface GarmentModalProps {
  garment: Garment | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function GarmentModal({ garment, isOpen, onClose }: GarmentModalProps) {
  const barcodeRef = useRef<SVGSVGElement>(null);

  // Internal mapping for tipo_manga determination
  const TIPOS_MANGA: { [key: string]: string } = {
    '1': 'Manga Larga',
    '2': 'Manga Corta', 
    '3': 'Manga 3/4',
    '4': 'Manga Junior',
    'L': 'Largo',
    'C': 'Corto',
    'R': 'Recto'
  };

  // Helper function to determine tipo_manga based on modelo
  const determineTipoManga = (modelo: string): string => {
    if (!modelo) return '';
    const lastChar = modelo.slice(-1).toUpperCase();
    return TIPOS_MANGA[lastChar] || '';
  };

  useEffect(() => {
    if (garment && barcodeRef.current) {
      try {
        // Limpiar el SVG anterior
        barcodeRef.current.innerHTML = '';

        // Establecer dimensiones y namespace para el SVG
        barcodeRef.current.setAttribute('width', '400');
        barcodeRef.current.setAttribute('height', '160');
        barcodeRef.current.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        barcodeRef.current.setAttribute('viewBox', '0 0 400 160');

        // Generar el código de barras con configuraciones optimizadas
        JsBarcode(barcodeRef.current, garment.codigo.toString(), {
          format: "CODE39",
          width: 4,
          height: 80,
          displayValue: true,
          fontSize: 18,
          background: "#ffffff",
          lineColor: "#000000",
          margin: 20,
          textAlign: "center",
          textPosition: "bottom",
          textMargin: 15,
          valid: function(valid) {
            if (!valid) {
              console.error("Invalid barcode format for:", garment.codigo);
            }
          }
        });

        console.log("Barcode generated successfully for:", garment.codigo);
      } catch (error) {
        console.error("Error generating barcode:", error);
        // Mostrar mensaje de error en el SVG
        barcodeRef.current.innerHTML = `
          <text x="100" y="40" text-anchor="middle" fill="red" font-size="12">
            Error: ${error.message}
          </text>
        `;
      }
    }
  }, [garment]);

  if (!garment) return null;

  const formatDate = (date: Date | null) => {
    if (!date) return "No disponible";
    return new Intl.DateTimeFormat('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  const getColorIndicator = (color: string) => {
    const colorMap: Record<string, string> = {
      'azul': 'bg-blue-500',
      'azul marino': 'bg-blue-800',
      'rojo': 'bg-red-500',
      'verde': 'bg-green-500',
      'amarillo': 'bg-yellow-500',
      'negro': 'bg-black',
      'blanco': 'bg-white border-2 border-gray-300',
      'gris': 'bg-gray-500',
      'rosa': 'bg-pink-500',
      'morado': 'bg-purple-500',
      'naranja': 'bg-orange-500',
    };

    const normalizedColor = color.toLowerCase();
    return colorMap[normalizedColor] || 'bg-gray-400';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-auto bg-gradient-to-br from-purple-100 to-pink-100" data-testid="modal-garment-info">
        <DialogHeader>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="bg-black text-white px-4 py-2 rounded-full font-bold text-lg">
                JSN
              </div>
              <div className="bg-white rounded-full px-6 py-2 shadow-lg">
                <span className="text-gray-800 font-semibold">Información de la prenda</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-gray-600 font-medium">ID: {garment.codigo}</span>
            </div>
          </div>
        </DialogHeader>

        {/* Main Content Section */}
        <div className="bg-white rounded-3xl p-8 shadow-lg mb-6">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Image and Barcode Section */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                {garment.imagen_url ? (
                  <img
                    src={garment.imagen_url}
                    alt={`Imagen de ${garment.prenda} - ${garment.codigo}`}
                    className="w-full h-48 object-cover rounded-lg shadow-md"
                    data-testid="img-garment-photo"
                  />
                ) : (
                  <div className="w-full h-48 bg-black rounded-lg flex items-center justify-center">
                    <ImageIcon className="h-16 w-16 text-white" />
                  </div>
                )}
                <p className="text-gray-600 font-medium mt-2">Imagen de la prenda</p>
              </div>

              {/* Image Upload and Barcode Sections - Full Width */}
              <div className="space-y-6">
                {/* Image Upload Section */}
                <div className="bg-gray-50 rounded-xl p-8 w-full">
                  <h3 className="text-gray-700 font-semibold text-center mb-6 text-xl">Actualizar Imagen</h3>
                  <div className="max-w-md mx-auto">
                    <ImageUpload
                      garmentCode={garment.codigo}
                      onImageUploaded={() => {
                        // Refresh data will be handled by the mutation
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Information Section */}
            <div className="lg:col-span-2 grid grid-cols-2 gap-8">
              {/* Left Column */}
              <div className="space-y-6">
                <div>
                  <span className="text-gray-600 font-medium text-lg">Área: </span>
                  <span className="font-bold text-gray-800 text-lg" data-testid="text-garment-area">
                    {garment.area}
                  </span>
                </div>

                <div>
                  <span className="text-gray-600 font-medium text-lg">Tipo de prenda: </span>
                  <span className="font-bold text-gray-800 text-lg" data-testid="text-garment-category">
                    {garment.dama_cab}
                  </span>
                </div>

                <div>
                  <span className="text-gray-600 font-medium text-lg">Modelo: </span>
                  <span className="font-bold text-gray-800 text-lg" data-testid="text-garment-model">
                    {garment.modelo}
                  </span>
                </div>

                <div>
                  <span className="text-gray-600 font-medium text-lg">Prenda: </span>
                  <span className="font-bold text-gray-800 text-lg" data-testid="text-garment-type">
                    {garment.prenda} {determineTipoManga(garment.modelo)}
                  </span>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                <div>
                  <span className="text-gray-600 font-medium text-lg">Tela: </span>
                  <span className="font-bold text-gray-800 text-lg" data-testid="text-garment-fabric">
                    {garment.tela}
                  </span>
                </div>

                <div className="flex items-center">
                  <span className="text-gray-600 font-medium text-lg mr-2">Color: </span>
                  <div
                    className={`w-5 h-5 rounded-full mr-3 ${getColorIndicator(garment.color)}`}
                    data-testid="color-indicator"
                  ></div>
                  <span className="font-bold text-gray-800 text-lg" data-testid="text-garment-color">
                    {garment.color}
                  </span>
                </div>

                <div>
                  <span className="text-gray-600 font-medium text-lg">Talla: </span>
                  <span className="font-bold text-gray-800 text-lg" data-testid="text-garment-size">
                    {garment.talla}
                  </span>
                </div>

                <div>
                  <span className="text-gray-600 font-medium text-lg">Ficha de Bordado: </span>
                  <span className="font-bold text-gray-800 text-lg" data-testid="text-garment-embroidery">
                    {garment.ficha_bordado}
                  </span>
                </div>

                <div className="mt-8">
                  <span className="text-gray-600 font-medium text-sm">Última Actualización: </span>
                  <span className="text-sm text-gray-600" data-testid="text-garment-updated">
                    {formatDate(garment.updatedAt)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>


      </DialogContent>
    </Dialog>
  );
}