import { Router, Response } from 'express';
import { body } from 'express-validator';
import { Product } from '../models/Product';
import { AuthRequest, requireRole } from '../middleware/auth';

const router = Router();

// Role-based filter for products - all authenticated users can view, writes restricted
const filterByUserRole = async (req: AuthRequest, res: Response, next: Function) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  return next();
};

// Get all products
router.get('/', filterByUserRole, async (req: AuthRequest, res) => {
  try {
    const { category, active, search } = req.query;
    let query: any = {};
    
    if (category) query.category = category;
    if (active !== undefined) query.isActive = active === 'true';
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'variants.sku': { $regex: search, $options: 'i' } },
      ];
    }
    
    const products = await Product.find(query)
      .populate('defaultVendorId', 'name')
      .sort({ name: 1 });
      
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get product by ID
router.get('/:id', filterByUserRole, async (req: AuthRequest, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('defaultVendorId', 'name');
      
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Create product
router.post(
  '/',
  requireRole('admin', 'manager', 'warehouse'),
  [
    body('name').trim().notEmpty(),
    body('category').isIn(['materials', 'labor', 'service', 'package', 'retail']),
    body('type').isIn(['physical', 'service', 'package']),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const product = new Product({ ...req.body, createdBy: req.user?._id });
      await product.save();
      
      const populatedProduct = await Product.findById(product._id)
        .populate('defaultVendorId', 'name');
        
      res.status(201).json(populatedProduct);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create product' });
    }
  }
);

// Update product
router.put(
  '/:id',
  requireRole('admin', 'manager', 'warehouse'),
  async (req: AuthRequest, res) => {
    try {
      const product = await Product.findByIdAndUpdate(
        req.params.id,
        { ...req.body, updatedBy: req.user?._id },
        { new: true, runValidators: true }
      ).populate('defaultVendorId', 'name');
      
      if (!product) {
        res.status(404).json({ error: 'Product not found' });
        return;
      }
      res.json(product);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update product' });
    }
  }
);

// Delete product (soft delete)
router.delete(
  '/:id',
  requireRole('admin', 'manager', 'warehouse'),
  async (req: AuthRequest, res) => {
    try {
      const product = await Product.findByIdAndUpdate(
        req.params.id,
        { isActive: false, updatedBy: req.user?._id },
        { new: true }
      );
      
      if (!product) {
        res.status(404).json({ error: 'Product not found' });
        return;
      }
      res.json({ message: 'Product deactivated' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to deactivate product' });
    }
  }
);

export default router;