# Send Blob via Light Node

---

## Install Light Node

Follow instructions and install all dependencies, celestia-node and start light node:

1. https://docs.celestia.org/nodes/environment
2. https://docs.celestia.org/nodes/celestia-node
3. https://docs.celestia.org/developers/node-tutorial - Run Light Node on Arabica network.

---

## Prepare Tools for Sending Blob:


Generate API Key for RPC requests:

```
export CELESTIA_NODE_AUTH_TOKEN=$(celestia light auth admin --p2p.network arabica)                                     
```

---

## Send Blob

```
base64 file_with_blob > base64_blob
export BLOB_BASE64=$(cat base64_blob)
export NAMESPACE="AAAAAAAAAAAAAAAAAAAAAAAAAAECAwQFBgcICRA="
// calculate $COMMITMENT

curl -H "Content-Type: application/json" -H "Authorization: Bearer $CELESTIA_NODE_AUTH_TOKEN" -X POST --data '{"id": 1
  "jsonrpc": "2.0",
  "method": "blob.Submit",
  "params": [
    [
      {
        "namespace": $NAMESPACE,
        "data": $BLOB_BASE64,
        "share_version": 0,
        "commitment": $COMMITMENT
      }
    ],
    0.1
  ]
}' 127.0.0.1:26658

```

Result:
```

```


## Get Proof for Blob

```
{
  "id": 1,
  "jsonrpc": "2.0",
  "method": "blob.GetProof",
  "params": [
    42,
    $NAMESPACE,
    $COMMITMENT
  ]
}
```

