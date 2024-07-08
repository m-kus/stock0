export function decodeVerificationData(dataStr) {
    const data = JSON.parse(dataStr);

    const verificationDataCommitment = data['verification_data_commitment'];
    
    const proofCommitment = new Uint8Array(verificationDataCommitment['proof_commitment']);
    const pubInputCommitment = new Uint8Array(verificationDataCommitment['pub_input_commitment']);
    const provingSystemAuxDataCommitment = new Uint8Array(verificationDataCommitment['proving_system_aux_data_commitment']);
    const proofGeneratorAddr = new Uint8Array(verificationDataCommitment['proof_generator_addr']);
    const batchMerkleRoot = new Uint8Array(data['batch_merkle_root']);
    
    const merklePathArr = data['batch_inclusion_proof']['merkle_path'];
        
    var merkleProofList = [];
    for (var i = 0; i < merklePathArr.length; i++) {
        merkleProofList.push(new Uint8Array(merklePathArr[i]));
    }

    let markleProoflength = 0;
    merkleProofList.forEach(item => {
        markleProoflength += item.length;
    });

    let merkleProof = new Uint8Array(markleProoflength);
    let offset = 0;
    merkleProofList.forEach(item => {
        merkleProof.set(item, offset);
        offset += item.length;
    });
    

    const index = data['index_in_batch'];

    return [proofCommitment, pubInputCommitment, provingSystemAuxDataCommitment, proofGeneratorAddr, batchMerkleRoot, merkleProof, index];
}
