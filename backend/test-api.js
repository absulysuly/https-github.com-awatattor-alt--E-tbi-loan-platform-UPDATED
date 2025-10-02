/**
 * Quick API Test Script
 * Run this after starting the server to test endpoints
 * 
 * Usage: node test-api.js
 */

const http = require('http');

const BASE_URL = 'http://localhost:3001';
let authToken = '';

// Helper function to make HTTP requests
function makeRequest(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const jsonBody = JSON.parse(body);
          resolve({ status: res.statusCode, data: jsonBody });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Test functions
async function testHealthCheck() {
  console.log('\n🏥 Testing Health Check...');
  try {
    const response = await makeRequest('GET', '/health');
    console.log(`✅ Status: ${response.status}`);
    console.log('Response:', JSON.stringify(response.data, null, 2));
    return response.status === 200;
  } catch (error) {
    console.log('❌ Failed:', error.message);
    return false;
  }
}

async function testLogin() {
  console.log('\n🔐 Testing Login...');
  try {
    const response = await makeRequest('POST', '/api/v1/auth/login', {
      email: 'admin@tbibank.com',
      password: 'Password123!',
    });
    console.log(`Status: ${response.status}`);
    
    if (response.data.success && response.data.data && response.data.data.token) {
      authToken = response.data.data.token;
      console.log('✅ Login successful!');
      console.log('User:', response.data.data.user);
      console.log('Token received (first 20 chars):', authToken.substring(0, 20) + '...');
      return true;
    } else {
      console.log('❌ Login failed');
      console.log('Response:', JSON.stringify(response.data, null, 2));
      return false;
    }
  } catch (error) {
    console.log('❌ Failed:', error.message);
    return false;
  }
}

async function testGetApplications() {
  console.log('\n📝 Testing Get Applications...');
  try {
    const response = await makeRequest('GET', '/api/v1/applications', null, authToken);
    console.log(`Status: ${response.status}`);
    
    if (response.data.success) {
      console.log('✅ Applications retrieved!');
      console.log(`Total applications: ${response.data.data.applications.length}`);
      if (response.data.data.applications.length > 0) {
        console.log('First application:', {
          id: response.data.data.applications[0].id,
          applicationNumber: response.data.data.applications[0].applicationNumber,
          status: response.data.data.applications[0].status,
          loanAmount: response.data.data.applications[0].loanAmount,
        });
      }
      return true;
    } else {
      console.log('❌ Failed to get applications');
      console.log('Response:', JSON.stringify(response.data, null, 2));
      return false;
    }
  } catch (error) {
    console.log('❌ Failed:', error.message);
    return false;
  }
}

async function testGetActiveConfig() {
  console.log('\n⚙️  Testing Get Active Risk Configuration...');
  try {
    const response = await makeRequest('GET', '/api/v1/config/risk', null, authToken);
    console.log(`Status: ${response.status}`);
    
    if (response.data.success) {
      console.log('✅ Configuration retrieved!');
      console.log('Config:', {
        version: response.data.data.config.version,
        name: response.data.data.config.name,
        isActive: response.data.data.config.isActive,
      });
      return true;
    } else {
      console.log('❌ Failed to get configuration');
      console.log('Response:', JSON.stringify(response.data, null, 2));
      return false;
    }
  } catch (error) {
    console.log('❌ Failed:', error.message);
    return false;
  }
}

async function testGenerateAssessment() {
  console.log('\n🎯 Testing Generate Risk Assessment...');
  try {
    // First get an application ID
    const appsResponse = await makeRequest('GET', '/api/v1/applications', null, authToken);
    if (!appsResponse.data.success || appsResponse.data.data.applications.length === 0) {
      console.log('⚠️  No applications available to assess');
      return false;
    }

    const appId = appsResponse.data.data.applications[0].id;
    console.log(`Generating assessment for application: ${appId}`);

    const response = await makeRequest(
      'POST',
      '/api/v1/assessments/generate',
      { applicationId: appId },
      authToken
    );
    console.log(`Status: ${response.status}`);
    
    if (response.data.success) {
      console.log('✅ Assessment generated!');
      const assessment = response.data.data.assessment;
      console.log('Assessment:', {
        id: assessment.id,
        riskScore: assessment.riskScore,
        riskCategory: assessment.riskCategory,
        recommendation: assessment.recommendation,
        confidence: assessment.confidence,
      });
      console.log('\nKey Risk Indicators:', assessment.keyRiskIndicators);
      console.log('\nMitigation Suggestions:', assessment.mitigationSuggestions);
      return true;
    } else {
      console.log('❌ Failed to generate assessment');
      console.log('Response:', JSON.stringify(response.data, null, 2));
      return false;
    }
  } catch (error) {
    console.log('❌ Failed:', error.message);
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('   TBi Bank Risk Assessment API - Test Suite');
  console.log('═══════════════════════════════════════════════════════');

  const results = {
    healthCheck: await testHealthCheck(),
    login: await testLogin(),
  };

  if (results.login) {
    results.getApplications = await testGetApplications();
    results.getConfig = await testGetActiveConfig();
    results.generateAssessment = await testGenerateAssessment();
  }

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('                    Test Results');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`Health Check:          ${results.healthCheck ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Login:                 ${results.login ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Get Applications:      ${results.getApplications ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Get Configuration:     ${results.getConfig ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Generate Assessment:   ${results.generateAssessment ? '✅ PASS' : '❌ FAIL'}`);
  console.log('═══════════════════════════════════════════════════════\n');

  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.values(results).filter((r) => r !== undefined).length;
  console.log(`✨ Tests Passed: ${passed}/${total}\n`);

  if (passed === total) {
    console.log('🎉 All tests passed! Your API is working correctly!\n');
  } else {
    console.log('⚠️  Some tests failed. Check the errors above.\n');
  }
}

// Run tests
runTests().catch((error) => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});
