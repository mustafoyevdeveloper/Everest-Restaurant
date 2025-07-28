import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { apiFetch } from '@/lib/api';

interface UseStatusManagementProps {
  entityType: 'orders' | 'reservations' | 'payments';
  onSuccess?: () => void;
}

export const useStatusManagement = ({ entityType, onSuccess }: UseStatusManagementProps) => {
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const { toast } = useToast();

  const updateStatus = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    try {
      const endpoint = entityType === 'orders' 
        ? `/admin/orders/${id}/status`
        : entityType === 'reservations'
        ? `/admin/reservations/${id}`
        : `/admin/payments/${id}/status`;

      const method = entityType === 'reservations' ? 'PUT' : 'PUT';
      const body = entityType === 'reservations' 
        ? JSON.stringify({ status: newStatus })
        : JSON.stringify({ status: newStatus });

      await apiFetch(endpoint, {
        method,
        body
      });

      toast({ 
        title: 'Muvaffaqiyatli', 
        description: 'Status yangilandi' 
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      toast({ 
        title: 'Xato', 
        description: err.message || 'Status yangilashda xatolik yuz berdi', 
        variant: 'destructive' 
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const deleteItem = async (id: string) => {
    setUpdatingId(id);
    try {
      const endpoint = `/admin/${entityType}/${id}`;
      
      await apiFetch(endpoint, {
        method: 'DELETE'
      });

      toast({ 
        title: 'Muvaffaqiyatli', 
        description: `${entityType === 'orders' ? 'Buyurtma' : entityType === 'reservations' ? 'Rezervatsiya' : 'To\'lov'} o'chirildi` 
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      toast({ 
        title: 'Xato', 
        description: err.message || 'O\'chirishda xatolik yuz berdi', 
        variant: 'destructive' 
      });
    } finally {
      setUpdatingId(null);
    }
  };

  return {
    updateStatus,
    deleteItem,
    updatingId,
    isUpdating: (id: string) => updatingId === id
  };
}; 