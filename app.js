// ============== تهيئة Firebase ==============
const firebaseConfig = {
    apiKey: "AIzaSyC7z9hhq51EhsdsWfAQmFEYNgCeYqkiAQ8",
    authDomain: "website-23082.firebaseapp.com",
    databaseURL: "https://website-23082-default-rtdb.firebaseio.com",
    projectId: "website-23082",
    storageBucket: "website-23082.appspot.com",
    messagingSenderId: "650852775693",
    appId: "1:650852775693:web:22a7acd661478d10a1a244"
};

// التحقق من بيانات Firebase
if (!firebaseConfig.apiKey || !firebaseConfig.databaseURL) {
    console.error("Firebase configuration is incomplete!");
    alert("خطأ في تهيئة Firebase. يرجى التحقق من بيانات الدخول.");
}

// تهيئة Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const database = firebase.database();
const storage = firebase.storage();

// ============== عناصر الواجهة ==============
// عناصر الصفحة الرئيسية
const productsContainer = document.getElementById('products-container');
const homePage = document.getElementById('home-page');

// عناصر صفحة المنتج
const productDetailPage = document.getElementById('product-detail-page');
const backToProducts = document.getElementById('back-to-products');

// عناصر صفحة المستخدم
const userPage = document.getElementById('user-page');
const userProductsContainer = document.getElementById('user-products-container');

// عناصر إضافة المنتج
const addProductPage = document.getElementById('add-product-page');
const addProductForm = document.getElementById('add-product-form');
const addProductAlert = document.getElementById('add-product-alert');
const imagePreview = document.getElementById('image-preview');
const productImageInput = document.getElementById('product-image');
const submitProductBtn = document.getElementById('submit-product-btn');

// عناصر التنقل
const navHome = document.getElementById('nav-home');
const navAdd = document.getElementById('nav-add');
const navUser = document.getElementById('nav-user');

// حالة الاتصال
const connectionStatus = document.getElementById('connection-status');

// ============== حالات التطبيق ==============
let currentUser = null;
let selectedProduct = null;

// ============== تهيئة التطبيق ==============
window.addEventListener('load', function() {
    // التحقق من اتصال الإنترنت
    checkInternetConnection();
    
    // تحميل المنتجات
    loadProducts();
    
    // تهيئة نظام المصادقة
    initAuth();
    
    // إعداد مستمعات الأحداث
    setupEventListeners();
    
    // مراقبة تغيرات الاتصال
    monitorConnection();
});

// ============== إدارة الاتصال ==============
function checkInternetConnection() {
    if (!navigator.onLine) {
        showConnectionError();
    }
}

function monitorConnection() {
    window.addEventListener('online', () => {
        connectionStatus.style.display = 'none';
        loadProducts();
    });
    
    window.addEventListener('offline', showConnectionError);
}

function showConnectionError() {
    connectionStatus.style.display = 'block';
    connectionStatus.innerHTML = '<i class="fas fa-wifi"></i> لا يوجد اتصال بالإنترنت';
    connectionStatus.className = 'connection-status alert-warning';
}

// ============== مستمعات الأحداث ==============
function setupEventListeners() {
    // التنقل
    navHome.addEventListener('click', showHomePage);
    navAdd.addEventListener('click', showAddProductPage);
    navUser.addEventListener('click', showUserPage);
    backToProducts.addEventListener('click', showHomePage);
    
    // إضافة منتج
    addProductForm.addEventListener('submit', addProduct);
    productImageInput.addEventListener('change', handleImageUpload);
    
    // الصور
    imagePreview.addEventListener('click', () => {
        productImageInput.click();
    });
}

// ============== نظام المصادقة ==============
function initAuth() {
    auth.onAuthStateChanged((user) => {
        currentUser = user;
        
        if (user) {
            // تحديث معلومات المستخدم
            document.getElementById('user-display-name').textContent = user.displayName || user.email.split('@')[0];
            document.getElementById('user-email').textContent = user.email;
            
            // تحميل منتجات المستخدم
            loadUserProducts();
        }
    });
}

// ============== إدارة المنتجات ==============
function loadProducts() {
    if (!navigator.onLine) {
        showConnectionError();
        return;
    }
    
    const productsRef = database.ref('products');
    productsRef.on('value', (snapshot) => {
        productsContainer.innerHTML = '';
        
        if (!snapshot.exists()) {
            productsContainer.innerHTML = '<div class="alert alert-info">لا توجد منتجات متاحة حالياً</div>';
            return;
        }
        
        snapshot.forEach((childSnapshot) => {
            const product = childSnapshot.val();
            product.id = childSnapshot.key;
            
            const productCard = createProductCard(product);
            productsContainer.appendChild(productCard);
        });
    });
}

function loadUserProducts() {
    if (!currentUser) return;
    
    if (!navigator.onLine) {
        showConnectionError();
        return;
    }
    
    const userProductsRef = database.ref('products').orderByChild('userId').equalTo(currentUser.uid);
    userProductsRef.on('value', (snapshot) => {
        userProductsContainer.innerHTML = '';
        
        if (!snapshot.exists()) {
            userProductsContainer.innerHTML = '<div class="alert alert-info">لا توجد منتجات مضافة بعد</div>';
            return;
        }
        
        snapshot.forEach((childSnapshot) => {
            const product = childSnapshot.val();
            product.id = childSnapshot.key;
            
            const productCard = createProductCard(product, true);
            userProductsContainer.appendChild(productCard);
        });
    });
}

function createProductCard(product, isUserProduct = false) {
    const productCard = document.createElement('div');
    productCard.className = 'product-card';
    
    // الصورة الافتراضية إذا لم تكن هناك صورة
    const imageUrl = product.imageUrl || 'https://via.placeholder.com/300?text=بدون+صورة';
    
    productCard.innerHTML = `
        <div class="product-image">
            ${Math.random() > 0.7 ? '<div class="product-badge hot">الأكثر مبيعاً</div>' : ''}
            <img src="${imageUrl}" alt="${product.name}">
        </div>
        <div class="product-info">
            <h3 class="product-title">${product.name}</h3>
            <div class="product-price">${product.price} ريال</div>
            <div class="product-location">
                <i class="fas fa-map-marker-alt"></i>
                ${product.location}
            </div>
            <div class="product-actions">
                <button class="btn btn-primary" data-id="${product.id}">تفاصيل</button>
            </div>
        </div>
    `;
    
    // إضافة حدث لعرض التفاصيل
    const detailsBtn = productCard.querySelector('button');
    detailsBtn.addEventListener('click', () => showProductDetails(product));
    
    return productCard;
}

function showProductDetails(product) {
    selectedProduct = product;
    
    document.getElementById('detail-title').textContent = product.name;
    document.getElementById('detail-price').textContent = product.price + ' ريال';
    document.getElementById('detail-description').textContent = product.description;
    document.getElementById('seller-name').textContent = product.sellerName || 'مستخدم';
    document.getElementById('seller-location').textContent = product.location;
    
    const detailImage = document.getElementById('detail-image');
    detailImage.src = product.imageUrl || 'https://via.placeholder.com/600?text=بدون+صورة';
    detailImage.alt = product.name;
    
    homePage.style.display = 'none';
    productDetailPage.style.display = 'block';
}

// ============== التنقل بين الصفحات ==============
function showHomePage(e) {
    if (e) e.preventDefault();
    
    homePage.style.display = 'block';
    productDetailPage.style.display = 'none';
    userPage.style.display = 'none';
    addProductPage.style.display = 'none';
}

function showUserPage(e) {
    if (e) e.preventDefault();
    
    if (!currentUser) {
        // عرض نموذج المصادقة
        document.getElementById('auth-modal').style.display = 'flex';
        return;
    }
    
    homePage.style.display = 'none';
    productDetailPage.style.display = 'none';
    userPage.style.display = 'block';
    addProductPage.style.display = 'none';
}

function showAddProductPage(e) {
    if (e) e.preventDefault();
    
    if (!currentUser) {
        // عرض نموذج المصادقة
        document.getElementById('auth-modal').style.display = 'flex';
        return;
    }
    
    homePage.style.display = 'none';
    productDetailPage.style.display = 'none';
    userPage.style.display = 'none';
    addProductPage.style.display = 'block';
}

// ============== إضافة منتج جديد ==============
function addProduct(e) {
    e.preventDefault();
    
    if (!currentUser) {
        document.getElementById('auth-modal').style.display = 'flex';
        return;
    }
    
    if (!navigator.onLine) {
        showConnectionError();
        return;
    }
    
    const name = document.getElementById('product-name').value;
    const price = document.getElementById('product-price').value;
    const description = document.getElementById('product-description').value;
    const category = document.getElementById('product-category').value;
    const location = document.getElementById('product-location').value;
    const imageFile = productImageInput.files[0];
    
    if (!name || !price || !description || !category || !location) {
        showAddProductAlert('يرجى ملء جميع الحقول المطلوبة', 'error');
        return;
    }
    
    // تعطيل زر الإضافة أثناء المعالجة
    submitProductBtn.disabled = true;
    submitProductBtn.innerHTML = '<i class="fas fa-spinner spinner"></i> جاري الإضافة...';
    
    // إذا كان هناك صورة، نقوم برفعها أولاً
    if (imageFile) {
        uploadImageAndAddProduct(name, price, description, category, location, imageFile);
    } else {
        // إضافة المنتج بدون صورة
        addProductToDatabase(name, price, description, category, location);
    }
}

function uploadImageAndAddProduct(name, price, description, category, location, imageFile) {
    // رفع الصورة إلى Firebase Storage
    const storageRef = storage.ref();
    const imageRef = storageRef.child('products/' + Date.now() + '_' + imageFile.name);
    
    imageRef.put(imageFile).then((snapshot) => {
        return snapshot.ref.getDownloadURL();
    }).then((downloadURL) => {
        // إضافة المنتج مع رابط الصورة
        addProductToDatabase(name, price, description, category, location, downloadURL);
    }).catch((error) => {
        console.error("Error uploading image: ", error);
        showAddProductAlert('خطأ في رفع الصورة: ' + error.message, 'error');
        resetAddProductButton();
    });
}

function addProductToDatabase(name, price, description, category, location, imageUrl = null) {
    const productsRef = database.ref('products');
    const newProductRef = productsRef.push();
    
    newProductRef.set({
        name: name,
        price: price,
        description: description,
        category: category,
        location: location,
        imageUrl: imageUrl,
        userId: currentUser.uid,
        sellerName: currentUser.displayName || currentUser.email.split('@')[0],
        createdAt: new Date().toISOString()
    }).then(() => {
        showAddProductAlert('تمت إضافة المنتج بنجاح!', 'success');
        addProductForm.reset();
        imagePreview.innerHTML = `
            <div class="placeholder">
                <i class="fas fa-cloud-upload-alt"></i>
                <p>اسحب الصورة هنا أو انقر للتحميل</p>
            </div>
        `;
        
        // إعادة تحميل المنتجات بعد الإضافة
        loadProducts();
        loadUserProducts();
    }).catch((error) => {
        console.error("Error adding product: ", error);
        showAddProductAlert('خطأ في إضافة المنتج: ' + error.message, 'error');
    }).finally(() => {
        resetAddProductButton();
    });
}

function resetAddProductButton() {
    submitProductBtn.disabled = false;
    submitProductBtn.innerHTML = '<i class="fas fa-plus"></i> إضافة المنتج';
}

function handleImageUpload() {
    const file = productImageInput.files[0];
    if (!file) return;
    
    // التحقق من حجم الصورة (أقل من 2MB)
    if (file.size > 2 * 1024 * 1024) {
        showAddProductAlert('حجم الصورة كبير جداً. الحد الأقصى 2MB', 'error');
        productImageInput.value = '';
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        imagePreview.innerHTML = `<img src="${e.target.result}" alt="معاينة الصورة">`;
    };
    reader.readAsDataURL(file);
}

// ============== وظائف مساعدة ==============
function showAddProductAlert(message, type) {
    addProductAlert.textContent = message;
    addProductAlert.className = `alert alert-${type}`;
    addProductAlert.style.display = 'block';
    
    // إخفاء التنبيه بعد 3 ثواني
    setTimeout(() => {
        addProductAlert.style.display = 'none';
    }, 3000);
}

// تهيئة واجهة المستخدم
document.querySelectorAll('.category').forEach(category => {
    category.addEventListener('click', () => {
        document.querySelectorAll('.category').forEach(c => c.classList.remove('active'));
        category.classList.add('active');
    });
});

// إضافة تأثيرات للصور
document.querySelectorAll('.product-card').forEach(card => {
    card.addEventListener('mouseenter', () => {
        card.querySelector('.product-image img').style.transform = 'scale(1.05)';
    });
    
    card.addEventListener('mouseleave', () => {
        card.querySelector('.product-image img').style.transform = 'scale(1)';
    });
});

// تحسين تجربة المستخدم
window.addEventListener('scroll', () => {
    const header = document.querySelector('.header');
    if (window.scrollY > 50) {
        header.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
    } else {
        header.style.boxShadow = 'none';
    }
});