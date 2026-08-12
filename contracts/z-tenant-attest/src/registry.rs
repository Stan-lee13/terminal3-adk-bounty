//! Agent Attestation Registry — core logic.
//!
//! Uses only the KV-store host interface. No HTTP, no external API keys.
//! All attestations are stored in the `z:<tid>:attestations` map.

use alloc::format;
use alloc::string::{String, ToString};
use alloc::vec::Vec;

#[derive(serde::Deserialize, serde::Serialize)]
pub struct RegisterReq {
    pub agent_did: String,
    pub capability: String,
    pub issued_at: u64,
    pub signature: String,
}

#[derive(serde::Deserialize, serde::Serialize)]
pub struct VerifyReq {
    pub agent_did: String,
}

#[derive(serde::Deserialize, serde::Serialize)]
pub struct Attestation {
    pub agent_did: String,
    pub capability: String,
    pub issued_at: u64,
    pub signature: String,
}

#[derive(serde::Serialize)]
pub struct RegisterResp {
    pub status: String,
    pub key: String,
}

#[derive(serde::Serialize)]
pub struct VerifyResp {
    pub agent_did: String,
    pub capability: String,
    pub issued_at: u64,
    pub signature: String,
}

#[derive(serde::Serialize)]
pub struct ListResp {
    pub attestations: Vec<Attestation>,
    pub count: usize,
}

#[cfg(target_arch = "wasm32")]
use crate::host::{
    interfaces::{kv_store, logging},
    tenant::tenant_context,
};

/// Build the full canonical map name from the tenant context.
#[cfg(target_arch = "wasm32")]
fn map_name() -> Result<String, String> {
    let tid_bytes = tenant_context::tenant_did();
    // The tenant_did() returns the raw DID bytes. We need the hex-encoded
    // tenant ID portion (after "did:t3n:") to build z:<tid>:<map>.
    // The SDK's z-namespace uses the hex encoding of the 20-byte CompactDid.
    let tid_hex = hex_encode(&tid_bytes);
    Ok(format!("z:{}:attestations", tid_hex))
}

#[cfg(target_arch = "wasm32")]
fn hex_encode(bytes: &[u8]) -> String {
    let mut s = String::with_capacity(bytes.len() * 2);
    for b in bytes {
        s.push_str(&format!("{:02x}", b));
    }
    s
}

/// Validate an agent DID. Must start with "did:" and be non-empty.
fn validate_did(did: &str) -> Result<(), String> {
    if did.is_empty() {
        return Err("agent_did must not be empty".to_string());
    }
    if !did.starts_with("did:") {
        return Err(format!("agent_did must be a W3C DID (got: {})", &did[..did.len().min(20)]));
    }
    if did.len() > 128 {
        return Err("agent_did exceeds 128 characters".to_string());
    }
    Ok(())
}

/// Validate a capability string. Must be non-empty and reasonable length.
fn validate_capability(cap: &str) -> Result<(), String> {
    if cap.is_empty() {
        return Err("capability must not be empty".to_string());
    }
    if cap.len() > 256 {
        return Err("capability exceeds 256 characters".to_string());
    }
    Ok(())
}

pub fn register(input: &[u8]) -> Result<Vec<u8>, String> {
    let req: RegisterReq = serde_json::from_slice(input)
        .map_err(|e| format!("register: bad input: {e}"))?;

    validate_did(&req.agent_did)?;
    validate_capability(&req.capability)?;

    if req.signature.is_empty() {
        return Err("register: signature must not be empty".to_string());
    }

    #[cfg(target_arch = "wasm32")]
    {
        let map = map_name()?;
        let key = req.agent_did.as_bytes();
        let attestation = Attestation {
            agent_did: req.agent_did.clone(),
            capability: req.capability.clone(),
            issued_at: req.issued_at,
            signature: req.signature.clone(),
        };
        let value = serde_json::to_vec(&attestation)
            .map_err(|e| format!("register: serialization failed: {e}"))?;

        kv_store::put(&map, key, &value)
            .map_err(|e| format!("register: kv put failed: {e}"))?;

        let _ = logging::info(&format!(
            "attestation registered for agent {} with capability {}",
            &req.agent_did[..req.agent_did.len().min(20)],
            &req.capability[..req.capability.len().min(30)]
        ));

        let resp = RegisterResp {
            status: "registered".to_string(),
            key: req.agent_did,
        };
        serde_json::to_vec(&resp).map_err(|e| format!("register: response serialization: {e}"))
    }

    #[cfg(not(target_arch = "wasm32"))]
    {
        let _ = req;
        Err("register is only implemented on the wasm32 target".to_string())
    }
}

pub fn verify(input: &[u8]) -> Result<Vec<u8>, String> {
    let req: VerifyReq = serde_json::from_slice(input)
        .map_err(|e| format!("verify: bad input: {e}"))?;

    validate_did(&req.agent_did)?;

    #[cfg(target_arch = "wasm32")]
    {
        let map = map_name()?;
        let key = req.agent_did.as_bytes();

        match kv_store::get(&map, key)
            .map_err(|e| format!("verify: kv get failed: {e}"))?
        {
            Some(value) => {
                let attestation: Attestation = serde_json::from_slice(&value)
                    .map_err(|e| format!("verify: deserialization failed: {e}"))?;

                let _ = logging::info(&format!(
                    "attestation verified for agent {}",
                    &req.agent_did[..req.agent_did.len().min(20)]
                ));

                serde_json::to_vec(&attestation)
                    .map_err(|e| format!("verify: response serialization: {e}"))
            }
            None => {
                Err(format!("verify: no attestation found for agent {}", req.agent_did))
            }
        }
    }

    #[cfg(not(target_arch = "wasm32"))]
    {
        let _ = req;
        Err("verify is only implemented on the wasm32 target".to_string())
    }
}

pub fn list(_input: &[u8]) -> Result<Vec<u8>, String> {
    #[cfg(target_arch = "wasm32")]
    {
        let map = map_name()?;

        // Scan the attestations map. We use a limit of 50 to keep the response small.
        let scan_result = kv_store::scan(&map, &[], &[], 50)
            .map_err(|e| format!("list: kv scan failed: {e}"))?;

        let mut attestations: Vec<Attestation> = Vec::new();
        for (key, value) in &scan_result {
            if let Ok(att) = serde_json::from_slice::<Attestation>(value) {
                attestations.push(att);
            } else {
                let _ = logging::info(&format!(
                    "list: skipping unparseable entry (key len={})",
                    key.len()
                ));
            }
        }

        let _ = logging::info(&format!("list: returned {} attestations", attestations.len()));

        let count = attestations.len();
        let resp = ListResp {
            attestations,
            count,
        };
        serde_json::to_vec(&resp).map_err(|e| format!("list: response serialization: {e}"))
    }

    #[cfg(not(target_arch = "wasm32"))]
    {
        Err("list is only implemented on the wasm32 target".to_string())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn register_rejects_empty_did() {
        let input = serde_json::to_vec(&serde_json::json!({
            "agent_did": "",
            "capability": "swap",
            "issued_at": 1700000000,
            "signature": "0xabc"
        })).unwrap();
        let err = register(&input).unwrap_err();
        assert!(err.contains("agent_did must not be empty"));
    }

    #[test]
    fn register_rejects_non_did() {
        let input = serde_json::to_vec(&serde_json::json!({
            "agent_did": "not-a-did",
            "capability": "swap",
            "issued_at": 1700000000,
            "signature": "0xabc"
        })).unwrap();
        let err = register(&input).unwrap_err();
        assert!(err.contains("W3C DID"));
    }

    #[test]
    fn register_rejects_empty_signature() {
        let input = serde_json::to_vec(&serde_json::json!({
            "agent_did": "did:t3n:abc123",
            "capability": "swap",
            "issued_at": 1700000000,
            "signature": ""
        })).unwrap();
        let err = register(&input).unwrap_err();
        assert!(err.contains("signature"));
    }

    #[test]
    fn register_rejects_bad_json() {
        let err = register(b"not json").unwrap_err();
        assert!(err.contains("bad input"));
    }

    #[test]
    fn verify_rejects_empty_did() {
        let input = serde_json::to_vec(&serde_json::json!({
            "agent_did": ""
        })).unwrap();
        let err = verify(&input).unwrap_err();
        assert!(err.contains("agent_did must not be empty"));
    }

    #[test]
    fn validate_capability_rejects_empty() {
        assert!(validate_capability("").is_err());
    }

    #[test]
    fn validate_capability_rejects_too_long() {
        let long = "x".repeat(257);
        assert!(validate_capability(&long).is_err());
    }

    #[test]
    fn validate_did_rejects_too_long() {
        let long = format!("did:t3n:{}", "x".repeat(130));
        assert!(validate_did(&long).is_err());
    }
}
