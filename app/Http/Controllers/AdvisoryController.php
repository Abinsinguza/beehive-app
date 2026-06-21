<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreAdvisoryRequest;
use App\Http\Requests\UpdateAdvisoryRequest;
use App\Models\Advisory;
use App\Models\AdvisoryAction;
use App\Models\AdvisoryTemplate;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AdvisoryController extends Controller
{
    public function index()
    {
        return Inertia::render('advisories', [
            'templates'  => AdvisoryTemplate::orderBy('prediction_code')->get(),
            'advisories' => Advisory::with('template:template_id,hive_state')
                                ->orderBy('template_id')
                                ->orderBy('action_order')
                                ->get(),
            'actions'    => AdvisoryAction::with('hive:hive_id,hive_name,hive_location')
                                ->latest('created_at')
                                ->get(),
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

    public function storeItem(Request $request)
    {
        $validated = $request->validate([
            'template_id'              => ['required', 'integer', 'exists:advisory_templates,template_id'],
            'action_title'             => ['required', 'string', 'max:100'],
            'action_description'      => ['required', 'string'],
            'priority_level'           => ['required', 'string', 'max:20'],
            'confidence_threshold_min' => ['required', 'numeric', 'min:0', 'max:1'],
            'confidence_threshold_max' => ['required', 'numeric', 'min:0', 'max:1', 'gte:confidence_threshold_min'],
            'action_order'             => ['required', 'integer', 'min:1'],
            'is_active'                => ['boolean'],
        ]);

        Advisory::create($validated);

        return redirect()->back()->with('success', 'Advisory added successfully');
    }

    public function updateItem(Request $request, Advisory $advisoryItem)
    {
        $validated = $request->validate([
            'template_id'              => ['sometimes', 'integer', 'exists:advisory_templates,template_id'],
            'action_title'             => ['sometimes', 'string', 'max:100'],
            'action_description'      => ['sometimes', 'string'],
            'priority_level'           => ['sometimes', 'string', 'max:20'],
            'confidence_threshold_min' => ['sometimes', 'numeric', 'min:0', 'max:1'],
            'confidence_threshold_max' => ['sometimes', 'numeric', 'min:0', 'max:1', 'gte:confidence_threshold_min'],
            'action_order'             => ['sometimes', 'integer', 'min:1'],
            'is_active'                => ['boolean'],
        ]);

        $advisoryItem->update($validated);

        return redirect()->back()->with('success', 'Advisory updated successfully');
    }

    public function destroyItem(Advisory $advisoryItem)
    {
        $advisoryItem->delete();

        return redirect()->back()->with('success', 'Advisory deleted successfully');
    }
}
