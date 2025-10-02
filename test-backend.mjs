import http from 'http';

console.log('\n🧪 Testing Backend API...\n');

const testHealth = () => {
  return new Promise((resolve, reject) => {
    const req = http.get('http://localhost:3001/health', (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('✅ Health check PASSED');
          console.log('Response:', JSON.parse(data));
          resolve(true);
        } else {
          console.log(`❌ Health check FAILED with status ${res.statusCode}`);
          reject(false);
        }
      });
    });
    
    req.on('error', (err) => {
      console.log('❌ Backend not reachable:', err.message);
      console.log('\n💡 Make sure to run: cd backend && npm run dev');
      reject(false);
    });
    
    req.setTimeout(5000, () => {
      console.log('❌ Request timed out');
      req.destroy();
      reject(false);
    });
  });
};

testHealth().catch(() => process.exit(1));
