import "./message.tact";
const minTonsForStorage: Int = ton("0.02");
const gasConsumption: Int = ton("0.02");

message SetMintFee {
    newMintFee: Int as coins;
}

message SetBuyFee {
    newBuyFee: Int as coins;
}

message Mint {
    individual_content: Cell;   // any item info
    amount: Int as coins;       // amount of TON
}

message Buy {
    item_index: Int as uint256;
}

message InternalBuy {
    item_index: Int as uint256;
    buyer: Address;
}

message Deal {
    item_index: Int as uint256;
}

struct DealData {
    seller: Address?;
    amount: Int? as coins;
    buyer: Address?;
}

message GetDealData {

}

message ReceiveDealData {
    item_index: Int;
    seller: Address?;
    amount: Int? as coins;
    buyer: Address?;
}

message PayToSeller {
    item_index: Int;
    refund_address: Address;
}

contract DealsNftCollection {

    next_item_index: Int as uint256 = 0;
    owner_address: Address;
    royalty_params: RoyaltyParams?;
    collection_content: Cell;

    mintFee: Int as coins;
    buyFee: Int as coins;

    init(owner_address: Address, collection_content: Cell, royalty_params: RoyaltyParams){
        self.owner_address = owner_address;
        self.collection_content = collection_content;
        self.royalty_params = royalty_params;
        self.mintFee = ton("0.01");
        self.buyFee = ton("0.01");
    }

    receive(msg: SetMintFee) {
        require(context().sender == self.owner_address, "new mint commission can be set only by owner");
        self.mintFee = msg.newMintFee;
    }

    receive(msg: SetBuyFee) {
        require(context().sender == self.owner_address, "new buy commission can be set only by owner");
        self.buyFee = msg.newBuyFee;
    }

    receive(msg: Mint){
        let ctx: Context = context(); // get sender Info
        let msgValue: Int = ctx.value;
        let tonBalanceBeforeMsg: Int = myBalance() - msgValue;
        let storageFee: Int = minTonsForStorage - min(tonBalanceBeforeMsg, minTonsForStorage);
        msgValue = msgValue - (storageFee + gasConsumption + self.mintFee);
        let item_index: Int = self.next_item_index;
        let nft_init: StateInit = self.getNftItemInit(item_index);
        let sender: Address = ctx.sender;
        let customPayload: Cell = beginCell()
            .storeCoins(msg.amount)           // Store amount of TON
            .storeRef(msg.individual_content) // Store a reference to another cell
            .endCell();

        send(SendParameters{
            to: contractAddress(nft_init), 
            value: msgValue, 
            bounce: false,
            mode: SendIgnoreErrors,
            body: Transfer {
                query_id: 0,
                new_owner: sender,
                response_destination: self.owner_address,
                custom_payload: customPayload,
                forward_amount: 0,
                forward_payload: emptySlice()
            }.toCell(),
            code: nft_init.code,
            data: nft_init.data
        });
        send(SendParameters{
            to: self.owner_address,
            value: self.mintFee,
            bounce: false,
            mode: SendIgnoreErrors,
            body: emptyCell(),
        });

        self.next_item_index = self.next_item_index + 1;

        emit(LogEventMintRecord{ item_index: item_index, seller: sender, itemInfo: msg.individual_content, amount: msg.amount }.toCell());
    }

    receive(msg: Buy){
        let ctx: Context = context(); // get sender Info
        let msgValue: Int = ctx.value;
        let tonBalanceBeforeMsg: Int = myBalance() - msgValue;
        let storageFee: Int = minTonsForStorage - min(tonBalanceBeforeMsg, minTonsForStorage);
        msgValue = msgValue - (storageFee + gasConsumption + self.buyFee);

        let item_index: Int = msg.item_index;
        let item_address: Address = self.get_nft_address_by_index(item_index)!!;

        let buyer: Address = ctx.sender;
        
        /// make a payment to seller
        send(SendParameters{
            to: item_address,
            value: msgValue,
            mode: SendIgnoreErrors,
            body: PayToSeller {
                item_index: item_index,
                refund_address: ctx.sender,
            }.toCell(),
        });

        /// transfer NFT to buyer
        send(SendParameters{
            to: item_address,
            value: gasConsumption,
            bounce: false,
            mode: SendIgnoreErrors,
            body: InternalBuy {
                item_index: item_index,
                buyer: buyer,
            }.toCell(),
        });

        /// pay fee to owner
        send(SendParameters{
            to: self.owner_address,
            value: self.buyFee,
            bounce: false,
            mode: SendIgnoreErrors,
            body: emptyCell(),
        });
    }

    receive(msg: GetRoyaltyParams) {   
        let ctx: Context = context(); // get sender Info
        send(SendParameters{
            to: ctx.sender,
            value: 0,
            mode: 64, 
            bounce: false,
            body: ReportRoyaltyParams {
                query_id: msg.query_id,
                numerator:  (self.royalty_params!!).numerator,
                denominator: (self.royalty_params!!).denominator,
                destination: self.owner_address
            }.toCell()
        });        
    }

    // ------------------ Get Function  ------------------ //
    get fun get_collection_data(): CollectionData {     
        let b: StringBuilder = beginString();
        let collectionDataString: String = self.collection_content.asSlice().asString();
        b.append(collectionDataString);
        b.append("meta.json"); // You can changed this your self.
        return CollectionData{
            next_item_index: self.next_item_index, 
            collection_content: b.toCell(), 
            owner_address: self.owner_address
        };
    }

    get fun get_nft_address_by_index(item_index: Int): Address?{      
        let initCode: StateInit = self.getNftItemInit(item_index);
        return contractAddress(initCode);
    }

    get fun getNftItemInit(item_index: Int): StateInit {
        return initOf DealNftItem(myAddress(), item_index);
    }
    
    get fun get_nft_content(index: Int, individual_content: Cell): Cell { 
        let b: StringBuilder = beginString();
        let ic: String = individual_content.asSlice().asString();
        b.append(ic);
        return b.toCell();
    }

    get fun royalty_params(): RoyaltyParams {
        return self.royalty_params!!;
    }

    get fun getMintFee(): Int {
        return self.mintFee;
    }

    get fun getBuyFee(): Int {
        return self.buyFee;
    }
}

contract DealNftItem {
    collection_address: Address;
    item_index: Int; 
    is_initialized: Bool;

    owner: Address?;
    individual_content: Cell?;

    seller: Address?;
    amount: Int? as coins;
    buyer: Address?;

    init(collection_address: Address, item_index: Int){
        require(sender() == collection_address, "not from collection");
        self.collection_address = collection_address;
        self.item_index = item_index;
        self.is_initialized = false;
    }

    receive(msg: Transfer){
        let ctx: Context = context(); // Reference: https://docs.tact-lang.org/language/ref/common#context
        let msgValue: Int = self.msgValue(ctx.value);
        
        if (self.is_initialized == false) {  // Initial Transfer, aka the "Minting" of the NFT
            require(ctx.sender == self.collection_address, "initialized tx need from collection");
            self.is_initialized = true;
            self.owner = msg.new_owner;
            self.seller = msg.new_owner; // the seller mints the NFT
            
            let customPayloadSlice: Slice =  msg.custom_payload!!.asSlice();
            let amount: Int = customPayloadSlice.loadCoins();
            let individual_content: Cell = customPayloadSlice.loadRef();
            
            self.amount = amount;
            self.individual_content = individual_content;

            send(SendParameters{
                to: msg.response_destination!!,
                value: msgValue,
                mode: SendPayGasSeparately,
                body: Excesses { query_id: msg.query_id }.toCell()
            });
        } else {
            require(self.seller != null || self.buyer != null, "not finished deal");
            require(ctx.sender == self.owner!!, "not owner");
            self.owner = msg.new_owner;  // change current owner to the new_owner
            if (msg.forward_amount > 0) {
                send(SendParameters{
                    to: msg.new_owner,
                    value: msg.forward_amount,
                    mode:  SendPayGasSeparately, 
                    bounce: true,
                    body: OwnershipAssigned{
                        query_id: msg.query_id,
                        prev_owner: ctx.sender,
                        forward_payload: msg.forward_payload
                    }.toCell()
                }); 
            }

            msgValue = msgValue - ctx.readForwardFee(); 
            if (msg.response_destination != null) { 
                send(SendParameters{ 
                    to: msg.response_destination!!,
                    value: msgValue - msg.forward_amount,
                    mode: SendPayGasSeparately,
                    bounce: true,
                    body: Excesses { query_id: msg.query_id }.toCell()
                });
            } 
        }
    }

    receive(msg: InternalBuy) {
        require(msg.item_index == self.item_index, "not this NFT item");
        require(sender() == self.collection_address, "only internal call");
        self.owner = msg.buyer;
        self.buyer = msg.buyer;
    }
    
    receive(msg: GetStaticData){ 
        let ctx: Context = context();
        send(SendParameters {
            to: ctx.sender,
            value: 0,
            mode: 64,  // (return msg amount except gas fees) 
            bounce: true,
            body: ReportStaticData{
                query_id: msg.query_id,
                index_id: self.item_index,
                collection: self.collection_address
            }.toCell()
        });
    }

    receive(msg: PayToSeller) {
        let ctx: Context = context();
        
        require(self.buyer == null, "already paid");
        require(ctx.sender == self.collection_address, "not collection");
        require(ctx.value >= self.amount!! + gasConsumption, "not enought TON");
        
        send(SendParameters{
            to: self.seller!!,
            value: self.amount!!,
            mode: SendIgnoreErrors,
            body: emptyCell(),
        });
        let refund_value: Int = ctx.value - self.amount!!;
        send(SendParameters{
            to: msg.refund_address,
            value: refund_value,
            mode: SendIgnoreErrors,
            body: emptyCell(),
        });
    }

    receive(msg: GetDealData) {
        let ctx: Context = context();
        send(SendParameters{
            to: ctx.sender,
            value: 0,
            mode: 64,
            body: ReceiveDealData{
                item_index: self.item_index,
                seller: self.seller,
                amount: self.amount,
                buyer: self.buyer,
            }.toCell()
        });
    }

    get fun msgValue(value: Int): Int {
        let tonBalanceBeforeMsg: Int = myBalance() - value;
        let storageFee: Int = minTonsForStorage - min(tonBalanceBeforeMsg, minTonsForStorage);
        return value - (storageFee + gasConsumption);
    }

    get fun getSeller(): Address? {
        return self.seller!!;
    }

    get fun getAmount(): Int? {
        return self.amount!!;
    }

    get fun getBuyer(): Address? {
        return self.buyer!!;
    }

    get fun dealData(): DealData {
        return DealData{
            seller: self.seller!!,
            amount: self.amount!!,
            buyer: self.buyer!!,
        };
    }

    // --------- Get Function  --------- //
    get fun get_nft_data(): GetNftData {
        let b: StringBuilder = beginString();
        let collectionData: String = (self.individual_content!!).asSlice().asString();
        b.append(collectionData);
        b.append(self.item_index.toString());
        b.append(".json");

        return GetNftData {
            is_initialized: self.is_initialized, 
            index: self.item_index, 
            collection_address: self.collection_address, 
            owner_address: self.owner!!,
            individual_content: b.toCell()
        };
    }
}
