<?php

namespace App\Http\Controllers;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Session;
use Inertia\Inertia;

class SystemConfigController extends Controller
{
    public function index()
    {
        $settings = [
            'ml_server_name' => Session::get('ml_server_name'),
            'ml_server_url'  => Session::get('ml_server_url'),
            'ml_admin_key'   => Session::get('ml_admin_key'),
            'ml_description' => Session::get('ml_description'),
            'ml_is_active'   => Session::get('ml_is_active', true),
        ];

        return Inertia::render('system-config', [
            'settings' => $settings,
        ]);
    }

    public function updateMl(Request $request)
    {
        $token = $request->bearerToken();

        if (!$token || $token !== $request->user()->device_token) {
            return redirect()->back()->with('error', 'Unauthorized: missing or invalid bearer token.');
        }

        $validated = $request->validate([
            'ml_server_name' => ['nullable', 'string', 'max:255'],
            'ml_description' => ['nullable', 'string'],
            'ml_is_active'   => ['nullable', 'boolean'],
        ]);

        $baseUrl = rtrim((string) config('services.ml_auth.base_url'), '/');
        $apiBase = $baseUrl . '/bsads-api-db';
        $accessToken = Session::get('ml_access_token');

        if (!$baseUrl) {
            return redirect()->back()->with('error', 'ML_AUTH_BASE_URL is not configured.');
        }

        if (!$accessToken) {
            return redirect()->back()->with('error', 'Not logged into the ML server. Log out and back in with an account that also exists on the ML server.');
        }

        // The admin_key is a value we register with the ML server (not server-generated) —
        // always mint a fresh one since this submission creates a new admin key.
        $adminKeyValue = bin2hex(random_bytes(32));

        try {
            $response = Http::withToken($accessToken)
                ->timeout(15)
                ->post("{$apiBase}/admin/keys", [
                    'server_name' => $validated['ml_server_name'] ?? '',
                    'server_url'  => $baseUrl,
                    'admin_key'   => $adminKeyValue,
                    'description' => $validated['ml_description'] ?? '',
                    'is_active'   => $validated['ml_is_active'] ?? true,
                ]);
        } catch (ConnectionException $e) {
            return redirect()->back()->with('error', 'The ML server did not respond in time. It may be down — please try again shortly.');
        }

        if (!$response->successful()) {
            $detail = $response->json('detail.0.msg') ?? $response->body() ?? 'no response body';

            return redirect()->back()->with('error', "Failed to create admin key on the ML server (HTTP {$response->status()}): {$detail}");
        }

        // Retrieve the current admin keys so the admin can then generate/assign beekeeper tokens.
        try {
            $listResponse = Http::withToken($accessToken)->timeout(15)->get("{$apiBase}/admin/keys");
        } catch (ConnectionException $e) {
            return redirect()->back()->with('error', 'Admin key created, but failed to retrieve it back from the ML server.');
        }

        $keys = $listResponse->successful() ? ($listResponse->json() ?? []) : [];
        $latestKey = is_array($keys) ? ($keys[0] ?? null) : null;

        // Session is just a local cache of the ML server's response, not the source of truth.
        Session::put('ml_server_name', $validated['ml_server_name'] ?? null);
        Session::put('ml_server_url', $baseUrl);
        Session::put('ml_description', $validated['ml_description'] ?? null);
        Session::put('ml_is_active', $validated['ml_is_active'] ?? true);
        Session::put('ml_admin_key', $latestKey['admin_key'] ?? $latestKey['key'] ?? null);
        Session::put('ml_admin_key_id', $latestKey['admin_key_id'] ?? $latestKey['id'] ?? null);

        return redirect()->route('system-config')->with('success', 'Admin key created on the ML server.');
    }
}
