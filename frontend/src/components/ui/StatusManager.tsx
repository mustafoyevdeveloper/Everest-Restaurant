import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Settings } from 'lucide-react';

interface StatusOption {
  value: string;
  label: string;
  color: string;
  icon?: React.ReactNode;
}

interface StatusManagerProps {
  currentStatus: string;
  statusOptions: StatusOption[];
  onStatusChange: (newStatus: string, note?: string) => void;
  isLoading?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const StatusManager: React.FC<StatusManagerProps> = ({
  currentStatus,
  statusOptions,
  onStatusChange,
  isLoading = false,
  size = 'md'
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(currentStatus);
  const [note, setNote] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const currentStatusOption = statusOptions.find(option => option.value === currentStatus);

  const handleStatusUpdate = async () => {
    if (selectedStatus === currentStatus) {
      setIsDialogOpen(false);
      return;
    }

    setIsUpdating(true);
    try {
      console.log('StatusManager: Updating status from', currentStatus, 'to', selectedStatus);
      await onStatusChange(selectedStatus, note.trim() || undefined);
      setIsDialogOpen(false);
      setNote('');
    } catch (error) {
      console.error('StatusManager: Status update failed:', error);
      // Don't close dialog on error, let user try again
    } finally {
      setIsUpdating(false);
    }
  };

  const getButtonSize = () => {
    switch (size) {
      case 'sm':
        return 'h-8 px-2 text-xs';
      case 'lg':
        return 'h-12 px-4 text-base';
      default:
        return 'h-10 px-3 text-sm';
    }
  };

  const getBadgeSize = () => {
    switch (size) {
      case 'sm':
        return 'text-xs px-2 py-1';
      case 'lg':
        return 'text-base px-3 py-1';
      default:
        return 'text-sm px-2 py-1';
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={isLoading}
          className={`${getButtonSize()} flex items-center gap-2`}
        >
          {isLoading ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Settings className="w-3 h-3" />
          )}
          <Badge className={`${currentStatusOption?.color || 'bg-gray-100 text-gray-800'} ${getBadgeSize()}`}>
            {currentStatusOption?.icon} {currentStatusOption?.label || currentStatus}
          </Badge>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Status yangilash</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="status">Yangi status</Label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Statusni tanlang" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      {option.icon} {option.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="note">Izoh (ixtiyoriy)</Label>
            <Textarea
              id="note"
              placeholder="Status o'zgarishi haqida izoh qoldiring..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false);
                setSelectedStatus(currentStatus);
                setNote('');
              }}
            >
              Bekor qilish
            </Button>
            <Button
              onClick={handleStatusUpdate}
              disabled={isUpdating || selectedStatus === currentStatus}
            >
              {isUpdating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Yangilanmoqda...
                </>
              ) : (
                'Yangilash'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StatusManager; 