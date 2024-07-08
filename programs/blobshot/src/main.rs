use std::fs::{create_dir_all, File};
use std::io::Write;
use std::path::PathBuf;

use celestia_types::nmt::NamespacedHashExt;
use celestia_types::hash::Hash;
use celestia_types::Commitment;
use celestia_types::{nmt::Namespace, Blob, ExtendedHeader};
use nmt_rs::simple_merkle::db::MemDb;
use nmt_rs::simple_merkle::tree::MerkleTree;
use nmt_rs::TmSha2Hasher;

use blobshot_methods::{BLOB_ELF, BLOB_ID};
use risc0_zkvm::{default_prover, ExecutorEnv};

const NAMESPACE: &[u8] = &[1, 2, 3, 4, 5];

fn main() {
    // Initialize tracing. In order to view logs, run `RUST_LOG=info cargo run`
    tracing_subscriber::fmt()
        .with_env_filter(tracing_subscriber::filter::EnvFilter::from_default_env())
        .init();

    let my_namespace = Namespace::new_v0(NAMESPACE).expect("Invalid namespace");

    // Load header -------------------------

    let header_bytes = include_bytes!("../tests/header.dat");
    let dah = ExtendedHeader::decode_and_validate(header_bytes).expect("Invalid header");

    let eds_row_roots = &dah.dah.row_roots();
    let eds_column_roots = &dah.dah.column_roots();
    let data_tree_leaves: Vec<_> = eds_row_roots
        .iter()
        .chain(eds_column_roots.iter())
        .map(|root| root.to_array())
        .collect();

    // "Data root" is the merkle root of the EDS row and column roots
    let hasher = TmSha2Hasher {}; // Tendermint Sha2 hasher
    let mut tree: MerkleTree<MemDb<[u8; 32]>, TmSha2Hasher> = MerkleTree::with_hasher(hasher);
    for leaf in data_tree_leaves {
        tree.push_raw_leaf(&leaf);
    }
    // Ensure that the data root is the merkle root of the EDS row and column roots
    assert_eq!(dah.dah.hash(), Hash::Sha256(tree.root()));

    // extended data square (EDS) size
    let eds_size = eds_row_roots.len();
    // original data square (ODS) size
    let ods_size = eds_size / 2;
    
    // Load shares proofs -------------------

    let proofs_str = include_str!("../tests/proofs.json");
    // NMT range proofs, from leaves into row roots.
    let proofs: Vec<celestia_types::nmt::NamespaceProof> =
        serde_json::from_str(proofs_str).unwrap();

    let proofs_val: serde_json::Value = serde_json::from_str(proofs_str).unwrap();
    let index = proofs_val.get(0).unwrap().get("start").unwrap().as_u64().unwrap();

    // Load blob ----------------------------

    let blob_bytes = include_bytes!("../tests/blob.dat");
    let mut blob = Blob::new(my_namespace, blob_bytes.to_vec()).unwrap();

    blob.index = Some(index);
    
    let shares = blob.to_shares().expect("Failed to split blob to shares");
    let share_values: Vec<[u8; 512]> = shares.iter().map(|share| share.data).collect();

    let blob_index: usize = blob.index.unwrap().try_into().unwrap();
    let blob_size: usize = blob.data.len() / 512;
    let first_row_index: usize = blob_index / ods_size;
    let last_row_index: usize = first_row_index + (blob_size / ods_size);

    // Calculate blob commitment
    let blob_commitment = Commitment::from_blob(my_namespace, 0, blob_bytes)
        .expect("Failed to create commitment");

    println!("BLOB COMMITMENT: {}", base64::encode(blob_commitment.0));

    // For each row spanned by the blob, you should have one NMT range proof into a row root.
    assert_eq!(proofs.len(), last_row_index + 1 - first_row_index);

    let rp = tree.build_range_proof(first_row_index..last_row_index);

    // Write to stdin -----------------------

    let mut env = ExecutorEnv::builder();

    env.write_slice(dah.dah.hash().as_bytes());

    // write "num rows" spanned by the blob
    env.write(&(last_row_index as u32 - first_row_index as u32)).unwrap();
    // write num shares
    env.write(&(share_values.len() as u32)).unwrap();
    // write namespace;
    env.write(&my_namespace).unwrap();
    // write the range proof
    env.write(&rp).unwrap();
    
    // write the row roots
    for row_root in eds_row_roots[first_row_index..last_row_index].iter() {
        env.write(&row_root).unwrap();
    }
    // write the shares
    for share in share_values {
        env.write_slice(&share);
    }

    // write the proofs {
    for proof in proofs {
        env.write(&proof).unwrap();
    }

    // Generate proof --------------------------

    let env = env
        .build()
        .unwrap();

    let prover = default_prover();
    let prove_info = prover.prove(env, BLOB_ELF).unwrap();

    // Check that everything is OK
    prove_info.receipt.verify(BLOB_ID).expect("failed to verify");

    let mode = if std::env::var_os("RISC0_DEV_MODE").is_some_and(|x| x == "1") {
        "dev"
    } else {
        "prod"
    };
    let output_dir: PathBuf = [env!("CARGO_MANIFEST_DIR"), "..", "target", mode, "envelope"]
        .iter()
        .collect();
    create_dir_all(output_dir.as_path()).unwrap();

    let receipt_bytes = bincode::serialize(&prove_info.receipt).unwrap();
    let mut receipt_file = File::create(output_dir.join("receipt")).unwrap();
    receipt_file.write_all(&receipt_bytes).unwrap();

    let image_id_bytes = convert_image_id(&BLOB_ID);
    let mut image_id_file = File::create(output_dir.join("image_id")).unwrap();
    image_id_file.write_all(&image_id_bytes).unwrap();
}

pub fn convert_image_id(data: &[u32; 8]) -> [u8; 32] {
    let mut res = [0; 32];
    for i in 0..8 {
        res[4 * i..4 * (i + 1)].copy_from_slice(&data[i].to_le_bytes());
    }
    res
}
