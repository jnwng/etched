'use client';

import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import {
  getAssetWithProof,
  mplBubblegum,
  verifyCreator,
} from '@metaplex-foundation/mpl-bubblegum';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import {
  signerIdentity,
  transactionBuilder,
  publicKey as umiPublicKey,
} from '@metaplex-foundation/umi';
import { createSignerFromWalletAdapter } from '@metaplex-foundation/umi-signer-wallet-adapters';
import { dasApi } from '@metaplex-foundation/digital-asset-standard-api';
import {
  mplTokenMetadata,
  verifyCreatorV1,
  findMetadataPda,
} from '@metaplex-foundation/mpl-token-metadata';
import { ComputeBudgetProgram } from '@solana/web3.js';
import { fromWeb3JsInstruction } from '@metaplex-foundation/umi-web3js-adapters';

interface VerifyWizardProps {
  address: string;
  isCompressed: boolean;
}

const VerifyWizard: React.FC<VerifyWizardProps> = ({
  address,
  isCompressed,
}) => {
  const wallet = useWallet();

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
    if (isCompressed) {
      const assetWithProof = await getAssetWithProof(
        umi,
        umiPublicKey(address)
      );
      console.info({ assetWithProof });
      await verifyCreator(umi, {
        ...assetWithProof,
        creator: creatorSigner,
      }).sendAndConfirm(umi);
    } else {
      await verifyCreatorV1(umi, {
        metadata: findMetadataPda(umi, { mint: umiPublicKey(address) }),
        authority: creatorSigner,
      })
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
        .sendAndConfirm(umi);
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
