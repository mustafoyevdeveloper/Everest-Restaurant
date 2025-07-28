let io = null;

export const setIO = (socketIO) => {
  io = socketIO;
  console.log('✅ Socket.io instance set successfully');
};

export const emitToAll = (event, data) => {
  if (!io) {
    console.error('❌ Socket.io instance not initialized');
    return false;
  }
  
  try {
    io.emit(event, data);
    console.log(`📡 Emitted '${event}' to all clients:`, data);
    return true;
  } catch (error) {
    console.error(`❌ Error emitting '${event}' to all clients:`, error);
    return false;
  }
};

export const emitToAdmin = (event, data) => {
  if (!io) {
    console.error('❌ Socket.io instance not initialized');
    return false;
  }
  
  try {
    // Emit to all clients (admins will filter on frontend)
    io.emit(event, data);
    console.log(`📡 Emitted '${event}' to admins:`, data);
    return true;
  } catch (error) {
    console.error(`❌ Error emitting '${event}' to admins:`, error);
    return false;
  }
};

export const emitToUser = (userId, event, data) => {
  if (!io) {
    console.error('❌ Socket.io instance not initialized');
    return false;
  }
  
  try {
    // Find socket by userId (you might need to maintain a user-socket mapping)
    const sockets = Array.from(io.sockets.sockets.values());
    const userSocket = sockets.find(socket => socket.userId === userId);
    
    if (userSocket) {
      userSocket.emit(event, data);
      console.log(`📡 Emitted '${event}' to user ${userId}:`, data);
      return true;
    } else {
      console.warn(`⚠️ User ${userId} not found in active sockets`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error emitting '${event}' to user ${userId}:`, error);
    return false;
  }
};

export const emitToRoom = (room, event, data) => {
  if (!io) {
    console.error('❌ Socket.io instance not initialized');
    return false;
  }
  
  try {
    io.to(room).emit(event, data);
    console.log(`📡 Emitted '${event}' to room '${room}':`, data);
    return true;
  } catch (error) {
    console.error(`❌ Error emitting '${event}' to room '${room}':`, error);
    return false;
  }
};

export const getConnectedClientsCount = () => {
  if (!io) return 0;
  return io.engine.clientsCount;
};

export const isConnected = () => {
  return io !== null;
}; 