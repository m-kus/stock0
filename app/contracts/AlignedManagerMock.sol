// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

contract AlignedManagerMock  {
    function verifyBatchInclusion(
        bytes32 proofCommitment,
        bytes32 pubInputCommitment,
        bytes32 provingSystemAuxDataCommitment,
        bytes20 proofGeneratorAddr,
        bytes32 batchMerkleRoot,
        bytes memory merkleProof,
        uint256 verificationDataBatchIndex
    ) external view returns (bool) {
        return true;
    }
}
