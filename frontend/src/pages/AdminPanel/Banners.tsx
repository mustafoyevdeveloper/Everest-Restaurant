import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Loader2, Image as ImageIcon, Plus, Edit, Trash, Eye, Filter, RefreshCw, BarChart3, MousePointer, Eye as EyeIcon } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { apiFetch } from '@/lib/api';
import { useTranslation } from 'react-i18next';

interface Banner {
  _id: string;
  title: string;
  description?: string;
  imageUrl: string;
  link?: string;
  isActive: boolean;
  position: 'hero' | 'sidebar' | 'footer' | 'popup';
  startDate: string;
  endDate?: string;
  priority: number;
  clicks: number;
  views: number;
  createdAt: string;
  updatedAt: string;
}

interface BannerStats {
  totalBanners: number;
  activeBanners: number;
  inactiveBanners: number;
  totalViews: number;
  totalClicks: number;
  positionStats: Array<{ _id: string; count: number }>;
}

const AdminBanners: React.FC = () => {
  const { t } = useTranslation();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [stats, setStats] = useState<BannerStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedBanner, setSelectedBanner] = useState<Banner | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [filters, setFilters] = useState({ position: '', status: '' });
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const { toast } = useToast();

  const positionOptions = [
    { value: 'hero', label: t('admin.banners.positions.hero'), color: 'bg-blue-100 text-blue-800' },
    { value: 'sidebar', label: t('admin.banners.positions.sidebar'), color: 'bg-green-100 text-green-800' },
    { value: 'footer', label: t('admin.banners.positions.footer'), color: 'bg-purple-100 text-purple-800' },
    { value: 'popup', label: t('admin.banners.positions.popup'), color: 'bg-orange-100 text-orange-800' },
  ];

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    imageUrl: '',
    link: '',
    position: 'hero' as Banner['position'],
    startDate: '',
    endDate: '',
    priority: 1,
    isActive: true
  });

  const fetchBanners = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch('/banners');
      // Handle paginated response structure
      const bannersData = data.data?.docs || data.data || [];
      setBanners(bannersData);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch banners');
      toast({ title: 'Error', description: err.message || 'Failed to fetch banners', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await apiFetch('/banners/stats');
      setStats(data);
    } catch (err) {}
  };

  useEffect(() => {
    fetchBanners();
    fetchStats();
    // eslint-disable-next-line
  }, []);

  const handleCreate = async () => {
    try {
      await apiFetch('/banners', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      toast({ title: 'Success', description: 'Banner created successfully' });
      setIsModalOpen(false);
      resetForm();
      fetchBanners();
      fetchStats();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to create banner', variant: 'destructive' });
    }
  };

  const handleUpdate = async () => {
    if (!selectedBanner) return;
    try {
      await apiFetch(`/banners/${selectedBanner._id}`, {
        method: 'PUT',
        body: JSON.stringify(formData)
      });
      toast({ title: 'Success', description: 'Banner updated successfully' });
      setIsModalOpen(false);
      resetForm();
      fetchBanners();
      fetchStats();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to update banner', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    setUpdatingId(id);
    try {
      await apiFetch(`/banners/${id}`, { method: 'DELETE' });
      toast({ title: 'Success', description: 'Banner deleted successfully' });
      fetchBanners();
      fetchStats();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to delete banner', variant: 'destructive' });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleToggleStatus = async (id: string) => {
    setUpdatingId(id);
    try {
      await apiFetch(`/banners/${id}/toggle`, { method: 'PUT' });
      toast({ title: 'Success', description: 'Banner status updated' });
      fetchBanners();
      fetchStats();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to toggle status', variant: 'destructive' });
    } finally {
      setUpdatingId(null);
    }
  };

  const openCreateModal = () => {
    setIsEditMode(false);
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (banner: Banner) => {
    setIsEditMode(true);
    setSelectedBanner(banner);
    setFormData({
      title: banner.title,
      description: banner.description || '',
      imageUrl: banner.imageUrl,
      link: banner.link || '',
      position: banner.position,
      startDate: banner.startDate.split('T')[0],
      endDate: banner.endDate ? banner.endDate.split('T')[0] : '',
      priority: banner.priority,
      isActive: banner.isActive
    });
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      imageUrl: '',
      link: '',
      position: 'hero',
      startDate: '',
      endDate: '',
      priority: 1,
      isActive: true
    });
    setSelectedBanner(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('uz-UZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const filteredBanners = banners.filter(b => {
    if (filters.position && b.position !== filters.position) return false;
    if (filters.status) {
      const isActive = filters.status === 'active';
      if (b.isActive !== isActive) return false;
    }
    return true;
  });

  const getPositionBadge = (position: string) => {
    const opt = positionOptions.find(o => o.value === position);
    return (
      <Badge className={opt?.color || 'bg-gray-100 text-gray-800'}>
        {opt?.label || position}
      </Badge>
    );
  };

  return (
    <div className="admin-section p-4 md:p-6">
      <div className="admin-header">
        <h1 className="admin-title">Bannerlar</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchBanners} className="admin-button">
            <RefreshCw className="w-4 h-4 mr-2" />
            {t('admin.banners.refresh')}
          </Button>
          <Button onClick={openCreateModal} className="admin-button">
            <Plus className="w-4 h-4 mr-2" />
            {t('admin.banners.addBanner')}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="admin-stats-grid">
          <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{t('admin.banners.totalBanners')}</p>
                <p className="text-xl md:text-2xl font-bold">{stats.totalBanners}</p>
              </div>
              <ImageIcon className="w-6 h-6 md:w-8 md:h-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{t('admin.banners.activeBanners')}</p>
                <p className="text-xl md:text-2xl font-bold">{stats.activeBanners}</p>
              </div>
              <EyeIcon className="w-6 h-6 md:w-8 md:h-8 text-green-500" />
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{t('admin.banners.totalViews')}</p>
                <p className="text-xl md:text-2xl font-bold">{stats.totalViews}</p>
              </div>
              <BarChart3 className="w-6 h-6 md:w-8 md:h-8 text-purple-500" />
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{t('admin.banners.totalClicks')}</p>
                <p className="text-xl md:text-2xl font-bold">{stats.totalClicks}</p>
              </div>
              <MousePointer className="w-6 h-6 md:w-8 md:h-8 text-orange-500" />
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Filter className="w-5 h-5" />
          <h3 className="font-semibold">{t('admin.banners.filters')}</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select value={filters.position} onValueChange={value => setFilters({ ...filters, position: value })}>
            <SelectTrigger>
              <SelectValue placeholder={t('admin.banners.filterByPosition')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">{t('admin.banners.allPositions')}</SelectItem>
              {positionOptions.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.status} onValueChange={value => setFilters({ ...filters, status: value })}>
            <SelectTrigger>
              <SelectValue placeholder={t('admin.banners.filterByStatus')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">{t('admin.banners.allStatuses')}</SelectItem>
              <SelectItem value="active">{t('admin.banners.active')}</SelectItem>
              <SelectItem value="inactive">{t('admin.banners.inactive')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="ml-2">{t('admin.banners.loading')}</span>
        </div>
      ) : error ? (
        <div className="text-red-500 text-center py-8">{error}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBanners.map(banner => (
            <div key={banner._id} className="bg-white dark:bg-slate-800 rounded-lg border overflow-hidden">
              <div className="relative">
                <img 
                  src={banner.imageUrl} 
                  alt={banner.title}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute top-2 right-2">
                  <Badge className={banner.isActive ? 'bg-green-500' : 'bg-red-500'}>
                    {banner.isActive ? t('admin.banners.active') : t('admin.banners.inactive')}
                  </Badge>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-lg mb-2">{banner.title}</h3>
                {banner.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                    {banner.description}
                  </p>
                )}
                <div className="flex items-center gap-2 mb-3">
                  {getPositionBadge(banner.position)}
                  <Badge variant="outline">{t('admin.banners.priority')}: {banner.priority}</Badge>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                  <span>{t('admin.banners.views')}: {banner.views}</span>
                  <span>{t('admin.banners.clicks')}: {banner.clicks}</span>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => openEditModal(banner)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => handleToggleStatus(banner._id)}
                    disabled={updatingId === banner._id}
                  >
                    {banner.isActive ? t('admin.banners.turnOff') : t('admin.banners.turnOn')}
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="destructive">
                        <Trash className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t('admin.banners.deleteBanner')}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {t('admin.banners.deleteConfirm')}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t('admin.banners.cancel')}</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(banner._id)}>
                          {t('admin.banners.delete')}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditMode ? t('admin.banners.editBanner') : t('admin.banners.newBanner')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">{t('admin.banners.form.title')}</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder={t('admin.banners.bannerTitlePlaceholder')}
              />
            </div>
            <div>
              <Label htmlFor="description">{t('admin.banners.form.description')}</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={t('admin.banners.bannerDescriptionPlaceholder')}
              />
            </div>
            <div>
              <Label htmlFor="imageUrl">{t('admin.banners.imageUrl')}</Label>
              <Input
                id="imageUrl"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                placeholder={t('admin.banners.imageUrlPlaceholder')}
              />
            </div>
            <div>
              <Label htmlFor="link">{t('admin.banners.form.link')}</Label>
              <Input
                id="link"
                value={formData.link}
                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                placeholder={t('admin.banners.linkPlaceholder')}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="position">{t('admin.banners.form.position')}</Label>
                <Select value={formData.position} onValueChange={value => setFormData({ ...formData, position: value as Banner['position'] })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hero">{t('admin.banners.form.hero')}</SelectItem>
                    <SelectItem value="sidebar">{t('admin.banners.form.sidebar')}</SelectItem>
                    <SelectItem value="footer">{t('admin.banners.form.footer')}</SelectItem>
                    <SelectItem value="popup">{t('admin.banners.form.popup')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="priority">{t('admin.banners.form.priority')}</Label>
                <Input
                  id="priority"
                  type="number"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                  min="1"
                  max="10"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">{t('admin.banners.form.startDate')}</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="endDate">{t('admin.banners.endDate')}</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate || ''}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value || undefined })}
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              />
              <Label htmlFor="isActive">{t('admin.banners.form.isActive')}</Label>
            </div>
            <div className="flex gap-2 pt-4">
              <Button onClick={isEditMode ? handleUpdate : handleCreate} className="flex-1">
                {isEditMode ? t('admin.banners.update') : t('admin.banners.create')}
              </Button>
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                {t('admin.banners.cancel')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminBanners; 