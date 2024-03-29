import { url, cleanEnv } from 'envalid';

// Load and validate .env variables
// Use `dotenv` or a similar package if you need to manually load .env files in a non-Node.js environment
const env = cleanEnv(process.env, {
  // Define your environment variables here with their validators
  NFT_STORAGE_API_KEY: str(),
  RPC_ENDPOINT: url(),
});

export default env;
