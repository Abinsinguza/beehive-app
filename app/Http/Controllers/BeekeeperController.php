<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreBeekeeperRequest;
use App\Http\Requests\UpdateBeekeeperRequest;
use App\Models\User;
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
            })->get();

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
        User::create([
            'full_name'     => $request->validated('full_name'),
            'email'         => $request->validated('email'),
            'phone'         => $request->validated('phone'),
            'password_hash' => bcrypt($request->validated('password')),
            'address'       => $request->validated('address'),
            'role'          => 'farmer',
        ]);

        return redirect()->back()->with('success', 'Beekeeper added successfully');
    }

    public function show()
    {
        //
    }

    public function edit()
    {
        //
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
}
