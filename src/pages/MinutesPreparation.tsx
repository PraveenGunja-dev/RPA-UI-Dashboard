import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, ArrowLeft, Lock, Users, Plus, Edit, Trash2 } from 'lucide-react';
import ProductDashboardLayout from '@/components/layout/ProductDashboardLayout';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { isAdmin, logoutUser, hasRole, isAuthenticated as isAuth, storeUserSession } from '@/utils/adminAuth';

interface Director {
  id: number;
  name: string;
  din: string;
  created_at: string;
}

export default function MinutesPreparation() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showLogin, setShowLogin] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [directors, setDirectors] = useState<Director[]>([]);
  const [isLoadingDirectors, setIsLoadingDirectors] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingDirector, setEditingDirector] = useState<Director | null>(null);
  const [formData, setFormData] = useState({ name: '', din: '' });
  const [submitting, setSubmitting] = useState(false);

  // Define navigation items for this product
  const navigationItems = [
    {
      id: 'home',
      label: 'Home',
      icon: FileText,
      href: '/',
    },
    {
      id: 'dashboard',
      label: 'Minutes Generator',
      icon: FileText,
      href: '/minutes-preparation',
    },
    {
      id: 'ai-mom',
      label: 'AI MOM',
      icon: FileText,
      href: '/minutes-preparation/ai-assistant',
    },
    {
      id: 'directors',
      label: 'Directors',
      icon: Users,
      href: '/minutes-preparation/directors',
    }
  ];

  // Check authentication status on component mount
  useEffect(() => {
    setIsAuthenticated(isAdmin() || hasRole('minutes_manager'));
  }, []);

  // Fetch directors data
  const fetchDirectorsData = async () => {
    if (!isAuthenticated) return;

    setIsLoadingDirectors(true);
    try {
      const response = await fetch('/directors');
      if (response.ok) {
        const result = await response.json();
        setDirectors(result.data);
      } else {
        console.error('Failed to fetch directors data');
      }
    } catch (error) {
      console.error('Error fetching directors data:', error);
    } finally {
      setIsLoadingDirectors(false);
    }
  };

  useEffect(() => {
    fetchDirectorsData();
  }, [isAuthenticated]);

  // Handle login
  const handleLogin = async () => {
    try {
      // Use the common admin login endpoint
      const response = await fetch('/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (data.success) {
        // For legacy login, we simulate the structure expected by storeUserSession
        // In a real scenario, /admin/login should also return roles and user info
        storeUserSession({
          success: true,
          message: 'Authenticated via Legacy Login',
          token: data.token,
          user: {
            email: username,
            name: 'Admin User',
            roles: ['admin'] // Default to admin for legacy login
          }
        });

        setIsAuthenticated(true);
        setShowLogin(false);
        setUsername('');
        setPassword('');
        setLoginError('');
      } else {
        setLoginError(data.message || 'Invalid credentials. Please try again.');
      }
    } catch (error) {
      setLoginError('An error occurred during login. Please try again.');
    }
  };

  // Handle logout
  const handleLogout = () => {
    logoutUser();
    setIsAuthenticated(false);
  };

  // Handle navigation to form generator
  const handleNavigateToFormGenerator = () => {
    navigate('/minutes-preparation/form-generator');
  };

  // Handle key press for login form
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  // Filter directors based on search term
  const filteredDirectors = directors.filter(director =>
    director.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    director.din.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

      await fetchDirectorsData();
      setIsAddDialogOpen(false);
      setFormData({ name: '', din: '' });
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

      await fetchDirectorsData();
      setIsEditDialogOpen(false);
      setEditingDirector(null);
      setFormData({ name: '', din: '' });
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

      await fetchDirectorsData();
    } catch (err) {
      console.error('Error deleting director:', err);
      alert('Failed to delete director');
    }
  };

  const openEditDialog = (director: Director) => {
    setEditingDirector(director);
    setFormData({ name: director.name, din: director.din });
    setIsEditDialogOpen(true);
  };

  return (
    <ProductDashboardLayout
      productName="Minutes Generator"
      productRoute="/minutes-preparation"
      navigationItems={navigationItems}
    >
      <div className="container mx-auto py-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold">Minutes Generator</h1>
            <p className="text-muted-foreground">Automated meeting minutes generation</p>
          </div>
          <div className="flex gap-2">
            {isAuthenticated ? (
              <Button
                variant="outline"
                onClick={handleLogout}
                className="flex items-center gap-2"
              >
                <Lock className="h-4 w-4" />
                Logout
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => setShowLogin(true)}
                className="flex items-center gap-2"
              >
                <Lock className="h-4 w-4" />
                Admin Login
              </Button>
            )}
          </div>
        </div>

        {/* Directors List Section */}
        {location.pathname === '/minutes-preparation/directors' && isAuthenticated ? (
          <div className="mt-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
              <div>
                <h2 className="text-2xl font-bold">Directors List</h2>
                <p className="text-muted-foreground">View and manage company directors</p>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Search directors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full md:w-64"
                />
                <Button
                  onClick={() => {
                    setFormData({ name: '', din: '' });
                    setIsAddDialogOpen(true);
                  }}
                  className="gap-2 whitespace-nowrap"
                >
                  <Plus className="h-4 w-4" />
                  Add Director
                </Button>
              </div>
            </div>

            <Card>
              <CardContent className="p-0">
                {isLoadingDirectors ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="mt-2">Loading directors...</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>DIN</TableHead>
                        <TableHead>Created At</TableHead>
                        <TableHead className="text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredDirectors.length > 0 ? (
                        filteredDirectors.map((director) => (
                          <TableRow key={director.id}>
                            <TableCell className="font-medium">{director.name}</TableCell>
                            <TableCell>{director.din}</TableCell>
                            <TableCell>{new Date(director.created_at).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <div className="flex gap-2 justify-center">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openEditDialog(director)}
                                  className="gap-1"
                                >
                                  <Edit className="h-3 w-3" />
                                  Edit
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleDeleteDirector(director.id)}
                                  className="gap-1"
                                >
                                  <Trash2 className="h-3 w-3" />
                                  Delete
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8">
                            {searchTerm ? 'No directors found matching your search.' : 'No directors found.'}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        ) : location.pathname === '/minutes-preparation/directors' && !isAuthenticated ? (
          <Card className="max-w-2xl mx-auto mt-12">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <Lock className="h-12 w-12 text-red-500" />
              </div>
              <CardTitle className="text-2xl">Access Denied</CardTitle>
              <CardDescription>
                You need to be logged in as an administrator to view directors information.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button
                className="w-full flex items-center justify-center gap-2 py-6 text-lg"
                onClick={() => setShowLogin(true)}
              >
                <Lock className="h-5 w-5" />
                Login to View Directors
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Generate Minutes Card - Only Feature */}
            <div className="max-w-2xl mx-auto mt-8">
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-center mb-4">
                    <FileText className="h-12 w-12 text-blue-500" />
                  </div>
                  <CardTitle className="text-center">Generate Meeting Minutes</CardTitle>
                  <CardDescription className="text-center">
                    Create professional meeting minutes from templates
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  {isAuthenticated ? (
                    <Button
                      className="w-full flex items-center justify-center gap-2 py-6 text-lg"
                      onClick={handleNavigateToFormGenerator}
                    >
                      <FileText className="h-5 w-5" />
                      Generate Minutes
                    </Button>
                  ) : (
                    <Button
                      className="w-full flex items-center justify-center gap-2 py-6 text-lg"
                      onClick={() => setShowLogin(true)}
                    >
                      <Lock className="h-5 w-5" />
                      Login to Generate Minutes
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Information Section */}
            <Card className="max-w-4xl mx-auto mt-12">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Minutes Generation</CardTitle>
                <CardDescription>
                  Generate professional meeting minutes with our template-based system
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <p className="mb-4">
                  This tool allows you to generate meeting minutes quickly and efficiently using predefined templates.
                </p>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">How it works:</h3>
                  <ul className="text-left list-disc pl-5 space-y-1 text-sm">
                    <li>Select a quarterly template (Q1-Q4)</li>
                    <li>Fill in the required information in the form</li>
                    <li>Generate and download your professional meeting minutes document</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Login Dialog */}
      <Dialog open={showLogin} onOpenChange={setShowLogin}>
        <DialogContent className="sm:max-w-md bg-white border border-gray-200 shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Admin Login</DialogTitle>
            <DialogDescription className="text-gray-600">
              Enter your credentials to access the minutes generation tool.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-gray-700">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyPress={handleKeyPress}
                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            {loginError && (
              <div className="text-red-500 text-sm">{loginError}</div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowLogin(false);
                  setLoginError('');
                }}
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button
                onClick={handleLogin}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Login
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Director Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Add New Director</DialogTitle>
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
          <div className="flex justify-end gap-2 pt-2">
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
            >
              {submitting ? 'Adding...' : 'Add Director'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Director Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Edit Director</DialogTitle>
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
          </div>
          <div className="flex justify-end gap-2 pt-2">
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
            >
              {submitting ? 'Updating...' : 'Update Director'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </ProductDashboardLayout>
  );
};
