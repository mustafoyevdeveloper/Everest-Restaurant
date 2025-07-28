import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { Eye, Trash, Loader2, Users, UserCheck, UserX, Shield, User, Filter, RefreshCw, Mail, Calendar, ShieldOff } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { getAdminStatusText } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  adminUsers: number;
  regularUsers: number;
}

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [filters, setFilters] = useState({ status: 'all', role: 'all' });
  const [updatingUser, setUpdatingUser] = useState<string | null>(null);
  const { toast } = useToast();
  const { t } = useTranslation();

  const statusOptions = [
    { value: 'all', label: t('admin.users.filters.status.all') },
    { value: 'active', label: t('admin.users.filters.status.active'), color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' },
    { value: 'inactive', label: t('admin.users.filters.status.inactive'), color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' }
  ];

  const roleOptions = [
    { value: 'all', label: t('admin.users.filters.role.all') },
    { value: 'user', label: t('admin.users.filters.role.user'), color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' },
    { value: 'admin', label: t('admin.users.filters.role.admin'), color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400' }
  ];

  const getStatusBadge = (isActive: boolean) => {
    const statusOption = statusOptions.find(option => 
      option.value === (isActive ? 'active' : 'inactive')
    );
    return (
      <Badge className={statusOption?.color || 'bg-gray-100 text-gray-800'}>
        {statusOption?.label || t(`admin.users.status.${isActive ? 'active' : 'inactive'}`)}
      </Badge>
    );
  };

  const getRoleBadge = (role: string) => {
    const roleOption = roleOptions.find(option => option.value === role);
    return (
      <Badge className={roleOption?.color || 'bg-gray-100 text-gray-800'}>
        {roleOption?.label || role}
      </Badge>
    );
  };

  const getStatusIcon = (isActive: boolean) => {
    return isActive ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />;
  };

  const getRoleIcon = (role: string) => {
    return role === 'admin' ? <Shield className="w-4 h-4" /> : <User className="w-4 h-4" />;
  };

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch('/admin/users');
      const usersData = data.data?.docs || data.data || [];
      setUsers(usersData);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch users');
      toast({ title: 'Error', description: err.message || 'Failed to fetch users', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await apiFetch('/admin/users/stats');
      setStats(data.data);
    } catch (err: any) {
      console.error('Failed to fetch user stats:', err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchStats();
    // eslint-disable-next-line
  }, []);

  const handleStatusUpdate = async (userId: string, isActive: boolean) => {
    setUpdatingUser(userId);
    try {
      await apiFetch(`/admin/users/${userId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ isActive })
      });
      toast({ title: 'Success', description: 'User status updated successfully' });
      fetchUsers(); // Refresh the list
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to update user status', variant: 'destructive' });
    } finally {
      setUpdatingUser(null);
    }
  };

  const handleRoleUpdate = async (userId: string, role: string) => {
    setUpdatingUser(userId);
    try {
      await apiFetch(`/admin/users/${userId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ role })
      });
      toast({ title: 'Success', description: 'User role updated successfully' });
      fetchUsers(); // Refresh the list
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to update user role', variant: 'destructive' });
    } finally {
      setUpdatingUser(null);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await apiFetch(`/admin/users/${userId}`, {
        method: 'DELETE'
      });
      toast({ title: 'Success', description: 'User deleted successfully' });
      fetchUsers(); // Refresh the list
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to delete user', variant: 'destructive' });
    }
  };

  const openUserDetails = (user: User) => {
    setSelectedUser(user);
    setIsDetailsModalOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('uz-UZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredUsers = users.filter(user => {
    if (filters.status && filters.status !== 'all') {
      const isActive = filters.status === 'active';
      if (user.isActive !== isActive) return false;
    }
    if (filters.role && filters.role !== 'all' && user.role !== filters.role) return false;
    return true;
  });

  return (
    <div className="admin-section p-4 md:p-6">
      <div className="admin-header">
        <h1 className="admin-title !text-black dark:!text-white">Foydalanuvchilar</h1>
          <Button variant="outline" size="sm" onClick={fetchUsers} className="admin-button">
          <RefreshCw className="w-4 h-4 mr-2" /> {t('admin.users.refresh', 'Refresh')}
          </Button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{t('admin.users.stats.totalUsers')}</p>
                <p className="text-xl md:text-2xl font-bold">{stats.totalUsers}</p>
              </div>
              <Users className="w-6 h-6 md:w-8 md:h-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{t('admin.users.stats.activeUsers')}</p>
                <p className="text-xl md:text-2xl font-bold">{stats.activeUsers}</p>
              </div>
              <UserCheck className="w-6 h-6 md:w-8 md:h-8 text-green-500" />
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{t('admin.users.stats.inactiveUsers')}</p>
                <p className="text-xl md:text-2xl font-bold">{stats.inactiveUsers}</p>
              </div>
              <UserX className="w-6 h-6 md:w-8 md:h-8 text-red-500" />
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{t('admin.users.stats.adminUsers')}</p>
                <p className="text-xl md:text-2xl font-bold">{stats.adminUsers}</p>
              </div>
              <Shield className="w-6 h-6 md:w-8 md:h-8 text-purple-500" />
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{t('admin.users.stats.regularUsers')}</p>
                <p className="text-xl md:text-2xl font-bold">{stats.regularUsers}</p>
              </div>
              <User className="w-6 h-6 md:w-8 md:h-8 text-gray-500" />
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Filter className="w-5 h-5" />
          <h3 className="font-semibold">{t('admin.users.filters.title')}</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
            <SelectTrigger>
              <SelectValue placeholder={t('admin.users.filters.status.placeholder')} />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.role} onValueChange={(value) => setFilters({ ...filters, role: value })}>
            <SelectTrigger>
              <SelectValue placeholder={t('admin.users.filters.role.placeholder')} />
            </SelectTrigger>
            <SelectContent>
              {roleOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="ml-2">{t('admin.users.loading')}</span>
        </div>
      ) : error ? (
        <div className="text-red-500 text-center py-8">{error}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white dark:bg-slate-800 border rounded-lg">
            <thead>
              <tr>
                <th className="px-4 py-2">{t('admin.users.table.id')}</th>
                <th className="px-4 py-2">{t('admin.users.table.name')}</th>
                <th className="px-4 py-2">{t('admin.users.table.email')}</th>
                <th className="px-4 py-2">{t('admin.users.table.role')}</th>
                <th className="px-4 py-2">{t('admin.users.table.status')}</th>
                <th className="px-4 py-2">{t('admin.users.table.registered')}</th>
                <th className="px-4 py-2">{t('admin.users.table.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user._id} className="border-t">
                  <td className="px-4 py-2">
                    <span className="font-mono text-sm">#{user._id.slice(-6)}</span>
                  </td>
                  <td className="px-4 py-2">
                    <div className="font-medium">{user.name}</div>
                  </td>
                  <td className="px-4 py-2">
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      {getRoleIcon(user.role)}
                      {getRoleBadge(user.role)}
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(user.isActive)}
                      {getStatusBadge(user.isActive)}
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <div className="text-sm">
                      {formatDate(user.createdAt)}
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex gap-2">
                      <Button size="icon" variant="outline" onClick={() => openUserDetails(user)}>
                        <Eye className="w-4 h-4" />
                      </Button>

                      <Select
                        value={user.role}
                        onValueChange={(value) => handleRoleUpdate(user._id, value)}
                        disabled={updatingUser === user._id}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {roleOptions.slice(1).map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={user.isActive}
                          onCheckedChange={(checked) => handleStatusUpdate(user._id, checked)}
                          disabled={updatingUser === user._id}
                        />
                      </div>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="icon" variant="destructive">
                            <Trash className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t('admin.users.delete.title')}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {t('admin.users.delete.description')}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t('admin.users.delete.cancel')}</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteUser(user._id)}>
                              {t('admin.users.delete.confirm')}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* User Details Modal */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('admin.users.details.title')}</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6">
              {/* User Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">{t('admin.users.details.infoTitle')}</h3>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">{t('admin.users.details.id')}:</span> #{selectedUser._id.slice(-6)}</p>
                    <p><span className="font-medium">{t('admin.users.details.name')}:</span> {selectedUser.name}</p>
                    <p><span className="font-medium">{t('admin.users.details.email')}:</span> {selectedUser.email}</p>
                    <p><span className="font-medium">{t('admin.users.details.role')}:</span> {getRoleBadge(selectedUser.role)}</p>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">{t('admin.users.details.statusTitle')}</h3>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">{t('admin.users.details.status')}:</span> {getStatusBadge(selectedUser.isActive)}</p>
                    <p><span className="font-medium">{t('admin.users.details.registered')}:</span> {formatDate(selectedUser.createdAt)}</p>
                    <p><span className="font-medium">{t('admin.users.details.updated')}:</span> {formatDate(selectedUser.updatedAt)}</p>
                  </div>
                </div>
              </div>

              {/* Account Actions */}
              <div>
                <h3 className="font-semibold mb-2">{t('admin.users.details.accountActions')}</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span>{t('admin.users.details.status')}</span>
                    <Switch
                      checked={selectedUser.isActive}
                      onCheckedChange={(checked) => {
                        handleStatusUpdate(selectedUser._id, checked);
                        setSelectedUser({ ...selectedUser, isActive: checked });
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>{t('admin.users.details.role')}</span>
                    <Select
                      value={selectedUser.role}
                      onValueChange={(value) => {
                        handleRoleUpdate(selectedUser._id, value);
                        setSelectedUser({ ...selectedUser, role: value as 'user' | 'admin' });
                      }}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {roleOptions.slice(1).map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsers; 