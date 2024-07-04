use std::{fs::{create_dir_all, File}, io::Write, path::PathBuf};

use methods::{PREVIEW_ELF, PREVIEW_ID};
use risc0_zkvm::{default_prover, ExecutorEnv, Receipt};

fn main() {
    tracing_subscriber::fmt()
        .with_env_filter(tracing_subscriber::filter::EnvFilter::from_default_env())
        .init();

    let image_bytes = vec![0u8; 100];
    let env = ExecutorEnv::builder()
        .write_slice(&image_bytes)
        .build()
        .unwrap();

    let prover = default_prover();
    let prove_info = prover.prove(env, PREVIEW_ELF).unwrap();

    save_receipt(prove_info.receipt);
}

fn save_receipt(receipt: Receipt) {
    let output_dir: PathBuf = [env!("CARGO_MANIFEST_DIR"), "..", "target", "aligned"].iter().collect();
    create_dir_all(output_dir.as_path()).unwrap();
    
    let receipt_bytes = bincode::serialize(&receipt).unwrap();
    let mut receipt_file = File::create(output_dir.join("receipt")).unwrap();
    receipt_file.write_all(&receipt_bytes).unwrap();
    
    let image_id_bytes = PREVIEW_ID.map(|limb| limb.to_be_bytes()).concat();
    let mut image_id_file = File::create(output_dir.join("image_id")).unwrap();
    image_id_file.write_all(&image_id_bytes).unwrap();
}
