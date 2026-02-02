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
import { Mail, Plus, Loader2, AlertCircle, Lock, Trash2, X as XIcon } from "lucide-react";
import * as XLSX from 'xlsx';
// Import admin authentication utilities
import { hasRole, isAuthenticated, logoutUser } from "@/utils/adminAuth";

// Generic interface for Excel data
interface ExcelRow {
  [key: string]: string | number;
}

const EmailData = () => {
  // Add scroll to top effect
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [emailData, setEmailData] = useState<ExcelRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [newEmail, setNewEmail] = useState<string>('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [columnNames, setColumnNames] = useState<string[]>([]);
  // Admin authentication state
  const [isAdminMode, setIsAdminMode] = useState<boolean>(false);
  const [showAdminLogin, setShowAdminLogin] = useState<boolean>(false);
  const [adminUsername, setAdminUsername] = useState<string>('');
  const [adminPassword, setAdminPassword] = useState<string>('');
  // Delete confirmation state
  const [emailToDelete, setEmailToDelete] = useState<ExcelRow | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  // Filter state
  const [searchFilter, setSearchFilter] = useState<string>('');

  // Check admin status on component mount
  useEffect(() => {
    setIsAdminMode(hasRole('bse_manager'));
  }, []);

  // Load emails from database via FastAPI server
  useEffect(() => {
    const loadEmailData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Use relative path since frontend and backend are served from the same origin
        const API_BASE_URL = '';

        // Fetch emails from FastAPI server with optional search filter
        const searchParam = searchFilter ? `?search=${encodeURIComponent(searchFilter)}` : '';
        const response = await fetch(`${API_BASE_URL}/emails${searchParam}`);

        if (!response.ok) {
          throw new Error(`Failed to load email data: ${response.status}`);
        }

        const result = await response.json();

        // Convert email list to table format with serial numbers
        const emailDataWithSerial = result.emails.map((email: string, index: number) => ({
          'Sr. No': index + 1,
          'Email ID': email
        }));

        setEmailData(emailDataWithSerial);
        setColumnNames(['Sr. No', 'Email ID']);
      } catch (err) {
        console.error('Error loading email data:', err);
        setError('Failed to load email data');
      } finally {
        setLoading(false);
      }
    };

    loadEmailData();
  }, [searchFilter]);

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

  // Handle search filter change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchFilter(e.target.value);
  };

  // Clear search filter
  const clearSearchFilter = () => {
    setSearchFilter('');
  };

  // Handle admin logout
  const handleLogout = () => {
    logoutUser();
    setIsAdminMode(false);
  };

  // Set email to delete and open confirmation dialog
  const handleDeleteEmail = (email: ExcelRow) => {
    setEmailToDelete(email);
    setIsDeleteDialogOpen(true);
  };

  // Add new email
  const handleAddEmail = async (): Promise<void> => {
    if (!newEmail.trim()) return;

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail.trim())) {
      alert('Please enter a valid email address');
      return;
    }

    // Validate that email is from adani.com or pspprojects.com domain (case-insensitive)
    const emailLower = newEmail.trim().toLowerCase();
    if (!emailLower.endsWith('@adani.com') && !emailLower.endsWith('@pspprojects.com')) {
      alert('Only emails from adani.com or pspprojects.com domains are allowed');
      return;
    }

    setIsLoading(true);

    try {
      // Use relative path since frontend and backend are served from the same origin
      const API_BASE_URL = '/api';

      // Add email via API
      const response = await fetch(`${API_BASE_URL}/emails`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: newEmail.trim() })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to add email');
      }

      // Refresh email list
      const refreshResponse = await fetch(`${API_BASE_URL}/emails`);
      if (refreshResponse.ok) {
        const result = await refreshResponse.json();
        const emailDataWithSerial = result.emails.map((email: string, index: number) => ({
          'Sr. No': index + 1,
          'Email ID': email
        }));
        setEmailData(emailDataWithSerial);
      }

      // Reset form
      setNewEmail('');
      setIsAddDialogOpen(false);
    } catch (err) {
      console.error('Error adding email:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to add email';
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Confirm and delete email
  const confirmDeleteEmail = async () => {
    if (!emailToDelete) return;

    setIsLoading(true);

    try {
      // Get the email address from the row data
      const emailToDeleteAddress = String(emailToDelete['Email ID']);

      // Use relative path since frontend and backend are served from the same origin
      const API_BASE_URL = '';

      // Delete email via API (URL encode the email address)
      const encodedEmail = encodeURIComponent(emailToDeleteAddress);
      const response = await fetch(`${API_BASE_URL}/emails/${encodedEmail}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to delete email');
      }

      // Refresh email list
      const refreshResponse = await fetch(`${API_BASE_URL}/emails`);
      if (refreshResponse.ok) {
        const result = await refreshResponse.json();
        const emailDataWithSerial = result.emails.map((email: string, index: number) => ({
          'Sr. No': index + 1,
          'Email ID': email
        }));
        setEmailData(emailDataWithSerial);
      }

      setIsDeleteDialogOpen(false);
      setEmailToDelete(null);
    } catch (err) {
      console.error('Error deleting email:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete email';
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <BSEAlertsDashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" style={{ color: "#BD3861" }} />
            <p className="text-lg" style={{ color: "#000000" }}>Loading email data...</p>
          </div>
        </div>
      </BSEAlertsDashboardLayout>
    );
  }

  if (error) {
    return (
      <BSEAlertsDashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center p-6 max-w-md">
            <AlertCircle className="h-12 w-12 mx-auto mb-4" style={{ color: "#EF4444" }} />
            <h2 className="text-xl font-bold mb-2" style={{ color: "#000000" }}>Error Loading Email Data</h2>
            <p className="mb-4" style={{ color: "#000000" }}>{error}</p>
            <Button
              onClick={() => window.location.reload()}
              style={{
                backgroundColor: '#BD3861',
                borderColor: '#BD3861',
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

  // Determine column names dynamically
  const emailColumn = columnNames.find(col => col.toLowerCase().includes('email')) || 'email';

  return (
    <BSEAlertsDashboardLayout>

      <div className="min-h-screen p-8" style={{
        background: "#FFFFFF"
      }}>
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
                <Mail className="h-8 w-8" style={{ color: "#1E40AF" }} />
                <CardTitle className="text-2xl sm:text-3xl lg:text-4xl font-bold " style={{ color: "#000000" }}>
                  EMAIL DATA
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
                Email addresses and contact information
              </CardDescription>
            </CardHeader>
          </Card>
        </motion.div>

        {/* Authentication Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.0, delay: 0.2 }}
          className="mb-4"
        >
          <div className="flex justify-end gap-3">
            {isAuthenticated() ? (
              <Button
                variant="outline"
                onClick={handleLogout}
                className="flex items-center gap-2"
                style={{
                  color: '#EF4444',
                  borderColor: '#EF4444'
                }}
              >
                <Lock className="h-4 w-4" />
                Sign Out
              </Button>
            ) : (
              <>
                <Button
                  onClick={handleAzureLogin}
                  className="flex items-center gap-2"
                  style={{
                    backgroundColor: '#0078D4',
                    borderColor: '#0078D4',
                    color: 'white'
                  }}
                >
                  <img src="https://authjs.dev/img/providers/azure.svg" className="h-4 w-4 mr-1" alt="Azure AD" />
                  Sign in with Microsoft
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowAdminLogin(true)}
                  className="flex items-center gap-2"
                  style={{
                    color: '#666',
                    borderColor: '#ccc'
                  }}
                >
                  Legacy Login
                </Button>
              </>
            )}
          </div>
        </motion.div>

        {/* Admin Login Dialog */}
        <Dialog open={showAdminLogin} onOpenChange={setShowAdminLogin}>
          <DialogContent className="sm:max-w-md" style={{ background: '#ffffff' }}>
            <DialogHeader>
              <DialogTitle style={{ color: '#000000' }}>Admin Login</DialogTitle>
              <DialogDescription style={{ color: '#000000' }}>
                Enter admin credentials to access email management features.
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
                Are you sure you want to delete this email address? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            {emailToDelete && (
              <div className="space-y-4">
                <div className="p-4 bg-red-50 rounded-lg">
                  <p className="text-sm font-medium" style={{ color: '#000000' }}>
                    {String(emailToDelete[emailColumn])}
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
                    onClick={confirmDeleteEmail}
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

        {/* Email Data Table */}
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
                    Email Addresses
                  </CardTitle>
                  <CardDescription style={{ color: '#000000' }}>
                    {emailData.length} email addresses in the system
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
                    Add Email
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="px-0 py-0">
              {/* Search Filter */}
              <div className="mb-4 flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Input
                    type="text"
                    placeholder="Search emails..."
                    value={searchFilter}
                    onChange={handleSearchChange}
                    className="pr-10"
                    style={{
                      borderColor: '#000000'
                    }}
                  />
                  {searchFilter && (
                    <button
                      onClick={clearSearchFilter}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      <XIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
                {searchFilter && (
                  <Button
                    variant="outline"
                    onClick={clearSearchFilter}
                    className="flex items-center gap-2"
                    style={{
                      color: '#EF4444',
                      borderColor: '#EF4444'
                    }}
                  >
                    <XIcon className="h-4 w-4" />
                    Clear
                  </Button>
                )}
              </div>

              {emailData.length > 0 ? (
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
                      {emailData.map((row, index) => (
                        <TableRow
                          key={index}
                          style={{
                            backgroundColor: index % 2 === 0 ? 'transparent' : 'rgba(0, 0, 0, 0.02)'
                          }}
                        >
                          {columnNames.map((column) => (
                            <TableCell
                              key={`${index}-${column}`}
                              className="py-2"
                              style={{ color: '#000000' }}
                            >
                              {row[column]}
                            </TableCell>
                          ))}
                          {isAdminMode && (
                            <TableCell className="text-right py-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteEmail(row)}
                                className="flex items-center gap-1"
                                style={{
                                  color: '#EF4444',
                                  borderColor: '#EF4444'
                                }}
                              >
                                <Trash2 className="h-3 w-3" />
                                Delete
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 border rounded-md" style={{ borderColor: '#000000' }}>
                  <Mail className="h-12 w-12 mx-auto mb-4" style={{ color: '#1E40AF' }} />
                  <p className="text-lg" style={{ color: '#000000' }}>
                    {searchFilter ? 'No emails match your search' : 'No email addresses found'}
                  </p>
                  {searchFilter && (
                    <Button
                      variant="outline"
                      onClick={clearSearchFilter}
                      className="mt-2"
                      style={{
                        color: '#1E40AF',
                        borderColor: '#1E40AF'
                      }}
                    >
                      Clear Search
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Add Email Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="sm:max-w-md" style={{ background: '#ffffff' }}>
            <DialogHeader>
              <DialogTitle style={{ color: '#000000' }}>Add New Email</DialogTitle>
              <DialogDescription style={{ color: '#000000' }}>
                Enter a new email address to add to the system.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newEmail" style={{ color: '#000000' }}>Email Address</Label>
                <Input
                  id="newEmail"
                  type="email"
                  placeholder="Enter email address"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleAddEmail();
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
                    onClick={() => setNewEmail('')}
                    style={{
                      color: '#000000',
                      borderColor: '#000000'
                    }}
                  >
                    Cancel
                  </Button>
                </DialogClose>
                <Button
                  onClick={handleAddEmail}
                  disabled={isLoading || !newEmail.trim()}
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
                    'Add Email'
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Status Footer */}
      </div>
    </BSEAlertsDashboardLayout>
  );
};

export default EmailData;