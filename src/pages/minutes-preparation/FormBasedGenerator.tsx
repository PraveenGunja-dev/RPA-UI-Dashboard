import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { ArrowLeft, ArrowRight, Download, Building, Calendar, Users, Hash, Clock, CheckCircle } from 'lucide-react';
import Stepper from '@/components/Stepper';
import PlaceSelector from '@/components/PlaceSelector';
import MultiDirectorSelector from '@/components/MultiDirectorSelector';
import { isAdmin } from '@/utils/adminAuth';

// Helper function to convert numbers to ordinals (1st, 2nd, 3rd, etc.)
const numberToOrdinal = (num: number): string => {
  const suffixes = ["th", "st", "nd", "rd"];
  const remainder = num % 100;
  return num + (suffixes[(remainder - 20) % 10] || suffixes[remainder] || suffixes[0]);
};

// Use the same Director interface as MultiDirectorSelector
interface Director {
  name: string;
  din: string;
}

interface FormData {
  template: string;
  companyName: string;
  meetingNumber: string;
  meetingType: string;
  meetingDate: string;
  meetingDay: string;
  timeCommenced: string;
  timeConcluded: string;
  meetingPlace: string;
  presentDirectors: Director[];
  chairmanName: string;
  // Attendance block
  inAttendance: { name: string; role: string }[];
  companySecretary: string;
  // Quorum & minutes confirmation
  previousMinutesDate: string;
  interestDisclosures: Director[];
  disqualificationDeclarations: Director[];
  // Statutory auditor's payment
  auditorPaymentNumber: number;
  auditorPaymentWords: string;
  auditorPaymentYear: number;
  // Financial statements approval
  fsYear: number;
  rptFinYearRangeFrom: number;
  rptFinYearRangeTo: number;
  signatory1Name: string;
  signatory1Role: string;
  signatory1Din: string;
  signatory2Name: string;
  signatory2Role: string;
  signatory2Din: string;
  // Directors' Report approval
  directorsReportYear: number;
  // AGM notice & meeting details
  agmNumber: string;
  agmDayName: string;
  agmMonthName: string;
  agmYear: number | null;
  agmMonth: number | null;
  agmDay: number | null;
  agmTime: string;
  registeredOfficeAddress: string;
  chairmanShortName: string;
  // Sign-off block
  recordingDate: string;
  signingDate: string;
  signingPlace: string;
  signingChairmanName: string;
}

const FormBasedGenerator: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState<FormData>({
    template: '',
    companyName: '',
    meetingNumber: '',
    meetingType: 'Board Meeting',
    meetingDate: '',
    meetingDay: '',
    timeCommenced: '',
    timeConcluded: '',
    meetingPlace: 'Adani Corporate House, Shantigram, Near Vaishno Devi Circle, S. G. Highway, Khodiyar, Ahmedabad - 382421, Gujarat, India',
    presentDirectors: [],
    chairmanName: '',
    inAttendance: [],
    companySecretary: '',
    previousMinutesDate: '',
    interestDisclosures: [],
    disqualificationDeclarations: [],
    auditorPaymentNumber: 0,
    auditorPaymentWords: '',
    auditorPaymentYear: new Date().getFullYear(),
    fsYear: new Date().getFullYear(),
    rptFinYearRangeFrom: new Date().getFullYear() - 1,
    rptFinYearRangeTo: new Date().getFullYear(),
    signatory1Name: '',
    signatory1Role: '',
    signatory1Din: '',
    signatory2Name: '',
    signatory2Role: '',
    signatory2Din: '',
    directorsReportYear: new Date().getFullYear(),
    agmNumber: '',
    agmDayName: '',
    agmMonthName: '',
    agmYear: null,
    agmMonth: null,
    agmDay: null,
    agmTime: '',
    registeredOfficeAddress: 'Adani Corporate House, Shantigram, Near Vaishno Devi Circle, S. G. Highway, Khodiyar, Ahmedabad - 382421, Gujarat, India',
    chairmanShortName: '',
    recordingDate: '',
    signingDate: '',
    signingPlace: 'Adani Corporate House, Shantigram, Near Vaishno Devi Circle, S. G. Highway, Khodiyar, Ahmedabad - 382421, Gujarat, India',
    signingChairmanName: '',
  });

  const steps = formData.template === 'Q1' ? [
    { id: 'template', title: 'Template & Company' },
    { id: 'meeting', title: 'Meeting Details' },
    { id: 'attendance', title: 'Attendance' },
    { id: 'disclosures', title: 'Disclosures' },
    { id: 'auditor', title: 'Auditor Payment' },
    { id: 'financial', title: 'Financial Statements' },
    { id: 'agm', title: 'AGM Details' },
    { id: 'signoff', title: 'Sign-off Details' },
    { id: 'review', title: 'Review & Generate' },
  ] : [
    { id: 'template', title: 'Template & Company' },
    { id: 'meeting', title: 'Meeting Details' },
    { id: 'attendance', title: 'Attendance' },
    { id: 'signoff', title: 'Sign-off Details' },
    { id: 'review', title: 'Review & Generate' },
  ];

  const isStepValid = () => {
    // For Q2/Q3/Q4, map step indices
    const isQ1 = formData.template === 'Q1';
    
    if (isQ1) {
      // Q1 has 9 steps (0-8)
      switch (currentStep) {
        case 0: // Template & Company
          return formData.template && formData.companyName.trim() !== "";
        case 1: // Meeting Details
          return formData.meetingDate && formData.meetingPlace;
        case 2: // Attendance
          return formData.presentDirectors.length > 0;
        case 3: // Disclosures
          return true; // All fields are optional
        case 4: // Auditor Payment
          return formData.auditorPaymentNumber > 0 && formData.auditorPaymentWords.trim() !== "";
        case 5: // Financial Statements
          return formData.fsYear > 0 && 
                 formData.directorsReportYear > 0 && 
                 formData.rptFinYearRangeFrom > 0 && 
                 formData.rptFinYearRangeTo > 0 &&
                 formData.signatory1Name.trim() !== "" && 
                 formData.signatory1Role.trim() !== "" && 
                 formData.signatory1Din.trim() !== "" &&
                 formData.signatory2Name.trim() !== "" && 
                 formData.signatory2Role.trim() !== "" && 
                 formData.signatory2Din.trim() !== "";
        case 6: // AGM Details
          const isAgmNumberValid = formData.agmNumber && formData.agmNumber.trim() !== "";
          const isAgmDateValid = Number.isFinite(formData.agmYear) && 
                                Number.isFinite(formData.agmMonth) && 
                                Number.isFinite(formData.agmDay) &&
                                formData.agmYear! > 0 && 
                                formData.agmMonth! >= 1 && formData.agmMonth! <= 12 && 
                                formData.agmDay! >= 1 && formData.agmDay! <= 31;
          const isAgmTimeValid = formData.agmTime && formData.agmTime.trim() !== "";
          const isRegisteredOfficeValid = formData.registeredOfficeAddress && formData.registeredOfficeAddress.trim() !== "";
          return isAgmNumberValid && isAgmDateValid && isAgmTimeValid && isRegisteredOfficeValid;
        case 7: // Sign-off Details
          return formData.recordingDate && formData.signingDate && formData.signingPlace;
        default:
          return true;
      }
    } else {
      // Q2/Q3/Q4 have 5 steps (0-4)
      switch (currentStep) {
        case 0: // Template & Company
          return formData.template && formData.companyName.trim() !== "";
        case 1: // Meeting Details
          return formData.meetingDate && formData.meetingPlace;
        case 2: // Attendance
          return formData.presentDirectors.length > 0;
        case 3: // Sign-off Details
          return formData.recordingDate && formData.signingDate && formData.signingPlace;
        default:
          return true;
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (currentStep < steps.length - 1) {
      // Move to next step
      setCurrentStep((s) => s + 1);
    } else {
      // Final step - submit form and generate document
      setIsSubmitting(true);
      try {
        // Prepare the data for the backend
        const minutesData = {
          template: formData.template,
          companyName: formData.companyName,
          meetingNumber: formData.meetingNumber,
          meetingType: formData.meetingType,
          meetingDay: formData.meetingDay,
          meetingDate: formData.meetingDate,
          meetingStartTime: formData.timeCommenced,
          meetingEndTime: formData.timeConcluded,
          meetingPlace: formData.meetingPlace,
          chairmanName: formData.chairmanName,
          presentDirectors: formData.presentDirectors,
          inAttendance: formData.inAttendance,
          companySecretary: formData.companySecretary,
          previousMeetingDate: formData.previousMinutesDate,
          authorisedOfficer: formData.companySecretary || (formData.inAttendance && formData.inAttendance.length > 0 ? formData.inAttendance.map(a => `${a.name} (${a.role})`).join(', ') : "Authorised Officer"),
          quorum: "Quorum details", // Default value
          concerns: "Concerns details", // Default value
          declarations: "Declarations details", // Default value
          auditorPaymentAmount: formData.auditorPaymentNumber.toString(),
          auditorPaymentWords: formData.auditorPaymentWords,
          financialYear: formData.fsYear.toString(),
          agmNumber: formData.agmNumber,
          agmDay: formData.agmDay?.toString() || "1",
          agmMonthName: formData.agmMonthName,
          agmDate: formData.meetingDate, // Using meeting date as default
          agmTime: formData.agmTime,
          agmPlace: formData.registeredOfficeAddress,
          recordingDate: formData.recordingDate,
          signingDate: formData.signingDate,
          signingPlace: formData.signingPlace,
        };

        // Send the data to the backend to generate the document
        const response = await fetch('/generate-minutes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(minutesData),
        });

        if (response.ok) {
          // Get the blob from the response
          const blob = await response.blob();
          
          // Create a download link
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          
          // Extract filename from Content-Disposition header or use default
          const contentDisposition = response.headers.get('Content-Disposition');
          let filename = `${formData.companyName}_${formData.template}_Minutes_${formData.meetingDate}.docx`;
          
          if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
            if (filenameMatch) {
              filename = filenameMatch[1];
            }
          }
          
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          
          // Cleanup
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          
          alert('Document generated successfully!');
        } else {
          const error = await response.json();
          throw new Error(error.detail || 'Failed to generate document');
        }
      } catch (error) {
        console.error('Error generating document:', error);
        alert(`Error generating document: ${error.message || 'Please try again.'}`);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <Button variant="ghost" onClick={() => navigate("/minutes-preparation")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <h1 className="text-2xl font-bold">Meeting Minutes Generator</h1>
      </div>

      <div className="max-w-4xl mx-auto">
        <Stepper steps={steps} currentStep={currentStep} />

        <form onSubmit={handleSubmit}>
          {/* TEMPLATE & COMPANY */}
          {currentStep === 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Template & Company Information</CardTitle>
                <CardDescription>Select template and enter company details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="template">Template *</Label>
                  <Select 
                    value={formData.template} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, template: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a template" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="Q1">Q1 Meeting Template</SelectItem>
                      <SelectItem value="Q2">Q2 Meeting Template</SelectItem>
                      <SelectItem value="Q3">Q3 Meeting Template</SelectItem>
                      <SelectItem value="Q4">Q4 Meeting Template</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name *</Label>
                  <Input
                    id="companyName"
                    value={formData.companyName}
                    onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                    placeholder="Enter company name"
                    className={!formData.companyName.trim() ? 'border-red-500' : ''}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="meetingNumber">Meeting Number</Label>
                  <Input
                    id="meetingNumber"
                    type="number"
                    min="1"
                    value={formData.meetingNumber ? parseInt(formData.meetingNumber.replace(/(st|nd|rd|th)$/, '')) || '' : ''}
                    onChange={(e) => {
                      const num = parseInt(e.target.value);
                      if (!isNaN(num)) {
                        const ordinal = numberToOrdinal(num);
                        setFormData(prev => ({ ...prev, meetingNumber: ordinal }));
                      } else {
                        setFormData(prev => ({ ...prev, meetingNumber: '' }));
                      }
                    }}
                    placeholder="e.g., 5"
                  />
                  <p className="text-sm text-muted-foreground">
                    Enter a number and it will be automatically converted to ordinal (e.g., 5 → 5th)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="meetingType">Meeting Type</Label>
                  <Select 
                    value={formData.meetingType} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, meetingType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select meeting type" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="Board Meeting">Board Meeting</SelectItem>
                      <SelectItem value="Annual General Meeting">Annual General Meeting</SelectItem>
                      <SelectItem value="Extraordinary General Meeting">Extraordinary General Meeting</SelectItem>
                      <SelectItem value="Committee Meeting">Committee Meeting</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          )}

          {/* MEETING DETAILS */}
          {currentStep === 1 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Meeting Details</CardTitle>
                <CardDescription>Enter meeting date, time, and location</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="meetingDate">Meeting Date *</Label>
                  <Input
                    id="meetingDate"
                    type="date"
                    value={formData.meetingDate}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, meetingDate: e.target.value }));
                      if (e.target.value) {
                        const dayName = new Date(e.target.value).toLocaleDateString('en-US', { weekday: 'long' });
                        setFormData(prev => ({ ...prev, meetingDay: dayName }));
                      }
                    }}
                    className={!formData.meetingDate ? 'border-red-500' : ''}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="meetingTimeRange">Meeting Time Range</Label>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <Input
                        id="timeCommenced"
                        type="time"
                        value={formData.timeCommenced}
                        onChange={(e) => setFormData(prev => ({ ...prev, timeCommenced: e.target.value }))}
                      />
                    </div>
                    <span className="text-muted-foreground">to</span>
                    <div className="flex-1">
                      <Input
                        id="timeConcluded"
                        type="time"
                        value={formData.timeConcluded}
                        onChange={(e) => setFormData(prev => ({ ...prev, timeConcluded: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="meetingPlace">Meeting Place *</Label>
                  <PlaceSelector
                    id="meetingPlace"
                    label="Meeting Place"
                    value={formData.meetingPlace}
                    onChange={(value) => setFormData(prev => ({ ...prev, meetingPlace: value }))}
                    placeholder="Select Adani Corporate House or add custom place"
                  />
                  <p className="text-sm text-muted-foreground">
                    Default: Adani Corporate House, Shantigram, Near Vaishno Devi Circle, S. G. Highway, Khodiyar, Ahmedabad - 382421, Gujarat, India
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ATTENDANCE */}
          {currentStep === 2 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Attendance</CardTitle>
                <CardDescription>Directors and other attendees present at the meeting</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-3">Directors Present</h3>
                  <MultiDirectorSelector
                    id="presentDirectors"
                    label="Select Present Directors"
                    value={formData.presentDirectors}
                    onChange={(directors) => setFormData(prev => ({ ...prev, presentDirectors: directors }))}
                    placeholder="Type to search and add directors"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="chairmanName">Chairman Name</Label>
                  <select
                    id="chairmanName"
                    value={formData.chairmanName}
                    onChange={(e) => setFormData(prev => ({ ...prev, chairmanName: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Select Chairman</option>
                    {formData.presentDirectors.map((director, index) => (
                      <option key={index} value={director.name}>
                        {director.name} (DIN: {director.din})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companySecretary">Company Secretary / Officer</Label>
                  <Input
                    id="companySecretary"
                    value={formData.companySecretary}
                    onChange={(e) => setFormData(prev => ({ ...prev, companySecretary: e.target.value }))}
                    placeholder="Enter company secretary or officer name"
                  />
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-3">Others in Attendance</h3>
                  <div className="space-y-3">
                    {formData.inAttendance.map((attendee, index) => (
                      <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 border rounded-md">
                        <Input
                          placeholder="Name"
                          value={attendee.name}
                          onChange={(e) => {
                            const newInAttendance = [...formData.inAttendance];
                            newInAttendance[index].name = e.target.value;
                            setFormData(prev => ({ ...prev, inAttendance: newInAttendance }));
                          }}
                        />
                        <Input
                          placeholder="Role"
                          value={attendee.role}
                          onChange={(e) => {
                            const newInAttendance = [...formData.inAttendance];
                            newInAttendance[index].role = e.target.value;
                            setFormData(prev => ({ ...prev, inAttendance: newInAttendance }));
                          }}
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            const newInAttendance = [...formData.inAttendance];
                            newInAttendance.splice(index, 1);
                            setFormData(prev => ({ ...prev, inAttendance: newInAttendance }));
                          }}
                          className="md:col-span-2"
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          inAttendance: [...prev.inAttendance, { name: '', role: '' }]
                        }));
                      }}
                    >
                      Add Attendee
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* DISCLOSURES - Q1 ONLY */}
          {formData.template === 'Q1' && currentStep === 3 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Disclosures</CardTitle>
                <CardDescription>Disclosures under the Companies Act</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-3">Interest Disclosures</h3>
                  <MultiDirectorSelector
                    id="interestDisclosures"
                    label="Select Directors with Interest Disclosures"
                    value={formData.interestDisclosures}
                    onChange={(directors) => setFormData(prev => ({ ...prev, interestDisclosures: directors }))}
                    placeholder="Type to search and add directors"
                  />
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-3">Disqualification Declarations</h3>
                  <MultiDirectorSelector
                    id="disqualificationDeclarations"
                    label="Select Directors with Disqualification Declarations"
                    value={formData.disqualificationDeclarations}
                    onChange={(directors) => setFormData(prev => ({ ...prev, disqualificationDeclarations: directors }))}
                    placeholder="Type to search and add directors"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="previousMinutesDate">Previous Minutes Date</Label>
                  <Input
                    id="previousMinutesDate"
                    type="date"
                    value={formData.previousMinutesDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, previousMinutesDate: e.target.value }))}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* AUDITOR PAYMENT - Q1 ONLY */}
          {formData.template === 'Q1' && currentStep === 4 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Auditor Payment</CardTitle>
                <CardDescription>Statutory auditor's payment details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="auditorPaymentNumber">Payment Amount *</Label>
                    <Input
                      id="auditorPaymentNumber"
                      type="number"
                      value={formData.auditorPaymentNumber}
                      onChange={(e) => setFormData(prev => ({ ...prev, auditorPaymentNumber: parseInt(e.target.value) || 0 }))}
                      placeholder="e.g., 50000"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="auditorPaymentWords">Amount in Words *</Label>
                    <Input
                      id="auditorPaymentWords"
                      value={formData.auditorPaymentWords}
                      onChange={(e) => setFormData(prev => ({ ...prev, auditorPaymentWords: e.target.value }))}
                      placeholder="e.g., Fifty Thousand Only"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="auditorPaymentYear">Payment Year *</Label>
                    <Input
                      id="auditorPaymentYear"
                      type="number"
                      min="1900"
                      max="2100"
                      value={formData.auditorPaymentYear}
                      onChange={(e) => setFormData(prev => ({ ...prev, auditorPaymentYear: parseInt(e.target.value) || new Date().getFullYear() }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* FINANCIAL STATEMENTS - Q1 ONLY */}
          {formData.template === 'Q1' && currentStep === 5 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Financial Statements</CardTitle>
                <CardDescription>Financial statements approval details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="fsYear">Financial Year *</Label>
                    <Input
                      id="fsYear"
                      type="number"
                      min="1900"
                      max="2100"
                      value={formData.fsYear}
                      onChange={(e) => setFormData(prev => ({ ...prev, fsYear: parseInt(e.target.value) || new Date().getFullYear() }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="directorsReportYear">Directors Report Year *</Label>
                    <Input
                      id="directorsReportYear"
                      type="number"
                      min="1900"
                      max="2100"
                      value={formData.directorsReportYear}
                      onChange={(e) => setFormData(prev => ({ ...prev, directorsReportYear: parseInt(e.target.value) || new Date().getFullYear() }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="rptFinYearRangeFrom">Report Financial Year From *</Label>
                    <Input
                      id="rptFinYearRangeFrom"
                      type="number"
                      min="1900"
                      max="2100"
                      value={formData.rptFinYearRangeFrom}
                      onChange={(e) => setFormData(prev => ({ ...prev, rptFinYearRangeFrom: parseInt(e.target.value) || (new Date().getFullYear() - 1) }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="rptFinYearRangeTo">Report Financial Year To *</Label>
                    <Input
                      id="rptFinYearRangeTo"
                      type="number"
                      min="1900"
                      max="2100"
                      value={formData.rptFinYearRangeTo}
                      onChange={(e) => setFormData(prev => ({ ...prev, rptFinYearRangeTo: parseInt(e.target.value) || new Date().getFullYear() }))}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Signatory 1</h3>
                  <div className="space-y-2">
                    <Label htmlFor="signatory1">Select Director *</Label>
                    <select
                      id="signatory1"
                      value={formData.signatory1Name}
                      onChange={(e) => {
                        const selectedDirector = formData.presentDirectors.find(d => d.name === e.target.value);
                        if (selectedDirector) {
                          setFormData(prev => ({
                            ...prev,
                            signatory1Name: selectedDirector.name,
                            signatory1Din: selectedDirector.din,
                            signatory1Role: 'Director'
                          }));
                        }
                      }}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      <option value="">Select a director</option>
                      {formData.presentDirectors.map((director, index) => (
                        <option key={index} value={director.name}>
                          {director.name} (DIN: {director.din})
                        </option>
                      ))}
                    </select>
                    {formData.signatory1Name && (
                      <p className="text-sm text-muted-foreground">
                        Selected: {formData.signatory1Name} - DIN: {formData.signatory1Din}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Signatory 2</h3>
                  <div className="space-y-2">
                    <Label htmlFor="signatory2">Select Director *</Label>
                    <select
                      id="signatory2"
                      value={formData.signatory2Name}
                      onChange={(e) => {
                        const selectedDirector = formData.presentDirectors.find(d => d.name === e.target.value);
                        if (selectedDirector) {
                          setFormData(prev => ({
                            ...prev,
                            signatory2Name: selectedDirector.name,
                            signatory2Din: selectedDirector.din,
                            signatory2Role: 'Director'
                          }));
                        }
                      }}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      <option value="">Select a director</option>
                      {formData.presentDirectors.map((director, index) => (
                        <option key={index} value={director.name}>
                          {director.name} (DIN: {director.din})
                        </option>
                      ))}
                    </select>
                    {formData.signatory2Name && (
                      <p className="text-sm text-muted-foreground">
                        Selected: {formData.signatory2Name} - DIN: {formData.signatory2Din}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* AGM DETAILS - Q1 ONLY */}
          {formData.template === 'Q1' && currentStep === 6 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>AGM Details</CardTitle>
                <CardDescription>Annual General Meeting information</CardDescription>
              </CardHeader>
              {!isStepValid() && currentStep === (3 as number) && (
                <div className="px-6 pb-4">
                  <div className="bg-red-50 border border-red-200 rounded-md p-3 text-red-700 text-sm">
                    Please fill in all required fields marked with an asterisk (*) to continue.
                    {/* Debug info - remove in production */}
                    <div className="mt-2 text-xs">
                      AGM Number: '{formData.agmNumber}' ({formData.agmNumber ? 'filled' : 'empty'})
                      <br />
                      AGM Date: {formData.agmYear}-{formData.agmMonth}-{formData.agmDay}
                      <br />
                      AGM Time: '{formData.agmTime}' ({formData.agmTime ? 'filled' : 'empty'})
                      <br />
                      Registered Office: '{formData.registeredOfficeAddress}' ({formData.registeredOfficeAddress ? 'filled' : 'empty'})
                      <br />
                      Validation: agmNumber={!(!formData.agmNumber || formData.agmNumber.trim() === '')}, 
                      agmYear={formData.agmYear > 0}, 
                      agmMonth={formData.agmMonth >= 1 && formData.agmMonth <= 12}, 
                      agmDay={formData.agmDay >= 1 && formData.agmDay <= 31},
                      agmTime={!(!formData.agmTime || formData.agmTime.trim() === '')},
                      registeredOffice={!(!formData.registeredOfficeAddress || formData.registeredOfficeAddress.trim() === '')}
                    </div>
                  </div>
                </div>
              )}
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="agmNumber">AGM Number *</Label>
                  <Input
                    id="agmNumber"
                    name="agmNumber"
                    type="number"
                    min="1"
                    value={formData.agmNumber ? parseInt(formData.agmNumber.replace(/(st|nd|rd|th)$/, '')) || '' : ''}
                    onChange={(e) => {
                      const num = parseInt(e.target.value);
                      if (!isNaN(num)) {
                        // Convert to ordinal and update state
                        const ordinal = numberToOrdinal(num);
                        setFormData(prev => ({ ...prev, agmNumber: ordinal }));
                      } else {
                        setFormData(prev => ({ ...prev, agmNumber: '' }));
                      }
                    }}
                    placeholder="e.g., 10"
                    className={!formData.agmNumber || formData.agmNumber.trim() === '' ? 'border-red-500' : ''}
                  />
                  <p className="text-sm text-muted-foreground">
                    Enter a number and it will be automatically converted to ordinal (e.g., 10 → 10th)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="agmDate">AGM Date *</Label>
                  <Input
                    id="agmDate"
                    name="agmDate"
                    type="date"
                    value={formData.agmYear && formData.agmMonth && formData.agmDay ? 
                      `${formData.agmYear}-${String(formData.agmMonth).padStart(2, '0')}-${String(formData.agmDay).padStart(2, '0')}` : ''}
                    onChange={(e) => {
                      const date = new Date(e.target.value);
                      if (!isNaN(date.getTime())) {
                        setFormData(prev => ({
                          ...prev,
                          agmYear: date.getFullYear(),
                          agmMonth: (date.getMonth() + 1),
                          agmDay: date.getDate(),
                          agmDayName: date.toLocaleDateString('en-US', { weekday: 'long' }),
                          agmMonthName: date.toLocaleDateString('en-US', { month: 'long' })
                        }));
                      }
                    }}
                    className={!(formData.agmYear > 0 && formData.agmMonth >= 1 && formData.agmMonth <= 12 && formData.agmDay >= 1 && formData.agmDay <= 31) ? 'border-red-500' : ''}
                  />
                  <p className="text-sm text-muted-foreground">
                    Select the AGM date
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="agmTime">AGM Time (9 AM - 6 PM) *</Label>
                  <Input
                    id="agmTime"
                    name="agmTime"
                    type="time"
                    min="09:00"
                    max="18:00"
                    value={formData.agmTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, agmTime: e.target.value }))}
                    className={!formData.agmTime || formData.agmTime.trim() === '' ? 'border-red-500' : ''}
                  />
                  <p className="text-sm text-muted-foreground">
                    Select the time of the AGM (9:00 AM to 6:00 PM only)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="agmDayName">AGM Day Name</Label>
                  <Input
                    id="agmDayName"
                    name="agmDayName"
                    value={formData.agmDayName}
                    onChange={(e) => setFormData(prev => ({ ...prev, agmDayName: e.target.value }))}
                    placeholder="e.g., Friday"
                    readOnly
                  />
                  <p className="text-sm text-muted-foreground">
                    Automatically populated based on the selected date
                  </p>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="registeredOfficeAddress">Registered Office Address *</Label>
                  <PlaceSelector
                    id="registeredOfficeAddress"
                    label="Registered Office Address"
                    value={formData.registeredOfficeAddress}
                    onChange={(value) => setFormData(prev => ({ ...prev, registeredOfficeAddress: value }))}
                    placeholder="Select Adani Corporate House or add custom address"
                  />
                  <p className="text-sm text-muted-foreground">
                    Default: Adani Corporate House, Shantigram, Near Vaishno Devi Circle, S. G. Highway, Khodiyar, Ahmedabad - 382421, Gujarat, India
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* SIGN-OFF DETAILS */}
          {((formData.template === 'Q1' && currentStep === 7) || (formData.template !== 'Q1' && currentStep === 3)) && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Sign-off Details</CardTitle>
                <CardDescription>Recording and signing information</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="recordingDate">Recording Date *</Label>
                  <Input
                    id="recordingDate"
                    type="date"
                    value={formData.recordingDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, recordingDate: e.target.value }))}
                    className={!formData.recordingDate ? 'border-red-500' : ''}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signingDate">Signing Date *</Label>
                  <Input
                    id="signingDate"
                    type="date"
                    value={formData.signingDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, signingDate: e.target.value }))}
                    className={!formData.signingDate ? 'border-red-500' : ''}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="signingPlace">Signing Place *</Label>
                  <PlaceSelector
                    id="signingPlace"
                    label="Signing Place"
                    value={formData.signingPlace}
                    onChange={(value) => setFormData(prev => ({ ...prev, signingPlace: value }))}
                    placeholder="Select Adani Corporate House or add custom place"
                  />
                  <p className="text-sm text-muted-foreground">
                    Default: Adani Corporate House, Shantigram, Near Vaishno Devi Circle, S. G. Highway, Khodiyar, Ahmedabad - 382421, Gujarat, India
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* REVIEW & GENERATE */}
          {((formData.template === 'Q1' && currentStep === 8) || (formData.template !== 'Q1' && currentStep === 4)) && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Review Your Information</CardTitle>
                <CardDescription>Please review all information before generating the document</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <Building className="h-5 w-5" />
                      Company Information
                    </h3>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                      <p><span className="font-medium">Company:</span> {formData.companyName || 'Not provided'}</p>
                      <p><span className="font-medium">Template:</span> {formData.template || 'Not provided'}</p>
                      <p><span className="font-medium">Meeting #:</span> {formData.meetingNumber || 'Not provided'}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Meeting Details
                    </h3>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                      <p><span className="font-medium">Date:</span> {formData.meetingDate || 'Not provided'}</p>
                      <p><span className="font-medium">Day:</span> {formData.meetingDay || 'Not provided'}</p>
                      <p><span className="font-medium">Time:</span> {formData.timeCommenced} - {formData.timeConcluded}</p>
                      <p><span className="font-medium">Place:</span> {formData.meetingPlace || 'Not provided'}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Attendance
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="font-medium mb-2">Directors Present:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      {formData.presentDirectors.map((director, index) => (
                        <li key={index}>
                          {director.name} (DIN: {director.din || 'Not provided'})
                        </li>
                      ))}
                    </ul>
                    <p className="font-medium mt-3 mb-2">Chairman:</p>
                    <p>{formData.chairmanName || 'Not provided'}</p>
                  </div>
                </div>

                {formData.template === 'Q1' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <Hash className="h-5 w-5" />
                        AGM Details
                      </h3>
                      <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                        <p><span className="font-medium">AGM #:</span> {formData.agmNumber || 'Not provided'}</p>
                        <p><span className="font-medium">Date:</span> {formData.agmDay}/{formData.agmMonth}/{formData.agmYear}</p>
                        <p><span className="font-medium">Place:</span> {formData.registeredOfficeAddress || 'Not provided'}</p>
                        <p><span className="font-medium">Time:</span> {formData.agmTime || 'Not provided'}</p>
                        <p><span className="font-medium">Day:</span> {formData.agmDayName || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Sign-off Details
                    </h3>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                      <p><span className="font-medium">Recording Date:</span> {formData.recordingDate || 'Not provided'}</p>
                      <p><span className="font-medium">Signing Date:</span> {formData.signingDate || 'Not provided'}</p>
                      <p><span className="font-medium">Signing Place:</span> {formData.signingPlace || 'Not provided'}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold text-blue-800">Ready to Generate</h3>
                  </div>
                  <p className="text-sm text-blue-700">
                    All information has been reviewed. Click the "Generate Document" button below to create your meeting minutes document.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
              disabled={currentStep === 0}
            >
              <ArrowLeft className="h-4 w-4 mr-2" /> Previous
            </Button>

            {currentStep === steps.length - 1 ? (
              <Button
                type="submit"
                disabled={isSubmitting || !isStepValid()}
                className="bg-green-600 hover:bg-green-700"
              >
                {isSubmitting ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" /> Generate Document
                  </>
                )}
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={!isStepValid()}
                className="flex items-center gap-2 px-6 py-2"
              >
                Next <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default FormBasedGenerator;