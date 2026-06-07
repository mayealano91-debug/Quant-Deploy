{
  "name": "Alert",
  "type": "object",
  "properties": {
    "symbol": {
      "type": "string"
    },
    "type": {
      "type": "string",
      "enum": [
        "price",
        "news",
        "volatility",
        "earnings",
        "portfolio"
      ],
      "default": "price"
    },
    "condition": {
      "type": "string"
    },
    "threshold": {
      "type": "number"
    },
    "status": {
      "type": "string",
      "enum": [
        "active",
        "triggered",
        "expired"
      ],
      "default": "active"
    },
    "message": {
      "type": "string"
    }
  },
  "required": [
    "symbol",
    "type"
  ]
}