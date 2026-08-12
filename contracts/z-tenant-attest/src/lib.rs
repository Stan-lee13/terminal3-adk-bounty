//! z-tenant-attest v0.1.0 — Agent Attestation Registry.
//!
//! A minimal TEE contract demonstrating Terminal3's KV-store capability
//! without external HTTP dependencies. Agents can register attestation
//! claims (DID -> capability + signature), verify them, and list all
//! registered attestations.
//!
//! This contract proves that the T3N platform can serve as a verifiable
//! identity registry for autonomous AI agents — a foundational primitive
//! for agent-to-agent trust on Solana.

#![warn(clippy::style, missing_debug_implementations)]
#![cfg_attr(not(target_arch = "wasm32"), allow(dead_code))]

extern crate alloc;

pub const CONTRACT_VERSION: &str = "0.1.0";

wit_bindgen::generate!({
    world: "tenant-attest",
    path: "wit",
    additional_derives: [
        serde::Deserialize,
        serde::Serialize,
    ],
    generate_all,
});

mod registry;

struct Component;

#[cfg(target_arch = "wasm32")]
impl exports::z::tenant_attest::contracts::Guest for Component {
    fn register(
        req: exports::z::tenant_attest::contracts::GenericInput,
    ) -> Result<alloc::vec::Vec<u8>, alloc::string::String> {
        let input = req.input.ok_or("register: missing input")?;
        registry::register(&input)
    }

    fn verify(
        req: exports::z::tenant_attest::contracts::GenericInput,
    ) -> Result<alloc::vec::Vec<u8>, alloc::string::String> {
        let input = req.input.ok_or("verify: missing input")?;
        registry::verify(&input)
    }

    fn list(
        req: exports::z::tenant_attest::contracts::GenericInput,
    ) -> Result<alloc::vec::Vec<u8>, alloc::string::String> {
        let input = req.input.unwrap_or_default();
        registry::list(&input)
    }
}

#[cfg(target_arch = "wasm32")]
export!(Component);

#[cfg(test)]
mod tests {
    use super::CONTRACT_VERSION;

    #[test]
    fn contract_version_is_semver() {
        let parts: Vec<&str> = CONTRACT_VERSION.split('.').collect();
        assert_eq!(parts.len(), 3);
        for part in parts {
            assert!(part.parse::<u32>().is_ok());
        }
    }
}
