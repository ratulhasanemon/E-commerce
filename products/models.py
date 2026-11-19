from django.db import models
from django.utils.text import slugify  



class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True, blank=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name_plural = "Categories"
        ordering = ['name']
    
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)
    
    def __str__(self):
        return self.name
    
class Subcategory(models.Model):
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='subcategories')
    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=100, unique=True, blank=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name_plural = "Subcategories"
        ordering = ['name']
    
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.category.name} - {self.name}"

class Product(models.Model):
    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=200, unique=True, blank=True)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='products')
    subcategory = models.ForeignKey(Subcategory, on_delete=models.SET_NULL, related_name='products', null=True, blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.TextField()
    weight = models.DecimalField(max_digits=5, decimal_places=2, help_text="Weight in kg")
    stock = models.PositiveIntegerField(default=0)
    image = models.ImageField(upload_to='products/', blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)
    
    def __str__(self):
        return self.name


class ProductSpecification(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='specifications')
    key = models.CharField(max_length=100)
    value = models.CharField(max_length=200)
    
    def __str__(self):
        return f"{self.product.name} - {self.key}: {self.value}"


class HeroSlider(models.Model):
    """Model for managing hero section slider images"""
    title = models.CharField(max_length=200, help_text="Title for this slider image (for admin reference)")
    image = models.ImageField(upload_to='hero_slider/', help_text="Recommended size: 1200x800px")
    alt_text = models.CharField(max_length=200, blank=True, help_text="Alternative text for the image")
    order = models.PositiveIntegerField(default=0, help_text="Display order (lower numbers appear first)")
    is_active = models.BooleanField(default=True, help_text="Show this image in the slider")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['order', '-created_at']
        verbose_name = "Hero Slider Image"
        verbose_name_plural = "Hero Slider Images"
    
    def __str__(self):
        return f"{self.title} (Order: {self.order})"


class Order(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('processing', 'Processing'),
        ('shipped', 'Shipped'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
    ]
    
    LOCATION_CHOICES = [
        ('dhaka', 'Inside Dhaka'),
        ('outside', 'Outside Dhaka'),
    ]
    
    # Customer Information
    full_name = models.CharField(max_length=200)
    phone = models.CharField(max_length=20)
    email = models.EmailField(blank=True, null=True)
    address = models.TextField()
    delivery_location = models.CharField(max_length=10, choices=LOCATION_CHOICES)
    notes = models.TextField(blank=True)
    
    # Order Details
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    delivery_charge = models.DecimalField(max_digits=10, decimal_places=2)
    total = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def save(self, *args, **kwargs):
        is_new_order = self.pk is None

        super().save(*args, **kwargs)

        if is_new_order:
            from .telegram import send_telegram_message

            message = (
                f"🛒 <b>New Order Received</b>\n\n"
                f"🆔 Order ID: {self.id}\n"
                f"👤 Name: {self.full_name}\n"
                f"📞 Phone: {self.phone}\n"
                f"📧 Email: {self.email or 'N/A'}\n"
                f"📍 Address: {self.address}\n"
                f"🚚 Location: {self.delivery_location}\n\n"
                f"💰 Subtotal: ৳{self.subtotal}\n"
                f"🚚 Delivery: ৳{self.delivery_charge}\n"
                f"💵 Total: ৳{self.total}\n\n"
                f"⏰ Time: {self.created_at.strftime('%d %b %Y, %I:%M %p')}"
            )

            send_telegram_message(message)


    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Order #{self.id} - {self.full_name} - ৳{self.total}"


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    product_name = models.CharField(max_length=200)
    product_price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.PositiveIntegerField()
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    
    def __str__(self):
        return f"{self.product_name} x {self.quantity}"
    
    def save(self, *args, **kwargs):
        self.subtotal = self.product_price * self.quantity
        super().save(*args, **kwargs)
        
class ProductImage(models.Model):
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='images'
    )
    image = models.ImageField(upload_to='products/multiple/')
    alt_text = models.CharField(max_length=200, blank=True)

    def __str__(self):
        return f"{self.product.name} Image"
