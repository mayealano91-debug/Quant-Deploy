{
  "name": "Workspace",
  "type": "object",
  "properties": {
    "name": {
      "type": "string"
    },
    "type": {
      "type": "string",
      "enum": [
        "research",
        "trading",
        "portfolio",
        "quant",
        "news",
        "ai",
        "risk"
      ],
      "default": "research"
    },
    "layout": {
      "type": "object",
      "description": "Panel layout configuration"
    },
    "is_default": {
      "type": "boolean",
      "default": false
    }
  },
  "required": [
    "name",
    "type"
  ]
}