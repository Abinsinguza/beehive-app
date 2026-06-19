<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreBeekeeperRequest;
use App\Http\Requests\UpdateBeekeeperRequest;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Inertia\Inertia;

class BeekeeperController extends Controller
{
    public function index()
    {
        $search = request('search', '');

        $beekeepers = User::whereIn('role', ['farmer', 'farmer_revoked', 'farmer_pending'])
            ->withCount('beehives')
            ->when($search, function ($query, $search) {
                $query->where('full_name', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%")
                      ->orWhere('phone', 'like', "%{$search}%");
            })
            ->latest('created_at')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('beekeepers', [
            'beekeepers' => $beekeepers,
            'search'     => $search,
        ]);
    }

    public function create()
    {
        //
    }

    public function store(StoreBeekeeperRequest $request)
    {
        $validated = $request->validated();

        $response = Http::post(rtrim(config('services.ml_auth.base_url'), '/') . '/auth/register', [
            'full_name'  => $validated['name'],
            'email'      => $validated['email'],
            'password'   => $validated['password'],
            'phone'      => $validated['phone'],
            'address'    => $validated['address'] ?? null,
            'role'       => 'farmer',
            'server_url' => $validated['server_url'],
            'api_key'    => $validated['api_key'],
        ]);

        if (! $response->successful()) {
            return redirect()->back()->withErrors(['email' => $response->json('detail.0.msg') ?? 'Failed to register beekeeper on the ML server.']);
        }

        return redirect()->back()->with('success', 'Beekeeper added successfully');
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

    public function update(UpdateBeekeeperRequest $request, User $beekeeper)
    {
        $validated = $request->validated();

        $data = [
            'full_name' => $validated['name'],
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
}
