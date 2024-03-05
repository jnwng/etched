import {
  Keypair,
  Umi,
  createSignerFromKeypair,
  generateSigner,
  keypairIdentity,
  percentAmount,
} from '@metaplex-foundation/umi';
import { createNft } from '@metaplex-foundation/mpl-token-metadata';
import fs from 'fs/promises';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { mplToolbox } from '@metaplex-foundation/mpl-toolbox';
import { nftStorageUploader } from '@metaplex-foundation/umi-uploader-nft-storage';

async function readKeypairFromFile(
  umi: Umi,
  filePath: string
): Promise<Keypair> {
  const fileData = await fs.readFile(filePath, 'utf-8');
  const secretKey = new Uint8Array(JSON.parse(fileData));
  return umi.eddsa.createKeypairFromSecretKey(secretKey);
}

const uploadJson = async (umi) => {
  const uri = await umi.uploader.uploadJson({
    name: 'Hello, World!',
    symbol: 'ETCHED',
    description: await fs.readFile(
      '/Users/jnwng/personal/etched/scripts/hello-world.md',
      'utf-8'
    ),
    image:
      'https://nftstorage.link/ipfs/bafybeigbhoe7436f2ieudxxw6a6ktg37xcrgf4b7iqol4uefnkaa42pdem',
  });
  console.info({ uri });
  return uri;
};

async function main() {
  const umi = createUmi(process.env.DEVNET_HELIUS_ENDPOINT as string);

  umi.use(nftStorageUploader({ token: process.env.NFT_STORAGE_API_KEY! }));
  umi.use(mplToolbox());
  const keypair = await readKeypairFromFile(
    umi,
    '/Users/jnwng/personal/etched/ETchEDh1Uk9B8mGaDkS7sy4zUkkqUVXcbpBn5rW5EiZE.json'
  );
  umi.use(keypairIdentity(keypair));

  const uri = await uploadJson(umi);

  const collectionMint = await readKeypairFromFile(
    umi,
    '/Users/jnwng/personal/etched/EtCH4rC2dBTBSYcoUvP5HKCPuLhi1ThVfSw13VZMMmyj.json'
  );
  console.info({ collection: collectionMint.publicKey.toString() });
  await createNft(umi, {
    mint: createSignerFromKeypair(umi, collectionMint),
    name: 'Hello, World!',
    uri,
    sellerFeeBasisPoints: percentAmount(0),
  }).sendAndConfirm(umi);
}

main();
