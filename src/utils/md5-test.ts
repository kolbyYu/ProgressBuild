import { MD5 } from 'react-native-crypto-js';

// Test MD5 hashing functionality
export const testMD5Hashing = () => {
  const testPassword = 'password123';
  const expectedHash = '482c811da5d5b4bc6d497ffa98491e38'; // Known MD5 hash for 'password123'
  
  const actualHash = MD5(testPassword).toString();
  
  console.log('🧪 MD5 Test Results:');
  console.log('Input password:', testPassword);
  console.log('Expected hash:', expectedHash);
  console.log('Actual hash:', actualHash);
  console.log('Match:', actualHash === expectedHash);
  
  return actualHash === expectedHash;
};

// Common test passwords and their MD5 hashes
export const commonTestPasswords = {
  'password123': '482c811da5d5b4bc6d497ffa98491e38',
  'admin': '21232f297a57a5a743894a0e4a801fc3',
  '123456': 'e10adc3949ba59abbe56e057f20f883e',
  'test': '098f6bcd4621d373cade4e832627b4f6',
}; 