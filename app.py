import sqlite3
import os
from flask import Flask, request, render_template

app = Flask(__name__)

# --- Configuration & Database Logic ---

DB_PATH = 'database.db'

class DatabaseManager:
    """Manages database connections and initialization."""
    
    @staticmethod
    def get_connection():
        """Returns a new connection to the SQLite database."""
        return sqlite3.connect(DB_PATH)

    @classmethod
    def initialize(cls):
        """Initializes the database schema and seed data."""
        with cls.get_connection() as conn:
            cursor = conn.cursor()
            # User table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY, 
                    username TEXT, 
                    password TEXT, 
                    role TEXT
                )
            ''')
            # Seed users
            cursor.execute('INSERT OR IGNORE INTO users VALUES (1, "admin", "admin123", "administrator")')
            cursor.execute('INSERT OR IGNORE INTO users VALUES (2, "user", "user123", "customer")')
            
            # Products table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS products (
                    id INTEGER PRIMARY KEY, 
                    name TEXT, 
                    description TEXT
                )
            ''')
            # Seed products
            cursor.execute('INSERT OR IGNORE INTO products VALUES (1, "Laptop", "High-performance laptop for professionals")')
            cursor.execute('INSERT OR IGNORE INTO products VALUES (2, "Phone", "Latest smartphone with AI features")')
            conn.commit()

# Initialize DB on startup
DatabaseManager.initialize()


# --- Route Handlers ---

@app.route('/')
def home():
    """Renders the main dashboard."""
    return render_template('index.html')


@app.route('/search')
def search_handler():
    """
    Handles user searches.
    VULNERABILITY: Reflected XSS. 
    The 'q' parameter is rendered using | safe in the template without sanitization.
    """
    query = request.args.get('q', '')
    return render_template('index.html', query=query)


@app.route('/product')
def product_details():
    """
    Retrieves product details by ID.
    VULNERABILITY: SQL Injection.
    Input is concatenated directly into the query string.
    """
    product_id = request.args.get('id', '1')
    
    conn = DatabaseManager.get_connection()
    cursor = conn.cursor()
    
    # INTENTIONAL VULNERABILITY: Concatenating input directly
    sql_query = f"SELECT name, description FROM products WHERE id = {product_id}"
    
    try:
        cursor.execute(sql_query)
        product = cursor.fetchone()
        if product:
            return render_template('index.html', product_name=product[0], product_desc=product[1])
        return "Product not found", 404
    except sqlite3.Error as e:
        return f"Database Error: {str(e)}", 500
    finally:
        conn.close()


@app.route('/login', methods=['POST'])
def login_handler():
    """
    Authenticates users.
    VULNERABILITY: SQL Injection.
    Allows for authentication bypass using ' OR '1'='1'
    """
    username = request.form.get('username')
    password = request.form.get('password')
    
    conn = DatabaseManager.get_connection()
    cursor = conn.cursor()
    
    # INTENTIONAL VULNERABILITY: String interpolation for credentials
    sql_query = f"SELECT username, role FROM users WHERE username = '{username}' AND password = '{password}'"
    
    cursor.execute(sql_query)
    user = cursor.fetchone()
    conn.close()
    
    if user:
        return f"Authentication Successful! Welcome, {user[0]} (Role: {user[1]})"
    return "Authentication Failed", 401


if __name__ == '__main__':
    # Running on 0.0.0.0 to allow container/external access
    app.run(host='0.0.0.0', port=5000)
