// Product Database - loaded from API
let products = [];
let cart = [];
let selectedProduct = null;
let deliveryLocation = null;

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    // Load products from API first
    fetch('/api/products/')
        .then(response => response.json())
        .then(data => {
            products = data.products;
            // Initialize everything after products are loaded
            initSidebar();
            initTextCarousel();
            initCategories();
            renderShopProducts();
            updateCartBadge();
            initNavbarScroll();
            initFloatingCart();
            initHeroParticles();
            initHeroSlider(); // Initialize the hero image slider
            loadCart(); // Load saved cart
        })
        .catch(error => {
            console.error('Error loading products:', error);
            showNotification('Failed to load products. Please refresh the page.', 'error');
        });
});

// ==================== SIDEBAR NAVIGATION ====================
function initSidebar() {
    const toggleBtn = document.querySelector('.navbar-toggler');
    const sidebar = document.querySelector('.sidebar');
    const sidebarOverlay = document.querySelector('.sidebar-overlay');
    const closeBtn = document.querySelector('.sidebar-close');
    
    // Create sidebar menu from categories
    createSidebarMenu();
    
    // Toggle sidebar
    if (toggleBtn) {
        toggleBtn.addEventListener('click', function() {
            this.classList.toggle('active');
            sidebar.classList.toggle('active');
            sidebarOverlay.classList.toggle('active');
            document.body.style.overflow = sidebar.classList.contains('active') ? 'hidden' : '';
        });
    }
    
    // Close sidebar
    function closeSidebar() {
        sidebar.classList.remove('active');
        sidebarOverlay.classList.remove('active');
        toggleBtn.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    if (closeBtn) {
        closeBtn.addEventListener('click', closeSidebar);
    }
    
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', closeSidebar);
    }
}

function createSidebarMenu() {
    const menuContainer = document.querySelector('.sidebar-menu');
    if (!menuContainer) return;
    
    // Get unique categories and their subcategories
    const categoryMap = new Map();
    
    products.forEach(product => {
        if (!categoryMap.has(product.category)) {
            categoryMap.set(product.category, new Set());
        }
        if (product.subcategory) {
            categoryMap.get(product.category).add(product.subcategory);
        }
    });
    
    // Build menu HTML
    let menuHTML = `
        <li class="sidebar-menu-item">
            <a href="#" class="sidebar-menu-link" onclick="navigateToPage('home'); return false;">
                <span><i class="fas fa-home"></i> Home</span>
            </a>
        </li>
        <li class="sidebar-menu-item">
            <a href="#" class="sidebar-menu-link" onclick="navigateToPage('shop'); return false;">
                <span><i class="fas fa-shopping-bag"></i> All Products</span>
            </a>
        </li>
    `;
    
    // Add categories with subcategories
    categoryMap.forEach((subcategories, category) => {
        const hasSubcategories = subcategories.size > 0;
        const categoryId = category.replace(/\s+/g, '-').toLowerCase();
        
        menuHTML += `
            <li class="sidebar-menu-item">
                <a href="#" class="sidebar-menu-link" onclick="${hasSubcategories ? `toggleSubmenu('${categoryId}'); return false;` : `navigateToCategoryFromSidebar('${category}'); return false;`}">
                    <span><i class="fas fa-tag"></i> ${category}</span>
                    ${hasSubcategories ? '<i class="fas fa-chevron-down arrow"></i>' : ''}
                </a>
                ${hasSubcategories ? `
                    <ul class="sidebar-submenu" id="submenu-${categoryId}">
                        <li class="sidebar-submenu-item">
                            <a href="#" class="sidebar-submenu-link" onclick="navigateToCategoryFromSidebar('${category}', 'all'); return false;">
                                All ${category}
                            </a>
                        </li>
                        ${Array.from(subcategories).map(sub => `
                            <li class="sidebar-submenu-item">
                                <a href="#" class="sidebar-submenu-link" onclick="navigateToCategoryFromSidebar('${category}', '${sub}'); return false;">
                                    ${sub}
                                </a>
                            </li>
                        `).join('')}
                    </ul>
                ` : ''}
            </li>
        `;
    });
    
    // Add cart link
    menuHTML += `
        <li class="sidebar-menu-item">
            <a href="#" class="sidebar-menu-link" onclick="navigateToPage('cart'); return false;">
                <span><i class="fas fa-shopping-cart"></i> Cart</span>
            </a>
        </li>
    `;
    
    menuContainer.innerHTML = menuHTML;
}

function toggleSubmenu(categoryId) {
    const submenu = document.getElementById(`submenu-${categoryId}`);
    const parentLink = submenu.previousElementSibling;
    
    // Close all other submenus
    document.querySelectorAll('.sidebar-submenu').forEach(menu => {
        if (menu !== submenu) {
            menu.classList.remove('active');
            menu.previousElementSibling.classList.remove('active');
        }
    });
    
    // Toggle current submenu
    submenu.classList.toggle('active');
    parentLink.classList.toggle('active');
}

function navigateToCategoryFromSidebar(category, subcategory = null) {
    // Close sidebar
    document.querySelector('.sidebar').classList.remove('active');
    document.querySelector('.sidebar-overlay').classList.remove('active');
    document.querySelector('.navbar-toggler').classList.remove('active');
    document.body.style.overflow = '';
    
    // Navigate to shop page
    showPage('shop');
    
    // Filter products
    setTimeout(() => {
        const shopPills = document.querySelectorAll('#shopCategoryPills .category-pill');
        shopPills.forEach(pill => {
            pill.classList.remove('active');
            if (pill.textContent.trim() === category) {
                pill.classList.add('active');
            }
        });
        
        if (subcategory && subcategory !== 'all') {
            filterShopProducts(category, subcategory);
        } else {
            renderShopProducts(category);
        }
    }, 100);
}

function navigateToPage(page) {
    // Close sidebar
    document.querySelector('.sidebar').classList.remove('active');
    document.querySelector('.sidebar-overlay').classList.remove('active');
    document.querySelector('.navbar-toggler').classList.remove('active');
    document.body.style.overflow = '';
    
    // Navigate
    showPage(page);
}

// ==================== FLOATING CART ====================
function initFloatingCart() {
    const floatingCart = document.querySelector('.floating-cart');
    
    if (floatingCart) {
        floatingCart.addEventListener('click', function() {
            showPage('cart');
            
            // Add click animation
            this.style.animation = 'none';
            setTimeout(() => {
                this.style.animation = 'floatBounce 3s ease-in-out infinite';
            }, 10);
        });
    }
}

// ==================== NAVBAR SCROLL ====================
function initNavbarScroll() {
    const navbar = document.querySelector('.navbar');
    let lastScroll = 0;
    
    window.addEventListener('scroll', function() {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
        
        lastScroll = currentScroll;
    });
}

// ==================== HERO PARTICLES ====================
function initHeroParticles() {
    const particlesContainer = document.getElementById('heroParticles');
    
    if (!particlesContainer) return;
    
    // Create 20 floating particles
    for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        // Random size between 3px and 8px
        const size = Math.random() * 5 + 3;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        
        // Random starting position
        particle.style.left = `${Math.random() * 100}%`;
        
        // Random animation delay and duration
        particle.style.animationDelay = `${Math.random() * 5}s`;
        particle.style.animationDuration = `${Math.random() * 10 + 10}s`;
        
        particlesContainer.appendChild(particle);
    }
}

// ==================== HERO IMAGE SLIDER ====================
function initHeroSlider() {
    const heroImageContainer = document.querySelector('.hero-image');
    if (!heroImageContainer) return;
    
    // Load hero images from API
    fetch('/api/hero-slider/')
        .then(response => response.json())
        .then(data => {
            const heroImages = data.hero_images;
            
            // If no images in database, use default images
            if (heroImages.length === 0) {
                console.log('No hero images found, using default images');
                const defaultImages = [
                    { image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=1000', alt_text: 'Premium Curtains and Home Decor' },
                    { image: 'https://images.unsplash.com/photo-1585412727339-54e4bae3bbf9?q=80&w=1000', alt_text: 'Elegant Home Decor' },
                    { image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?q=80&w=1000', alt_text: 'Beautiful Curtains' },
                    { image: 'https://images.unsplash.com/photo-1616046229478-9901c5536a45?q=80&w=1000', alt_text: 'Modern Interior' },
                    { image: 'https://images.unsplash.com/photo-1567016432779-094069958ea5?q=80&w=1000', alt_text: 'Stylish Living Space' }
                ];
                createHeroSlider(defaultImages);
            } else {
                createHeroSlider(heroImages);
            }
        })
        .catch(error => {
            console.error('Error loading hero images:', error);
            // Use default images on error
            const defaultImages = [
                { image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=1000', alt_text: 'Premium Curtains and Home Decor' }
            ];
            createHeroSlider(defaultImages);
        });
    
    function createHeroSlider(heroImages) {
        let currentIndex = 0;
        
        // Clear existing content
        heroImageContainer.innerHTML = '';
        
        // Create slider container
        const sliderContainer = document.createElement('div');
        sliderContainer.className = 'hero-slider-container';
        
        // Create all images
        heroImages.forEach((item, index) => {
            const img = document.createElement('img');
            img.src = item.image;
            img.alt = item.alt_text || `Hero Image ${index + 1}`;
            img.className = 'hero-slider-image';
            if (index === 0) img.classList.add('active');
            sliderContainer.appendChild(img);
        });
        
        // Create navigation dots
        const dotsContainer = document.createElement('div');
        dotsContainer.className = 'hero-slider-dots';
        heroImages.forEach((_, index) => {
            const dot = document.createElement('span');
            dot.className = 'hero-slider-dot';
            if (index === 0) dot.classList.add('active');
            dot.onclick = () => goToSlide(index);
            dotsContainer.appendChild(dot);
        });
        
        // Create navigation arrows
        const prevArrow = document.createElement('button');
        prevArrow.className = 'hero-slider-arrow prev';
        prevArrow.innerHTML = '<i class="fas fa-chevron-left"></i>';
        prevArrow.onclick = prevSlide;
        
        const nextArrow = document.createElement('button');
        nextArrow.className = 'hero-slider-arrow next';
        nextArrow.innerHTML = '<i class="fas fa-chevron-right"></i>';
        nextArrow.onclick = nextSlide;
        
        // Append everything
        heroImageContainer.appendChild(sliderContainer);
        heroImageContainer.appendChild(dotsContainer);
        heroImageContainer.appendChild(prevArrow);
        heroImageContainer.appendChild(nextArrow);
        
        // Auto slide every 5 seconds
        let autoSlideInterval = setInterval(nextSlide, 5000);
        
        // Pause on hover
        heroImageContainer.addEventListener('mouseenter', () => {
            clearInterval(autoSlideInterval);
        });
        
        heroImageContainer.addEventListener('mouseleave', () => {
            autoSlideInterval = setInterval(nextSlide, 5000);
        });
        
        function goToSlide(index) {
            const images = sliderContainer.querySelectorAll('.hero-slider-image');
            const dots = dotsContainer.querySelectorAll('.hero-slider-dot');
            
            images.forEach(img => img.classList.remove('active'));
            dots.forEach(dot => dot.classList.remove('active'));
            
            currentIndex = index;
            images[currentIndex].classList.add('active');
            dots[currentIndex].classList.add('active');
        }
        
        function nextSlide() {
            currentIndex = (currentIndex + 1) % heroImages.length;
            goToSlide(currentIndex);
        }
        
        function prevSlide() {
            currentIndex = (currentIndex - 1 + heroImages.length) % heroImages.length;
            goToSlide(currentIndex);
        }
    }
}

// ==================== SCROLL TO CATEGORIES ====================
function scrollToCategories() {
    const categoriesSection = document.getElementById('categoriesSection');
    if (categoriesSection) {
        categoriesSection.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// ==================== TEXT CAROUSEL ====================
function initTextCarousel() {
    const carousel = document.getElementById('textCarousel');
    
    if (!carousel) {
        console.error('Carousel element not found');
        return;
    }
    
    // Get unique categories from products
    const categories = [...new Set(products.map(p => p.category))];
    
    console.log('Products:', products.length);
    console.log('Categories:', categories);
    
    // Create carousel items from categories
    const items = categories.length > 0 ? categories : ["Loading Products..."];
    
    // Duplicate items 6 times for seamless loop
    const duplicatedItems = [...items, ...items, ...items, ...items, ...items, ...items];
    
    carousel.innerHTML = duplicatedItems.map(item => 
        `<div class="carousel-item-text" onclick="showCategoryProducts('${item}')">${item}</div>`
    ).join('');
    
    console.log('Carousel initialized with categories:', items);
}

function showCategoryProducts(category) {
    // Navigate to shop page
    showPage('shop');
    
    // Filter products by this category
    filterShopProducts(category);
    
    // Highlight the category pill in shop page
    setTimeout(() => {
        const shopPills = document.querySelectorAll('#shopCategoryPills .category-pill');
        shopPills.forEach(pill => {
            pill.classList.remove('active');
            if (pill.textContent.trim() === category) {
                pill.classList.add('active');
            }
        });
    }, 100);
}

// ==================== CATEGORIES ====================
function initCategories() {
    const categories = [...new Set(products.map(p => p.category))];
    const homePills = document.getElementById('categoryPills');
    const shopPills = document.getElementById('shopCategoryPills');
    
    const pillsHTML = categories.map(cat => 
        `<div class="category-pill" onclick="selectCategory('${cat}')"><span>${cat}</span></div>`
    ).join('');
    
    if (homePills) {
        homePills.innerHTML = pillsHTML;
    }
    
    if (shopPills) {
        shopPills.innerHTML = `<div class="category-pill active" onclick="filterShopProducts('all')"><span>All Products</span></div>` + pillsHTML.replace(/selectCategory/g, 'filterShopProducts');
    }
}

function selectCategory(category) {
    document.querySelectorAll('#categoryPills .category-pill').forEach(pill => {
        pill.classList.remove('active');
    });
    event.target.closest('.category-pill').classList.add('active');
    
    const container = document.getElementById('categoryProducts');
    const categoryProds = products.filter(p => p.category === category);
    
    // Get unique subcategories for this category
    const subcategories = [...new Set(categoryProds.map(p => p.subcategory).filter(Boolean))];
    
    // Create subcategory filter pills
    let subcategoryPillsHTML = '';
    if (subcategories.length > 0) {
        subcategoryPillsHTML = `
            <div style="margin: 20px 0;">
                <div class="category-pills" style="justify-content: flex-start;">
                    <div class="category-pill active" onclick="filterBySubcategory('${category}', 'all', event)">
                        <span>All ${category}</span>
                    </div>
                    ${subcategories.map(sub => `
                        <div class="category-pill" onclick="filterBySubcategory('${category}', '${sub}', event)">
                            <span>${sub}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    // Group products by subcategory
    let productsHTML = '';
    
    if (subcategories.length > 0) {
        // Show each subcategory section
        subcategories.forEach(sub => {
            const subProds = categoryProds.filter(p => p.subcategory === sub);
            productsHTML += `
                <div class="subcategory-section" data-subcategory="${sub}">
                    <h3 style="color: var(--accent-coral); margin: 30px 0 20px; font-size: 1.6rem; font-weight: 700;">${sub}</h3>
                    <div class="product-grid">
                        ${subProds.map(p => createProductCard(p)).join('')}
                    </div>
                </div>
            `;
        });
        
        // Show products without subcategory if any
        const noSubProds = categoryProds.filter(p => !p.subcategory);
        if (noSubProds.length > 0) {
            productsHTML += `
                <div class="subcategory-section" data-subcategory="other">
                    <h3 style="color: var(--accent-coral); margin: 30px 0 20px; font-size: 1.6rem; font-weight: 700;">Other ${category}</h3>
                    <div class="product-grid">
                        ${noSubProds.map(p => createProductCard(p)).join('')}
                    </div>
                </div>
            `;
        }
    } else {
        // No subcategories, just show all products
        productsHTML = `
            <div class="product-grid">
                ${categoryProds.map(p => createProductCard(p)).join('')}
            </div>
        `;
    }
    
    container.innerHTML = subcategoryPillsHTML + productsHTML;
}

function filterBySubcategory(category, subcategory, event) {
    // Update active pill
    event.target.closest('.category-pills').querySelectorAll('.category-pill').forEach(pill => {
        pill.classList.remove('active');
    });
    event.target.closest('.category-pill').classList.add('active');
    
    // Show/hide sections based on selected subcategory
    const sections = document.querySelectorAll('.subcategory-section');
    
    if (subcategory === 'all') {
        // Show all sections
        sections.forEach(section => section.style.display = 'block');
    } else {
        // Show only selected subcategory
        sections.forEach(section => {
            if (section.dataset.subcategory === subcategory) {
                section.style.display = 'block';
            } else {
                section.style.display = 'none';
            }
        });
    }
}

// ==================== SHOP PRODUCTS ====================
function renderShopProducts(filter = 'all') {
    const grid = document.getElementById('shopProductGrid');
    const filtered = filter === 'all' ? products : products.filter(p => p.category === filter);
    if (grid) {
        grid.innerHTML = filtered.map(p => createProductCard(p)).join('');
    }
}

function filterShopProducts(category, subcategory = null) {
    document.querySelectorAll('#shopCategoryPills .category-pill').forEach(pill => {
        pill.classList.remove('active');
    });
    
    if (event && event.target) {
        event.target.closest('.category-pill').classList.add('active');
    }
    
    if (subcategory) {
        const filtered = products.filter(p => p.category === category && p.subcategory === subcategory);
        document.getElementById('shopProductGrid').innerHTML = filtered.map(p => createProductCard(p)).join('');
    } else {
        renderShopProducts(category);
    }
}

// ==================== PRODUCT CARD CREATION ====================
function createProductCard(product) {
    // Check if the product has a valid image URL
    const hasImage = product.image && 
                     product.image.trim() !== '' && 
                     !product.image.includes('🏠') &&
                     (product.image.startsWith('data:') || 
                      product.image.startsWith('http') ||
                      product.image.startsWith('blob:') ||
                      product.image.startsWith('/media/') ||
                      product.image.startsWith('/static/'));
    
    const imageHTML = hasImage 
        ? `<img src="${product.image}" alt="${product.name}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.onerror=null; this.parentElement.innerHTML='<div style=\\'width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 4rem; background: var(--cream-light);\\'>🏠</div>';">`
        : `<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 4rem; background: var(--cream-light);">🏠</div>`;
    
    return `
        <div class="product-card" onclick="showProductDetail(${product.id})">
            <div class="product-image">
                ${imageHTML}
                ${product.badge ? `<div class="product-badge">${product.badge}</div>` : ''}
            </div>
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <div class="product-price">৳${product.price}</div>
                <button class="add-to-cart-btn" onclick="event.stopPropagation(); addToCart(${product.id})">
                    <span><i class="fas fa-cart-plus"></i> Add to Cart</span>
                </button>
            </div>
        </div>
    `;
}

function showProductDetail(id) {
    selectedProduct = products.find(p => p.id === id);
    if (!selectedProduct) return;
    
    // Check if the product has a valid image URL
    const hasImage = selectedProduct.image && 
                     selectedProduct.image.trim() !== '' && 
                     !selectedProduct.image.includes('🏠') &&
                     (selectedProduct.image.startsWith('data:') || 
                      selectedProduct.image.startsWith('http') ||
                      selectedProduct.image.startsWith('blob:') ||
                      selectedProduct.image.startsWith('/media/') ||
                      selectedProduct.image.startsWith('/static/'));
    
    const imageHTML = hasImage 
        ? `<img src="${selectedProduct.image}" alt="${selectedProduct.name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 15px;" onerror="this.onerror=null; this.parentElement.innerHTML='<div style=\\'width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 8rem; background: var(--cream-light); border-radius: 15px;\\'>🏠</div>';">`
        : `<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 8rem; background: var(--cream-light); border-radius: 15px;">🏠</div>`;
    
    document.getElementById('productImageDetail').innerHTML = `
        <div class="product-images">
            <img id="mainProductImage" style="width:100%; border-radius:15px;">
            <div id="thumbnailImages" class="thumbnails"></div>
        </div>
    `;
    renderProductImages(selectedProduct);

    document.getElementById('productNameDetail').textContent = selectedProduct.name;
    document.getElementById('productPriceDetail').textContent = `৳${selectedProduct.price}`;
    document.getElementById('productDescDetail').textContent = selectedProduct.desc || 'Premium quality product for your home.';
    
    const specs = selectedProduct.specs || ['High Quality', 'Durable', 'Elegant Design'];
    document.getElementById('productSpecsDetail').innerHTML = specs.map(spec => `<li>${spec}</li>`).join('');
    
    showPage('product');
}

// ==================== CART FUNCTIONS ====================
function addToCart(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;
    
    const existingItem = cart.find(item => item.id === id);
    
    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            weight: product.weight,
            image: product.image,
            quantity: 1
        });
    }
    
    saveCart();
    updateCartBadge();
    showNotification(`${product.name} added to cart!`, 'success');
}

function addToCartFromDetail() {
    if (selectedProduct) {
        addToCart(selectedProduct.id);
    }
}

function updateCartBadge() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const badges = document.querySelectorAll('#cartBadge, #floatingCartBadge');
    badges.forEach(badge => {
        if (badge) {
            badge.textContent = totalItems;
            badge.style.display = totalItems > 0 ? 'flex' : 'none';
        }
    });
}

function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    saveCart();
    updateCartBadge();
    renderCart();
    showNotification('Item removed from cart', 'info');
}

function updateQuantity(id, change) {
    const item = cart.find(item => item.id === id);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            removeFromCart(id);
        } else {
            saveCart();
            renderCart();
        }
    }
}

function renderCart() {
    const container = document.getElementById('cartItems');
    
    if (cart.length === 0) {
        container.innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-shopping-cart"></i>
                <h3>Your cart is empty</h3>
                <p>Add some products to get started!</p>
                <button class="hero-btn hero-btn-primary" onclick="showPage('shop')" style="margin-top: 20px;">
                    <span>Browse Products <i class="fas fa-arrow-right"></i></span>
                </button>
            </div>
        `;
        document.getElementById('subtotal').textContent = '৳0';
        document.getElementById('total').textContent = '৳0';
        return;
    }
    
    const hasImage = (image) => {
        return image && 
               image.trim() !== '' && 
               !image.includes('🏠') &&
               (image.startsWith('data:') || 
                image.startsWith('http') ||
                image.startsWith('blob:') ||
                image.startsWith('/media/') ||
                image.startsWith('/static/'));
    };
    
    container.innerHTML = cart.map(item => `
        <div class="cart-item">
            <div style="width: 100px; height: 100px; border-radius: 10px; overflow: hidden; background: var(--cream-light);">
                ${hasImage(item.image) 
                    ? `<img src="${item.image}" alt="${item.name}" class="cart-item-image" onerror="this.onerror=null; this.parentElement.innerHTML='<div style=\\'width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 3rem;\\'>🏠</div>';">` 
                    : `<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 3rem;">🏠</div>`
                }
            </div>
            <div class="cart-item-info">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-price">৳${item.price}</div>
                <div class="quantity-controls">
                    <button class="quantity-btn" onclick="updateQuantity(${item.id}, -1)">−</button>
                    <span style="font-weight: 600; min-width: 30px; text-align: center;">${item.quantity}</span>
                    <button class="quantity-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
                    <button class="remove-btn" onclick="removeFromCart(${item.id})">
                        <i class="fas fa-trash"></i> Remove
                    </button>
                </div>
            </div>
        </div>
    `).join('');
    
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    document.getElementById('subtotal').textContent = `৳${subtotal}`;
    document.getElementById('total').textContent = `৳${subtotal}`;
}

// ==================== CHECKOUT ====================
function selectLocation(location) {
    deliveryLocation = location;
    
    document.querySelectorAll('.location-option').forEach(opt => {
        opt.classList.remove('active');
    });
    
    event.target.closest('.location-option').classList.add('active');
    
    updateCheckoutSummary();
}

function updateCheckoutSummary() {
    const container = document.getElementById('checkoutItems');
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const deliveryCharge = deliveryLocation === 'dhaka' ? 60 : (deliveryLocation === 'outside' ? 120 : 0);
    
    if (container) {
        container.innerHTML = cart.map(item => `
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid var(--border-color);">
                <span>${item.name} × ${item.quantity}</span>
                <span>৳${item.price * item.quantity}</span>
            </div>
        `).join('');
    }
    
    document.getElementById('checkoutSubtotal').textContent = `৳${subtotal}`;
    document.getElementById('deliveryCharge').textContent = `৳${deliveryCharge}`;
    document.getElementById('checkoutTotal').textContent = `৳${subtotal + deliveryCharge}`;
}

function placeOrder() {
    const name = document.getElementById('fullName').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const email = document.getElementById('email').value.trim();
    const address = document.getElementById('address').value.trim();
    const notes = document.getElementById('notes').value.trim();
    
    // Validation
    if (!name || !phone || !address) {
        showNotification('অনুগ্রহ করে সব তথ্য পূরণ করুন', 'error');
        return;
    }
    
    if (!deliveryLocation) {
        showNotification('অনুগ্রহ করে ডেলিভারি লোকেশন নির্বাচন করুন', 'error');
        return;
    }
    
    if (cart.length === 0) {
        showNotification('আপনার কার্ট খালি', 'error');
        return;
    }
    
    // Show loading
    const btn = event.target;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    
    // Get CSRF token
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
    
    // Prepare order data
    const orderData = {
        full_name: name,
        phone: phone,
        email: email,
        address: address,
        delivery_location: deliveryLocation,
        notes: notes,
        cart_items: cart.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            weight: item.weight
        }))
    };
    
    // Submit order
    fetch('/api/orders/create/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
        },
        body: JSON.stringify(orderData)
    })
    .then(response => response.json())
    .then(data => {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-check-circle"></i> Place Order';
        
        if (data.success) {
            // Show modal
            showOrderConfirmationModal(data.order_id, phone);
            
            // Clear cart
            cart = [];
            saveCart();
            updateCartBadge();
            
            // Clear form
            document.getElementById('fullName').value = '';
            document.getElementById('phone').value = '';
            document.getElementById('email').value = '';
            document.getElementById('address').value = '';
            document.getElementById('notes').value = '';
            deliveryLocation = null;
            document.querySelectorAll('.location-option').forEach(opt => opt.classList.remove('active'));
        } else {
            showNotification('অর্ডার সফল হয়নি: ' + (data.error || 'Unknown error'), 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-check-circle"></i> Place Order';
        showNotification('অর্ডার করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।', 'error');
    });
}

function showOrderConfirmationModal(orderId, customerPhone) {
    const deliveryCharge = deliveryLocation === 'dhaka' ? 60 : 120;
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const total = subtotal + deliveryCharge;
    
    document.getElementById('modalOrderId').textContent = '#' + orderId;
    document.getElementById('modalOrderTotal').textContent = '৳' + total;
    document.getElementById('modalCustomerPhone').textContent = customerPhone;
    
    const modal = new bootstrap.Modal(document.getElementById('orderConfirmationModal'));
    modal.show();
}

// ==================== CART STORAGE ====================
function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function loadCart() {
    const saved = localStorage.getItem('cart');
    if (saved) {
        cart = JSON.parse(saved);
        updateCartBadge();
    }
}

// ==================== PAGE NAVIGATION ====================
function showPage(pageName) {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    
    switch(pageName) {
        case 'home':
            document.getElementById('homePage').classList.add('active');
            break;
        case 'shop':
            document.getElementById('shopPage').classList.add('active');
            break;
        case 'product':
            document.getElementById('productPage').classList.add('active');
            break;
        case 'cart':
            document.getElementById('cartPage').classList.add('active');
            renderCart();
            break;
        case 'checkout':
            document.getElementById('checkoutPage').classList.add('active');
            updateCheckoutSummary();
            break;
    }
    
    window.scrollTo({top: 0, behavior: 'smooth'});
}

// ==================== NOTIFICATION SYSTEM ====================
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    
    const colors = {
        success: 'var(--success-green)',
        error: 'var(--accent-coral)',
        info: 'var(--accent-gold)'
    };
    
    const icons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        info: 'fas fa-info-circle'
    };
    
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${colors[type] || colors.success};
        color: white;
        padding: 16px 25px;
        border-radius: 12px;
        box-shadow: 0 8px 25px rgba(0,0,0,0.3);
        z-index: 9999;
        font-weight: 600;
        font-size: 1rem;
        animation: slideInRight 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        display: flex;
        align-items: center;
        gap: 10px;
        max-width: 350px;
    `;
    
    notification.innerHTML = `<i class="${icons[type] || icons.success}"></i> ${message}`;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
        setTimeout(() => notification.remove(), 400);
    }, 3000);
}

// Add notification animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

function renderProductImages(product) {
    const mainImg = document.getElementById('mainProductImage');
    const thumbs = document.getElementById('thumbnailImages');

    if (!mainImg || !thumbs) return;

    thumbs.innerHTML = '';

    // main image set
    mainImg.src = product.images && product.images.length
        ? product.images[0]
        : product.image;

    // thumbnails
    if (product.images && product.images.length) {
        product.images.forEach((img, index) => {
            const thumb = document.createElement('img');
            thumb.src = img;

            if (index === 0) thumb.classList.add('active');

            thumb.onclick = () => {
                mainImg.src = img;
                document.querySelectorAll('#thumbnailImages img')
                    .forEach(i => i.classList.remove('active'));
                thumb.classList.add('active');
            };

            thumbs.appendChild(thumb);
        });
    }
}

// ==================== LANGUAGE TRANSLATION ====================
const translations = {
    en: {
        // Navbar
        siteName: 'E-Craft Shop',
        navHome: 'Home',
        navShop: 'Shop',
        navCart: 'Cart',
        
        // Sidebar
        sidebarMenu: 'Menu',
        
        // Footer
        footerAboutTitle: 'About E-Craft Shop',
        footerAboutText: 'Reliable source of premium curtains and home decor for your home. With honesty and quality products, we bring comfort and beauty to your home.',
        footerQuickLinks: 'Quick Links',
        footerCustomerService: 'Customer Service',
        footerContactUs: 'Contact Us',
        footerAbout: 'About Us',
        footerContact: 'Contact',
        footerShipping: 'Shipping Policy',
        footerReturn: 'Return Policy',
        footerTerms: 'Terms & Conditions',
        footerPrivacy: 'Privacy Policy',
        footerRights: 'All rights reserved.',
        footerDesigned: 'Designed with',
        footerBy: 'by NEXTweb Bangladesh',
        locationDhaka: 'Dhaka, Bangladesh',
        
        // Hero Section
        heroBadge: '✦ PREMIUM QUALITY SINCE 2020 ✦',
        heroTitle: 'Transform Your',
        heroTitleSpan: 'Space',
        heroSubtitle: 'Discover premium curtains and home decor that reflect your style',
        heroTagline: 'Providing quality products is our responsibility, InshaAllah we deliver. Whether you choose good products or not is your decision.',
        heroBtnCategories: 'Categories',
        heroBtnShop: 'Shop Now',
        
        // Category Section
        categoryTitle: 'Browse by Category',
        
        // Business Info
        businessInfoTitle: 'E-Craft Shop',
        businessInfoText: 'Providing quality products is our responsibility, InshaAllah we deliver with honesty. Whether you choose to purchase good products or not is the customer\'s decision.',
        addressLabel: 'Address',
        phoneLabel: 'Phone',
        emailLabel: 'Email',
        instagramLabel: 'Instagram',
        
        // Shop Page
        allProducts: 'All Products',
        
        // Product Details
        specifications: 'Specifications:',
        addToCart: 'Add to Cart',
        
        // Cart Page
        shoppingCart: 'Shopping Cart',
        orderSummary: 'Order Summary',
        subtotal: 'Subtotal:',
        total: 'Total:',
        proceedCheckout: 'Proceed to Checkout',
        emptyCart: 'Your cart is empty',
        remove: 'Remove',
        
        // Checkout Page
        checkout: 'Checkout',
        shippingInfo: 'Shipping Information',
        fullName: 'Full Name',
        phoneNumber: 'Phone Number',
        email: 'Email',
        deliveryLocation: 'Delivery Location',
        insideDhaka: 'Inside Dhaka',
        outsideDhaka: 'Outside Dhaka',
        delivery: 'Delivery:',
        fullAddress: 'Full Address',
        orderNotes: 'Order Notes (Optional)',
        deliveryCharge: 'Delivery Charge:',
        placeOrder: 'Place Order',
        
        // Order Confirmation
        orderSuccess: 'Order Successful',
        thankYou: 'Thank you for your order!',
        orderCompleted: 'Your order has been successfully completed.',
        orderId: 'Order ID:',
        totalAmount: 'Total Amount:',
        contactSoon: 'We will contact you soon at',
        okay: 'Okay',
        
        // Notifications
        addedToCart: 'Added to cart!',
        cartEmpty: 'Your cart is empty',
        orderPlaced: 'Order placed successfully!',
        orderFailed: 'Order failed',
        pleaseTryAgain: 'Please try again',
    },
    bn: {
        // Navbar
        siteName: 'E-Craft Shop',
        navHome: 'হোম',
        navShop: 'শপ',
        navCart: 'কার্ট',
        
        // Sidebar
        sidebarMenu: 'মেনু',
        
        // Footer
        footerAboutTitle: 'E-Craft Shop সম্পর্কে',
        footerAboutText: 'আপনার ঘরের জন্য প্রিমিয়াম মানের পর্দা ও হোম ডেকোরের নির্ভরযোগ্য উৎস। সততা এবং মানসম্মত পণ্য দিয়ে আমরা আপনার ঘরে নিয়ে আসি কমফোর্ট ও সৌন্দর্য।',
        footerQuickLinks: 'দ্রুত লিংক',
        footerCustomerService: 'কাস্টমার সার্ভিস',
        footerContactUs: 'যোগাযোগ করুন',
        footerAbout: 'আমাদের সম্পর্কে',
        footerContact: 'যোগাযোগ',
        footerShipping: 'শিপিং পলিসি',
        footerReturn: 'রিটার্ন পলিসি',
        footerTerms: 'শর্তাবলী',
        footerPrivacy: 'প্রাইভেসি পলিসি',
        footerRights: 'সর্বস্বত্ব সংরক্ষিত।',
        footerDesigned: 'ডিজাইন করেছে',
        footerBy: 'NEXTweb Bangladesh',
        locationDhaka: 'ঢাকা, বাংলাদেশ',
        
        // Hero Section
        heroBadge: '✦ ২০২০ থেকে প্রিমিয়াম মান ✦',
        heroTitle: 'আপনার',
        heroTitleSpan: 'জায়গা রূপান্তরিত করুন',
        heroSubtitle: 'আপনার স্টাইল প্রতিফলিত করে এমন প্রিমিয়াম পর্দা এবং হোম ডেকোর আবিষ্কার করুন',
        heroTagline: 'আপনাকে ভালো প্রোডাক্ট দেয়া আমাদের দায়িত্ব, ইনশাআল্লাহ আমরা দিচ্ছি। আপনি ভালো প্রোডাক্ট নিবেন কি নিবেন না, এই দায়িত্ব আপনার।',
        heroBtnCategories: 'ক্যাটাগরি',
        heroBtnShop: 'এখনই কিনুন',
        
        // Category Section
        categoryTitle: 'ক্যাটাগরি অনুসারে ব্রাউজ করুন',
        
        // Business Info
        businessInfoTitle: 'E-Craft Shop',
        businessInfoText: 'আপনাকে ভালো প্রোডাক্ট দেয়া আমাদের দায়িত্ব, ইনশাআল্লাহ আমরা সততার সাথে দিচ্ছি। আপনি ভালো প্রোডাক্ট কিনবেন কি কিনবেন না সেটা গ্রাহকের সিদ্ধান্ত।',
        addressLabel: 'ঠিকানা',
        phoneLabel: 'ফোন',
        emailLabel: 'ইমেইল',
        instagramLabel: 'ইনস্টাগ্রাম',
        
        // Shop Page
        allProducts: 'সমস্ত পণ্য',
        
        // Product Details
        specifications: 'বিশেষ উল্লেখ:',
        addToCart: 'কার্টে যোগ করুন',
        
        // Cart Page
        shoppingCart: 'শপিং কার্ট',
        orderSummary: 'অর্ডার সারাংশ',
        subtotal: 'সাবটোটাল:',
        total: 'মোট:',
        proceedCheckout: 'চেকআউট করুন',
        emptyCart: 'আপনার কার্ট খালি',
        remove: 'সরান',
        
        // Checkout Page
        checkout: 'চেকআউট',
        shippingInfo: 'ডেলিভারি তথ্য',
        fullName: 'সম্পূর্ণ নাম',
        phoneNumber: 'ফোন নম্বর',
        email: 'ইমেইল',
        deliveryLocation: 'ডেলিভারি লোকেশন',
        insideDhaka: 'ঢাকার ভিতরে',
        outsideDhaka: 'ঢাকার বাইরে',
        delivery: 'ডেলিভারি:',
        fullAddress: 'সম্পূর্ণ ঠিকানা',
        orderNotes: 'অর্ডার নোট (ঐচ্ছিক)',
        deliveryCharge: 'ডেলিভারি চার্জ:',
        placeOrder: 'অর্ডার করুন',
        
        // Order Confirmation
        orderSuccess: 'অর্ডার সফল হয়েছে',
        thankYou: 'আপনার অর্ডারের জন্য ধন্যবাদ!',
        orderCompleted: 'আপনার অর্ডার সফলভাবে সম্পন্ন হয়েছে।',
        orderId: 'অর্ডার আইডি:',
        totalAmount: 'মোট টাকা:',
        contactSoon: 'আমরা শীঘ্রই আপনার সাথে যোগাযোগ করব',
        okay: 'ঠিক আছে',
        
        // Notifications
        addedToCart: 'কার্টে যোগ করা হয়েছে!',
        cartEmpty: 'আপনার কার্ট খালি',
        orderPlaced: 'অর্ডার সফলভাবে স্থাপন করা হয়েছে!',
        orderFailed: 'অর্ডার ব্যর্থ হয়েছে',
        pleaseTryAgain: 'আবার চেষ্টা করুন',
    }
};

// Get current language from localStorage or default to Bengali
let currentLanguage = localStorage.getItem('siteLanguage') || 'bn';

// Initialize language on page load
function initLanguage() {
    updateLanguageDisplay();
    translatePage();
}

// Toggle between languages
function toggleLanguage() {
    currentLanguage = currentLanguage === 'bn' ? 'en' : 'bn';
    localStorage.setItem('siteLanguage', currentLanguage);
    updateLanguageDisplay();
    translatePage();
    showNotification(
        currentLanguage === 'bn' ? 'ভাষা পরিবর্তন করা হয়েছে' : 'Language changed',
        'success'
    );
}

// Update the language toggle button text
function updateLanguageDisplay() {
    const langText = document.getElementById('langText');
    const langTextMobile = document.getElementById('langTextMobile');
    
    if (langText) {
        langText.textContent = currentLanguage === 'bn' ? 'EN' : 'BN';
    }
    if (langTextMobile) {
        langTextMobile.textContent = currentLanguage === 'bn' ? 'EN' : 'BN';
    }
}

// Translate all elements with data-translate attribute
function translatePage() {
    const elements = document.querySelectorAll('[data-translate]');
    
    elements.forEach(element => {
        const key = element.getAttribute('data-translate');
        if (translations[currentLanguage] && translations[currentLanguage][key]) {
            // Check if it's an input placeholder
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                element.placeholder = translations[currentLanguage][key];
            } else {
                element.textContent = translations[currentLanguage][key];
            }
        }
    });
    
    // Update HTML lang attribute
    document.documentElement.lang = currentLanguage;
}

// Initialize language when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Wait a bit for other initializations
    setTimeout(() => {
        initLanguage();
    }, 100);
});