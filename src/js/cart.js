// cart.js - Updated for Decap CMS
const CART_KEY = 'aioko-cart';

// Add item to cart
async function addToCart(productId) {
  // Wait for products to be loaded
  await loadAllProducts();
  const product = findProductById(productId);
  if (!product) {
    alert('Product not found!');
    return;
  }
  
  let cart = JSON.parse(localStorage.getItem(CART_KEY)) || [];
  
  // Check if product already in cart
  const existingItem = cart.find(item => item.id === productId);
  
  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({
      id: productId,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity: 1,
      size: product.size || 'Standard'
    });
  }
  
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartCount();
  updateFloatingCart();
  
  // Show confirmation
  showCartNotification('Added to cart!');
}

// Remove item from cart
function removeFromCart(productId) {
  let cart = JSON.parse(localStorage.getItem(CART_KEY)) || [];
  cart = cart.filter(item => item.id !== productId);
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartCount();
  updateFloatingCart();
  
  // Refresh cart display if on cart page
  if (window.location.pathname.includes('cart.html')) {
    displayCartItems();
  }
  
  showCartNotification('Removed from cart');
}

// Update item quantity
function updateQuantity(productId, newQuantity) {
  if (newQuantity < 1) {
    removeFromCart(productId);
    return;
  }
  
  let cart = JSON.parse(localStorage.getItem(CART_KEY)) || [];
  const item = cart.find(item => item.id === productId);
  
  if (item) {
    item.quantity = newQuantity;
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateFloatingCart();
    
    // Refresh cart display if on cart page
    if (window.location.pathname.includes('cart.html')) {
      displayCartItems();
    }
  }
}

// Update floating cart button
function updateFloatingCart() {
  const cart = JSON.parse(localStorage.getItem(CART_KEY)) || [];
  const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
  
  const floatingBadge = document.getElementById('floatingCartCount');
  const floatingBtn = document.getElementById('floatingCartBtn');
  
  if (floatingBadge) {
    floatingBadge.textContent = totalItems;
    floatingBadge.style.display = totalItems > 0 ? 'flex' : 'none';
  }
  
  if (floatingBtn && totalItems > 0) {
    floatingBtn.classList.add('cart-updated');
    setTimeout(() => {
      floatingBtn.classList.remove('cart-updated');
    }, 500);
  }
}

// Display cart items on cart page
function displayCartItems() {
  const cartContainer = document.getElementById('cart-items');
  const cartSummary = document.getElementById('cart-summary');
  
  if (!cartContainer || !cartSummary) return;
  
  const cart = JSON.parse(localStorage.getItem(CART_KEY)) || [];
  
  if (cart.length === 0) {
    cartContainer.innerHTML = `
      <div class="empty-cart">
        <i class="fas fa-shopping-bag"></i>
        <h3>Your cart is empty</h3>
        <p>Add some products to your cart</p>
        <a href="store.html" class="btn btn-primary">Continue Shopping</a>
      </div>
    `;
    cartSummary.innerHTML = '';
    return;
  }
  
  // Display cart items
  cartContainer.innerHTML = cart.map(item => `
    <div class="cart-item">
      <div class="cart-item-img">
        <img src="${item.image}" alt="${item.name}" onerror="this.src='data:image/svg+xml;charset=UTF-8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\" preserveAspectRatio=\"none\"><rect width=\"100\" height=\"100\" fill=\"%237D3CFF\"/><text x=\"50%\" y=\"50%\" dy=\".3em\" fill=\"white\" font-family=\"Montserrat\" font-size=\"10\" text-anchor=\"middle\">${item.name.substring(0, 10)}</text></svg>'">
      </div>
      <div class="cart-item-info">
        <h4>${item.name}</h4>
        <p class="cart-item-size">Size: ${item.size}</p>
        <p class="cart-item-price">${formatPrice(item.price)} each</p>
      </div>
      <div class="cart-item-quantity">
        <button class="quantity-btn" onclick="updateQuantity('${item.id}', ${item.quantity - 1})">-</button>
        <span>${item.quantity}</span>
        <button class="quantity-btn" onclick="updateQuantity('${item.id}', ${item.quantity + 1})">+</button>
      </div>
      <div class="cart-item-total">
        ${formatPrice(item.price * item.quantity)}
      </div>
      <div class="cart-item-remove">
        <button class="remove-btn" onclick="removeFromCart('${item.id}')">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    </div>
  `).join('');
  
  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = subtotal > 50000 ? 0 : 2000;
  const total = subtotal + shipping;
  
  // Display summary
  cartSummary.innerHTML = `
    <div class="summary-item">
      <span>Subtotal</span>
      <span>${formatPrice(subtotal)}</span>
    </div>
    <div class="summary-item">
      <span>Shipping</span>
      <span>${shipping === 0 ? 'FREE' : formatPrice(shipping)}</span>
    </div>
    <div class="summary-item total">
      <span>Total</span>
      <span>${formatPrice(total)}</span>
    </div>
    <button class="btn btn-primary checkout-btn" onclick="proceedToCheckout()">
      Proceed to Checkout
    </button>
    <a href="store.html" class="continue-shopping">Continue Shopping</a>
  `;
}

// Proceed to checkout
function proceedToCheckout() {
  const cart = JSON.parse(localStorage.getItem(CART_KEY)) || [];
  
  if (cart.length === 0) {
    alert('Your cart is empty!');
    return;
  }
  
  // Generate unique order ID
  const orderId = 'AIKO' + Date.now().toString().slice(-8);
  
  // Optimize cart data for URL
  const optimizedCart = cart.map(item => ({
    i: item.id,
    n: item.name.substring(0, 20),
    p: item.price,
    q: item.quantity,
    s: item.size?.substring(0, 1) || 'S'
  }));
  
  const cartString = JSON.stringify(optimizedCart);
  const cartEncoded = btoa(cartString);
  
  // Create order summary URL
  const orderSummaryUrl = `${window.location.origin}/order-summary.html?o=${orderId}&c=${cartEncoded}`;
  
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  const message = `🛒 *New Order - Ai-oko Fabrics* 🛒\n\nItems: ${itemCount} | Total: ${formatPrice(total)}\n\n📋 View order with photos:\n${orderSummaryUrl}\n\nPlease open link in WhatsApp to confirm.`;
  
  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/2349060185654?text=${encodedMessage}`;
  
  window.open(whatsappUrl, '_blank');
  
  localStorage.setItem('aioko-last-order', JSON.stringify({
    id: orderId,
    timestamp: new Date().toISOString(),
    url: orderSummaryUrl
  }));
}

// Show cart notification
function showCartNotification(message) {
  const existingNotification = document.querySelector('.cart-notification');
  if (existingNotification) document.body.removeChild(existingNotification);
  
  const notification = document.createElement('div');
  notification.className = 'cart-notification';
  notification.innerHTML = `<div class="notification-content"><i class="fas fa-check-circle"></i><span>${message}</span></div>`;
  
  if (!document.getElementById('notification-styles')) {
    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = `
      .cart-notification {
        position: fixed;
        top: 100px;
        right: 20px;
        background: #7D3CFF;
        color: white;
        padding: 15px 25px;
        border-radius: 5px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        z-index: 1000;
        animation: slideIn 0.3s ease;
      }
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      .notification-content { display: flex; align-items: center; gap: 10px; }
    `;
    document.head.appendChild(style);
  }
  
  document.body.appendChild(notification);
  setTimeout(() => { if (notification.parentNode) document.body.removeChild(notification); }, 3000);
}

// Initialize floating cart
function initializeFloatingCart() {
  updateFloatingCart();
}

// Helper function to format price (if not already defined globally)
if (typeof formatPrice !== 'function') {
  window.formatPrice = function(price) {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(price);
  };
}

// Make functions available globally
window.updateFloatingCart = updateFloatingCart;
window.initializeFloatingCart = initializeFloatingCart;
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.updateQuantity = updateQuantity;
window.proceedToCheckout = proceedToCheckout;

// Initialize when DOM loads
document.addEventListener('DOMContentLoaded', function() {
  initializeFloatingCart();
  if (window.location.pathname.includes('cart.html')) {
    displayCartItems();
  }
  if (typeof updateCartCount === 'function') updateCartCount();
});
