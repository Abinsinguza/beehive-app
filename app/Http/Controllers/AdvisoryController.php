<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreAdvisoryRequest;
use App\Http\Requests\UpdateAdvisoryRequest;
use App\Models\AdvisoryTemplate;
use Inertia\Inertia;

class AdvisoryController extends Controller
{
    public function index()
    {
        return Inertia::render('advisories', [
            'advisories' => AdvisoryTemplate::orderBy('prediction_code')->get(),
        ]);
    }

    public function create()
    {
        //
    }

    public function store(StoreAdvisoryRequest $request)
    {
        AdvisoryTemplate::create($request->validated());

        return redirect()->back()->with('success', 'Advisory template added successfully');
    }

    public function show()
    {
        //
    }

    public function edit()
    {
        //
    }

    public function update(UpdateAdvisoryRequest $request, AdvisoryTemplate $advisory)
    {
        $advisory->update($request->validated());

        return redirect()->back()->with('success', 'Advisory template updated successfully');
    }

    public function destroy(AdvisoryTemplate $advisory)
    {
        $advisory->delete();

        return redirect()->back()->with('success', 'Advisory template deleted successfully');
    }
}
