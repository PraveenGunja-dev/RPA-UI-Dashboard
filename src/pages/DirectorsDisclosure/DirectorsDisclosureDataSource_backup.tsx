import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FileText, Eye, Download, Loader2, AlertCircle, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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

interface Disclosure {
  id: number;
  director_name: string;
  din: string;
  disclosure_date: string;
  disclosure_type: string;
  file_path: string;
}

interface DocumentSummary {
  id: number;
  director_name: string;
  din: string;
  file_path: string;
  full_text: string;
  summary: string;
  created_at: string;
  updated_at: string;
}

// Helper function to format the summary content
const formatSummaryContent = (content: string) => {
  // Remove the introductory text if present
  let formattedContent = content;
  if (formattedContent.startsWith("Here is a concise summary of the director's disclosure document:")) {
    formattedContent = formattedContent.substring("Here is a concise summary of the director's disclosure document:".length).trim();
  }
  
  // Split content into lines
  const lines = formattedContent.split('\n');
  let htmlContent = '';
  let inList = false;
  
  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    
    // Skip empty lines
    if (!trimmedLine) {
      // Add a break if we're not in a list
      if (!inList && htmlContent && !htmlContent.endsWith('<br>') && !htmlContent.endsWith('<ul class="list-disc pl-5 space-y-1">')) {
        htmlContent += '<br>';
      }
      return;
    }
    
    // Check if it's a section header (ends with colon)
    if (trimmedLine.endsWith(':')) {
      // Close previous list if open
      if (inList) {
        htmlContent += '</ul>';
        inList = false;
      }
      
      // Add header
      const headerText = trimmedLine.slice(0, -1); // Remove the colon
      htmlContent += `<h4 class="font-semibold text-lg mt-4 mb-2">${headerText}</h4>`;
    } 
    // Check if it's a bullet point
    else if (trimmedLine.startsWith('•')) {
      // Start list if not already open
      if (!inList) {
        htmlContent += '<ul class="list-disc pl-5 space-y-1">';
        inList = true;
      }
      
      // Add list item
      const listItem = trimmedLine.substring(1).trim(); // Remove bullet and trim
      if (listItem) {
        htmlContent += `<li>${listItem}</li>`;
      }
    }
    // Regular paragraph (not a bullet point and not a header)
    else {
      // Close previous list if open
      if (inList) {
        htmlContent += '</ul>';
        inList = false;
      }
      
      // Add paragraph
      htmlContent += `<p class="mb-2">${trimmedLine}</p>`;
    }
  });
  
  // Close list if still open
  if (inList) {
    htmlContent += '</ul>';
  }
  
  return htmlContent || '<p>No summary available</p>';
};

const DirectorsDisclosureDataSource = () => {
  const [disclosures, setDisclosures] = useState<Disclosure[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDisclosure, setSelectedDisclosure] = useState<Disclosure | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [documentSummary, setDocumentSummary] = useState<DocumentSummary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'summary' | 'full'>('summary');
  useEffect(() => {
    fetchDisclosures();
  }, []);

  const fetchDisclosures = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/directors-disclosures');
      
      if (!response.ok) {
        throw new Error('Failed to fetch disclosures');
      }
      
      const data = await response.json();
      setDisclosures(data.data || []);
    } catch (err) {
      console.error('Error fetching disclosures:', err);
      setError(err instanceof Error ? err.message : 'Failed to load disclosures');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadDisclosure = async (disclosure: Disclosure) => {
    try {
      // The file_path from backend includes the filename
      const filename = disclosure.file_path.split('/').pop() || `${disclosure.director_name}_disclosure.docx`;
      const downloadUrl = `/api/directors-disclosures/${disclosure.id}/download`;
      
      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error downloading disclosure:', err);
    }
  };

  const fetchDocumentSummary = async (disclosure: Disclosure) => {
    try {
      setLoadingSummary(true);
      const response = await fetch(`/api/directors-disclosures/${disclosure.id}/summary`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch document summary');
      }
      
      const data = await response.json();
      setDocumentSummary(data);
    } catch (err) {
      console.error('Error fetching document summary:', err);
      setDocumentSummary(null);
    } finally {
      setLoadingSummary(false);
    }
  };

  const handleViewDisclosure = async (disclosure: Disclosure) => {
    setSelectedDisclosure(disclosure);
    setIsModalOpen(true);
    setDocumentSummary(null);
    setActiveTab('summary');
    await fetchDocumentSummary(disclosure);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#ffffff" }}>
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" style={{ color: "#75479C" }} />
          <p className="text-lg" style={{ color: "#000000" }}>Loading disclosures...</p>
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
          <Button
            onClick={fetchDisclosures}
            style={{
              backgroundColor: '#75479C',
              borderColor: '#75479C',
              color: 'white'
            }}
          >
            Retry
          </Button>
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
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8" style={{ color: "#75479C" }} />
              <div>
                <CardTitle className="text-2xl font-bold" style={{ color: "#000000" }}>
                  Directors' Disclosures
                </CardTitle>
                <CardDescription style={{ color: '#666666' }}>
                  Complete list of all disclosures made by directors
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow style={{ backgroundColor: '#f5f5f5' }}>
                    <TableHead className="font-semibold">Director Name</TableHead>
                    <TableHead className="font-semibold">DIN</TableHead>
                    <TableHead className="font-semibold">Disclosure Date</TableHead>
                    <TableHead className="font-semibold">Type</TableHead>
                    <TableHead className="font-semibold text-center">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {disclosures.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8" style={{ color: '#666666' }}>
                        No disclosures found
                      </TableCell>
                    </TableRow>
                  ) : (
                    disclosures.map((disclosure) => (
                      <TableRow key={disclosure.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium">{disclosure.director_name}</TableCell>
                        <TableCell>{disclosure.din}</TableCell>
                        <TableCell>{disclosure.disclosure_date}</TableCell>
                        <TableCell>
                          <span className="px-2 py-1 rounded text-xs font-medium" style={{ backgroundColor: '#f0e6f7', color: '#75479C' }}>
                            {disclosure.disclosure_type}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex gap-2 justify-center">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewDisclosure(disclosure)}
                              className="gap-2"
                              style={{ borderColor: '#75479C', color: '#75479C' }}
                            >
                              <Eye className="h-4 w-4" />
                              View
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDownloadDisclosure(disclosure)}
                              className="gap-2"
                              style={{ borderColor: '#0B74B0', color: '#0B74B0' }}
                            >
                              <Download className="h-4 w-4" />
                              Download
                            </Button>                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Disclosure Summary Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl" style={{ color: '#75479C' }}>
              <FileText className="h-6 w-6" />
              Director Disclosure
            </DialogTitle>
            {selectedDisclosure && (
              <DialogDescription style={{ color: '#666666' }}>
                {selectedDisclosure.director_name} (DIN: {selectedDisclosure.din}) - {selectedDisclosure.disclosure_date}
              </DialogDescription>
            )}
          </DialogHeader>
          
          {/* Tab Navigation */}
          <div className="flex border-b mt-4">
            <button
              className={`py-2 px-4 font-medium ${activeTab === 'summary' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-500'}`}
              onClick={() => setActiveTab('summary')}
            >
              Summary
            </button>
            <button
              className={`py-2 px-4 font-medium ${activeTab === 'full' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-500'}`}
              onClick={() => setActiveTab('full')}
            >
              Full Text
            </button>
          </div>
          
          <div className="mt-4">
            {loadingSummary ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" style={{ color: "#75479C" }} />
                <span className="ml-2">Loading disclosure...</span>
              </div>
            ) : (
              <div className="prose max-w-none">
                <div className="p-6 rounded-lg border bg-white" style={{ color: '#000000' }}>
                  {documentSummary ? (
                    <div>
                      {activeTab === 'summary' ? (
                        <div>
                          <h3 className="text-lg font-semibold mb-2">Summary</h3>
                          <div 
                            className="bg-gray-50 p-4 rounded"
                            style={{ 
                              whiteSpace: 'normal',
                              lineHeight: '1.6',
                              fontSize: '0.95rem'
                            }}
                            dangerouslySetInnerHTML={{ 
                              __html: formatSummaryContent(documentSummary.summary) 
                            }}
                          />
                        </div>
                      ) : (
                        <div>
                          <h3 className="text-lg font-semibold mb-2">Full Text</h3>
                          <div className="whitespace-pre-wrap bg-gray-50 p-4 rounded max-h-96 overflow-y-auto">
                            {documentSummary.full_text}
                          </div>
                        </div>
                      )}
                      <div className="flex gap-2 mt-4">
                        <Button
                          variant="outline"
                          onClick={() => selectedDisclosure && handleDownloadDisclosure(selectedDisclosure)}
                          className="gap-2"
                          style={{ borderColor: '#0B74B0', color: '#0B74B0' }}
                        >
                          <Download className="h-4 w-4" />
                          Download Document
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p>Disclosure information not available</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end mt-6">
            <Button
              onClick={() => setIsModalOpen(false)}
              style={{
                backgroundColor: '#75479C',
                borderColor: '#75479C',
                color: 'white'
              }}
            >
              Close
            </Button>
          </div>
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

export default DirectorsDisclosureDataSource;