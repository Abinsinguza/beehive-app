<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreBeekeeperRequest;
use App\Http\Requests\UpdateBeekeeperRequest;
use App\Models\User;
use App\Models\Beehive;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Session;
use Illuminate\Support\Str;
use Inertia\Inertia;

class BeekeeperController extends Controller
{
    public function index()
    {
        $beekeepers = User::whereIn('role', ['farmer', 'farmer_revoked', 'farmer_pending'])
            ->withCount('beehives')
            ->latest('created_at')
            ->get();

        return Inertia::render('beekeepers', [
            'beekeepers' => $beekeepers,
        ]);
    }

    public function create()
    {
        //
    }

    public function store(StoreBeekeeperRequest $request)
    {
        $validated = $request->validated();

        User::create([
            'full_name' => $validated['full_name'],
            'email'     => $validated['email'] ?? null,
            'phone'     => $validated['phone'],
            'address'   => $validated['address'] ?? null,
            'password_hash' => bcrypt($validated['password']),
            'role'      => 'farmer',
            'server_url' => $validated['server_url'],
            'api_key'   => $validated['api_key'],
        ]);

        return redirect()->back()->with('success', 'Beekeeper added successfully.');
    }

    public function show(User $beekeeper)
    {
        $beekeeper->loadCount('beehives');
        $beekeeper->load(['beehives' => function ($query) {
            $query->latest('created_at');
        }]);

        return Inertia::render('beekeeper-show', [
            'beekeeper' => $beekeeper,
        ]);
    }

    public function edit()
    {
        //
    }

    public function generateApiKey(Request $request)
    {
        $request->validate(['client_name' => ['required', 'string', 'max:150']]);

        if (!Session::get('ml_admin_key')) {
            return redirect()->back()->with('error', 'Please configure ML Server settings first to enable token generation.');
        }

        return redirect()->back()->with('generated_api_key', (string) Str::uuid());
    }

    public function regenerateApiKey(User $beekeeper)
    {
        return $this->assignToken($beekeeper);
    }

    public function storeHive(Request $request, User $beekeeper)
    {
        $validated = $request->validate([
            'hive_name'         => ['required', 'string', 'max:100'],
            'hive_location'     => ['required', 'string', 'max:150'],
            'hive_type'         => ['required', 'string', 'max:50'],
            'installation_date' => ['required', 'date'],
            'latitude'          => ['nullable', 'numeric', 'between:-90,90'],
            'longitude'         => ['nullable', 'numeric', 'between:-180,180'],
        ]);

        // Create the hive locally first
        $beehive = Beehive::create([
            'owner_id'          => $beekeeper->id,
            'hive_name'         => $validated['hive_name'],
            'hive_location'     => $validated['hive_location'],
            'hive_type'         => $validated['hive_type'],
            'installation_date' => $validated['installation_date'],
            'latitude'          => $validated['latitude'] ?? null,
            'longitude'         => $validated['longitude'] ?? null,
            'current_state'     => 'unknown',
            'is_deleted'        => false,
        ]);

        // Try to create the recordings folder on the ML server
        $folderCreated = false;
        $errorMessage = null;
        $apiKey = $beekeeper->api_key;
        $mlServerUrl = Session::get('ml_server_url') ?? config('services.ml_auth.base_url');

        if ($apiKey) {
            try {
                $response = Http::withHeaders(['x-api-key' => $apiKey])
                    ->timeout(15)
                    ->post(rtrim($mlServerUrl, '/') . "/recordings/hives/{$beehive->hive_name}");

                if ($response->successful()) {
                    $folderCreated = true;
                } else {
                    $errorMessage = $response->json('detail.0.msg') ?? 'Failed to create recordings folder.';
                }
            } catch (ConnectionException $e) {
                $errorMessage = 'The ML server did not respond in time. It may be down — please try again shortly.';
            }
        } else {
            $errorMessage = "This beekeeper has no API key configured.";
        }

        if (!$folderCreated) {
            return redirect()->back()->with('success', "Hive added successfully, but {$errorMessage} You can try again later from the hive details page.");
        }

        return redirect()->back()->with('success', 'Hive added successfully and recordings folder created.');
    }

    public function update(UpdateBeekeeperRequest $request, User $beekeeper)
    {
        $validated = $request->validated();

        $data = [
            'full_name' => $validated['full_name'],
            'email'     => $validated['email'] ?? null,
            'phone'     => $validated['phone'],
            'address'   => $validated['address'] ?? null,
        ];

        if (!empty($validated['password'])) {
            $data['password_hash'] = bcrypt($validated['password']);
        }

        $beekeeper->update($data);

        return redirect()->back()->with('success', 'Beekeeper updated successfully');
    }

    public function destroy(User $beekeeper)
    {
        $beekeeper->delete();

        return redirect()->back()->with('success', 'Beekeeper deleted successfully');
    }

    public function revoke(User $beekeeper)
    {
        $beekeeper->update(['role' => 'farmer_revoked']);

        return redirect()->back()->with('success', 'Beekeeper access revoked.');
    }

    public function restore(User $beekeeper)
    {
        $beekeeper->update(['role' => 'farmer']);

        return redirect()->back()->with('success', 'Beekeeper access restored.');
    }

    public function fetchAdminKeys()
    {
        $apiUrl = 'http://196.43.168.57:8085/bsads-api-db/admin/keys';

        try {
            // Use the Authorization Bearer token from your curl example
            $authToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0OTI0ODM3OS0wOTU1LTQ4NzEtODZjNS0yNmU0YzIwNjQyNDMiLCJleHAiOjE3ODI2Nzc0MTl9.z03W6yPIk-xl_rRJTiE0FehOREVLkz8KZZf72bFIfVA';

            $response = Http::withHeaders([
                'accept' => 'application/json',
                'Authorization' => 'Bearer ' . $authToken,
            ])
                ->timeout(15)
                ->get($apiUrl);

            if ($response->successful()) {
                return response()->json($response->json());
            }

            return response()->json(['error' => 'Failed to fetch admin keys'], 500);
        } catch (ConnectionException $e) {
            return response()->json(['error' => 'Connection failed'], 500);
        }
    }

    public function assignToken(Request $request, User $beekeeper)
    {
        $request->validate([
            'server_url' => ['required', 'string'],
            'admin_key' => ['required', 'string'],
        ]);

        $mlServerUrl = $request->server_url;
        $mlAdminKey = $request->admin_key;

        try {
            $response = Http::withToken($accessToken)
                ->timeout(15)
                ->post("{$baseUrl}/users/{$beekeeper->user_id}/assign-token", [
                    'admin_key'  => $adminKey,
                    'server_url' => $beekeeper->server_url,
                ]);
        } catch (ConnectionException $e) {
            return redirect()->back()->with('error', 'The ML server did not respond in time. It may be down — please try again shortly.');
        }

        if (!$response->successful()) {
            $detail = $response->json('detail.0.msg') ?? $response->body() ?? 'no response body';

            return redirect()->back()->with('error', "Failed to assign token (HTTP {$response->status()}): {$detail}");
        }

        $responseData = $response->json();
        $apiKey = $responseData['api_key'] ?? $response->body();
        $beekeeper->update([
            'server_url' => $response->json('server_url'),
            'api_key'    => $response->json('api_key'),
        ]);

        return redirect()->back()->with('success', 'API token assigned to beekeeper successfully.');
    }
}
