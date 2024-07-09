# C2PA guide

### Image signing

`./c2patool unsigned.jpeg -m input_manifest.json -o signed.jpeg`

### Show detailed output manifest

`./c2patool signed.jpeg --detailed`

You can find the output manifest example in [output_manifest.json](output_manifest.json)

### Notice

Ps256.pem is taken from https://github.com/contentauth/c2patool/tree/main/sample