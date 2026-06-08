<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAlertsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'hive_id'            => ['sometimes', 'string', 'exists:hives,hive_id'],
            'inference_id'       => ['sometimes', 'string', 'exists:inference_results,inference_id'],
            'advisory_id'        => ['sometimes', 'nullable', 'string', 'exists:advisories,advisory_id'],
            'severity_level'     => ['sometimes', 'string', 'max:20'],
            'recommended_action' => ['sometimes', 'nullable', 'string'],
            'action_status'      => ['sometimes', 'string', 'max:20'],
            'alert_timestamp'    => ['sometimes', 'date'],
        ];
    }
}
