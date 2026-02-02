import { useState, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DownloadIcon, FileTextIcon, UploadIcon, XIcon, HomeIcon } from 'lucide-react';
import ProductDashboardLayout from '@/components/layout/ProductDashboardLayout';
 
interface Attendee {
  name: string;
  role: string;
}
 
interface ActionItem {
  task: string;
  assignee: string;
}
 
interface MoMContent {
  title: string;
  date: string;
  attendees: Attendee[];
  agenda: string[];
  decisions: string[];
  action_items: ActionItem[];
  next_meeting: string;
}
 
const AIAssistant = () => {
  // Define navigation items for this product - simplified for AI MOM
  const navigationItems = [
    {
      id: 'home',
      label: 'Home',
      icon: HomeIcon,
      href: '/',
    },
    {
      id: 'dashboard',
      label: 'Minutes Generator',
      icon: FileTextIcon,
      href: '/minutes-preparation',
    },
    {
      id: 'ai-mom',
      label: 'AI MOM',
      icon: FileTextIcon, // Removed sparkle icon
      href: '/minutes-preparation/ai-assistant',
    }
  ];
 
  const [files, setFiles] = useState<File[]>([]);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [taskId, setTaskId] = useState<string | null>(null);
  const [processingStatus, setProcessingStatus] = useState<'idle' | 'processing' | 'completed' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [momContent, setMomContent] = useState<MoMContent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
 
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const validTypes = [
        'text/plain',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
     
      if (!validTypes.includes(file.type)) {
        setError('Please upload a DOCX or TXT file.');
        return;
      }
     
      setFiles([file]);
      setError(null);
     
      // Auto-upload the file
      handleUpload([file]);
    }
  };
 
  const handleUpload = async (filesToUpload: File[]) => {
    if (filesToUpload.length === 0) return;
   
    const file = filesToUpload[0];
    setUploadStatus('uploading');
   
    try {
      const formData = new FormData();
      formData.append('file', file);
     
      const response = await fetch('/ai-assistant/upload', {
        method: 'POST',
        body: formData,
      });
     
      if (!response.ok) {
        throw new Error('Upload failed');
      }
     
      const result = await response.json();
      setTaskId(result.task_id);
      setUploadStatus('success');
    } catch (err) {
      console.error('Upload error:', err);
      setUploadStatus('error');
      setError('Failed to upload file. Please try again.');
    }
  };
 
  const handleRemoveFile = () => {
    setFiles([]);
    setUploadStatus('idle');
    setTaskId(null);
    setProcessingStatus('idle');
    setProgress(0);
    setMomContent(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
 
  const handleGenerateMinutes = async () => {
    if (!taskId) return;
   
    setProcessingStatus('processing');
    setProgress(0);
    setError(null);
   
    try {
      // Start the MoM generation
      const response = await fetch(`/ai-assistant/generate-mom?task_id=${taskId}`, {
        method: 'POST',
      });
     
      if (!response.ok) {
        throw new Error('Failed to start generation');
      }
     
      // Poll for status
      const pollInterval = setInterval(async () => {
        try {
          const statusResponse = await fetch(`/ai-assistant/status/${taskId}`);
          const statusResult = await statusResponse.json();
         
          if (statusResult.status === 'completed') {
            clearInterval(pollInterval);
            setProcessingStatus('completed');
            setProgress(100);
           
            // Fetch the generated MoM content
            const momResponse = await fetch(`/ai-assistant/mom/${taskId}`);
            const momResult = await momResponse.json();
            setMomContent(momResult);
          } else if (statusResult.status === 'error') {
            clearInterval(pollInterval);
            setProcessingStatus('error');
            setError(statusResult.error || 'Failed to generate minutes');
          } else {
            // Update progress
            setProgress(prev => Math.min(prev + 10, 90));
          }
        } catch (err) {
          console.error('Polling error:', err);
          clearInterval(pollInterval);
          setProcessingStatus('error');
          setError('Error checking generation status');
        }
      }, 2000);
    } catch (err) {
      console.error('Generation error:', err);
      setProcessingStatus('error');
      setError('Failed to generate minutes. Please try again.');
    }
  };
 
  const handleDownload = async () => {
    if (!taskId) return;
   
    try {
      const response = await fetch(`/ai-assistant/download/${taskId}`);
      if (!response.ok) {
        throw new Error('Download failed');
      }
     
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'meeting_minutes.docx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error:', err);
      setError('Failed to download minutes. Please try again.');
    }
  };
 
  return (
    <ProductDashboardLayout
      productName="AI MOM"
      productRoute="/minutes-preparation"
      navigationItems={navigationItems}
    >
      <div className="space-y-6 max-w-6xl mx-auto">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">AI MOM</h1>
            <p className="text-muted-foreground mt-2">
              Upload meeting transcripts to automatically generate structured meeting minutes.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => window.location.href = '/'}
            className="flex items-center gap-2"
          >
            <HomeIcon className="h-4 w-4" />
            Home
          </Button>
        </div>
 
        <Card className="max-w-2xl mx-auto shadow-lg rounded-xl border border-gray-200">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Upload Transcript</CardTitle>
          </CardHeader>
          <CardContent>
            {files.length > 0 && uploadStatus !== 'success' ? (
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2">
                  <FileTextIcon className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">{files[0].name}</p>
                    <p className="text-xs text-blue-700">{(files[0].size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveFile}
                  className="h-8 w-8 p-0"
                >
                  <XIcon className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div
                className="border-2 border-dashed border-blue-400 rounded-xl p-8 text-center cursor-pointer hover:border-blue-500 transition-all duration-200 bg-gradient-to-br from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 hover:shadow-md"
              >
                <input
                  type="file"
                  accept=".txt,.docx"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                  ref={fileInputRef}
                />
                <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                  <div className="bg-blue-100 p-3 rounded-full mb-4">
                    <UploadIcon className="h-8 w-8 text-blue-600" />
                  </div>
                  <p className="font-semibold text-gray-800 text-lg mb-1">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-sm text-gray-600">
                    DOCX or TXT files only
                  </p>
                </label>
              </div>
            )}
           
            {uploadStatus === 'uploading' && (
              <div className="mt-4 flex items-center justify-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                <p>Uploading...</p>
              </div>
            )}
           
            {uploadStatus === 'success' && (
              <Alert className="mt-4 bg-green-50 border-green-200">
                <AlertDescription className="text-green-800 flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  File uploaded successfully!
                </AlertDescription>
              </Alert>
            )}
           
            {uploadStatus === 'error' && (
              <Alert variant="destructive" className="mt-4">
                <AlertDescription className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-red-500"></div>
                  Failed to upload file. Please try again.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
         
          {uploadStatus === 'success' && (
            <CardFooter className="flex justify-center">
              <Button
                onClick={handleGenerateMinutes}
                disabled={processingStatus === 'processing'}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium py-2 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5 max-w-xs"
              >
                {processingStatus === 'processing' ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2"></div>
                    Generating Minutes...
                  </>
                ) : (
                  <>
                    <FileTextIcon className="mr-2 h-4 w-4" />
                    Generate Minutes
                  </>
                )}
              </Button>
            </CardFooter>
          )}
        </Card>
 
        {processingStatus === 'processing' && (
          <Card className="max-w-2xl mx-auto shadow-lg rounded-xl border border-gray-200">
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Processing</CardTitle>
              <CardDescription>
                Analyzing transcript and generating meeting minutes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Progress value={progress} className="w-full h-2" />
                <div className="flex items-center justify-center gap-2">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                  <p className="text-sm text-muted-foreground">
                    Analyzing your transcript and generating structured meeting minutes...
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
 
        {processingStatus === 'completed' && momContent && (
          <Card className="shadow-lg rounded-xl border border-gray-200 bg-white">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200 rounded-t-xl">
              <CardTitle className="text-2xl font-bold text-gray-900">
                Generated Meeting Minutes
              </CardTitle>
              <CardDescription>
                Your meeting minutes have been generated
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              <div className="border-l-4 border-blue-500 pl-4 py-1">
                <h3 className="text-2xl font-bold text-gray-900">{momContent.title}</h3>
                <p className="text-muted-foreground mt-1">Date: {momContent.date}</p>
              </div>
             
              <div>
                <h4 className="text-lg font-semibold mb-3 text-gray-800 flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                  Attendees
                </h4>
                <ul className="list-disc pl-5 space-y-1">
                  {momContent.attendees.map((attendee, index) => (
                    <li key={index} className="text-gray-700">
                      <span className="font-medium">{attendee.name}</span> ({attendee.role})
                    </li>
                  ))}
                </ul>
              </div>
             
              <div>
                <h4 className="text-lg font-semibold mb-3 text-gray-800 flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                  Agenda
                </h4>
                <ul className="list-disc pl-5 space-y-1">
                  {momContent.agenda.map((item, index) => (
                    <li key={index} className="text-gray-700">{item}</li>
                  ))}
                </ul>
              </div>
             
              <div>
                <h4 className="text-lg font-semibold mb-3 text-gray-800 flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                  Decisions Made
                </h4>
                <ul className="list-disc pl-5 space-y-1">
                  {momContent.decisions.map((decision, index) => (
                    <li key={index} className="text-gray-700">{decision}</li>
                  ))}
                </ul>
              </div>
             
              <div>
                <h4 className="text-lg font-semibold mb-3 text-gray-800 flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                  Action Items
                </h4>
                <ul className="list-disc pl-5 space-y-1">
                  {momContent.action_items.map((action, index) => (
                    <li key={index} className="text-gray-700">
                      <span className="font-medium">{action.task}</span> - Assigned to: <span className="font-medium">{action.assignee}</span>
                    </li>
                  ))}
                </ul>
              </div>
             
              <div>
                <h4 className="text-lg font-semibold mb-3 text-gray-800 flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                  Next Meeting
                </h4>
                <p className="text-gray-700">{momContent.next_meeting}</p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-center pb-6">
              <Button
                onClick={handleDownload}
                className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2"
              >
                <DownloadIcon className="h-4 w-4" />
                Download as DOCX
              </Button>
            </CardFooter>
          </Card>
        )}
 
        {error && (
          <Alert variant="destructive" className="max-w-2xl mx-auto">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>
    </ProductDashboardLayout>
  );
};
 
export default AIAssistant;
 