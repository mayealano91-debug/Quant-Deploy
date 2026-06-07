{
  "name": "Portfolio",
  "type": "object",
  "properties": {
    "name": {
      "type": "string"
    },
    "holdings": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "symbol": {
            "type": "string"
          },
          "shares": {
            "type": "number"
          },
          "avg_cost": {
            "type": "number"
          },
          "asset_class": {
            "type": "string"
          }
        }
      }
    },
    "cash_balance": {
      "type": "number",
      "default": 0
    },
    "currency": {
      "type": "string",
      "default": "USD"
    }
  },
  "required": [
    "name"
  ]
}