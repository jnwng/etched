import React, { useEffect, useState } from 'react';
import { Connection } from '@solana/web3.js';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { toWeb3JsTransaction } from '@metaplex-foundation/umi-web3js-adapters';
import useSolanaTransaction, {
  TransactionState,
} from '../solana/send-transaction/hook';
import { useWallet } from '@solana/wallet-adapter-react';
import {
  LeafSchema,
  findLeafAssetIdPda,
  parseLeafFromMintV1Transaction,
} from '@metaplex-foundation/mpl-bubblegum';
import { publicKey } from '@metaplex-foundation/umi';
import { base58 } from '@metaplex-foundation/umi/serializers';
import { useRouter } from 'next/router';

const connection = new Connection(
  process.env.NEXT_PUBLIC_RPC_ENDPOINT!,
  'confirmed'
);
const umi = createUmi(connection);

const MintTransactionButton = ({
  title,
  author,
  markdown,
}: {
  title: string;
  author: string;
  markdown: string;
}) => {
  const [txState, setTxState] = useState<TransactionState>(
    TransactionState.Idle
  );
  const { connected } = useWallet();
  const [formError, setFormError] = useState<string | null>(null);
  const [assetId, setAssetId] = useState<string | null>(null);
  const router = useRouter();

  const [buttonState, setButtonState] = useState({
    buttonText: 'Mint',
    buttonClass: 'btn',
    disabled: true, // Initial state, will be updated in useEffect
  });

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

  const { error, sendTransaction, signature } = useSolanaTransaction(
    fetchTransaction,
    setTxState
  );

  useEffect(() => {
    async function getAssetId() {
      console.info({ signature });
      const leaf: LeafSchema = await parseLeafFromMintV1Transaction(
        umi,
        base58.serialize(signature!)
      );
      const [assetId] = findLeafAssetIdPda(umi, {
        merkleTree: publicKey(process.env.NEXT_PUBLIC_TREE_PUBLIC_KEY!),
        leafIndex: leaf.nonce,
      });
      console.info({ assetId });
      setAssetId(assetId.toString());
    }
    if (txState === TransactionState.Successful) {
      getAssetId();
    }
  }, [signature, txState]);

  useEffect(() => {
    if (title.length === 0) {
      setFormError('Title is required');
    }

    if (markdown.length === 0) {
      setFormError('Content is required');
    }

    if (title.length > 0 && markdown.length > 0) {
      setFormError(null);
    }
  }, [title, markdown]);

  useEffect(() => {
    let newState = {
      buttonText: 'Mint',
      buttonClass: 'btn',
      disabled: !connected || title.length === 0,
    };

    if (connected) {
      switch (txState) {
        case TransactionState.Idle:
          newState = {
            buttonText: 'Mint',
            buttonClass: 'btn',
            disabled: false || formError !== null,
          };
          break;
        case TransactionState.FetchingTransaction:
          newState = {
            buttonText: 'Preparing transaction...',
            buttonClass: 'btn btn-disabled',
            disabled: true,
          };
          break;
        case TransactionState.Signing:
          newState = {
            buttonText: 'Signing...',
            buttonClass: 'btn btn-disabled loading',
            disabled: true,
          };
          break;
        case TransactionState.Confirming:
          newState = {
            buttonText: 'Minting...',
            buttonClass: 'btn btn-disabled loading',
            disabled: true,
          };
          break;
        case TransactionState.Successful:
          newState = {
            buttonText: 'Minted!',
            buttonClass: 'btn btn-success',
            disabled: false,
          };
          break;
        case TransactionState.Failed:
          newState = {
            buttonText: 'Retry',
            buttonClass: 'btn btn-error',
            disabled: false,
          };
          break;
        default:
          break;
      }
    }
    setButtonState(newState);
  }, [connected, txState, title, markdown, formError]);

  return (
    <div className="flex flex-col">
      {(formError || error) && (
        <div className="alert alert-error shadow-lg mt-2">
          <div className="flex flex-col items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="stroke-current h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              ></path>
            </svg>
            <span>{(formError || error)?.toString()}</span>
          </div>
        </div>
      )}

      <button
        className={`${buttonState.buttonClass} mt-2`}
        onClick={async () => {
          if (txState === TransactionState.Successful) {
            router.push(`/${assetId}`);
            return;
          }

          if (txState === TransactionState.Failed) {
            setButtonState({
              buttonText: 'Mint',
              buttonClass: 'btn',
              disabled: false || formError !== null,
            });
            setFormError(null);
          } else {
            sendTransaction();
          }
        }}
        disabled={buttonState.disabled}
      >
        {buttonState.buttonText}
      </button>
    </div>
  );
};

export default MintTransactionButton;
