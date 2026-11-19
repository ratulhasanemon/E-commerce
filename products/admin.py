from django.contrib import admin
from .models import Category, Product, ProductSpecification, Order, OrderItem, Subcategory, HeroSlider
from .models import ProductImage


class ProductSpecificationInline(admin.TabularInline):
    model = ProductSpecification
    extra = 3

class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 3


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'created_at']
    prepopulated_fields = {'slug': ('name',)}
    search_fields = ['name']

@admin.register(Subcategory)
class SubcategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'slug', 'created_at']
    list_filter = ['category']
    prepopulated_fields = {'slug': ('name',)}
    search_fields = ['name', 'category__name']

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'subcategory', 'price', 'stock', 'is_active', 'created_at']
    list_filter = ['category', 'is_active', 'created_at']
    search_fields = ['name', 'description']
    prepopulated_fields = {'slug': ('name',)}
    list_editable = ['price', 'stock', 'is_active']
    inlines = [ProductSpecificationInline, ProductImageInline]

    
    fieldsets = (
        ('Basic Information', {
         'fields': ('name', 'slug', 'category', 'subcategory', 'description')
        }),
        ('Pricing & Inventory', {
            'fields': ('price', 'weight', 'stock', 'is_active')
        }),
        ('Media', {
            'fields': ('image',)
        }),
    )


@admin.register(ProductSpecification)
class ProductSpecificationAdmin(admin.ModelAdmin):
    list_display = ['product', 'key', 'value']
    list_filter = ['product']


@admin.register(HeroSlider)
class HeroSliderAdmin(admin.ModelAdmin):
    list_display = ['title', 'order', 'is_active', 'image_preview', 'created_at']
    list_editable = ['order', 'is_active']
    list_filter = ['is_active', 'created_at']
    search_fields = ['title', 'alt_text']
    
    fieldsets = (
        ('Image Information', {
            'fields': ('title', 'alt_text', 'image')
        }),
        ('Display Settings', {
            'fields': ('order', 'is_active')
        }),
    )
    
    def image_preview(self, obj):
        if obj.image:
            return f'<img src="{obj.image.url}" style="max-width: 100px; max-height: 60px; border-radius: 5px;" />'
        return "No Image"
    image_preview.allow_tags = True
    image_preview.short_description = "Preview"

    
class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ['product_name', 'product_price', 'quantity', 'subtotal']
    can_delete = False


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['id', 'full_name', 'phone', 'delivery_location', 'total', 'status', 'created_at']
    list_filter = ['status', 'delivery_location', 'created_at']
    search_fields = ['full_name', 'phone', 'email', 'address']
    list_editable = ['status']
    readonly_fields = ['created_at', 'updated_at', 'subtotal', 'delivery_charge', 'total']
    inlines = [OrderItemInline]
    
    fieldsets = (
        ('Customer Information', {
            'fields': ('full_name', 'phone', 'email', 'address', 'delivery_location', 'notes')
        }),
        ('Order Details', {
            'fields': ('subtotal', 'delivery_charge', 'total', 'status')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )