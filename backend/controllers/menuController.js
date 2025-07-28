import Menu from '../models/Menu.js';

export const getMenus = async (req, res) => {
  const menus = await Menu.find({});
  res.json(menus);
};

export const getMenuById = async (req, res) => {
  const menu = await Menu.findById(req.params.id);
  if (menu) res.json(menu);
  else res.status(404).json({ message: 'Menu item not found' });
};

export const createMenu = async (req, res) => {
  const { title, description, image, price, category } = req.body;
  const menu = new Menu({ title, description, image, price, category });
  const createdMenu = await menu.save();
  res.status(201).json(createdMenu);
};

export const deleteMenu = async (req, res) => {
  const menu = await Menu.findById(req.params.id);
  if (menu) {
    await menu.remove();
    res.json({ message: 'Menu item removed' });
  } else {
    res.status(404).json({ message: 'Menu item not found' });
  }
};
