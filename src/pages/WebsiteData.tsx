import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import BSEAlertsDashboardLayout from "@/components/layout/BSEAlertsDashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Globe, ExternalLink, Plus, Loader2, AlertCircle, Lock, Trash2 } from "lucide-react";
import NotificationBar from "@/components/ui/NotificationBar";
// Import admin authentication utilities
import { hasRole, isAuthenticated, logoutUser } from "@/utils/adminAuth";
import { MicrosoftIcon } from "@/components/icons/MicrosoftIcon";

// Generic interface for Excel data
interface ExcelRow {
  [key: string]: string | number;
}

const WebsiteData = () => {
  // Add scroll to top effect
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [websiteData, setWebsiteData] = useState<ExcelRow[]>([]);
  const [columnNames, setColumnNames] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [newEntityName, setNewEntityName] = useState<string>('');
  const [newWebsiteUrl, setNewWebsiteUrl] = useState<string>('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  // Admin authentication state
  const [isAdminMode, setIsAdminMode] = useState<boolean>(false);
  const [showAdminLogin, setShowAdminLogin] = useState<boolean>(false);
  const [adminUsername, setAdminUsername] = useState<string>('');
  const [adminPassword, setAdminPassword] = useState<string>('');
  // Delete confirmation state
  const [websiteToDelete, setWebsiteToDelete] = useState<ExcelRow | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);

  // Check admin status on component mount
  useEffect(() => {
    setIsAdminMode(hasRole('bse_manager'));
  }, []);

  // Handle Azure AD SSO Login
  const handleAzureLogin = async () => {
    try {
      const response = await fetch('/api/auth/login');
      const data = await response.json();
      if (data.redirect_url) {
        window.location.href = data.redirect_url;
      }
    } catch (err) {
      console.error('Error initiating Azure login:', err);
      alert('Failed to connect to authentication server');
    }
  };

  // Load websites from Excel file via FastAPI server
  useEffect(() => {
    const loadWebsiteData = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('Attempting to load Entity.xlsx data from FastAPI server');

        // Use relative path since frontend and backend are served from the same origin
        const apiUrl = '';
        const response = await fetch(`${apiUrl}/excel-data/Entity.xlsx?sheet_name=Sheet1`);
        console.log('Fetch response status:', response.status);
        console.log('Fetch response ok:', response.ok);

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to load entity data: ${response.statusText} (${response.status}) - ${errorText}`);
        }

        const result = await response.json();
        console.log('Server response:', result);

        const jsonData = result.data;
        const columns = result.columns;

        console.log('Parsed data length:', jsonData.length);
        if (jsonData.length > 0) {
          console.log('First few rows:', jsonData.slice(0, 5));
          console.log('Column names:', columns);
        }

        setWebsiteData(jsonData);
        setColumnNames(columns);
      } catch (err) {
        console.error('Error loading website data:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to load website data';
        setError(errorMessage);
        setWebsiteData([]); // Empty array instead of fallback data
        setColumnNames([]); // Empty column names
      } finally {
        setLoading(false);
      }
    };

    loadWebsiteData();
  }, []);

  // Handle legacy admin login
  const handleAdminLogin = async () => {
    try {
      const response = await fetch('/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: adminUsername, password: adminPassword })
      });
      const result = await response.json();
      if (result.success) {
        // Mock store session for legacy
        localStorage.setItem('adminToken', result.token || 'legacy-token');
        localStorage.setItem('userRoles', JSON.stringify(['admin']));
        setIsAdminMode(true);
        setShowAdminLogin(false);
      } else {
        alert('Invalid credentials');
      }
    } catch (err) {
      alert('Login failed');
    }
  };

  // Handle admin logout
  const handleAdminLogout = () => {
    logoutUser();
    setIsAdminMode(false);
  };

  // Add new website
  const handleAddWebsite = (): void => {
    if (!newEntityName.trim() || !newWebsiteUrl.trim()) {
      alert('Please fill in both fields');
      return;
    }

    // Basic URL validation
    const urlRegex = /^https?:\/\/.+\..+/;
    let formattedUrl = newWebsiteUrl.trim();

    // Add https:// if no protocol specified
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = 'https://' + formattedUrl;
    }

    if (!urlRegex.test(formattedUrl)) {
      alert('Please enter a valid website URL');
      return;
    }

    // Check for duplicates (using the first column and "Website" if it exists)
    const firstColumnName = columnNames[0] || "Sr. No";
    const urlColumnName = columnNames.find(col => col.toLowerCase().includes("website") || col.toLowerCase().includes("url")) || "Website";
    const nameColumnName = columnNames.find(col => col.toLowerCase().includes("entity") || col.toLowerCase().includes("name")) || "Entity";

    if (websiteData.some(website =>
      website[nameColumnName]?.toString().toLowerCase() === newEntityName.trim().toLowerCase() ||
      website[urlColumnName]?.toString().toLowerCase() === formattedUrl.toLowerCase()
    )) {
      alert('This entity name or website URL already exists');
      return;
    }

    setIsLoading(true);

    // Create new website entry with dynamic column names
    const newWebsiteEntry: ExcelRow = {};

    // Set the first column (serial number)
    newWebsiteEntry[firstColumnName] = Math.max(...websiteData.map(w => {
      const value = w[firstColumnName];
      return typeof value === 'number' ? value : 0;
    }), 0) + 1;

    // Set other columns
    newWebsiteEntry[nameColumnName] = newEntityName.trim();
    newWebsiteEntry[urlColumnName] = formattedUrl;

    const updatedWebsites = [...websiteData, newWebsiteEntry];
    setWebsiteData(updatedWebsites);

    // Reset form
    setNewEntityName('');
    setNewWebsiteUrl('');
    setIsAddDialogOpen(false);
    setIsLoading(false);
  };

  // Handle opening external website link
  const handleOpenWebsite = (url: string): void => {
    if (url.startsWith('http')) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  // Set website to delete and open confirmation dialog
  const handleDeleteWebsite = (website: ExcelRow) => {
    setWebsiteToDelete(website);
    setIsDeleteDialogOpen(true);
  };

  // Confirm and delete website
  const confirmDeleteWebsite = () => {
    if (!websiteToDelete) return;

    const updatedWebsites = websiteData.filter(website =>
      website !== websiteToDelete
    );

    setWebsiteData(updatedWebsites);
    setIsDeleteDialogOpen(false);
    setWebsiteToDelete(null);
  };

  // Helper functions to get column names
  const getUrlColumnName = (): string => {
    return columnNames.find(col => col.toLowerCase().includes("website") || col.toLowerCase().includes("url")) || "Website";
  };

  const getNameColumnName = (): string => {
    return columnNames.find(col => col.toLowerCase().includes("entity") || col.toLowerCase().includes("name")) || "Entity";
  };

  const getFirstColumnName = (): string => {
    return columnNames[0] || "Sr. No";
  };

  if (loading) {
    return (
      <BSEAlertsDashboardLayout>
        <NotificationBar />
        <div className="min-h-screen flex items-center justify-center" style={{ background: "#ffffff" }}>
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" style={{ color: "#1E40AF" }} />
            <p className="text-lg" style={{ color: "#000000" }}>Loading website data...</p>
          </div>
        </div>
      </BSEAlertsDashboardLayout>
    );
  }

  if (error) {
    return (
      <BSEAlertsDashboardLayout>
        <NotificationBar />
        <div className="min-h-screen flex items-center justify-center" style={{ background: "#ffffff" }}>
          <div className="text-center p-6 max-w-md">
            <AlertCircle className="h-12 w-12 mx-auto mb-4" style={{ color: "#EF4444" }} />
            <h2 className="text-xl font-bold mb-2" style={{ color: "#000000" }}>Error Loading Website Data</h2>
            <p className="mb-4" style={{ color: "#000000" }}>{error}</p>
            <p className="mb-4 text-sm" style={{ color: "#666666" }}>
              Please make sure the FastAPI server is running and the Entity.xlsx file exists in the backend public/excel folder.
            </p>
            <Button
              onClick={() => window.location.reload()}
              style={{
                backgroundColor: '#1E40AF',
                borderColor: '#1E40AF',
                color: 'white'
              }}
            >
              Retry
            </Button>
          </div>
        </div>
      </BSEAlertsDashboardLayout>
    );
  }

  const urlColumnName = getUrlColumnName();
  const nameColumnName = getNameColumnName();
  const firstColumnName = getFirstColumnName();

  return (
    <BSEAlertsDashboardLayout>
      {/* Notification Bar at top of page */}
      <NotificationBar />

      <div className="min-h-screen" style={{
        background: "#ffffff",
      }}>
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.0, ease: "easeOut" }}
            className="mb-8"
          >
            <Card className="border-0 shadow-none bg-transparent">
              <CardHeader className="px-0 pb-4">
                <div className="flex items-center gap-3 mb-2">
                  <Globe className="h-8 w-8" style={{ color: "#1E40AF" }} />
                  <CardTitle className="text-2xl sm:text-3xl lg:text-4xl font-bold " style={{ color: "#000000" }}>
                    WEBSITE DATA
                  </CardTitle>
                  {/* Admin mode indicator */}
                  {isAdminMode && (
                    <Badge variant="outline" style={{ color: '#1E40AF', borderColor: '#1E40AF', background: 'transparent' }}>
                      <Lock className="h-3 w-3 mr-1" />
                      Admin Mode
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-lg" style={{ color: '#000000' }}>
                  Entity websites and digital presence information
                </CardDescription>
              </CardHeader>
            </Card>
          </motion.div>

          {/* Admin Controls */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.0, delay: 0.2 }}
            className="mb-4"
          >
            <div className="flex justify-end">
              {isAdminMode ? (
                <Button
                  variant="outline"
                  onClick={handleAdminLogout}
                  className="flex items-center gap-2"
                  style={{
                    color: '#EF4444',
                    borderColor: '#EF4444'
                  }}
                >
                  <Lock className="h-4 w-4" />
                  Logout
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleAzureLogin}
                    className="flex items-center gap-2"
                    style={{
                      color: '#1E40AF',
                      borderColor: '#1E40AF',
                      fontWeight: '700'
                    }}
                  >
                    <MicrosoftIcon className="h-4 w-4" />
                    Sign in with Microsoft
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setShowAdminLogin(true)}
                    className="flex items-center gap-2 mt-2 text-xs opacity-50 hover:opacity-100"
                  >
                    <Lock className="h-3 w-3" />
                    Legacy Login
                  </Button>
                </div>
              )}
            </div>
          </motion.div>

          {/* Admin Login Dialog */}
          <Dialog open={showAdminLogin} onOpenChange={setShowAdminLogin}>
            <DialogContent className="sm:max-w-md" style={{ background: '#ffffff' }}>
              <DialogHeader>
                <DialogTitle style={{ color: '#000000' }}>Admin Login</DialogTitle>
                <DialogDescription style={{ color: '#000000' }}>
                  Enter admin credentials to access website management features.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username" style={{ color: '#000000' }}>Username</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter username"
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value)}
                    style={{
                      borderColor: '#000000'
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" style={{ color: '#000000' }}>Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleAdminLogin();
                      }
                    }}
                    style={{
                      borderColor: '#000000'
                    }}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowAdminLogin(false)}
                    style={{
                      color: '#000000',
                      borderColor: '#000000'
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAdminLogin}
                    style={{
                      backgroundColor: '#1E40AF',
                      borderColor: '#1E40AF',
                      color: 'white'
                    }}
                  >
                    Login
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Delete Confirmation Dialog */}
          <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <DialogContent className="sm:max-w-md" style={{ background: '#ffffff' }}>
              <DialogHeader>
                <DialogTitle style={{ color: '#000000' }}>Confirm Delete</DialogTitle>
                <DialogDescription style={{ color: '#000000' }}>
                  Are you sure you want to delete this website entry? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              {websiteToDelete && (
                <div className="space-y-4">
                  <div className="p-4 bg-red-50 rounded-lg">
                    <p className="text-sm font-medium" style={{ color: '#000000' }}>
                      {String(websiteToDelete[nameColumnName])}
                    </p>
                    <p className="text-sm" style={{ color: '#666666' }}>
                      {String(websiteToDelete[urlColumnName])}
                    </p>
                  </div>
                  <div className="flex justify-end gap-2">
                    <DialogClose asChild>
                      <Button
                        variant="outline"
                        style={{
                          color: '#000000',
                          borderColor: '#000000'
                        }}
                      >
                        Cancel
                      </Button>
                    </DialogClose>
                    <Button
                      onClick={confirmDeleteWebsite}
                      style={{
                        backgroundColor: '#EF4444',
                        borderColor: '#EF4444',
                        color: 'white'
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Website Data Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.0, delay: 0.4 }}
          >
            <Card className="border-0 shadow-none bg-transparent">
              <CardHeader className="px-0 py-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <CardTitle className="text-xl font-bold" style={{ color: "#000000" }}>
                      Entity Websites
                    </CardTitle>
                    <CardDescription style={{ color: '#000000' }}>
                      {websiteData.length} entities in the system
                    </CardDescription>
                  </div>
                  {isAdminMode && (
                    <Button
                      onClick={() => setIsAddDialogOpen(true)}
                      className="flex items-center gap-2"
                      style={{
                        backgroundColor: '#1E40AF',
                        borderColor: '#1E40AF',
                        color: 'white'
                      }}
                    >
                      <Plus className="h-4 w-4" />
                      Add Website
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="px-0 py-0">
                {websiteData.length > 0 ? (
                  <div className="rounded-md border" style={{ borderColor: '#000000' }}>
                    <Table>
                      <TableHeader>
                        <TableRow style={{ backgroundColor: 'rgba(30, 64, 175, 0.1)' }}>
                          {columnNames.map((column) => (
                            <TableHead
                              key={column}
                              className="font-bold"
                              style={{ color: '#000000' }}
                            >
                              {column}
                            </TableHead>
                          ))}
                          {isAdminMode && (
                            <TableHead
                              className="font-bold text-right"
                              style={{ color: '#000000' }}
                            >
                              Actions
                            </TableHead>
                          )}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {websiteData.map((row, index) => (
                          <TableRow
                            key={index}
                            className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                          >
                            {columnNames.map((column) => (
                              <TableCell
                                key={column}
                                style={{ color: '#000000' }}
                              >
                                {column.toLowerCase().includes("website") || column.toLowerCase().includes("url") ? (
                                  <div className="flex items-center gap-2">
                                    <span>{String(row[column])}</span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleOpenWebsite(String(row[column]))}
                                      className="h-6 w-6 p-0"
                                      style={{ color: '#1E40AF' }}
                                    >
                                      <ExternalLink className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ) : (
                                  String(row[column])
                                )}
                              </TableCell>
                            ))}
                            {isAdminMode && (
                              <TableCell className="text-right">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteWebsite(row)}
                                  style={{
                                    color: '#EF4444',
                                    borderColor: '#EF4444'
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8" style={{ color: '#000000' }}>
                    <Globe className="h-12 w-12 mx-auto mb-4" style={{ color: "#1E40AF" }} />
                    <p className="text-lg font-medium">No website data available</p>
                    <p className="text-sm">There are currently no entity websites in the system.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Add Website Dialog */}
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogContent className="sm:max-w-md" style={{ background: '#ffffff' }}>
              <DialogHeader>
                <DialogTitle style={{ color: '#000000' }}>Add New Website</DialogTitle>
                <DialogDescription style={{ color: '#000000' }}>
                  Enter a new entity and website URL to add to the system.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="entityName" style={{ color: '#000000' }}>Entity Name</Label>
                  <Input
                    id="entityName"
                    type="text"
                    placeholder="Enter entity name"
                    value={newEntityName}
                    onChange={(e) => setNewEntityName(e.target.value)}
                    style={{
                      borderColor: '#000000'
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="websiteUrl" style={{ color: '#000000' }}>Website URL</Label>
                  <Input
                    id="websiteUrl"
                    type="text"
                    placeholder="Enter website URL"
                    value={newWebsiteUrl}
                    onChange={(e) => setNewWebsiteUrl(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleAddWebsite();
                      }
                    }}
                    style={{
                      borderColor: '#000000'
                    }}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <DialogClose asChild>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setNewEntityName('');
                        setNewWebsiteUrl('');
                      }}
                      style={{
                        color: '#000000',
                        borderColor: '#000000'
                      }}
                    >
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button
                    onClick={handleAddWebsite}
                    disabled={isLoading || !newEntityName.trim() || !newWebsiteUrl.trim()}
                    style={{
                      backgroundColor: '#1E40AF',
                      borderColor: '#1E40AF',
                      color: 'white'
                    }}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      'Add Website'
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Status Footer - REMOVED as per user request */}
        </div>
      </div>
    </BSEAlertsDashboardLayout>
  );
};

export default WebsiteData;