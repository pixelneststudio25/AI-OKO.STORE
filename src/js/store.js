// Store Page JavaScript - Full Decap CMS version
let allProducts = [];
let currentCategoryProducts = [];
let filteredProducts = [];
let currentPage = 0;
const pageSize = 12;
let activeColor = 'all';

// Initialize store (async)
async function initStore() {
  await loadAllProducts();
  allProducts = getAllProducts();
  updateCartCount();
  initColorFilters();
  loadFeaturedProducts();
  initSearch();
  if (typeof updateFloatingCart === 'function') updateFloatingCart();
}

function updateCartCount() {
  const cart = JSON.parse(localStorage.getItem('aioko-cart')) || [];
  const cartCountElements = document.querySelectorAll('.cart-count');
  cartCountElements.forEach(el => {
    el.textContent = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
  });
}

// Load featured products (first 6 products – add a 'featured' flag later if desired)
async function loadFeaturedProducts() {
  const container = document.getElementById('featured-products');
  if (!container) return;
  await loadAllProducts();
  const featured = getAllProducts().slice(0, 6);
  container.innerHTML = featured.map(product => `
    <div class="product-card">
      <div class="product-img">
        <div class="product-badge">Featured</div>
        <img src="${product.image}" alt="${product.name}" onerror="this.src='data:image/svg+xml;charset=UTF-8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 300 200\" preserveAspectRatio=\"none\"><rect width=\"300\" height=\"200\" fill=\"%237D3CFF\"/><text x=\"50%\" y=\"50%\" dy=\".3em\" fill=\"white\" font-family=\"Montserrat\" font-size=\"16\" text-anchor=\"middle\">${product.name}</text></svg>'">
      </div>
      <div class="product-content">
        <h3>${product.name}</h3>
        <div class="product-price">${formatPrice(product.price)}</div>
        <div class="product-meta">
          <span>${product.category.toUpperCase()}</span>
        </div>
        <div class="product-actions">
          <button class="add-to-cart-btn" onclick="addToCart('${product.id}')">
            <i class="fas fa-shopping-bag"></i> Add to Cart
          </button>
          <button class="quick-view-btn" onclick="quickView('${product.id}')">
            <i class="fas fa-eye"></i> View
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

function renderProduct(product) {
  return `
    <div class="product-card" data-product-id="${product.id}">
      <div class="product-img">
        <img src="${product.image}" alt="${product.name}" onerror="this.src='data:image/svg+xml;charset=UTF-8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 300 200\" preserveAspectRatio=\"none\"><rect width=\"300\" height=\"200\" fill=\"%237D3CFF\"/><text x=\"50%\" y=\"50%\" dy=\".3em\" fill=\"white\" font-family=\"Montserrat\" font-size=\"16\" text-anchor=\"middle\">${product.name}</text></svg>'">
      </div>
      <div class="product-content">
        <h3>${product.name}</h3>
        <div class="product-price">${formatPrice(product.price)}</div>
        <div class="product-meta">
          <span><i class="fas fa-ruler"></i> ${product.size || 'Standard'}</span>
          <span><i class="fas fa-tag"></i> ${product.sku || ''}</span>
        </div>
        <div class="product-actions">
          <button class="add-to-cart-btn" onclick="addToCart('${product.id}')">
            <i class="fas fa-shopping-bag"></i> Add to Cart
          </button>
          <button class="quick-view-btn" onclick="showProductDetails('${product.id}')">
            <i class="fas fa-eye"></i> Details
          </button>
        </div>
      </div>
    </div>`;
}

function loadCategoryProducts(category) {
  const container = document.getElementById('products-container');
  if (!container) return;
  currentCategoryProducts = getAllProducts().filter(p => p.category === category);
  filteredProducts = [...currentCategoryProducts];
  currentPage = 0;
  container.innerHTML = '';
  loadNextBatch();
  initSorting();
  generateColorFilters(currentCategoryProducts);
}

function loadNextBatch() {
  const container = document.getElementById('products-container');
  if (!container) return;
  const start = currentPage * pageSize;
  const end = start + pageSize;
  const batch = filteredProducts.slice(start, end);
  if (batch.length === 0) {
    if (currentPage === 0) {
      container.innerHTML = `<div class="no-products"><i class="fas fa-search"></i><h3>No products found</h3><p>Try selecting a different color filter</p></div>`;
    }
    return;
  }
  batch.forEach(product => container.insertAdjacentHTML('beforeend', renderProduct(product)));
  currentPage++;
  updateProductCount();
}

function initSorting() {
  const sortSelect = document.getElementById('sort-by');
  if (!sortSelect) return;
  sortSelect.addEventListener('change', function() {
    const sortedProducts = [...filteredProducts];
    switch(this.value) {
      case 'price-low': sortedProducts.sort((a,b) => a.price - b.price); break;
      case 'price-high': sortedProducts.sort((a,b) => b.price - a.price); break;
      default: sortedProducts.sort((a,b) => a.name.localeCompare(b.name));
    }
    const container = document.getElementById('products-container');
    if (!container) return;
    container.innerHTML = '';
    filteredProducts = sortedProducts;
    currentPage = 0;
    loadNextBatch();
  });
}

// ========== COLOR FILTER SYSTEM ==========
async function initColorFilters() {
  const colorContainer = document.getElementById('colorTagsContainer');
  if (!colorContainer) return;
  colorContainer.innerHTML = '<div class="loading-tags"><i class="fas fa-spinner fa-spin"></i> Detecting colors...</div>';
  await loadAllProducts();
  let products = [];
  const categoryMatch = window.location.pathname.match(/category\.html\?category=(\w+)/);
  const currentCategory = categoryMatch ? categoryMatch[1] : null;
  if (currentCategory) {
    products = getAllProducts().filter(p => p.category === currentCategory);
  } else {
    products = getAllProducts();
  }
  generateColorFilters(products);
}

function extractColorCombinations(products) {
  const colorMap = {};
  let totalProducts = 0;
  products.forEach(product => {
    totalProducts++;
    let colors = [];
    if (product.colorTags && Array.isArray(product.colorTags)) colors = product.colorTags;
    else if (product.colors && Array.isArray(product.colors)) colors = product.colors;
    else if (product.color && typeof product.color === 'string') colors = product.color.split(/[,\/&]+/).map(c => c.trim());
    else if (product.name) colors = extractColorsFromName(product.name);
    colors = colors.map(c => c.trim().toLowerCase().replace(/[^a-z\s&]/g, '')).filter(c => c.length > 0);
    if (colors.length > 0) {
      const sortedColors = [...colors].sort();
      const colorKey = sortedColors.join(' & ');
      colorMap[colorKey] = (colorMap[colorKey] || 0) + 1;
    } else {
      colorMap['other'] = (colorMap['other'] || 0) + 1;
    }
  });
  const colorCombinations = Object.entries(colorMap).map(([name, count]) => ({
    id: name.toLowerCase().replace(/[& ]+/g, '-').replace(/[^a-z\-]/g, ''),
    name: name.charAt(0).toUpperCase() + name.slice(1),
    count: count
  }));
  colorCombinations.sort((a,b) => b.count - a.count || a.name.localeCompare(b.name));
  colorCombinations.unshift({ id: 'all', name: 'All Colors', count: totalProducts });
  return colorCombinations;
}

function extractColorsFromName(productName) {
  const colorKeywords = ['red','blue','green','yellow','black','white','purple','pink','orange','brown','grey','gray','gold','silver','navy','maroon','teal','turquoise','violet','indigo','magenta','cyan','beige','cream','khaki','olive','lime','mint','lavender','coral','peach'];
  const foundColors = [];
  const nameLower = productName.toLowerCase();
  colorKeywords.forEach(color => { if (nameLower.includes(color)) foundColors.push(color); });
  return foundColors;
}

function generateColorFilters(products) {
  const colorContainer = document.getElementById('colorTagsContainer');
  if (!colorContainer) return;
  if (!products || products.length === 0) {
    colorContainer.innerHTML = '<div class="no-colors">No products to analyze</div>';
    return;
  }
  const colorCombinations = extractColorCombinations(products);
  colorContainer.innerHTML = '';
  colorCombinations.forEach(color => {
    const colorTag = document.createElement('div');
    colorTag.className = 'color-tag';
    colorTag.textContent = `${color.name} (${color.count})`;
    colorTag.dataset.color = color.id;
    colorTag.title = `Click to filter by ${color.name}`;
    colorTag.addEventListener('click', function() {
      document.querySelectorAll('.color-tag').forEach(tag => tag.classList.remove('active'));
      this.classList.add('active');
      activeColor = color.id;
      applyFilters();
      const productsSection = document.getElementById('products-container');
      if (productsSection) productsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    colorContainer.appendChild(colorTag);
  });
  const allColorsTag = colorContainer.querySelector('.color-tag[data-color="all"]');
  if (allColorsTag) { allColorsTag.classList.add('active'); activeColor = 'all'; }
  initColorFilterToggle();
}

function initColorFilterToggle() {
  const colorContainer = document.getElementById('colorTagsContainer');
  const toggleBtn = document.getElementById('colorToggleBtn');
  if (!colorContainer || !toggleBtn) return;
  const toggleText = toggleBtn.querySelector('.toggle-text');
  const toggleIcon = toggleBtn.querySelector('.toggle-icon');
  let isExpanded = false;
  function updateToggleButton() {
    if (isExpanded) {
      toggleText.textContent = 'Show Less Colors';
      toggleIcon.className = 'fas fa-chevron-up toggle-icon';
      toggleBtn.classList.add('expanded');
      colorContainer.classList.add('expanded');
    } else {
      toggleText.textContent = 'Show More Colors';
      toggleIcon.className = 'fas fa-chevron-down toggle-icon';
      toggleBtn.classList.remove('expanded');
      colorContainer.classList.remove('expanded');
    }
  }
  function setInitialState() {
    const isMobile = window.innerWidth <= 768;
    toggleBtn.style.display = 'flex';
    colorContainer.style.maxHeight = isMobile ? '100px' : '150px';
    updateToggleButton();
  }
  setInitialState();
  window.addEventListener('resize', setInitialState);
  toggleBtn.addEventListener('click', function() {
    const isMobile = window.innerWidth <= 768;
    isExpanded = !isExpanded;
    colorContainer.style.maxHeight = isExpanded ? (isMobile ? '250px' : '400px') : (isMobile ? '100px' : '150px');
    colorContainer.style.overflowY = isExpanded ? 'auto' : 'hidden';
    updateToggleButton();
    if (isExpanded && isMobile) setTimeout(() => colorContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 300);
  });
  const colorTags = colorContainer.querySelectorAll('.color-tag');
  colorTags.forEach(tag => {
    tag.addEventListener('click', function() {
      if (isExpanded && window.innerWidth <= 768) {
        isExpanded = false;
        colorContainer.style.maxHeight = '100px';
        colorContainer.style.overflowY = 'hidden';
        updateToggleButton();
      }
    });
  });
}

function applyFilters() {
  if (activeColor === 'all') {
    filteredProducts = [...currentCategoryProducts];
  } else {
    filteredProducts = currentCategoryProducts.filter(product => {
      let productColors = [];
      if (product.colorTags && Array.isArray(product.colorTags)) productColors = product.colorTags;
      else if (product.colors && Array.isArray(product.colors)) productColors = product.colors;
      else if (product.color && typeof product.color === 'string') productColors = product.color.split(/[,\/&]+/).map(c => c.trim());
      productColors = productColors.map(c => c.toLowerCase().replace(/[^a-z\s&]/g, ''));
      if (activeColor === 'other') return productColors.length === 0;
      const productColorKey = [...productColors].sort().join(' & ');
      const normalizedActiveColor = activeColor.replace(/-/g, ' & ');
      return productColorKey.includes(normalizedActiveColor) || productColors.some(color => color.includes(normalizedActiveColor.replace(' & ', ' ')));
    });
  }
  currentPage = 0;
  const container = document.getElementById('products-container');
  if (!container) return;
  container.innerHTML = '';
  loadNextBatch();
  updateProductCount();
}

function updateProductCount() {
  const countElement = document.getElementById('product-count');
  if (countElement) {
    const total = filteredProducts.length;
    const showing = Math.min(total, currentPage * pageSize);
    countElement.textContent = `Showing ${showing} of ${total} products`;
  }
}

// Search functionality
function initSearch() {
  const searchInput = document.getElementById('global-search');
  const resultsContainer = document.getElementById('search-results');
  if (!searchInput || !resultsContainer) return;
  searchInput.addEventListener('input', function() {
    const searchTerm = this.value.toLowerCase().trim();
    if (searchTerm.length < 2) {
      resultsContainer.style.display = 'none';
      return;
    }
    const allProducts = getAllProducts();
    const results = allProducts.filter(product =>
      product.name.toLowerCase().includes(searchTerm) ||
      product.category.toLowerCase().includes(searchTerm) ||
      (product.description && product.description.toLowerCase().includes(searchTerm))
    ).slice(0, 10);
    if (results.length > 0) {
      resultsContainer.innerHTML = results.map(product => `
        <div class="search-result-item" onclick="navigateToProduct('${product.id}')">
          <div class="search-result-img"><i class="fas fa-tshirt"></i></div>
          <div class="search-result-info">
            <h4>${product.name}</h4>
            <div class="price">${formatPrice(product.price)}</div>
            <div class="category">${product.category.toUpperCase()}</div>
          </div>
        </div>
      `).join('');
      resultsContainer.style.display = 'block';
    } else {
      resultsContainer.innerHTML = '<div class="no-results">No products found</div>';
      resultsContainer.style.display = 'block';
    }
  });
  document.addEventListener('click', function(e) {
    if (!searchInput.contains(e.target) && !resultsContainer.contains(e.target)) resultsContainer.style.display = 'none';
  });
}

function navigateToProduct(productId) { showProductDetails(productId); }

function showProductDetails(productId) {
  const product = findProductById(productId);
  if (!product) return;
  const modal = document.createElement('div');
  modal.className = 'product-modal';
  modal.innerHTML = `
    <div class="modal-content">
      <span class="close-modal">&times;</span>
      <div class="modal-body">
        <div class="modal-image"><img src="${product.image}" alt="${product.name}" onerror="this.src='data:image/svg+xml;charset=UTF-8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 300 300\" preserveAspectRatio=\"none\"><rect width=\"300\" height=\"300\" fill=\"%237D3CFF\"/><text x=\"50%\" y=\"50%\" dy=\".3em\" fill=\"white\" font-family=\"Montserrat\" font-size=\"18\" text-anchor=\"middle\">${product.name}</text></svg>'"></div>
        <div class="modal-info">
          <h2>${product.name}</h2>
          <div class="modal-price">${formatPrice(product.price)}</div>
          <div class="modal-meta">
            <p><strong>Category:</strong> ${product.category.toUpperCase()}</p>
            <p><strong>Size:</strong> ${product.size || 'Standard'}</p>
            <p><strong>SKU:</strong> ${product.sku || 'N/A'}</p>
            ${product.colorTags ? `<p><strong>Colors:</strong> ${product.colorTags.join(', ')}</p>` : ''}
          </div>
          <p class="modal-description">${product.description || ''}</p>
          <button class="btn btn-primary add-to-cart-modal" onclick="addToCart('${product.id}'); this.closest('.product-modal').remove();">
            <i class="fas fa-shopping-bag"></i> Add to Cart
          </button>
        </div>
      </div>
    </div>`;
  if (!document.getElementById('modal-styles')) {
    const style = document.createElement('style');
    style.id = 'modal-styles';
    style.textContent = `
      .product-modal { position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); display:flex; align-items:center; justify-content:center; z-index:2000; padding:20px; }
      .modal-content { background:white; border-radius:10px; max-width:800px; width:100%; max-height:90vh; overflow-y:auto; position:relative; }
      .close-modal { position:absolute; top:15px; right:15px; font-size:28px; cursor:pointer; }
      .modal-body { display:grid; grid-template-columns:1fr 1fr; gap:30px; padding:30px; }
      .modal-image img { width:100%; height:300px; object-fit:cover; border-radius:10px; }
      .modal-info h2 { margin-bottom:15px; color:#7D3CFF; }
      .modal-price { font-size:1.8rem; font-weight:700; color:#7D3CFF; margin-bottom:20px; }
      @media (max-width:768px) { .modal-body { grid-template-columns:1fr; } }
    `;
    document.head.appendChild(style);
  }
  document.body.appendChild(modal);
  modal.querySelector('.close-modal').onclick = () => modal.remove();
  modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
}

function quickView(productId) { showProductDetails(productId); }

// Infinite scroll
window.addEventListener('scroll', () => {
  const container = document.getElementById('products-container');
  if (!container) return;
  if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 400) loadNextBatch();
});

function formatPrice(price) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(price);
}

// DOM ready
document.addEventListener('DOMContentLoaded', async function() {
  await initStore();
  if (document.getElementById('products-container')) {
    currentPage = 0;
    loadNextBatch();
  }
});