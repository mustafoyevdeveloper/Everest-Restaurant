import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, CreditCard, CheckCircle, XCircle, Clock, Eye, EyeOff } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useTranslation } from 'react-i18next';

interface PaymePaymentProps {
  orderId?: string;
  reservationId?: string;
  amount: number;
  onSuccess?: () => void;
  onFailure?: () => void;
  forceCardOnly?: boolean;
}

const PaymePayment: React.FC<PaymePaymentProps> = ({
  orderId,
  reservationId,
  amount,
  onSuccess,
  onFailure,
  forceCardOnly = false
}) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'completed' | 'failed'>('pending');
  const [error, setError] = useState<string | null>(null);
  const [showCardForm, setShowCardForm] = useState(false);
  const [showCVV, setShowCVV] = useState(false);
  const [cardData, setCardData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: ''
  });
  
  // Input refs for auto-focus
  const cardNumberRef = useRef<HTMLInputElement>(null);
  const expiryDateRef = useRef<HTMLInputElement>(null);
  const cvvRef = useRef<HTMLInputElement>(null);
  const cardholderNameRef = useRef<HTMLInputElement>(null);
  
  const { toast } = useToast();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('uz-UZ', {
      style: 'currency',
      currency: 'UZS'
    }).format(amount);
  };

  const createPayment = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Creating payment for:', { orderId, reservationId, amount });
      
      const endpoint = orderId ? '/payments/order' : '/payments/reservation';
      const body = orderId ? { orderId } : { reservationId };
      
      console.log('Payment endpoint:', endpoint);
      console.log('Payment body:', body);
      
      const response = await apiFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify(body)
      });

      console.log('Payment response:', response);

      if (response.success && response.data && response.data.paymentUrl) {
        // Validate the payment URL before using it
        try {
          const url = new URL(response.data.paymentUrl);
          console.log('Valid payment URL:', url.toString());
          
          setPaymentUrl(response.data.paymentUrl);
          toast({
            title: t('payment_created'),
            description: t('payment_redirecting'),
            variant: 'default'
          });
          
          // Redirect to Payme after a short delay
          setTimeout(() => {
            window.location.href = response.data.paymentUrl;
          }, 1000);
        } catch (urlError) {
          console.error('Invalid payment URL:', response.data.paymentUrl);
          throw new Error('Serverdan noto\'g\'ri to\'lov URL manzili qaytdi');
        }
      } else {
        console.error('Invalid response structure:', response);
        throw new Error(response.message || t('payment_url_not_received'));
      }
    } catch (err: any) {
      console.error('Payment creation error:', err);
      let errorMessage = t('payment_creation_failed');
      
      if (err.message) {
        if (err.message.includes('timeout')) {
          errorMessage = 'To\'lov tizimi vaqt tugadi. Iltimos, qaytadan urining.';
        } else if (err.message.includes('network')) {
          errorMessage = 'Tarmoq xatoligi. Internet aloqasini tekshiring.';
        } else if (err.message.includes('500')) {
          errorMessage = 'Server xatoligi. Iltimos, keyinroq urinib ko\'ring.';
        } else if (err.message.includes('Invalid payment URL')) {
          errorMessage = 'To\'lov tizimi vaqtincha ishlamayapti. Iltimos, keyinroq urinib ko\'ring.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      toast({
        title: t('payment_error'),
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const createCardPayment = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Validate card data
      if (!cardData.cardNumber || !cardData.expiryDate || !cardData.cvv || !cardData.cardholderName) {
        throw new Error(t('payment_card_data_required'));
      }

      if (cardData.cardNumber.replace(/\s/g, '').length !== 16) {
        throw new Error(t('payment_invalid_card_number'));
      }

      if (cardData.cvv.length !== 3 && cardData.cvv.length !== 4) {
        throw new Error(t('payment_invalid_cvv'));
      }

      const endpoint = orderId ? '/payments/card/order' : '/payments/card/reservation';
      const body = {
        ...(orderId ? { orderId } : { reservationId }),
        cardData: {
          cardNumber: cardData.cardNumber.replace(/\s/g, ''),
          expiryDate: cardData.expiryDate,
          cvv: cardData.cvv,
          cardholderName: cardData.cardholderName
        }
      };
      
      const response = await apiFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify(body)
      });

      if (response.success) {
        setPaymentStatus('completed');
        toast({
          title: t('payment_completed'),
          description: t('payment_card_success'),
          variant: 'default'
        });
        onSuccess?.();
      } else {
        throw new Error(response.message || t('payment_card_failed'));
      }
    } catch (err: any) {
      console.error('Card payment error:', err);
      setError(err.message || t('payment_card_failed'));
      toast({
        title: t('payment_error'),
        description: err.message || t('payment_card_failed'),
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  // Auto-focus to next input function
  const focusNextInput = (currentRef: React.RefObject<HTMLInputElement>, nextRef: React.RefObject<HTMLInputElement>) => {
    if (nextRef.current) {
      nextRef.current.focus();
    }
  };

  // Handle card number input with auto-focus
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatCardNumber(e.target.value);
    setCardData({...cardData, cardNumber: formattedValue});
    
    // Auto-focus to expiry date when 4 groups of 4 digits are complete
    if (formattedValue.replace(/\s/g, '').length === 16) {
      setTimeout(() => focusNextInput(cardNumberRef, expiryDateRef), 100);
    }
  };

  // Handle expiry date input with auto-focus
  const handleExpiryDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatExpiryDate(e.target.value);
    setCardData({...cardData, expiryDate: formattedValue});
    
    // Auto-focus to CVV when MM/YY format is complete
    if (formattedValue.length === 5) {
      setTimeout(() => focusNextInput(expiryDateRef, cvvRef), 100);
    }
  };

  // Handle CVV input with auto-focus
  const handleCVVChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    setCardData({...cardData, cvv: value});
    
    // Auto-focus to cardholder name when CVV is complete (3-4 digits)
    if (value.length >= 3) {
      setTimeout(() => focusNextInput(cvvRef, cardholderNameRef), 100);
    }
  };

  // Handle Enter key press to submit form
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      createCardPayment();
    }
  };

  const checkPaymentStatus = async () => {
    if (!orderId && !reservationId) return;
    
    try {
      const endpoint = orderId ? '/orders/myorders' : '/reservations/myreservations';
      const response = await apiFetch(endpoint);
      
      const items = response || [];
      const currentItem = items.find((item: any) => 
        orderId ? item._id === orderId : item._id === reservationId
      );
      
      if (currentItem) {
        if (currentItem.isPaid) {
          setPaymentStatus('completed');
          toast({
            title: t('payment_completed'),
            description: t('payment_success_redirect'),
            variant: 'default'
          });
          onSuccess?.();
        } else if (currentItem.status === 'Cancelled') {
          setPaymentStatus('failed');
          toast({
            title: t('payment_failed'),
            description: t('payment_failure_redirect'),
            variant: 'destructive'
          });
          onFailure?.();
        }
      }
    } catch (err) {
      console.error('Status check error:', err);
    }
  };

  useEffect(() => {
    // Check payment status every 5 seconds
    const interval = setInterval(checkPaymentStatus, 5000);
    return () => clearInterval(interval);
  }, [orderId, reservationId]);

  const getStatusIcon = () => {
    switch (paymentStatus) {
      case 'completed':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'failed':
        return <XCircle className="w-6 h-6 text-red-500" />;
      default:
        return <Clock className="w-6 h-6 text-yellow-500" />;
    }
  };

  const getStatusText = () => {
    switch (paymentStatus) {
      case 'completed':
        return t('payment_completed');
      case 'failed':
        return t('payment_failed');
      default:
        return t('payment_pending');
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          {t('payment_title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Payment Amount */}
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(amount)}
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {t('payment_amount')}
          </p>
        </div>

        {/* Faqat karta formasi */}
        <div className="space-y-4 p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
          <h3 className="font-semibold text-center">{t('payment_card_details')}</h3>
          <div className="space-y-3">
            <div>
              <Label htmlFor="cardNumber">{t('payment_card_number')}</Label>
              <Input
                ref={cardNumberRef}
                id="cardNumber"
                type="text"
                placeholder="1234 5678 9012 3456"
                value={cardData.cardNumber}
                onChange={handleCardNumberChange}
                onKeyPress={handleKeyPress}
                maxLength={19}
                className="font-mono"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="expiryDate">{t('payment_expiry_date')}</Label>
                <Input
                  ref={expiryDateRef}
                  id="expiryDate"
                  type="text"
                  placeholder="MM/YY"
                  value={cardData.expiryDate}
                  onChange={handleExpiryDateChange}
                  onKeyPress={handleKeyPress}
                  maxLength={5}
                />
              </div>
              <div>
                <Label htmlFor="cvv">{t('payment_cvv')}</Label>
                <div className="relative">
                  <Input
                    ref={cvvRef}
                    id="cvv"
                    type={showCVV ? "text" : "password"}
                    placeholder="123"
                    value={cardData.cvv}
                    onChange={handleCVVChange}
                    onKeyPress={handleKeyPress}
                    maxLength={4}
            />
                  <button
                    type="button"
                    onClick={() => setShowCVV(!showCVV)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2"
                  >
                    {showCVV ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
            <div>
              <Label htmlFor="cardholderName">{t('payment_cardholder_name')}</Label>
              <Input
                ref={cardholderNameRef}
                id="cardholderName"
                type="text"
                placeholder="JOHN DOE"
                value={cardData.cardholderName}
                onChange={(e) => setCardData({...cardData, cardholderName: e.target.value.toUpperCase()})}
                onKeyPress={handleKeyPress}
              />
            </div>
          </div>
          <Button
            onClick={createCardPayment}
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t('payment_processing')}
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4 mr-2" />
                {t('payment_pay_with_card')}
              </>
            )}
          </Button>
        </div>

        {/* Payment Status */}
        {paymentStatus !== 'pending' && (
          <div className="flex items-center justify-center gap-2 p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
            {getStatusIcon()}
            <span className="font-medium">{getStatusText()}</span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Payment Info */}
        <div className="text-xs text-gray-500 text-center space-y-1">
          <p>{t('payment_secure')}</p>
          <p>{t('payment_instant')}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default PaymePayment; 