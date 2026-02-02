import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Download, Users, Calendar, Clock, MapPin, AlertCircle, Eye, Plus, X } from 'lucide-react';
import ProductDashboardLayout from '@/components/layout/ProductDashboardLayout';
import { Home, FileSpreadsheet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { isAdmin } from '@/utils/adminAuth';
// Import template structures
import templateStructures from '@/template_structures.json';

const TemplateRenderer = () => {
  // Define navigation items for this product
  const navigationItems = [
    {
      id: 'home',
      label: 'Home',
      icon: Home,
      href: '/',
    },
    {
      id: 'dashboard',
      label: 'Minutes Generator',
      icon: FileText,
      href: '/minutes-preparation',
    },
    {
      id: 'generator',
      label: 'Generate Minutes',
      icon: FileText,
      href: '/minutes-preparation/generate',
    },
    {
      id: 'minutes',
      label: 'Meeting Minutes',
      icon: FileText,
      href: '/minutes-preparation/minutes',
    },
    {
      id: 'templates',
      label: 'Templates',
      icon: FileSpreadsheet,
      href: '/minutes-preparation/templates',
    },
    {
      id: 'renderer',
      label: 'Template Renderer',
      icon: Eye,
      href: '/minutes-preparation/renderer',
    }
  ];

  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Check authentication status on component mount
  useEffect(() => {
    setIsAuthenticated(isAdmin());
  }, []);

  // Add a listener for storage changes to detect login/logout
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'isAdmin' || e.key === 'adminToken') {
        setIsAuthenticated(isAdmin());
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also check authentication status when component mounts in case it changed
    setIsAuthenticated(isAdmin());
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Redirect to dashboard if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/minutes-preparation');
    }
  }, [isAuthenticated, navigate]);

  // State for form data
  const [formData, setFormData] = useState({
    template: 'Q1', // Default to Q1 template
    companyName: '',
    meetingNumber: '',
    meetingType: 'Board of Directors',
    meetingDay: '',
    meetingDate: '',
    meetingStartTime: '',
    meetingEndTime: '',
    meetingPlace: '',
    chairmanName: '',
    directors: [{ name: '', din: '' }],
    authorisedOfficer: '',
    previousMeetingDate: '',
    auditorPaymentAmount: '',
    auditorPaymentWords: '',
    financialYear: new Date().getFullYear().toString(),
    agmNumber: '',
    agmDay: '',
    agmDate: '',
    agmTime: '',
    agmPlace: '',
    recordingDate: new Date().toISOString().split('T')[0],
    signingDate: new Date().toISOString().split('T')[0],
    quorum: '',
    previousMinutes: '',
    concerns: '',
    declarations: '',
    auditorPayment: '',
    financialStatements: '',
    directorsReport: '',
  });

  // State for validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // State for submission status
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // State for template preview
  const [templateContent, setTemplateContent] = useState<any[]>([]);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user makes a selection
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Handle director changes
  const handleDirectorChange = (index: number, field: string, value: string) => {
    setFormData(prev => {
      const newDirectors = [...prev.directors];
      newDirectors[index] = { ...newDirectors[index], [field]: value };
      return { ...prev, directors: newDirectors };
    });
    
    // Clear error when user starts typing
    const errorKey = `director${field.charAt(0).toUpperCase() + field.slice(1)}${index}`;
    if (errors[errorKey]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }
  };

  // Add a new director
  const addDirector = () => {
    setFormData(prev => ({
      ...prev,
      directors: [...prev.directors, { name: '', din: '' }]
    }));
  };

  // Remove a director
  const removeDirector = (index: number) => {
    setFormData(prev => {
      const newDirectors = [...prev.directors];
      newDirectors.splice(index, 1);
      return { ...prev, directors: newDirectors };
    });
    
    // Remove errors for this director
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[`directorName${index}`];
      delete newErrors[`directorDin${index}`];
      return newErrors;
    });
  };

  // Validation function
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    // Validate template selection
    if (!formData.template) {
      newErrors.template = 'Please select a template';
    }
    
    // Required fields validation
    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Company name is required';
    }
    
    if (!formData.meetingNumber.trim()) {
      newErrors.meetingNumber = 'Meeting number is required';
    }
    
    if (!formData.meetingDate) {
      newErrors.meetingDate = 'Meeting date is required';
    }
    
    if (!formData.meetingStartTime) {
      newErrors.meetingStartTime = 'Start time is required';
    }
    
    if (!formData.meetingEndTime) {
      newErrors.meetingEndTime = 'End time is required';
    }
    
    if (!formData.meetingPlace.trim()) {
      newErrors.meetingPlace = 'Meeting place is required';
    }
    
    if (!formData.chairmanName.trim()) {
      newErrors.chairmanName = 'Chairman name is required';
    }
    
    // Validate directors
    if (formData.directors.length === 0) {
      newErrors.directors = 'At least one director is required';
    } else {
      formData.directors.forEach((director, index) => {
        if (!director.name.trim()) {
          newErrors[`directorName${index}`] = `Director ${index + 1} name is required`;
        }
        if (!director.din.trim()) {
          newErrors[`directorDin${index}`] = `Director ${index + 1} DIN is required`;
        }
      });
    }
    
    // Validate financial year
    if (!formData.financialYear.trim()) {
      newErrors.financialYear = 'Financial year is required';
    } else if (!/^\d{4}$/.test(formData.financialYear)) {
      newErrors.financialYear = 'Financial year must be a 4-digit number';
    }
    
    // Validate dates
    if (formData.meetingDate && formData.previousMeetingDate) {
      const meetingDate = new Date(formData.meetingDate);
      const previousMeetingDate = new Date(formData.previousMeetingDate);
      if (meetingDate < previousMeetingDate) {
        newErrors.meetingDate = 'Meeting date must be after previous meeting date';
      }
    }
    
    // Validate AGM date if provided
    if (formData.agmDate && formData.meetingDate) {
      const meetingDate = new Date(formData.meetingDate);
      const agmDate = new Date(formData.agmDate);
      if (agmDate < meetingDate) {
        newErrors.agmDate = 'AGM date must be after meeting date';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Use the full backend URL for the API call
      const response = await fetch('/generate-minutes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (response.ok) {
        const result = await response.json();
        // Trigger download of the generated file
        const downloadUrl = `/templates/${result.filename}`;
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = result.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        alert('Minutes document generated successfully!');
      } else {
        const error = await response.json();
        alert(`Error generating minutes document: ${error.detail}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error generating minutes document.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Load template content
  const loadTemplateContent = async () => {
    try {
      // Get the template structure based on the selected template
      const structure = templateStructures[formData.template as keyof typeof templateStructures] || [];
      setTemplateContent(structure);
    } catch (error) {
      console.error('Error loading template content:', error);
      setTemplateContent([]);
    }
  };

  // Load template content when component mounts or template/form data changes
  useEffect(() => {
    loadTemplateContent();
  }, [formData.template, formData]);

  // Get form value with proper typing
  const getFormValue = (fieldName: string): string => {
    const value = formData[fieldName as keyof typeof formData];
    if (Array.isArray(value)) {
      return ''; // Return empty string for array values (directors)
    }
    return value as string || '';
  };

  // Map placeholder names to form field names
  const placeholderToFieldMap: Record<string, string> = {
    '[No. of Meeting]': 'meetingNumber',
    '[Type of Meeting]': 'meetingType',
    '[Name of Company]': 'companyName',
    '[Day of Meeting]': 'meetingDay',
    '[Date of Meeting]': 'meetingDate',
    '[Time: COMMENCED AT]': 'meetingStartTime',
    '[Time: CONCLUDED AT]': 'meetingEndTime',
    '[Place of Meeting]': 'meetingPlace',
    '[Manual]': 'chairmanName',
    '[Auto]': 'previousMeetingDate',
    '[from MCA]': 'directors',
    '[From website: MCA]': 'agmPlace',
    '20____': 'financialYear',
    '[Recording Date]': 'recordingDate',
    '[Signing Date]': 'signingDate'
  };

  // Render template content with placeholders
  const renderTemplateContent = () => {
    if (templateContent.length === 0) {
      return (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          <div className="text-center">
            <FileText className="h-12 w-12 mx-auto mb-2" />
            <p>Select a template to preview</p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {templateContent.map((element, index) => {
          if (element.type === 'paragraph') {
            return (
              <p key={index} className="mb-2">
                {element.segments.map((segment: any, segIndex: number) => {
                  if (segment.is_placeholder) {
                    const fieldName = placeholderToFieldMap[segment.text] || segment.text.replace(/[\[\]]/g, '');
                    
                    // Special handling for different types of placeholders
                    if (segment.text === '[from MCA]') {
                      // For director placeholders, show the first director's name
                      return (
                        <span key={segIndex} className="inline-block mx-1">
                          <Input
                            type="text"
                            value={formData.directors[0]?.name || ''}
                            onChange={(e) => handleDirectorChange(0, 'name', e.target.value)}
                            placeholder="Director Name"
                            className="w-32 inline-block mx-1 text-sm"
                          />
                        </span>
                      );
                    } else if (segment.text === '[Manual]') {
                      // For Manual placeholders, use chairmanName
                      return (
                        <span key={segIndex} className="inline-block mx-1">
                          <Input
                            type="text"
                            value={formData.chairmanName}
                            onChange={(e) => handleInputChange({ target: { name: 'chairmanName', value: e.target.value } } as any)}
                            placeholder="Chairman Name"
                            className="w-32 inline-block mx-1 text-sm"
                          />
                        </span>
                      );
                    } else {
                      // For other placeholders, map to appropriate form fields
                      return (
                        <span key={segIndex} className="inline-block mx-1">
                          <Input
                            type={fieldName.includes('Date') ? 'date' : 'text'}
                            value={getFormValue(fieldName)}
                            onChange={(e) => handleInputChange({ target: { name: fieldName, value: e.target.value } } as any)}
                            placeholder={segment.text}
                            className="w-32 inline-block mx-1 text-sm"
                          />
                        </span>
                      );
                    }
                  } else {
                    return <span key={segIndex}>{segment.text}</span>;
                  }
                })}
              </p>
            );
          } else if (element.type === 'table') {
            return (
              <div key={index} className="mb-4">
                <h3 className="font-semibold mb-2">Directors:</h3>
                {formData.directors.map((director, dirIndex) => (
                  <div key={dirIndex} className="flex gap-2 mb-2">
                    <Input
                      value={director.name}
                      onChange={(e) => handleDirectorChange(dirIndex, 'name', e.target.value)}
                      placeholder="Director Name"
                      className="flex-1"
                    />
                    <Input
                      value={director.din}
                      onChange={(e) => handleDirectorChange(dirIndex, 'din', e.target.value)}
                      placeholder="DIN"
                      className="w-32"
                    />
                    {formData.directors.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removeDirector(dirIndex)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addDirector}
                  className="mt-2"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Director
                </Button>
              </div>
            );
          }
          return null;
        })}
      </div>
    );
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto py-6">
        <div className="max-w-md mx-auto mt-20">
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-gray-900">Access Denied</CardTitle>
              <CardDescription className="text-gray-600">
                You need to be logged in as an administrator to access this feature.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => navigate('/minutes-preparation')}
              >
                
                Return to Login
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <ProductDashboardLayout 
      productName="Minutes Generator" 
      productRoute="/minutes-preparation"
      navigationItems={navigationItems}
    >
      <div className="container mx-auto py-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold">Template Renderer</h1>
            <p className="text-muted-foreground">Preview templates and fill in placeholders directly</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Template Preview Panel */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-6 w-6" />
                Template Preview
              </CardTitle>
              <CardDescription>
                Preview of the selected template with placeholder locations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg p-4 min-h-[400px] bg-muted/10">
                {renderTemplateContent()}
              </div>
              
              <div className="mt-4 space-y-2">
                <Label htmlFor="template">Select Template</Label>
                <Select 
                  value={formData.template} 
                  onValueChange={(value) => handleSelectChange('template', value)}
                >
                  <SelectTrigger className={`bg-white ${errors.template ? "border-red-500" : ""}`}>
                    <SelectValue placeholder="Select a template" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="Q1" className="bg-white">Q1 Meeting Template</SelectItem>
                    <SelectItem value="Q2" className="bg-white">Q2 Meeting Template</SelectItem>
                    <SelectItem value="Q3" className="bg-white">Q3 Meeting Template</SelectItem>
                    <SelectItem value="Q4" className="bg-white">Q4 Meeting Template</SelectItem>
                  </SelectContent>
                </Select>
                {errors.template && (
                  <div className="text-red-500 text-sm flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.template}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Form Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-6 w-6" />
                Fill Placeholders
              </CardTitle>
              <CardDescription>
                Enter information for the template placeholders
              </CardDescription>
            </CardHeader>
            <CardContent>
              {Object.keys(errors).length > 0 && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    <h3 className="font-semibold text-red-800">Please correct the following errors:</h3>
                  </div>
                  <ul className="list-disc pl-5 space-y-1 text-red-700">
                    {Object.entries(errors).map(([key, value]) => (
                      <li key={key}>{value}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Company & Meeting Metadata */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border rounded-lg">
                  <div className="md:col-span-2">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Company & Meeting Metadata
                    </h3>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name *</Label>
                    <Input
                      id="companyName"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleInputChange}
                      placeholder="Enter company name"
                      className={errors.companyName ? "border-red-500" : ""}
                    />
                    {errors.companyName && (
                      <div className="text-red-500 text-sm flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {errors.companyName}
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="meetingNumber">Meeting Number *</Label>
                    <Input
                      id="meetingNumber"
                      name="meetingNumber"
                      value={formData.meetingNumber}
                      onChange={handleInputChange}
                      placeholder="e.g., 1st, 2nd, 3rd"
                      className={errors.meetingNumber ? "border-red-500" : ""}
                    />
                    {errors.meetingNumber && (
                      <div className="text-red-500 text-sm flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {errors.meetingNumber}
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="meetingType">Meeting Type</Label>
                    <Select 
                      value={formData.meetingType} 
                      onValueChange={(value) => handleSelectChange('meetingType', value)}
                    >
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="Select meeting type" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value="Board of Directors" className="bg-white">Board of Directors</SelectItem>
                        <SelectItem value="Committee Meeting" className="bg-white">Committee Meeting</SelectItem>
                        <SelectItem value="Annual General Meeting" className="bg-white">Annual General Meeting</SelectItem>
                        <SelectItem value="Extraordinary General Meeting" className="bg-white">Extraordinary General Meeting</SelectItem>
                        <SelectItem value="Quarterly Meeting" className="bg-white">Quarterly Meeting</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="meetingDay">Day of Meeting</Label>
                    <Input
                      id="meetingDay"
                      name="meetingDay"
                      value={formData.meetingDay}
                      onChange={handleInputChange}
                      placeholder="e.g., Monday"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="meetingDate">Date of Meeting *</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="meetingDate"
                        name="meetingDate"
                        type="date"
                        value={formData.meetingDate}
                        onChange={handleInputChange}
                        className={`pl-10 ${errors.meetingDate ? "border-red-500" : ""}`}
                      />
                    </div>
                    {errors.meetingDate && (
                      <div className="text-red-500 text-sm flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {errors.meetingDate}
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="meetingStartTime">Time: COMMENCED AT *</Label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="meetingStartTime"
                        name="meetingStartTime"
                        type="time"
                        value={formData.meetingStartTime}
                        onChange={handleInputChange}
                        className={`pl-10 ${errors.meetingStartTime ? "border-red-500" : ""}`}
                      />
                    </div>
                    {errors.meetingStartTime && (
                      <div className="text-red-500 text-sm flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {errors.meetingStartTime}
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="meetingEndTime">Time: CONCLUDED AT *</Label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="meetingEndTime"
                        name="meetingEndTime"
                        type="time"
                        value={formData.meetingEndTime}
                        onChange={handleInputChange}
                        className={`pl-10 ${errors.meetingEndTime ? "border-red-500" : ""}`}
                      />
                    </div>
                    {errors.meetingEndTime && (
                      <div className="text-red-500 text-sm flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {errors.meetingEndTime}
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="meetingPlace">Place of Meeting *</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="meetingPlace"
                        name="meetingPlace"
                        value={formData.meetingPlace}
                        onChange={handleInputChange}
                        placeholder="Enter meeting location"
                        className={`pl-10 ${errors.meetingPlace ? "border-red-500" : ""}`}
                      />
                    </div>
                    {errors.meetingPlace && (
                      <div className="text-red-500 text-sm flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {errors.meetingPlace}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Attendees / Directors */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border rounded-lg">
                  <div className="md:col-span-2">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Attendees / Directors
                    </h3>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="chairmanName">Chairman Name *</Label>
                    <Input
                      id="chairmanName"
                      name="chairmanName"
                      value={formData.chairmanName}
                      onChange={handleInputChange}
                      placeholder="Enter chairman name"
                      className={errors.chairmanName ? "border-red-500" : ""}
                    />
                    {errors.chairmanName && (
                      <div className="text-red-500 text-sm flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {errors.chairmanName}
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2 md:col-span-2">
                    <Label>Directors *</Label>
                    {formData.directors.map((director, index) => (
                      <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                        <div>
                          <Input
                            value={director.name}
                            onChange={(e) => handleDirectorChange(index, 'name', e.target.value)}
                            placeholder={`Director ${index + 1} name`}
                            className={errors[`directorName${index}`] ? "border-red-500" : ""}
                          />
                          {errors[`directorName${index}`] && (
                            <div className="text-red-500 text-sm flex items-center gap-1 mt-1">
                              <AlertCircle className="h-4 w-4" />
                              {errors[`directorName${index}`]}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <Input
                              value={director.din}
                              onChange={(e) => handleDirectorChange(index, 'din', e.target.value)}
                              placeholder={`DIN`}
                              className={errors[`directorDin${index}`] ? "border-red-500" : ""}
                            />
                            {errors[`directorDin${index}`] && (
                              <div className="text-red-500 text-sm flex items-center gap-1 mt-1">
                                <AlertCircle className="h-4 w-4" />
                                {errors[`directorDin${index}`]}
                              </div>
                            )}
                          </div>
                          {formData.directors.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => removeDirector(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addDirector}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Director
                    </Button>
                    {errors.directors && (
                      <div className="text-red-500 text-sm flex items-center gap-1 mt-1">
                        <AlertCircle className="h-4 w-4" />
                        {errors.directors}
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="authorisedOfficer">Authorised Officer</Label>
                    <Input
                      id="authorisedOfficer"
                      name="authorisedOfficer"
                      value={formData.authorisedOfficer}
                      onChange={handleInputChange}
                      placeholder="Enter authorised officer name"
                    />
                  </div>
                </div>
                
                {/* Minutes Confirmation & Legal Sections */}
                <div className="grid grid-cols-1 gap-6 p-4 border rounded-lg">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Minutes Confirmation & Legal Sections</h3>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="previousMeetingDate">Previous Meeting Date</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="previousMeetingDate"
                        name="previousMeetingDate"
                        type="date"
                        value={formData.previousMeetingDate}
                        onChange={handleInputChange}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="quorum">Quorum Assessment</Label>
                    <Textarea
                      id="quorum"
                      name="quorum"
                      value={formData.quorum}
                      onChange={handleInputChange}
                      placeholder="Describe how quorum was assessed and confirmed"
                      rows={3}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="previousMinutes">Previous Meeting Minutes</Label>
                    <Textarea
                      id="previousMinutes"
                      name="previousMinutes"
                      value={formData.previousMinutes}
                      onChange={handleInputChange}
                      placeholder="Details about confirmation of previous meeting minutes"
                      rows={3}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="concerns">Concerns/Interests (Section 184)</Label>
                    <Textarea
                      id="concerns"
                      name="concerns"
                      value={formData.concerns}
                      onChange={handleInputChange}
                      placeholder="Details about concerns or interests declared"
                      rows={3}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="declarations">Declarations (Section 164(2))</Label>
                    <Textarea
                      id="declarations"
                      name="declarations"
                      value={formData.declarations}
                      onChange={handleInputChange}
                      placeholder="Details about declarations received"
                      rows={3}
                    />
                  </div>
                </div>
                
                {/* Financial Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border rounded-lg">
                  <div className="md:col-span-2">
                    <h3 className="text-lg font-semibold mb-4">Financial Information</h3>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="auditorPaymentAmount">Payment to Auditor (Amount)</Label>
                    <Input
                      id="auditorPaymentAmount"
                      name="auditorPaymentAmount"
                      value={formData.auditorPaymentAmount}
                      onChange={handleInputChange}
                      placeholder="e.g., 25000"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="auditorPaymentWords">Payment to Auditor (In Words)</Label>
                    <Input
                      id="auditorPaymentWords"
                      name="auditorPaymentWords"
                      value={formData.auditorPaymentWords}
                      onChange={handleInputChange}
                      placeholder="e.g., Twenty Five Thousand Only"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="financialYear">Financial Year *</Label>
                    <Input
                      id="financialYear"
                      name="financialYear"
                      value={formData.financialYear}
                      onChange={handleInputChange}
                      placeholder="e.g., 2024"
                      className={errors.financialYear ? "border-red-500" : ""}
                    />
                    {errors.financialYear && (
                      <div className="text-red-500 text-sm flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {errors.financialYear}
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="auditorPayment">Auditor Payment Approval</Label>
                    <Textarea
                      id="auditorPayment"
                      name="auditorPayment"
                      value={formData.auditorPayment}
                      onChange={handleInputChange}
                      placeholder="Details about auditor payment approval"
                      rows={3}
                    />
                  </div>
                  
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="financialStatements">Financial Statements Approval</Label>
                    <Textarea
                      id="financialStatements"
                      name="financialStatements"
                      value={formData.financialStatements}
                      onChange={handleInputChange}
                      placeholder="Details about financial statements approval"
                      rows={3}
                    />
                  </div>
                  
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="directorsReport">Directors' Report Approval</Label>
                    <Textarea
                      id="directorsReport"
                      name="directorsReport"
                      value={formData.directorsReport}
                      onChange={handleInputChange}
                      placeholder="Details about directors' report approval"
                      rows={3}
                    />
                  </div>
                </div>
                
                {/* Annual General Meeting Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 border rounded-lg">
                  <div className="md:col-span-3">
                    <h3 className="text-lg font-semibold mb-4">Annual General Meeting Section</h3>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="agmNumber">AGM Number</Label>
                    <Input
                      id="agmNumber"
                      name="agmNumber"
                      value={formData.agmNumber}
                      onChange={handleInputChange}
                      placeholder="e.g., 10th"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="agmDay">AGM Day</Label>
                    <Input
                      id="agmDay"
                      name="agmDay"
                      value={formData.agmDay}
                      onChange={handleInputChange}
                      placeholder="e.g., Friday"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="agmDate">AGM Date</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="agmDate"
                        name="agmDate"
                        type="date"
                        value={formData.agmDate}
                        onChange={handleInputChange}
                        className={`pl-10 ${errors.agmDate ? "border-red-500" : ""}`}
                      />
                    </div>
                    {errors.agmDate && (
                      <div className="text-red-500 text-sm flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {errors.agmDate}
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="agmTime">AGM Time</Label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="agmTime"
                        name="agmTime"
                        type="time"
                        value={formData.agmTime}
                        onChange={handleInputChange}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="agmPlace">AGM Place</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="agmPlace"
                        name="agmPlace"
                        value={formData.agmPlace}
                        onChange={handleInputChange}
                        placeholder="Enter AGM location"
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Footer Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 border rounded-lg">
                  <div className="md:col-span-3">
                    <h3 className="text-lg font-semibold mb-4">Footer Section</h3>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="recordingDate">Date of Recording</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="recordingDate"
                        name="recordingDate"
                        type="date"
                        value={formData.recordingDate}
                        onChange={handleInputChange}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signingDate">Date of Signing</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="signingDate"
                        name="signingDate"
                        type="date"
                        value={formData.signingDate}
                        onChange={handleInputChange}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Submit Button */}
                <div className="flex justify-center pt-4">
                  <Button 
                    type="submit" 
                    className="flex items-center gap-2 px-6 py-3"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                        Generating...
                      </>
                    ) : (
                      <>
                        <Download className="h-5 w-5" />
                        Generate Minutes Document
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProductDashboardLayout>
  );
};

export default TemplateRenderer;