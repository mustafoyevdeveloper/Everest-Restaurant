# Everest Restaurant Backend

A comprehensive restaurant management system backend built with Node.js, Express, and MongoDB.

## Features

### Core Features
- **User Authentication & Authorization** - JWT-based authentication with role-based access control
- **Product Management** - CRUD operations for menu items with categories and pricing
- **Order Management** - Complete order lifecycle from cart to delivery
- **Reservation System** - Table booking with date/time management
- **Contact Management** - Customer message handling
- **Career Management** - Job application processing
- **Subscriber Management** - Newsletter subscription handling

### Payment System
- **Multi-Payment Gateway Integration**
  - Payme payment system
  - Click payment system  
  - Mastercard payment system
  - Direct card payment processing
- **Payment Notifications** - Comprehensive admin notification system
- **Payment Tracking** - Complete payment history and status tracking
- **Security** - Card number masking and secure payment processing

### Admin Features
- **Dashboard Overview** - Real-time statistics and analytics
- **Payment Notifications** - Detailed payment information for admin
- **User Management** - Customer account administration
- **Order Management** - Order status updates and tracking
- **Reservation Management** - Booking confirmation and management
- **Product Management** - Menu item administration
- **Message Management** - Customer inquiry handling

## Payment Notification System

The system includes a comprehensive payment notification system that provides admins with detailed information about all payments:

### Features
- **Real-time Notifications** - Instant payment alerts
- **Payment Details** - Complete payment information including:
  - User information (name, email, phone)
  - Payment amount and currency
  - Payment method used
  - Card details (masked for security)
  - Transaction ID and status
  - Payment date and time
  - Payment type (reservation/order)
- **Filtering & Search** - Filter payments by status, method, and type
- **Statistics** - Payment analytics and reporting
- **Mark as Read** - Notification management

### Payment Methods Supported
1. **Payme** - Uzbek payment system
2. **Click** - Uzbek payment system
3. **Mastercard** - International payment system
4. **Direct Card** - Secure card payment processing

### Security Features
- Card number masking (only last 4 digits stored)
- Secure transaction processing
- Admin authentication required
- Payment status validation

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/admin/login` - Admin login
- `GET /api/auth/users/count` - Get user count

### Products
- `GET /api/products` - Get all products
- `POST /api/products` - Create product (admin)
- `PUT /api/products/:id` - Update product (admin)
- `DELETE /api/products/:id` - Delete product (admin)

### Orders
- `GET /api/orders` - Get user orders
- `POST /api/orders` - Create order
- `PUT /api/orders/:id` - Update order status (admin)
- `GET /api/orders/admin/stats` - Get order statistics (admin)

### Reservations
- `GET /api/reservations` - Get user reservations
- `POST /api/reservations` - Create reservation
- `PUT /api/reservations/:id` - Update reservation (admin)
- `GET /api/reservations/admin` - Get all reservations (admin)

### Payments
- `POST /api/payments/reservation/:id` - Pay for reservation
- `POST /api/payments/order/:id` - Pay for order
- `GET /api/payments/status/:orderId` - Check payment status
- `POST /api/payments/callback/payme` - Payme callback
- `POST /api/payments/callback/click` - Click callback
- `POST /api/payments/callback/mastercard` - Mastercard callback

### Admin Payment Management
- `GET /api/admin/payments/notifications` - Get payment notifications
- `GET /api/admin/payments/notifications/unread-count` - Get unread count
- `PUT /api/admin/payments/notifications/mark-read` - Mark as read
- `GET /api/admin/payments/stats` - Get payment statistics
- `GET /api/admin/payments/recent` - Get recent payments
- `GET /api/admin/payments/:id` - Get payment details

### Contact & Subscribers
- `POST /api/contact` - Send contact message
- `GET /api/contact` - Get contact messages (admin)
- `POST /api/subscribers` - Subscribe to newsletter
- `GET /api/subscribers` - Get subscribers (admin)

### Careers
- `POST /api/careers` - Submit job application
- `GET /api/careers` - Get applications (admin)

## Environment Variables

```env
# Database
MONGODB_URI=your_mongodb_connection_string

# JWT
JWT_SECRET=your_jwt_secret_key

# Server
PORT=5000
NODE_ENV=development

# Client
CLIENT_URL=http://localhost:3000

# Payment Systems
PAYME_MERCHANT_ID=your_payme_merchant_id
PAYME_SECRET_KEY=your_payme_secret_key
PAYME_CALLBACK_URL=your_payme_callback_url

CLICK_MERCHANT_ID=your_click_merchant_id
CLICK_SECRET_KEY=your_click_secret_key
CLICK_CALLBACK_URL=your_click_callback_url

MASTERCARD_MERCHANT_ID=your_mastercard_merchant_id
MASTERCARD_SECRET_KEY=your_mastercard_secret_key
MASTERCARD_CALLBACK_URL=your_mastercard_callback_url
```

## Installation

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables
4. Start the server: `npm start`

## Database Schema

### Payment Model
```javascript
{
  user: ObjectId,           // Reference to User
  type: String,             // 'reservation' or 'order'
  referenceId: ObjectId,    // Reservation or Order ID
  amount: Number,           // Payment amount
  currency: String,         // Currency (default: UZS)
  paymentMethod: String,    // 'payme', 'click', 'mastercard', 'card'
  cardDetails: {            // Masked card information
    name: String,
    number: String,         // Masked: **** **** **** 1234
    expiry: String,
    type: String           // 'visa', 'mastercard', 'amex'
  },
  transactionId: String,    // Unique transaction ID
  status: String,          // 'pending', 'completed', 'failed', 'cancelled'
  description: String,     // Payment description
  adminNotified: Boolean,  // Admin notification status
  createdAt: Date,         // Payment creation time
  paidAt: Date            // Payment completion time
}
```

## Security

- JWT-based authentication
- Role-based access control
- Card number masking
- Secure payment processing
- Input validation and sanitization
- CORS protection
- Rate limiting (recommended)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License. 