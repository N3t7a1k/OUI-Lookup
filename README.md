# OUI Lookup API

## Overview

The OUI Lookup Web Service is a RESTful API that allows users to search for Organizationally Unique Identifier (OUI) information using HTTP or HTTPS protocols. An OUI is a 24-bit number that uniquely identifies a vendor or manufacturer's network interface card (NIC).

## Features

- **OUI Information Retrieval:** Users can query the service to retrieve information about a specific OUI.
- **Company Name Lookup:** Users can search for OUI information by providing the name of a company.

## API Endpoints

### Retrieve OUI Information by OUI

#### Request

```http
GET /{OUI, MAC Address, or Company Name}
```

#### Response

- Response with no OUI information
```json
{
  "count": 0,
  "info": "There's no OUI information starting with given MAC address"
}
```
- Response with OUI information
```json
{
  "count": 843,
  "data": [
    {
      "Unnamed: 0": 240,
      "Registry": "MA-L",
      "Assignment": "0000F0",
      "Organization Name": "Samsung Electronics Co.,Ltd",
      "Organization Address": "416, MAETAN-3DONG, PALDAL-GU kwon  KR 442-742 "
    },
    ...
  ]
}
```

## Getting Started

To use the OUI Lookup Web Service, follow these steps:
1. Access the Service: Make HTTP or HTTPS requests to the appropriate endpoint.
2. Retrieve OUI Information by OUI or Company Name: Use the provided endpoint to get information about a specific OUI.

### Environment Configurations
The project root directory contains a .env file with the following configuration:
```
ALLOWED_CORS_DOMAINS=oui.n3t7a1k.io
```

## Example Usage

```bash
# Retrieve OUI Information by OUI
curl -X GET https://ouiapi.n3t7a1k.io/001A2B

# Retrieve OUI Information by Company Name
curl -X GET http://ouiapi.n3t7a1k.io/Example%20Corporation
```
