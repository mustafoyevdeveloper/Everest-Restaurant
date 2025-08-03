import Contact from '../models/Contact.js';
import AdminNotification from '../models/AdminNotification.js';
import asyncHandler from '../utils/asyncHandler.js';
import { emitToAll } from '../utils/socketEmitter.js';

// Create new contact message
export const createContact = asyncHandler(async (req, res) => {
  const { name, email, phone, message } = req.body;

  // Validatsiya
  if (!name || !email || !message) {
    res.status(400);
    throw new Error('Name, email va message talab qilinadi');
  }

  // Email formati tekshirish
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
    res.status(400);
    throw new Error('Noto\'g\'ri email formati');
  }

  // Contact yaratish
  const contact = await Contact.create({
    name,
    email: email.toLowerCase(),
    phone,
    message
  });

  // Admin notification yaratish
  try {
    await createContactNotification(contact);
  } catch (error) {
    // Notification xatoligi contact yaratishni to'xtatmasin
    console.error('Contact notification error:', error);
  }

  res.status(201).json({
    success: true,
    message: 'Xabar yuborildi. Tez orada siz bilan bog\'lanamiz.',
    data: contact
  });
});

// Get user's own contact messages
export const getUserContacts = asyncHandler(async (req, res) => {
  if (!req.user) {
    res.status(401);
    throw new Error('User not authenticated');
  }

  const { page = 1, limit = 20 } = req.query;
  
  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    sort: { createdAt: -1 }
  };

  // Foydalanuvchining xabarlarini olish (email bo'yicha)
  const contacts = await Contact.paginate(
    { email: req.user.email },
    options
  );
  
  res.json({
    success: true,
    data: contacts
  });
});

// Get all contact messages (admin only)
export const getAllContacts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  
  const query = {};
  if (status) query.status = status;

  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    sort: { createdAt: -1 }
  };

  const contacts = await Contact.paginate(query, options);
  
  res.json({
    success: true,
    data: contacts
  });
});

// Get single contact message
export const getContact = asyncHandler(async (req, res) => {
  const contact = await Contact.findById(req.params.id);
  if (!contact) {
    res.status(404);
    throw new Error('Contact message not found');
  }
  res.json(contact);
});

// Mark contact as read (admin only)
export const markAsRead = asyncHandler(async (req, res) => {
  const contact = await Contact.findById(req.params.id);
  
  if (!contact) {
    res.status(404);
    throw new Error('Contact message not found');
  }

  // Xabarni o'qildi deb belgilash
  contact.read = true;
  contact.status = 'read';
  
  // Foydalanuvchiga bildirishnoma qo'shish
  contact.notifications.push({
    type: 'read',
    message: 'Sizning xabaringiz o\'qildi',
    sentAt: new Date(),
    sent: false
  });

  await contact.save();

  // Foydalanuvchiga real-time bildirishnoma yuborish
  if (contact.userId) {
    emitToAll('contact_read', {
      contactId: contact._id,
      message: 'Sizning xabaringiz o\'qildi',
      timestamp: new Date()
    });
  }
  
  res.json(contact);
});

// Admin reply to contact message
export const replyToContact = asyncHandler(async (req, res) => {
  const { message } = req.body;
  
  if (!message || message.trim().length === 0) {
    res.status(400);
    throw new Error('Reply message is required');
  }

  const contact = await Contact.findById(req.params.id);
  
  if (!contact) {
    res.status(404);
    throw new Error('Contact message not found');
  }

  // Admin javobini saqlash
  contact.adminReply = {
    message: message.trim(),
    repliedAt: new Date(),
    repliedBy: req.user._id
  };
  contact.status = 'replied';

  // Foydalanuvchiga bildirishnoma qo'shish
  contact.notifications.push({
    type: 'replied',
    message: 'Sizning xabaringizga javob berildi',
    sentAt: new Date(),
    sent: false
  });

  await contact.save();

  // Foydalanuvchiga real-time bildirishnoma yuborish
  if (contact.userId) {
    emitToAll('contact_replied', {
      contactId: contact._id,
      message: 'Sizning xabaringizga javob berildi',
      adminReply: contact.adminReply.message,
      timestamp: new Date()
    });
  }

  // Email orqali ham bildirishnoma yuborish (keyinchalik qo'shiladi)
  // await sendContactReplyEmail(contact.email, contact.name, message);
  
  res.json({
    success: true,
    data: contact,
    message: 'Reply sent successfully'
  });
});

// Update contact status
export const updateContactStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  
  const contact = await Contact.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true }
  );
  
  if (!contact) {
    res.status(404);
    throw new Error('Contact message not found');
  }
  
  res.json(contact);
});

// Delete contact message
export const deleteContact = asyncHandler(async (req, res) => {
  const contact = await Contact.findByIdAndDelete(req.params.id);
  
  if (!contact) {
    res.status(404);
    throw new Error('Contact message not found');
  }
  
  res.json({ message: 'Contact message deleted successfully' });
});

export const getUnreadContactCount = asyncHandler(async (req, res) => {
  const count = await Contact.countDocuments({ read: false });
  res.json({ count });
});

// Get user's unread notifications count
export const getUserUnreadNotifications = asyncHandler(async (req, res) => {
  if (!req.user) {
    res.status(401);
    throw new Error('User not authenticated');
  }

  const contacts = await Contact.find({ 
    email: req.user.email,
    'notifications.sent': false 
  });

  const unreadCount = contacts.reduce((total, contact) => {
    return total + contact.notifications.filter(n => !n.sent).length;
  }, 0);

  res.json({ count: unreadCount });
});

// Mark user notifications as read
export const markUserNotificationsAsRead = asyncHandler(async (req, res) => {
  if (!req.user) {
    res.status(401);
    throw new Error('User not authenticated');
  }

  await Contact.updateMany(
    { email: req.user.email, 'notifications.sent': false },
    { $set: { 'notifications.$.sent': true } }
  );

  res.json({ message: 'Notifications marked as read' });
}); 