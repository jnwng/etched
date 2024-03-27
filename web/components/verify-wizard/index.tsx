'use client';

import React from 'react';
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
import { fromWeb3JsInstruction } from '@metaplex-foundation/umi-web3js-adapters';

interface VerifyWizardProps {
  asset: DasApiAsset;
}

const builderWithComputeBudget = (builder: TransactionBuilder) => {
  return builder.prepend(
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
  );
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
    await builderWithComputeBudget(
      updateMetadata(umi, {
        ...assetWithProof,
        leafOwner: creatorSigner.publicKey,
        currentMetadata: assetWithProof.metadata,
        updateArgs,
      })
    ).sendAndConfirm(umi);
  } else {
    const initialMetadata = await fetchMetadataFromSeeds(umi, {
      mint: asset.id,
    });
    await builderWithComputeBudget(
      updateV1(umi, {
        mint: asset.id,
        authority: creatorSigner,
        data: { ...initialMetadata, creators: newCreators },
      })
    ).sendAndConfirm(umi);
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
    await builderWithComputeBudget(
      verifyCreator(umi, {
        ...assetWithProof,
        creator: creatorSigner,
      })
    ).sendAndConfirm(umi);
  } else {
    await builderWithComputeBudget(
      verifyCreatorV1(umi, {
        metadata: findMetadataPda(umi, { mint: asset.id }),
        authority: creatorSigner,
      })
    ).sendAndConfirm(umi);
  }
};

const VerifyWizard: React.FC<VerifyWizardProps> = ({ asset }) => {
  const wallet = useWallet();
  const { authorities, creators } = asset;

  // Two states: Either you're the update authority, or you're one of the unverified creators
  // Substate - if you're the update authority and you're not in the creators array, get added.
  const updateAuthority = authorities.find((authority) =>
    authority.scopes.includes('full')
  )?.address;

  const handleVerifyClick = async () => {
    // Invoke your API call here
    console.log('Verifying...');
    // Example: await verifyAPI(address, isCompressed);
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
      await addCreatorToMetadata(umi, creatorSigner, asset);
    } else if (includedInCreatorsArray) {
      await verifyExistingCreator(umi, creatorSigner, asset);
    } else {
      // TODO(jon): Handle the case where the creator is not the update authority and is not in the creators array
    }
  };

  return (
    <div>
      {wallet.connected ? (
        <button
          onClick={handleVerifyClick}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Verify
        </button>
      ) : (
        <WalletMultiButton />
      )}
    </div>
  );
};

export default VerifyWizard;
