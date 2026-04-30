import sqlite3
import os
import requests
from flask import Flask, request, render_template, jsonify

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


@app.route('/repo-metrics', methods=['POST'])
def repo_metrics_handler():
    """
    Fetches real-time repository metrics and recent workflow runs from GitHub API.
    """
    data = request.json
    owner = data.get('owner')
    repo = data.get('repo')
    token = data.get('token')
    
    if not owner or not repo:
        return jsonify({"error": "Repository owner and name are required."}), 400
        
    headers = {"Accept": "application/vnd.github.v3+json"}
    if token:
        headers["Authorization"] = f"token {token}"
        
    try:
        # 1. Fetch Repo Data
        repo_url = f"https://api.github.com/repos/{owner}/{repo}"
        repo_response = requests.get(repo_url, headers=headers, timeout=10)
        
        if repo_response.status_code != 200:
            if repo_response.status_code == 404:
                return jsonify({"error": "Repository not found. Check the owner and name."}), 404
            elif repo_response.status_code == 403:
                return jsonify({"error": "API rate limit exceeded. Please use a GitHub token."}), 403
            return jsonify({"error": f"GitHub API error: {repo_response.status_code}"}), repo_response.status_code
            
        repo_data = repo_response.json()
        
        metrics = {
            "stars": repo_data.get("stargazers_count", 0),
            "forks": repo_data.get("forks_count", 0),
            "open_issues": repo_data.get("open_issues_count", 0),
            "language": repo_data.get("language", "N/A") or "N/A"
        }
        
        # 2. Fetch Recent Workflow Runs
        runs_url = f"https://api.github.com/repos/{owner}/{repo}/actions/runs?per_page=5"
        runs_response = requests.get(runs_url, headers=headers, timeout=10)
        
        recent_runs = []
        if runs_response.status_code == 200:
            runs_data = runs_response.json()
            for run in runs_data.get("workflow_runs", [])[:4]: # Keep top 4
                recent_runs.append({
                    "id": run.get("id"),
                    "name": run.get("name"),
                    "branch": run.get("head_branch"),
                    "status": run.get("status"),
                    "conclusion": run.get("conclusion"),
                    "updated_at": run.get("updated_at")
                })
                
        return jsonify({
            "metrics": metrics,
            "recent_runs": recent_runs
        })
        
    except requests.exceptions.RequestException as e:
        return jsonify({"error": f"Failed to connect to GitHub API: {str(e)}"}), 500


@app.route('/scan', methods=['POST'])
def scan_handler():
    """
    Performs a basic security scan on a target URL.
    Checks for:
    1. Reflected XSS (reflection of payload in response)
    2. SQL Injection (database error messages in response)
    """
    target_url = request.json.get('url')
    if not target_url:
        return jsonify({"error": "No URL provided"}), 400

    results = {
        "url": target_url,
        "xss": {"vulnerable": False, "details": "No reflection detected."},
        "sqli": {"vulnerable": False, "details": "No database errors detected."}
    }

    try:
        # --- Test for XSS ---
        xss_payload = "<script>alert('XSS')</script>"
        # Attempt to inject via query parameter 'q' or 'id'
        test_url_xss = f"{target_url}?q={xss_payload}"
        response_xss = requests.get(test_url_xss, timeout=5)
        
        if xss_payload in response_xss.text:
            results["xss"] = {
                "vulnerable": True,
                "details": f"Payload '{xss_payload}' was reflected in the response! This suggests a Reflected XSS vulnerability."
            }

        # --- Test for SQLi ---
        sqli_payload = "' OR '1'='1"
        test_url_sqli = f"{target_url}?id={sqli_payload}"
        response_sqli = requests.get(test_url_sqli, timeout=5)
        
        # Common SQL error strings
        sql_errors = ["sqlite3.Error", "SQL syntax", "mysql_fetch_array", "ORA-00933", "PostgreSQL query failed"]
        for error in sql_errors:
            if error.lower() in response_sqli.text.lower():
                results["sqli"] = {
                    "vulnerable": True,
                    "details": f"Database error detected: '{error}'. This suggests a SQL Injection vulnerability."
                }
                break

    except Exception as e:
        return jsonify({"error": f"Scan failed: {str(e)}"}), 500

    return jsonify(results)


if __name__ == '__main__':
    # Running on 0.0.0.0 to allow container/external access
    # Use environment variable to toggle debug mode (default: False for security)
    debug_mode = os.environ.get('FLASK_DEBUG', 'False').lower() == 'true'
    app.run(host='0.0.0.0', port=5000, debug=debug_mode)
