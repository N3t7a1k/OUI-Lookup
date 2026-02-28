# OUI Lookup API

## Overview

A RESTful API for looking up OUI (Organizationally Unique Identifier) information by MAC address prefix or manufacturer name. Data is sourced from the IEEE OUI registry and refreshed every 12 hours.

## Endpoints

### `GET /oui`

Search for OUI records by MAC address or manufacturer name.

**Query Parameters**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `q` | string | Yes | MAC address prefix (e.g. `001A2B`, `00:1A:2B:CC`) or manufacturer name |
| `page` | integer | No | Page number (default: `1`) |
| `limit` | integer | No | Results per page (default: `10`) |

**Response**

```json
{
  "meta": {
    "total": 3,
    "page": 1,
    "limit": 10,
    "type": "MAC"
  },
  "data": [
    {
      "Assignment": "001A2B",
      "Organization Name": "Cisco Systems, Inc",
      "Organization Address": "80 West Tasman Drive San Jose CA US 94568"
    }
  ]
}
```

`type` is `"MAC"` when searching by MAC/OUI prefix, `"ORG"` when searching by manufacturer name.

**Status Codes**

| Code | Description |
|---|---|
| `200` | Success |
| `400` | Missing `q` parameter |
| `404` | No results found |
| `500` | Internal server error |
| `503` | Database is initializing |

---

### `GET /status`

Returns the current state of the OUI database.

**Response**

```json
{
  "ready": true,
  "updated_at": "2024-01-15T10:30:00",
  "next_update_at": "2024-01-15T22:30:00",
  "record_count": 38420
}
```

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `HOST` | Bind host | `0.0.0.0` |
| `PORT` | Bind port | `5000` |
| `WORKERS` | Number of Gunicorn workers | `4` |
| `CORS_DOMAINS` | Allowed CORS domains (comma-separated, `*` for all) | `*` |

## Example Usage

```bash
# Lookup by OUI prefix
curl https://ouiapi.nettalk.io/oui?q=001A2B

# Lookup by MAC address
curl https://ouiapi.nettalk.io/oui?q=00:1A:2B:CC:DD:EE

# Lookup by manufacturer name
curl https://ouiapi.nettalk.io/oui?q=Samsung

# Paginated results
curl https://ouiapi.nettalk.io/oui?q=Intel&page=2&limit=20

# Check database status
curl https://ouiapi.nettalk.io/status
```
