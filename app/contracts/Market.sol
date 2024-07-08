// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "hardhat/console.sol";

contract Market is ReentrancyGuard {
    using Counters for Counters.Counter;
    Counters.Counter private _itemIds;
    bytes32 private _thumbnailProgramId;
    bytes32 private _envelopeProgramId;
    address private _alignedManagerContract;

    constructor(
        bytes32 thumbnailProgramId,
        bytes32 envelopeProgramId
    ) //  , address alignedManagerContract
    {
        _thumbnailProgramId = thumbnailProgramId;
        _envelopeProgramId = envelopeProgramId;
        // _alignedManagerContract = alignedManagerContract;
        _alignedManagerContract = 0x58F280BeBE9B34c9939C3C39e0890C81f163B623;
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

    function checkProofVerification(
        bytes32 proofCommitment,
        bytes32 pubInputCommitment,
        bytes32 provingSystemAuxDataCommitment,
        bytes20 proofGeneratorAddr,
        bytes32 batchMerkleRoot,
        bytes memory merkleProof,
        uint256 verificationDataBatchIndex
    ) public view returns (bool) {
        (bool callWasSuccessfull, bytes memory proofIsIncluded) = _alignedManagerContract.staticcall(
            abi.encodeWithSignature(
                "verifyBatchInclusion(bytes32,bytes32,bytes32,bytes20,bytes32,bytes,uint256)",
                proofCommitment,
                pubInputCommitment,
                provingSystemAuxDataCommitment,
                proofGeneratorAddr,
                batchMerkleRoot,
                merkleProof,
                verificationDataBatchIndex
            )
        );
        require(callWasSuccessfull, "alignedManager static call failed");

        return abi.decode(proofIsIncluded, (bool));
    }

    function innerCreateMarketItem(
        bytes memory imageHash,
        bytes memory thumbnailHash,
        bytes memory manifestCID,
        uint256 price
    ) internal {
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

    function createMarketItem(
        bytes memory imageHash,
        bytes memory thumbnailHash,
        bytes memory manifestCID,
        uint256 price,
        // verification data
        bytes32 proofCommitment,
        bytes32 pubInputCommitment,
        bytes32 provingSystemAuxDataCommitment,
        bytes20 proofGeneratorAddr,
        bytes32 batchMerkleRoot,
        bytes memory merkleProof,
        uint256 verificationDataBatchIndex
    ) public payable nonReentrant {
        require(price > 0, "Price must greater than 0");

        // require(_thumbnailProgramId == provingSystemAuxDataCommitment, "Image ID does not match");

        require(checkProofVerification(
            proofCommitment,
            pubInputCommitment,
            provingSystemAuxDataCommitment,
            proofGeneratorAddr,
            batchMerkleRoot,
            merkleProof,
            verificationDataBatchIndex
        ), "alignedManager says proof is not included");

        // NOTE
        //
        // We need to check that proofCommitment == keccak256(seal | journal)
        // where journal is the public output of the Risc0 envelope program.
        // It must be equal to [imageHash | publicKey | blobCommitment]
        //
        // It is currently not feasible to do this check onchain because seal size
        // is very large.

        innerCreateMarketItem(imageHash, thumbnailHash, manifestCID, price);
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

    function deliverMarketItem(
        uint256 itemId,
        bytes memory publicKey,
        // verification data
        bytes32 proofCommitment,
        bytes32 pubInputCommitment,
        bytes32 provingSystemAuxDataCommitment,
        bytes20 proofGeneratorAddr,
        bytes32 batchMerkleRoot,
        bytes memory merkleProof,
        uint256 verificationDataBatchIndex
    ) public nonReentrant() {
        require(idToMarketItem[itemId].status == ItemStatus.InEscrow);

        // bytes32 publicKeyHash = keccak256(publicKey);
        // address addr = address(uint160(uint256(publicKeyHash)));
        // require(idToMarketItem[itemId].buyer == addr);

        //require(_envelopeProgramId == provingSystemAuxDataCommitment, "Image ID does not match");

        require(checkProofVerification(
            proofCommitment,
            pubInputCommitment,
            provingSystemAuxDataCommitment,
            proofGeneratorAddr,
            batchMerkleRoot,
            merkleProof,
            verificationDataBatchIndex
        ), "alignedManager says proof is not included");

        // NOTE
        //
        // We need to check that proofCommitment == keccak256(seal | journal)
        // where journal is the public output of the Risc0 envelope program.
        // It must be equal to [imageHash | publicKey | blobCommitment]
        //
        // It is currently not feasible to do this check onchain because seal size
        // is very large.

        // TODO: verify that blob was included in Celestia block
        
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

    function fetchItem(uint256 itemId) public view returns (MarketItem memory) {
        return idToMarketItem[itemId];
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
