import env from '@/components/env'
import isRegisteredShortname from '@/utilities/is-registered-shortname' // Assuming this utility exists
import { isVerifiedAsset } from '@/utilities/is-verified-asset'
import Archive from '../components/archive'
import Asset from '../components/asset'

import type { DasApiAsset } from '@metaplex-foundation/digital-asset-standard-api'
import type { GetStaticPropsResult } from 'next'

export enum RouteType {
  // etched.id/:shortname
  Archive = 'SHORTNAME',
  // etched.id/:shortname/:address
  ShortnameAssetAddress = 'ADDRESS',
  //etched.id/:address
  AssetAddress = 'ASSET_ADDRESS'
  // Take into account `etched.id/:creator-address`
}

// Assuming getAsset and getShortname are implemented elsewhere in your codebase
async function getAsset(pubkey: string): Promise<DasApiAsset | null> {
  // Fetch asset details from the API
  const res = await fetch(env.RPC_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'getAsset',
      params: [pubkey]
    })
  })
  const data = await res.json()

  if (data.error) {
    return null
  }

  const metadata = data.result.content.metadata
  if (!metadata.name || !metadata.description) {
    const contentRes = await fetch(data.result.content.json_uri)
    const {
      name,
      description,
      image
    }: Pick<
      Partial<DasApiAsset['content']['metadata']>,
      'name' | 'description' | 'image'
    > = await contentRes.json()
    data.result = {
      ...data.result,
      content: {
        ...data.result.content,
        metadata: {
          ...data.result.content.metadata,
          name,
          description,
          image
        }
      }
    }
  }
  return data.result as DasApiAsset
}

export const getStaticPaths = () => {
  return { paths: [], fallback: 'blocking' }
}

export async function getStaticProps({
  params: { assetOrShortname }
}: {
  params: { assetOrShortname: string }
}): Promise<GetStaticPropsResult<SolanaMarkdownProps>> {
  // Step 1: Regex match to differentiate patterns
  const shortnameAssetPattern =
    /^(?<shortname>[^.]+\.sol)\/(?<pubkey>[A-Za-z0-9]+)$/
  const shortnamePattern = /^(?<shortname>[^.]+\.sol)$/
  const pubkeyPattern = /^(?<pubkey>[A-Za-z0-9]+)$/
  let pubkey, shortname

  if (assetOrShortname.length === 1) {
    ;[assetOrShortname] = assetOrShortname
  } else if (assetOrShortname.length === 2) {
    assetOrShortname = `${assetOrShortname[0]}/${assetOrShortname[1]}`
  }

  if (shortnameAssetPattern.test(assetOrShortname)) {
    const match = assetOrShortname.match(shortnameAssetPattern)
    shortname = match?.groups?.shortname
    pubkey = match?.groups?.pubkey
  } else if (shortnamePattern.test(assetOrShortname)) {
    const match = assetOrShortname.match(shortnamePattern)
    shortname = match?.groups?.shortname
  } else if (pubkeyPattern.test(assetOrShortname)) {
    const match = assetOrShortname.match(pubkeyPattern)
    pubkey = match?.groups?.pubkey
  } else {
    // Handle invalid input
    console.error('Url not matched, rendering notFound', assetOrShortname)
    return { notFound: true }
  }

  if (!pubkey) {
    if (!shortname) {
      return { notFound: true }
    } else {
      const { verified: isShortnameRegistered, shortname: foundShortname } =
        await isRegisteredShortname({ domainName: shortname })
      return {
        props: {
          shortname: foundShortname!,
          shortnameRegistered: isShortnameRegistered,
          routeType: RouteType.Archive
        }
      }
    }
  }

  // Step 2: Fetch the asset using the pubkey
  const asset = await getAsset(pubkey)
  if (!asset) {
    return { notFound: true }
  }

  const {
    ownership: { owner: author }
  } = asset

  const verifiedAsset = isVerifiedAsset(asset)

  // Step 3: Get shortname from owner address and redirect based on verification
  const { verified: isShortnameRegistered } = await isRegisteredShortname({
    publicKeyStr: author
  })

  if (verifiedAsset) {
    if (isShortnameRegistered) {
      if (shortname && assetOrShortname === `${shortname}/${pubkey}`) {
        return {
          props: {
            asset,
            shortnameRegistered: true,
            routeType: RouteType.ShortnameAssetAddress
          }
        }
      } else {
        return {
          props: {
            asset,
            shortnameRegistered: true,
            routeType: RouteType.ShortnameAssetAddress
          },
          redirect: {
            destination: `/${shortname}/${pubkey}`,
            permanent: false
          }
        }
      }
    } else {
      if (shortname && pubkey) {
        return {
          props: {
            asset,
            shortnameRegistered: false,
            routeType: RouteType.AssetAddress
          },
          redirect: {
            destination: `/${pubkey}`,
            permanent: false
          }
        }
      } else {
        return {
          props: {
            asset,
            shortnameRegistered: false,
            routeType: RouteType.AssetAddress
          }
        }
      }
    }
  } else {
    if (shortname) {
      // May be redundant
      return {
        props: {
          shortname,
          routeType: RouteType.Archive,
          shortnameRegistered: isShortnameRegistered
        }
      }
    } else {
      return {
        props: {
          asset,
          routeType: RouteType.AssetAddress,
          assetVerified: false
        }
      }
    }
  }
}

type AssetAddressProps = {
  routeType: RouteType.AssetAddress | RouteType.ShortnameAssetAddress
  asset: DasApiAsset
  assetVerified?: boolean
  shortnameRegistered?: boolean
}

type ArchiveProps = {
  routeType: RouteType.Archive
  shortname: string
  shortnameRegistered: boolean
}

type SolanaMarkdownProps = AssetAddressProps | ArchiveProps
const AddressPage = (props: SolanaMarkdownProps) => {
  const { routeType } = props

  // We don't currently support arbitrary address archives
  if (routeType === RouteType.Archive) {
    const { shortname, shortnameRegistered } = props
    return (
      <Archive
        address={shortname!}
        routeType={routeType}
        shortnameRegistered={shortnameRegistered!}
      />
    )
  }

  if (
    routeType === RouteType.AssetAddress ||
    routeType === RouteType.ShortnameAssetAddress
  ) {
    const { asset } = props
    return <Asset asset={asset} />
  }

  // TODO(jon): Figure out notFound,
}

export default AddressPage
