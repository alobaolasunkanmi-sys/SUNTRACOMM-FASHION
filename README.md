{
  "version": 2,
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "https://YOUR-PUBLIC-BACKEND-URL.run.app/api/$1"
    },
    {
      "source": "/(.*)",
      "destination": "https://fash-laund.ai.studio/$1"
    }
  ]
}
