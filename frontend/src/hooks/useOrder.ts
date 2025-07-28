import { useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export const useCreateOrder = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { token } = useAuth();

    const createOrder = async (orderData: any) => {
        setIsLoading(true);
        setError(null);
        
        try {
            const newOrder = await apiFetch('/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(orderData),
            });
            setIsLoading(false);
            return newOrder;
        } catch (err: any) {
            setIsLoading(false);
            setError(err.message || 'An unknown error occurred.');
            throw err;
        }
    };

    return { createOrder, isLoading, error };
};

// You can also add hooks for fetching orders here
// For example: useGetMyOrders, useGetOrderById 