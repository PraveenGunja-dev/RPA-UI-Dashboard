import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Download, Plus, X, ArrowLeft, Calendar, Clock, MapPin, Users, FileText, Building, User, Hash, AlertCircle, FileSpreadsheet, Trash2, Eye, ChevronRight, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DirectorSelector from '@/components/DirectorSelector';
import MultiDirectorSelector from '@/components/MultiDirectorSelector';
import ProductDashboardLayout from '@/components/layout/ProductDashboardLayout';
import { Home, FileText as FileTextIcon } from 'lucide-react';
import { isAdmin } from '@/utils/adminAuth';
import PlaceSelector from '@/components/PlaceSelector';

// Stepper component
const Stepper = ({ steps, currentStep }: { steps: string[], currentStep: number }) => {
  const progress = ((currentStep + 1) / steps.length) * 100;
  
  return (
    <div className="flex flex-col items-center w-full mb-8">
      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-in-out" 
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      
      {/* Step indicators */}
      <div className="flex items-center justify-center w-full">
        {steps.map((step, index) => (
          <div key={index} className="flex items-center">
            <div 
              className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all duration-200 ${
                index === currentStep 
                  ? 'bg-blue-600 border-blue-600 text-white scale-110' 
                  : index < currentStep 
                    ? 'bg-green-500 border-green-500 text-white' 
                    : 'bg-white border-gray-300 text-gray-500'
              }`}
            >
              {index < currentStep ? '✓' : index + 1}
            </div>
            <span className={`mx-2 text-sm font-medium transition-colors duration-200 ${
              index === currentStep ? 'text-blue-600 font-bold' : 'text-gray-500'
            }`}>
              {step}
            </span>
            {index < steps.length - 1 && (
              <div className={`w-8 h-0.5 ${index < currentStep ? 'bg-green-500' : 'bg-gray-300'}`}></div>
            )}
          </div>
        ))}
      </div>
      <div className="mt-2 text-sm text-gray-500">
        Step {currentStep + 1} of {steps.length}
      </div>
    </div>
  );
};

// Preview component
const PreviewSection = ({ formData }: { formData: any }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">Company Information</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p><span className="font-medium">Company Name:</span> {formData.companyName || 'Not provided'}</p>
            <p><span className="font-medium">Meeting Place:</span> {formData.meetingPlace || 'Not provided'}</p>
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-semibold mb-2">Meeting Details</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p><span className="font-medium">Meeting Number:</span> {formData.meetingNumber || 'Not provided'}</p>
            <p><span className="font-medium">Meeting Type:</span> {formData.meetingType || 'Not provided'}</p>
            <p><span className="font-medium">Date:</span> {formData.meetingDate || 'Not provided'}</p>
            <p><span className="font-medium">Time:</span> {formData.meetingStartTime} - {formData.meetingEndTime}</p>
          </div>
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-2">Directors</h3>
        <div className="bg-gray-50 p-4 rounded-lg">
          {formData.directors && formData.directors.length > 0 ? (
            <ul className="list-disc pl-5">
              {formData.directors.map((director: any, index: number) => (
                <li key={index}>
                  {director.name} (DIN: {director.din || 'Not provided'})
                </li>
              ))}
            </ul>
          ) : (
            <p>Not provided</p>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">Financial Information</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p><span className="font-medium">Financial Year:</span> {formData.financialYear || 'Not provided'}</p>
            <p><span className="font-medium">Auditor Payment:</span> {formData.auditorPaymentAmount ? `₹${formData.auditorPaymentAmount} (${formData.auditorPaymentWords})` : 'Not provided'}</p>
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-semibold mb-2">Additional Information</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p><span className="font-medium">Chairman:</span> {formData.chairmanName || 'Not provided'}</p>
            <p><span className="font-medium">Authorised Officer:</span> {formData.authorisedOfficer || 'Not provided'}</p>
            <p><span className="font-medium">Recording Date:</span> {formData.recordingDate || 'Not provided'}</p>
            <p><span className="font-medium">Signing Date:</span> {formData.signingDate || 'Not provided'}</p>
            <p><span className="font-medium">Signing Place:</span> {formData.signingPlace || 'Not provided'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const MinutesGenerator = () => {
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
      icon: FileTextIcon,
      href: '/minutes-preparation',
    },
    {
      id: 'generator',
      label: 'Generate Minutes',
      icon: FileText,
      href: '/minutes-preparation/generate',
    },
    {
      id: 'ai-mom',
      label: 'AI MOM',
      icon: FileText,
      href: '/minutes-preparation/ai-assistant',
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

  // Predefined company data
  const companyPresets = [
    {
      name: "Adani Enterprises Limited",
      address: "World Trade Centre, Tower 14, 17th Floor, Cuffe Parade, Mumbai - 400005",
      directors: [
        { name: "Gautam Adani", din: "00222019" },
        { name: "Vinod Adani", din: "00222020" },
        { name: "Ashish Kundra", din: "00222021" }
      ]
    },
    {
      name: "Adani Green Energy Limited",
      address: "World Trade Centre, Tower 14, 17th Floor, Cuffe Parade, Mumbai - 400005",
      directors: [
        { name: "Gautam Adani", din: "00222019" },
        { name: "Vinod Adani", din: "00222020" },
        { name: "Ashish Kundra", din: "00222021" }
      ]
    }
  ];

  // Predefined places
  const placeOptions = [
    "Ahmedabad",
    "Mumbai",
    "World Trade Centre, Tower 14, 17th Floor, Cuffe Parade, Mumbai - 400005"
  ];

  // Predefined meeting types
  const meetingTypes = [
    { value: "Board of Directors", label: "Board of Directors" },
    { value: "Committee Meeting", label: "Committee Meeting" },
    { value: "Annual General Meeting", label: "Annual General Meeting" },
    { value: "Extraordinary General Meeting", label: "Extraordinary General Meeting" },
    { value: "Quarterly Meeting", label: "Quarterly Meeting" }
  ];

  // Predefined template options
  const templateOptions = [
    { value: "Q1", label: "Q1 Meeting Template" },
    { value: "Q2", label: "Q2 Meeting Template" },
    { value: "Q3", label: "Q3 Meeting Template" },
    { value: "Q4", label: "Q4 Meeting Template" }
  ];

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
    signingPlace: '',
    quorum: '',
    previousMinutes: '',
    concerns: '',
    declarations: '',
    auditorPayment: '',
    financialStatements: '',
    directorsReport: '',
  });

  // Stepper state
  const [currentStep, setCurrentStep] = useState(0);
  const steps = ['Template & Company', 'Meeting Details', 'Directors', 'Financial Info', 'Review & Generate'];
  
  // Force re-render when step changes
  const [stepKey, setStepKey] = useState(0);
  
  // Update step key when currentStep changes
  useEffect(() => {
    setStepKey(prev => prev + 1);
  }, [currentStep]);
  
  // State for validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // State for submission status
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State for directors data
  const [directorsData, setDirectorsData] = useState<{name: string, din: string}[]>([]);
  const [isLoadingDirectors, setIsLoadingDirectors] = useState(false);
  
  // Fetch directors data from database
  const fetchDirectorsData = async () => {
    setIsLoadingDirectors(true);
    try {
      const response = await fetch('/directors');
      if (response.ok) {
        const result = await response.json();
        // Convert to the format expected by our components
        const directors = result.data.map((director: any) => ({
          name: director.name,
          din: director.din
        }));
        setDirectorsData(directors);
      } else {
        console.error('Failed to fetch directors data');
      }
    } catch (error) {
      console.error('Error fetching directors data:', error);
    } finally {
      setIsLoadingDirectors(false);
    }
  };
  
  // Load directors data on component mount
  useEffect(() => {
    fetchDirectorsData();
  }, []);

  // Validation function for each step
  const validateStep = (step: number) => {
    const newErrors: Record<string, string> = {};
    
    switch (step) {
      case 0: // Template & Company
        if (!formData.template) {
          newErrors.template = 'Please select a template';
        }
        if (!formData.companyName.trim()) {
          newErrors.companyName = 'Company name is required';
        }
        if (!formData.meetingNumber.trim()) {
          newErrors.meetingNumber = 'Meeting number is required';
        }
        break;
      case 1: // Meeting Details
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
        break;
      case 2: // Directors
        if (!formData.chairmanName.trim()) {
          newErrors.chairmanName = 'Chairman name is required';
        }
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
        break;
      case 3: // Financial Info
        if (!formData.financialYear.trim()) {
          newErrors.financialYear = 'Financial year is required';
        } else if (!/^\d{4}$/.test(formData.financialYear)) {
          newErrors.financialYear = 'Financial year must be a 4-digit number';
        }
        break;
      default:
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Special handling for meetingNumber to preserve ordinal format
    if (name === 'meetingNumber') {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
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
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
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

  // Add new director
  const addDirector = () => {
    setFormData(prev => ({
      ...prev,
      directors: [...prev.directors, { name: '', din: '' }]
    }));
  };

  // Remove director
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

  // Auto-populate company data when company name is selected
  const handleCompanySelect = (companyName: string) => {
    const selectedCompany = companyPresets.find(company => company.name === companyName);
    if (selectedCompany) {
      setFormData(prev => ({
        ...prev,
        companyName: selectedCompany.name,
        meetingPlace: selectedCompany.address,
        directors: [...selectedCompany.directors],
        chairmanName: selectedCompany.directors[0]?.name || ''
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        companyName: companyName
      }));
    }
  };

  // Simple number to ordinal conversion
  const numberToOrdinal = (num: number): string => {
    const ordinals = ['th', 'st', 'nd', 'rd'];
    const v = num % 100;
    return num + (ordinals[(v - 20) % 10] || ordinals[v] || ordinals[0]);
  };

  // Handle meeting number change with smart conversion
  const handleMeetingNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // If user enters a number, convert it to ordinal
    if (/^\d+$/.test(value)) {
      const num = parseInt(value);
      if (num > 0) {
        handleSelectChange('meetingNumber', numberToOrdinal(num));
        return;
      }
    }
    handleSelectChange('meetingNumber', value);
  };

  // Handle meeting date change with auto day population
  const handleMeetingDateChange = (date: string) => {
    setFormData(prev => ({
      ...prev,
      meetingDate: date,
      meetingDay: date ? new Date(date).toLocaleDateString('en-US', { weekday: 'long' }) : ''
    }));
    
    // Clear error when user selects a date
    if (errors.meetingDate) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.meetingDate;
        return newErrors;
      });
    }
  };

  // Handle time range change
  const handleTimeRangeChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user selects a time
    const errorField = field === 'meetingStartTime' ? 'meetingStartTime' : 'meetingEndTime';
    if (errors[errorField]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[errorField];
        return newErrors;
      });
    }
  };

  // Auto-populate auditor payment words based on number
  const handleAuditorPaymentAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData(prev => ({
      ...prev,
      auditorPaymentAmount: value,
      auditorPaymentWords: numberToWords(parseInt(value) || 0)
    }));
  };

  // Simple number to words conversion (basic implementation)
  const numberToWords = (num: number): string => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
    if (num === 0) return 'Zero';
    
    if (num < 10) return ones[num];
    if (num < 20) return teens[num - 10];
    if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? ' ' + ones[num % 10] : '');
    
    return num.toString(); // For larger numbers, return as string
  };

  // Handle step navigation
  const goToNextStep = () => {
    if (validateStep(currentStep)) {
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const goToPreviousStep = () => {
    // Only allow going back on the review step
    if (currentStep === 4 && currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
            <h1 className="text-3xl font-bold">Generate Meeting Minutes</h1>
            <p className="text-muted-foreground">Create professional meeting minutes documents</p>
          </div>
        </div>

        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-6 w-6" />
              Meeting Minutes Form
            </CardTitle>
            <CardDescription>
              Fill in the details below to generate a professional meeting minutes document
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Stepper steps={steps} currentStep={currentStep} />
            
            {Object.keys(errors).length > 0 && currentStep < 4 && (
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
            
            <form onSubmit={handleSubmit} className="space-y-6" key={stepKey}>
              {/* Step 0: Template & Company */}
              {currentStep === 0 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 p-4 border rounded-lg">
                    <div>
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Template Selection
                      </h3>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="template">Minutes Template *</Label>
                      <Select 
                        value={formData.template} 
                        onValueChange={(value) => handleSelectChange('template', value)}
                      >
                        <SelectTrigger className={`bg-white ${errors.template ? "border-red-500" : ""}`}>
                          <SelectValue placeholder="Select a template" />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                          {templateOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value} className="bg-white">
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.template && (
                        <div className="text-red-500 text-sm flex items-center gap-1">
                          <AlertCircle className="h-4 w-4" />
                          {errors.template}
                        </div>
                      )}
                      <p className="text-sm text-muted-foreground">
                        Select the appropriate template for your meeting quarter
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border rounded-lg">
                    <div className="md:col-span-2">
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Company Information
                      </h3>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="companyName">Company Name *</Label>
                      <Select 
                        value={formData.companyName} 
                        onValueChange={handleCompanySelect}
                      >
                        <SelectTrigger className={`bg-white ${errors.companyName ? "border-red-500" : ""}`}>
                          <SelectValue placeholder="Select or enter company name" />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                          {companyPresets.map((company, index) => (
                            <SelectItem key={index} value={company.name} className="bg-white">
                              {company.name}
                            </SelectItem>
                          ))}
                          <SelectItem value="" className="bg-white">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      {formData.companyName === "" && (
                        <Input
                          id="companyName"
                          name="companyName"
                          value={formData.companyName}
                          onChange={handleInputChange}
                          placeholder="Enter company name"
                          className={errors.companyName ? "border-red-500" : ""}
                        />
                      )}
                      {errors.companyName && (
                        <div className="text-red-500 text-sm flex items-center gap-1">
                          <AlertCircle className="h-4 w-4" />
                          {errors.companyName}
                        </div>
                      )}
                      <p className="text-sm text-muted-foreground">
                        Select a company from the list or enter a new one
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="meetingNumber">Meeting Number *</Label>
                      <Input
                        id="meetingNumber"
                        name="meetingNumber"
                        type="number"
                        min="1"
                        value={formData.meetingNumber.replace(/(st|nd|rd|th)$/, '')}
                        onChange={handleMeetingNumberChange}
                        placeholder="e.g., 1"
                        className={errors.meetingNumber ? "border-red-500" : ""}
                      />
                      {errors.meetingNumber && (
                        <div className="text-red-500 text-sm flex items-center gap-1">
                          <AlertCircle className="h-4 w-4" />
                          {errors.meetingNumber}
                        </div>
                      )}
                      <p className="text-sm text-muted-foreground">
                        Enter a number and it will be automatically converted to ordinal (e.g., 1 → 1st)
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Step 1: Meeting Details */}
              {currentStep === 1 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border rounded-lg">
                  <div className="md:col-span-2">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Meeting Details
                    </h3>
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
                        {meetingTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value} className="bg-white">
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      Select the type of meeting being held
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="meetingDate">Date & Day of Meeting *</Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="meetingDate"
                          name="meetingDate"
                          type="date"
                          value={formData.meetingDate}
                          onChange={(e) => handleMeetingDateChange(e.target.value)}
                          className={`pl-10 ${errors.meetingDate ? "border-red-500" : ""}`}
                        />
                      </div>
                      <Input
                        id="meetingDay"
                        name="meetingDay"
                        value={formData.meetingDay}
                        placeholder="Day"
                        className="w-24"
                        readOnly
                      />
                    </div>
                    {errors.meetingDate && (
                      <div className="text-red-500 text-sm flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {errors.meetingDate}
                      </div>
                    )}
                    <p className="text-sm text-muted-foreground">
                      Select the date when the meeting was held and the day will be automatically populated
                    </p>
                  </div>
                  
                  <div className="space-y-2 md:col-span-2">
                    <Label>Time Range: COMMENCED AT to CONCLUDED AT *</Label>
                    <div className="flex items-center gap-4">
                      <div className="relative flex-1">
                        <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="meetingStartTime"
                          name="meetingStartTime"
                          type="time"
                          value={formData.meetingStartTime}
                          onChange={(e) => handleTimeRangeChange('meetingStartTime', e.target.value)}
                          className={`pl-10 ${errors.meetingStartTime ? "border-red-500" : ""}`}
                        />
                      </div>
                      <span className="text-muted-foreground">to</span>
                      <div className="relative flex-1">
                        <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="meetingEndTime"
                          name="meetingEndTime"
                          type="time"
                          value={formData.meetingEndTime}
                          onChange={(e) => handleTimeRangeChange('meetingEndTime', e.target.value)}
                          className={`pl-10 ${errors.meetingEndTime ? "border-red-500" : ""}`}
                        />
                      </div>
                    </div>
                    {errors.meetingStartTime && (
                      <div className="text-red-500 text-sm flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {errors.meetingStartTime}
                      </div>
                    )}
                    {errors.meetingEndTime && (
                      <div className="text-red-500 text-sm flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {errors.meetingEndTime}
                      </div>
                    )}
                    <p className="text-sm text-muted-foreground">
                      Select the start and end time of the meeting
                    </p>
                  </div>
                  
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="meetingPlace">Place of Meeting *</Label>
                    <PlaceSelector
                      id="meetingPlace"
                      label="Place of Meeting"
                      value={formData.meetingPlace}
                      onChange={(value) => handleSelectChange('meetingPlace', value)}
                      placeholder="Select or add a meeting place"
                    />
                    {errors.meetingPlace && (
                      <div className="text-red-500 text-sm flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {errors.meetingPlace}
                      </div>
                    )}
                    <p className="text-sm text-muted-foreground">
                      Select or add the location where the meeting was held
                    </p>
                  </div>
                </div>
              )}
              
              {/* Step 2: Directors */}
              {currentStep === 2 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border rounded-lg">
                  <div className="md:col-span-2">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Attendees / Directors
                    </h3>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Directors Present</h3>
                    {isLoadingDirectors ? (
                      <div className="text-gray-500">Loading directors data...</div>
                    ) : (
                      <MultiDirectorSelector
                        id="directors"
                        label="Select Directors"
                        value={formData.directors}
                        onChange={(directors) => setFormData(prev => ({ ...prev, directors }))}
                        placeholder="Type to search and add directors"
                      />
                    )}
                  
                    <div className="space-y-2">
                      <Label htmlFor="chairmanName">Chairman Name</Label>
                      {isLoadingDirectors ? (
                        <div className="text-gray-500">Loading directors data...</div>
                      ) : (
                        <select
                          id="chairmanName"
                          value={formData.chairmanName}
                          onChange={(e) => handleSelectChange('chairmanName', e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md"
                        >
                          <option value="">Select Chairman</option>
                          {formData.directors.map((director, index) => (
                            <option key={index} value={director.name}>
                              {director.name} (DIN: {director.din})
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
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
                    <p className="text-sm text-muted-foreground">
                      Enter the name of the authorised officer (if applicable)
                    </p>
                  </div>
                </div>
              )}
              
              {/* Step 3: Financial Information */}
              {currentStep === 3 && (
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
                      onChange={handleAuditorPaymentAmountChange}
                      placeholder="e.g., 25000"
                      type="number"
                    />
                    <p className="text-sm text-muted-foreground">
                      Enter the amount paid to the auditor (automatically converts to words)
                    </p>
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
                    <p className="text-sm text-muted-foreground">
                      Enter the amount in words (auto-populated from amount field)
                    </p>
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
                    <p className="text-sm text-muted-foreground">
                      Enter the financial year (4-digit format)
                    </p>
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
                    <p className="text-sm text-muted-foreground">
                      Enter details about auditor payment approval
                    </p>
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
                    <p className="text-sm text-muted-foreground">
                      Enter details about financial statements approval
                    </p>
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
                    <p className="text-sm text-muted-foreground">
                      Enter details about directors' report approval
                    </p>
                  </div>
                  
                  {/* Sign-off Details */}
                  <div className="space-y-2 md:col-span-2">
                    <h3 className="text-lg font-medium">Sign-off Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="recordingDate">Recording Date</Label>
                        <Input
                          id="recordingDate"
                          name="recordingDate"
                          type="date"
                          value={formData.recordingDate}
                          onChange={handleInputChange}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="signingDate">Signing Date</Label>
                        <Input
                          id="signingDate"
                          name="signingDate"
                          type="date"
                          value={formData.signingDate}
                          onChange={handleInputChange}
                        />
                      </div>
                      
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="signingPlace">Signing Place</Label>
                        <PlaceSelector
                          id="signingPlace"
                          label="Signing Place"
                          value={formData.signingPlace}
                          onChange={(value) => handleSelectChange('signingPlace', value)}
                          placeholder="Select or add a signing place"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Step 4: Review & Generate */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <div className="p-4 border rounded-lg">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Eye className="h-5 w-5" />
                      Review Your Information
                    </h3>
                    <PreviewSection formData={formData} />
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <h3 className="text-lg font-semibold mb-4">Finalize Document</h3>
                    <p className="text-muted-foreground mb-4">
                      Please review all information above carefully. Once you click "Generate Minutes Document", 
                      the document will be created and downloaded automatically.
                    </p>
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
                  </div>
                </div>
              )}
              
              {/* Navigation Buttons */}
              {currentStep < 4 && (
                <div className="flex justify-end pt-4">
                  <Button 
                    type="button" 
                    onClick={goToNextStep} 
                    className="flex items-center gap-2"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
              
              {currentStep === 4 && (
                <div className="flex justify-between pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={goToPreviousStep} 
                    className="flex items-center gap-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </ProductDashboardLayout>
  );
};

export default MinutesGenerator;