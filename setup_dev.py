#!/usr/bin/env python3
"""
Development setup script for Expense Tracker application
"""

import os
import subprocess
import sys
from pathlib import Path

def run_command(command, cwd=None, shell=True):
    """Run a command and handle errors"""
    try:
        print(f"Running: {command}")
        result = subprocess.run(
            command, 
            shell=shell, 
            cwd=cwd, 
            capture_output=True, 
            text=True,
            check=True
        )
        if result.stdout:
            print(result.stdout)
        return True
    except subprocess.CalledProcessError as e:
        print(f"Error running command: {command}")
        print(f"Error: {e.stderr}")
        return False

def setup_backend():
    """Setup Django backend"""
    backend_dir = Path("backend")
    
    print("\n🔧 Setting up Django backend...")
    
    # Activate virtual environment and install dependencies
    if not run_command("pip install -r requirements.txt", cwd=backend_dir):
        return False
    
    # Run migrations
    if not run_command("python manage.py migrate", cwd=backend_dir):
        return False
    
    # Create superuser (optional)
    print("\n👤 Would you like to create a superuser? (y/n)")
    if input().lower() == 'y':
        run_command("python manage.py createsuperuser", cwd=backend_dir)
    
    # Load initial data
    print("\n📊 Loading initial data...")
    run_command("python manage.py loaddata initial_data.json", cwd=backend_dir)
    
    return True

def setup_frontend():
    """Setup React frontend"""
    frontend_dir = Path("frontend")
    
    print("\n⚛️  Setting up React frontend...")
    
    # Install dependencies
    if not run_command("npm install", cwd=frontend_dir):
        return False
    
    return True

def create_initial_data():
    """Create initial data fixtures"""
    backend_dir = Path("backend")
    
    print("\n📝 Creating initial data...")
    
    # Create initial currencies
    script = '''
import os
import django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from apps.core.models import Currency, Category
from decimal import Decimal

# Create currencies
currencies = [
    {"code": "USD", "name": "US Dollar", "symbol": "$", "exchange_rate_to_usd": Decimal("1.0")},
    {"code": "EUR", "name": "Euro", "symbol": "€", "exchange_rate_to_usd": Decimal("0.85")},
    {"code": "GBP", "name": "British Pound", "symbol": "£", "exchange_rate_to_usd": Decimal("0.75")},
    {"code": "INR", "name": "Indian Rupee", "symbol": "₹", "exchange_rate_to_usd": Decimal("75.0")},
]

for curr_data in currencies:
    Currency.objects.get_or_create(
        code=curr_data["code"],
        defaults=curr_data
    )

# Create categories
categories = [
    {"name": "Food & Dining", "icon": "restaurant", "color": "#FF6B6B", "is_default": True},
    {"name": "Transportation", "icon": "directions_car", "color": "#4ECDC4", "is_default": True},
    {"name": "Shopping", "icon": "shopping_cart", "color": "#45B7D1", "is_default": True},
    {"name": "Entertainment", "icon": "movie", "color": "#96CEB4", "is_default": True},
    {"name": "Bills & Utilities", "icon": "receipt", "color": "#FFEAA7", "is_default": True},
    {"name": "Healthcare", "icon": "local_hospital", "color": "#DDA0DD", "is_default": True},
    {"name": "Travel", "icon": "flight", "color": "#98D8C8", "is_default": True},
    {"name": "Other", "icon": "category", "color": "#F7DC6F", "is_default": True},
]

for cat_data in categories:
    Category.objects.get_or_create(
        name=cat_data["name"],
        defaults=cat_data
    )

print("Initial data created successfully!")
'''
    
    with open(backend_dir / "setup_initial_data.py", "w") as f:
        f.write(script)
    
    run_command("python setup_initial_data.py", cwd=backend_dir)
    os.remove(backend_dir / "setup_initial_data.py")

def main():
    """Main setup function"""
    print("🚀 Welcome to Expense Tracker Setup!")
    print("====================================")
    
    # Check if we're in the right directory
    if not Path("backend").exists() or not Path("frontend").exists():
        print("❌ Please run this script from the project root directory")
        sys.exit(1)
    
    # Setup backend
    if not setup_backend():
        print("❌ Backend setup failed")
        sys.exit(1)
    
    # Setup frontend  
    if not setup_frontend():
        print("❌ Frontend setup failed")
        sys.exit(1)
    
    # Create initial data
    create_initial_data()
    
    print("\n✅ Setup completed successfully!")
    print("\n🎉 Next steps:")
    print("1. Start the backend: cd backend && python manage.py runserver")
    print("2. Start the frontend: cd frontend && npm start")
    print("3. Start Celery worker: cd backend && celery -A config worker -l info")
    print("4. Visit http://localhost:3000 to use the application")

if __name__ == "__main__":
    main()
