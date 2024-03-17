import { Connection, PublicKey } from '@solana/web3.js';
import { reverseLookup, getRecordV2, Record } from '@bonfida/spl-name-service';

// Constants
const connection = new Connection(process.env.RPC_ENDPOINT!);

interface VerificationResult {
  verified: boolean;
  shortname?: string;
}

export async function verifyDomain(domainName: string): Promise<boolean> {
  try {
    // Step 2: Retrieve the URL record from the domain's Records V2
    const etchedSubdomainName = `etched.${domainName}`;
    const urlRecord = await getRecordV2(connection, etchedSubdomainName, Record.Url);

    // Step 3: Verify the URL record matches the expected value
    const expectedUrlRegex = new RegExp(`^https?:\\/\\/(www\\.)?etched\\.id\\/${etchedSubdomainName}$`);
    return !!urlRecord.deserializedContent && expectedUrlRegex.test(urlRecord.deserializedContent);
  } catch (error) {
    console.error("Error during domain verification:", error);
    return false;
  }
}

async function lookupAndVerifyShortname(publicKeyStr: string): Promise<VerificationResult> {
  try {
    const publicKey = new PublicKey(publicKeyStr);

    // Step 1: Perform a reverse lookup to find the domain name associated with the public key
    const domainName = await reverseLookup(connection, publicKey);
    if (!domainName) {
      console.log("Domain name not found for the given public key.");
      return {
        verified: false
      }
    }
    console.log(`Domain name found: ${domainName}`);

    const verified = await verifyDomain(domainName);

    return {
      verified: verified,
      shortname: domainName
    };
  } catch (error) {
    console.error("Error during lookup and verification:", error);
    return {
      verified: false
    }
  }
}

export default lookupAndVerifyShortname