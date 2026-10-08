import * as productService from '../services/productService.js';

export async function getProducts(req, res, next) {
  try {
    const { search, category, sortBy, order, page, limit } = req.query;
    const result = await productService.getAllProducts({
      search,
      category,
      sortBy,
      order,
      page,
      limit
    });
    res.json({
      success: true,
      data: result.products,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
}

export async function getProduct(req, res, next) {
  try {
    const { id } = req.params;
    const product = await productService.getProductById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: `Product with ID ${id} not found.`
      });
    }
    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    next(error);
  }
}

export async function getCategories(req, res, next) {
  try {
    const categories = await productService.getCategories();
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    next(error);
  }
}

export async function createProduct(req, res, next) {
  try {
    const { product_id, product_name, category, price } = req.body;
    if (!product_id || !product_name || !category || price == null) {
      return res.status(400).json({
        success: false,
        message: 'product_id, product_name, category, and price are required.'
      });
    }
    const product = await productService.createProduct({
      product_id,
      product_name,
      category,
      price: Number(price)
    });
    res.status(201).json({
      success: true,
      message: 'Product created successfully.',
      data: product
    });
  } catch (error) {
    next(error);
  }
}

export async function updateProduct(req, res, next) {
  try {
    const { id } = req.params;
    const { product_name, category, price } = req.body;
    const updated = await productService.updateProduct(id, {
      product_name,
      category,
      price: price != null ? Number(price) : undefined
    });
    if (!updated) {
      return res.status(404).json({
        success: false,
        message: `Product with ID ${id} not found.`
      });
    }
    res.json({
      success: true,
      message: 'Product updated successfully.',
      data: updated
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteProduct(req, res, next) {
  try {
    const { id } = req.params;
    const result = await productService.deleteProduct(id);
    res.json({
      success: true,
      message: `Product ${id} deleted successfully.`,
      data: result
    });
  } catch (error) {
    next(error);
  }
}

