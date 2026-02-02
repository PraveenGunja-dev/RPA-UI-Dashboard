import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, ArrowRight, FileText, Users, Calendar, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface FormData {
  // Basic meeting info
  companyName: string;
  meetingType: string;
  meetingDate: string;
  meetingPlace: string;
  
  // Attendees
  chairmanName: string;
  totalAttendees: number;
  
  // Meeting details
  agenda: string;
  decisions: string;
  nextMeetingDate: string;
}

const StepperForm = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [formData, setFormData] = useState<FormData>({
    companyName: '',
    meetingType: 'Board of Directors Meeting',
    meetingDate: '',
    meetingPlace: '',
    chairmanName: '',
    totalAttendees: 0,
    agenda: '',
    decisions: '',
    nextMeetingDate: ''
  });

  const totalSteps = 3;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name.includes('totalAttendees') ? parseInt(value) || 0 : value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      // Mark current step as completed
      if (!completedSteps.includes(currentStep)) {
        setCompletedSteps([...completedSteps, currentStep]);
      }
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Mark current step as completed
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps([...completedSteps, currentStep]);
    }
    // In a real implementation, this would submit the data to the backend
    console.log('Form submitted:', formData);
    // For now, just navigate back to the main minutes preparation page
    navigate('/minutes-preparation');
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.companyName.trim() !== '' && 
               formData.meetingDate !== '' && 
               formData.meetingPlace.trim() !== '';
      case 2:
        return formData.chairmanName.trim() !== '' && 
               formData.totalAttendees > 0 && 
               formData.agenda.trim() !== '';
      case 3:
        return formData.decisions.trim() !== '';
      default:
        return true;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyName" className="flex items-center">
                Company Name 
                <span className="ml-1 text-red-500">*</span>
              </Label>
              <Input
                id="companyName"
                name="companyName"
                value={formData.companyName}
                onChange={handleInputChange}
                placeholder="Enter company name"
                className={formData.companyName.trim() === '' && completedSteps.includes(1) ? 'border-red-500' : ''}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="meetingType" className="flex items-center">
                Meeting Type 
                <span className="ml-1 text-red-500">*</span>
              </Label>
              <Select name="meetingType" value={formData.meetingType} onValueChange={(value) => handleSelectChange('meetingType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select meeting type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Board of Directors Meeting">Board of Directors Meeting</SelectItem>
                  <SelectItem value="Committee Meeting">Committee Meeting</SelectItem>
                  <SelectItem value="Annual General Meeting">Annual General Meeting</SelectItem>
                  <SelectItem value="Extraordinary General Meeting">Extraordinary General Meeting</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="meetingDate" className="flex items-center">
                Meeting Date 
                <span className="ml-1 text-red-500">*</span>
              </Label>
              <Input
                id="meetingDate"
                name="meetingDate"
                type="date"
                value={formData.meetingDate}
                onChange={handleInputChange}
                className={formData.meetingDate === '' && completedSteps.includes(1) ? 'border-red-500' : ''}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="meetingPlace" className="flex items-center">
                Meeting Place 
                <span className="ml-1 text-red-500">*</span>
              </Label>
              <Input
                id="meetingPlace"
                name="meetingPlace"
                value={formData.meetingPlace}
                onChange={handleInputChange}
                placeholder="Enter meeting location"
                className={formData.meetingPlace.trim() === '' && completedSteps.includes(1) ? 'border-red-500' : ''}
              />
            </div>
          </div>
        );
      
      case 2:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="chairmanName" className="flex items-center">
                Chairman Name 
                <span className="ml-1 text-red-500">*</span>
              </Label>
              <Input
                id="chairmanName"
                name="chairmanName"
                value={formData.chairmanName}
                onChange={handleInputChange}
                placeholder="Enter chairman name"
                className={formData.chairmanName.trim() === '' && completedSteps.includes(2) ? 'border-red-500' : ''}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="totalAttendees" className="flex items-center">
                Total Attendees 
                <span className="ml-1 text-red-500">*</span>
              </Label>
              <Input
                id="totalAttendees"
                name="totalAttendees"
                type="number"
                min="1"
                value={formData.totalAttendees || ''}
                onChange={handleInputChange}
                placeholder="Enter number of attendees"
                className={formData.totalAttendees <= 0 && completedSteps.includes(2) ? 'border-red-500' : ''}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="agenda" className="flex items-center">
                Meeting Agenda 
                <span className="ml-1 text-red-500">*</span>
              </Label>
              <textarea
                id="agenda"
                name="agenda"
                value={formData.agenda}
                onChange={handleInputChange}
                placeholder="Enter meeting agenda items"
                className={`w-full min-h-[120px] p-3 border rounded-md ${
                  formData.agenda.trim() === '' && completedSteps.includes(2) ? 'border-red-500' : ''
                }`}
              />
            </div>
          </div>
        );
      
      case 3:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="decisions" className="flex items-center">
                Key Decisions 
                <span className="ml-1 text-red-500">*</span>
              </Label>
              <textarea
                id="decisions"
                name="decisions"
                value={formData.decisions}
                onChange={handleInputChange}
                placeholder="Enter key decisions made during the meeting"
                className={`w-full min-h-[120px] p-3 border rounded-md ${
                  formData.decisions.trim() === '' && completedSteps.includes(3) ? 'border-red-500' : ''
                }`}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="nextMeetingDate">Next Meeting Date (Optional)</Label>
              <Input
                id="nextMeetingDate"
                name="nextMeetingDate"
                type="date"
                value={formData.nextMeetingDate}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold text-green-800">Review Your Information</h3>
              </div>
              <p className="text-sm text-green-700">
                Please review all the information you've entered. Once you submit, the meeting minutes will be generated.
              </p>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  const getStepIcon = (step: number) => {
    switch (step) {
      case 1: return <FileText className="h-5 w-5" />;
      case 2: return <Users className="h-5 w-5" />;
      case 3: return <Calendar className="h-5 w-5" />;
      default: return null;
    }
  };

  const getStepTitle = (step: number) => {
    switch (step) {
      case 1: return 'Meeting Details';
      case 2: return 'Attendees & Agenda';
      case 3: return 'Decisions & Review';
      default: return '';
    }
  };

  return (
    <div className="container mx-auto py-6 max-w-3xl">
      <div className="flex items-center gap-4 mb-6">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => navigate('/minutes-preparation')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">Generate Meeting Minutes</h1>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between relative">
          {/* Progress line background */}
          <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200 -z-10 rounded-full"></div>
          {/* Progress line fill */}
          <div 
            className="absolute top-5 left-0 h-1 bg-blue-500 -z-10 rounded-full transition-all duration-500 ease-in-out"
            style={{ 
              width: `${totalSteps > 1 ? ((currentStep - 1) / (totalSteps - 1)) * 100 : 0}%`,
              maxWidth: '100%'
            }}
          ></div>
          
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex flex-col items-center relative">
              <div 
                className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-all duration-300 ${
                  completedSteps.includes(step)
                    ? 'bg-green-500 text-white border-0'
                    : step === currentStep
                    ? 'bg-blue-500 text-white border-4 border-blue-200'
                    : 'bg-white text-gray-400 border-2 border-gray-300'
                }`}
                style={{
                  boxShadow: step === currentStep ? '0 0 0 4px rgba(59, 130, 246, 0.3)' : 'none'
                }}
              >
                {completedSteps.includes(step) ? (
                  <CheckCircle className="h-6 w-6" />
                ) : (
                  <span className="font-semibold">{step}</span>
                )}
              </div>
              <span 
                className={`text-xs font-medium text-center w-24 transition-colors duration-300 ${
                  step === currentStep ? 'text-blue-600 font-semibold' : 'text-gray-500'
                }`}
              >
                {getStepTitle(step)}
              </span>
            </div>
          ))}
        </div>
        
        {/* Progress text */}
        <div className="text-center mt-4 text-sm text-gray-500">
          Step {currentStep} of {totalSteps}
        </div>
        <div className="text-center mt-1 text-xs text-gray-400">
          {currentStep === 1 && "Enter meeting details"}
          {currentStep === 2 && "Add attendees and agenda"}
          {currentStep === 3 && "Record decisions and review"}
        </div>
      </div>

      {/* Form Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getStepIcon(currentStep)}
            {getStepTitle(currentStep)}
          </CardTitle>
          <CardDescription>
            {currentStep === 1 && "Enter the basic details of your meeting"}
            {currentStep === 2 && "Provide information about attendees and agenda"}
            {currentStep === 3 && "Record key decisions and review your information"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={currentStep === totalSteps ? handleSubmit : (e) => { e.preventDefault(); nextStep(); }}>
            {renderStepContent()}
            
            <div className="flex justify-between mt-8">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
                className="flex items-center gap-2 px-6 py-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Previous
              </Button>
              
              {currentStep === totalSteps ? (
                <Button 
                  type="submit" 
                  className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700"
                  disabled={!isStepValid()}
                >
                  Generate Minutes
                  <FileText className="h-4 w-4" />
                </Button>
              ) : (
                <Button 
                  type="submit" 
                  className="flex items-center gap-2 px-6 py-2"
                  disabled={!isStepValid()}
                >
                  Next
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default StepperForm;