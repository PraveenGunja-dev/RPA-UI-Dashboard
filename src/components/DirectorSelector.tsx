import React, { useState, useMemo, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Search, User, Hash } from 'lucide-react';

interface Director {
  name: string;
  din: string;
}

interface DirectorSelectorProps {
  id: string;
  label: string;
  value: Director;
  onChange: (director: Director) => void;
  directorsData: Director[];
  placeholder?: string;
}

const DirectorSelector = ({ 
  id, 
  label, 
  value, 
  onChange, 
  directorsData, 
  placeholder = "Select or type director name"
}: DirectorSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [inputValue, setInputValue] = useState(value.name);
  const [filteredDirectors, setFilteredDirectors] = useState<Director[]>([]);

  // Filter directors based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredDirectors(directorsData.slice(0, 10)); // Show first 10 directors when no search term
      return;
    }
    
    // For client-side filtering
    const term = searchTerm.toLowerCase();
    const filtered = directorsData.filter(director => 
      director.name.toLowerCase().includes(term) || 
      director.din.includes(term)
    ).slice(0, 20); // Limit to 20 results
    
    setFilteredDirectors(filtered);
  }, [searchTerm, directorsData]);

  // Update input value when value changes
  React.useEffect(() => {
    setInputValue(value.name);
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setSearchTerm(newValue);
    setIsOpen(true);
    
    // If the input exactly matches a director name, select that director
    const matchedDirector = directorsData.find(
      director => director.name.toLowerCase() === newValue.toLowerCase()
    );
    
    if (matchedDirector) {
      onChange(matchedDirector);
    } else if (!newValue) {
      // Clear selection if input is empty
      onChange({ name: '', din: '' });
    }
  };

  const handleDirectorSelect = (director: Director) => {
    onChange(director);
    setInputValue(director.name);
    setSearchTerm('');
    setIsOpen(false);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
    // Show first 10 directors when input is focused
    if (!searchTerm) {
      setFilteredDirectors(directorsData.slice(0, 10));
    }
  };

  const handleInputBlur = () => {
    // Delay closing to allow for clicks on dropdown items
    setTimeout(() => setIsOpen(false), 200);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            id={id}
            value={inputValue}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            placeholder={placeholder}
            className="pl-10"
          />
        </div>
        
        {isOpen && filteredDirectors.length > 0 && (
          <Card className="absolute top-full left-0 right-0 mt-1 z-50 max-h-60 overflow-y-auto">
            <CardContent className="p-0">
              {filteredDirectors.map((director, index) => (
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
              ))}
            </CardContent>
          </Card>
        )}
      </div>
      
      {value.din && (
        <div className="text-sm text-gray-500 mt-1">
          DIN: {value.din}
        </div>
      )}
    </div>
  );
};

export default DirectorSelector;