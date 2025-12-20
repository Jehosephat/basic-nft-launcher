curl -X 'POST' \
  'https://gateway-testnet.galachain.com/api/testnet01/gc-a9b8b472b035c0510508c248d1110d3162b7e5f4-GalaChainToken/GrantNftCollectionAuthorization' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "authorizedUser": "string", <--signing user
  "collection": "string",
  "dtoExpiresAt": 0,
  "uniqueKey": "string"
}'

curl -X 'POST' \
  'https://gateway-testnet.galachain.com/api/testnet01/gc-a9b8b472b035c0510508c248d1110d3162b7e5f4-GalaChainToken/CreateNftCollection' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "additionalKey": "string",
  "authorities": [
    "string"
  ],
  "category": "string",
  "collection": "string", <--selected collection authorized by the user
  "contractAddress": "string",
  "description": "string",
  "dtoExpiresAt": 0,
  "image": "string",
  "maxCapacity": "string",
  "maxSupply": "string",
  "metadataAddress": "string",
  "name": "string",
  "rarity": "string",
  "symbol": "string",
  "type": "string",
  "uniqueKey": "string"
}'

curl -X 'POST' \
  'https://gateway-testnet.galachain.com/api/testnet01/gc-a9b8b472b035c0510508c248d1110d3162b7e5f4-GalaChainToken/FetchNftCollectionAuthorizationsWithPagination' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "bookmark": "string",
  "dtoExpiresAt": 0,
  "limit": 0
}'

curl -X 'POST' \
  'https://gateway-testnet.galachain.com/api/testnet01/gc-a9b8b472b035c0510508c248d1110d3162b7e5f4-GalaChainToken/FetchTokenClassesWithSupply' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "tokenClasses": [
    {
      "additionalKey": "string",
      "category": "string",
      "collection": "string",
      "dtoExpiresAt": 0,
      "type": "string"
    }
  ]
}'

curl -X 'POST' \
  'https://gateway-testnet.galachain.com/api/testnet01/gc-a9b8b472b035c0510508c248d1110d3162b7e5f4-GalaChainToken/MintTokenWithAllowance' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "dtoExpiresAt": 0,
  "owner": "string",
  "quantity": "string",
  "tokenClass": {
    "additionalKey": "string",
    "category": "string",
    "collection": "string",
    "dtoExpiresAt": 0,
    "type": "string"
  },
  "tokenInstance": "string",
  "uniqueKey": "string"
}'

curl -X 'POST' \
  'https://gateway-testnet.galachain.com/api/testnet01/gc-a9b8b472b035c0510508c248d1110d3162b7e5f4-GalaChainToken/FetchBalances' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "owner": "string"
}'

DryRun should be used with GrantNftCollectionAuthorization, CreateNFTCollection, and MintWithAllowance to see what the fee will be
the dto field should be the unsigned dto that would be submitted in each case and the method the endpoint name (e.g. GrantNftCollectionAuthorization)
curl -X 'POST' \
  'https://gateway-testnet.galachain.com/api/testnet01/gc-a9b8b472b035c0510508c248d1110d3162b7e5f4-GalaChainToken/DryRun' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "dto": "string",
  "dtoExpiresAt": 0,
  "method": "string"
}'