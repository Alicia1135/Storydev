import { AddressZero, IpMetadata, PIL_TYPE, RegisterIpAndAttachPilTermsResponse, StoryClient, StoryConfig } from '@story-protocol/core-sdk'
import { http } from 'viem'
import { mintNFT } from './utils/mintNFT'
import { NFTContractAddress, RPCProviderUrl, account } from './utils/utils'
import { uploadJSONToIPFS } from './utils/uploadToIpfs'
import { createHash } from 'crypto'
import { Account, privateKeyToAccount, Address } from 'viem/accounts';
import { toHex } from 'viem';

// BEFORE YOU RUN THIS FUNCTION: Make sure to read the README which contains
// instructions for running this "Simple Mint and Register" example.

const main = async function () {
    const privateKey: Address = `0x${process.env.WALLET_PRIVATE_KEY}`;
    const account: Account = privateKeyToAccount(privateKey);

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
        title: "Kenta the Samurai Azuki",
        description: "An amazing IP asset by creators Kaiser and Azuki.",
        attributes: [
            { key: "Creator 1 Name", value: "Kaiser" },
            { key: "Creator 1 Bio", value: "Kaiser is an anime enthusiast." },
            { key: "Creator 1 Twitter", value: "https://twitter.com/kentathesamurai" },
            { key: "Creator 2 Name", value: "Azuki" },
            { key: "Creator 2 Bio", value: "Creator of Azuki collection" },
            { key: "Rarity", value: "Legendary" }
        ]
    })
    
    const nftMetadata = {
        name: 'NFT representing ownership of IP Asset',
        description: 'This NFT represents ownership of an IP Asset',
        image: 'https://i.imgur.com/gb59b2S.png',
    }

    // 4. Upload your IP and NFT Metadata to IPFS
    const ipIpfsHash = await uploadJSONToIPFS(ipMetadata)
    const ipHash = createHash('sha256').update(JSON.stringify(ipMetadata)).digest('hex')
    const nftIpfsHash = await uploadJSONToIPFS(nftMetadata)
    const nftHash = createHash('sha256').update(JSON.stringify(nftMetadata)).digest('hex')

    // 5. Mint an NFT
    const tokenId = await mintNFT(account.address, `https://ipfs.io/ipfs/${nftIpfsHash}`)
    console.log(`NFT minted with tokenId ${tokenId}`)

    // 6. Register an IP Asset
    //
    // Docs: https://docs.story.foundation/docs/attach-terms-to-an-ip-asset#register-new-ip-asset-and-attach-license-terms
    const response: RegisterIpAndAttachPilTermsResponse = await client.ipAsset.registerIpAndAttachPilTerms({
        nftContract: NFTContractAddress,
        tokenId: tokenId!,
        pilType: PIL_TYPE.NON_COMMERCIAL_REMIX,
        mintingFee: 0, // empty - doesn't apply
        currency: AddressZero, // empty - doesn't apply
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