// Shopping Cart JavaScript
const CART_KEY = 'aioko-cart';

// ============================================
// ESSENTIAL HELPER FUNCTIONS - WERE MISSING
// ============================================

// Find product by ID in your products-data.js structure
function findProductById(productId) {
    // Check if productsData exists
    if (!window.productsData) {
        console.error('productsData is not loaded! Check your products-data.js file.');
        return null;
    }
    
    // Search through all categories in productsData
    for (const categoryKey in productsData) {
        // Skip the 'featured' category (it's different structure)
        if (categoryKey === 'featured') continue;
        
        // Get the category array
        const categoryArray = productsData[categoryKey];
        
        // Check if it's actually an array
        if (!Array.isArray(categoryArray)) {
            console.warn(`Category ${categoryKey} is not an array:`, categoryArray);
            continue;
        }
        
        // Search for the product in this category
        const product = categoryArray.find(item => item.id === productId);
        
        if (product) {
            console.log('Found product:', product.name, 'in category:', categoryKey);
            return product;
        }
    }
    
    console.error('Product not found with ID:', productId);
    console.log('Available categories:', Object.keys(productsData));
    
    // Log first few products from each category to help debugging
    for (const categoryKey in productsData) {
        if (categoryKey === 'featured') continue;
        const categoryArray = productsData[categoryKey];
        if (Array.isArray(categoryArray) && categoryArray.length > 0) {
            console.log(`Sample products in ${categoryKey}:`, 
                categoryArray.slice(0, 3).map(p => ({id: p.id, name: p.name})));
        }
    }
    
    return null;
}

// Format price with Nigerian Naira symbol
function formatPrice(price) {
    return `₦${price.toLocaleString('en-NG')}`;
}

// Update cart count in header (if it exists)
function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem(CART_KEY)) || [];
    const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    
    // Update header cart count if element exists
    const headerCartCount = document.querySelector('.cart-count');
    if (headerCartCount) {
        headerCartCount.textContent = totalItems;
    }
    
    return totalItems;
}

// ============================================
// MAIN CART FUNCTIONS
// ============================================

// Add item to cart
function addToCart(productId) {
    console.log('Attempting to add product ID:', productId);
    
    const product = findProductById(productId);
    if (!product) {
        alert('Product not found! Check console for details.');
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
    
    // Debug: log current cart
    console.log('Cart after adding:', cart);
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
        updateCartCount();
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
    
    // Add animation when cart updates
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

// Configuration
const SITE_CONFIG = {
    baseUrl: 'https://pixelneststudio25.github.io/AI-OKO-FABRICS/',
    whatsappNumber: '2349060185654',
    businessName: 'Ai-oko Fabrics',
    
    getBaseUrl: function() {
        if (window.location.hostname.includes('github.io')) {
            return window.location.origin;
        } else if (window.location.protocol === 'file:') {
            return this.baseUrl;
        }
        return this.baseUrl;
    }
};

// Proceed to checkout using WhatsApp Webview
function proceedToCheckout() {
    const cart = JSON.parse(localStorage.getItem(CART_KEY)) || [];
    
    if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }
    
    const orderId = 'AIKO' + Date.now().toString().slice(-8);
    
    const optimizedCart = cart.map(item => ({
        i: item.id,
        n: item.name.substring(0, 20),
        p: item.price,
        q: item.quantity,
        s: item.size?.substring(0, 1) || 'S'
    }));
    
    const cartString = JSON.stringify(optimizedCart);
    const cartEncoded = btoa(cartString);
    
    const baseUrl = SITE_CONFIG.getBaseUrl();
    const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const orderSummaryUrl = `${cleanBaseUrl}/order-summary.html?o=${orderId}&c=${cartEncoded}`;
    
    const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    const message = `🛒 *New Order - Ai-oko Fabrics* 🛒

Items: ${itemCount} | Total: ${formatPrice(total)}

📋 View order with photos:
${orderSummaryUrl}

Please open link in WhatsApp to confirm.`;
    
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${SITE_CONFIG.whatsappNumber}?text=${encodedMessage}`;
    
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
    if (existingNotification) {
        document.body.removeChild(existingNotification);
    }
    
    const notification = document.createElement('div');
    notification.className = 'cart-notification';
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
        </div>
    `;
    
    if (!document.getElementById('notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            .cart-notification {
                position: fixed;
                top: 100px;
                right: 20px;
                background: var(--primary);
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
            .notification-content {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            .notification-content i {
                font-size: 1.2rem;
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            document.body.removeChild(notification);
        }
    }, 3000);
}

// Initialize floating cart on all pages
function initializeFloatingCart() {
    updateFloatingCart();
    
    const style = document.createElement('style');
    style.textContent = `
        .cart-updated {
            animation: cartPulse 0.5s ease;
        }
        @keyframes cartPulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
        }
    `;
    document.head.appendChild(style);
}

// Initialize cart on all pages
document.addEventListener('DOMContentLoaded', function() {
    initializeFloatingCart();
    
    if (window.location.pathname.includes('cart.html')) {
        displayCartItems();
    }
    
    updateCartCount();
});

// Make functions available globally
window.updateFloatingCart = updateFloatingCart;
window.initializeFloatingCart = initializeFloatingCart;
window.findProductById = findProductById; // <-- Make it globally available
window.formatPrice = formatPrice;
window.updateCartCount = updateCartCount;