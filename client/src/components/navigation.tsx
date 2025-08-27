import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, Camera, Upload, Search } from "lucide-react";

interface NavigationProps {
  activeTab: 'scanner' | 'upload' | 'search';
  onTabChange: (tab: 'scanner' | 'upload' | 'search') => void;
}

export default function Navigation({ activeTab, onTabChange }: NavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleTabClick = (tab: 'scanner' | 'upload' | 'search') => {
    onTabChange(tab);
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="bg-surface shadow-md border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-secondary">Corporativo JSN Textil</h1>
            </div>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <Button
                data-testid="tab-scanner"
                variant={activeTab === 'scanner' ? 'default' : 'ghost'}
                onClick={() => handleTabClick('scanner')}
                className={`font-medium transition-colors ${
                  activeTab === 'scanner' 
                    ? 'bg-primary text-white hover:bg-primary/90' 
                    : 'text-secondary hover:bg-gray-100'
                }`}
              >
                <Camera className="mr-2 h-4 w-4" />
                Escáner
              </Button>
              <Button
                data-testid="tab-upload"
                variant={activeTab === 'upload' ? 'default' : 'ghost'}
                onClick={() => handleTabClick('upload')}
                className={`font-medium transition-colors ${
                  activeTab === 'upload' 
                    ? 'bg-primary text-white hover:bg-primary/90' 
                    : 'text-secondary hover:bg-gray-100'
                }`}
              >
                <Upload className="mr-2 h-4 w-4" />
                Cargar Excel
              </Button>
              <Button
                data-testid="tab-search"
                variant={activeTab === 'search' ? 'default' : 'ghost'}
                onClick={() => handleTabClick('search')}
                className={`font-medium transition-colors ${
                  activeTab === 'search' 
                    ? 'bg-primary text-white hover:bg-primary/90' 
                    : 'text-secondary hover:bg-gray-100'
                }`}
              >
                <Search className="mr-2 h-4 w-4" />
                Búsqueda Manual
              </Button>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              data-testid="button-mobile-menu"
              variant="ghost"
              size="sm"
              onClick={toggleMobileMenu}
              className="text-secondary hover:text-primary"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-surface border-t">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Button
              data-testid="mobile-tab-scanner"
              variant={activeTab === 'scanner' ? 'default' : 'ghost'}
              onClick={() => handleTabClick('scanner')}
              className={`w-full justify-start font-medium ${
                activeTab === 'scanner' 
                  ? 'bg-primary text-white' 
                  : 'text-secondary hover:bg-gray-100'
              }`}
            >
              <Camera className="mr-2 h-4 w-4" />
              Escáner
            </Button>
            <Button
              data-testid="mobile-tab-upload"
              variant={activeTab === 'upload' ? 'default' : 'ghost'}
              onClick={() => handleTabClick('upload')}
              className={`w-full justify-start font-medium ${
                activeTab === 'upload' 
                  ? 'bg-primary text-white' 
                  : 'text-secondary hover:bg-gray-100'
              }`}
            >
              <Upload className="mr-2 h-4 w-4" />
              Cargar Excel
            </Button>
            <Button
              data-testid="mobile-tab-search"
              variant={activeTab === 'search' ? 'default' : 'ghost'}
              onClick={() => handleTabClick('search')}
              className={`w-full justify-start font-medium ${
                activeTab === 'search' 
                  ? 'bg-primary text-white' 
                  : 'text-secondary hover:bg-gray-100'
              }`}
            >
              <Search className="mr-2 h-4 w-4" />
              Búsqueda Manual
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
}
