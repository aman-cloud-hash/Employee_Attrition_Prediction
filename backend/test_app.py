import unittest
import json
from app import app

class TestHRPortalAPI(unittest.TestCase):
    
    def setUp(self):
        app.config['TESTING'] = True
        self.client = app.test_client()

    def test_api_status_route(self):
        """Test if the API status route loads successfully."""
        response = self.client.get('/')
        self.assertEqual(response.status_code, 200)
        res_data = json.loads(response.data.decode('utf-8'))
        self.assertEqual(res_data['status'], 'online')
        self.assertIn('API is running', res_data['message'])

    def test_cors_headers_on_response(self):
        """Test if CORS headers are present on API responses."""
        response = self.client.get('/')
        self.assertEqual(response.headers.get('Access-Control-Allow-Origin'), '*')
        self.assertIn('Content-Type', response.headers.get('Access-Control-Allow-Headers', ''))

    def test_cors_preflight_options_request(self):
        """Test if the OPTIONS preflight request returns 200 and has CORS headers."""
        response = self.client.options('/api/predict')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers.get('Access-Control-Allow-Origin'), '*')
        self.assertIn('POST', response.headers.get('Access-Control-Allow-Methods', ''))

    def test_predict_validation_missing_fields(self):
        """Test prediction validation with missing fields."""
        incomplete_data = {
            'Age': 35,
            'MonthlyIncome': 500
        }
        response = self.client.post('/api/predict', 
                                    data=json.dumps(incomplete_data), 
                                    content_type='application/json')
        self.assertEqual(response.status_code, 400)
        res_data = json.loads(response.data.decode('utf-8'))
        self.assertFalse(res_data['success'])
        self.assertTrue(any("is required" in err for err in res_data['errors']))

    def test_predict_validation_invalid_bounds(self):
        """Test validation with invalid numerical values."""
        invalid_data = {
            'Age': 15, # Under age limits (min 18)
            'MonthlyIncome': -500, # Negative income
            'DistanceFromHome': 0,
            'YearsAtCompany': -2, # Negative tenure
            'JobSatisfaction': 5, # Out of range 1-4
            'OverTime': 'Maybe',
            'JobRole': 'Astronaut',
            'MaritalStatus': 'Complicated'
        }
        response = self.client.post('/api/predict', 
                                    data=json.dumps(invalid_data), 
                                    content_type='application/json')
        self.assertEqual(response.status_code, 400)
        res_data = json.loads(response.data.decode('utf-8'))
        self.assertFalse(res_data['success'])
        self.assertTrue(len(res_data['errors']) > 0)

    def test_prediction_low_risk(self):
        """Test prediction for an employee with highly stable indicators (Low Risk expectation)."""
        low_risk_data = {
            'Age': 52,
            'MonthlyIncome': 160000, # In Rupees (maps to $16,000 after /10.0)
            'DistanceFromHome': 2,
            'YearsAtCompany': 12,
            'JobSatisfaction': 4,
            'OverTime': 'No',
            'JobRole': 'Manager',
            'MaritalStatus': 'Married'
        }
        response = self.client.post('/api/predict', 
                                    data=json.dumps(low_risk_data), 
                                    content_type='application/json')
        self.assertEqual(response.status_code, 200)
        res_data = json.loads(response.data.decode('utf-8'))
        self.assertTrue(res_data['success'])
        self.assertEqual(res_data['risk_level'], 'Low')
        self.assertIn('Low Risk', res_data['result'])
        self.assertLess(res_data['probability'], 50.0)

    def test_prediction_high_risk(self):
        """Test prediction for an employee with high-attrition indicators (High Risk expectation)."""
        high_risk_data = {
            'Age': 19,
            'MonthlyIncome': 15000, # In Rupees (maps to $1,500 after /10.0)
            'DistanceFromHome': 28,
            'YearsAtCompany': 1,
            'JobSatisfaction': 1,
            'OverTime': 'Yes',
            'JobRole': 'Sales Representative',
            'MaritalStatus': 'Single'
        }
        response = self.client.post('/api/predict', 
                                    data=json.dumps(high_risk_data), 
                                    content_type='application/json')
        self.assertEqual(response.status_code, 200)
        res_data = json.loads(response.data.decode('utf-8'))
        self.assertTrue(res_data['success'])
        self.assertEqual(res_data['risk_level'], 'High')
        self.assertIn('High Risk', res_data['result'])
        self.assertGreater(res_data['probability'], 50.0)

    def test_contact_post_success(self):
        """Test successful contact form post submission."""
        contact_data = {
            'name': 'Test Tester',
            'email': 'tester@company.com',
            'subject': 'Integration',
            'message': 'This is a test message of 10+ characters.'
        }
        response = self.client.post('/api/contact',
                                    data=json.dumps(contact_data),
                                    content_type='application/json')
        self.assertEqual(response.status_code, 200)
        res_data = json.loads(response.data.decode('utf-8'))
        self.assertTrue(res_data['success'])
        self.assertTrue(res_data['email_sent_triggered'])

    def test_contact_post_validation_error(self):
        """Test contact form post validation errors."""
        invalid_contact = {
            'name': '',
            'email': 'invalid-email',
            'subject': '',
            'message': 'Short'
        }
        response = self.client.post('/api/contact',
                                    data=json.dumps(invalid_contact),
                                    content_type='application/json')
        self.assertEqual(response.status_code, 400)
        res_data = json.loads(response.data.decode('utf-8'))
        self.assertFalse(res_data['success'])
        self.assertTrue(len(res_data['errors']) > 0)

if __name__ == '__main__':
    unittest.main()
