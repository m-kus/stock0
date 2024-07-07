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
        bytes imageHash;
        bytes thumbnailHash;
        bytes manifestCID;
        address payable seller;
        address payable buyer;
        uint256 price;
        ItemStatus status;
    }

    mapping(uint256 => MarketItem) private idToMarketItem;

    event MarketItemCreated(
        uint256 indexed itemId,
        bytes imageHash,
        bytes thumbnailHash,
        bytes manifestCID,
        address seller,
        address buyer,
        uint256 price
    );

    function createMarketItem(
        bytes memory imageHash,
        bytes memory thumbnailHash,
        bytes memory manifestCID,
        uint256 price
    ) public payable nonReentrant {
        require(price > 0, "Price must greater than 0");
        // TODO: verify imageHash & thumbnailHash via Aligned
        // TODO: ensure thumbnail program ID is the same

        _itemIds.increment();
        uint256 itemId = _itemIds.current();
        idToMarketItem[itemId] = MarketItem(
            itemId,
            imageHash,
            thumbnailHash,
            manifestCID,
            payable(msg.sender),
            payable(address(0)),
            price,
            ItemStatus.Available
        );

        emit MarketItemCreated(
            itemId,
            imageHash,
            thumbnailHash,
            manifestCID,
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
        uint256 itemCount = 0;
        uint256 itemIdx = 0;

        for (uint256 i = 0; i < totalItemCount; i++) {
            if (ItemStatus.Available == idToMarketItem[i + 1].status) itemCount += 1;
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
        uint256 itemCount = 0;
        uint256 itemIdx = 0;

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
