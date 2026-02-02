import React, { useState, useEffect, useMemo } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, User, Hash, X as CloseIcon } from 'lucide-react';

interface Director {
  id?: number;
  name: string;
  din: string;
  created_at?: string;
}

interface MultiDirectorSelectorProps {
  id: string;
  label: string;
  value: Director[];
  onChange: (directors: Director[]) => void;
  placeholder?: string;
}

const MultiDirectorSelector = ({ 
  id, 
  label, 
  value, 
  onChange, 
  placeholder = "Type director name to add"
}: MultiDirectorSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [directorsData, setDirectorsData] = useState<Director[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter directors based on search term and exclude already selected ones
  const filteredDirectors = useMemo(() => {
    if (!searchTerm) {
      // Show first 10 directors when no search term, excluding already selected ones
      const selectedNames = new Set(value.map(d => d.name));
      const availableDirectors = directorsData.filter(d => !selectedNames.has(d.name));
      return availableDirectors.slice(0, 10);
    }
    
    // For client-side filtering
    const term = searchTerm.toLowerCase();
    const selectedNames = new Set(value.map(d => d.name));
    const filtered = directorsData.filter(director => 
      (director.name.toLowerCase().includes(term) || 
      director.din.includes(term)) &&
      !selectedNames.has(director.name)
    ).slice(0, 20); // Limit to 20 results
    
    return filtered;
  }, [searchTerm, directorsData, value]);

  // Fetch directors from backend based on search term
  useEffect(() => {
    const fetchDirectors = async () => {
      // Don't fetch if search term is empty
      if (!searchTerm) {
        setDirectorsData([]);
        return;
      }
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Use the full backend URL as per the memory
        const response = await fetch(`/directors`);
        if (response.ok) {
          const result = await response.json();
          // Extract directors from the data field
          const directors = Array.isArray(result.data) ? result.data : [];
          // Map to the expected format (name and din only)
          const mappedDirectors = directors.map((d: any) => ({
            name: d.name,
            din: d.din
          }));
          setDirectorsData(mappedDirectors);
        } else {
          setError('Failed to fetch directors');
          setDirectorsData([]);
        }
      } catch (err) {
        console.error('Error fetching directors:', err);
        setError('Error fetching directors');
        setDirectorsData([]);
      } finally {
        setIsLoading(false);
      }
    };

    // Debounce the API call
    const debounceTimer = setTimeout(() => {
      fetchDirectors();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setSearchTerm(newValue);
    setIsOpen(!!newValue);
  };

  const handleDirectorSelect = (director: Director) => {
    // Check if director is already selected
    if (!value.some(d => d.name === director.name && d.din === director.din)) {
      onChange([...value, director]);
    }
    setInputValue('');
    setSearchTerm('');
    setIsOpen(false);
  };

  const removeDirector = (index: number) => {
    const newValue = [...value];
    newValue.splice(index, 1);
    onChange(newValue);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleInputBlur = () => {
    // Delay closing to allow for clicks on dropdown items
    setTimeout(() => setIsOpen(false), 200);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    // Add director on Enter key if there's a matching director
    if (e.key === 'Enter' && inputValue && filteredDirectors.length > 0) {
      handleDirectorSelect(filteredDirectors[0]);
      e.preventDefault();
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      
      {/* Selected Directors */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {value.map((director, index) => (
            <div 
              key={`${director.name}-${index}`} 
              className="flex items-center bg-blue-100 rounded-full px-3 py-1 text-sm"
            >
              <User className="h-3 w-3 mr-1 text-blue-600" />
              <span className="font-medium">{director.name}</span>
              <span className="mx-1 text-gray-400">•</span>
              <span className="text-gray-600">DIN: {director.din}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 ml-2 text-gray-500 hover:text-gray-700"
                onClick={() => removeDirector(index)}
              >
                <CloseIcon className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
      
      {/* Input with dropdown */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            id={id}
            value={inputValue}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            onKeyDown={handleKeyPress}
            placeholder={placeholder}
            className="pl-10"
          />
        </div>
        
        {isOpen && (isLoading || error || filteredDirectors.length > 0) && (
          <Card className="absolute top-full left-0 right-0 mt-1 z-50 max-h-60 overflow-y-auto">
            <CardContent className="p-0">
              {isLoading && (
                <div className="p-3 text-center text-gray-500">
                  Loading directors...
                </div>
              )}
              
              {error && (
                <div className="p-3 text-center text-red-500">
                  {error}
                </div>
              )}
              
              {!isLoading && !error && filteredDirectors.length > 0 && (
                filteredDirectors.map((director, index) => (
                  <div
                    key={`${director.din}-${index}`}
                    className="flex items-center justify-between p-3 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                    onMouseDown={() => handleDirectorSelect(director)} // Use onMouseDown to prevent blur
                  >
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-2 text-gray-500" />
                      <span className="font-medium">{director.name}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <Hash className="h-3 w-3 mr-1" />
                      <span>{director.din}</span>
                    </div>
                  </div>
                ))
              )}
              
              {!isLoading && !error && filteredDirectors.length === 0 && searchTerm && (
                <div className="p-3 text-center text-gray-500">
                  No directors found
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default MultiDirectorSelector;