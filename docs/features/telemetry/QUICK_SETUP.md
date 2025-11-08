# Quick Reference: Azure Application Insights Setup

## Connection String Format

```
InstrumentationKey=12345678-1234-1234-1234-123456789012;IngestionEndpoint=https://westus2-2.in.applicationinsights.azure.com/;LiveEndpoint=https://westus2.livediagnostics.monitor.azure.com/
```

## Get Your Connection String (5 Minutes)

### Step 1: Create Azure Account
- Visit: https://azure.microsoft.com/free/
- Sign up (free, $200 credit included)
- No credit card required for free services

### Step 2: Create Application Insights
1. Go to: https://portal.azure.com
2. Click: **"Create a resource"**
3. Search: **"Application Insights"**
4. Click: **"Create"**

### Step 3: Configure Resource
- **Name**: `linear-buddy-telemetry` (or your choice)
- **Region**: Choose closest to your location
- **Resource Group**: Create new → `linear-buddy-rg`
- Click: **"Review + create"** → **"Create"**

### Step 4: Get Connection String
1. Once deployed, click **"Go to resource"**
2. In the **Overview** tab, find **"Connection String"**
3. Click the copy icon
4. Done! 🎉

## Where to Use It

### For Local Development

Create `.env` file:
```bash
VSCODE_TELEMETRY_CONNECTION_STRING=your-connection-string-here
```

### For Production

Add to `package.json`:
```json
{
  "telemetryConnectionString": "your-connection-string-here"
}
```

## Verify It's Working

### Option 1: Live Metrics
1. Azure Portal → Your Application Insights → Live Metrics
2. Run your extension (F5)
3. Trigger some events
4. See them appear in Live Metrics in real-time! 🔴 LIVE

### Option 2: Debug Logs
1. Enable: `linearBuddy.debugMode` in settings
2. Open: Output panel → "Linear Buddy"
3. Look for: "Telemetry event sent: ..."

## Free Tier Limits

✅ **5 GB/month** data ingestion  
✅ **90 days** retention  
✅ **Unlimited** events  
✅ **$0** cost for typical extension usage

## Regions

Choose closest to you for best performance:
- **US**: `eastus`, `westus2`, `centralus`
- **Europe**: `westeurope`, `northeurope`
- **Asia**: `southeastasia`, `eastasia`
- **Australia**: `australiaeast`

## Security Note

**Is the connection string secret?**
No, it's designed to be public. It's an *ingestion* key, not an *access* key.

- ✅ OK to commit to public repo
- ✅ OK to include in published extension
- ✅ Rate-limited by Azure
- ❌ Can't read data with just this key
- ❌ Can't delete data with just this key

**Only you** can view the data in Azure Portal (requires authentication).

## Cost Example

Typical VSCode extension with 10,000 active users:
- Events: ~500,000/month
- Data: ~150 MB/month
- Cost: **$0** (well within free tier)

Even with 100,000 users:
- Events: ~5,000,000/month
- Data: ~1.5 GB/month
- Cost: **$0** (still free!)

## Next Steps

1. ✅ Get your connection string (steps above)
2. ✅ Add to `.env` or `package.json`
3. ✅ Run `npm install @vscode/extension-telemetry`
4. ✅ Test with F5 (Extension Development Host)
5. ✅ Check Live Metrics in Azure Portal

## Help

- 📖 Full guide: `docs/features/telemetry/SETUP_GUIDE.md`
- 💬 Questions: angelo.girardi@onebrief.com

---

Happy tracking! 📊

