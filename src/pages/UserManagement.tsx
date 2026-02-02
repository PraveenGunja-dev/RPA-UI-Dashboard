import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import ProductDashboardLayout from "@/components/layout/ProductDashboardLayout";
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
    DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Users,
    UserPlus,
    Loader2,
    Shield,
    Trash2,
    Settings,
    ChevronRight,
    LayoutDashboard
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { hasRole } from "@/utils/adminAuth";

interface UserRoleMapping {
    email: string;
    role: string;
}

const UserManagement = () => {
    const [users, setUsers] = useState<UserRoleMapping[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [newEmail, setNewEmail] = useState("");
    const [newRole, setNewRole] = useState("bse_manager");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/admin/users');
            const data = await response.json();
            setUsers(data.users || []);
        } catch (err) {
            console.error('Error fetching users:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddUser = async () => {
        if (!newEmail) return;
        setIsSubmitting(true);
        try {
            const response = await fetch('/api/admin/users/assign-role', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_email: newEmail, role: newRole })
            });
            if (response.ok) {
                setIsAddDialogOpen(false);
                setNewEmail("");
                fetchUsers();
            } else {
                const err = await response.json();
                alert(err.detail || 'Failed to add user');
            }
        } catch (err) {
            alert('Error connecting to server');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRemoveRole = async (email: string, role: string) => {
        if (!confirm(`Are you sure you want to remove the ${role} role from ${email}?`)) return;
        try {
            const response = await fetch('/api/admin/users/remove-role', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_email: email, role: role })
            });
            if (response.ok) {
                fetchUsers();
            }
        } catch (err) {
            alert('Error removing role');
        }
    };

    if (!hasRole('admin')) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <h1 className="text-2xl font-bold">Access Denied: Admin role required.</h1>
            </div>
        );
    }

    const navigationItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
        { id: 'users', label: 'User Management', icon: Users, href: '/user-management', isActive: true }
    ];

    return (
        <ProductDashboardLayout
            productName="RBAC Console"
            productRoute="/user-management"
            navigationItems={navigationItems}
        >
            <div className="p-8">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8 flex justify-between items-center"
                >
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            <Shield className="h-8 w-8 text-blue-600" />
                            User Role Management
                        </h1>
                        <p className="text-gray-500 mt-2">Manage user access and application roles for Aegis platform</p>
                    </div>
                    <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
                        <UserPlus className="h-4 w-4" />
                        Assign New Role
                    </Button>
                </motion.div>

                <Card>
                    <CardHeader>
                        <CardTitle>Configured Permissions</CardTitle>
                        <CardDescription>Direct mapping of user emails to application roles</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                            </div>
                        ) : (
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>User Email</TableHead>
                                            <TableHead>Assigned Role</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {users.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={3} className="text-center py-8 text-gray-400">
                                                    No user roles configured yet
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            users.map((user, idx) => (
                                                <TableRow key={`${user.email}-${user.role}-${idx}`}>
                                                    <TableCell className="font-medium">{user.email}</TableCell>
                                                    <TableCell>
                                                        <Badge variant="secondary" className="capitalize">
                                                            {user.role.replace('_', ' ')}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                            onClick={() => handleRemoveRole(user.email, user.role)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogContent className="max-w-md bg-white">
                        <DialogHeader>
                            <DialogTitle>Assign Role to User</DialogTitle>
                            <DialogDescription>
                                Map a user's Azure AD email to a specific application role.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">User Email (from Azure AD)</Label>
                                <Input
                                    id="email"
                                    placeholder="user@adani.com"
                                    value={newEmail}
                                    onChange={(e) => setNewEmail(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="role">Application Role</Label>
                                <Select value={newRole} onValueChange={setNewRole}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a role" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white">
                                        <SelectItem value="admin">System Admin</SelectItem>
                                        <SelectItem value="bse_manager">BSE Dashboard Manager</SelectItem>
                                        <SelectItem value="rbi_manager">RBI Portal Manager</SelectItem>
                                        <SelectItem value="sebi_manager">SEBI Dashboard Manager</SelectItem>
                                        <SelectItem value="insider_trading_manager">Insider Trading Manager</SelectItem>
                                        <SelectItem value="directors_disclosure_manager">Director Disclosure Manager</SelectItem>
                                        <SelectItem value="minutes_manager">Minutes Preparation Manager</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-4">
                            <DialogClose asChild>
                                <Button variant="outline">Cancel</Button>
                            </DialogClose>
                            <Button onClick={handleAddUser} disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Assign Role"}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </ProductDashboardLayout>
    );
};

export default UserManagement;
