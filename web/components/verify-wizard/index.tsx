'use client';

import React, { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import {
  UpdateArgsArgs,
  getAssetWithProof,
  mplBubblegum,
  updateMetadata,
  verifyCreator,
} from '@metaplex-foundation/mpl-bubblegum';
import {
  fetchMetadataFromSeeds,
  updateV1,
} from '@metaplex-foundation/mpl-token-metadata';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import {
  Signer,
  TransactionBuilder,
  Umi,
  signerIdentity,
  transactionBuilder,
} from '@metaplex-foundation/umi';
import { createSignerFromWalletAdapter } from '@metaplex-foundation/umi-signer-wallet-adapters';
import {
  DasApiAsset,
  dasApi,
} from '@metaplex-foundation/digital-asset-standard-api';
import {
  mplTokenMetadata,
  verifyCreatorV1,
  findMetadataPda,
} from '@metaplex-foundation/mpl-token-metadata';
import { ComputeBudgetProgram } from '@solana/web3.js';
import {
  fromWeb3JsInstruction,
  toWeb3JsTransaction,
} from '@metaplex-foundation/umi-web3js-adapters';
import useSolanaTransaction, {
  TransactionState,
} from '../solana/send-transaction/hook';

interface VerifyWizardProps {
  asset: DasApiAsset;
}

const builderWithComputeBudget = async (
  umi: Umi,
  builder: TransactionBuilder
) => {
  const computeBudgetBuilder = builder
    .prepend(
      transactionBuilder([
        {
          instruction: fromWeb3JsInstruction(
            ComputeBudgetProgram.setComputeUnitPrice({
              microLamports: 1000,
            })
          ),
          signers: [],
          bytesCreatedOnChain: 0,
        },
      ])
    )
    .useV0();

  const { blockhash, lastValidBlockHeight } =
    await umi.rpc.getLatestBlockhash();

  const transaction = computeBudgetBuilder
    .setBlockhash({ blockhash, lastValidBlockHeight })
    .build(umi);

  return {
    transaction: toWeb3JsTransaction(transaction),
    blockhash,
    lastValidBlockHeight,
  };
};

const addCreatorToMetadata = async (
  umi: Umi,
  creatorSigner: Signer,
  asset: DasApiAsset
) => {
  const {
    compression: { compressed },
    creators,
  } = asset;

  const newCreators = [
    ...creators,
    {
      address: creatorSigner.publicKey,
      verified: true,
      share: 0,
    },
  ];

  if (compressed) {
    // TODO(jon): Error if creators is full

    const updateArgs: UpdateArgsArgs = {
      creators: newCreators,
    };

    const assetWithProof = await getAssetWithProof(umi, asset.id);
    return builderWithComputeBudget(
      umi,
      updateMetadata(umi, {
        ...assetWithProof,
        leafOwner: creatorSigner.publicKey,
        currentMetadata: assetWithProof.metadata,
        updateArgs,
      })
    );
  } else {
    const initialMetadata = await fetchMetadataFromSeeds(umi, {
      mint: asset.id,
    });
    return builderWithComputeBudget(
      umi,
      updateV1(umi, {
        mint: asset.id,
        authority: creatorSigner,
        data: { ...initialMetadata, creators: newCreators },
      })
    );
  }
};

const verifyExistingCreator = async (
  umi: Umi,
  creatorSigner: Signer,
  asset: DasApiAsset
) => {
  const {
    compression: { compressed },
  } = asset;

  if (compressed) {
    const assetWithProof = await getAssetWithProof(umi, asset.id);
    return await builderWithComputeBudget(
      umi,
      verifyCreator(umi, {
        ...assetWithProof,
        creator: creatorSigner,
      })
    );
  } else {
    return await builderWithComputeBudget(
      umi,
      verifyCreatorV1(umi, {
        metadata: findMetadataPda(umi, { mint: asset.id }),
        authority: creatorSigner,
      })
    );
  }
};

const VerifyWizard: React.FC<VerifyWizardProps> = ({ asset }) => {
  const { authorities, creators } = asset;
  const { connected } = useWallet();

  const [buttonState, setButtonState] = useState({
    buttonText: 'Verify',
    buttonClass: 'btn',
    disabled: true, // Initial state, will be updated in useEffect
  });

  const wallet = useWallet();
  const [txState, setTxState] = useState<TransactionState>(
    TransactionState.Idle
  );
  const { error, sendTransaction } = useSolanaTransaction(async () => {
    const creatorSigner = createSignerFromWalletAdapter(wallet);
    const umi = createUmi(process.env.NEXT_PUBLIC_RPC_ENDPOINT!)
      .use(mplBubblegum())
      .use(dasApi())
      .use(mplTokenMetadata())
      .use(signerIdentity(creatorSigner));

    const includedInCreatorsArray = creators.some(
      (creator) => creator.address === creatorSigner.publicKey.toString()
    );

    if (
      creatorSigner.publicKey.toString() === updateAuthority &&
      !includedInCreatorsArray
    ) {
      return await addCreatorToMetadata(umi, creatorSigner, asset);
    } else if (includedInCreatorsArray) {
      return await verifyExistingCreator(umi, creatorSigner, asset);
    } else {
      throw new Error(
        'The connected wallet is not the update authority nor in the creators array.'
      );
      // TODO(jon): Handle the case where the creator is not the update authority and is not in the creators array
    }
  }, setTxState);

  // Two states: Either you're the update authority, or you're one of the unverified creators
  // Substate - if you're the update authority and you're not in the creators array, get added.
  const updateAuthority = authorities.find((authority) =>
    authority.scopes.includes('full')
  )?.address;

  const handleVerifyClick = async () => {
    console.log('Verifying...');
    sendTransaction();
  };

  useEffect(() => {
    let newState = {
      buttonText: 'Verify',
      buttonClass: 'btn',
      disabled: !connected,
    };

    if (connected) {
      switch (txState) {
        case TransactionState.Idle:
          newState = {
            buttonText: 'Verify',
            buttonClass: 'btn',
            disabled: false,
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
            buttonText: 'Verifying...',
            buttonClass: 'btn btn-disabled loading',
            disabled: true,
          };
          break;
        case TransactionState.Successful:
          newState = {
            buttonText: 'Verified!',
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
  }, [connected, txState]);

  return (
    <div>
      <p className="text-gray-600 text-sm my-4">
        Verification is a crucial step that indicates ownership. By verifying,
        you confirm that you are the rightful creator of the asset. This ensures
        that we're only displaying real, authentic content on Etched.
      </p>
      {error && (
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
            <span>{error?.toString()}</span>
          </div>
        </div>
      )}
      {wallet.connected ? <WalletMultiButton /> : null}
      {wallet.connected && !error ? (
        <button
          onClick={handleVerifyClick}
          className={buttonState.buttonClass}
          disabled={buttonState.disabled}
        >
          {buttonState.buttonText}
        </button>
      ) : null}
    </div>
  );
};

export default VerifyWizard;
