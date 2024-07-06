aligned-topup:
	aligned deposit-to-batcher \
		--batcher_addr 0x815aeCA64a974297942D2Bbf034ABEe22a38A003 \
		--rpc https://ethereum-holesky-rpc.publicnode.com \
		--chain holesky \
		--keystore_path ~/.aligned_keystore/keystore0 \
		--amount 0.02ether

aligned-submit:
	RUST_LOG=trace aligned submit \
		--proving_system Risc0 \
		--proof ./programs/target/aligned/receipt \
		--vm_program ./programs/target/aligned/image_id \
		--aligned_verification_data_path ~/.aligned/aligned_verification_data \
		--keystore_path ~/.aligned_keystore/keystore0 \
		--conn wss://batcher.alignedlayer.com