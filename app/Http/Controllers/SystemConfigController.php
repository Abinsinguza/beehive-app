<?php

namespace App\Http\Controllers;

use App\Models\SystemSetting;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SystemConfigController extends Controller
{
    public function index()
    {
        return Inertia::render('system-config', [
            'settings' => [
                'sms_server_url' => SystemSetting::get('sms_server_url', 'https://comms-test.pahappa.net/api/v1/json/'),
                'sms_username'   => SystemSetting::get('sms_username'),
                'sms_api_key'    => SystemSetting::get('sms_api_key'),
                'sms_sender_id'  => SystemSetting::get('sms_sender_id', 'BeeHive'),
                'sms_template'   => SystemSetting::get('sms_template',
                    "🐝 BEEHIVE ALERT [#alertType]\nHive: #beeHive @ #hiveLocation\nBeekeeper: #beekeeper\nPrediction: #prediction (#confidence)\nMessage: #alertMessage\nTime: #timestamp"
                ),
            ],
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
        ]);

        foreach ($validated as $key => $value) {
            SystemSetting::set($key, $value);
        }

        return redirect()->route('system-config')->with('success', 'Settings saved.');
    }
}
