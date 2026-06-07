{
  "name": "Watchlist",
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "description": "Watchlist name"
    },
    "symbols": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "description": "Ticker symbols"
    },
    "type": {
      "type": "string",
      "enum": [
        "custom",
        "smart",
        "sector",
        "index"
      ],
      "default": "custom"
    },
    "tags": {
      "type": "array",
      "items": {
        "type": "string"
      }
    }
  },
  "required": [
    "name"
  ]
}