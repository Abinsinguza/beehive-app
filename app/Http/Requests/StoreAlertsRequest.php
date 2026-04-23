<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreAlertsRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'inference_id'    => ['required', 'integer', 'exists:inferences,id'],
            'advisory_id'     => ['required', 'integer', 'exists:advisories,id'],
            'alert_type'      => ['required', 'string', 'in:Info,Warning,Critical,Threat'],
            'alert_timestamp' => ['required', 'date'],
        ];
    }
}
