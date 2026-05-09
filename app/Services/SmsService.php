<?php

namespace App\Services;

use App\Models\SystemSetting;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SmsService
{
    public function send(string $phone, string $message): void
    {
        $url      = SystemSetting::get('sms_server_url', 'https://comms-test.pahappa.net/api/v1/json/');
        $username = SystemSetting::get('sms_username');
        $apiKey   = SystemSetting::get('sms_api_key');
        $senderId = SystemSetting::get('sms_sender_id', 'BeeHive');
        $number   = $this->normalisePhone($phone);

        $payload = [
            'method'   => 'SendSms',
            'userdata' => [
                'username' => $username,
                'password' => $apiKey,
            ],
            'msgdata'  => [
                [
                    'number'   => $number,
                    'message'  => $message,
                    'senderid' => $senderId,
                    'priority' => '0',
                ],
            ],
        ];

        $this->debug($url, $username, $apiKey, $number, $message, $payload);

        $response = Http::withOptions($this->curlOptions($url))
                    ->asJson()
                    ->post($url, $payload)
                    ->throw();

        $body = $response->json();

        Log::info('[SmsService] Response', ['status' => $response->status(), 'body' => $body]);

        if (($body['Status'] ?? '') !== 'OK') {
            throw new \RuntimeException(
                'API error: ' . ($body['Status'] ?? $response->body())
            );
        }
    }

    private function debug(
        string $url,
        string $username,
        string $apiKey,
        string $number,
        string $message,
        array  $payload,
    ): void {
        $masked = str_repeat('*', max(0, strlen($apiKey) - 4)) . substr($apiKey, -4);

        $lines = [
            '',
            '┌─────────────────────── SmsService DEBUG ───────────────────────┐',
            "│  URL      : {$url}",
            "│  Username : {$username}",
            "│  API Key  : {$masked}",
            "│  To       : {$number}",
            "│  Message  :",
            ...array_map(fn($l) => "│    {$l}", explode("\n", $message)),
            '│',
            '│  Full payload (JSON):',
            ...array_map(fn($l) => "│    {$l}", explode("\n", json_encode($payload, JSON_PRETTY_PRINT))),
            '└────────────────────────────────────────────────────────────────┘',
            '',
        ];

        error_log(implode("\n", $lines) . "\n");

        Log::debug('[SmsService] Outgoing SMS', [
            'url'      => $url,
            'username' => $username,
            'api_key'  => $masked,
            'to'       => $number,
            'message'  => $message,
            'payload'  => $payload,
        ]);
    }

    private function curlOptions(string $url): array
    {
        $host   = parse_url($url, PHP_URL_HOST);
        $scheme = parse_url($url, PHP_URL_SCHEME);
        $port   = $scheme === 'https' ? 443 : 80;
        $ip     = gethostbyname($host);

        $resolved = ($ip !== $host) ? ["{$host}:{$port}:{$ip}"] : [];

        $caBundle = file_exists('/home/micheal/anaconda3/ssl/cacert.pem')
            ? '/home/micheal/anaconda3/ssl/cacert.pem'
            : true;

        $options = [
            'verify'          => $caBundle,
            'connect_timeout' => 15,
            'timeout'         => 30,
            'curl'            => [CURLOPT_IPRESOLVE => CURL_IPRESOLVE_V4],
        ];

        if ($resolved) {
            $options['curl'][CURLOPT_RESOLVE] = $resolved;
        }

        return $options;
    }

    private function normalisePhone(string $phone): string
    {
        $digits = preg_replace('/\D/', '', $phone);

        if (str_starts_with($digits, '256')) {
            return $digits;
        }

        return '256' . ltrim($digits, '0');
    }
}
