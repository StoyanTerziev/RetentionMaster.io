<?php
declare(strict_types=1);

$baseUrl = getenv('RM_BASE_URL') ?: 'https://retentionmaster.io/api/v1';
$appId = getenv('RM_APP_ID') ?: '';
$appSecret = getenv('RM_APP_SECRET') ?: '';

if ($appId === '' || $appSecret === '') {
  fwrite(STDERR, "Set RM_APP_ID and RM_APP_SECRET\n");
  exit(1);
}

function rm_get(string $baseUrl, string $appId, string $appSecret, string $path): array {
  $ch = curl_init(rtrim($baseUrl, '/') . $path);
  curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
      'Accept: application/json',
      'Authorization: Bearer ' . $appId . '.' . $appSecret,
    ],
  ]);
  $raw = curl_exec($ch);
  $status = (int)curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
  curl_close($ch);

  $json = json_decode((string)$raw, true);
  if ($status < 200 || $status >= 300 || !is_array($json) || ($json['ok'] ?? true) === false) {
    throw new RuntimeException('RetentionMaster API request failed: ' . (string)$raw);
  }
  return $json;
}

print_r(rm_get($baseUrl, $appId, $appSecret, '/me'));
print_r(rm_get($baseUrl, $appId, $appSecret, '/leads?period=last7&limit=25'));
print_r(rm_get($baseUrl, $appId, $appSecret, '/summary?period=mtd'));
