<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreAdvisoryRequest;
use App\Http\Requests\UpdateAdvisoryRequest;
use App\Models\Advisory;
use Inertia\Inertia;
class AdvisoryController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        //
        $advisorys = Advisory::all();
        return Inertia::render('advisories', [
            'advisories' => $advisorys,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
        return view('advisories.create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreAdvisoryRequest $request)
    {
        //
        Advisory::create([
            'prediction_code' => $request->prediction_code,
            'condition_label' => $request->condition_label,
            'advisory_text' => $request->advisory_text,
            'severity' => $request->severity,
        ]);

        return redirect()->back()
            ->with('success', 'Advisory added successfully');
    }

    /**
     * Display the specified resource.
     */
    public function show(Advisory $advisory)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Advisory $advisory)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateAdvisoryRequest $request, Advisory $advisory)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Advisory $advisory)
    {
        //
    }
}
