/**
 * Comprehensive System Test Script
 * Smart India Hackathon 2024 - AI-Powered Accident Detection System
 */

const axios = require('axios');
const { io } = require('socket.io-client');

const BACKEND_URL = 'http://localhost:4001';
const HOSPITAL_DASHBOARD_URL = 'http://localhost:5177';
const DRIVER_DASHBOARD_URL = 'http://localhost:5180';

class SystemTester {
    constructor() {
        this.testResults = [];
        this.socket = null;
    }

    async runAllTests() {
        console.log('🚀 Starting Comprehensive System Tests...\n');
        
        try {
            // Test 1: Backend API Health
            await this.testBackendHealth();
            
            // Test 2: User Authentication
            await this.testAuthentication();
            
            // Test 3: Accident Reporting
            await this.testAccidentReporting();
            
            // Test 4: Real-time Communication
            await this.testWebSocketConnection();
            
            // Test 5: Dashboard Accessibility
            await this.testDashboardAccess();
            
            // Test 6: Emergency Response Flow
            await this.testEmergencyFlow();
            
            // Test 7: Data Persistence
            await this.testDataPersistence();
            
            this.printTestSummary();
            
        } catch (error) {
            console.error('❌ Test suite failed:', error.message);
        }
    }

    async testBackendHealth() {
        console.log('🔍 Testing Backend API Health...');
        
        try {
            const response = await axios.get(`${BACKEND_URL}/api/hospital-feed`);
            this.addTestResult('Backend Health Check', true, 'API is responding');
            console.log('✅ Backend API is healthy');
        } catch (error) {
            this.addTestResult('Backend Health Check', false, error.message);
            console.log('❌ Backend API health check failed');
        }
    }

    async testAuthentication() {
        console.log('🔍 Testing User Authentication...');
        
        try {
            // Test user registration
            const registerData = {
                userId: `test_user_${Date.now()}`,
                email: `test${Date.now()}@example.com`,
                name: 'Test User',
                phone: '+91-9876543210',
                userType: 'driver',
                emergencyContacts: [{
                    name: 'Emergency Contact',
                    phone: '+91-9876543211',
                    relationship: 'Family',
                    isPrimary: true
                }]
            };

            const registerResponse = await axios.post(`${BACKEND_URL}/api/auth/register`, registerData);
            this.addTestResult('User Registration', registerResponse.data.ok, 'User registered successfully');

            // Test user login
            const loginResponse = await axios.post(`${BACKEND_URL}/api/auth/login`, {
                userId: registerData.userId
            });
            this.addTestResult('User Login', loginResponse.data.ok, 'User login successful');

            console.log('✅ Authentication system working');
            return registerData.userId;
        } catch (error) {
            this.addTestResult('Authentication', false, error.message);
            console.log('❌ Authentication test failed');
            return null;
        }
    }

    async testAccidentReporting() {
        console.log('🔍 Testing Accident Reporting...');
        
        try {
            const accidentData = {
                userId: 'test_system_user',
                location: { lat: 12.9716, lng: 77.5946 },
                severityScore: 0.8,
                timestamp: new Date().toISOString()
            };

            const response = await axios.post(`${BACKEND_URL}/api/report-accident`, accidentData);
            this.addTestResult('Accident Reporting', response.data.ok, `Event ID: ${response.data.eventId}`);
            console.log('✅ Accident reporting working');
            return response.data.eventId;
        } catch (error) {
            this.addTestResult('Accident Reporting', false, error.message);
            console.log('❌ Accident reporting test failed');
            return null;
        }
    }

    async testWebSocketConnection() {
        console.log('🔍 Testing WebSocket Connection...');
        
        return new Promise((resolve) => {
            try {
                this.socket = io(BACKEND_URL);
                
                this.socket.on('connect', () => {
                    this.addTestResult('WebSocket Connection', true, 'Connected successfully');
                    console.log('✅ WebSocket connection established');
                    
                    // Test real-time message
                    this.socket.on('hospital-feed', (data) => {
                        this.addTestResult('Real-time Updates', true, `Received: ${data.type}`);
                        console.log('✅ Real-time updates working');
                    });
                    
                    resolve();
                });
                
                this.socket.on('connect_error', (error) => {
                    this.addTestResult('WebSocket Connection', false, error.message);
                    console.log('❌ WebSocket connection failed');
                    resolve();
                });
                
                // Timeout after 5 seconds
                setTimeout(() => {
                    if (!this.socket.connected) {
                        this.addTestResult('WebSocket Connection', false, 'Connection timeout');
                        console.log('❌ WebSocket connection timeout');
                    }
                    resolve();
                }, 5000);
                
            } catch (error) {
                this.addTestResult('WebSocket Connection', false, error.message);
                console.log('❌ WebSocket test failed');
                resolve();
            }
        });
    }

    async testDashboardAccess() {
        console.log('🔍 Testing Dashboard Accessibility...');
        
        try {
            // Test Hospital Dashboard
            const hospitalResponse = await axios.get(HOSPITAL_DASHBOARD_URL, { timeout: 5000 });
            this.addTestResult('Hospital Dashboard Access', hospitalResponse.status === 200, 'Dashboard accessible');
            
            // Test Driver Dashboard
            const driverResponse = await axios.get(DRIVER_DASHBOARD_URL, { timeout: 5000 });
            this.addTestResult('Driver Dashboard Access', driverResponse.status === 200, 'Dashboard accessible');
            
            console.log('✅ Both dashboards are accessible');
        } catch (error) {
            this.addTestResult('Dashboard Access', false, error.message);
            console.log('❌ Dashboard accessibility test failed');
        }
    }

    async testEmergencyFlow() {
        console.log('🔍 Testing Emergency Response Flow...');
        
        try {
            // Create an accident event
            const accidentData = {
                userId: 'emergency_test_user',
                location: { lat: 12.9716, lng: 77.5946 },
                severityScore: 0.9,
                timestamp: new Date().toISOString()
            };

            const accidentResponse = await axios.post(`${BACKEND_URL}/api/report-accident`, accidentData);
            const eventId = accidentResponse.data.eventId;

            // Test acknowledgment
            const ackResponse = await axios.post(`${BACKEND_URL}/api/events/${eventId}/ack`);
            this.addTestResult('Event Acknowledgment', ackResponse.data.ok, 'Event acknowledged');

            // Test assignment
            const assignResponse = await axios.post(`${BACKEND_URL}/api/events/${eventId}/assign`);
            this.addTestResult('Medical Team Assignment', assignResponse.data.ok, 'Team assigned');

            // Test dispatch
            const dispatchResponse = await axios.post(`${BACKEND_URL}/api/events/${eventId}/dispatch`);
            this.addTestResult('Ambulance Dispatch', dispatchResponse.data.ok, 'Ambulance dispatched');

            console.log('✅ Emergency response flow working');
        } catch (error) {
            this.addTestResult('Emergency Flow', false, error.message);
            console.log('❌ Emergency response flow test failed');
        }
    }

    async testDataPersistence() {
        console.log('🔍 Testing Data Persistence...');
        
        try {
            // Get all events
            const eventsResponse = await axios.get(`${BACKEND_URL}/api/events`);
            this.addTestResult('Data Retrieval', eventsResponse.data.ok, `Found ${eventsResponse.data.events.length} events`);

            // Test user-specific events
            const userEventsResponse = await axios.get(`${BACKEND_URL}/api/events/user/test_system_user`);
            this.addTestResult('User-specific Data', userEventsResponse.data.ok, 'User events retrieved');

            console.log('✅ Data persistence working');
        } catch (error) {
            this.addTestResult('Data Persistence', false, error.message);
            console.log('❌ Data persistence test failed');
        }
    }

    addTestResult(testName, passed, details) {
        this.testResults.push({
            test: testName,
            passed,
            details,
            timestamp: new Date().toISOString()
        });
    }

    printTestSummary() {
        console.log('\n📊 TEST SUMMARY');
        console.log('================');
        
        const passedTests = this.testResults.filter(r => r.passed).length;
        const totalTests = this.testResults.length;
        
        console.log(`Total Tests: ${totalTests}`);
        console.log(`Passed: ${passedTests}`);
        console.log(`Failed: ${totalTests - passedTests}`);
        console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%\n`);
        
        console.log('DETAILED RESULTS:');
        console.log('-----------------');
        
        this.testResults.forEach(result => {
            const status = result.passed ? '✅' : '❌';
            console.log(`${status} ${result.test}: ${result.details}`);
        });
        
        if (passedTests === totalTests) {
            console.log('\n🎉 ALL TESTS PASSED! System is fully operational.');
        } else {
            console.log('\n⚠️  Some tests failed. Please check the system configuration.');
        }
        
        // Cleanup
        if (this.socket) {
            this.socket.close();
        }
    }
}

// Run tests if this script is executed directly
if (require.main === module) {
    const tester = new SystemTester();
    tester.runAllTests().catch(console.error);
}

module.exports = SystemTester;
