<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreBeekeeperRequest;
use App\Http\Requests\UpdateBeekeeperRequest;
use App\Models\Beekeeper;
use Inertia\Inertia;

class BeekeeperController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $search = request('search', '');

        $beekeepers = Beekeeper::withCount('beehives')
            ->when($search, function ($query, $search) {
                $query->where('name', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%")
                      ->orWhere('phone', 'like', "%{$search}%");
            })->get();

        return Inertia::render('beekeepers', [
            'beekeepers' => $beekeepers,
            'search'     => $search,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return view('beekeepers.create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreBeekeeperRequest $request)
    {
        // Get last beekeeper
        $last = Beekeeper::orderBy('id', 'desc')->first();

        if ($last) {
            $number = (int) substr($last->id, 2); // remove BK
            $number++;
        } else {
            $number = 1;
        }

        $newId = 'BK' . str_pad($number, 4, '0', STR_PAD_LEFT);

        Beekeeper::create([
            'id' => $newId,
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'address' => $request->address,
        ]);

        return redirect()->back()
            ->with('success', 'Beekeeper added successfully');
    }

    /**
     * Display the specified resource.
     */
    public function show(Beekeeper $beekeeper)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Beekeeper $beekeeper)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateBeekeeperRequest $request, Beekeeper $beekeeper)
    {
        $data = $request->validate([
            'name'     => 'required|string|max:255',
            'phone'    => 'required|string|unique:beekeepers,phone,' . $beekeeper->id,
            'email'    => 'nullable|email',
            'address'  => 'nullable|string',
            'password' => 'nullable|min:4',
        ]);

        if (!empty($data['password'])) {
            $data['password'] = bcrypt($data['password']);
        } else {
            unset($data['password']);
        }

        $beekeeper->update($data);

        return redirect()->back()->with('success', 'User updated successfully');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Beekeeper $beekeeper)
    {
        $beekeeper->delete();

        return redirect()->back()->with('success', 'User deleted successfully');
    }

    /**
     * Revoke (soft-deactivate) a beekeeper without deleting.
     */
    public function revoke(Beekeeper $beekeeper)
    {
        $beekeeper->update(['status' => 'revoked']);

        return redirect()->back()->with('success', 'Beekeeper access revoked.');
    }

    /**
     * Restore a previously revoked beekeeper.
     */
    public function restore(Beekeeper $beekeeper)
    {
        $beekeeper->update(['status' => 'active']);

        return redirect()->back()->with('success', 'Beekeeper access restored.');
    }
}
