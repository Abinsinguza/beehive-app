<?php

namespace App\Http\Controllers;

use App\Models\SystemSetting;
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
            'sms_server_url' => SystemSetting::get('sms_server_url', 'https://comms-test.pahappa.net/api/v1/json/'),
            'sms_username'   => SystemSetting::get('sms_username'),
            'sms_api_key'    => SystemSetting::get('sms_api_key'),
            'sms_sender_id'  => SystemSetting::get('sms_sender_id', 'BeeHive'),
            'sms_template'   => SystemSetting::get('sms_template',
                "🐝 BEEHIVE ALERT [#alertType]\nHive: #beeHive @ #hiveLocation\nBeekeeper: #beekeeper\nPrediction: #prediction (#confidence)\nMessage: #alertMessage\nTime: #timestamp"
            ),
            'ml_server_name' => null,
            'ml_server_url'  => Session::get('ml_server_url'),
            'ml_admin_key'   => Session::get('ml_admin_key'),
            'ml_description' => null,
            'ml_is_active'   => true,
            'ml_admin_key_id' => Session::get('ml_admin_key_id'),
        ];

        // If we have ML server URL and admin key ID, try to retrieve the admin key
        if (!empty($settings['ml_server_url']) && !empty($settings['ml_admin_key_id']) && !empty($settings['ml_admin_key'])) {
            try {
                $response = Http::withHeaders(['x-admin-key' => $settings['ml_admin_key']])
                    ->timeout(15)
                    ->get(rtrim($settings['ml_server_url'], '/') . '/admin/keys/' . $settings['ml_admin_key_id']);
                
                if ($response->successful()) {
                    $adminKeyData = $response->json();
                    if (isset($adminKeyData['server_name'])) {
                        $settings['ml_server_name'] = $adminKeyData['server_name'];
                    }
                    if (isset($adminKeyData['description'])) {
                        $settings['ml_description'] = $adminKeyData['description'];
                    }
                    if (isset($adminKeyData['is_active'])) {
                        $settings['ml_is_active'] = $adminKeyData['is_active'];
                    }
                    if (isset($adminKeyData['server_url'])) {
                        $settings['ml_server_url'] = $adminKeyData['server_url'];
                    }
                    if (isset($adminKeyData['admin_key'])) {
                        $settings['ml_admin_key'] = $adminKeyData['admin_key'];
                    }
                }
            } catch (ConnectionException $e) {
                // Don't block loading settings if ML server is down
            }
        }

        return Inertia::render('system-config', [
            'settings' => $settings,
        ]);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'sms_server_url' => ['required', 'url'],
            'sms_username'   => ['required', 'string', 'max:255'],
            'sms_api_key'    => ['required', 'string', 'max:255'],
            'sms_sender_id'  => ['required', 'string', 'max:50'],
            'sms_template'   => ['required', 'string'],
            'ml_server_name' => ['nullable', 'string', 'max:255'],
            'ml_server_url'  => ['nullable', 'url'],
            'ml_admin_key'   => ['nullable', 'string', 'max:255'],
            'ml_description' => ['nullable', 'string'],
            'ml_is_active'   => ['nullable', 'boolean'],
            'ml_admin_key_id' => ['nullable', 'string', 'max:255'],
        ]);

        // Save SMS config locally
        $smsConfig = [
            'sms_server_url', 'sms_username', 'sms_api_key', 'sms_sender_id', 'sms_template'
        ];
        foreach ($smsConfig as $key) {
            SystemSetting::set($key, $validated[$key]);
        }

        // Store ML server details temporarily in session
        if (!empty($validated['ml_server_url'])) {
            Session::put('ml_server_url', $validated['ml_server_url']);
        }
        if (!empty($validated['ml_admin_key_id'])) {
            Session::put('ml_admin_key_id', $validated['ml_admin_key_id']);
        }

        // If ML server URL and admin key are present, try to call POST /admin/keys
        if (!empty($validated['ml_server_url']) && !empty($validated['ml_admin_key'])) {
            try {
                $response = Http::timeout(15)
                    ->post(rtrim($validated['ml_server_url'], '/') . '/admin/keys', [
                        'server_name' => $validated['ml_server_name'] ?? '',
                        'server_url'  => $validated['ml_server_url'],
                        'admin_key'   => $validated['ml_admin_key'],
                        'description' => $validated['ml_description'] ?? '',
                        'is_active'   => $validated['ml_is_active'] ?? true,
                    ]);
                
                if ($response->successful()) {
                    $responseData = $response->json();
                    // Store the admin key ID in session if returned from ML server
                    if (isset($responseData['admin_key_id'])) {
                        Session::put('ml_admin_key_id', $responseData['admin_key_id']);
                    } elseif (isset($responseData['id'])) {
                        Session::put('ml_admin_key_id', $responseData['id']);
                    }
                    Session::put('ml_admin_key', $validated['ml_admin_key']);
                }
            } catch (ConnectionException $e) {
                return redirect()->back()->with('error', 'Failed to connect to ML server.');
            }
        }

        return redirect()->route('system-config')->with('success', 'Settings saved.');
    }
}
