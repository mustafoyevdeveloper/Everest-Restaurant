import express from 'express';
import {
  getMenus, getMenuById, createMenu, deleteMenu
} from '../controllers/menuController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();
router.route('/').get(getMenus).post(protect, createMenu);
router.route('/:id').get(getMenuById).delete(protect, deleteMenu);

export default router;
