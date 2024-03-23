import React from 'react';
import SendTransactionButton from '../solana/send-transaction/button'; // Adjust the import path as necessary
import { Connection } from '@solana/web3.js';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { toWeb3JsTransaction } from '@metaplex-foundation/umi-web3js-adapters';

const MintTransactionButton = ({
  title,
  author,
  markdown,
  disabled,
}: {
  title: string;
  author: string;
  markdown: string;
  disabled?: boolean;
}) => {
  const fetchTransaction = async () => {
    try {
      const response = await fetch('/api/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          author,
          content: markdown,
        }),
      });

      if (response.status !== 200) {
        alert('Warning: Something went wrong with the minting process.');
        throw new Error('Transaction failed to be created');
      }

      const {
        transaction,
        blockhash,
        lastValidBlockHeight,
      }: {
        transaction: string;
        blockhash: string;
        lastValidBlockHeight: number;
      } = await response.json();
      console.log('Transaction data:', {
        transaction,
        blockhash,
        lastValidBlockHeight,
      });

      const connection = new Connection(process.env.NEXT_PUBLIC_RPC_ENDPOINT!);
      const umi = createUmi(connection);

      const deserialized = toWeb3JsTransaction(
        umi.transactions.deserialize(Buffer.from(transaction, 'base64'))
      );
      console.info({ deserialized });
      // const versionedTxn = new VersionedTransaction(deserializedTransaction);
      return { transaction: deserialized, blockhash, lastValidBlockHeight };
    } catch (error) {
      console.error('Error during the minting process:', error);
      alert('Error: Could not complete the minting process.');
      throw error;
    }
  };

  return (
    <SendTransactionButton
      fetchTransaction={fetchTransaction}
      disabled={disabled}
      text={{ initial: 'Mint', progress: 'Minting...', success: 'Minted!' }}
    />
  );
};

export default MintTransactionButton;
