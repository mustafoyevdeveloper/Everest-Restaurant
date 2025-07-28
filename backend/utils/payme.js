import crypto from 'crypto';

class PaymeService {
  constructor() {
    this.merchantId = process.env.PAYME_MERCHANT_ID || 'test_merchant_id';
    this.secretKey = process.env.PAYME_SECRET_KEY || 'test_secret_key';
    this.baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://checkout.paycom.uz' 
      : 'https://test.paycom.uz';
    
    // Log configuration status
    // console.log('Payme Service Configuration:');
    // console.log('- Environment:', process.env.NODE_ENV);
    // console.log('- Base URL:', this.baseUrl);
    // console.log('- Merchant ID:', this.merchantId ? 'Configured' : 'Missing');
    // console.log('- Secret Key:', this.secretKey ? 'Configured' : 'Missing');
  }

  // Generate payment link
  generatePaymentLink(amount, orderId, description) {
    try {
      // console.log('🔍 generatePaymentLink called with:', { amount, orderId, description });
      
      if (!amount || amount <= 0) {
        console.error('❌ Invalid amount:', amount);
        throw new Error('Invalid amount provided');
      }
      if (!orderId) {
        console.error('❌ Order ID is missing');
        throw new Error('Order ID is required');
      }
      if (!description) {
        console.error('❌ Description is missing');
        throw new Error('Description is required');
      }

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
      // console.log('🔍 Frontend URL:', frontendUrl);
      
      // Ensure amount is in tiyin (1 sum = 100 tiyin)
      const amountInTiyin = Math.round(amount * 100);
      
      // Clean and validate description
      const cleanDescription = description.replace(/[^\w\s\-.,]/g, '').substring(0, 100);
      
      const params = {
        m: this.merchantId,
        ac: orderId,
        o: orderId,
        a: amountInTiyin,
        l: 'uz',
        c: `${frontendUrl}/payment/success?orderId=${orderId}`,
        f: `${frontendUrl}/payment/failure?orderId=${orderId}`,
        n: cleanDescription,
        s: this.generateSignature(amount, orderId)
      };

      // console.log('🔍 Payment parameters:', params);

      // Build query string with proper encoding
      const queryString = Object.keys(params)
        .map(key => {
          const value = params[key];
          // Don't encode numeric values
          if (typeof value === 'number') {
            return `${key}=${value}`;
          }
          return `${key}=${encodeURIComponent(value)}`;
        })
        .join('&');

      const paymentUrl = `${this.baseUrl}/?${queryString}`;
      
      // Validate the generated URL
      try {
        new URL(paymentUrl);
      } catch (urlError) {
        console.error('❌ Generated invalid URL:', paymentUrl);
        throw new Error('Failed to generate valid payment URL');
      }
      
      // console.log('✅ Generated payment URL:', paymentUrl);
      return paymentUrl;
    } catch (error) {
      console.error('❌ Error generating payment link:', error);
      console.error('❌ Error stack:', error.stack);
      throw error;
    }
  }

  // Generate signature for payment verification
  generateSignature(amount, orderId) {
    if (!this.secretKey || this.secretKey === 'test_secret_key') {
      console.warn('Using test signature for development');
      return 'test_signature_' + Date.now();
    }
    
    const data = `${this.merchantId}.${orderId}.${Math.round(amount * 100)}`;
    return crypto.createHmac('sha256', this.secretKey).update(data).digest('hex');
  }

  // Verify payment signature
  verifySignature(signature, amount, orderId) {
    if (!this.secretKey || this.secretKey === 'test_secret_key') {
      console.warn('Skipping signature verification in development/test mode');
      return true; // Skip verification in development
    }
    
    const expectedSignature = this.generateSignature(amount, orderId);
    return signature === expectedSignature;
  }

  // Create payment for reservation
  createReservationPayment(reservation, cardDetails = null) {
    try {
      // console.log('🔍 createReservationPayment called with reservation:', reservation);
      
      // Validate reservation object
      if (!reservation || !reservation._id) {
        console.error('❌ Invalid reservation object:', reservation);
        throw new Error('Invalid reservation object');
      }
      
      // Convert ObjectId to string
      const reservationIdString = reservation._id.toString();
      const orderId = `RES${reservationIdString.slice(-8).toUpperCase()}`;
      
      // Calculate amount with fallback
      let amount = 0;
      if (reservation.totalPrice && reservation.totalPrice > 0) {
        amount = reservation.totalPrice;
      } else if (reservation.pricePerGuest && reservation.guests) {
        amount = reservation.pricePerGuest * reservation.guests;
      } else {
        console.error('❌ Cannot calculate amount:', {
          totalPrice: reservation.totalPrice,
          pricePerGuest: reservation.pricePerGuest,
          guests: reservation.guests
        });
        throw new Error('Cannot calculate payment amount');
      }
      
      const description = `Rezervatsiya: ${reservation.name} - ${reservation.guests} kishi, ${new Date(reservation.date).toLocaleDateString('uz-UZ')} ${reservation.time}`;
      
      // console.log('🔍 Payment details:', {
      //   orderId,
      //   amount,
      //   description,
      //   reservationId: reservationIdString,
      //   totalPrice: reservation.totalPrice,
      //   pricePerGuest: reservation.pricePerGuest,
      //   guests: reservation.guests
      // });
      
      const paymentData = {
        paymentUrl: this.generatePaymentLink(amount, orderId, description),
        orderId,
        amount,
        description,
        signature: this.generateSignature(amount, orderId)
      };

      // console.log('✅ Payment data created:', paymentData);

      // Add card details if provided
      if (cardDetails) {
        paymentData.cardDetails = cardDetails;
      }
      
      return paymentData;
    } catch (error) {
      console.error('❌ Error creating reservation payment:', error);
      console.error('❌ Error stack:', error.stack);
      throw error;
    }
  }

  // Create payment for order
  createOrderPayment(order, cardDetails = null) {
    try {
      const orderId = `ORD${order._id.slice(-8).toUpperCase()}`;
      const amount = order.totalPrice || order.total || 0;
      const description = `Buyurtma #${order._id.slice(-6)} - ${order.orderItems.length} ta mahsulot`;
      
      // console.log('Creating order payment:', {
      //   orderId,
      //   amount,
      //   description,
      //   orderId: order._id
      // });
      
      const paymentData = {
        paymentUrl: this.generatePaymentLink(amount, orderId, description),
        orderId,
        amount,
        description,
        signature: this.generateSignature(amount, orderId)
      };

      // Add card details if provided
      if (cardDetails) {
        paymentData.cardDetails = cardDetails;
      }
      
      return paymentData;
    } catch (error) {
      console.error('Error creating order payment:', error);
      throw error;
    }
  }

  // Handle payment callback
  handlePaymentCallback(callbackData) {
    try {
      // console.log('Processing Payme callback:', callbackData);

      // Verify the callback signature
      if (!this.verifyCallbackSignature(callbackData)) {
        console.error('Invalid callback signature');
        return { success: false, error: 'Invalid signature' };
      }

      const { order_id, amount, transaction_id, status, card } = callbackData;

      // Check if payment was successful
      if (status !== 'success') {
        // console.log('Payment not successful, status:', status);
        return { success: false, error: 'Payment not successful' };
      }

      // Extract order ID from account field
      const orderId = order_id || callbackData.account;

      return {
        success: true,
        orderId,
        amount: amount / 100, // Convert from tiyin to sum
        transactionId: transaction_id,
        cardInfo: card ? {
          cardNumber: card.number?.slice(-4),
          cardType: card.type,
          cardBrand: card.brand,
          maskedNumber: card.masked_number
        } : null,
        paymeData: callbackData
      };
    } catch (error) {
      console.error('Error processing Payme callback:', error);
      return { success: false, error: error.message };
    }
  }

  // Verify callback signature
  verifyCallbackSignature(callbackData) {
    try {
      const { signature, ...dataWithoutSignature } = callbackData;
      
      if (!signature) {
        console.error('No signature in callback data');
        return false;
      }

      const expectedSignature = this.generateSignature(dataWithoutSignature);
      const isValid = signature === expectedSignature;

      if (!isValid) {
        console.error('Signature verification failed');
        console.error('Expected:', expectedSignature);
        console.error('Received:', signature);
      }

      return isValid;
    } catch (error) {
      console.error('Error verifying signature:', error);
      return false;
    }
  }

  // Test payment link generation (for development)
  generateTestPaymentLink(amount = 10000, orderId = 'test_order', description = 'Test payment') {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Test payment links are not allowed in production');
    }
    
    return this.generatePaymentLink(amount, orderId, description);
  }

  // Get payment status from Payme
  async getPaymentStatus(transactionId) {
    try {
      const params = {
        merchant_id: this.merchantId,
        transaction_id: transactionId
      };

      const signature = this.generateSignature(params);
      const url = `${this.baseUrl}/api/payment/status?${this.buildQueryString(params)}&signature=${signature}`;

      const response = await fetch(url);
      const data = await response.json();

      return data;
    } catch (error) {
      console.error('Error getting payment status:', error);
      throw error;
    }
  }

  // Cancel payment
  async cancelPayment(transactionId, reason = 'User cancelled') {
    try {
      const params = {
        merchant_id: this.merchantId,
        transaction_id: transactionId,
        reason: reason
      };

      const signature = this.generateSignature(params);
      const url = `${this.baseUrl}/api/payment/cancel?${this.buildQueryString(params)}&signature=${signature}`;

      const response = await fetch(url);
      const data = await response.json();

      return data;
    } catch (error) {
      console.error('Error cancelling payment:', error);
      throw error;
    }
  }

  // Build query string from parameters
  buildQueryString(params) {
    return Object.keys(params)
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
      .join('&');
  }
}

const paymeService = new PaymeService();

export default paymeService; 