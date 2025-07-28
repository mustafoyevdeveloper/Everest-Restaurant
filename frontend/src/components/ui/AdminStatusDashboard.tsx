import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, TrendingUp, AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface StatusStats {
  total: number;
  pending: number;
  completed: number;
  cancelled: number;
  processing?: number;
  failed?: number;
}

interface AdminStatusDashboardProps {
  title: string;
  stats: StatusStats;
  onRefresh?: () => void;
  statusOptions: Array<{
    value: string;
    label: string;
    color: string;
    icon?: React.ReactNode;
  }>;
  onStatusFilter?: (status: string) => void;
  currentFilter?: string;
}

const AdminStatusDashboard: React.FC<AdminStatusDashboardProps> = ({
  title,
  stats,
  onRefresh,
  statusOptions,
  onStatusFilter,
  currentFilter = 'all'
}) => {
  const { t } = useTranslation();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'processing':
        return <RefreshCw className="w-4 h-4 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'failed':
        return <XCircle className="w-4 h-4" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{title}</h2>
        {onRefresh && (
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            {t('admin.messages.refresh')}
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('admin.messages.stats.total')}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('admin.messages.stats.unread')}</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('admin.messages.stats.read')}</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('admin.messages.stats.today')}</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.cancelled}</div>
          </CardContent>
        </Card>
      </div>

      {/* Status Filter Buttons */}
      {onStatusFilter && (
        <div className="flex flex-wrap gap-2">
          <Button
            variant={currentFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onStatusFilter('all')}
          >
            {t('admin.messages.allStatuses')} ({stats.total})
          </Button>
          {statusOptions.map((option) => (
            <Button
              key={option.value}
              variant={currentFilter === option.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => onStatusFilter(option.value)}
              className="flex items-center gap-2"
            >
              {option.icon}
              {option.label}
              {option.value === 'pending' && `(${stats.pending})`}
              {option.value === 'completed' && `(${stats.completed})`}
              {option.value === 'cancelled' && `(${stats.cancelled})`}
              {option.value === 'processing' && stats.processing && `(${stats.processing})`}
              {option.value === 'failed' && stats.failed && `(${stats.failed})`}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminStatusDashboard; 