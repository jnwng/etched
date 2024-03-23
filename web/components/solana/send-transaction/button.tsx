import React, { useState } from 'react';
import { Connection, Transaction, VersionedTransaction } from '@solana/web3.js';
import { useWallet } from '@solana/wallet-adapter-react';

const connection = new Connection(
  process.env.NEXT_PUBLIC_RPC_ENDPOINT!,
  'confirmed'
);

const SendTransactionButton = ({
  fetchTransaction,
  disabled,
  text,
}: {
  fetchTransaction: () => Promise<{
    transaction: VersionedTransaction;
    blockhash: string;
    lastValidBlockHeight: number;
  }>;
  disabled?: boolean;
  text: {
    initial: string;
    progress: string;
    success: string;
  };
}) => {
  const wallet = useWallet();
  const [state, setState] = useState('idle'); // Initial state is 'idle'
  const [error, setError] = useState<Error | unknown | null>(null);
  const [blockInfo, setBlockInfo] = useState({
    blockhash: '',
    lastValidBlockHeight: 0,
  });

  const sendTransaction = async (transaction: VersionedTransaction) => {
    console.log('Sending transaction...');

    const signature = await wallet.sendTransaction(transaction, connection, {
      preflightCommitment: 'confirmed',
    });
    console.log('Transaction Signature:', signature);

    // Use blockInfo for confirmation
    const confirmed = await connection.confirmTransaction(
      {
        blockhash: blockInfo.blockhash,
        lastValidBlockHeight: blockInfo.lastValidBlockHeight,
        signature,
      },
      'confirmed'
    );
    if (confirmed) {
      console.log('Transaction confirmed for:', signature);
    } else {
      // TODO(jon): Handle a re-signing flow if needed.
      console.error('Transaction failed for:', signature);
    }
  };

  const handleClick = async () => {
    setState('signing');
    try {
      const { transaction, blockhash, lastValidBlockHeight } =
        await fetchTransaction();
      console.info({ transaction });
      setBlockInfo({ blockhash, lastValidBlockHeight });
      if (!transaction) {
        throw new Error('Transaction not found');
      }
      // const signedTransaction = await signTransaction(transaction);
      setState('sending');
      await sendTransaction(transaction);
      setState('successful');
    } catch (error: unknown) {
      console.error(error);
      setError(error);
      setState('failed');
      // Reset back to 'signing' after 3 seconds
      setTimeout(() => {
        setState('initial');
      }, 3000);
    }
  };

  let buttonState = {
    buttonText: text.initial || 'Send Transaction',
    buttonClass: 'btn',
    disabled: false,
  };

  switch (state) {
    case 'initial':
      buttonState = {
        buttonText: text.initial || 'Send Transaction',
        buttonClass: 'btn',
        disabled: false,
      };
      break;
    case 'signing':
      buttonState = {
        buttonText: 'Signing...',
        buttonClass: 'btn btn-disabled',
        disabled: true,
      };
      break;
    case 'sending':
      buttonState = {
        buttonText: text.progress || 'Transaction Being Sent',
        buttonClass: 'btn btn-disabled loading',
        disabled: true,
      };
      break;
    case 'successful':
      buttonState = {
        buttonText: text.success || 'Transaction Successful',
        buttonClass: 'btn btn-success',
        disabled: false,
      };
      break;
    case 'failed':
      buttonState = {
        buttonText: text.initial || 'Retry',
        buttonClass: 'btn btn-error',
        disabled: false,
      };
      break;
    default:
      break;
  }

  return (
    <button
      className={buttonState.buttonClass}
      onClick={handleClick}
      disabled={buttonState.disabled || disabled}
    >
      {buttonState.buttonText}
    </button>
  );
};

export default SendTransactionButton;
