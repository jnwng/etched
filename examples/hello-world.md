# Etched: Writing that Endures

Your best ideas should endure the test of time. Companies shutter, preferences change: no matter what, you should own what you create. We looked around the web and saw an internet where platforms own our work, so we created Etched to put tools back in the hands of creators.

Etched is a simple and elegant way to create, own, and share your writing, backed by the most durable source of data on the internet: the Solana blockchain. Here’s how it works today:

1. Use your own tools to write using Markdown,
2. Publish your writing on-chain using your favorite NFT creation tool of choice
3. Use Etched to deep link to your work and get beautiful social embeds, SEO, annotations, and more!

We have a few operating principles that guide the development of Etched:

- **Own what you create** Everything displayed through Etched is owned by its author via NFTs. If Etched went away tomorrow, your writing would still be yours to use as you wish, unlike basically every other platform out there.
- **Trust, but verify**: While the blockchain is permissionless, displaying work on Etched requires the author to opt-in to ensure maximum authenticity and provenance.
- **Increase interoperability; reduce lock-in.** Bring your own shortnames, your own writing, even self-host if you want to—Etched glues it all together.

Our vision for Etched goes beyond a read-only experience. Readers will be able to bookmark and annotate the pieces that move them, creating a conversation between writers and readers. We envision communities of practice learning together by reading, responding, and building off of each other’s thoughts. Like a dogeared used book, our writing will become living documents that grow with every new reader.

Rather than let perfection be the enemy of done, we’re sharing what we’ve built to-date as early as possible. Etched doesn’t have an easy way to create content (yet), doesn’t have a way to login (yet), and isn’t particularly beautiful (yet). Still, we’re excited to share what we’ve got; we’re building in public on [GitHub](https://github.com/jnwng/etched), and you can join us on our journey today:

- **Register yourself for Etched by assigning a subdomain of any domain you own to Etched**
  - E.g., `etched.jnwng.sol` -> `[etched.id/jnwng.sol](etched.id/jnwng.sol)`. This verifies your account, and automatically enables any writing NFTs to be displayed through Etched.
- **Start writing!**
  - Etched supports CommonMark + Github Flavored Markdown ([GFM](https://github.github.com/gfm/)).
  - Anything you write in those formats and attached to a Solana NFT can be displayed on Etched. Offchain JSON follows the [Metaplex Non-Fungible Standard](https://developers.metaplex.com/token-metadata/token-standard#the-non-fungible-standard) schema
  - Writing content should be placed as the value in the `description` field. See an example [here](https://github.com/jnwng/etched/blob/e15b9adbf4f6120fcc39c25701834a50f6ee564a/examples/create-nft.ts#L54-L59).
  - Minting the NFT is an exercise left to the reader, although basic tools will soon be provided.

We value your feedback and any ideas you might have to better progress the sharing of knowledge onchain. Follow us on [X](https://x.com/_etched), and submit feature requests on [GitHub](https://github.com/jnwng/etched), where we’re building Etched in public. See you onchain!
