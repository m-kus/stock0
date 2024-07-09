.PHONY: thumbnail envelope blobshot delivery

thumbnail:
	RUST_LOG="[executor]=info" RISC0_DEV_MODE=1 cargo run --bin thumbnail

thumbnail-proof:
	cargo run --bin thumbnail

envelope:
	RUST_LOG="[executor]=info" RISC0_DEV_MODE=1 cargo run --bin envelope

envelope-proof:
	cargo run --bin envelope

blobshot:
	RUST_LOG="[executor]=info" RISC0_DEV_MODE=1 cargo run --bin blobshot

blobshot-proof:
	cargo run --bin blobshot

delivery:
	RUST_LOG="[executor]=info" RISC0_DEV_MODE=1 cargo run --bin delivery

delivery-proof:
	cargo run --bin delivery

aligned-topup:
	aligned deposit-to-batcher \
		--batcher_addr 0x815aeCA64a974297942D2Bbf034ABEe22a38A003 \
		--rpc https://ethereum-holesky-rpc.publicnode.com \
		--chain holesky \
		--keystore_path ~/.aligned_keystore/keystore0 \
		--amount 0.02ether

aligned-submit-thumbnail:
	RUST_LOG=trace aligned submit \
		--proving_system Risc0 \
		--proof ./target/prod/thumbnail/receipt \
		--vm_program ./target/prod/thumbnail/image_id \
		--aligned_verification_data_path ~/.aligned/aligned_verification_data \
		--keystore_path ~/.aligned_keystore/keystore0 \
		--conn wss://batcher.alignedlayer.com

aligned-submit-envelope:
	RUST_LOG=trace aligned submit \
		--proving_system Risc0 \
		--proof ./target/prod/envelope/receipt \
		--vm_program ./target/prod/envelope/image_id \
		--aligned_verification_data_path ~/.aligned/aligned_verification_data \
		--keystore_path ~/.aligned_keystore/keystore0 \
		--conn wss://batcher.alignedlayer.com

aligned-submit-delivery:
	RUST_LOG=trace aligned submit \
		--proving_system Risc0 \
		--proof ./target/prod/delivery/receipt \
		--vm_program ./target/prod/delivery/image_id \
		--aligned_verification_data_path ~/.aligned/aligned_verification_data \
		--keystore_path ~/.aligned_keystore/keystore0 \
		--conn wss://batcher.alignedlayer.com

aligned-submit-blobshot:
	RUST_LOG=trace aligned submit \
		--proving_system Risc0 \
		--proof ./target/prod/blobshot/receipt \
		--vm_program ./target/prod/blobshot/image_id \
		--aligned_verification_data_path ~/.aligned/aligned_verification_data \
		--keystore_path ~/.aligned_keystore/keystore0 \
		--conn wss://batcher.alignedlayer.com

aligned-balance:
	aligned get-user-balance \
		--batcher_addr 0x815aeCA64a974297942D2Bbf034ABEe22a38A003 \
		--rpc https://ethereum-holesky-rpc.publicnode.com \
		--user_addr 