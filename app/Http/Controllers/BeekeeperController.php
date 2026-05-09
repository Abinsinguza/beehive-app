<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class BeekeeperController extends Controller
{
    public function index()
    {
        $search      = request('search', '');
        $beekeepers  = $this->api()->getUsers('farmer');

        if ($search) {
            $s = strtolower($search);
            $beekeepers = array_values(array_filter($beekeepers, fn ($b) =>
                str_contains(strtolower($b['full_name'] ?? ''), $s) ||
                str_contains(strtolower($b['email']     ?? ''), $s) ||
                str_contains(strtolower($b['phone']     ?? ''), $s)
            ));
        }

        return Inertia::render('beekeepers', [
            'beekeepers' => $beekeepers,
            'search'     => $search,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'    => ['required', 'string', 'max:100'],
            'email'   => ['required', 'email'],
            'phone'   => ['nullable', 'string'],
            'address' => ['nullable', 'string'],
            'password'=> ['required', 'string', 'min:8'],
        ]);

        $this->api()->createUser([
            'full_name' => $data['name'],
            'email'     => $data['email'],
            'password'  => $data['password'],
            'phone'     => $data['phone']    ?? null,
            'address'   => $data['address']  ?? null,
            'role'      => 'farmer',
        ]);

        return redirect()->back()->with('success', 'Beekeeper added successfully');
    }

    public function update(Request $request, string $userId)
    {
        $data = $request->validate([
            'name'    => ['required', 'string', 'max:100'],
            'phone'   => ['nullable', 'string'],
            'address' => ['nullable', 'string'],
        ]);

        $this->api()->updateUser($userId, [
            'full_name' => $data['name'],
            'phone'     => $data['phone']   ?? null,
            'address'   => $data['address'] ?? null,
        ]);

        return redirect()->back()->with('success', 'Beekeeper updated successfully');
    }

    public function destroy(string $userId)
    {
        $this->api()->deleteUser($userId);

        return redirect()->back()->with('success', 'Beekeeper deleted successfully');
    }
}
