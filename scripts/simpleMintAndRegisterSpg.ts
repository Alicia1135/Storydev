import { CreateIpAssetWithPilTermsResponse, IpMetadata, PIL_TYPE, StoryClient, StoryConfig } from '@story-protocol/core-sdk'
import { http } from 'viem'
import { RPCProviderUrl, SPGNFTContractAddress, account } from './utils/utils'
import { uploadJSONToIPFS } from './utils/uploadToIpfs'
import { createHash } from 'crypto'

// BEFORE YOU RUN THIS FUNCTION: Make sure to read the README
// which contains instructions for running this "Simple Mint and Register SPG" example.

const main = async function () {
    // 1. Set up your Story Config
    //
    // Docs: https://docs.story.foundation/docs/typescript-sdk-setup
    const config: StoryConfig = {
        account: account,
        transport: http(process.env.RPC_PROVIDER_URL),
        chainId: 'odyssey',
    }
    const client = StoryClient.newClient(config)

    // 2. Set up your IP Metadata
    //
    // Docs: https://docs.story.foundation/docs/ipa-metadata-standard
    const ipMetadata: IpMetadata = client.ipAsset.generateIpMetadata({
            title: "MY IP ASSET NFT",
            description: "Sample of my NFT",
            attributes: [
              {
                key: "Creator Name",
                value: "Damien Hirst"
              },
              {
                key: "Creator Description",
                value: "Damien Hirst, a poster boy for the Young British Artists who rose to prominence in late 1980s London..."
              },
              {
                key: "Creator Instagram",
                value: "https://www.instagram.com/damienhirst/"
              },
              {
                key: "Creator Wikipedia",
                value: "https://en.wikipedia.org/wiki/Damien_Hirst"
              },
              {
                key: "Materials",
                value: "Etching on Hahnemühle paper"
              },
              {
                key: "Size",
                value: "45 1/10 x 44 3/10 in | 114.5 x 112.5 cm"
              },
              {
                key: "Edition",
                value: "Edition of 68"
              },
              {
                key: "Signature",
                value: "Hand-signed by artist, Signed and numbered by the artist"
              },
              {
                key: "Certificate of authenticity",
                value: "link_to_certificate"
              }
            ]
    })

    // 3. Set up your NFT Metadata
    //
    // Docs: https://eips.ethereum.org/EIPS/eip-721
    const nftMetadata = {
        name: 'NFT representing ownership of IP Asset',
        description: 'This NFT represents ownership of an IP Asset',
        image: 'https://picsum.photos/200',
    }

    // 4. Upload your IP and NFT Metadata to IPFS
    const ipIpfsHash = await uploadJSONToIPFS(ipMetadata)
    const ipHash = createHash('sha256').update(JSON.stringify(ipMetadata)).digest('hex')
    const nftIpfsHash = await uploadJSONToIPFS(nftMetadata)
    const nftHash = createHash('sha256').update(JSON.stringify(nftMetadata)).digest('hex')

    // 5. Register the NFT as an IP Asset
    //
    // Docs: https://docs.story.foundation/docs/attach-terms-to-an-ip-asset#mint-nft-register-as-ip-asset-and-attach-terms
    const response: CreateIpAssetWithPilTermsResponse = await client.ipAsset.mintAndRegisterIpAssetWithPilTerms({
        spgNftContract: SPGNFTContractAddress,
        pilType: PIL_TYPE.NON_COMMERCIAL_REMIX,
        ipMetadata: {
            ipMetadataURI: `https://ipfs.io/ipfs/${ipIpfsHash}`,
            ipMetadataHash: `0x${ipHash}`,
            nftMetadataURI: `https://ipfs.io/ipfs/${nftIpfsHash}`,
            nftMetadataHash: `0x${nftHash}`,
        },
        txOptions: { waitForTransaction: true },
    })
    console.log(`Root IPA created at transaction hash ${response.txHash}, IPA ID: ${response.ipId}`)
    console.log(`View on the explorer: https://odyssey.explorer.story.foundation/ipa/${response.ipId}`)
}

main()
