use std::{fs::{create_dir_all, File}, io::Write, path::PathBuf};

use thumbnail_methods::{THUMBNAIL_GEN_ELF, THUMBNAIL_GEN_ID};
use risc0_zkvm::{default_prover, ExecutorEnv};

fn main() {
    tracing_subscriber::fmt()
        .with_env_filter(tracing_subscriber::filter::EnvFilter::from_default_env())
        .init();

    let image_bytes = include_bytes!("../tests/cat.tiff");
    let mut thumbnail_bytes = Vec::new();

    let env = ExecutorEnv::builder()
        .write_slice(image_bytes)
        .stdout(&mut thumbnail_bytes)
        .build()
        .unwrap();

    let prover = default_prover();
    let prove_info = prover.prove(env, THUMBNAIL_GEN_ELF).unwrap();

    let output_dir: PathBuf = [env!("CARGO_MANIFEST_DIR"), "..", "target", "aligned"].iter().collect();
    create_dir_all(output_dir.as_path()).unwrap();
    
    let receipt_bytes = bincode::serialize(&prove_info.receipt).unwrap();
    let mut receipt_file = File::create(output_dir.join("receipt")).unwrap();
    receipt_file.write_all(&receipt_bytes).unwrap();
    
    let image_id_bytes = THUMBNAIL_GEN_ID.map(|limb| limb.to_be_bytes()).concat();
    let mut image_id_file = File::create(output_dir.join("image_id")).unwrap();
    image_id_file.write_all(&image_id_bytes).unwrap();

    let mut thumb_file = File::create(output_dir.join("thumb.png")).unwrap();
    thumb_file.write_all(&thumbnail_bytes).unwrap();
}
