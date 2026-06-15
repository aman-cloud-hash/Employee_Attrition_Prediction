import os
import pickle
import traceback
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from threading import Thread
import pandas as pd
import numpy as np
from flask import Flask, request, jsonify

app = Flask(__name__)

# Constants
MODEL_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'model')
MODEL_PATH = os.path.join(MODEL_DIR, 'model.pkl')
SCALER_PATH = os.path.join(MODEL_DIR, 'scaler.pkl')
COLUMNS_PATH = os.path.join(MODEL_DIR, 'columns.pkl')

# Global variables for models
model = None
scaler = None
cols_16 = None
scaler_features = None

def load_models():
    global model, scaler, cols_16, scaler_features
    try:
        if not os.path.exists(MODEL_PATH) or not os.path.exists(SCALER_PATH) or not os.path.exists(COLUMNS_PATH):
            raise FileNotFoundError("One or more model pickle files are missing in the 'model/' directory.")
            
        with open(MODEL_PATH, 'rb') as f:
            model = pickle.load(f)
            
        with open(SCALER_PATH, 'rb') as f:
            scaler = pickle.load(f)
            
        with open(COLUMNS_PATH, 'rb') as f:
            cols_16 = pickle.load(f)
            
        scaler_features = scaler.feature_names_in_
        print("Models loaded successfully.")
    except Exception as e:
        print(f"Error loading models: {e}")
        traceback.print_exc()

# Load models at startup
load_models()

# Global CORS Handlers
@app.before_request
def before_request():
    if request.method == 'OPTIONS':
        # Handlers CORS preflight OPTIONS requests
        response = app.make_default_options_response()
        return response

@app.after_request
def after_request(response):
    # Enable CORS for all origins, headers, and methods
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

@app.route('/')
def api_status():
    return jsonify({
        'status': 'online',
        'message': 'Employee Attrition Prediction API is running. Access the frontend via Vite dev server.'
    })

@app.route('/api/predict', methods=['POST'])
def predict():
    if not model or not scaler or cols_16 is None:
        return jsonify({
            'success': False,
            'message': 'Prediction engine is not loaded. Please contact the administrator.'
        }), 500
        
    try:
        if request.is_json:
            data = request.json
        else:
            data = request.form

        # 1. Validation
        required_fields = [
            'Age', 'MonthlyIncome', 'DistanceFromHome', 'YearsAtCompany',
            'JobSatisfaction', 'OverTime', 'JobRole', 'MaritalStatus'
        ]
        
        errors = []
        for field in required_fields:
            if field not in data or str(data[field]).strip() == '':
                errors.append(f"{field} is required.")
        
        if errors:
            return jsonify({'success': False, 'errors': errors}), 400
            
        # Parse and validate numerical values
        try:
            age = int(data['Age'])
            if age < 18 or age > 100:
                errors.append("Age must be between 18 and 100.")
        except ValueError:
            errors.append("Age must be a valid integer.")
            
        try:
            monthly_income = float(data['MonthlyIncome'])
            if monthly_income < 10000 or monthly_income > 1000000:
                errors.append("Monthly Income must be between ₹10,000 and ₹1,000,000.")
        except ValueError:
            errors.append("Monthly Income must be a valid number.")
            
        try:
            distance_from_home = float(data['DistanceFromHome'])
            if distance_from_home < 1 or distance_from_home > 100:
                errors.append("Distance from Home must be between 1 and 100 km.")
        except ValueError:
            errors.append("Distance from Home must be a valid number.")
            
        try:
            years_at_company = float(data['YearsAtCompany'])
            if years_at_company < 0:
                errors.append("Years at Company cannot be negative.")
            elif years_at_company > age - 18:
                errors.append(f"Years at Company cannot exceed productive working years ({max(0, age - 18)} years).")
        except ValueError:
            errors.append("Years at Company must be a valid number.")
            
        try:
            job_satisfaction = int(data['JobSatisfaction'])
            if job_satisfaction < 1 or job_satisfaction > 4:
                errors.append("Job Satisfaction must be between 1 and 4.")
        except ValueError:
            errors.append("Job Satisfaction must be an integer between 1 and 4.")
            
        # Validate Categoricals
        overtime = data['OverTime']
        if overtime not in ['Yes', 'No']:
            errors.append("OverTime must be either 'Yes' or 'No'.")
            
        job_role = data['JobRole']
        valid_job_roles = [
            'Human Resources', 'Laboratory Technician', 'Manager',
            'Manufacturing Director', 'Research Director', 'Research Scientist',
            'Sales Executive', 'Sales Representative', 'Healthcare Representative'
        ]
        if job_role not in valid_job_roles:
            errors.append("Invalid Job Role selected.")
            
        marital_status = data['MaritalStatus']
        if marital_status not in ['Single', 'Married', 'Divorced']:
            errors.append("Marital Status must be 'Single', 'Married', or 'Divorced'.")
            
        if errors:
            return jsonify({'success': False, 'errors': errors}), 400

        # 2. Convert user input into 16-column format
        vec_16 = {}
        vec_16['Age'] = float(age)
        # Convert INR to USD for the model (scale factor of 10.0 to map Indian average salaries to US training average)
        vec_16['MonthlyIncome'] = float(monthly_income) / 10.0
        # Convert Kilometers to Miles for the model (1 km = 0.621371 miles)
        vec_16['DistanceFromHome'] = float(distance_from_home) * 0.621371
        vec_16['YearsAtCompany'] = float(years_at_company)
        vec_16['JobSatisfaction'] = float(job_satisfaction)
        vec_16['OverTime_Yes'] = 1.0 if overtime == 'Yes' else 0.0
        
        # Job Roles one-hot (only the 8 model roles)
        roles = [
            'Human Resources', 'Laboratory Technician', 'Manager', 
            'Manufacturing Director', 'Research Director', 'Research Scientist', 
            'Sales Executive', 'Sales Representative'
        ]
        for r in roles:
            vec_16[f'JobRole_{r}'] = 1.0 if job_role == r else 0.0
            
        # Departments mapped from Job Role
        is_sales = 1.0 if job_role in ['Sales Executive', 'Sales Representative'] else 0.0
        is_rd = 1.0 if job_role in ['Laboratory Technician', 'Manager', 'Manufacturing Director', 'Research Director', 'Research Scientist', 'Healthcare Representative'] else 0.0
        vec_16['Department_Research & Development'] = is_rd
        vec_16['Department_Sales'] = is_sales

        # 3. Create full 47-column format expected by scaler
        full_vector = {feat: scaler.mean_[i] for i, feat in enumerate(scaler_features)}
        
        # Override the 16 model features in the 47-column vector
        for col, val in vec_16.items():
            if col in full_vector:
                full_vector[col] = val
                
        # Handle MaritalStatus which is in the 47-column scaler but not in 16-column vector
        full_vector['MaritalStatus_Married'] = 1.0 if marital_status == 'Married' else 0.0
        full_vector['MaritalStatus_Single'] = 1.0 if marital_status == 'Single' else 0.0

        # Convert to DataFrame
        df_input = pd.DataFrame([full_vector], columns=scaler_features)
        
        # Apply scaling
        X_scaled = scaler.transform(df_input)
        
        # Predict Attrition
        pred_class = int(model.predict(X_scaled)[0])
        pred_prob = float(model.predict_proba(X_scaled)[0][1])

        # Prediction output formatting
        if pred_class == 1:
            result = "High Risk: This employee may leave the company."
            risk_level = "High"
            message = (
                "The system has detected multiple risk indicators such as overtime workload, "
                "lower relative satisfaction, or compensation structure. We recommend arranging a stay interview, "
                "reviewing project assignments, and discussing career progression pathways with this employee."
            )
        else:
            result = "Low Risk: This employee is likely to stay in the company."
            risk_level = "Low"
            message = (
                "The system indicates stable indicators for this employee. General career development support "
                "and regular routine check-ins are sufficient to maintain current retention levels."
            )
            
        return jsonify({
            'success': True,
            'result': result,
            'risk_level': risk_level,
            'probability': round(pred_prob * 100, 2),
            'message': message,
            'inputs': {
                'Age': age,
                'MonthlyIncome': monthly_income,
                'DistanceFromHome': distance_from_home,
                'YearsAtCompany': years_at_company,
                'JobSatisfaction': job_satisfaction,
                'OverTime': overtime,
                'JobRole': job_role,
                'MaritalStatus': marital_status
            }
        })

    except Exception as e:
        print(f"Prediction error: {e}")
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': 'An internal error occurred during prediction. Please try again.'
        }), 500

def send_email_async(name, email, subject, message):
    import urllib.request
    import json
    
    # Render's Free Tier blocks SMTP ports (25, 465, 587) to prevent spam.
    # To bypass this restriction securely without raw SMTP, we route contact messages
    # through FormSubmit's public HTTP API. The destination email is kept private on the backend.
    target_email = 'amanrajbhar1999182921@gmail.com'
    url = f'https://formsubmit.co/ajax/{target_email}'
    
    payload = {
        'name': name,
        'email': email,
        'subject': f"[HR Attrition Portal] {subject}",
        'message': message,
        '_honey': '',  # Honeypot field for spam prevention
    }
    
    try:
        data = json.dumps(payload).encode('utf-8')
        req = urllib.request.Request(
            url, 
            data=data, 
            headers={
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': 'https://employee-attrition-prediction-nu.vercel.app/',
                'Origin': 'https://employee-attrition-prediction-nu.vercel.app'
            }
        )
        with urllib.request.urlopen(req, timeout=15) as response:
            res_body = response.read().decode('utf-8')
            print("FormSubmit HTTP API response:", res_body)
            print("Email request processed successfully via HTTP forwarder.")
    except Exception as e:
        print(f"Failed to send email via FormSubmit HTTP API: {e}")

@app.route('/api/contact', methods=['POST'])
def contact():
    try:
        if request.is_json:
            data = request.json
        else:
            data = request.form
            
        name = data.get('name', '').strip()
        email = data.get('email', '').strip()
        subject = data.get('subject', '').strip()
        message = data.get('message', '').strip()
        
        errors = []
        if not name:
            errors.append("Name is required.")
        if not email or '@' not in email:
            errors.append("Valid email is required.")
        if not subject:
            errors.append("Category is required.")
        if not message or len(message) < 10:
            errors.append("Message must be at least 10 characters long.")
            
        if errors:
            return jsonify({'success': False, 'errors': errors}), 400
            
        # Send email in a background thread to prevent blocking the HTTP response
        email_thread = Thread(target=send_email_async, args=(name, email, subject, message))
        email_thread.start()
        
        has_credentials = os.environ.get('SMTP_PASSWORD') is not None
        
        return jsonify({
            'success': True,
            'message': 'Your message has been processed.',
            'email_sent_triggered': True,
            'credentials_configured': has_credentials
        })
    except Exception as e:
        print(f"Contact submission error: {e}")
        return jsonify({
            'success': False,
            'message': 'An internal error occurred while processing your message.'
        }), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
