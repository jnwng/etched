import { Connection, PublicKey } from '@solana/web3.js';
import { getNameAccountKeySync, getHashedNameSync, reverseLookup, getRecordV2, Record, NameRegistryState } from '@bonfida/spl-name-service';

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
    const urlRecordContent = urlRecord.retrievedRecord.getContent().toString()
    console.info({ etchedSubdomainName, urlRecordContent })

    // Step 3: Verify the URL record matches the expected value
    const expectedUrlRegex = new RegExp(`^https?:\\/\\/(www\\.)?etched\\.id\\/${domainName}$`);
    return !!urlRecordContent && expectedUrlRegex.test(urlRecordContent);
  } catch (error) {
    console.error("Error during domain verification:", error);
    return false;
  }
}

async function lookupAndVerifyShortname({ publicKeyStr, domainName }: { publicKeyStr?: string, domainName?: string }): Promise<VerificationResult> {
  try {
    if (!domainName && publicKeyStr) {
      // Step 1: Perform a reverse lookup to find the domain name associated with the public key
      domainName = await reverseLookup(connection, new PublicKey(publicKeyStr));
      if (!domainName) {
        console.log("Domain name not found for the given public key.");
        return {
          verified: false
        }
      }
      console.log(`Domain name found: ${domainName}`);
    }

    const verified = await verifyDomain(domainName!);

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