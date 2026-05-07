const baseUrl = process.env.RM_BASE_URL || "https://retentionmaster.io/api/v1";
const appId = process.env.RM_APP_ID;
const appSecret = process.env.RM_APP_SECRET;

if (!appId || !appSecret) {
  throw new Error("Set RM_APP_ID and RM_APP_SECRET");
}

async function rmGet(path) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: {
      Authorization: `Bearer ${appId}.${appSecret}`,
      Accept: "application/json",
    },
  });

  const payload = await response.json();
  if (!response.ok || payload.ok === false) {
    throw new Error(payload.error || `RetentionMaster API failed: ${response.status}`);
  }
  return payload;
}

(async () => {
  console.log(await rmGet("/me"));
  console.log(await rmGet("/events?period=last7&limit=25"));
  console.log(await rmGet("/leads?period=last7&limit=25"));
})();
