// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "hardhat/console.sol";

contract Market is ReentrancyGuard {
    using Counters for Counters.Counter;
    Counters.Counter private _itemIds;
    uint256 private _thumbnailProgramId;
    uint256 private _envelopeProgramId;

    constructor(uint256 thumbnailProgramId, uint256 envelopeProgramId) {
        _thumbnailProgramId = thumbnailProgramId;
        _envelopeProgramId = envelopeProgramId;
    }

    enum ItemStatus {
        Available,
        InEscrow,
        Sold
    }

    struct MarketItem {
        uint256 itemId;
        uint256 originalDataHash;
        uint256 thumbnailMultihash;
        bytes c2paManifest;
        address payable seller;
        address payable buyer;
        uint256 price;
        ItemStatus status;
    }

    mapping(uint256 => MarketItem) private idToMarketItem;

    event MarketItemCreated(
        uint256 indexed itemId,
        uint256 originalDataHash,
        uint256 thumbnailMultihash,
        bytes c2paManifest,
        address seller,
        address buyer,
        uint256 price
    );

    function createMarketItem(
        uint256 originalDataHash,
        uint256 thumbnailMultihash,
        bytes memory c2paManifest,
        uint256 price
    ) public payable nonReentrant {
        require(price > 0, "Price must greater than 0");
        // TODO: verify originalDataHash & thumbnailMultihash via Aligned
        // TODO: ensure thumbnail program ID is the same

        _itemIds.increment();
        uint256 itemId = _itemIds.current();
        idToMarketItem[itemId] = MarketItem(
            itemId,
            originalDataHash,
            thumbnailMultihash,
            c2paManifest,
            payable(msg.sender),
            payable(address(0)),
            price,
            ItemStatus.Available
        );

        emit MarketItemCreated(
            itemId,
            originalDataHash,
            thumbnailMultihash,
            c2paManifest,
            payable(msg.sender),
            payable(address(0)),
            price
        );
    }

    function purchaseMarketItem(uint256 itemId) public payable nonReentrant {
        uint256 price = idToMarketItem[itemId].price;
        require(idToMarketItem[itemId].status == ItemStatus.Available);
        require(
            msg.value == price,
            "Please submit the asking price in order to complete the purchase"
        );

        idToMarketItem[itemId].buyer = payable(msg.sender);
        idToMarketItem[itemId].status = ItemStatus.InEscrow;
    }

    function deliverMarketItem(uint256 itemId) public nonReentrant() {
        require(idToMarketItem[itemId].status == ItemStatus.InEscrow);
        // TODO: verify that blob was included in Celestia block
        // TODO: verify that proof receipt contains the same blob commitment and buyer's public key
        // TODO: ensure emvelope program ID is the same
        idToMarketItem[itemId].seller.transfer(idToMarketItem[itemId].price);
        idToMarketItem[itemId].status = ItemStatus.Sold;
    }

    function fetchAvailableItems() public view returns (MarketItem[] memory) {
        uint256 totalItemCount = _itemIds.current();
        uint256 itemCount;
        uint256 itemIdx;

        for (uint256 i = 0; i < totalItemCount; i++) {
            if (idToMarketItem[i + 1].status == ItemStatus.Available) itemCount += 1;
        }

        MarketItem[] memory items = new MarketItem[](itemCount);

        for (uint256 i = 0; i < itemCount; i++) {
            if (idToMarketItem[i + 1].status == ItemStatus.Available) {
                uint itemId = idToMarketItem[i + 1].itemId;
                MarketItem memory item = idToMarketItem[itemId];
                items[itemIdx] = item;
                itemIdx += 1;
            }
        }

        return items;
    }

    function fetchMyItems() public view returns (MarketItem[] memory) {
        uint256 totalItemCount = _itemIds.current();
        uint256 itemCount;
        uint256 itemIdx;

        for (uint256 i; i < totalItemCount; i++) {
            if (msg.sender == idToMarketItem[i + 1].seller || msg.sender == idToMarketItem[i + 1].buyer) itemCount += 1;
        }

        MarketItem[] memory items = new MarketItem[](itemCount);

        for (uint256 i = 0; i < itemCount; i++) {
            if (msg.sender == idToMarketItem[i + 1].seller || msg.sender == idToMarketItem[i + 1].buyer) {
                uint itemId = idToMarketItem[i + 1].itemId;
                MarketItem memory item = idToMarketItem[itemId];
                items[itemIdx] = item;
                itemIdx += 1;
            }
        }

        return items;
    }
}
