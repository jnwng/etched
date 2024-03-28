import type { NextApiRequest, NextApiResponse } from 'next';
import { mintV1, expectPublicKey } from '@metaplex-foundation/mpl-bubblegum';
import {
  createNoopSigner,
  createSignerFromKeypair,
  signerIdentity,
  publicKey as umiPublicKey,
} from '@metaplex-foundation/umi';
import { ComputeBudgetProgram, Connection } from '@solana/web3.js';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { nftStorageUploader } from '@metaplex-foundation/umi-uploader-nft-storage';
import { mplToolbox } from '@metaplex-foundation/mpl-toolbox';
import { fromWeb3JsInstruction } from '@metaplex-foundation/umi-web3js-adapters';

const connection = new Connection(process.env.RPC_ENDPOINT!, 'confirmed');
const umi = createUmi(connection);
umi.use(nftStorageUploader({ token: process.env.NFT_STORAGE_API_KEY! }));
umi.use(mplToolbox());

const TREE_AUTHORITY_KEYPAIR = umi.eddsa.createKeypairFromSecretKey(
  new Uint8Array(JSON.parse(process.env.TREE_AUTHORITY_SECRET_KEY!))
);
const TREE_PUBLIC_KEY = process.env.NEXT_PUBLIC_TREE_PUBLIC_KEY as string;

type RequestBody = {
  title: string;
  author: string;
  content: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { title, author, content }: RequestBody = req.body;
  // Validate title length
  if (!title || title.length > 32) {
    return res
      .status(400)
      .json({ error: 'Title must be 32 characters or less.' });
  }

  // Validate public key
  let creatorPublicKey;
  try {
    creatorPublicKey = umiPublicKey(author);
    expectPublicKey(creatorPublicKey);
  } catch (error) {
    return res.status(400).json({ error: 'Invalid public key.' });
  }

  if (!content) {
    return res.status(400).json({ error: 'Invalid Markdown content.' });
  }

  let uri;
  try {
    // TODO(jon): Do not upload in devnet
    uri = await umi.uploader.uploadJson({
      name: title,
      symbol: 'ETCHED',
      description: content,
      // TODO(jon): Figure out a way to allow folks to upload their JSON / image out-of-band of minting the NFT
      image:
        'https://nftstorage.link/ipfs/bafybeigbhoe7436f2ieudxxw6a6ktg37xcrgf4b7iqol4uefnkaa42pdem',
    });
    console.info('JSON uploaded: ', uri);
  } catch (error) {
    console.error('Error uploading JSON:', error);
    return res.status(500).json({ error: 'Error uploading JSON.' });
  }

  // Mint NFT
  const treeAuthoritySigner = createSignerFromKeypair(
    umi,
    TREE_AUTHORITY_KEYPAIR
  );
  try {
    const authorNoopSigner = createNoopSigner(umiPublicKey(author));
    umi.use(signerIdentity(authorNoopSigner));
    let builder = mintV1(umi, {
      leafOwner: creatorPublicKey,
      merkleTree: umiPublicKey(TREE_PUBLIC_KEY),
      treeCreatorOrDelegate: treeAuthoritySigner,
      metadata: {
        name: title,
        uri,
        sellerFeeBasisPoints: 0,
        collection: null,
        creators: [{ address: creatorPublicKey, verified: true, share: 100 }],
      },
    })
      .prepend({
        instruction: fromWeb3JsInstruction(
          ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1000 })
        ),
        signers: [authorNoopSigner],
        bytesCreatedOnChain: 0,
      })
      .useV0();

    const { blockhash, lastValidBlockHeight } =
      await connection.getLatestBlockhash();
    builder = builder.setBlockhash(blockhash);

    let txn = await builder.build(umi);
    txn = await treeAuthoritySigner.signTransaction(txn);

    const serializedTransaction = umi.transactions.serialize(txn);
    const base64Txn = Buffer.from(serializedTransaction).toString('base64');
    console.info('Serializing for minting: ', {
      txSig: base64Txn,
      blockhash,
      lastValidBlockHeight,
    });

    return res
      .status(200)
      .json({ transaction: base64Txn, blockhash, lastValidBlockHeight });
  } catch (error) {
    console.error('Error minting NFT:', error);
    return res.status(500).json({ error: 'Error minting NFT.' });
  }
}
