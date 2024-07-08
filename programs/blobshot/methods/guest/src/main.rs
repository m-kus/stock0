use celestia_types::nmt::{MerkleHash, Namespace, NamespaceProof, NamespacedHashExt};
use nmt_rs::{simple_merkle::proof::Proof, NamespacedHash, TmSha2Hasher};
use risc0_zkvm::guest::env;


fn main() {
    // read the data root
    let mut data_root = [0u8; 32];
    env::read_slice(&mut data_root);
    // read num rows
    let num_rows: u32 = env::read();
    // read blob size
    let blob_size: u32 = env::read();
    // read namespace ID
    let namespace: Namespace = env::read();
    // read the row-inclusion range proof
    let range_proof: Proof<TmSha2Hasher> = env::read();
    // read the row roots
    let mut row_roots = vec![];
    for _ in 0..num_rows {
        row_roots.push(env::read::<NamespacedHash<29>>());
    }
    // read each share of the blob
    let mut shares = vec![];
    for _ in 0..blob_size {
        // apparently it's read_vec now
        //let mut share: Vec<u8 512 = sp1_zkvm::io::read_vec();
        let mut share = [0u8; 512];
        env::read_slice(&mut share);
        shares.push(share);
    }
    // for each row spanned by the blob, we have a NMT range proof
    let mut proofs = vec![];
    for _ in 0..num_rows {
        let proof = env::read::<NamespaceProof>();
        proofs.push(proof);
    }

    // We have one NMT range proof for each row spanned by the blob
    // Verify that the blob's shares go into the respective row roots
    let mut start = 0;
    for i in 0..num_rows {
        let proof = &proofs[i as usize];
        let root = &row_roots[i as usize];
        let end = start + (proof.end_idx() as usize - proof.start_idx() as usize);
        let result = proof.verify_range(root, &shares[start..end], namespace.into());
        if result.is_err() {
            env::commit(&false);
            return;
        }
        start = end;
    }

    // Verify the row-inclusion range proof
    let tm_hasher = TmSha2Hasher {};
    let blob_row_root_hashes: Vec<[u8; 32]> = row_roots
        .iter()
        .map(|root| tm_hasher.hash_leaf(&root.to_array()))
        .collect();

    let result = range_proof.verify_range(
        &data_root
            .try_into()
            .expect("we already checked, this should be fine"),
        &blob_row_root_hashes,
    );
    if result.is_err() {
        println!("range proof failed :(");
        println!("{:?}", result);
        env::commit(&false);
        return;
    }
    env::commit(&true);
}
