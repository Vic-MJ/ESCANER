import { useState } from "react";
import Navigation from "@/components/navigation";
import BarcodeScanner from "@/components/barcode-scanner";
import ExcelUpload from "@/components/excel-upload";
import ManualSearch from "@/components/manual-search";
import GarmentModal from "@/components/garment-modal";
import type { Garment } from "@shared/schema";

export default function Home() {
  const [activeTab, setActiveTab] = useState<'scanner' | 'upload' | 'search'>('scanner');
  const [selectedGarment, setSelectedGarment] = useState<Garment | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleGarmentFound = (garment: Garment) => {
    setSelectedGarment(garment);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedGarment(null);
  };

  return (
    <div className="min-h-screen bg-background font-inter">
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'scanner' && (
          <BarcodeScanner onGarmentFound={handleGarmentFound} />
        )}
        
        {activeTab === 'upload' && (
          <ExcelUpload />
        )}
        
        {activeTab === 'search' && (
          <ManualSearch onGarmentFound={handleGarmentFound} />
        )}
      </div>

      <GarmentModal 
        garment={selectedGarment}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
}
