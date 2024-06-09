import { toNano, beginCell, Cell, Slice  } from "@ton/ton";
import {
    Blockchain,
    SandboxContract,
    TreasuryContract,
    printTransactionFees,
    prettyLogTransactions,
} from "@ton/sandbox";
import "@ton/test-utils";
import { printSeparator } from "./utils/print";
import { DealsNftCollection, RoyaltyParams, loadLogEventMintRecord } from "./output/sample_DealsNftCollection";
import { DealNftItem } from "./output/sample_DealNftItem";


describe("DealsNftCollection Contract", () => {
    const OFFCHAIN_CONTENT_PREFIX = 0x01;
    const string_first = "https://s.getgems.io/nft-staging/c/628f6ab8077060a7a8d52d63/";
    let newContent = beginCell().storeInt(OFFCHAIN_CONTENT_PREFIX, 8).storeStringRefTail(string_first).endCell();

    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let seller: SandboxContract<TreasuryContract>;
    let buyer: SandboxContract<TreasuryContract>;
    let collection: SandboxContract<DealsNftCollection>;

    beforeAll(async () => {
        blockchain = await Blockchain.create();
        deployer = await blockchain.treasury("deployer");
        seller = await blockchain.treasury("seller");
        buyer = await blockchain.treasury("buyer");
        console.log("Deployer Address: ", deployer.address);
        console.log("Seller   Address: ", seller.address);
        console.log("Buyer    Address: ", buyer.address);
        console.log("Deployer balance: ", await deployer.getBalance());
        console.log("Seller balance:   ", await seller.getBalance());
        console.log("Buyer balance:    ", await buyer.getBalance());

        let royaltiesParam: RoyaltyParams = {
            $$type: "RoyaltyParams",
            numerator: 350n, // 35%
            denominator: 1000n, // 100%
            destination: deployer.address,
        };

        collection = blockchain.openContract(
            await DealsNftCollection.fromInit(deployer.address, newContent, royaltiesParam)
        );

        let individualContent = beginCell().storeInt(OFFCHAIN_CONTENT_PREFIX, 8).storeStringRefTail(string_first).endCell()
        let amount = toNano('1');
        const deploy_result = await collection.send(
            deployer.getSender(), 
            { value: toNano("0.05") }, 
            {
                $$type: 'Mint',
                individual_content: individualContent,
                amount: amount,
            }
        );
        expect(deploy_result.transactions).toHaveTransaction({
            from: deployer.address,
            to: collection.address,
            deploy: true,
            success: true,
        });
        let collectionData = await collection.getGetCollectionData();
        expect(collectionData.owner_address.toString()).toBe(deployer.address.toString());
    });

    it("should mint a new NFT with tokenId=1 correctly", async () => {
        let individual_content = beginCell().storeStringTail("new_content").endCell();
        let amount = toNano('0.3');
        let collectionDataBefore = await collection.getGetCollectionData();
        let next_item_index_before = collectionDataBefore.next_item_index;
        let deployerBalanceBefore = await deployer.getBalance();
        let sellerBalanceBefore = await seller.getBalance();
        const mint_result = await collection.send(
            seller.getSender(), 
            { value: toNano('0.1') }, 
            {
                $$type: 'Mint',
                individual_content: individual_content,
                amount: amount,
            }
        );

        let collectionDataAfter = await collection.getGetCollectionData();
        let next_item_index_after = collectionDataAfter.next_item_index;
        let deployerBalanceAfter = await deployer.getBalance();
        let sellerBalanceAfter = await seller.getBalance();
        expect(next_item_index_after).toEqual(next_item_index_before + 1n);
        expect(mint_result.transactions).toHaveTransaction({
            from: seller.address,
            to: collection.address,
            success: true,
        });

        let next_item_index = (await collection.getGetCollectionData()).next_item_index;
        expect(next_item_index).toEqual(2n);
    });

    it("should buy an NFT with tokenId=1 correctly", async () => {
        let item_index = 1n;
        let deployerBalanceBefore = await deployer.getBalance();
        let buyerBalanceBefore = await buyer.getBalance();
        let sellerBalanceBefore = await seller.getBalance();
        let msgValue = toNano('0.5');
        const buy_result = await collection.send(
            buyer.getSender(), 
            { value: msgValue }, 
            {
                $$type: 'Buy',
                item_index: item_index,
            }
        );
        let deployerBalanceAfter = await deployer.getBalance();
        let buyerBalanceAfter = await buyer.getBalance();
        let sellerBalanceAfter = await seller.getBalance();
        console.log('deployerBalanceBefore: ', deployerBalanceBefore)
        console.log('deployerBalanceAfter:  ', deployerBalanceAfter)
        console.log('buyerBalanceBefore:  ', buyerBalanceBefore)
        console.log('buyerBalanceAfter:   ', buyerBalanceAfter)
        console.log('sellerBalanceBefore: ', sellerBalanceBefore)
        console.log('sellerBalanceAfter:  ', sellerBalanceAfter)
        expect(buy_result.transactions).toHaveTransaction({
            from: buyer.address,
            to: collection.address,
            success: true,
        });

        let nft_address = await collection.getGetNftAddressByIndex(item_index);
        let nft_contract = blockchain.openContract(DealNftItem.fromAddress(nft_address!!));
        let nftData = await nft_contract.getGetNftData()
        console.log(nftData)
        let sellerStored = await nft_contract.getGetSeller();
        let buyerStored = await nft_contract.getGetBuyer();
        let amountStored = await nft_contract.getGetAmount();

        console.log("Seller: ", sellerStored);
        console.log("Buyer: ", buyerStored);
        console.log("Amount: ", amountStored);

        if (sellerStored !== null) {
            expect(sellerStored.toString()).toEqual(seller.address.toString());
        }
        if (buyerStored !== null) {
            expect(buyerStored.toString()).toEqual(buyer.address.toString());
        }
        if (amountStored !== null) {
            expect(amountStored.toString()).toEqual(toNano('0.3').toString());
        }
    });

    it("should transfer NFT with tokenId=1 from buyer to deployer", async () => {
        let item_index = 1n;
        let nft_address = await collection.getGetNftAddressByIndex(item_index)!!;
        let nft_contract = blockchain.openContract(DealNftItem.fromAddress(nft_address!!));

        // Transfer NFT from buyer to deployer
        const transfer_result = await nft_contract.send(
            buyer.getSender(), 
            { value: toNano('0.1') }, 
            {
                $$type: 'Transfer',
                query_id: 0n,
                new_owner: deployer.address,
                response_destination: null,
                custom_payload: null,
                forward_amount: 0n,
                forward_payload: beginCell().endCell(),
            }
        );

        expect(transfer_result.transactions).toHaveTransaction({
            from: buyer.address,
            // to: nft_address,
            success: true,
        });

        let newNftData = await nft_contract.getGetNftData();
        console.log(newNftData)
        expect(newNftData.owner_address.toString()).toBe(deployer.address.toString())
      
    });
});