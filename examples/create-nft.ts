import {
  Signer,
  Umi,
  createSignerFromKeypair,
  generateSigner,
  keypairIdentity,
  percentAmount,
  transactionBuilder,
} from '@metaplex-foundation/umi';
import { createNft } from '@metaplex-foundation/mpl-token-metadata';
import fs from 'fs/promises';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { mplToolbox } from '@metaplex-foundation/mpl-toolbox';
import { nftStorageUploader } from '@metaplex-foundation/umi-uploader-nft-storage';
import { program } from 'commander';
import {
  ComputeBudgetInstruction,
  ComputeBudgetProgram,
} from '@solana/web3.js';
import { fromWeb3JsInstruction } from '@metaplex-foundation/umi-web3js-adapters';

function parseArgumentsIntoOptions() {
  program
    .option('--markdownFilePath <path>', 'Path to the markdown file')
    .option('--keypairFilePath <path>', 'Path to the keypair file')
    .option('--mintFilePath <path>', 'Path to the mint file')
    .option('--title <title>', 'Title of the NFT', 'Hello, World!') // Default title
    .option(
      '--image <url>',
      'Image URL of the NFT',
      'https://nftstorage.link/ipfs/bafybeigbhoe7436f2ieudxxw6a6ktg37xcrgf4b7iqol4uefnkaa42pdem'
    ); // Default image

  program.parse(process.argv);

  const options = program.opts();

  return {
    markdownFilePath: options.markdownFilePath,
    keypairFilePath: options.keypairFilePath,
    mintFilePath: options.mintFilePath,
    title: options.title,
    image: options.image,
  };
}

async function readKeypairFromFile(
  umi: Umi,
  filePath: string
): Promise<Signer> {
  const fileData = await fs.readFile(filePath, 'utf-8');
  const secretKey = new Uint8Array(JSON.parse(fileData));
  return createSignerFromKeypair(
    umi,
    umi.eddsa.createKeypairFromSecretKey(secretKey)
  );
}

const uploadJson = async (umi, markdownFilePath, title, image) => {
  const uri = await umi.uploader.uploadJson({
    name: title,
    symbol: 'ETCHED',
    description: await fs.readFile(markdownFilePath, 'utf-8'),
    image: image,
  });
  console.info({ uri });
  return uri;
};

async function main() {
  const options = parseArgumentsIntoOptions();
  if (!options.markdownFilePath) {
    console.error('Error: Markdown file path is required.');
    process.exit(1);
  }

  const umi = createUmi(process.env.RPC_ENDPOINT as string);

  umi.use(nftStorageUploader({ token: process.env.NFT_STORAGE_API_KEY! }));
  umi.use(mplToolbox());

  let keypair;
  if (options.keypairFilePath) {
    keypair = await readKeypairFromFile(umi, options.keypairFilePath);
  } else {
    keypair = generateSigner(umi);
  }
  umi.use(keypairIdentity(keypair));

  const uri = await uploadJson(
    umi,
    options.markdownFilePath,
    options.title,
    options.image
  );

  const mint = options.mintFilePath
    ? await readKeypairFromFile(umi, options.mintFilePath)
    : generateSigner(umi);
  console.info(`Minting ${mint.publicKey.toString()}`);
  await createNft(umi, {
    mint,
    name: options.title,
    uri,
    sellerFeeBasisPoints: percentAmount(0),
  })
    .prepend(
      transactionBuilder([
        {
          instruction: fromWeb3JsInstruction(
            ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1000 })
          ),
          signers: [keypair],
          bytesCreatedOnChain: 0,
        },
      ])
    )
    .sendAndConfirm(umi);
  console.info(`Finished minting ${mint.publicKey.toString()}`);
}

main();
