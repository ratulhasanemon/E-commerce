from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
import json
from decimal import Decimal
from .models import Category, Product, Order, OrderItem, HeroSlider


def home(request):
    categories = Category.objects.all()
    products = Product.objects.filter(is_active=True).select_related('category')
    
    context = {
        'categories': categories,
        'products': products,
    }
    return render(request, 'index.html', context)


def product_api(request):
    """API endpoint to return products as JSON"""
    
    products = Product.objects.filter(is_active=True)\
        .select_related('category', 'subcategory')\
        .prefetch_related('specifications', 'images')

    
    products_data = []
    for product in products:
        # Get specifications
        specs = [f"{spec.key}: {spec.value}" for spec in product.specifications.all()]
        
        products_data.append({
            'id': product.id,
            'name': product.name,
            'category': product.category.name,
            'subcategory': product.subcategory.name if product.subcategory else None,
            'price': float(product.price),
            'weight': float(product.weight),
            'image': product.image.url if product.image else '',
            'images': [img.image.url for img in product.images.all()],
            'desc': product.description,
            'specs': specs,
        })

    
    return JsonResponse({'products': products_data})


def hero_slider_api(request):
    """API endpoint to return hero slider images"""
    slider_images = HeroSlider.objects.filter(is_active=True).order_by('order', '-created_at')
    
    images_data = []
    for slider in slider_images:
        images_data.append({
            'id': slider.id,
            'title': slider.title,
            'image': slider.image.url if slider.image else '',
            'alt_text': slider.alt_text or slider.title,
        })
    
    return JsonResponse({'hero_images': images_data})


@csrf_exempt
@require_POST
def create_order(request):
    """API endpoint to create an order"""
    try:
        data = json.loads(request.body)
        
        # Extract customer info
        full_name = data.get('full_name')
        phone = data.get('phone')
        email = data.get('email', '')
        address = data.get('address')
        delivery_location = data.get('delivery_location')
        notes = data.get('notes', '')
        cart_items = data.get('cart_items', [])
        
        # Validate required fields
        if not all([full_name, phone, address, delivery_location, cart_items]):
            return JsonResponse({'success': False, 'error': 'Missing required fields'}, status=400)
        
        # Calculate totals
        subtotal = Decimal('0')
        total_weight = Decimal('0')
        
        for item in cart_items:
            subtotal += Decimal(str(item['price'])) * item['quantity']
            total_weight += Decimal(str(item['weight'])) * item['quantity']
        
        # Calculate delivery charge
        if delivery_location == 'dhaka':
            delivery_charge = Decimal('60')
            if total_weight > 5:
                delivery_charge += (total_weight - 5) * 10
        else:  # outside
            delivery_charge = Decimal('120')
            if total_weight > 5:
                delivery_charge += (total_weight - 5) * 20
        
        total = subtotal + delivery_charge
        
        # Create order
        order = Order.objects.create(
            full_name=full_name,
            phone=phone,
            email=email,
            address=address,
            delivery_location=delivery_location,
            notes=notes,
            subtotal=subtotal,
            delivery_charge=delivery_charge,
            total=total,
            status='pending'
        )
        
        # Create order items
        for item in cart_items:
            product = Product.objects.get(id=item['id'])
            OrderItem.objects.create(
                order=order,
                product=product,
                product_name=item['name'],
                product_price=Decimal(str(item['price'])),
                quantity=item['quantity']
            )
        
        return JsonResponse({
            'success': True,
            'order_id': order.id,
            'message': 'Order placed successfully!'
        })
        
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)
    
    
