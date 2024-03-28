import { useState } from 'react';
import { VersionedTransaction } from '@solana/web3.js';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';

export enum TransactionState {
  Idle = 'idle',
  Failed = 'failed',
  FetchingTransaction = 'fetching-transaction',
  Signing = 'signing',
  Confirming = 'confirming',
  Successful = 'successful',
}

const useSolanaTransaction = (
  fetchTransaction: () => Promise<{
    transaction: VersionedTransaction | null;
    blockhash: string;
    lastValidBlockHeight: number;
  }>,
  setState: React.Dispatch<React.SetStateAction<TransactionState>>
) => {
  const wallet = useWallet();
  const [error, setError] = useState<Error | null>(null);
  const [signature, setSignature] = useState<string | null>(null); // Added state for signature
  const { connection } = useConnection();

  const sendTransaction = async () => {
    setState(TransactionState.FetchingTransaction);
    const { transaction, blockhash, lastValidBlockHeight } =
      await fetchTransaction();
    if (!transaction) {
      console.error('Transaction is null');
      setError(new Error('Transaction not found'));
      setState(TransactionState.Failed);
      return;
    }

    console.log('Sending transaction...');
    setState(TransactionState.Signing);

    try {
      const transactionSignature = await wallet.sendTransaction(
        transaction,
        connection,
        {
          preflightCommitment: 'confirmed',
        }
      );
      console.log('Transaction Signature:', transactionSignature);
      setSignature(transactionSignature); // Update signature state

      setState(TransactionState.Confirming);
      const confirmed = await connection.confirmTransaction(
        {
          blockhash,
          lastValidBlockHeight,
          signature: transactionSignature,
        },
        'confirmed'
      );

      if (confirmed) {
        console.log('Transaction confirmed for:', transactionSignature);
        setState(TransactionState.Successful);
      } else {
        console.error('Transaction failed for:', transactionSignature);
        setState(TransactionState.Failed);
        setSignature(null); // Reset signature on failure
      }
    } catch (error: unknown) {
      console.error(error);
      setError(error as Error);
      setState(TransactionState.Failed);
      setSignature(null); // Reset signature on error
      setTimeout(() => {
        setError(null);
        setState(TransactionState.Idle);
      }, 3000);
    }
  };

  return { sendTransaction, error, signature }; // Return signature as part of the hook's return value
};

export default useSolanaTransaction;
