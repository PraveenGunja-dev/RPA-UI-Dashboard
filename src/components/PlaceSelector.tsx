import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, MapPin } from 'lucide-react';

interface Place {
  id: number;
  name: string;
  address: string;
  is_default: boolean;
  created_at: string;
}

const PlaceSelector = ({ 
  id, 
  label, 
  value, 
  onChange,
  placeholder = "Select or add a place"
}: { 
  id: string; 
  label: string; 
  value: string; 
  onChange: (value: string) => void;
  placeholder?: string;
}) => {
  const [places, setPlaces] = useState<Place[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [newPlaceName, setNewPlaceName] = useState('');
  const [newPlaceAddress, setNewPlaceAddress] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  // Fetch places from the API
  const fetchPlaces = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/places');
      if (response.ok) {
        const result = await response.json();
        setPlaces(result.data);
      } else {
        console.error('Failed to fetch places');
      }
    } catch (error) {
      console.error('Error fetching places:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load places on component mount
  useEffect(() => {
    fetchPlaces();
  }, []);

  // Create a new place
  const createPlace = async () => {
    if (!newPlaceName.trim() || !newPlaceAddress.trim()) return;
    
    try {
      const response = await fetch('/places', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newPlaceName,
          address: newPlaceAddress,
          is_default: false
        }),
      });
      
      if (response.ok) {
        const newPlace = await response.json();
        setPlaces(prev => [...prev, newPlace]);
        // If this is the first place, select it
        if (places.length === 0) {
          onChange(newPlace.address);
        }
        // Reset form
        setNewPlaceName('');
        setNewPlaceAddress('');
        setIsOpen(false);
      } else {
        console.error('Failed to create place');
      }
    } catch (error) {
      console.error('Error creating place:', error);
    }
  };

  // Get the default place
  const defaultPlace = places.find(place => place.is_default);

  // Handle selection change
  const handleSelectChange = (selectedValue: string) => {
    if (selectedValue === '__CUSTOM__') {
      setShowCustomInput(true);
      onChange(''); // Clear the value
    } else {
      setShowCustomInput(false);
      onChange(selectedValue);
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex gap-2">
        <div className="flex-1">
          <Select 
            value={showCustomInput ? '__CUSTOM__' : value} 
            onValueChange={handleSelectChange}
          >
            <SelectTrigger className="bg-white">
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent className="bg-white">
              {isLoading ? (
                <SelectItem value="__LOADING__" disabled>Loading places...</SelectItem>
              ) : (
                <>
                  {defaultPlace && (
                    <SelectItem 
                      value={defaultPlace.address} 
                      className="bg-white focus:text-foreground cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-blue-500" />
                        <span>{defaultPlace.name} (Default)</span>
                      </div>
                    </SelectItem>
                  )}
                  {places
                    .filter(place => !place.is_default)
                    .map((place) => (
                      <SelectItem 
                        key={place.id} 
                        value={place.address} 
                        className="bg-white focus:text-foreground cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-500" />
                          <span>{place.name}</span>
                        </div>
                      </SelectItem>
                    ))
                  }
                  <SelectItem 
                    value="__CUSTOM__" 
                    className="bg-white focus:text-foreground cursor-pointer"
                  >
                    Other / Custom Address
                  </SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white">
            <DialogHeader className="bg-white">
              <DialogTitle className="bg-white">Add New Place</DialogTitle>
              <DialogDescription className="bg-white">
                Add a new meeting place to the database
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 bg-white">
              <div className="space-y-2">
                <Label htmlFor="place-name">Place Name</Label>
                <Input
                  id="place-name"
                  value={newPlaceName}
                  onChange={(e) => setNewPlaceName(e.target.value)}
                  placeholder="e.g., Adani Corporate House"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="place-address">Full Address</Label>
                <Input
                  id="place-address"
                  value={newPlaceAddress}
                  onChange={(e) => setNewPlaceAddress(e.target.value)}
                  placeholder="Enter full address"
                />
              </div>
            </div>
            <DialogFooter className="bg-white">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={createPlace}
                disabled={!newPlaceName.trim() || !newPlaceAddress.trim()}
              >
                Add Place
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Custom address input when "Other" is selected */}
      {showCustomInput && (
        <div className="mt-2">
          <Label htmlFor={`${id}-custom`}>Custom Address</Label>
          <Input
            id={`${id}-custom`}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Enter custom address"
          />
        </div>
      )}
    </div>
  );
};

export default PlaceSelector;