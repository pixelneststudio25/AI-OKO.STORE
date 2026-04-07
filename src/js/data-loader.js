// js/data-loader.js
let globalProducts = null;
let globalProductsLoaded = false;
let globalProductsPromise = null;

function loadAllProducts() {
  if (globalProductsLoaded) return Promise.resolve(globalProducts);
  if (globalProductsPromise) return globalProductsPromise;
  
  globalProductsPromise = fetch('/products.json')
    .then(res => res.json())
    .then(data => {
      globalProducts = data;
      globalProductsLoaded = true;
      return globalProducts;
    })
    .catch(err => {
      console.error('Failed to load products:', err);
      return [];
    });
  return globalProductsPromise;
}

// Helper to get a product by id
function findProductById(id) {
  if (!globalProducts) return null;
  return globalProducts.find(p => p.id === id);
}

// Rebuild getAllProducts for compatibility
function getAllProducts() {
  return globalProducts || [];
}