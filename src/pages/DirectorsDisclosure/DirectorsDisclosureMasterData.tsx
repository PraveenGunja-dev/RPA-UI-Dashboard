import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Users, Search, Loader2, AlertCircle, Plus, Edit, Trash2, Eye } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import FamilyInfoModal from "./FamilyInfoModal";
import ReactCrop, { centerCrop, makeAspectCrop, Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

// Add interface for director profile
interface DirectorProfile {
  name: string;
  din: string;
  address: string | null;
  date_of_birth: string | null;
  pan: string | null;
  qualification: string | null;
  experience: string | null;
}

// Add interface for upload status
interface UploadStatus {
  type: 'loading' | 'success' | 'error';
  message: string;
}

interface Director {
  id: number;
  name: string;
  din: string;
  pan?: string;
  created_at: string;
}

// Add interface for editable profile fields (excluding name and DIN)
interface EditableProfileFields {
  address: string;
  date_of_birth: string;
  pan: string;
  qualification: string;
  experience: string;
}

// Add interface for image cropping
interface ImageCropData {
  x: number;
  y: number;
  width: number;
  height: number;
}

const DirectorsDisclosureMasterData = () => {
  const [directors, setDirectors] = useState<Director[]>([]);
  const [filteredDirectors, setFilteredDirectors] = useState<Director[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState<boolean>(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState<boolean>(false);
  const [editingDirector, setEditingDirector] = useState<Director | null>(null);
  const [formData, setFormData] = useState({ name: "", din: "", pan: "" });
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [isFamilyInfoModalOpen, setIsFamilyInfoModalOpen] = useState<boolean>(false);
  const [selectedDirectorName, setSelectedDirectorName] = useState<string>("");
  
  // Add state for director profile modal
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [selectedDirectorProfile, setSelectedDirectorProfile] = useState<DirectorProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState<boolean>(false);
  
  // Add state for image upload
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Add state for image cropping
  const [showCropModal, setShowCropModal] = useState<boolean>(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const imgRef = useRef<HTMLImageElement>(null);

  // Add state for editable profile fields
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);
  const [editableProfile, setEditableProfile] = useState<EditableProfileFields>({
    address: '',
    date_of_birth: '',
    pan: '',
    qualification: '',
    experience: ''
  });
  const [profileSaveLoading, setProfileSaveLoading] = useState<boolean>(false);

  useEffect(() => {
    fetchDirectors();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredDirectors(directors);
    } else {
      const filtered = directors.filter(
        (director) =>
          director.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          director.din.includes(searchTerm)
      );
      setFilteredDirectors(filtered);
    }
  }, [searchTerm, directors]);

  const fetchDirectors = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/directors-master');
      
      if (!response.ok) {
        throw new Error('Failed to fetch directors');
      }
      
      const data = await response.json();
      setDirectors(data.data || []);
      setFilteredDirectors(data.data || []);
    } catch (err) {
      console.error('Error fetching directors:', err);
      setError(err instanceof Error ? err.message : 'Failed to load directors');
    } finally {
      setLoading(false);
    }
  };

  const handleAddDirector = async () => {
    if (!formData.name.trim() || !formData.din.trim()) {
      alert('Please fill in all fields');
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch('/api/directors-master', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Failed to add director');

      await fetchDirectors();
      setIsAddDialogOpen(false);
      setFormData({ name: "", din: "", pan: "" });
    } catch (err) {
      console.error('Error adding director:', err);
      alert('Failed to add director');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditDirector = async () => {
    if (!editingDirector || !formData.name.trim() || !formData.din.trim()) {
      alert('Please fill in all fields');
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch(`/api/directors-master/${editingDirector.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Failed to update director');

      // Update PAN via dedicated endpoint
      const panRes = await fetch(`/api/directors-master/${editingDirector.id}/pan`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pan: formData.pan })
      });
      if (!panRes.ok) throw new Error('Failed to update PAN');

      await fetchDirectors();
      setIsEditDialogOpen(false);
      setEditingDirector(null);
      setFormData({ name: "", din: "", pan: "" });
    } catch (err) {
      console.error('Error updating director:', err);
      alert('Failed to update director');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDirector = async (id: number) => {
    if (!confirm('Are you sure you want to delete this director?')) return;

    try {
      const response = await fetch(`/api/directors-master/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete director');

      await fetchDirectors();
    } catch (err) {
      console.error('Error deleting director:', err);
      alert('Failed to delete director');
    }
  };

  const openEditDialog = (director: Director) => {
    setEditingDirector(director);
    setFormData({ name: director.name, din: director.din, pan: director.pan ?? "" });
    setIsEditDialogOpen(true);
  };

  const handleViewFamilyInfo = (directorName: string) => {
    setSelectedDirectorName(directorName);
    setIsFamilyInfoModalOpen(true);
  };
  
  // Add function to fetch and show director profile
  const handleViewProfile = async (din: string) => {
    try {
      setProfileLoading(true);
      setUploadedImage(null);
      setUploadStatus(null);
      setIsEditingProfile(false);
      
      // Fetch director profile data
      const response = await fetch(`/api/directors-profile/${din}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch director profile');
      }
      
      const profileData = await response.json();
      setSelectedDirectorProfile(profileData);
      
      // Set editable profile fields (excluding name and DIN)
      setEditableProfile({
        address: profileData.address || '',
        date_of_birth: profileData.date_of_birth || '',
        pan: profileData.pan || '',
        qualification: profileData.qualification || '',
        experience: profileData.experience || ''
      });
      
      setIsProfileModalOpen(true);
      
      // Load stored image for this director from server
      await loadDirectorImage(din);
    } catch (err) {
      console.error('Error fetching director profile:', err);
      alert('Failed to fetch director profile');
    } finally {
      setProfileLoading(false);
    }
  };

  // Add function to handle profile field changes
  const handleProfileFieldChange = (field: keyof EditableProfileFields, value: string) => {
    setEditableProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Add function to save profile changes
  const handleSaveProfileChanges = async () => {
    if (!selectedDirectorProfile) return;
    
    try {
      setProfileSaveLoading(true);
      
      // Prepare update data (only send changed fields)
      const updateData: Partial<EditableProfileFields> = {};
      if (editableProfile.address !== (selectedDirectorProfile.address || '')) updateData.address = editableProfile.address;
      if (editableProfile.date_of_birth !== (selectedDirectorProfile.date_of_birth || '')) updateData.date_of_birth = editableProfile.date_of_birth;
      if (editableProfile.pan !== (selectedDirectorProfile.pan || '')) updateData.pan = editableProfile.pan;
      if (editableProfile.qualification !== (selectedDirectorProfile.qualification || '')) updateData.qualification = editableProfile.qualification;
      if (editableProfile.experience !== (selectedDirectorProfile.experience || '')) updateData.experience = editableProfile.experience;
      
      // Only proceed if there are changes
      if (Object.keys(updateData).length === 0) {
        setIsEditingProfile(false);
        return;
      }
      
      const response = await fetch(`/api/directors-profile/${selectedDirectorProfile.din}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to update profile');
      }
      
      const updatedProfile = await response.json();
      setSelectedDirectorProfile(updatedProfile);
      
      // Show success message
      setUploadStatus({
        type: 'success',
        message: 'Profile updated successfully!'
      });
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        setUploadStatus(null);
      }, 3000);
      
      setIsEditingProfile(false);
    } catch (err) {
      console.error('Error updating profile:', err);
      setUploadStatus({
        type: 'error',
        message: 'Failed to update profile. Please try again.'
      });
      setTimeout(() => setUploadStatus(null), 3000);
    } finally {
      setProfileSaveLoading(false);
    }
  };

  // Add function to cancel profile editing
  const handleCancelProfileEdit = () => {
    if (selectedDirectorProfile) {
      setEditableProfile({
        address: selectedDirectorProfile.address || '',
        date_of_birth: selectedDirectorProfile.date_of_birth || '',
        pan: selectedDirectorProfile.pan || '',
        qualification: selectedDirectorProfile.qualification || '',
        experience: selectedDirectorProfile.experience || ''
      });
    }
    setIsEditingProfile(false);
  };

  // Add function to load director image from server
  const loadDirectorImage = async (din: string) => {
    try {
      const response = await fetch(`/api/directors-profile/${din}/image`);
      if (response.ok) {
        const imageUrl = URL.createObjectURL(await response.blob());
        setUploadedImage(imageUrl);
      } else {
        setUploadedImage(null);
      }
    } catch (err) {
      console.error('Error loading director image:', err);
      setUploadedImage(null);
    }
  };

  // Add function to trigger file input
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Add function to handle image upload with cropping option
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedDirectorProfile) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadStatus({
        type: 'error',
        message: 'Please select a valid image file'
      });
      setTimeout(() => setUploadStatus(null), 3000);
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setUploadStatus({
        type: 'error',
        message: 'Image size should be less than 5MB'
      });
      setTimeout(() => setUploadStatus(null), 3000);
      return;
    }

    try {
      // Convert file to data URL for cropping preview
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageDataUrl = e.target?.result as string;
        setImageToCrop(imageDataUrl);
        setShowCropModal(true);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Error preparing image for crop:', err);
      setUploadStatus({
        type: 'error',
        message: 'Failed to prepare image. Please try again.'
      });
      setTimeout(() => setUploadStatus(null), 3000);
    }
  };

  // Add function to handle image load for cropping
  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    const crop = centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 90,
        },
        1, // Aspect ratio 1:1 for circle
        width,
        height
      ),
      width,
      height
    );
    setCrop(crop);
  };

  // Add function to convert canvas to blob
  const canvasPreview = (
    image: HTMLImageElement,
    canvas: HTMLCanvasElement,
    crop: PixelCrop
  ) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('No 2d context');
    }

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    
    canvas.width = crop.width;
    canvas.height = crop.height;

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width,
      crop.height
    );
  };

  // Add function to handle cropped image upload
  const handleCroppedImageUpload = async () => {
    if (!selectedDirectorProfile || !completedCrop || !imgRef.current) return;

    try {
      setUploadStatus({
        type: 'loading',
        message: 'Uploading image...'
      });

      // Create canvas for cropping
      const image = imgRef.current;
      const canvas = document.createElement('canvas');
      canvasPreview(image, canvas, completedCrop);

      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Canvas is empty'));
          }
        }, 'image/jpeg');
      });

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', blob, `director_image_${selectedDirectorProfile.din}.jpg`);

      // Upload image to server
      const response = await fetch(`/api/directors-profile/${selectedDirectorProfile.din}/image`, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Load the newly uploaded image
        await loadDirectorImage(selectedDirectorProfile.din);
        
        // Show success message
        setUploadStatus({
          type: 'success',
          message: 'Image uploaded successfully!'
        });
        
        // Close crop modal
        setShowCropModal(false);
        setImageToCrop(null);
        setCrop(undefined);
        setCompletedCrop(undefined);
        
        // Auto-hide success message after 3 seconds
        setTimeout(() => {
          setUploadStatus(null);
        }, 3000);
      } else {
        throw new Error(result.message || 'Upload failed');
      }
    } catch (err) {
      console.error('Error uploading image:', err);
      setUploadStatus({
        type: 'error',
        message: 'Upload failed. Please try again.'
      });
      setTimeout(() => setUploadStatus(null), 3000);
    }
  };

  // Add function to cancel image cropping
  const handleCancelCrop = () => {
    setShowCropModal(false);
    setImageToCrop(null);
    setCrop(undefined);
    setCompletedCrop(undefined);
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#ffffff" }}>
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" style={{ color: "#75479C" }} />
          <p className="text-lg" style={{ color: "#000000" }}>Loading directors...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#ffffff" }}>
        <div className="text-center p-6 max-w-md">
          <AlertCircle className="h-12 w-12 mx-auto mb-4" style={{ color: "#EF4444" }} />
          <h2 className="text-xl font-bold mb-2" style={{ color: "#000000" }}>Error Loading Data</h2>
          <p className="mb-4" style={{ color: "#000000" }}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6" style={{ background: "#ffffff" }}>
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="border-0 shadow-lg" style={{ borderTop: '4px solid #75479C' }}>
          <CardHeader>
            <div className="flex items-center gap-3 mb-4">
              <Users className="h-8 w-8" style={{ color: "#75479C" }} />
              <div>
                <CardTitle className="text-2xl font-bold" style={{ color: "#000000" }}>
                  Directors Master Data
                </CardTitle>
                <CardDescription style={{ color: '#666666' }}>
                  Complete list of all directors with DIN information
                </CardDescription>
              </div>
            </div>

            {/* Search Bar and Add Button */}
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" style={{ color: '#666666' }} />
                <Input
                  placeholder="Search by name or DIN..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  style={{ borderColor: '#75479C' }}
                />
              </div>
              <Button
                onClick={() => {
                  setFormData({ name: "", din: "", pan: "" });
                  setIsAddDialogOpen(true);
                }}
                className="gap-2"
                style={{ backgroundColor: '#75479C', color: 'white' }}
              >
                <Plus className="h-4 w-4" />
                Add Director
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4 text-sm" style={{ color: '#666666' }}>
              Showing {filteredDirectors.length} of {directors.length} directors
            </div>

            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow style={{ backgroundColor: '#f5f5f5' }}>
                    <TableHead className="font-semibold w-12">#</TableHead>
                    <TableHead className="font-semibold">Director Name</TableHead>
                    <TableHead className="font-semibold">DIN</TableHead>
                    <TableHead className="font-semibold">PAN</TableHead>
                    <TableHead className="font-semibold text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDirectors.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8" style={{ color: '#666666' }}>
                        {searchTerm ? 'No directors found matching your search' : 'No directors found'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredDirectors.map((director, index) => (
                      <TableRow key={director.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium" style={{ color: '#666666' }}>
                          {index + 1}
                        </TableCell>
                        <TableCell className="font-medium">{director.name}</TableCell>
                        <TableCell>
                          <span className="px-2 py-1 rounded text-xs font-mono bg-gray-100">
                            {director.din}
                          </span>
                        </TableCell>
                        <TableCell>
                          {director.pan ? (
                            <span className="px-2 py-1 rounded text-xs font-mono bg-blue-100">
                              {director.pan}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs">Not Available</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2 justify-center">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewProfile(director.din)}
                              className="gap-1"
                              style={{ borderColor: '#75479C', color: '#75479C' }}
                              disabled={profileLoading}
                            >
                              <Eye className="h-3 w-3" />
                              View Profile
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewFamilyInfo(director.name)}
                              className="gap-1"
                              style={{ borderColor: '#75479C', color: '#75479C' }}
                            >
                              <Users className="h-3 w-3" />
                              Family Info
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditDialog(director)}
                              className="gap-1"
                              style={{ borderColor: '#0B74B0', color: '#0B74B0' }}
                            >
                              <Edit className="h-3 w-3" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteDirector(director.id)}
                              className="gap-1"
                              style={{ borderColor: '#BD3861', color: '#BD3861' }}
                            >
                              <Trash2 className="h-3 w-3" />
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Summary Stats */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card style={{ backgroundColor: '#f0e6f7', borderColor: '#75479C' }}>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold" style={{ color: '#75479C' }}>
                      {directors.length}
                    </div>
                    <div className="text-sm mt-1" style={{ color: '#666666' }}>
                      Total Directors
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card style={{ backgroundColor: '#e5f4fb', borderColor: '#0B74B0' }}>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold" style={{ color: '#0B74B0' }}>
                      {filteredDirectors.length}
                    </div>
                    <div className="text-sm mt-1" style={{ color: '#666666' }}>
                      Filtered Results
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card style={{ backgroundColor: '#fde8ee', borderColor: '#BD3861' }}>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold" style={{ color: '#BD3861' }}>
                      {new Set(directors.map(d => d.din)).size}
                    </div>
                    <div className="text-sm mt-1" style={{ color: '#666666' }}>
                      Unique DINs
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Add Director Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle style={{ color: '#75479C' }}>Add New Director</DialogTitle>
            <DialogDescription>
              Enter the details of the new director below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="add-name">Director Name *</Label>
              <Input
                id="add-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter director name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-din">DIN *</Label>
              <Input
                id="add-din"
                value={formData.din}
                onChange={(e) => setFormData(prev => ({ ...prev, din: e.target.value }))}
                placeholder="Enter DIN number"
                maxLength={8}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddDialogOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddDirector}
              disabled={submitting}
              style={{ backgroundColor: '#75479C', color: 'white' }}
            >
              {submitting ? 'Adding...' : 'Add Director'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Director Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle style={{ color: '#0B74B0' }}>Edit Director</DialogTitle>
            <DialogDescription>
              Update the director's information below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Director Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter director name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-din">DIN *</Label>
              <Input
                id="edit-din"
                value={formData.din}
                onChange={(e) => setFormData(prev => ({ ...prev, din: e.target.value }))}
                placeholder="Enter DIN number"
                maxLength={8}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-pan">PAN</Label>
              <Input
                id="edit-pan"
                value={formData.pan}
                onChange={(e) => setFormData(prev => ({ ...prev, pan: e.target.value }))}
                placeholder="Enter PAN"
                maxLength={10}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditDirector}
              disabled={submitting}
              style={{ backgroundColor: '#0B74B0', color: 'white' }}
            >
              {submitting ? 'Updating...' : 'Update Director'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Director Profile Modal */}
      <Dialog open={isProfileModalOpen} onOpenChange={(open) => {
        setIsProfileModalOpen(open);
        if (!open) {
          // Clear image upload state when closing modal
          setUploadedImage(null);
          setUploadStatus(null);
          setIsEditingProfile(false);
        }
      }}>
        <DialogContent className="bg-white max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle style={{ color: '#75479C' }}>Director Profile</DialogTitle>
            <DialogDescription>
              Detailed information about the director
            </DialogDescription>
          </DialogHeader>
          
          {selectedDirectorProfile && (
            <div className="space-y-6 py-4">
              {/* Profile Header */}
              <div className="text-center bg-gradient-to-r from-purple-500 to-indigo-600 text-white p-8 rounded-lg relative">
                {/* Profile Image Container */}
                <div className="mx-auto relative w-32 h-32 mb-4">
                  <img 
                    src={uploadedImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedDirectorProfile.name)}&size=120&background=667eea&color=fff&bold=true`}
                    alt={selectedDirectorProfile.name}
                    className="w-32 h-32 rounded-full border-4 border-white object-cover"
                  />
                  
                  {/* Upload Icon Overlay */}
                  <button
                    onClick={triggerFileInput}
                    className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 border-2 border-white rounded-full w-9 h-9 flex items-center justify-center transition-colors duration-200"
                    disabled={isUploading}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="17 8 12 3 7 8"></polyline>
                      <line x1="12" y1="3" x2="12" y2="15"></line>
                    </svg>
                  </button>
                  
                  {/* Hidden File Input */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                    disabled={isUploading}
                  />
                </div>
                
                {/* Director Name and DIN (non-editable) */}
                <h2 className="text-2xl font-bold">{selectedDirectorProfile.name}</h2>
                <p className="text-sm opacity-90">DIN: {selectedDirectorProfile.din}</p>
                
                {/* Upload Status Message */}
                {uploadStatus && (
                  <div className={`mt-4 px-4 py-2 rounded-md text-sm ${
                    uploadStatus.type === 'loading' 
                      ? 'bg-blue-100 text-blue-800' 
                      : uploadStatus.type === 'success' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                  }`}>
                    {uploadStatus.message}
                  </div>
                )}
              </div>
              
              {/* Profile Actions */}
              <div className="flex justify-end space-x-2">
                {isEditingProfile ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={handleCancelProfileEdit}
                      disabled={profileSaveLoading}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSaveProfileChanges}
                      disabled={profileSaveLoading}
                      style={{ backgroundColor: '#75479C', color: 'white' }}
                    >
                      {profileSaveLoading ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={() => setIsEditingProfile(true)}
                    style={{ backgroundColor: '#75479C', color: 'white' }}
                  >
                    Edit Profile
                  </Button>
                )}
              </div>
              
              {/* Profile Details */}
              <div className="space-y-4">
                {/* Date of Birth */}
                <div>
                  <p className="text-xs font-semibold uppercase text-gray-500 mb-1">Date of Birth</p>
                  {isEditingProfile ? (
                    <Input
                      type="date"
                      value={editableProfile.date_of_birth}
                      onChange={(e) => handleProfileFieldChange('date_of_birth', e.target.value)}
                    />
                  ) : (
                    <p className="text-base">
                      {selectedDirectorProfile.date_of_birth || 'Please enter the details'}
                    </p>
                  )}
                </div>
                
                {/* PAN */}
                <div>
                  <p className="text-xs font-semibold uppercase text-gray-500 mb-1">PAN</p>
                  {isEditingProfile ? (
                    <Input
                      value={editableProfile.pan}
                      onChange={(e) => handleProfileFieldChange('pan', e.target.value)}
                      placeholder="PAN Number"
                      maxLength={10}
                    />
                  ) : (
                    <p className="text-base font-mono bg-blue-100 px-2 py-1 rounded inline-block">
                      {selectedDirectorProfile.pan || 'Please enter the details'}
                    </p>
                  )}
                </div>
                
                {/* Qualification */}
                <div>
                  <p className="text-xs font-semibold uppercase text-gray-500 mb-1">Qualification</p>
                  {isEditingProfile ? (
                    <Input
                      value={editableProfile.qualification}
                      onChange={(e) => handleProfileFieldChange('qualification', e.target.value)}
                      placeholder="Qualification"
                    />
                  ) : (
                    <p className="text-base">
                      {selectedDirectorProfile.qualification || 'Please enter the details'}
                    </p>
                  )}
                </div>
                
                {/* Address */}
                <div>
                  <p className="text-xs font-semibold uppercase text-gray-500 mb-1">Address</p>
                  {isEditingProfile ? (
                    <textarea
                      value={editableProfile.address}
                      onChange={(e) => handleProfileFieldChange('address', e.target.value)}
                      className="w-full p-2 border rounded-md"
                      placeholder="Address"
                      rows={3}
                    />
                  ) : (
                    <p className="text-base text-gray-600">
                      {selectedDirectorProfile.address || 'Please enter the details'}
                    </p>
                  )}
                </div>
                
                {/* Experience */}
                <div>
                  <p className="text-xs font-semibold uppercase text-gray-500 mb-1">Experience</p>
                  {isEditingProfile ? (
                    <textarea
                      value={editableProfile.experience}
                      onChange={(e) => handleProfileFieldChange('experience', e.target.value)}
                      className="w-full p-2 border rounded-md"
                      placeholder="Experience Details"
                      rows={4}
                    />
                  ) : (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-base whitespace-pre-line">
                        {selectedDirectorProfile.experience || 'Please enter the details'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsProfileModalOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Image Crop Modal */}
      <Dialog open={showCropModal} onOpenChange={(open) => {
        if (!open) {
          handleCancelCrop();
        }
      }}>
        <DialogContent className="bg-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle style={{ color: '#75479C' }}>Crop Profile Image</DialogTitle>
            <DialogDescription>
              Adjust the image to fit within the profile circle
            </DialogDescription>
          </DialogHeader>
          
          {imageToCrop && (
            <div className="space-y-4 py-4">
              <div className="flex justify-center">
                <ReactCrop
                  crop={crop}
                  onChange={(c) => setCrop(c)}
                  onComplete={(c) => setCompletedCrop(c)}
                  aspect={1}
                  circularCrop
                  minWidth={100}
                  minHeight={100}
                >
                  <img 
                    ref={imgRef}
                    src={imageToCrop} 
                    alt="To crop" 
                    onLoad={onImageLoad}
                    className="max-w-full max-h-96"
                  />
                </ReactCrop>
              </div>
              
              <p className="text-center text-sm text-gray-600">
                Drag and resize the selection to adjust the crop area
              </p>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={handleCancelCrop}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCroppedImageUpload}
                  style={{ backgroundColor: '#75479C', color: 'white' }}
                  disabled={!completedCrop}
                >
                  Upload Image
                </Button>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCancelCrop}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Family Info Modal */}
      <FamilyInfoModal
        directorName={selectedDirectorName}
        isOpen={isFamilyInfoModalOpen}
        onClose={() => setIsFamilyInfoModalOpen(false)}
      />
    </div>
  );
};

export default DirectorsDisclosureMasterData;