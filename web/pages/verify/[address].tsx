import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';

const VerifyAddress = () => {
  const router = useRouter();
  const { address } = router.query;
  const [verificationStatus, setVerificationStatus] = useState('');
  const [checklist, setChecklist] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (address) {
      fetchVerificationStatus(address as string);
    }
  }, [address]);

  const fetchVerificationStatus = async (address: string) => {
    try {
      const response = await axios.get(`https://api.helius.xyz/verify/${address}`);
      const { status, reasons } = response.data;
      setVerificationStatus(status);
      setChecklist(reasons);
    } catch (error) {
      console.error('Error fetching verification status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyClick = async () => {
    try {
      const response = await axios.get(`https://api.helius.xyz/transaction/${address}`);
      const { transaction } = response.data;
      // Here you would handle the transaction, e.g., sending it to a Solana wallet for signing
      console.log(transaction);
    } catch (error) {
      console.error('Error fetching transaction:', error);
    }
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold">Verification Status: {verificationStatus}</h1>
      <ul className="list-disc pl-5">
        {checklist.map((reason, index) => (
          <li key={index}>{reason}</li>
        ))}
      </ul>
      <button
        className="btn btn-primary mt-4"
        onClick={handleVerifyClick}
      >
        Verify
      </button>
    </div>
  );
};

export default VerifyAddress;